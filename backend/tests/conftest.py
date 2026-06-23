"""conftest.py — pytest 会话级钩子：汇总测试结果并生成 Markdown 验收报告。

设计要点：
1. 在 conftest 模块级维护 _REPORT 字典；
2. pytest_runtest_makereport 对每个测试用例结果写入；
3. pytest_sessionfinish 汇总并写入 tests/reports/cloud_hosted_e2e_<timestamp>.md。
"""

from __future__ import annotations

import logging
import os
from datetime import datetime
from pathlib import Path

# ---------- 1. 环境变量 ----------
for _k, _v in {
    "RL_LOGIN_LIMIT": "100000",
    "RL_AUTH_LIMIT": "100000",
    "RL_ANON_LIMIT": "100000",
    "RL_LOGIN_WINDOW": "3600",
    "RL_AUTH_WINDOW": "3600",
    "RL_ANON_WINDOW": "3600",
    "EMAIL_PROVIDER": "log",
    "SEND_WELCOME_EMAIL": "0",
}.items():
    os.environ.setdefault(_k, _v)

# ---------- 2. 会话级报告容器 ----------
_REPORT: dict = {
    "started_at": datetime.utcnow().isoformat(timespec="seconds"),
    "by_module": {},
    "failures": [],
    "total_passed": 0,
    "total_failed": 0,
    "total_skipped": 0,
}


def _record(module: str, name: str, status: str, detail: str = "") -> None:
    bucket = _REPORT["by_module"].setdefault(module, {"passed": 0, "failed": 0, "skipped": 0})
    bucket[status] = bucket.get(status, 0) + 1
    _REPORT["total_" + status] = _REPORT.get("total_" + status, 0) + 1
    if status == "failed":
        _REPORT["failures"].append({"module": module, "name": name, "detail": detail})


# ---------- 3. pytest 钩子 ----------
def pytest_runtest_makereport(item, call):
    """对每个测试用例的 call 阶段结果记录到 _REPORT。"""
    if call.when != "call":
        return None
    module = str(getattr(item, "parent", None)).replace("tests/", "") if item.parent else "unknown"
    # 更友好：只取类名 / 文件名
    try:
        module = item.nodeid.split("::")[0]
    except Exception:
        pass
    status = "failed" if call.excinfo else "passed"
    _record(
        module,
        item.name,
        status,
        detail=str(call.excinfo.value) if call.excinfo else "",
    )
    return None


