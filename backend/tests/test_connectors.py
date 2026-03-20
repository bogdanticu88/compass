import json
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from app.connectors.base import BaseConnector, EvidenceItem, CONNECTOR_REGISTRY
from app.connectors.manual import ManualConnector
from app.connectors.github import GitHubConnector


def test_evidence_item_fields():
    item = EvidenceItem(control_id="c1", source="github", payload='{"runs": []}')
    assert item.control_id == "c1"
    assert item.source == "github"
    assert item.status == "collected"


def test_manual_connector_registered():
    assert "manual" in CONNECTOR_REGISTRY


def test_manual_connector_evidence_types():
    c = ManualConnector()
    assert len(c.evidence_types) == 0  # manual handles everything — types checked at runtime


@pytest.mark.asyncio
async def test_manual_connector_collect_returns_empty():
    c = ManualConnector()
    result = await c.collect("system-1", {})
    assert result == []


def test_github_connector_registered():
    assert "github" in CONNECTOR_REGISTRY


def make_mock_response(data, status: int = 200):
    mock = MagicMock()
    mock.status_code = status
    mock.json.return_value = data
    mock.raise_for_status = MagicMock()
    return mock


@pytest.mark.asyncio
async def test_github_connector_returns_evidence_for_matching_controls():
    runs_response = {
        "workflow_runs": [
            {"id": 1, "name": "CI", "status": "completed", "conclusion": "success", "created_at": "2026-01-01T00:00:00Z"},
        ]
    }
    releases_response = [
        {"tag_name": "v1.0.0", "published_at": "2026-01-01T00:00:00Z", "name": "Initial release"},
    ]

    mock_client = AsyncMock()
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)
    mock_client.get = AsyncMock(side_effect=[
        make_mock_response(runs_response),
        make_mock_response(releases_response),
    ])

    mock_controls = [
        MagicMock(id="c1", evidence_types=["audit_logs"]),
        MagicMock(id="c2", evidence_types=["model_versioning_records"]),
        MagicMock(id="c3", evidence_types=["risk_register"]),  # not covered by GitHub
    ]

    connector = GitHubConnector()
    with patch("app.connectors.github.httpx.AsyncClient", return_value=mock_client):
        with patch("app.connectors.github.get_controls_for_types", return_value=mock_controls):
            items = await connector.collect("system-1", {"repo": "org/repo", "token": "ghp_test"})

    covered_ids = {item.control_id for item in items}
    assert "c1" in covered_ids
    assert "c2" in covered_ids
    assert "c3" not in covered_ids
    assert all(item.source == "github" for item in items)


@pytest.mark.asyncio
async def test_github_connector_handles_api_error_gracefully():
    mock_client = AsyncMock()
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)
    mock_client.get = AsyncMock(side_effect=Exception("Connection refused"))

    connector = GitHubConnector()
    with patch("app.connectors.github.httpx.AsyncClient", return_value=mock_client):
        with patch("app.connectors.github.get_controls_for_types", return_value=[]):
            items = await connector.collect("system-1", {"repo": "org/repo", "token": "ghp_test"})

    assert items == []


@pytest.mark.asyncio
async def test_github_connector_missing_config_returns_empty():
    connector = GitHubConnector()
    items = await connector.collect("system-1", {})  # no token, no repo
    assert items == []


from app.connectors.azure_devops import AzureDevOpsConnector


def test_azure_devops_registered():
    assert "azure_devops" in CONNECTOR_REGISTRY


def test_azure_devops_evidence_types():
    c = AzureDevOpsConnector()
    assert "audit_logs" in c.evidence_types
    assert "model_versioning_records" in c.evidence_types


