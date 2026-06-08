"""Storage management for settings and credentials."""

import json
import logging
from pathlib import Path
from typing import Optional, Dict, Any

try:
    import gi
    gi.require_version('Gio', '2.0')
    from gi.repository import Gio
    GSETTINGS_AVAILABLE = True
except ImportError:
    GSETTINGS_AVAILABLE = False

logger = logging.getLogger(__name__)


class StorageManager:
    """Manages credential and settings storage.

    Uses GSettings for GNOME integration and JSON files for caching.
    """

    SCHEMA_ID = "org.gnome.shell.extensions.claude-usage"

    def __init__(self):
        """Initialize storage manager."""
        self.config_dir = Path.home() / ".config" / "claude-usage-tracker"
        self.config_dir.mkdir(parents=True, exist_ok=True)

        if GSETTINGS_AVAILABLE:
            try:
                self.settings = Gio.Settings.new(self.SCHEMA_ID)
            except Exception as e:
                logger.warning(f"GSettings not available: {e}")
                self.settings = None
        else:
            logger.warning("GSettings not available, using JSON fallback")
            self.settings = None

    def save_session_key(self, key: str) -> None:
        """Save session key securely.

        Args:
            key: Claude.ai session key
        """
        if self.settings:
            try:
                self.settings.set_string("session-key", key)
                logger.info("Session key saved to GSettings")
                return
            except Exception as e:
                logger.warning(f"Failed to save to GSettings: {e}")

        # Fallback: save to JSON file (not ideal for security)
        cache_file = self.config_dir / "config.json"
        try:
            config = {}
            if cache_file.exists():
                with open(cache_file, 'r') as f:
                    config = json.load(f)
            config["session_key"] = key
            with open(cache_file, 'w') as f:
                json.dump(config, f)
            logger.info("Session key saved to JSON (less secure)")
        except Exception as e:
            logger.error(f"Failed to save session key: {e}")
            raise

    def get_session_key(self) -> Optional[str]:
        """Get stored session key.

        Returns:
            Session key or None if not configured
        """
        if self.settings:
            try:
                key = self.settings.get_string("session-key")
                if key:
                    return key
            except Exception as e:
                logger.warning(f"Failed to read from GSettings: {e}")

        # Fallback: read from JSON
        cache_file = self.config_dir / "config.json"
        if cache_file.exists():
            try:
                with open(cache_file, 'r') as f:
                    config = json.load(f)
                    return config.get("session_key")
            except Exception as e:
                logger.warning(f"Failed to read session key from JSON: {e}")

        return None

    def save_organization_id(self, org_id: str) -> None:
        """Save organization ID.

        Args:
            org_id: Organization UUID
        """
        if self.settings:
            try:
                self.settings.set_string("organization-id", org_id)
                logger.info("Organization ID saved")
                return
            except Exception as e:
                logger.warning(f"Failed to save to GSettings: {e}")

        # Fallback: JSON
        cache_file = self.config_dir / "config.json"
        try:
            config = {}
            if cache_file.exists():
                with open(cache_file, 'r') as f:
                    config = json.load(f)
            config["organization_id"] = org_id
            with open(cache_file, 'w') as f:
                json.dump(config, f)
        except Exception as e:
            logger.error(f"Failed to save organization ID: {e}")

    def get_organization_id(self) -> Optional[str]:
        """Get stored organization ID.

        Returns:
            Organization ID or None
        """
        if self.settings:
            try:
                org_id = self.settings.get_string("organization-id")
                if org_id:
                    return org_id
            except Exception:
                pass

        # Fallback: JSON
        cache_file = self.config_dir / "config.json"
        if cache_file.exists():
            try:
                with open(cache_file, 'r') as f:
                    config = json.load(f)
                    return config.get("organization_id")
            except Exception:
                pass

        return None

    def save_usage_cache(self, usage: Dict[str, Any]) -> None:
        """Cache usage data for quick access.

        Args:
            usage: Usage data dictionary
        """
        cache_file = self.config_dir / "usage_cache.json"
        try:
            with open(cache_file, 'w') as f:
                json.dump(usage, f, default=str)
            logger.debug("Usage cached")
        except Exception as e:
            logger.error(f"Failed to cache usage: {e}")

    def get_usage_cache(self) -> Optional[Dict[str, Any]]:
        """Get cached usage data.

        Returns:
            Cached usage data or None
        """
        cache_file = self.config_dir / "usage_cache.json"
        if cache_file.exists():
            try:
                with open(cache_file, 'r') as f:
                    return json.load(f)
            except Exception as e:
                logger.warning(f"Failed to read usage cache: {e}")
        return None
