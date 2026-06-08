import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import {ExtensionPreferences} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class ClaudeUsagePreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings();

        const page = new Adw.PreferencesPage();
        window.add(page);

        const group = new Adw.PreferencesGroup({
            title: 'Claude Usage Tracker Settings'
        });
        page.add(group);

        // Session Key
        const sessionKeyRow = new Adw.PasswordEntryRow({
            title: 'Session Key',
        });
        sessionKeyRow.set_text(settings.get_string('session-key'));
        sessionKeyRow.connect('changed', (w) => {
            settings.set_string('session-key', w.get_text());
        });
        group.add(sessionKeyRow);

        // Test Connection Button
        const testButton = new Gtk.Button({
            label: 'Test Connection',
            valign: Gtk.Align.CENTER,
        });
        testButton.connect('clicked', () => {
            console.log('Test connection clicked');
        });
        const testRow = new Adw.ActionRow({
            title: 'Connection',
        });
        testRow.add_suffix(testButton);
        group.add(testRow);

        // Refresh Interval
        const refreshRow = new Adw.SpinRow({
            title: 'Refresh Interval (seconds)',
            adjustment: new Gtk.Adjustment({
                lower: 5,
                upper: 300,
                step_increment: 5
            })
        });
        refreshRow.set_value(settings.get_int('refresh-interval'));
        refreshRow.connect('changed', (w) => {
            settings.set_int('refresh-interval', w.get_value());
        });
        group.add(refreshRow);

        // Show Session Switch
        const showSessionRow = new Adw.SwitchRow({
            title: 'Show Session Usage in Top Bar',
        });
        showSessionRow.set_active(settings.get_boolean('show-session'));
        showSessionRow.connect('notify::active', (w) => {
            settings.set_boolean('show-session', w.get_active());
        });
        group.add(showSessionRow);

        // Show Weekly Switch
        const showWeeklyRow = new Adw.SwitchRow({
            title: 'Show Weekly Usage in Top Bar',
        });
        showWeeklyRow.set_active(settings.get_boolean('show-weekly'));
        showWeeklyRow.connect('notify::active', (w) => {
            settings.set_boolean('show-weekly', w.get_active());
        });
        group.add(showWeeklyRow);
    }
}