@pytest.mark.asyncio
async def test_azure_devops_returns_evidence_for_matching_controls():
    builds_response = {
        "value": [
            {"id": 1, "buildNumber": "20260101.1", "status": "completed",
             "result": "succeeded", "startTime": "2026-01-01T00:00:00Z"},
        ]
    }
    releases_response = {
        "value": [
            {"id": 1, "name": "Release-1", "createdOn": "2026-01-01T00:00:00Z",
             "releaseDefinition": {"name": "Production Release"}},
        ]
    }

    mock_client = AsyncMock()
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)
    mock_client.get = AsyncMock(side_effect=[
        make_mock_response(builds_response),
        make_mock_response(releases_response),
    ])

    mock_controls = [
        MagicMock(id="c1", evidence_types=["audit_logs"]),
        MagicMock(id="c2", evidence_types=["model_versioning_records"]),
        MagicMock(id="c3", evidence_types=["risk_register"]),  # not covered
    ]

    connector = AzureDevOpsConnector()
    with patch("app.connectors.azure_devops.httpx.AsyncClient", return_value=mock_client):
        with patch("app.connectors.azure_devops.get_controls_for_types", return_value=mock_controls):
            items = await connector.collect(
                "system-1",
                {"organization": "myorg", "project": "myproject", "token": "pat_token"},
            )

    covered_ids = {item.control_id for item in items}
    assert "c1" in covered_ids
    assert "c2" in covered_ids
    assert "c3" not in covered_ids
    assert all(item.source == "azure_devops" for item in items)


@pytest.mark.asyncio
async def test_azure_devops_handles_api_error_gracefully():
    mock_client = AsyncMock()
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)
    mock_client.get = AsyncMock(side_effect=Exception("Connection refused"))

    connector = AzureDevOpsConnector()
    with patch("app.connectors.azure_devops.httpx.AsyncClient", return_value=mock_client):
        with patch("app.connectors.azure_devops.get_controls_for_types", return_value=[]):
            items = await connector.collect(
                "system-1",
                {"organization": "myorg", "project": "myproject", "token": "pat_token"},
            )

    assert items == []


@pytest.mark.asyncio
async def test_azure_devops_missing_config_returns_empty():
    connector = AzureDevOpsConnector()
    items = await connector.collect("system-1", {})  # no org/project/token
    assert items == []


from app.connectors.jira import JiraConnector


def test_jira_registered():
    assert "jira" in CONNECTOR_REGISTRY


def test_jira_evidence_types():
    c = JiraConnector()
    assert "audit_logs" in c.evidence_types
    assert "incident_records" in c.evidence_types


@pytest.mark.asyncio
async def test_jira_returns_evidence_for_matching_controls():
    search_response = {
        "issues": [
            {
                "key": "RISK-1",
                "fields": {
                    "summary": "Risk assessment for model deployment",
                    "status": {"name": "Open"},
                    "issuetype": {"name": "Story"},
                    "created": "2026-01-01T00:00:00.000+0000",
                },
            },
            {
                "key": "INC-5",
                "fields": {
                    "summary": "Model drift detected in production",
                    "status": {"name": "In Progress"},
                    "issuetype": {"name": "Bug"},
                    "created": "2026-01-15T00:00:00.000+0000",
                },
            },
        ]
    }

    mock_client = AsyncMock()
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)
    mock_client.get = AsyncMock(return_value=make_mock_response(search_response))

    mock_controls = [
        MagicMock(id="c1", evidence_types=["audit_logs"]),
        MagicMock(id="c2", evidence_types=["incident_records"]),
        MagicMock(id="c3", evidence_types=["risk_register"]),  # not covered by Jira
    ]

    connector = JiraConnector()
    with patch("app.connectors.jira.httpx.AsyncClient", return_value=mock_client):
        with patch("app.connectors.jira.get_controls_for_types", return_value=mock_controls):
            items = await connector.collect(
                "system-1",
                {
                    "base_url": "https://myorg.atlassian.net",
                    "email": "user@example.com",
                    "api_token": "jira_token",
                    "project_key": "RISK",
                },
            )

    covered_ids = {item.control_id for item in items}
    assert "c1" in covered_ids
    assert "c2" in covered_ids
    assert "c3" not in covered_ids
    assert all(item.source == "jira" for item in items)


@pytest.mark.asyncio
async def test_jira_handles_api_error_gracefully():
    mock_client = AsyncMock()
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)
    mock_client.get = AsyncMock(side_effect=Exception("Connection refused"))

    connector = JiraConnector()
    with patch("app.connectors.jira.httpx.AsyncClient", return_value=mock_client):
        with patch("app.connectors.jira.get_controls_for_types", return_value=[]):
            items = await connector.collect(
                "system-1",
                {
                    "base_url": "https://myorg.atlassian.net",
                    "email": "user@example.com",
                    "api_token": "jira_token",
                    "project_key": "RISK",
                },
            )

    assert items == []


