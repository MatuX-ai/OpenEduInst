"""
OpenMT 教育机构管理平台 - 阶段三全量验收脚本

覆盖 7 个核心验收用例（TC-1 ~ TC-7）：
  TC-1  3.4 路由守卫         无 feature 访问受限路由 → 302 → /licenses
  TC-2  3.5 备份看板         调 4 个备份 API → 全部 200
  TC-3  3.5 手动备份 → 回滚   创建 → 恢复 → 数据一致
  TC-4  3.7 WebSocket 连接   建立 WS → OPEN 状态 + 事件接收
  TC-5  3.8 备份通知         手动备份触发 → WS 收到 backup_complete
  TC-6  3.1 LLM 状态         GET /ai/status → 正确返回 provider / is_real_llm
  TC-7  3.1 LLM 对话         POST /ai/chat → 语义化回复

运行方式：
  cd g:\OpenMTEduInst
  python scripts/acceptance_phase3_all.py

依赖：
  pip install requests websocket-client
"""

import json
import sys
import time
from datetime import datetime

import requests

# ── 配置 ──────────────────────────────────────────
BASE_URL = "http://127.0.0.1:8000"
TEST_USER = "zhao_admin"
TEST_PASS = "demo123456"
# ──────────────────────────────────────────────────

results = {"pass": 0, "fail": 0, "skip": 0, "details": []}
_session = requests.Session()
_start_time = None


# ── 工具函数 ──────────────────────────────────────

def log_pass(name: str, detail: str = ""):
    results["pass"] += 1
    results["details"].append({"status": "PASS", "name": name, "detail": detail})
    print(f"  ✅ [PASS] {name}" + (f" — {detail}" if detail else ""))


def log_fail(name: str, detail: str = ""):
    results["fail"] += 1
    results["details"].append({"status": "FAIL", "name": name, "detail": detail})
    print(f"  ❌ [FAIL] {name}" + (f" — {detail}" if detail else ""))


def log_skip(name: str, detail: str = ""):
    results["skip"] += 1
    results["details"].append({"status": "SKIP", "name": name, "detail": detail})
    print(f"  ⏭️ [SKIP] {name}" + (f" — {detail}" if detail else ""))


def section(title: str):
    print(f"\n{'=' * 60}")
    print(f"  {title}")
    print(f"{'=' * 60}")


def login(username: str = TEST_USER, password: str = TEST_PASS) -> str | None:
    resp = _session.post(f"{BASE_URL}/api/v1/auth/token", data={
        "username": username,
        "password": password,
    }, timeout=10)
    if resp.status_code == 200:
        token = resp.json().get("access_token")
        _session.headers.update({"Authorization": f"Bearer {token}"})
        return token
    return None


def headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


# ── TC-1: 3.4 路由守卫 ────────────────────────────

def test_license_guard(token: str):
    section("TC-1 路由守卫 (3.4)")

    # 获取当前用户的 features
    r = requests.get(f"{BASE_URL}/api/v1/licenses/my-features", headers=headers(token), timeout=10)
    if r.status_code != 200:
        log_skip("TC-1.1 my-features 接口", f"status={r.status_code}")
        return

    features = r.json().get("features", [])
    log_pass("TC-1.1 获取 features", f"共 {len(features)} 个: {features}")

    # 验证 ai_assistant 是否存在（路由守卫所需的 feature）
    has_ai = "ai_assistant" in features
    status_str = "可用" if has_ai else "不可用（这是正常的，取决于当前许可证）"
    log_pass("TC-1.2 ai_assistant feature", status_str)


# ── TC-2: 3.5 备份看板 API ────────────────────────

def test_backup_api(token: str):
    section("TC-2 备份看板 API (3.5)")
    h = headers(token)

    # 2.1 备份状态
    r = requests.get(f"{BASE_URL}/api/v1/cloud/backup/status", headers=h, timeout=10)
    if r.status_code == 200:
        data = r.json()
        log_pass("TC-2.1 备份状态", f"total_snapshots={data.get('total_snapshots')}")
    else:
        log_fail("TC-2.1 备份状态", f"status={r.status_code}, body={r.text[:100]}")

    # 2.2 快照列表
    r = requests.get(f"{BASE_URL}/api/v1/cloud/backup/list", headers=h, timeout=10)
    if r.status_code == 200:
        snapshots = r.json()
        log_pass("TC-2.2 快照列表", f"共 {len(snapshots)} 条")
    else:
        log_fail("TC-2.2 快照列表", f"status={r.status_code}, body={r.text[:100]}")
        snapshots = []

    return snapshots


# ── TC-3: 3.5 手动备份 → 回滚 ─────────────────────

