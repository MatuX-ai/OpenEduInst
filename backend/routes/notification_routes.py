"""
消息通知管理API路由（多租户版）
所有接口 org_id 一律从 Token 提取，禁止通过 query 传入。
"""

from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime

from utils.database import get_db
from utils.auth_utils import require_org_context
from models.license import Organization
from models.notification import Notification, NotificationType, NotificationPriority

router = APIRouter(
    prefix="/api/v1/notifications",
    tags=["notifications"],
)


@router.get("/")
def get_notifications(
    type: Optional[str] = Query(None, description="通知类型筛选"),
    priority: Optional[str] = Query(None, description="优先级筛选"),
    is_read: Optional[bool] = Query(None, description="是否已读筛选"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取当前组织的通知列表"""
    _, org_id = ctx

    query = db.query(Notification).filter(Notification.org_id == org_id)

    if type:
        query = query.filter(Notification.type == type)
    if priority:
        query = query.filter(Notification.priority == priority)
    if is_read is not None:
        query = query.filter(Notification.is_read == is_read)

    total = query.count()
    notifications = query.order_by(Notification.create_time.desc()).offset(skip).limit(limit).all()

    return {
        "notifications": [notif.to_dict() for notif in notifications],
        "total": total,
        "skip": skip,
        "limit": limit,
    }


@router.get("/stats")
def get_notification_stats(
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取当前组织的通知统计数据"""
    _, org_id = ctx

    unread_count = (
        db.query(Notification)
        .filter(Notification.org_id == org_id, Notification.is_read == False)
        .count()
    )

    high_priority_count = (
        db.query(Notification)
        .filter(
            Notification.org_id == org_id,
            Notification.is_read == False,
            Notification.priority == NotificationPriority.HIGH,
        )
        .count()
    )

    pending_approvals = (
        db.query(Notification)
        .filter(
            Notification.org_id == org_id,
            Notification.type == NotificationType.APPROVAL,
            Notification.is_read == False,
        )
        .count()
    )

    renewal_warnings = (
        db.query(Notification)
        .filter(Notification.org_id == org_id, Notification.type == NotificationType.RENEWAL)
        .count()
    )

    return {
        "unread_count": unread_count,
        "high_priority_count": high_priority_count,
        "pending_approvals": pending_approvals,
        "renewal_warnings": renewal_warnings,
    }


@router.post("/")
def create_notification(
    title: str = Query(..., description="通知标题"),
    content: str = Query(..., description="通知内容"),
    type: str = Query(..., description="通知类型"),
    priority: str = Query("medium", description="优先级"),
    related_type: Optional[str] = Query(None, description="关联对象类型"),
    related_id: Optional[int] = Query(None, description="关联对象ID"),
    action_label: Optional[str] = Query(None, description="操作按钮文字"),
    action_url: Optional[str] = Query(None, description="操作链接"),
    expire_time: Optional[str] = Query(None, description="过期时间(ISO格式)"),
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """创建新通知（org_id 来自 Token）"""
    _, org_id = ctx

    try:
        type_enum = NotificationType(type)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid type: {type}")

    try:
        priority_enum = NotificationPriority(priority)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid priority: {priority}")

    new_notification = Notification(
        org_id=org_id,
        title=title,
        content=content,
        type=type_enum,
        priority=priority_enum,
        related_type=related_type,
        related_id=related_id,
        action_label=action_label,
        action_url=action_url,
        expire_time=datetime.fromisoformat(expire_time) if expire_time else None,
        is_read=False,
    )

    db.add(new_notification)
    db.commit()
    db.refresh(new_notification)

    return {"message": "Notification created successfully", "notification": new_notification.to_dict()}


@router.put("/{notification_id}/read")
def mark_as_read(
    notification_id: int,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """标记通知为已读（校验所属组织）"""
    _, org_id = ctx
    notification = (
        db.query(Notification)
        .filter(Notification.id == notification_id, Notification.org_id == org_id)
        .first()
    )

    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    notification.is_read = True
    notification.read_time = datetime.utcnow()

    db.commit()

    return {"message": "Notification marked as read"}


@router.put("/mark-all-read")
def mark_all_as_read(
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """标记所有通知为已读（限制为当前组织）"""
    _, org_id = ctx

    db.query(Notification).filter(
        Notification.org_id == org_id, Notification.is_read == False
    ).update({"is_read": True, "read_time": datetime.utcnow()})

    db.commit()

    return {"message": "All notifications marked as read"}


@router.delete("/{notification_id}")
def delete_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """删除通知（校验所属组织）"""
    _, org_id = ctx
    notification = (
        db.query(Notification)
        .filter(Notification.id == notification_id, Notification.org_id == org_id)
        .first()
    )

    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    db.delete(notification)
    db.commit()

    return {"message": "Notification deleted successfully"}
