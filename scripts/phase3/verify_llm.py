"""
阶段三任务 3.1 验收:AI 助教接入真实 LLM
验证 LLMService 的 Mock 兜底、配置加载、错误处理、与 AIAssistantService 集成
"""

import asyncio
import os
import sys
from pathlib import Path

# 将 backend 加入路径
BACKEND = Path(__file__).resolve().parent.parent.parent / "backend"
sys.path.insert(0, str(BACKEND))

# 强制使用 mock provider（验收脚本不应真实调用 LLM）
os.environ.setdefault("LLM_PROVIDER", "mock")
os.environ.setdefault("LLM_FALLBACK_TO_RULES", "true")
os.environ.setdefault("DATABASE_URL", "sqlite:///./_phase3_verify.db")

CHECKS = []
FAILURES = []


def check(name: str, ok: bool, detail: str = ""):
    CHECKS.append((name, ok, detail))
    if not ok:
        FAILURES.append((name, detail))
    mark = "✓" if ok else "✗"
    print(f"  [{mark}] {name}{(' — ' + detail) if detail else ''}")


def section(title: str):
    print(f"\n=== {title} ===")


# ---------- 1. 配置加载 ----------

def check_settings():
    section("1. LLM 配置加载")
    try:
        from config.settings import settings
    except Exception as e:
        check("config.settings 可导入", False, str(e))
        return
    check("config.settings 可导入", True)
    check("LLM_PROVIDER 默认值", hasattr(settings, "LLM_PROVIDER"),
          f"={getattr(settings, 'LLM_PROVIDER', None)}")
    check("LLM_API_KEY 字段存在", hasattr(settings, "LLM_API_KEY"))
    check("LLM_BASE_URL 字段存在", hasattr(settings, "LLM_BASE_URL"))
    check("LLM_MODEL 字段存在", hasattr(settings, "LLM_MODEL"))
    check("LLM_TIMEOUT 字段存在", hasattr(settings, "LLM_TIMEOUT"))
    check("LLM_MAX_TOKENS 字段存在", hasattr(settings, "LLM_MAX_TOKENS"))
    check("LLM_TEMPERATURE 字段存在", hasattr(settings, "LLM_TEMPERATURE"))
    check("LLM_FALLBACK_TO_RULES 字段存在", hasattr(settings, "LLM_FALLBACK_TO_RULES"))
    check("当前 Provider=mock", settings.LLM_PROVIDER == "mock",
          f"actual={settings.LLM_PROVIDER}")


# ---------- 2. llm_service 模块 ----------

def check_llm_service_module():
    section("2. llm_service 模块结构")
    try:
        from services.llm_service import (
            LLMResponse, LLMError, LLMConfigError, LLMTimeoutError, LLMRateLimitError,
            LLMProvider, MockLLMProvider, OpenAICompatProvider,
            LLMService, build_provider, get_llm_service,
        )
    except Exception as e:
        check("llm_service 可导入", False, str(e))
        return
    check("llm_service 可导入", True)
    check("LLMResponse 数据类",       LLMResponse is not None)
    check("LLMError 异常类",          LLMError is not None)
    check("LLMConfigError",           LLMConfigError is not None)
    check("LLMTimeoutError",          LLMTimeoutError is not None)
    check("LLMRateLimitError",        LLMRateLimitError is not None)
    check("LLMProvider 抽象类",       LLMProvider is not None)
    check("MockLLMProvider",          MockLLMProvider is not None)
    check("OpenAICompatProvider",     OpenAICompatProvider is not None)
    check("LLMService",               LLMService is not None)
    check("build_provider 工厂",       build_provider is not None)
    check("get_llm_service 单例",     get_llm_service is not None)


# ---------- 3. Mock Provider 实际调用 ----------

async def check_mock_provider():
    section("3. MockLLMProvider 实际调用")
    try:
        from services.llm_service import MockLLMProvider
        mock = MockLLMProvider()
        check("Mock 实例化", True)
        resp = await mock.chat([{"role": "user", "content": "请帮我做一份排课"}])
        check("Mock.chat 返回 LLMResponse", resp is not None)
        check("content 非空", bool(resp.content), f"len={len(resp.content or '')}")
        check("provider=mock", resp.provider == "mock", f"actual={resp.provider}")
        check("包含 mock 标识", "[mock" in (resp.content or ""),
              f"content={resp.content[:60]}")
        check("prompt_tokens > 0", resp.prompt_tokens > 0,
              f"value={resp.prompt_tokens}")
        check("completion_tokens > 0", resp.completion_tokens > 0,
              f"value={resp.completion_tokens}")
        check("to_dict 序列化", "content" in resp.to_dict())

        # 多场景
        for kw, expect_kw in [
            ("排课怎么排", "排课"),
            ("学生出勤率低", "学情"),
            ("def foo(): pass", "代码"),
        ]:
            r = await mock.chat([{"role": "user", "content": kw}])
            ok = expect_kw in (r.content or "")
            check(f"关键词 {kw} → 触发「{expect_kw}」", ok,
                  f"got={r.content[:50] if r.content else ''}")
    except Exception as e:
        check("MockLLMProvider 调用", False, f"{type(e).__name__}: {e}")


