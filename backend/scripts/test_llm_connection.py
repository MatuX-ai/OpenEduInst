"""
LLM 连接快速验证脚本

使用方式：
  1. 确保 .env 中设置了 LLM_API_KEY
  2. cd backend && python scripts/test_llm_connection.py

预期输出：
  - 成功：打印 LLM 回复内容（前 200 字符）和 Token 用量
  - 失败：打印错误信息并给出排查建议
"""

import os
import sys
import time
from pathlib import Path

# 确保能找到 backend 包
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

# 从 .env 加载配置
from dotenv import load_dotenv
load_dotenv()

from config.settings import settings
from services.llm_service import LLMService, LLMError, LLMConfigError
from services.llm_service import LLMTimeoutError, LLMRateLimitError


def main():
    print("=" * 60)
    print("  OpenMT - LLM 连接测试")
    print("=" * 60)
    print(f"  Provider:     {settings.LLM_PROVIDER}")
    print(f"  Base URL:     {settings.LLM_BASE_URL}")
    print(f"  Model:        {settings.LLM_MODEL}")
    print(f"  Timeout:      {settings.LLM_TIMEOUT}s")
    print(f"  Max Tokens:   {settings.LLM_MAX_TOKENS}")
    print(f"  Fallback:     {'启用' if settings.LLM_FALLBACK_TO_RULES else '禁用'}")
    print(f"  API Key:      {'已配置 (%s...)' % settings.LLM_API_KEY[:8] if settings.LLM_API_KEY else '未配置'}")
    print("-" * 60)

    if not settings.LLM_API_KEY:
        print("\n[WARN] LLM_API_KEY 未配置，当前将使用 Mock 模式。")
        print("       如需测试真实 LLM，请在 .env 中设置：")
        print("         LLM_PROVIDER=deepseek")
        print("         LLM_API_KEY=sk-xxxxx")
        print("         LLM_BASE_URL=https://api.deepseek.com/v1")
        print("         LLM_MODEL=deepseek-chat")
        print()

    try:
        llm = LLMService()
        print(f"  Provider 实例: {llm.provider_name}")
        print(f"  真实 LLM:     {'是' if llm.is_real else '否 (Mock 模式)'}")
        print()

        if not llm.is_real:
            print("  [SKIP] Mock 模式不发送真实 API 请求，仅验证配置加载。")
            print("  设置 LLM_API_KEY 后重新运行以测试真实连接。")
            return 0

        # 发送测试消息
        print("  发送测试消息...")
        start = time.time()

        import asyncio
        resp = asyncio.run(llm.chat(
            system="你是一个有用的助手。",
            user="你好，请用一句话介绍你自己。",
            max_tokens=200,
            temperature=0.5,
        ))

        elapsed = (time.time() - start) * 1000

        print(f"  响应耗时:     {elapsed:.0f}ms")
        print(f"  Provider:     {resp.provider}")
        print(f"  Model:        {resp.model}")
        print(f"  Prompt Tokens: {resp.prompt_tokens}")
        print(f"  Completion Tokens: {resp.completion_tokens}")
        print(f"  Total Tokens: {resp.total_tokens}")
        print(f"  Latency:      {resp.latency_ms}ms")
        print(f"\n  回复内容 (前 200 字符):")
        print(f"  {'─' * 50}")
        print(f"  {resp.content[:200]}")
        print(f"  {'─' * 50}")
        print()
        print("  [PASS] LLM 连接测试通过！")
        return 0

    except LLMConfigError as e:
        print(f"\n  [FAIL] LLM 配置错误: {e}")
        print()
        print("  排查建议:")
        print("    1. 检查 .env 中 LLM_API_KEY 是否正确")
        print("    2. 检查 LLM_BASE_URL 是否可访问")
        print("    3. 检查 LLM_MODEL 名称是否正确")
        return 1

    except LLMTimeoutError as e:
        print(f"\n  [FAIL] LLM 调用超时: {e}")
        print()
        print("  排查建议:")
        print("    1. 检查网络连接")
        print("    2. 尝试增大 LLM_TIMEOUT 值")
        print("    3. 检查 API 服务状态")
        return 1

    except LLMRateLimitError as e:
        print(f"\n  [FAIL] LLM 触发限流: {e}")
        print()
        print("  排查建议:")
        print("    1. 稍后重试")
        print("    2. 检查 API 额度")
        return 1

    except LLMError as e:
        print(f"\n  [FAIL] LLM 调用失败: {e}")
        print()
        print("  排查建议:")
        print("    1. 检查 API Key 有效性")
        print("    2. 检查 Base URL 是否匹配提供商")
        print("    3. 查看日志获取详细错误")
        return 1

    except Exception as e:
        print(f"\n  [FAIL] 未知错误: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(main())