@pytest.mark.asyncio
async def test_jira_missing_config_returns_empty():
    connector = JiraConnector()
    items = await connector.collect("system-1", {})
    assert items == []


from app.connectors.servicenow import ServiceNowConnector


def test_servicenow_registered():
    assert "servicenow" in CONNECTOR_REGISTRY


def test_servicenow_evidence_types():
    c = ServiceNowConnector()
    assert "audit_logs" in c.evidence_types
    assert "incident_records" in c.evidence_types
    assert "model_versioning_records" in c.evidence_types


@pytest.mark.asyncio
async def test_servicenow_returns_evidence_for_matching_controls():
    change_response = {
        "result": [
            {"number": "CHG001", "short_description": "Deploy AI model v2",
             "state": "closed", "opened_at": "2026-01-01 00:00:00"},
        ]
    }
    incident_response = {
        "result": [
            {"number": "INC001", "short_description": "Model accuracy degradation",
             "state": "resolved", "opened_at": "2026-01-10 00:00:00"},
        ]
    }
    risk_response = {
        "result": [
            {"name": "Bias Risk", "short_description": "Potential bias in training data",
             "risk_rating": "high", "opened_at": "2026-01-05 00:00:00"},
        ]
    }

    mock_client = AsyncMock()
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)
    mock_client.get = AsyncMock(side_effect=[
        make_mock_response(change_response),
        make_mock_response(incident_response),
        make_mock_response(risk_response),
    ])

    mock_controls = [
        MagicMock(id="c1", evidence_types=["audit_logs"]),
        MagicMock(id="c2", evidence_types=["incident_records"]),
        MagicMock(id="c3", evidence_types=["model_versioning_records"]),
        MagicMock(id="c4", evidence_types=["bias_test_reports"]),  # not covered
    ]

    connector = ServiceNowConnector()
    with patch("app.connectors.servicenow.httpx.AsyncClient", return_value=mock_client):
        with patch("app.connectors.servicenow.get_controls_for_types", return_value=mock_controls):
            items = await connector.collect(
                "system-1",
                {
                    "instance_url": "https://myinstance.service-now.com",
                    "username": "admin",
                    "password": "password",
                },
            )

    covered_ids = {item.control_id for item in items}
    assert "c1" in covered_ids
    assert "c2" in covered_ids
    assert "c3" in covered_ids
    assert "c4" not in covered_ids
    assert all(item.source == "servicenow" for item in items)


@pytest.mark.asyncio
async def test_servicenow_handles_api_error_gracefully():
    mock_client = AsyncMock()
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)
    mock_client.get = AsyncMock(side_effect=Exception("Connection refused"))

    connector = ServiceNowConnector()
    with patch("app.connectors.servicenow.httpx.AsyncClient", return_value=mock_client):
        with patch("app.connectors.servicenow.get_controls_for_types", return_value=[]):
            items = await connector.collect(
                "system-1",
                {
                    "instance_url": "https://myinstance.service-now.com",
                    "username": "admin",
                    "password": "password",
                },
            )

    assert items == []


@pytest.mark.asyncio
async def test_servicenow_missing_config_returns_empty():
    connector = ServiceNowConnector()
    items = await connector.collect("system-1", {})
    assert items == []


from app.connectors.aws import AWSConnector

def test_aws_connector_registered():
    assert "aws" in CONNECTOR_REGISTRY


def test_aws_connector_evidence_types():
    c = AWSConnector()
    assert "audit_logs" in c.evidence_types
    assert "model_versioning_records" in c.evidence_types
    assert "monitoring_logs" in c.evidence_types


@pytest.mark.asyncio
async def test_aws_connector_missing_config_returns_empty():
    connector = AWSConnector()
    items = await connector.collect("system-1", {})
    assert items == []


