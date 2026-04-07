from __future__ import annotations

import sys
from pathlib import Path
import unittest


BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

import incident_ops
import ops_runtime


class IncidentOpsTests(unittest.TestCase):
    def test_track_incident_correlates_same_signature(self) -> None:
        active_incidents: dict[str, incident_ops.IncidentState] = {}

        incident_one, mode_one = incident_ops.track_incident(
            active_incidents,
            "Falha no cron de cobrança",
            "Cron falhou às 10:15 com pedido 123456",
            "warning",
        )
        incident_two, mode_two = incident_ops.track_incident(
            active_incidents,
            "Falha no cron de cobrança",
            "Cron falhou às 10:20 com pedido 987654",
            "critical",
        )

        self.assertEqual(mode_one, "new")
        self.assertEqual(mode_two, "update")
        self.assertEqual(len(active_incidents), 1)
        self.assertEqual(incident_one.incident_key, incident_two.incident_key)
        self.assertEqual(incident_two.occurrences, 2)
        self.assertEqual(incident_two.severity, "critical")

    def test_find_incident_by_prefix(self) -> None:
        incident = incident_ops.IncidentState(
            incident_key="ab12cd34ef56aa99",
            category="generic",
            severity="warning",
            title="Erro transitório",
            summary="Erro transitório",
            first_seen="2026-04-06T00:00:00+00:00",
            last_seen="2026-04-06T00:00:00+00:00",
            occurrences=1,
            suppressed_duplicates=0,
            notification_count=0,
        )

        match = incident_ops.find_incident_by_reference({incident.incident_key: incident}, "ab12cd34")
        self.assertIs(match, incident)

    def test_should_dispatch_zaea_task_for_critical_or_repeated_warning(self) -> None:
        critical = incident_ops.IncidentState(
            incident_key="i1",
            category="critical_generic",
            severity="critical",
            title="Banco indisponível",
            summary="Banco indisponível",
            first_seen="2026-04-06T00:00:00+00:00",
            last_seen="2026-04-06T00:00:00+00:00",
            occurrences=1,
            suppressed_duplicates=0,
            notification_count=0,
        )
        repeated = incident_ops.IncidentState(
            incident_key="i2",
            category="generic",
            severity="warning",
            title="Timeout na API",
            summary="Timeout na API",
            first_seen="2026-04-06T00:00:00+00:00",
            last_seen="2026-04-06T00:00:00+00:00",
            occurrences=3,
            suppressed_duplicates=0,
            notification_count=1,
        )

        self.assertTrue(incident_ops.should_dispatch_zaea_task(critical, "new", 3))
        self.assertTrue(incident_ops.should_dispatch_zaea_task(repeated, "update", 3))
        repeated.zaea_task_id = "task-1"
        self.assertFalse(incident_ops.should_dispatch_zaea_task(repeated, "update", 3))

    def test_should_dispatch_zaea_task_for_reopened_resolved_incident(self) -> None:
        reopened = incident_ops.IncidentState(
            incident_key="i3",
            category="generic",
            severity="warning",
            title="Webhook com timeout",
            summary="Webhook com timeout",
            first_seen="2026-04-06T00:00:00+00:00",
            last_seen="2026-04-06T00:00:00+00:00",
            occurrences=1,
            suppressed_duplicates=0,
            notification_count=0,
        )

        self.assertTrue(
            incident_ops.should_dispatch_zaea_task(
                reopened,
                "new",
                3,
                previous_record={
                    "status": "resolved",
                    "resolved_at": "2026-04-06T01:00:00+00:00",
                    "metadata": {"resolution_reason": "mitigated", "reopen_count": 1},
                },
            )
        )

    def test_build_reopen_metadata_increments_counter(self) -> None:
        metadata = incident_ops.build_reopen_metadata(
            {
                "status": "resolved",
                "resolved_at": "2026-04-06T01:00:00+00:00",
                "metadata": {
                    "resolution_reason": "config_fix",
                    "resolution_label": "Configuração corrigida",
                    "reopen_count": 2,
                },
            }
        )

        self.assertTrue(metadata["reopened"])
        self.assertEqual(metadata["reopen_count"], 3)
        self.assertEqual(metadata["previous_resolution_reason"], "config_fix")

    def test_resolution_metadata_defaults_to_manual_ack(self) -> None:
        metadata = incident_ops.build_zaea_resolution_metadata("invalid_reason", "observado", "api")

        self.assertEqual(metadata["resolution_reason"], "manual_ack")
        self.assertEqual(metadata["resolution_source"], "api")
        self.assertEqual(metadata["resolution_note"], "observado")


class FakeResponse:
    def __init__(self, status_code: int, data=None):
        self.status_code = status_code
        self._data = data if data is not None else []

    def json(self):
        return self._data


