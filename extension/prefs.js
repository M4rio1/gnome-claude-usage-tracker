import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';
import {ExtensionPreferences} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class ClaudeUsagePreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings();

        const vbox = new Gtk.Box({
            orientation: Gtk.Orientation.VERTICAL,
            spacing: 12,
            margin_top: 12,
            margin_bottom: 12,
            margin_start: 12,
            margin_end: 12
        });

        // Title
        const title = new Gtk.Label({
            label: '<b>Claude Usage Tracker Settings</b>',
            use_markup: true,
            xalign: 0
        });
        vbox.append(title);

        // Session Key Input
        const sessionKeyLabel = new Gtk.Label({
            label: 'Session Key:',
            xalign: 0
        });
        vbox.append(sessionKeyLabel);

        const sessionKeyEntry = new Gtk.Entry({
            visibility: false,
            placeholder_text: 'sk-ant-sid01-...'
        });
        sessionKeyEntry.set_text(settings.get_string('session-key'));
        sessionKeyEntry.connect('changed', (w) => {
            settings.set_string('session-key', w.get_text());
        });
        vbox.append(sessionKeyEntry);

        // Test Connection Button
        const testButton = new Gtk.Button({
            label: 'Test Connection'
        });
        testButton.connect('clicked', () => {
            console.log('Test connection clicked');
        });
        vbox.append(testButton);

        // Refresh Interval
        const refreshLabel = new Gtk.Label({
            label: 'Refresh Interval (seconds):',
            xalign: 0
        });
        vbox.append(refreshLabel);

        const refreshSpin = new Gtk.SpinButton({
            adjustment: new Gtk.Adjustment({
                lower: 5,
                upper: 300,
                step_increment: 5
            })
        });
        refreshSpin.set_value(settings.get_int('refresh-interval'));
        refreshSpin.connect('value-changed', (w) => {
            settings.set_int('refresh-interval', w.get_value());
        });
        vbox.append(refreshSpin);

        // Show Session Checkbox
        const showSessionCheck = new Gtk.CheckButton({
            label: 'Show Session Usage in Top Bar'
        });
        showSessionCheck.set_active(settings.get_boolean('show-session'));
        showSessionCheck.connect('toggled', (w) => {
            settings.set_boolean('show-session', w.get_active());
        });
        vbox.append(showSessionCheck);

        // Show Weekly Checkbox
        const showWeeklyCheck = new Gtk.CheckButton({
            label: 'Show Weekly Usage in Top Bar'
        });
        showWeeklyCheck.set_active(settings.get_boolean('show-weekly'));
        showWeeklyCheck.connect('toggled', (w) => {
            settings.set_boolean('show-weekly', w.get_active());
        });
        vbox.append(showWeeklyCheck);

        window.add(vbox);
    }
}
