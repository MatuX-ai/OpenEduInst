"""
WebSocket 路由
提供实时推送 WebSocket 端点和管理 API
"""

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, Query
from sqlalchemy.orm import Session

from services.websocket_service import manager, build_notification, EVENT_SYSTEM_NOTICE
from utils.auth_utils import verify_token_sync
from utils.database import get_db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/ws", tags=["WebSocket 实时推送"])


# ---------- WebSocket 端点 ----------

@router.websocket("/connect")
async def websocket_connect(
    websocket: WebSocket,
    token: Optional[str] = Query(None),
):
    """
    WebSocket 连接端点
    前端通过 ws://host/api/v1/ws/connect?token=xxx 建立连接
    """
    # 校验 JWT Token
    if not token:
        await websocket.close(code=4001, reason="缺少认证 Token")
        return

    payload = verify_token_sync(token)
    if not payload:
        await websocket.close(code=4001, reason="无效的认证 Token")
        return

    org_id = payload.get("org_id")
    username = payload.get("sub", "unknown")

    if not org_id:
        await websocket.close(code=4002, reason="Token 中缺少组织信息")
        return

    await manager.connect(websocket, org_id)

    # 发送欢迎消息
    await websocket.send_json(build_notification(
        event_type="connected",
        title="连接成功",
        content=f"欢迎 {username}，实时推送已就绪",
        data={"username": username, "org_id": org_id},
    ))

    try:
        while True:
            # 保持连接：接收客户端心跳或消息
            data = await websocket.receive_text()
            # 客户端可以发送 ping 保活
            if data == "ping":
                await websocket.send_json({"event": "pong"})
    except WebSocketDisconnect:
        manager.disconnect(websocket, org_id)
    except Exception as e:
        logger.warning("WebSocket 异常断开: %s", e)
        manager.disconnect(websocket, org_id)


# ---------- 管理 API（REST）----------

@router.get("/stats", summary="WebSocket 连接统计")
def get_ws_stats():
    """获取当前 WebSocket 连接统计信息"""
    return manager.get_stats()


@router.post("/broadcast", summary="发送系统公告")
def broadcast_notice(
    org_id: int,
    title: str,
    content: str,
    db: Session = Depends(get_db),
):
    """
    向指定组织广播系统公告（管理接口）
    注意：生产环境应加上管理员权限校验
    """
    import asyncio
    message = build_notification(
        event_type=EVENT_SYSTEM_NOTICE,
        title=title,
        content=content,
    )
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            asyncio.ensure_future(manager.broadcast(org_id, message))
        else:
            loop.run_until_complete(manager.broadcast(org_id, message))
    except RuntimeError:
        asyncio.run(manager.broadcast(org_id, message))

    return {"message": "公告已发送", "org_id": org_id}
