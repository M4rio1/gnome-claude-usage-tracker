#!/usr/bin/env python3
"""GNOME Claude Usage Tracker Daemon.

Background service that fetches Claude usage data and exposes it via D-Bus.
"""

import asyncio
import logging
import sys
import signal
from pathlib import Path

try:
    from dbus_next.service import ServiceInterface, method
    from dbus_next import BusType
    from dbus_next.aio import MessageBus
    DBUS_AVAILABLE = True
except ImportError:
    DBUS_AVAILABLE = False
    print("Error: dbus-next not installed. Install with: pip install dbus-next")
    sys.exit(1)

# Add daemon directory to path
sys.path.insert(0, str(Path(__file__).parent))

from daemon.dbus_service import ClaudeUsageInterface

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
    ]
)

logger = logging.getLogger(__name__)


class ClaudeUsageDaemon:
    """Main daemon class."""

    def __init__(self):
        """Initialize daemon."""
        self.bus = None
        self.interface = None
        self.running = True

    async def run(self):
        """Start the daemon, reconnecting to D-Bus if the connection drops.

        dbus_next's connection can die silently (e.g. EOFError in its
        background message reader) without raising into this coroutine, so
        we explicitly wait for disconnection and reconnect rather than just
        looping on `self.running`.
        """
        logger.info("Starting Claude Usage Tracker daemon...")

        while self.running:
            try:
                self.bus = await MessageBus(bus_type=BusType.SESSION).connect()

                self.interface = ClaudeUsageInterface()
                self.bus.export('/org/gnome/ClaudeUsage', self.interface)

                await self.bus.request_name('org.gnome.ClaudeUsage')

                logger.info("✓ Daemon connected to D-Bus")
                logger.info("  D-Bus service: org.gnome.ClaudeUsage")
                logger.info("  Object path: /org/gnome/ClaudeUsage")
                logger.info("  Interface: org.gnome.ClaudeUsage")

                await self.bus.wait_for_disconnect()

                if self.running:
                    logger.warning("D-Bus connection lost, reconnecting in 5s...")
                    await asyncio.sleep(5)
            except Exception as e:
                if not self.running:
                    break
                logger.error(f"D-Bus connection error: {e}, retrying in 5s...")
                await asyncio.sleep(5)

    def stop(self):
        """Stop the daemon."""
        logger.info("Stopping daemon...")
        self.running = False
        if self.bus is not None:
            self.bus.disconnect()


async def main():
    """Main entry point."""
    daemon = ClaudeUsageDaemon()

    # Setup signal handlers
    loop = asyncio.get_event_loop()

    def handle_signal(signum, frame):
        logger.info(f"Received signal {signum}")
        daemon.stop()

    signal.signal(signal.SIGTERM, handle_signal)
    signal.signal(signal.SIGINT, handle_signal)

    try:
        await daemon.run()
    except KeyboardInterrupt:
        logger.info("Interrupted by user")
    except Exception as e:
        logger.error(f"Fatal error: {e}")
        sys.exit(1)
    finally:
        logger.info("Daemon stopped")


if __name__ == '__main__':
    asyncio.run(main())
