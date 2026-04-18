from __future__ import annotations

import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
import unittest


BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

import sentinel


class FakeResponse:
    def __init__(self, status_code: int):
        self.status_code = status_code


class FakeAsyncClient:
    responses: list[object] = []
    requests: list[tuple[str, int | None]] = []

    def __init__(self, timeout: int = 15):
        self.timeout = timeout

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc, tb):
        return False

    @classmethod
    def reset(cls) -> None:
        cls.responses = []
        cls.requests = []

    async def get(self, url: str, timeout: int | None = None):
        self.requests.append((url, timeout))
        if not self.responses:
            raise AssertionError("Resposta fake ausente para sentinel")
        response = self.responses.pop(0)
        if isinstance(response, Exception):
            raise response
        return response


class MergeforgeHealthTests(unittest.IsolatedAsyncioTestCase):
    def setUp(self) -> None:
        self.original_client = sentinel.httpx.AsyncClient
        self.original_sleep = sentinel.asyncio.sleep
        self.original_utcnow = sentinel._utcnow
        self.original_mergeforge_url = sentinel.os.environ.get("MERGEFORGE_URL")
        self.original_forgeops_url = sentinel.os.environ.get("FORGEOPS_URL")
        self.original_warning_fail_streak = sentinel.MERGEFORGE_WARNING_FAIL_STREAK
        self.original_critical_fail_streak = sentinel.MERGEFORGE_CRITICAL_FAIL_STREAK
        self.original_alert_cooldown = sentinel.MERGEFORGE_ALERT_COOLDOWN_SECONDS

        sentinel.httpx.AsyncClient = FakeAsyncClient
        self.now = datetime(2026, 4, 15, 12, 0, tzinfo=timezone.utc)

        async def fake_sleep(_: float) -> None:
            return None

        sentinel.asyncio.sleep = fake_sleep
        sentinel._utcnow = lambda: self.now
        sentinel.os.environ["MERGEFORGE_URL"] = "https://mergeforge-backend.onrender.com"
        sentinel.os.environ.pop("FORGEOPS_URL", None)
        sentinel.MERGEFORGE_WARNING_FAIL_STREAK = 2
        sentinel.MERGEFORGE_CRITICAL_FAIL_STREAK = 3
        sentinel.MERGEFORGE_ALERT_COOLDOWN_SECONDS = 600
        sentinel._MERGEFORGE_HEALTH_STATE["fail_streak"] = 0
        sentinel._MERGEFORGE_HEALTH_STATE["last_alert_at"] = None
        sentinel._MERGEFORGE_HEALTH_STATE["last_alert_level"] = None
        FakeAsyncClient.reset()

    def tearDown(self) -> None:
        sentinel.httpx.AsyncClient = self.original_client
        sentinel.asyncio.sleep = self.original_sleep
        sentinel._utcnow = self.original_utcnow
        sentinel.MERGEFORGE_WARNING_FAIL_STREAK = self.original_warning_fail_streak
        sentinel.MERGEFORGE_CRITICAL_FAIL_STREAK = self.original_critical_fail_streak
        sentinel.MERGEFORGE_ALERT_COOLDOWN_SECONDS = self.original_alert_cooldown

        if self.original_mergeforge_url is None:
            sentinel.os.environ.pop("MERGEFORGE_URL", None)
        else:
            sentinel.os.environ["MERGEFORGE_URL"] = self.original_mergeforge_url

        if self.original_forgeops_url is None:
            sentinel.os.environ.pop("FORGEOPS_URL", None)
        else:
            sentinel.os.environ["FORGEOPS_URL"] = self.original_forgeops_url

    async def test_mergeforge_health_ok_on_first_try(self) -> None:
        FakeAsyncClient.responses = [FakeResponse(200)]

        issues = await sentinel._check_mergeforge_health()

        self.assertEqual(issues, [])
        self.assertEqual(sentinel._MERGEFORGE_HEALTH_STATE["fail_streak"], 0)
        self.assertEqual(
            FakeAsyncClient.requests,
            [("https://mergeforge-backend.onrender.com/api/health", 8)],
        )

    async def test_mergeforge_health_warning_when_recovers_after_retry(self) -> None:
        FakeAsyncClient.responses = [FakeResponse(502), FakeResponse(200)]

        issues = await sentinel._check_mergeforge_health()

        self.assertEqual(len(issues), 1)
        self.assertEqual(issues[0]["level"], "warning")
        self.assertIn("apos retry", issues[0]["title"])
        self.assertEqual(
            FakeAsyncClient.requests,
            [
                ("https://mergeforge-backend.onrender.com/api/health", 8),
                ("https://mergeforge-backend.onrender.com/api/health", 15),
            ],
        )

    async def test_mergeforge_health_warning_after_reaching_warning_fail_streak(self) -> None:
        FakeAsyncClient.responses = [FakeResponse(502), FakeResponse(502), FakeResponse(502)]

        first_issues = await sentinel._check_mergeforge_health()

        self.assertEqual(first_issues, [])
        self.assertEqual(sentinel._MERGEFORGE_HEALTH_STATE["fail_streak"], 1)

        FakeAsyncClient.reset()
        FakeAsyncClient.responses = [FakeResponse(502), FakeResponse(502), FakeResponse(502)]

        second_issues = await sentinel._check_mergeforge_health()

        self.assertEqual(len(second_issues), 1)
        self.assertEqual(second_issues[0]["level"], "warning")
        self.assertIn("Fail streak atual: 2", second_issues[0]["detail"])

    async def test_mergeforge_health_critical_after_all_retries_fail(self) -> None:
        sentinel._MERGEFORGE_HEALTH_STATE["fail_streak"] = 2
        FakeAsyncClient.responses = [FakeResponse(502), FakeResponse(502), FakeResponse(502)]

        issues = await sentinel._check_mergeforge_health()

        self.assertEqual(len(issues), 1)
        self.assertEqual(issues[0]["level"], "critical")
        self.assertIn("indisponivel apos retries", issues[0]["title"])

    async def test_mergeforge_health_suppresses_repeated_alerts_during_cooldown(self) -> None:
        sentinel._MERGEFORGE_HEALTH_STATE["fail_streak"] = 2
        sentinel._MERGEFORGE_HEALTH_STATE["last_alert_at"] = self.now
        sentinel._MERGEFORGE_HEALTH_STATE["last_alert_level"] = "critical"
        FakeAsyncClient.responses = [FakeResponse(502), FakeResponse(502), FakeResponse(502)]

        issues = await sentinel._check_mergeforge_health()

        self.assertEqual(issues, [])
        self.assertEqual(sentinel._MERGEFORGE_HEALTH_STATE["fail_streak"], 3)

        self.now = self.now + timedelta(seconds=601)
        FakeAsyncClient.reset()
        FakeAsyncClient.responses = [FakeResponse(502), FakeResponse(502), FakeResponse(502)]

        issues_after_cooldown = await sentinel._check_mergeforge_health()

        self.assertEqual(len(issues_after_cooldown), 1)
        self.assertEqual(issues_after_cooldown[0]["level"], "critical")