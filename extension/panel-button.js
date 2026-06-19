import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import St from 'gi://St';
import Clutter from 'gi://Clutter';
import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import GObject from 'gi://GObject';

// GJS does not support awaiting Gio's async DBusProxy.call directly; it must
// be promisified to pair with its call_finish counterpart first.
Gio._promisify(Gio.DBusProxy.prototype, 'call', 'call_finish');

const ProgressTrackWidth = 220;

const UsageMenuItem = GObject.registerClass(
class UsageMenuItem extends PopupMenu.PopupBaseMenuItem {
    _init(title) {
        super._init({reactive: false, can_focus: false});

        this.box = new St.BoxLayout({
            vertical: true,
            x_expand: true,
            style_class: 'claude-usage-row',
        });

        const headerBox = new St.BoxLayout({style_class: 'claude-usage-row-header'});
        this.titleLabel = new St.Label({
            text: title,
            x_expand: true,
            style_class: 'claude-usage-title',
        });
        this.valueLabel = new St.Label({
            text: '--',
            style_class: 'claude-usage-value',
        });
        headerBox.add_child(this.titleLabel);
        headerBox.add_child(this.valueLabel);
        this.box.add_child(headerBox);

        this._track = new St.Widget({
            style_class: 'claude-progress-track',
            style: `width: ${ProgressTrackWidth}px;`,
        });
        this._fill = new St.Widget({
            style_class: 'claude-progress-fill',
            style: 'width: 0px;',
        });
        this._track.add_child(this._fill);
        this.box.add_child(this._track);

        this.add_child(this.box);
    }

    setUsage(pct, colorClass) {
        this.valueLabel.set_text(`${pct}%`);
        this.valueLabel.set_style_class_name(`claude-usage-value ${colorClass}`);

        const fillWidth = Math.round(Math.min(Math.max(pct, 0), 100) / 100 * ProgressTrackWidth);
        this._fill.set_style(`width: ${fillWidth}px;`);
        this._fill.set_style_class_name(`claude-progress-fill ${colorClass}-bg`);
    }
});