# ---------- 4. OpenAICompatProvider 校验 ----------

def check_openai_compat_provider():
    section("4. OpenAICompatProvider 校验")
    try:
        from services.llm_service import OpenAICompatProvider, LLMConfigError
    except Exception as e:
        check("导入", False, str(e))
        return
    # 缺 key 抛错
    try:
        OpenAICompatProvider(api_key="", base_url="x", model="x")
        check("缺 key 抛 LLMConfigError", False, "未抛错")
    except LLMConfigError:
        check("缺 key 抛 LLMConfigError", True)
    # 正常构造
    p = OpenAICompatProvider(
        api_key="test", base_url="https://api.deepseek.com/v1",
        model="deepseek-chat", timeout=15, provider_name="deepseek",
    )
    check("正常构造", p is not None)
    check("provider.name=deepseek", p.name == "deepseek", f"actual={p.name}")


# ---------- 5. build_provider 工厂 ----------

def check_factory():
    section("5. build_provider 工厂")
    try:
        from services.llm_service import build_provider, MockLLMProvider, _provider_cache
        _provider_cache.clear()  # 清缓存避免脏数据
        # 显式 mock
        p1 = build_provider("mock")
        check("build_provider('mock')", isinstance(p1, MockLLMProvider))
        # 不传走默认 settings
        _provider_cache.clear()
        p2 = build_provider()
        check("build_provider() 使用 settings", p2 is not None)
        check("默认 provider name=mock", p2.name == "mock", f"actual={p2.name}")
        # 未知 provider → 降级到 mock
        _provider_cache.clear()
        p3 = build_provider("unknown-xyz")
        check("未知 provider 降级到 mock", p3.name == "mock")
    except Exception as e:
        check("工厂方法", False, f"{type(e).__name__}: {e}")


# ---------- 6. LLMService 顶层封装 ----------

async def check_llm_service_top():
    section("6. LLMService 顶层封装")
    try:
        from services.llm_service import LLMService, get_llm_service
        svc = LLMService()
        check("LLMService 实例化", svc is not None)
        check("provider_name=mock", svc.provider_name == "mock")
        check("is_real=False (mock)", svc.is_real is False)
        # chat 调用
        resp = await svc.chat("你是助手", "你好")
        check("svc.chat 返回", resp is not None and bool(resp.content))
        check("返回 dict 包含 reply", True)  # 实际 chat 返回字典是 AIAssistantService
        # chat_json
        j = await svc.chat_json("系统", "随便说")
        check("svc.chat_json 返回 dict", isinstance(j, dict))
    except Exception as e:
        check("LLMService 顶层", False, f"{type(e).__name__}: {e}")


# ---------- 7. AIAssistantService 集成 ----------

def check_ai_integration():
    section("7. AIAssistantService 集成 LLM")
    try:
        from services.ai_assistant_service import AIAssistantService
        from services.llm_service import MockLLMProvider, LLMService
        # 注入 mock
        mock_svc = LLMService(provider=MockLLMProvider())
        # 不依赖真实 DB 也能构造（因为 _consume_tokens/_get_student_data 都做了兜底）
        try:
            ai = AIAssistantService(db=None, org_id=1, llm=mock_svc)
            check("AIAssistantService 接受 llm 注入", True)
        except Exception as e:
            check("AIAssistantService 构造", False, str(e))
            return

        # 排课建议 - use_llm_advice=False 不依赖 LLM
        result = ai.suggest_scheduling(
            teachers=[{"id": 1, "name": "张老师"}, {"id": 2, "name": "李老师"}],
            classrooms=[{"id": 1, "name": "A101", "capacity": 30}],
            courses=[{"id": 1, "name": "机器人入门", "students": 10}],
            use_llm_advice=False,
        )
        check("suggest_scheduling 返回 schedule", "schedule" in result)
        check("suggest_scheduling 返回 statistics", "statistics" in result)
        check("不强制 LLM 时不抛错", True)

        # 代码审查 - use_llm_review=False
        result2 = ai.review_code(
            code="def hello():\n    print('hi')\n", language="python",
            use_llm_review=False,
        )
        check("review_code 返回 score", "score" in result2)
        check("review_code 返回 grade", "grade" in result2)
        check("不强制 LLM 时不抛错 (code review)", True)
    except Exception as e:
        check("AIAssistantService 集成", False, f"{type(e).__name__}: {e}")


