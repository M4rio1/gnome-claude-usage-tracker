#!/bin/bash

# GNOME Claude Usage Tracker - Installation Script
# Installs the extension and daemon service

set -e

echo "🚀 Installing GNOME Claude Usage Tracker..."

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
EXTENSION_NAME="claude-usage@gnome.local"
EXTENSION_DIR="$HOME/.local/share/gnome-shell/extensions/$EXTENSION_NAME"
SCHEMA_DIR="$HOME/.local/share/glib-2.0/schemas"
SYSTEMD_USER_DIR="$HOME/.local/share/systemd/user"
VENV_DIR="$HOME/.local/lib/claude-usage-venv"
BIN_DIR="$HOME/.local/bin"
DEV_MODE="${1:-}"

# Check requirements
echo "📋 Checking requirements..."

if ! command -v gnome-shell &> /dev/null; then
    echo -e "${RED}✗ GNOME Shell not found. Please install GNOME Shell 46+${NC}"
    exit 1
fi

if ! command -v python3 &> /dev/null; then
    echo -e "${RED}✗ Python 3 not found. Please install Python 3.10+${NC}"
    exit 1
fi

# Extract major version only (e.g., "48" from "GNOME Shell 48.5")
GNOME_VERSION=$(gnome-shell --version | grep -oE '[0-9]+' | head -1)
if [ -z "$GNOME_VERSION" ]; then
    echo -e "${YELLOW}⚠ Could not determine GNOME version, continuing anyway${NC}"
elif [ "$GNOME_VERSION" -lt 46 ]; then
    echo -e "${YELLOW}⚠ Warning: GNOME $GNOME_VERSION detected. GNOME 46+ is recommended.${NC}"
fi

echo -e "${GREEN}✓ Requirements OK${NC}"

# Create directories
echo "📁 Creating directories..."
mkdir -p "$EXTENSION_DIR"
mkdir -p "$SCHEMA_DIR"
mkdir -p "$SYSTEMD_USER_DIR"
mkdir -p "$BIN_DIR"
echo -e "${GREEN}✓ Directories created${NC}"

# Install GSettings schema
echo "⚙️  Installing GSettings schema..."
cp schemas/org.gnome.shell.extensions.claude-usage.gschema.xml "$SCHEMA_DIR/"
glib-compile-schemas "$SCHEMA_DIR/"
echo -e "${GREEN}✓ Schema installed and compiled${NC}"

# Install extension files
echo "📦 Installing GNOME extension..."
cp -r extension/* "$EXTENSION_DIR/"
echo -e "${GREEN}✓ Extension installed to $EXTENSION_DIR${NC}"

# Install Python daemon service file
echo "🐍 Installing daemon service..."
cp daemon/systemd/claude-usage-daemon.service "$SYSTEMD_USER_DIR/"
systemctl --user daemon-reload
echo -e "${GREEN}✓ Daemon service installed${NC}"

# Install Python dependencies using venv
echo "📚 Installing Python dependencies..."

# Remove old venv if it exists
if [ -d "$VENV_DIR" ]; then
    echo "  Removing old virtual environment..."
    rm -rf "$VENV_DIR"
fi

# Create virtual environment
echo "  Creating virtual environment..."
python3 -m venv "$VENV_DIR"

# Check if venv was created successfully
if [ ! -f "$VENV_DIR/bin/activate" ]; then
    echo -e "${RED}✗ Failed to create virtual environment${NC}"
    echo "  Try installing python3-venv: sudo apt install python3-venv"
    exit 1
fi

# Activate venv and install dependencies
source "$VENV_DIR/bin/activate"

echo "  Installing packages..."
if [ "$DEV_MODE" = "--dev" ]; then
    pip install -e ".[dev]"
else
    pip install -e .
fi

# Create wrapper script for daemon
echo "  Creating daemon wrapper script..."
cat > "$BIN_DIR/claude-usage-daemon" << 'WRAPPER_EOF'
#!/bin/bash
VENV_DIR="$HOME/.local/lib/claude-usage-venv"
source "$VENV_DIR/bin/activate"
python3 -m daemon.claude_usage_daemon
WRAPPER_EOF

chmod +x "$BIN_DIR/claude-usage-daemon"

# Deactivate venv
deactivate

echo -e "${GREEN}✓ Python dependencies installed${NC}"

# Enable and start the service
echo "🔧 Configuring daemon service..."
systemctl --user enable claude-usage-daemon
systemctl --user start claude-usage-daemon
sleep 2

if systemctl --user is-active --quiet claude-usage-daemon; then
    echo -e "${GREEN}✓ Daemon service started successfully${NC}"
else
    echo -e "${YELLOW}⚠ Daemon service failed to start. Check logs with: journalctl --user -u claude-usage-daemon -n 20${NC}"
fi

# Enable the extension
echo "🎨 Enabling GNOME extension..."
gnome-extensions enable "$EXTENSION_NAME" 2>/dev/null || echo -e "${YELLOW}⚠ Could not auto-enable extension (you may need to enable it manually in GNOME Extensions)${NC}"
echo -e "${GREEN}✓ Extension enabled${NC}"

# Summary
echo ""
echo -e "${GREEN}✅ Installation complete!${NC}"
echo ""
echo "📝 Next steps:"
echo "  1. Open GNOME Extensions and verify 'Claude Usage Tracker' is enabled"
echo "  2. Click the preferences icon to configure your Claude session key"
echo "  3. Go to https://claude.ai and extract your session key:"
echo "     - F12 → Application → Cookies → https://claude.ai → sessionKey"
echo "  4. Paste the key in the settings and click 'Test Connection'"
echo "  5. Restart GNOME Shell: killall -3 gnome-shell"
echo ""
echo "📖 Useful commands:"
echo "  View daemon logs:     journalctl --user -u claude-usage-daemon -f"
echo "  Restart daemon:       systemctl --user restart claude-usage-daemon"
echo "  Open preferences:     gnome-extensions prefs $EXTENSION_NAME"
echo "  Check status:         systemctl --user status claude-usage-daemon"
echo "  Check extension:      gnome-extensions list | grep claude-usage"
echo ""
echo "🔗 Project: https://github.com/M4rio1/gnome-claude-usage-tracker"
echo ""