export const ClaudeIndicator = GObject.registerClass(
class ClaudeIndicator extends PanelMenu.Button {
    constructor(extension) {
        super(0.0, 'Claude Usage Tracker');

        this._extension = extension;
        this._settings = extension.getSettings();

        this._hbox = new St.BoxLayout({
            style_class: 'panel-status-menu-box',
            style: 'spacing: 6px;',
            reactive: true,
            track_hover: true,
        });
        this.add_child(this._hbox);

        this._icon = new St.Icon({
            gicon: Gio.icon_new_for_string(`${extension.path}/icons/claude-symbolic.svg`),
            style_class: 'system-status-icon',
            icon_size: 16,
        });
        this._hbox.add_child(this._icon);

        const makeStaticLabel = text => new St.Label({
            text,
            y_align: Clutter.ActorAlign.CENTER,
            style_class: 'claude-label',
        });
        const makeValueLabel = () => new St.Label({
            text: '--',
            y_align: Clutter.ActorAlign.CENTER,
            style_class: 'claude-label',
        });

        this._sessionTitleLabel = makeStaticLabel('Session:');
        this._sessionValueLabel = makeValueLabel();
        this._weeklyTitleLabel = makeStaticLabel('Weekly:');
        this._weeklyValueLabel = makeValueLabel();

        this._hbox.add_child(this._sessionTitleLabel);
        this._hbox.add_child(this._sessionValueLabel);
        this._hbox.add_child(this._weeklyTitleLabel);
        this._hbox.add_child(this._weeklyValueLabel);

        this._buildMenu();
        this._updateVisibility();

        this._settingsChangedId = this._settings.connect(
            'changed', (settings, key) => this._onSettingsChanged(key));

        this._syncSessionKey();
        this._refreshUsage();
        this._startRefreshTimer();
    }

    _buildMenu() {
        const headerItem = new PopupMenu.PopupBaseMenuItem({reactive: false, can_focus: false});
        const headerBox = new St.BoxLayout({style_class: 'claude-menu-header'});
        headerBox.add_child(new St.Icon({
            gicon: Gio.icon_new_for_string(`${this._extension.path}/icons/claude-symbolic.svg`),
            icon_size: 16,
        }));
        headerBox.add_child(new St.Label({
            text: 'Claude Usage',
            style_class: 'claude-menu-title',
        }));
        headerItem.add_child(headerBox);
        this.menu.addMenuItem(headerItem);

        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        this._sessionUsageItem = new UsageMenuItem('Session');
        this.menu.addMenuItem(this._sessionUsageItem);

        this._weeklyUsageItem = new UsageMenuItem('Weekly');
        this.menu.addMenuItem(this._weeklyUsageItem);

        this._resetTimeItem = new PopupMenu.PopupImageMenuItem(
            'Next reset: --',
            'alarm-symbolic',
            {reactive: false}
        );
        this.menu.addMenuItem(this._resetTimeItem);

        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        const settingsItem = new PopupMenu.PopupImageMenuItem(
            'Preferences',
            'preferences-system-symbolic'
        );
        settingsItem.connect('activate', () => this._extension.openPreferences());
        this.menu.addMenuItem(settingsItem);

        const refreshItem = new PopupMenu.PopupImageMenuItem(
            'Refresh',
            'view-refresh-symbolic'
        );
        refreshItem.connect('activate', () => this._refreshUsage());
        this.menu.addMenuItem(refreshItem);
    }

    _updateVisibility() {
        const showSession = this._settings.get_boolean('show-session');
        const showWeekly = this._settings.get_boolean('show-weekly');

        this._sessionTitleLabel.visible = showSession;
        this._sessionValueLabel.visible = showSession;
        this._weeklyTitleLabel.visible = showWeekly;
        this._weeklyValueLabel.visible = showWeekly;
    }

    _updateUI(usage) {
        // The Claude API returns utilization already as a percentage (e.g. 35.0), not a fraction
        const sessionPct = Math.round(usage.five_hour?.utilization ?? 0);
        const weeklyPct = Math.round(usage.seven_day?.utilization ?? 0);

        this._sessionValueLabel.set_text(`${sessionPct}%`);
        this._weeklyValueLabel.set_text(`${weeklyPct}%`);

        this._sessionValueLabel.set_style_class_name(`claude-label ${this._colorClassFor(sessionPct)}`);
        this._weeklyValueLabel.set_style_class_name(`claude-label ${this._colorClassFor(weeklyPct)}`);

        this._sessionUsageItem.setUsage(sessionPct, this._colorClassFor(sessionPct));
        this._weeklyUsageItem.setUsage(weeklyPct, this._colorClassFor(weeklyPct));

        if (usage.five_hour?.resets_at) {
            const resetTime = new Date(usage.five_hour.resets_at);
            this._resetTimeItem.label.set_text(`Session resets: ${resetTime.toLocaleTimeString()}`);
        }
    }

    _colorClassFor(pct) {
        if (pct > 80)
            return 'claude-critical';
        if (pct > 50)
            return 'claude-moderate';
        return 'claude-safe';
    }

    _showError() {
        this._sessionValueLabel.set_text('err');
        this._weeklyValueLabel.set_text('err');
        this._sessionValueLabel.set_style_class_name('claude-label claude-critical');
        this._weeklyValueLabel.set_style_class_name('claude-label claude-critical');

        this._sessionUsageItem.setUsage(0, 'claude-critical');
        this._weeklyUsageItem.setUsage(0, 'claude-critical');
    }

    async _refreshUsage() {
        try {
            const usage = await this._callDaemon('GetUsageData');
            if (usage && !usage.error)
                this._updateUI(usage);
            else
                this._showError();
        } catch (e) {
            console.error(`Failed to refresh Claude usage: ${e.message}`);
            this._showError();
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
        switch (key) {
        case 'session-key':
            this._syncSessionKey().then(() => this._refreshUsage());
            break;
        case 'refresh-interval':
            this._stopRefreshTimer();
            this._startRefreshTimer();
            break;
        case 'show-session':
        case 'show-weekly':
            this._updateVisibility();
            break;
        }
    }

    _startRefreshTimer() {
        this._refreshTimeout = GLib.timeout_add_seconds(
            GLib.PRIORITY_DEFAULT,
            this._settings.get_int('refresh-interval'),
            () => {
                this._refreshUsage();
                return GLib.SOURCE_CONTINUE;
            }
        );
    }

    _stopRefreshTimer() {
        if (this._refreshTimeout) {
            GLib.source_remove(this._refreshTimeout);
            this._refreshTimeout = null;
        }
    }

    destroy() {
        this._stopRefreshTimer();

        if (this._settingsChangedId) {
            this._settings.disconnect(this._settingsChangedId);
            this._settingsChangedId = null;
        }

        this._settings = null;
        this._proxy = null;

        super.destroy();
    }
});
