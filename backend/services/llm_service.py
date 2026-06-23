"""
LLM 服务层
封装 OpenAI 兼容协议的大模型调用，支持 DeepSeek / Qwen / OpenAI / Mock
- LLMProvider: 抽象基类
- MockLLMProvider: 离线兜底（开发/测试/无 key 环境）
- OpenAICompatProvider: 走 OpenAI SDK，兼容 DeepSeek / Qwen / 任何 /v1/chat/completions 端点
- LLMService: 工厂 + 降级 + 单例缓存
"""

from __future__ import annotations

import logging
import os
import time
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from config.settings import settings

logger = logging.getLogger(__name__)


# ---------- 响应数据类 ----------

@dataclass
class LLMResponse:
    """LLM 调用的统一响应对象"""

    content: str
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0
    model: str = ""
    provider: str = ""
    latency_ms: int = 0
    raw: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "content": self.content,
            "prompt_tokens": self.prompt_tokens,
            "completion_tokens": self.completion_tokens,
            "total_tokens": self.total_tokens,
            "model": self.model,
            "provider": self.provider,
            "latency_ms": self.latency_ms,
        }


class LLMError(Exception):
    """LLM 通用错误"""


class LLMConfigError(LLMError):
    """配置错误（缺少 API Key 等）"""


class LLMTimeoutError(LLMError):
    """超时"""


class LLMRateLimitError(LLMError):
    """限流"""


# ---------- 抽象基类 ----------

class LLMProvider(ABC):
    """LLM 提供方抽象基类"""

    name: str = "base"

    @abstractmethod
    async def chat(
        self,
        messages: List[Dict[str, str]],
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
    ) -> LLMResponse:
        """同步对话调用"""


# ---------- Mock 实现 ----------