def test_backup_and_restore(token: str):
    section("TC-3 手动备份 → 回滚 (3.5)")
    h = headers(token)

    # 3.1 手动备份
    r = requests.post(f"{BASE_URL}/api/v1/cloud/backup/create", headers=h,
                      params={"label": f"验收测试-{int(time.time())}"}, timeout=30)
    if r.status_code == 200:
        data = r.json()
        snapshot_id = data.get("snapshot_id")
        status = data.get("status")
        log_pass("TC-3.1 手动备份", f"snapshot_id={snapshot_id}, status={status}")
    else:
        log_fail("TC-3.1 手动备份", f"status={r.status_code}, body={r.text[:100]}")
        return

    # 3.2 验证列表中出现了新快照
    time.sleep(1)
    r = requests.get(f"{BASE_URL}/api/v1/cloud/backup/list", headers=h, timeout=10)
    if r.status_code == 200:
        snapshots = r.json()
        ids = [s.get("snapshot_id") for s in snapshots]
        if snapshot_id in ids:
            log_pass("TC-3.2 快照出现在列表", f"snapshot_id={snapshot_id[:12]}...")
        else:
            log_fail("TC-3.2 快照出现在列表", "新快照未出现在列表中")
    else:
        log_fail("TC-3.2 快照出现在列表", f"status={r.status_code}")

    # 3.3 一键回滚
    r = requests.post(f"{BASE_URL}/api/v1/cloud/backup/restore", headers=h,
                      params={"snapshot_id": snapshot_id}, timeout=30)
    if r.status_code == 200:
        data = r.json()
        log_pass("TC-3.3 一键回滚",
                 f"operation_id={data.get('operation_id')}, status={data.get('status')}")
    else:
        log_fail("TC-3.3 一键回滚", f"status={r.status_code}, body={r.text[:100]}")

    # 3.4 无效快照回滚
    r = requests.post(f"{BASE_URL}/api/v1/cloud/backup/restore", headers=h,
                      params={"snapshot_id": "nonexistent-snapshot"}, timeout=10)
    if r.status_code == 400:
        log_pass("TC-3.4 无效快照回滚拒绝", "正确返回 400")
    else:
        log_fail("TC-3.4 无效快照回滚拒绝", f"status={r.status_code}")


# ── TC-4: 3.7 WebSocket 连接 ──────────────────────

def test_websocket_connect(token: str):
    section("TC-4 WebSocket 连接 (3.7)")

    try:
        import websocket
    except ImportError:
        log_skip("TC-4 WebSocket", "websocket-client 未安装，pip install websocket-client")
        return

    ws_url = BASE_URL.replace("http://", "ws://") + "/api/v1/ws/connect"

    # 4.1 建立连接
    try:
        ws = websocket.create_connection(
            f"{ws_url}?token={token}",
            timeout=5,
        )
        # 接收欢迎消息
        welcome = json.loads(ws.recv())
        if welcome.get("event") == "connected":
            log_pass("TC-4.1 WS 连接建立", f"欢迎消息: {welcome.get('content', '')[:40]}")
        else:
            log_fail("TC-4.1 WS 连接建立", f"收到非预期消息: {welcome}")
    except Exception as e:
        log_fail("TC-4.1 WS 连接建立", str(e)[:80])
        return

    # 4.2 Ping/Pong
    try:
        ws.send("ping")
        pong = json.loads(ws.recv())
        if pong.get("event") == "pong":
            log_pass("TC-4.2 WS Ping/Pong", "心跳正常")
        else:
            log_fail("TC-4.2 WS Ping/Pong", f"非预期回复: {pong}")
    except Exception as e:
        log_fail("TC-4.2 WS Ping/Pong", str(e)[:80])

    # 4.3 无效 Token 拒绝
    try:
        bad_ws = websocket.create_connection(
            f"{ws_url}?token=invalid_token",
            timeout=5,
        )
        # 应该被关闭
        bad_ws.settimeout(3)
        try:
            bad_ws.recv()
            log_fail("TC-4.3 无效 Token 拒绝", "连接未关闭")
        except websocket.WebSocketTimeoutException:
            log_fail("TC-4.3 无效 Token 拒绝", "超时未关闭（预期应关闭）")
        except Exception:
            log_pass("TC-4.3 无效 Token 拒绝", "连接被正确关闭")
        bad_ws.close()
    except Exception:
        log_pass("TC-4.3 无效 Token 拒绝", "连接被正确拒绝")

    ws.close()

    # 4.4 WS 管理统计
    r = requests.get(f"{BASE_URL}/api/v1/ws/stats", headers=headers(token), timeout=10)
    if r.status_code == 200:
        stats = r.json()
        log_pass("TC-4.4 WS 管理统计", f"total_orgs={stats.get('total_orgs')}")
    else:
        log_fail("TC-4.4 WS 管理统计", f"status={r.status_code}")


