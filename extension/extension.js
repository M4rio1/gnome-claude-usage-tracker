import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as PanelButton from './panel-button.js';

export default class ClaudeUsageExtension extends Extension {
    enable() {
        this._indicator = new PanelButton.ClaudeIndicator(this);
        Main.panel.addToStatusArea(
            'claude-usage',
            this._indicator,
            1,
            'right'
        );
    }

    disable() {
        this._indicator?.destroy();
        this._indicator = null;
    }
}