class MockLLMProvider(LLMProvider):
    """离线兜底实现：基于关键词的简单响应，用于开发/演示/无 key 环境"""

    name = "mock"

    async def chat(
        self,
        messages: List[Dict[str, str]],
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
    ) -> LLMResponse:
        start = time.time()
        # 取最后一条 user 消息作为问题
        user_msg = ""
        system_msg = ""
        for m in messages:
            if m.get("role") == "user":
                user_msg = m.get("content", "")
            elif m.get("role") == "system":
                system_msg = m.get("content", "")

        content = self._heuristic_reply(user_msg, system_msg)
        # 估算 tokens（粗略：每 4 个字符 1 token）
        prompt_tokens = max(1, sum(len(m.get("content", "")) for m in messages) // 4)
        completion_tokens = max(1, len(content) // 4)
        latency_ms = int((time.time() - start) * 1000)

        return LLMResponse(
            content=content,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            total_tokens=prompt_tokens + completion_tokens,
            model="mock-1",
            provider=self.name,
            latency_ms=latency_ms,
        )

    @staticmethod
    def _heuristic_reply(user_msg: str, system_msg: str) -> str:
        """关键词触发的简易回复"""
        text = (user_msg or "").strip()
        if not text:
            return "[mock] 您好，请告诉我您要咨询的问题。"

        lowered = text.lower()
        # 排课
        if any(k in text for k in ["排课", "课表", "课程表", "schedule"]):
            return (
                "[mock-排课] 根据教师、教室、课程数量贪心分配，建议优先满足容量约束，"
                "再均衡教师负载。可在「智能排课」中查看冲突列表与负载均衡评分。"
            )
        # 学情
        if any(k in text for k in ["学情", "出勤", "学生", "分析"]):
            return (
                "[mock-学情] 学生当前学习状态已生成雷达图维度，"
                "建议关注出勤率与项目完成率两项短板。"
            )
        # 代码审查（包含中文关键词或代码标记 def/function/void/import/var/console）
        code_markers = ["代码", "review", "审查", "code", "```", "def ", "function ", "void ", "import ", "var ", "console."]
        if any(k in text for k in code_markers) or "\n" in text and any(
            kw in text for kw in ["def ", "function ", "void ", "var ", "import "]
        ):
            return (
                "[mock-代码审查] 已识别语法与风格问题，建议：1) 避免长 delay 使用 millis；"
                "2) 使用 let/const 替代 var；3) 严格相等使用 ===。"
            )
        # 闲聊
        return f"[mock] 已收到您的输入：{text[:60]}{'...' if len(text) > 60 else ''}"


# ---------- OpenAI 兼容实现 ----------

class OpenAICompatProvider(LLMProvider):
    """走 OpenAI SDK 的通用实现，兼容 DeepSeek / Qwen / OpenAI"""

    def __init__(
        self,
        api_key: str,
        base_url: str,
        model: str,
        timeout: int = 30,
        provider_name: str = "openai",
    ):
        if not api_key:
            raise LLMConfigError("LLM_API_KEY 未配置")
        self._api_key = api_key
        self._base_url = base_url
        self._model = model
        self._timeout = timeout
        self.name = provider_name
        self._client: Optional[Any] = None

    def _get_client(self):
        """懒加载 OpenAI 客户端"""
        if self._client is None:
            try:
                from openai import AsyncOpenAI
            except ImportError as e:
                raise LLMConfigError(
                    "openai SDK 未安装，请运行：pip install openai>=1.40.0"
                ) from e
            self._client = AsyncOpenAI(
                api_key=self._api_key,
                base_url=self._base_url,
                timeout=self._timeout,
            )
        return self._client

    async def chat(
        self,
        messages: List[Dict[str, str]],
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
    ) -> LLMResponse:
        client = self._get_client()
        start = time.time()
        try:
            resp = await client.chat.completions.create(
                model=self._model,
                messages=messages,
                temperature=temperature if temperature is not None else settings.LLM_TEMPERATURE,
                max_tokens=max_tokens or settings.LLM_MAX_TOKENS,
            )
        except Exception as e:  # noqa: BLE001
            err_text = str(e).lower()
            if "timeout" in err_text or "timed out" in err_text:
                raise LLMTimeoutError(f"LLM 调用超时: {e}") from e
            if "rate" in err_text or "429" in err_text:
                raise LLMRateLimitError(f"LLM 触发限流: {e}") from e
            if "401" in err_text or "api key" in err_text or "auth" in err_text:
                raise LLMConfigError(f"LLM 鉴权失败: {e}") from e
            raise LLMError(f"LLM 调用失败: {e}") from e

        latency_ms = int((time.time() - start) * 1000)
        # 解析响应
        try:
            choice = resp.choices[0]
            content = (choice.message.content or "").strip()
        except (IndexError, AttributeError) as e:
            raise LLMError(f"LLM 响应解析失败: {e}; raw={resp}") from e

        usage = getattr(resp, "usage", None)
        prompt_tokens = getattr(usage, "prompt_tokens", 0) if usage else 0
        completion_tokens = getattr(usage, "completion_tokens", 0) if usage else 0
        total_tokens = getattr(usage, "total_tokens", 0) if usage else 0

        return LLMResponse(
            content=content,
            prompt_tokens=prompt_tokens or 0,
            completion_tokens=completion_tokens or 0,
            total_tokens=total_tokens or (prompt_tokens + completion_tokens),
            model=self._model,
            provider=self.name,
            latency_ms=latency_ms,
            raw={"id": getattr(resp, "id", ""), "model": self._model},
        )


# ---------- 工厂 + 单例 ----------

_provider_cache: Dict[str, LLMProvider] = {}


def build_provider(provider: Optional[str] = None) -> LLMProvider:
    """根据配置构造一个 Provider 实例（带缓存）"""
    name = (provider or settings.LLM_PROVIDER or "mock").lower()
    if name in _provider_cache:
        return _provider_cache[name]

    if name == "mock":
        instance = MockLLMProvider()
    elif name in ("openai", "deepseek", "qwen", "tongyi", "custom"):
        instance = OpenAICompatProvider(
            api_key=settings.LLM_API_KEY,
            base_url=settings.LLM_BASE_URL,
            model=settings.LLM_MODEL,
            timeout=settings.LLM_TIMEOUT,
            provider_name=name,
        )
    else:
        logger.warning("未知 LLM_PROVIDER=%s，回退到 mock", name)
        instance = MockLLMProvider()

    _provider_cache[name] = instance
    return instance


# ---------- 顶层服务 ----------

class LLMService:
    """LLM 顶层服务：负责选 provider、降级、统计、对话构造"""

    def __init__(self, provider: Optional[LLMProvider] = None):
        self.provider = provider or build_provider()
        self._last_call: Optional[LLMResponse] = None

    @property
    def provider_name(self) -> str:
        return self.provider.name

    @property
    def is_real(self) -> bool:
        """是否接入了真实 LLM（非 mock）"""
        return self.provider.name != "mock"

    async def chat(
        self,
        system: str,
        user: str,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        history: Optional[List[Dict[str, str]]] = None,
    ) -> LLMResponse:
        """
        简易对话接口：system + user + 可选历史
        出错时按配置自动降级到 mock
        """
        messages: List[Dict[str, str]] = []
        if system:
            messages.append({"role": "system", "content": system})
        if history:
            messages.extend(history)
        messages.append({"role": "user", "content": user})

        try:
            resp = await self.provider.chat(messages, temperature, max_tokens)
            self._last_call = resp
            return resp
        except LLMConfigError:
            # 配置错误直接抛出，不应降级
            raise
        except (LLMTimeoutError, LLMRateLimitError, LLMError) as e:
            if settings.LLM_FALLBACK_TO_RULES:
                logger.warning("LLM 调用失败，降级到 mock: %s", e)
                mock = MockLLMProvider()
                resp = await mock.chat(messages, temperature, max_tokens)
                resp.raw = {"fallback_from": self.provider.name, "error": str(e)}
                self._last_call = resp
                return resp
            raise

    async def chat_json(
        self,
        system: str,
        user: str,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
    ) -> Dict[str, Any]:
        """要求 LLM 返回 JSON 格式（解析失败时降级为空 dict）"""
        json_system = (
            (system or "")
            + "\n\n请严格以 JSON 对象格式输出，不要包含 Markdown 代码块或额外说明。"
        )
        resp = await self.chat(json_system, user, temperature, max_tokens)
        import json

        text = (resp.content or "").strip()
        # 剥离可能的 ```json ... ``` 包裹
        if text.startswith("```"):
            text = text.strip("`")
            if text.lower().startswith("json"):
                text = text[4:]
            text = text.strip()
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            logger.warning("LLM 返回非 JSON 格式: %s", text[:200])
            return {"_raw": text, "_parse_error": True}


# 单例便捷访问
_default_service: Optional[LLMService] = None


def get_llm_service() -> LLMService:
    """获取默认 LLMService 单例"""
    global _default_service
    if _default_service is None:
        _default_service = LLMService()
    return _default_service
