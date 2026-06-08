"""D-Bus service for GNOME extension communication."""

import asyncio
import json
import logging
from typing import Optional

try:
    from dbus_next.service import ServiceInterface, method
    from dbus_next import BusType, Variant
    DBUS_AVAILABLE = True
except ImportError:
    DBUS_AVAILABLE = False

from daemon.api_service import ClaudeAPIService
from daemon.storage import StorageManager

logger = logging.getLogger(__name__)


if DBUS_AVAILABLE:
    class ClaudeUsageInterface(ServiceInterface):
        """D-Bus interface for Claude Usage service."""

        def __init__(self):
            super().__init__('org.gnome.ClaudeUsage')
            self.api: Optional[ClaudeAPIService] = None
            self.storage = StorageManager()
            self._load_credentials()

        def _load_credentials(self) -> None:
            """Load credentials from storage."""
            session_key = self.storage.get_session_key()
            if session_key:
                self.api = ClaudeAPIService(session_key)
                logger.info("Credentials loaded from storage")
            else:
                logger.warning("No session key configured")

        @method()
        async def GetUsageData(self) -> 's':
            """Get current usage data.

            Returns:
                JSON string with usage data
            """
            try:
                if not self.api:
                    return json.dumps({"error": "No session key configured"})

                usage = await self.api.fetch_usage_data()
                # Cache it
                self.storage.save_usage_cache(usage)
                return json.dumps(usage)
            except Exception as e:
                logger.error(f"Error fetching usage: {e}")
                return json.dumps({"error": str(e)})

        @method()
        def SetSessionKey(self, key: 's') -> 'b':
            """Set session key.

            Args:
                key: Claude.ai session key

            Returns:
                True if successful
            """
            try:
                self.storage.save_session_key(key)
                self.api = ClaudeAPIService(key)
                logger.info("Session key updated")
                return True
            except Exception as e:
                logger.error(f"Error setting session key: {e}")
                return False

        @method()
        async def TestSessionKey(self, key: 's') -> 's':
            """Test if a session key is valid.

            Args:
                key: Session key to test

            Returns:
                JSON string with test result
            """
            try:
                api = ClaudeAPIService(key)
                org_id = await api.fetch_organization_id()
                return json.dumps({"success": True, "organization_id": org_id})
            except Exception as e:
                logger.error(f"Session key test failed: {e}")
                return json.dumps({"success": False, "error": str(e)})
else:
    logger.warning("dbus-next not available, D-Bus service disabled")
    ClaudeUsageInterface = None
