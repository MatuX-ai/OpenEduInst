"""
WebSocket 实时推送服务
支持：排课变更通知、学员签到提醒、续费预警、系统公告
"""

import json
import logging
from datetime import datetime
from typing import Any, Dict, Optional

from fastapi import WebSocket, WebSocketDisconnect

logger = logging.getLogger(__name__)


class ConnectionManager:
    """WebSocket 连接管理器（按 org_id 分组广播）"""

    def __init__(self):
        # {org_id: [websocket, ...]}
        self._connections: Dict[int, list[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, org_id: int):
        await websocket.accept()
        if org_id not in self._connections:
            self._connections[org_id] = []
        self._connections[org_id].append(websocket)
        logger.info("WebSocket 连接已建立: org=%s, 当前连接数=%d", org_id, len(self._connections[org_id]))

    def disconnect(self, websocket: WebSocket, org_id: int):
        if org_id in self._connections:
            self._connections[org_id] = [
                ws for ws in self._connections[org_id] if ws is not websocket
            ]
            if not self._connections[org_id]:
                del self._connections[org_id]
        logger.info("WebSocket 连接已断开: org=%s", org_id)

    async def broadcast(self, org_id: int, message: Dict[str, Any]):
        """向指定组织的所有连接广播消息"""
        if org_id not in self._connections:
            return
        dead = []
        payload = json.dumps(message, ensure_ascii=False, default=str)
        for ws in self._connections[org_id]:
            try:
                await ws.send_text(payload)
            except Exception:
                dead.append(ws)
        # 清理断开的连接
        for ws in dead:
            self._connections[org_id] = [w for w in self._connections[org_id] if w is not ws]

    async def send_to_user(self, org_id: int, username: str, message: Dict[str, Any]):
        """向指定用户的连接发送消息（需要连接携带 username 元数据）"""
        # 简化实现：广播给组织内所有连接，由前端根据 username 过滤
        message["_target_user"] = username
        await self.broadcast(org_id, message)

    def get_stats(self) -> Dict[str, Any]:
        """获取连接统计"""
        return {
            "total_orgs": len(self._connections),
            "total_connections": sum(len(v) for v in self._connections.values()),
            "orgs": {str(k): len(v) for k, v in self._connections.items()},
        }


# 全局单例
manager = ConnectionManager()


# ---------- 消息构造工具 ----------

def build_notification(
    event_type: str,
    title: str,
    content: str,
    data: Optional[Dict] = None,
) -> Dict[str, Any]:
    """构造标准推送消息体"""
    return {
        "event": event_type,
        "title": title,
        "content": content,
        "data": data or {},
        "timestamp": datetime.utcnow().isoformat(),
    }


# 常用事件类型
EVENT_SCHEDULE_CHANGE = "schedule_change"
EVENT_STUDENT_CHECKIN = "student_checkin"
EVENT_RENEWAL_ALERT = "renewal_alert"
EVENT_SYSTEM_NOTICE = "system_notice"
EVENT_BACKUP_COMPLETE = "backup_complete"
EVENT_PAYMENT_RECEIVED = "payment_received"
