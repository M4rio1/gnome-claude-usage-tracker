"""Claude API Service - Fetches usage data from Claude.ai."""

import aiohttp
import asyncio
import json
from typing import Dict, Optional
import logging

logger = logging.getLogger(__name__)


class ClaudeAPIService:
    """Client for Claude API usage endpoint."""

    BASE_URL = "https://claude.ai/api"

    def __init__(self, session_key: str):
        """Initialize with session key.

        Args:
            session_key: Claude.ai session key (sk-ant-sid01-...)
        """
        self.session_key = session_key
        self.org_id_cache: Optional[str] = None

    async def fetch_organization_id(self) -> str:
        """Fetch the organization ID for the user.

        Returns:
            Organization UUID

        Raises:
            ValueError: If session key is invalid
            RuntimeError: If API call fails
        """
        if self.org_id_cache:
            return self.org_id_cache

        try:
            async with aiohttp.ClientSession() as session:
                headers = self._build_headers()
                url = f"{self.BASE_URL}/organizations"

                async with session.get(
                    url,
                    headers=headers,
                    cookies={"sessionKey": self.session_key},
                    timeout=aiohttp.ClientTimeout(total=30)
                ) as resp:
                    if resp.status == 200:
                        orgs = await resp.json()
                        if not orgs:
                            raise ValueError("No organizations found")
                        self.org_id_cache = orgs[0]["uuid"]
                        logger.info(f"Found organization: {orgs[0].get('name')}")
                        return self.org_id_cache
                    elif resp.status == 401:
                        raise ValueError("Session key expired or invalid")
                    else:
                        error_text = await resp.text()
                        raise RuntimeError(
                            f"API error: {resp.status} - {error_text[:200]}"
                        )
        except asyncio.TimeoutError:
            raise RuntimeError("API request timed out")
        except aiohttp.ClientError as e:
            raise RuntimeError(f"Network error: {str(e)}")

    async def fetch_usage_data(self) -> Dict:
        """Fetch current usage data.

        Returns:
            Dictionary with usage information

        Raises:
            RuntimeError: If API call fails
        """
        try:
            org_id = await self.fetch_organization_id()

            async with aiohttp.ClientSession() as session:
                headers = self._build_headers()
                url = f"{self.BASE_URL}/organizations/{org_id}/usage"

                async with session.get(
                    url,
                    headers=headers,
                    cookies={"sessionKey": self.session_key},
                    timeout=aiohttp.ClientTimeout(total=30)
                ) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        logger.info(f"Usage data fetched successfully")
                        return data
                    elif resp.status == 401:
                        raise ValueError("Session key expired")
                    else:
                        error_text = await resp.text()
                        raise RuntimeError(
                            f"Failed to fetch usage: {resp.status} - {error_text[:200]}"
                        )
        except asyncio.TimeoutError:
            raise RuntimeError("Usage fetch request timed out")
        except aiohttp.ClientError as e:
            raise RuntimeError(f"Network error: {str(e)}")

    def _build_headers(self) -> Dict[str, str]:
        """Build HTTP headers to mimic browser request.

        Returns:
            Dictionary of HTTP headers
        """
        return {
            "Accept": "application/json",
            "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36",
            "Referer": "https://claude.ai",
            "Origin": "https://claude.ai",
        }
