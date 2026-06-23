"""OpenMTSciEd 统一检索与深链测试"""

from unittest.mock import MagicMock, patch

from models.license import Organization
from models.resource import ResourceFormat, ResourceType, TeachingResource
from services.opensciedu_client import build_topic_studio_url, normalize_web_base
from services.opensciedu_search_service import unified_search


def test_normalize_web_base_from_api():
    assert normalize_web_base("", "https://example.com/api") == "https://example.com"
    assert normalize_web_base("https://custom.app", "") == "https://custom.app"


def test_build_topic_studio_url():
    with patch("services.opensciedu_client.settings") as mock_settings:
        mock_settings.OPENSCIEDU_WEB_BASE = "https://scied.test"
        mock_settings.OPENSCIEDU_API_BASE = "https://scied.test/api"
        assert build_topic_studio_url() == "https://scied.test/topic-studio"
        assert build_topic_studio_url("abc") == "https://scied.test/topic-studio/abc"


def test_unified_search_merges_local_and_scied():
    org = Organization(
        id=1,
        name="Org",
        contact_email="a@b.com",
        opensciedu_api_enabled=True,
        opensciedu_api_key="key",
    )
    local_row = TeachingResource(
        id=10,
        org_id=1,
        name="Arduino 入门",
        category="机器人",
        resource_type=ResourceType.COURSEWARE,
        format=ResourceFormat.PDF,
        description="本地课件",
        tags="arduino",
    )

    mock_db = MagicMock()
    mock_db.query.return_value.filter.return_value.order_by.return_value.limit.return_value.all.return_value = [
        local_row
    ]

    scied_payload = {
        "data": [
            {
                "id": "t1",
                "title": "Python 教程",
                "description": "SciEd",
                "type": "tutorial",
                "source": "OpenMTSciEd",
                "subject": "编程",
                "grade_level": "9-12",
                "score": 80,
            }
        ]
    }

    with patch("services.opensciedu_search_service.is_integration_enabled", return_value=True):
        with patch("services.opensciedu_search_service.get_client_for_org") as mock_client:
            mock_client.return_value.search_libraries.return_value = scied_payload
            result = unified_search(mock_db, org, 1, "Arduino", limit=10)

    assert result["total"] >= 1
    assert result["sources"]["local"] == 1
    assert result["sources"]["scied"] == 1
    assert result["items"][0]["score"] >= result["items"][1]["score"]
