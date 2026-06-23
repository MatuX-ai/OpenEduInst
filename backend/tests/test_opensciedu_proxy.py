"""OpenMTSciEd 代理层单元测试"""

from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from services.opensciedu_client import (
    OpenSciEdClient,
    OpenSciEdIntegrationError,
    is_integration_enabled,
    normalize_api_root,
    require_integration,
    rewrite_cdn_urls,
)
from models.license import Organization


def test_normalize_api_root_variants():
    assert normalize_api_root("https://example.com/api/v1") == "https://example.com/api/v1"
    assert normalize_api_root("https://example.com/api") == "https://example.com/api/v1"
    assert normalize_api_root("https://example.com") == "https://example.com/api/v1"


def test_is_integration_enabled_org_flag():
    org = Organization(
        name="Test Org",
        contact_email="a@b.com",
        opensciedu_api_enabled=True,
        opensciedu_api_key="key",
    )
    assert is_integration_enabled(org) is True


def test_require_integration_raises_when_disabled():
    org = Organization(
        name="Test Org",
        contact_email="a@b.com",
        opensciedu_api_enabled=False,
    )
    with patch("services.opensciedu_client.settings") as mock_settings:
        mock_settings.OPENSCIEDU_API_KEY = ""
        with pytest.raises(OpenSciEdIntegrationError) as exc:
            require_integration(org)
        assert exc.value.code == "OPENSCIEDU_DISABLED"


def test_rewrite_cdn_urls():
    data = {"file_url": "/files/a.pdf", "nested": {"thumbnail_url": "img/x.png"}}
    with patch("services.opensciedu_client.settings") as mock_settings:
        mock_settings.OPENSCIEDU_CDN_BASE = "https://cdn.example.com"
        out = rewrite_cdn_urls(data)
    assert out["file_url"] == "https://cdn.example.com/files/a.pdf"
    assert out["nested"]["thumbnail_url"] == "https://cdn.example.com/img/x.png"


def test_client_get_tutorials():
    client = OpenSciEdClient("test-key")
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.content = b'{"items": [], "total": 0}'
    mock_response.json.return_value = {"items": [], "total": 0}

    with patch("services.opensciedu_client.httpx.Client") as mock_client_cls:
        instance = mock_client_cls.return_value.__enter__.return_value
        instance.request.return_value = mock_response
        result = client.get_tutorials(page=1, size=5)
    assert result["total"] == 0
    instance.request.assert_called_once()
    call_kwargs = instance.request.call_args
    assert "/tutorials" in call_kwargs[0][1]