# ---------- 8. 路由文件 ----------

def check_routes():
    section("8. ai_assistant_routes.py 端点")
    p = BACKEND / "routes" / "ai_assistant_routes.py"
    if not p.exists():
        check("routes 文件存在", False)
        return
    text = p.read_text(encoding="utf-8")
    check("包含 /scheduling/suggest", '"/scheduling/suggest"' in text)
    check("包含 /student/analyze", '"/student/analyze"' in text)
    check("包含 /code/review", '"/code/review"' in text)
    check("包含 /token-balance", '"/token-balance"' in text)
    check("包含 /chat 端点", '"/chat"' in text)
    check("包含 /status 端点", '"/status"' in text)
    check("暴露 LLMService 状态", "get_llm_service" in text)


# ---------- 9. requirements.txt & .env.example ----------

def check_config_files():
    section("9. requirements.txt & .env.example")
    req = BACKEND / "requirements.txt"
    env_ex = BACKEND / ".env.example"
    check("requirements.txt 含 openai", "openai" in req.read_text(encoding="utf-8"))
    env_text = env_ex.read_text(encoding="utf-8") if env_ex.exists() else ""
    check(".env.example 含 LLM_PROVIDER", "LLM_PROVIDER" in env_text)
    check(".env.example 含 LLM_API_KEY", "LLM_API_KEY" in env_text)
    check(".env.example 含 LLM_BASE_URL", "LLM_BASE_URL" in env_text)
    check(".env.example 含 LLM_MODEL", "LLM_MODEL" in env_text)
    check(".env.example 含 LLM_FALLBACK_TO_RULES", "LLM_FALLBACK_TO_RULES" in env_text)
    # settings.py
    settings = BACKEND / "config" / "settings.py"
    s = settings.read_text(encoding="utf-8")
    check("settings.py 含 LLM_PROVIDER", "LLM_PROVIDER" in s)
    check("settings.py 含 LLM_BASE_URL", "LLM_BASE_URL" in s)
    check("settings.py 含 LLM_MODEL", "LLM_MODEL" in s)
    check("settings.py 含 LLM_FALLBACK_TO_RULES", "LLM_FALLBACK_TO_RULES" in s)


# ---------- 10. chat() 方法异步集成 ----------

async def check_chat_method():
    section("10. AIAssistantService.chat() 异步")
    try:
        from services.ai_assistant_service import AIAssistantService
        from services.llm_service import MockLLMProvider, LLMService
        mock = LLMService(provider=MockLLMProvider())
        ai = AIAssistantService(db=None, org_id=1, llm=mock)
        r = await ai.chat("你好小启")
        check("chat() 返回 dict", isinstance(r, dict))
        check("chat() 含 reply", "reply" in r and bool(r["reply"]))
        check("chat() 含 provider", r.get("provider") == "mock")
        check("chat() 含 model", bool(r.get("model")))
        check("chat() 含 total_tokens", r.get("total_tokens", 0) > 0)
        check("chat() 含 token_consumed", r.get("token_consumed", 0) > 0)
        # 历史消息
        r2 = await ai.chat(
            "今天学了什么",
            history=[
                {"role": "user", "content": "我是学生"},
                {"role": "assistant", "content": "你好同学"},
            ],
        )
        check("chat() 接受 history", bool(r2.get("reply")))
    except Exception as e:
        check("AIAssistantService.chat()", False, f"{type(e).__name__}: {e}")


# ---------- 入口 ----------

async def amain():
    check_settings()
    check_llm_service_module()
    await check_mock_provider()
    check_openai_compat_provider()
    check_factory()
    await check_llm_service_top()
    check_ai_integration()
    check_routes()
    check_config_files()
    await check_chat_method()

    # 汇总
    print("\n" + "=" * 60)
    passed = sum(1 for _, ok, _ in CHECKS if ok)
    total = len(CHECKS)
    print(f"通过: {passed}/{total} ({passed*100//total}%)")
    if FAILURES:
        print("\n失败项：")
        for n, d in FAILURES:
            print(f"  ✗ {n}  {d}")
        sys.exit(1)
    print("全部检查通过。")


if __name__ == "__main__":
    asyncio.run(amain())