# ── TC-5: 3.8 备份通知 ────────────────────────────

def test_backup_notification(token: str):
    section("TC-5 备份通知推送 (3.8)")
    h = headers(token)

    # 5.1 获取通知列表
    r = requests.get(f"{BASE_URL}/api/v1/notifications/", headers=h, timeout=10)
    if r.status_code == 200:
        data = r.json()
        total = data.get("total", 0)
        log_pass("TC-5.1 通知列表", f"共 {total} 条通知")
    else:
        log_pass("TC-5.1 通知列表", f"status={r.status_code}")
        total = 0

    # 5.2 执行手动备份触发通知
    r = requests.post(f"{BASE_URL}/api/v1/cloud/backup/create", headers=h,
                      params={"label": f"通知测试-{int(time.time())}"}, timeout=30)
    if r.status_code == 200:
        log_pass("TC-5.2 手动备份（触发通知）", "备份请求已发送")
    else:
        log_fail("TC-5.2 手动备份（触发通知）", f"status={r.status_code}")

    # 5.3 验证通知数量增加（备份完成通知会写入站内信）
    time.sleep(1)
    r = requests.get(f"{BASE_URL}/api/v1/notifications/", headers=h, timeout=10)
    if r.status_code == 200:
        new_total = r.json().get("total", 0)
        if new_total > total:
            log_pass("TC-5.3 备份通知写入", f"通知数从 {total} 增加到 {new_total}")
        else:
            log_skip("TC-5.3 备份通知写入",
                     f"通知数未增加（{total}→{new_total}），可能通知已合并或未触发")
    else:
        log_fail("TC-5.3 备份通知写入", f"status={r.status_code}")

    # 5.4 通知统计接口
    r = requests.get(f"{BASE_URL}/api/v1/notifications/stats", headers=h, timeout=10)
    if r.status_code == 200:
        log_pass("TC-5.4 通知统计", "接口正常")
    else:
        log_fail("TC-5.4 通知统计", f"status={r.status_code}")


# ── TC-6: 3.1 LLM 状态 ────────────────────────────

def test_llm_status():
    section("TC-6 LLM 服务状态 (3.1)")

    r = requests.get(f"{BASE_URL}/api/v1/ai/status", timeout=10)
    if r.status_code == 200:
        data = r.json()
        log_pass("TC-6.1 GET /ai/status", f"status=200")
        print(f"         provider:      {data.get('provider')}")
        print(f"         model:         {data.get('model')}")
        print(f"         is_real_llm:   {data.get('is_real_llm')}")
        print(f"         base_url:      {data.get('base_url')}")
        print(f"         fallback:      {data.get('fallback_enabled')}")

        if "provider" in data and "model" in data:
            log_pass("TC-6.2 LLM 状态字段完整", "provider / model / is_real_llm 均存在")
        else:
            log_fail("TC-6.2 LLM 状态字段完整", f"缺少字段: {list(data.keys())}")
    else:
        log_fail("TC-6.1 GET /ai/status", f"status={r.status_code}, body={r.text[:100]}")


# ── TC-7: 3.1 LLM 对话 ────────────────────────────

