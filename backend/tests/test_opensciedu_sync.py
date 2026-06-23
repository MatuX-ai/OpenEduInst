"""OpenMTSciEd Celery 同步任务单元测试"""

from datetime import datetime
from unittest.mock import MagicMock, patch

from models.license import Organization
from tasks.opensciedu_sync_tasks import sync_opensciedu_for_org


def test_sync_skips_when_integration_disabled():
    org = Organization(
        id=1,
        name="Test",
        contact_email="a@b.com",
        opensciedu_api_enabled=False,
    )
    mock_db = MagicMock()
    mock_db.query.return_value.filter.return_value.first.return_value = org

    with patch("utils.database.SessionLocal", return_value=mock_db):
        with patch("services.opensciedu_client.is_integration_enabled", return_value=False):
            result = sync_opensciedu_for_org(1)

    assert result["status"] == "skipped"
    mock_db.close.assert_called()


def test_sync_success_updates_org():
    org = Organization(
        id=2,
        name="SciEd Org",
        contact_email="b@c.com",
        opensciedu_api_enabled=True,
        opensciedu_api_key="key",
        opensciedu_api_config={},
    )
    mock_db = MagicMock()
    mock_db.query.return_value.filter.return_value.first.return_value = org

    mock_client = MagicMock()
    mock_client.get_stats.return_value = {
        "tutorials": 10,
        "coursewares": 5,
        "hardware_projects": 2,
    }
    mock_client.get_tutorials.return_value = {"items": [{"id": "t1", "title": "Intro"}]}

    with patch("utils.database.SessionLocal", return_value=mock_db):
        with patch("services.opensciedu_client.is_integration_enabled", return_value=True):
            with patch("services.opensciedu_client.get_client_for_org", return_value=mock_client):
                with patch("utils.opensciedu_cache.invalidate_org", return_value=1):
                    with patch("utils.opensciedu_cache.set_cached"):
                        result = sync_opensciedu_for_org(2)

    assert result["status"] == "success"
    assert org.opensciedu_sync_status == "success"
    assert org.opensciedu_api_config["cached_stats"]["tutorials"] == 10
    assert org.opensciedu_last_sync is not None
    assert isinstance(org.opensciedu_last_sync, datetime)
