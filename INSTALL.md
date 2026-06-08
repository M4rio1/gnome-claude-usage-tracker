# Installation Guide

## Prerequisites

Before installing, ensure you have:

- **GNOME Shell 46+** (Ubuntu 24.04 LTS or later, Fedora 40+, etc.)
- **Python 3.10+** (`python3 --version`)
- **pip** package manager (`pip3 --version`)
- **Git** (`git --version`)
- **Active Claude AI account** with access to https://claude.ai

## Step 1: Get Your Session Key

1. Open https://claude.ai in your browser and log in
2. Press **F12** to open Developer Tools
3. Go to **Application** tab (Chrome/Edge) or **Storage** (Firefox)
4. Expand **Cookies** → **https://claude.ai**
5. Find the cookie named `sessionKey`
6. Copy the entire value (starts with `sk-ant-sid01-`)
7. Keep this value safe - you'll need it for configuration

## Step 2: Clone the Repository

```bash
git clone https://github.com/M4rio1/gnome-claude-usage-tracker.git
cd gnome-claude-usage-tracker
```

## Step 3: Automatic Installation

### Option A: Using install.sh (Recommended)

```bash
chmod +x install.sh
./install.sh
```

The script will:
- Compile GSettings schema
- Install the extension to ~/.local/share/gnome-shell/extensions/
- Install the daemon service
- Create necessary directories

### Option B: Manual Installation

#### A. Install GSettings Schema

```bash
mkdir -p ~/.local/share/glib-2.0/schemas/
cp schemas/org.gnome.shell.extensions.claude-usage.gschema.xml \
   ~/.local/share/glib-2.0/schemas/

glib-compile-schemas ~/.local/share/glib-2.0/schemas/
```

#### B. Install GNOME Extension

```bash
mkdir -p ~/.local/share/gnome-shell/extensions/claude-usage@gnome.local/
cp -r extension/* ~/.local/share/gnome-shell/extensions/claude-usage@gnome.local/
```

#### C. Install Daemon Service

```bash
mkdir -p ~/.local/share/systemd/user/
cp daemon/systemd/claude-usage-daemon.service \
   ~/.local/share/systemd/user/

systemctl --user daemon-reload
systemctl --user enable claude-usage-daemon
systemctl --user start claude-usage-daemon
```

#### D. Install Python Daemon

```bash
pip3 install --user -r requirements.txt
mkdir -p ~/.local/lib/python3.10/site-packages/
cp daemon/*.py ~/.local/lib/python3.10/site-packages/
```

## Step 4: Enable the Extension

1. Press **Super** (Windows key) to open Activities
2. Type "Extensions" and open GNOME Extensions
3. Find "Claude Usage Tracker"
4. Toggle it ON
5. Alternatively use command line:
   ```bash
   gnome-extensions enable claude-usage@gnome.local
   ```

## Step 5: Configure Session Key

1. In GNOME Extensions, click the gear icon next to Claude Usage Tracker
2. Or run: `gnome-extensions prefs claude-usage@gnome.local`
3. Paste your session key from Step 1
4. Click "Test Connection" to verify it works
5. If successful, you should see your organization ID
6. Click "Save"

## Step 6: Restart GNOME Shell

To apply changes, restart GNOME Shell:

```bash
killall -3 gnome-shell
```

(Your windows will be preserved, GNOME Shell will restart transparently)

## Step 7: Verify Installation

1. Check that the daemon is running:
   ```bash
   systemctl --user status claude-usage-daemon
   ```

2. Check daemon logs:
   ```bash
   journalctl --user -u claude-usage-daemon -f
   ```

3. Look for Claude icon in your GNOME top bar
4. Click it to see usage statistics

## Troubleshooting

### Extension doesn't appear in top bar

```bash
# Check if extension is enabled
gnome-extensions list

# Force enable
gnome-extensions enable claude-usage@gnome.local

# Restart GNOME Shell
killall -3 gnome-shell
```

### Daemon not running

```bash
# Check status
systemctl --user status claude-usage-daemon

# View recent logs
journalctl --user -u claude-usage-daemon -n 50

# Restart daemon
systemctl --user restart claude-usage-daemon

# Manual test
python3 daemon/claude_usage_daemon.py
```

### "Error" message in top bar

1. Verify session key is correct (test in preferences)
2. Check if session key has expired:
   - Go back to https://claude.ai
   - Extract a fresh session key
   - Update in preferences
3. Check daemon logs for specific error messages

### Settings dialog won't open

```bash
# Try opening manually
gnome-extensions prefs claude-usage@gnome.local

# If that fails, check for errors
gnome-shell --replace
```

### Can't find GSettings schema after installation

```bash
# Recompile schemas
glib-compile-schemas ~/.local/share/glib-2.0/schemas/

# Verify schema is installed
gsettings list-schemas | grep claude-usage
```

## Uninstallation

To remove the extension:

```bash
# Disable extension
gnome-extensions disable claude-usage@gnome.local

# Remove files
rm -rf ~/.local/share/gnome-shell/extensions/claude-usage@gnome.local/
rm ~/.local/share/glib-2.0/schemas/org.gnome.shell.extensions.claude-usage.gschema.xml
rm ~/.local/share/systemd/user/claude-usage-daemon.service

# Recompile schemas
glib-compile-schemas ~/.local/share/glib-2.0/schemas/

# Stop daemon
systemctl --user stop claude-usage-daemon
systemctl --user disable claude-usage-daemon
systemctl --user daemon-reload

# Restart GNOME
killall -3 gnome-shell
```

## Getting Help

If you run into issues:

1. Check the [troubleshooting section](#troubleshooting) above
2. Check [existing GitHub issues](https://github.com/M4rio1/gnome-claude-usage-tracker/issues)
3. Create a new issue with:
   - Your GNOME Shell version (`gnome-shell --version`)
   - Your Python version (`python3 --version`)
   - Relevant log messages (`journalctl --user -u claude-usage-daemon`)
   - Steps to reproduce the problem