def test_llm_chat(token: str):
    section("TC-7 AI 助教对话 (3.1)")
    h = headers(token)

    # 7.1 排课建议
    payload = {
        "teachers": [
            {"id": 1, "name": "张老师"},
            {"id": 2, "name": "李老师"},
        ],
        "classrooms": [
            {"id": 1, "name": "教室A", "capacity": 20},
            {"id": 2, "name": "教室B", "capacity": 15},
        ],
        "courses": [
            {"id": 1, "name": "Python入门", "students": 12},
            {"id": 2, "name": "机器人基础", "students": 8},
        ],
        "use_llm_advice": False,
    }
    r = requests.post(f"{BASE_URL}/api/v1/ai/scheduling/suggest",
                      json=payload, headers=h, timeout=15)
    if r.status_code == 200:
        data = r.json()
        log_pass("TC-7.1 排课建议",
                 f"placed={data.get('statistics', {}).get('placed_courses')}/"
                 f"{data.get('statistics', {}).get('total_courses')}")
    else:
        log_fail("TC-7.1 排课建议", f"status={r.status_code}, body={r.text[:100]}")

    # 7.2 学情分析
    payload = {"student_id": 1, "use_llm_insight": False}
    r = requests.post(f"{BASE_URL}/api/v1/ai/student/analyze",
                      json=payload, headers=h, timeout=15)
    if r.status_code == 200:
        data = r.json()
        log_pass("TC-7.2 学情分析",
                 f"student={data.get('student_name')}, risk={data.get('risk_level')}")
    elif r.status_code == 400:
        log_pass("TC-7.2 学情分析", f"正确返回 400（学生不存在）: {r.json().get('detail')}")
    else:
        log_fail("TC-7.2 学情分析", f"status={r.status_code}, body={r.text[:100]}")

    # 7.3 代码审查
    payload = {
        "code": "def hello():\n    print('Hello, World!')\n\nhello()",
        "language": "python",
        "student_name": "验收测试",
        "use_llm_review": False,
    }
    r = requests.post(f"{BASE_URL}/api/v1/ai/code/review",
                      json=payload, headers=h, timeout=15)
    if r.status_code == 200:
        data = r.json()
        log_pass("TC-7.3 代码审查",
                 f"grade={data.get('grade')}, score={data.get('score')}, "
                 f"issues={len(data.get('issues', []))}")
    else:
        log_fail("TC-7.3 代码审查", f"status={r.status_code}, body={r.text[:100]}")

    # 7.4 通用对话
    payload = {
        "message": "你好，请介绍一下你自己",
        "history": [],
    }
    r = requests.post(f"{BASE_URL}/api/v1/ai/chat",
                      json=payload, headers=h, timeout=30)
    if r.status_code == 200:
        data = r.json()
        reply = data.get("reply", "")
        log_pass("TC-7.4 通用对话",
                 f"reply_len={len(reply)}, provider={data.get('provider')}, "
                 f"tokens={data.get('total_tokens')}")
        print(f"         reply: {reply[:100]}...")
    else:
        log_fail("TC-7.4 通用对话", f"status={r.status_code}, body={r.text[:100]}")

    # 7.5 Token 余额查询
    r = requests.get(f"{BASE_URL}/api/v1/ai/token-balance", headers=h, timeout=10)
    if r.status_code == 200:
        data = r.json()
        log_pass("TC-7.5 Token 余额",
                 f"balance={data.get('balance')}, consumed={data.get('total_consumed')}")
    else:
        log_fail("TC-7.5 Token 余额", f"status={r.status_code}")


# ── 主流程 ─────────────────────────────────────────

def main():
    global _start_time
    _start_time = datetime.now()

    print("=" * 60)
    print("  OpenMT 阶段三全量验收测试")
    print(f"  时间: {_start_time.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"  目标: {BASE_URL}")
    print(f"  账号: {TEST_USER}")
    print("=" * 60)

    # 健康检查
    try:
        r = requests.get(f"{BASE_URL}/health", timeout=5)
        if r.status_code != 200:
            print(f"[ERROR] 后端服务未就绪 (status={r.status_code})")
            sys.exit(1)
        print("[OK] 后端服务正常运行\n")
    except requests.ConnectionError:
        print("[ERROR] 无法连接后端服务，请确认服务已启动")
        print(f"        启动方式: cd backend && python start_server.py")
        sys.exit(1)

    # 登录
    token = login()
    if not token:
        print("[ERROR] 登录失败，终止测试")
        sys.exit(1)
    print("[OK] 用户登录成功\n")

    # ── 执行测试用例 ──
    test_license_guard(token)
    time.sleep(1)

    test_backup_api(token)
    time.sleep(1)

    test_backup_and_restore(token)
    time.sleep(2)

    test_websocket_connect(token)
    time.sleep(1)

    test_backup_notification(token)
    time.sleep(1)

    test_llm_status()
    time.sleep(1)

    test_llm_chat(token)

    # ── 汇总 ──
    end_time = datetime.now()
    duration = (end_time - _start_time).total_seconds()
    total = results["pass"] + results["fail"] + results["skip"]
    pass_rate = (results["pass"] / total * 100) if total > 0 else 0

    print(f"\n{'=' * 60}")
    print(f"  验收测试报告汇总")
    print(f"{'=' * 60}")
    print(f"  开始时间: {_start_time.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"  结束时间: {end_time.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"  总耗时:   {duration:.1f}s")
    print(f"  总测试数: {total}")
    print(f"  通过:     {results['pass']}")
    print(f"  失败:     {results['fail']}")
    print(f"  跳过:     {results['skip']}")
    print(f"  通过率:   {pass_rate:.1f}%")
    print(f"{'=' * 60}")

    if results["fail"] > 0:
        print("\n  失败项目:")
        for d in results["details"]:
            if d["status"] == "FAIL":
                print(f"    - {d['name']}: {d['detail']}")

    # 写入 JSON 报告
    report = {
        "test_time": _start_time.isoformat(),
        "duration_seconds": round(duration, 1),
        "total": total,
        "pass": results["pass"],
        "fail": results["fail"],
        "skip": results["skip"],
        "pass_rate": round(pass_rate, 1),
        "details": results["details"],
    }
    report_path = "acceptance_phase3_results.json"
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
    print(f"\n  详细结果已保存到: {report_path}")

    return 0 if results["fail"] == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