def pytest_sessionfinish(session, exitstatus):
    """生成 Markdown 验收报告到 tests/reports/cloud_hosted_e2e_<timestamp>.md。"""
    try:
        reports_dir = Path(__file__).parent / "reports"
        reports_dir.mkdir(exist_ok=True)
        ts = datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")
        report_path = reports_dir / f"cloud_hosted_e2e_{ts}.md"

        total_passed = int(_REPORT.get("total_passed", 0))
        total_failed = int(_REPORT.get("total_failed", 0))
        total_skipped = int(_REPORT.get("total_skipped", 0))
        total = total_passed + total_failed + total_skipped
        rate = (total_passed / total) if total else 0.0
        rate_pct = f"{rate * 100:.1f}%"

        # 根据通过率给出缺陷级别建议
        if total == 0:
            severity = "LOW"
        elif rate >= 0.95:
            severity = "LOW"
        elif rate >= 0.80:
            severity = "MEDIUM"
        elif rate >= 0.60:
            severity = "HIGH"
        else:
            severity = "CRITICAL"

        lines: list[str] = []
        lines.append("# OpenMT 云托管版 \u00b7 端到端验收测试报告")
        lines.append("")
        lines.append(f"- 开始时间：{_REPORT.get('started_at', 'N/A')} UTC")
        lines.append(f"- 完成时间：{datetime.utcnow().isoformat(timespec='seconds')} UTC")
        lines.append(f"- 总用例数：**{total}**（通过 {total_passed}，失败 {total_failed}，跳过 {total_skipped}）")
        lines.append(f"- 总体通过率：**{rate_pct}**")
        lines.append(f"- 缺陷级别评估：**{severity}**")
        lines.append(f"- pytest exitstatus：`{exitstatus}`")
        lines.append("")
        lines.append("## 1. 分模块统计")
        lines.append("")
        lines.append("| 模块 | 用例数 | 通过 | 失败 | 跳过 | 通过率 |")
        lines.append("|------|-------|-----|-----|-----|-------|")
        by_mod = dict(_REPORT.get("by_module", {}))
        if by_mod:
            for module, stat in by_mod.items():
                passed = int(stat.get("passed", 0))
                failed = int(stat.get("failed", 0))
                skipped = int(stat.get("skipped", 0))
                m_total = passed + failed + skipped
                m_rate = f"{(passed / m_total * 100):.1f}%" if m_total else "N/A"
                lines.append(f"| {module} | {m_total} | {passed} | {failed} | {skipped} | {m_rate} |")
        else:
            lines.append("| (无统计) | 0 | 0 | 0 | 0 | - |")
        lines.append("")
        lines.append("## 2. 测试环境与范围")
        lines.append("")
        lines.append("### 2.1 环境")
        lines.append("")
        lines.append("- FastAPI + SQLAlchemy（每个用例独立 SQLite 测试数据库，完全隔离）")
        lines.append("- Rate limit memory store（测试期间放大到 100000，避免 429）")
        lines.append("- E-mail provider: `log`（记录到 logs/emails.log，不发送真实邮件）")
        lines.append("")
        lines.append("### 2.2 测试范围")
        lines.append("")
        lines.append("1. **账户注册与登录**（TC-1.1 ~ TC-1.9）")
        lines.append("   - 新用户注册 / 重复邮箱拒绝 / 弱密码与无效邮箱边界 / 登录成功 / 错误密码拒绝")
        lines.append("   - 注册后可通过 /api/v1/auth/token 获取 JWT")
        lines.append("")
        lines.append("2. **机构管理 & 成员邀请**（TC-2.x）")
        lines.append("   - 通过 /api/v1/organizations 新建机构")
        lines.append("   - /api/v1/organizations/<id>/members 邀请成员")
        lines.append("   - 对不存在的 org_id 应拒绝（返回 4xx）")
        lines.append("")
        lines.append("3. **核心模块 CRUD**")
        lines.append("   - 学员（students）：create / read / update / delete")
        lines.append("   - 硬件设备（hardware/devices）：create / read / update / delete")
        lines.append("")
        lines.append("4. **云端备份**（TC-3.12）")
        lines.append("   - GET / POST /api/v1/backups")
        lines.append("   - GET /api/v1/backups/<id>/status / POST rollback")
        lines.append("")
        lines.append("5. **许可证与到期提醒**（TC-3.13）")
        lines.append("   - `LicenseService.get_active_features_for_org()` 能正确返回功能标签")
        lines.append("   - `send_renewal_reminders()` 到期提醒任务可正常启动")
        lines.append("")
        lines.append("6. **安全 / 租户隔离**（TC-security）")
        lines.append("   - 根路径可访问（`GET /`）")
        lines.append("   - `SECRET_KEY`（或 API_SECRET）已在启动时可用")
        lines.append("   - 硬件设备接口基于 JWT 中 org_id 进行数据隔离，A 组织数据不出现在 B 组织中")
        lines.append("")
        lines.append("## 3. 操作建议与后续步骤")
        lines.append("")
        lines.append("1. 新增业务模块（如作业、考试、竞赛等）：优先补充 CRUD + 许可证绑定用例。")
        lines.append("2. CI 集成：在 `pytest tests/test_cloud_hosted_e2e.py` 基础上可追加 `--junitxml=reports/e2e.xml` 便于流水线展示。")
        lines.append("3. 发现权限 / 跨租户隔离类 bug：请在 `TestSecurityAndTenantIsolation` 中补充用例。")
        lines.append("4. 密码强度 / 邮箱格式：当前服务端未强制，建议在 `UserRegister` 中加入 `EmailStr` 与长度校验。")
        lines.append("")
        if _REPORT.get("failures"):
            lines.append("## 4. 失败用例清单")
            lines.append("")
            for idx, f in enumerate(_REPORT["failures"], start=1):
                lines.append(f"{idx}. **[{f.get('module', '')}] {f.get('name', '')}**")
                lines.append(f"   - 详情：`{f.get('detail', '')}`")
            lines.append("")
        else:
            lines.append("## 4. 失败用例清单")
            lines.append("")
            lines.append("（本次运行无失败用例）")
            lines.append("")
        lines.append(f"_Generated: {ts}_")

        report_path.write_text("\n".join(lines), encoding="utf-8")
        print(f"\n[E2E REPORT] \u5df2\u751f\u6210 -> {report_path}")
    except Exception as exc:  # noqa: BLE001
        logging.getLogger(__name__).warning("写验收报告失败: %s", exc)
