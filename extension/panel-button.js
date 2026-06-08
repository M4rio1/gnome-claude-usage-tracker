import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import St from 'gi://St';
import Clutter from 'gi://Clutter';
import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import GObject from 'gi://GObject';

const REFRESH_INTERVAL = 30000; // 30 seconds

// GJS does not support awaiting Gio's async DBusProxy.call directly; it must
// be promisified to pair with its call_finish counterpart first.
Gio._promisify(Gio.DBusProxy.prototype, 'call', 'call_finish');

export const ClaudeIndicator = GObject.registerClass(
class ClaudeIndicator extends PanelMenu.Button {
    constructor(extension) {
        super(0.0, 'Claude Usage Tracker');

        this._extension = extension;
        this._usageData = null;
        this._settings = extension.getSettings('org.gnome.shell.extensions.claude-usage');

        // Main container
        this._hbox = new St.BoxLayout({
            style_class: 'panel-status-menu-box',
            style: 'spacing: 6px;',
            reactive: true,
            track_hover: true
        });

        this.add_child(this._hbox);

        // Claude icon
        this._icon = new St.Icon({
            gicon: Gio.icon_new_for_string(`${extension.path}/icons/claude-symbolic.svg`),
            style_class: 'system-status-icon',
            icon_size: 16
        });
        this._hbox.add_child(this._icon);

        // Status label
        this._label = new St.Label({
            text: 'Claude: --',
            y_align: Clutter.ActorAlign.CENTER,
            style_class: 'claude-label'
        });
        this._hbox.add_child(this._label);

        // Build menu
        this._buildMenu();

        // Settings changed
        this._settings.connect('changed', (settings, key) => this._onSettingsChanged(key));

        // Start refresh timer
        this._startRefreshTimer();
    }

    _buildMenu() {
        // Usage info items
        this._sessionItem = new PopupMenu.PopupMenuItem(
            'Session: -- | Weekly: --',
            {reactive: false}
        );
        this.menu.addMenuItem(this._sessionItem);

        this._resetTimeItem = new PopupMenu.PopupMenuItem(
            'Next reset: --',
            {reactive: false}
        );
        this.menu.addMenuItem(this._resetTimeItem);

        // Separator
        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        // Settings button
        let settingsItem = new PopupMenu.PopupImageMenuItem(
            'Preferences',
            'preferences-system-symbolic'
        );
        settingsItem.connect('activate', () => {
            this._openPreferences();
        });
        this.menu.addMenuItem(settingsItem);

        // Refresh button
        let refreshItem = new PopupMenu.PopupImageMenuItem(
            'Refresh',
            'view-refresh-symbolic'
        );
        refreshItem.connect('activate', () => {
            this._refreshUsage();
        });
        this.menu.addMenuItem(refreshItem);
    }

    _updateUI(usage) {
        if (!usage) {
            this._label.set_text('Claude: Error');
            this._icon.set_style_class_name('system-status-icon error');
            return;
        }

        // The Claude API returns utilization already as a percentage (e.g. 35.0), not a fraction
        const sessionPct = Math.round(usage.five_hour?.utilization ?? 0);
        const weeklyPct = Math.round(usage.seven_day?.utilization ?? 0);

        this._label.set_text(`Session: ${sessionPct}% | Weekly: ${weeklyPct}%`);
        this._sessionItem.label.set_text(`Session: ${sessionPct}% | Weekly: ${weeklyPct}%`);

        // Update icon color based on usage
        this._updateIconColor(sessionPct);

        // Update reset times
        if (usage.five_hour?.resets_at) {
            const resetTime = new Date(usage.five_hour.resets_at);
            this._resetTimeItem.label.set_text(`Session resets: ${resetTime.toLocaleTimeString()}`);
        }

        this._usageData = usage;
    }

    _updateIconColor(sessionPct) {
        let colorClass = 'claude-safe';
        if (sessionPct > 80) {
            colorClass = 'claude-critical';
        } else if (sessionPct > 50) {
            colorClass = 'claude-moderate';
        }
        this._icon.set_style_class_name(`system-status-icon ${colorClass}`);
    }

    async _refreshUsage() {
        try {
            this._label.set_text('Claude: Loading...');

            // Call D-Bus service
            const usage = await this._callDaemon('GetUsageData');
            if (usage && usage.error) {
                this._label.set_text(`Claude: ${usage.error}`);
            } else if (usage) {
                this._updateUI(usage);
            } else {
                this._label.set_text('Claude: No data');
            }
        } catch (e) {
            console.error('Error fetching usage:', e.message);
            this._label.set_text('Claude: Error');
        }
    }

    async _getDaemonProxy() {
        if (this._proxy)
            return this._proxy;

        this._proxy = await new Promise((resolve, reject) => {
            Gio.DBusProxy.new(
                Gio.DBus.session,
                Gio.DBusProxyFlags.NONE,
                null,
                'org.gnome.ClaudeUsage',
                '/org/gnome/ClaudeUsage',
                'org.gnome.ClaudeUsage',
                null,
                (proxy, res) => {
                    try {
                        resolve(Gio.DBusProxy.new_finish(res));
                    } catch (e) {
                        reject(e);
                    }
                }
            );
        });

        return this._proxy;
    }

    async _callDaemon(method) {
        try {
            const proxy = await this._getDaemonProxy();
            if (!proxy.g_name_owner)
                throw new Error('daemon is not running');

            const result = await proxy.call(method, null, Gio.DBusCallFlags.NONE, -1, null);
            const [json] = result.deep_unpack();
            return JSON.parse(json);
        } catch (e) {
            console.error(`D-Bus call to ${method} failed: ${e.message}`);
            return null;
        }
    }

    _openPreferences() {
        this._extension.openPreferences();
    }

    async _syncSessionKey() {
        const key = this._settings.get_string('session-key');
        if (!key)
            return;

        try {
            const proxy = await this._getDaemonProxy();
            if (!proxy.g_name_owner)
                return;

            await proxy.call(
                'SetSessionKey',
                new GLib.Variant('(s)', [key]),
                Gio.DBusCallFlags.NONE, -1, null
            );
        } catch (e) {
            console.error(`Failed to sync session key with daemon: ${e.message}`);
        }
    }

    _onSettingsChanged(key) {
        if (key === 'session-key')
            this._syncSessionKey();

        this._refreshUsage();
    }

    _startRefreshTimer() {
        // Push the configured session key to the daemon, then refresh
        this._syncSessionKey();
        this._refreshUsage();

        // Set up timer
        this._refreshTimeout = GLib.timeout_add(
            GLib.PRIORITY_DEFAULT,
            REFRESH_INTERVAL,
            () => {
                this._refreshUsage();
                return GLib.SOURCE_CONTINUE;
            }
        );
    }

    destroy() {
        if (this._refreshTimeout) {
            GLib.source_remove(this._refreshTimeout);
        }
        super.destroy();
    }
});