class FakeAsyncClient:
    responses: dict[tuple[str, str], list[FakeResponse]] = {}
    requests: list[tuple[str, str, dict, dict | None]] = []

    def __init__(self, timeout: int = 15):
        self.timeout = timeout

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc, tb):
        return False

    @classmethod
    def reset(cls) -> None:
        cls.responses = {}
        cls.requests = []

    @classmethod
    def queue(cls, method: str, url: str, *responses: FakeResponse) -> None:
        cls.responses[(method.upper(), url)] = list(responses)

    async def get(self, url: str, params=None, headers=None, timeout=None):
        return self._consume("GET", url, params=params, headers=headers)

    async def post(self, url: str, params=None, headers=None, json=None):
        return self._consume("POST", url, params=params, headers=headers, json=json)

    async def patch(self, url: str, params=None, headers=None, json=None):
        return self._consume("PATCH", url, params=params, headers=headers, json=json)

    def _consume(self, method: str, url: str, params=None, headers=None, json=None):
        self.requests.append((method, url, params or {}, json))
        key = (method, url)
        if key not in self.responses or not self.responses[key]:
            raise AssertionError(f"Resposta fake ausente para {method} {url}")
        return self.responses[key].pop(0)


class OpsRuntimeZaeaTests(unittest.IsolatedAsyncioTestCase):
    def setUp(self) -> None:
        self.original_client = ops_runtime.httpx.AsyncClient
        self.original_url = ops_runtime.SUPABASE_URL
        self.original_key = ops_runtime.SUPABASE_SERVICE_ROLE_KEY
        ops_runtime.httpx.AsyncClient = FakeAsyncClient
        ops_runtime.SUPABASE_URL = "https://supabase.test"
        ops_runtime.SUPABASE_SERVICE_ROLE_KEY = "service-role"
        FakeAsyncClient.reset()

    def tearDown(self) -> None:
        ops_runtime.httpx.AsyncClient = self.original_client
        ops_runtime.SUPABASE_URL = self.original_url
        ops_runtime.SUPABASE_SERVICE_ROLE_KEY = self.original_key

    async def test_dispatch_zaea_incident_task_returns_id(self) -> None:
        FakeAsyncClient.queue(
            "POST",
            "https://supabase.test/rest/v1/agent_tasks",
            FakeResponse(201, [{"id": "task-123"}]),
        )

        task_id = await ops_runtime.dispatch_zaea_incident_task(
            agent_name="sentinel",
            incident_key="inc-1",
            payload={"title": "Falha"},
        )

        self.assertEqual(task_id, "task-123")
        _, _, _, payload = FakeAsyncClient.requests[0]
        self.assertEqual(payload["task_type"], "incident_response")
        self.assertEqual(payload["input"]["incident_key"], "inc-1")

    async def test_fetch_incident_state_returns_first_row(self) -> None:
        FakeAsyncClient.queue(
            "GET",
            "https://supabase.test/rest/v1/ops_incidents",
            FakeResponse(200, [{"incident_key": "inc-1", "status": "resolved"}]),
        )

        row = await ops_runtime.fetch_incident_state("inc-1")

        self.assertEqual(row, {"incident_key": "inc-1", "status": "resolved"})

    async def test_close_zaea_incident_task_updates_existing_knowledge(self) -> None:
        FakeAsyncClient.queue(
            "PATCH",
            "https://supabase.test/rest/v1/agent_tasks",
            FakeResponse(204, []),
        )
        FakeAsyncClient.queue(
            "GET",
            "https://supabase.test/rest/v1/agent_knowledge",
            FakeResponse(200, [{"id": "knowledge-1", "occurrences": 4}]),
        )
        FakeAsyncClient.queue(
            "PATCH",
            "https://supabase.test/rest/v1/agent_knowledge",
            FakeResponse(204, []),
        )

        result = await ops_runtime.close_zaea_incident_task(
            task_id="task-123",
            output={"incident_key": "inc-1"},
            knowledge={
                "pattern": "incident:generic:falha",
                "rootCause": "Timeout externo",
                "solution": "Reconhecido manualmente",
                "filesChanged": [],
                "confidence": 70,
                "outcome": "success",
            },
        )

        self.assertTrue(result)
        self.assertEqual(len(FakeAsyncClient.requests), 3)
        _, _, _, knowledge_payload = FakeAsyncClient.requests[2]
        self.assertEqual(knowledge_payload["occurrences"], 5)

    async def test_close_zaea_incident_task_creates_new_knowledge(self) -> None:
        FakeAsyncClient.queue(
            "PATCH",
            "https://supabase.test/rest/v1/agent_tasks",
            FakeResponse(204, []),
        )
        FakeAsyncClient.queue(
            "GET",
            "https://supabase.test/rest/v1/agent_knowledge",
            FakeResponse(200, []),
        )
        FakeAsyncClient.queue(
            "POST",
            "https://supabase.test/rest/v1/agent_knowledge",
            FakeResponse(201, []),
        )

        result = await ops_runtime.close_zaea_incident_task(
            task_id="task-456",
            output={"incident_key": "inc-2"},
            knowledge={
                "pattern": "incident:cron_failure:falha",
                "rootCause": "Job interrompido",
                "solution": "Mitigado operacionalmente",
                "filesChanged": [],
                "confidence": 60,
                "outcome": "success",
            },
        )

        self.assertTrue(result)
        _, _, _, knowledge_payload = FakeAsyncClient.requests[2]
        self.assertEqual(knowledge_payload["occurrences"], 1)
        self.assertEqual(knowledge_payload["last_task_id"], "task-456")


if __name__ == "__main__":
    unittest.main()