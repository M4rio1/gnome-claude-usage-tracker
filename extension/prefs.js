import Adw from 'gi://Adw';
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';
import {ExtensionPreferences} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class ClaudeUsagePreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings();

        const page = new Adw.PreferencesPage();
        window.add(page);

        const group = new Adw.PreferencesGroup({
            title: 'Claude Usage Tracker Settings',
        });
        page.add(group);

        const sessionKeyRow = new Adw.PasswordEntryRow({
            title: 'Session Key',
        });
        settings.bind('session-key', sessionKeyRow, 'text',
            Gio.SettingsBindFlags.DEFAULT);
        group.add(sessionKeyRow);

        const refreshRow = new Adw.SpinRow({
            title: 'Refresh Interval (seconds)',
            adjustment: new Gtk.Adjustment({
                lower: 5,
                upper: 300,
                step_increment: 5,
            }),
        });
        settings.bind('refresh-interval', refreshRow, 'value',
            Gio.SettingsBindFlags.DEFAULT);
        group.add(refreshRow);

        const showSessionRow = new Adw.SwitchRow({
            title: 'Show Session Usage in Top Bar',
        });
        settings.bind('show-session', showSessionRow, 'active',
            Gio.SettingsBindFlags.DEFAULT);
        group.add(showSessionRow);

        const showWeeklyRow = new Adw.SwitchRow({
            title: 'Show Weekly Usage in Top Bar',
        });
        settings.bind('show-weekly', showWeeklyRow, 'active',
            Gio.SettingsBindFlags.DEFAULT);
        group.add(showWeeklyRow);
    }
}
