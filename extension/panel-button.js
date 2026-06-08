import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import St from 'gi://St';
import Clutter from 'gi://Clutter';
import GLib from 'gi://GLib';
import Gio from 'gi://Gio';

const REFRESH_INTERVAL = 30000; // 30 seconds

export class ClaudeIndicator extends PanelMenu.Button {
    constructor(extension) {
        super(0.0, 'Claude Usage Tracker');

        this._extension = extension;
        this._usageData = null;
        this._settings = extension.getSettings('org.gnome.shell.extensions.claude-usage');

        // Main container
        this._hbox = new St.BoxLayout({
            style_class: 'panel-status-menu-box',
            reactive: true,
            track_hover: true,
            spacing: 6
        });

        this.add_child(this._hbox);

        // Claude icon
        this._icon = new St.Icon({
            icon_name: 'text-editor-symbolic',
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
        this._settings.connect('changed', () => this._onSettingsChanged());

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

        const sessionPct = Math.round((usage.five_hour?.utilization ?? 0) * 100);
        const weeklyPct = Math.round((usage.seven_day?.utilization ?? 0) * 100);

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
            if (usage) {
                this._updateUI(usage);
            } else {
                this._label.set_text('Claude: No data');
            }
        } catch (e) {
            console.error('Error fetching usage:', e.message);
            this._label.set_text('Claude: Error');
        }
    }

    async _callDaemon(method) {
        try {
            // This will be implemented to call the D-Bus daemon
            // For now, return mock data
            return {
                five_hour: {
                    utilization: 0.35,
                    resets_at: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString()
                },
                seven_day: {
                    utilization: 0.62,
                    resets_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
                }
            };
        } catch (e) {
            console.error(`D-Bus call failed: ${e.message}`);
            return null;
        }
    }

    _openPreferences() {
        this._extension.openPreferences();
    }

    _onSettingsChanged() {
        // Settings changed, could trigger refresh
        this._refreshUsage();
    }

    _startRefreshTimer() {
        // Initial refresh
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
}
