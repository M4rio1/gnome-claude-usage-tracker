# GNOME Claude Usage Tracker

A GNOME Shell extension for real-time monitoring of Claude AI usage limits in the top panel. Built with Python and JavaScript.

![GNOME](https://img.shields.io/badge/GNOME-46+-blue?style=flat-square&logo=gnome)
![Python](https://img.shields.io/badge/Python-3.10+-blue?style=flat-square&logo=python)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow?style=flat-square&logo=javascript)
![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)

## Features

- **Real-Time Monitoring**: Track your 5-hour session and weekly usage limits
- **Top Panel Integration**: Display usage percentages directly in GNOME's top bar
- **Color-Coded Status**: 
  - 🟢 Green: 0-50% usage (Safe)
  - 🟠 Orange: 50-80% usage (Moderate)
  - 🔴 Red: 80-100% usage (Critical)
- **Dropdown Menu**: Quick access to detailed usage statistics
- **Auto-Refresh**: Updates every 30 seconds
- **Settings Interface**: Easy session key configuration
- **Lightweight**: Minimal resource usage with async Python daemon

## Requirements

- **GNOME Shell 46+** (Ubuntu 24.04+ / Fedora 40+)
- **Python 3.10+**
- **GSettings** support (usually pre-installed)
- **D-Bus** system (standard on all Linux distributions)
- **Active Claude AI account** ([claude.ai](https://claude.ai))

## Installation

### Quick Start

```bash
# Clone the repository
git clone https://github.com/M4rio1/gnome-claude-usage-tracker.git
cd gnome-claude-usage-tracker

# Run the installer
chmod +x install.sh
./install.sh

# Restart GNOME Shell
killall -3 gnome-shell
```

### Manual Installation

See [INSTALL.md](INSTALL.md) for detailed step-by-step instructions.

## How It Works

### Architecture

```
GNOME Shell (JavaScript)
        ↓ D-Bus
    claude-usage-daemon (Python)
        ↓ aiohttp
    Claude API (claude.ai)
```

1. **GNOME Extension** (JavaScript): Displays usage in top panel, shows menu
2. **Daemon Service** (Python): Runs in background, fetches usage from Claude API
3. **D-Bus IPC**: Extension and daemon communicate via D-Bus
4. **GSettings**: Stores session key and preferences securely

## Authentication

The extension requires a Claude session key from `claude.ai`:

1. Go to [claude.ai](https://claude.ai) and log in
2. Open Developer Tools (F12 or Cmd+Option+I)
3. Go to **Application** → **Cookies** → **https://claude.ai**
4. Find the `sessionKey` cookie (starts with `sk-ant-sid01-`)
5. Copy the value and paste in the extension settings

## Configuration

Access settings via:
- GNOME Extensions app → Claude Usage Tracker → Preferences
- Or: `gnome-extensions prefs claude-usage@gnome.local`

### Available Settings

- **Session Key**: Your Claude.ai authentication key
- **Refresh Interval**: How often to update (default: 30 seconds)
- **Show Session**: Show 5-hour session usage
- **Show Weekly**: Show weekly usage limits

## Usage

### Top Bar Display

The extension shows two metrics in your GNOME top bar:

```
Claude: Session 35% | Weekly 62%
```

Click to open the dropdown menu for detailed information.

## Troubleshooting

### Extension not showing up

1. Check if extension is enabled: `gnome-extensions list`
2. Check daemon status: `systemctl --user status claude-usage-daemon`
3. Restart GNOME Shell: `killall -3 gnome-shell`

### Shows "Error" in top bar

1. Verify your session key is correct
2. Check daemon logs: `journalctl --user -u claude-usage-daemon -f`
3. Restart the daemon: `systemctl --user restart claude-usage-daemon`

### Session key expired

Claude session keys can expire. If you see errors:

1. Go back to [claude.ai](https://claude.ai)
2. Extract a fresh session key
3. Update in extension settings

## Development

### Project Structure

```
gnome-claude-usage-tracker/
├── extension/                    # GNOME Extension (JavaScript)
│   ├── metadata.json
│   ├── extension.js
│   ├── panel-button.js
│   ├── prefs.js
│   ├── stylesheet.css
│   ├── icons/
│   │   └── claude-symbolic.svg
│   └── schemas/                  # GSettings configuration schema
│       └── org.gnome.shell.extensions.claude-usage.gschema.xml
├── daemon/                       # Background Service (Python)
│   ├── __init__.py
│   ├── claude_usage_daemon.py
│   ├── api_service.py
│   ├── storage.py
│   ├── dbus_service.py
│   └── systemd/
│       └── claude-usage-daemon.service
├── install.sh                    # Installation script
├── pyproject.toml               # Python package config
├── requirements.txt              # Python dependencies
├── CONTRIBUTING.md              # Contributing guidelines
├── LICENSE                       # MIT License
└── README.md                     # This file
```

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details.

## Disclaimer

This is an unofficial third-party tool created for personal usage monitoring. Not affiliated with, endorsed by, or sponsored by Anthropic PBC. Claude is a trademark of Anthropic PBC.

## Credits

Inspired by [Claude-Usage-Tracker](https://github.com/hamed-elfayome/Claude-Usage-Tracker) for macOS.

---

<div align="center">
  Built for the Claude AI community on Linux 🐧
</div>