@pytest.mark.asyncio
async def test_aws_connector_returns_evidence_for_matching_controls():
    mock_cloudtrail = MagicMock()
    mock_cloudtrail.lookup_events.return_value = {
        "Events": [
            {"EventId": "e1", "EventName": "PutObject", "EventTime": "2026-01-01T00:00:00Z", "Username": "user1"},
        ]
    }
    mock_sagemaker = MagicMock()
    mock_sagemaker.list_model_packages.return_value = {
        "ModelPackageSummaryList": [
            {"ModelPackageName": "model-v1", "CreationTime": "2026-01-01T00:00:00Z", "ModelPackageStatus": "Completed"},
        ]
    }
    mock_config_svc = MagicMock()
    mock_config_svc.get_compliance_summary_by_config_rule.return_value = {
        "ComplianceSummariesByConfigRule": []
    }

    def mock_boto3_client(service, **kwargs):
        if service == "cloudtrail":
            return mock_cloudtrail
        if service == "sagemaker":
            return mock_sagemaker
        if service == "config":
            return mock_config_svc
        raise ValueError(f"Unexpected service: {service}")

    mock_controls = [
        MagicMock(id="c1", evidence_types=["audit_logs"]),
        MagicMock(id="c2", evidence_types=["model_versioning_records"]),
    ]

    connector = AWSConnector()
    with patch("app.connectors.aws.boto3.client", side_effect=mock_boto3_client):
        with patch("app.connectors.aws.get_controls_for_types", return_value=mock_controls):
            items = await connector.collect(
                "system-1",
                {"access_key_id": "AKIATEST", "secret_access_key": "secret", "region": "us-east-1"},
            )

    assert len(items) > 0
    assert all(item.source == "aws" for item in items)


@pytest.mark.asyncio
async def test_aws_connector_handles_error_gracefully():
    def mock_boto3_client(service, **kwargs):
        raise Exception("Connection refused")

    connector = AWSConnector()
    with patch("app.connectors.aws.boto3.client", side_effect=mock_boto3_client):
        items = await connector.collect(
            "system-1",
            {"access_key_id": "AKIATEST", "secret_access_key": "secret", "region": "us-east-1"},
        )

    assert items == []


from app.connectors.azure import AzureConnector

def test_azure_connector_registered():
    assert "azure" in CONNECTOR_REGISTRY


def test_azure_connector_evidence_types():
    c = AzureConnector()
    assert "audit_logs" in c.evidence_types
    assert "monitoring_logs" in c.evidence_types


@pytest.mark.asyncio
async def test_azure_connector_missing_config_returns_empty():
    connector = AzureConnector()
    items = await connector.collect("system-1", {})
    assert items == []


@pytest.mark.asyncio
async def test_azure_connector_returns_evidence_for_matching_controls():
    token_response = {"access_token": "mock-token", "token_type": "Bearer"}
    resources_response = {
        "value": [
            {"id": "/subscriptions/sub1/resourceGroups/rg1/providers/Microsoft.Compute/virtualMachines/vm1",
             "name": "vm1", "type": "Microsoft.Compute/virtualMachines", "location": "westeurope"},
        ]
    }
    role_assignments_response = {
        "value": [
            {"id": "/subscriptions/sub1/providers/Microsoft.Authorization/roleAssignments/ra1",
             "properties": {"roleDefinitionId": "/providers/Microsoft.Authorization/roleDefinitions/b24988ac",
                            "principalId": "user-guid"}},
        ]
    }
    policy_response = {"value": []}

    mock_client = AsyncMock()
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)
    mock_client.post = AsyncMock(return_value=make_mock_response(token_response))
    mock_client.get = AsyncMock(side_effect=[
        make_mock_response(resources_response),
        make_mock_response(role_assignments_response),
        make_mock_response(policy_response),
    ])

    mock_controls = [
        MagicMock(id="c1", evidence_types=["audit_logs"]),
        MagicMock(id="c2", evidence_types=["monitoring_logs"]),
    ]

    connector = AzureConnector()
    with patch("app.connectors.azure.httpx.AsyncClient", return_value=mock_client):
        with patch("app.connectors.azure.get_controls_for_types", return_value=mock_controls):
            items = await connector.collect(
                "system-1",
                {
                    "tenant_id": "tenant-123",
                    "client_id": "client-456",
                    "client_secret": "secret",
                    "subscription_id": "sub-789",
                },
            )

    assert len(items) > 0
    assert all(item.source == "azure" for item in items)


@pytest.mark.asyncio
async def test_azure_connector_handles_api_error_gracefully():
    mock_client = AsyncMock()
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)
    mock_client.post = AsyncMock(side_effect=Exception("Connection refused"))

    connector = AzureConnector()
    with patch("app.connectors.azure.httpx.AsyncClient", return_value=mock_client):
        items = await connector.collect(
            "system-1",
            {"tenant_id": "t", "client_id": "c", "client_secret": "s", "subscription_id": "sub"},
        )

    assert items == []
