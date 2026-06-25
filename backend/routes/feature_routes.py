"""
功能屏蔽配置管理 API 路由

提供功能模块的启用/禁用管理、批量操作、配置历史与回滚功能。
仅限非教育局机构的管理员访问。
"""

from __future__ import annotations

import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from utils.database import get_db
from utils.auth_utils import require_org_context, require_permission
from middleware.permissions import Permission
from models.license import Organization, OrganizationType
from models.feature_flag import (
    FeatureModule,
    OrgFeatureFlag,
    FeatureChangeLog,
    FeatureModuleResponse,
    FeatureToggleRequest,
    BatchToggleRequest,
)

router = APIRouter(prefix="/api/v1/features", tags=["功能屏蔽管理"])
logger = logging.getLogger(__name__)


def _log_request(ctx, endpoint: str, extra: dict = None):
    """统一请求入口日志，记录用户、机构、权限上下文"""
    try:
        user, org_id = ctx
        base = {
            "endpoint": endpoint,
            "user_id": user.id,
            "username": user.username,
            "org_id": org_id,
            "role": getattr(user, "role", "unknown"),
        }
    except Exception:
        base = {"endpoint": endpoint, "ctx": "unresolved"}
    if extra:
        base.update(extra)
    logger.info(">>> [FEATURE] 请求进入 | %s", base)


def _log_exit(endpoint: str, success: bool, detail: str, extra: dict = None):
    """统一请求出口日志"""
    base = {"endpoint": endpoint, "success": success, "detail": detail}
    if extra:
        base.update(extra)
    logger.info("<<< [FEATURE] 请求退出 | %s", base)


def _build_config_response(db: Session, org_id: int) -> Dict[str, Any]:
    """构建机构完整的功能配置响应"""
    modules = db.query(FeatureModule).filter(FeatureModule.is_active == True).order_by(FeatureModule.sort_order).all()
    org_flags = db.query(OrgFeatureFlag).filter(OrgFeatureFlag.org_id == org_id).all()

    flags_map: Dict[str, bool] = {}
    org_flag_dict: Dict[int, OrgFeatureFlag] = {}

    for of in org_flags:
        org_flag_dict[of.feature_id] = of

    enriched_flags = []
    for m in modules:
        is_enabled = m.is_enabled_by_default
        if m.id in org_flag_dict:
            is_enabled = org_flag_dict[m.id].is_enabled
        flags_map[m.feature_key] = is_enabled

        of = org_flag_dict.get(m.id)
        enriched_flags.append({
            "id": of.id if of else 0,
            "org_id": org_id,
            "feature_id": m.id,
            "is_enabled": is_enabled,
            "extra_config": of.extra_config if of else {},
            "operated_by": of.operated_by if of else None,
            "operated_by_name": of.operated_by_name if of else None,
            "created_at": of.created_at.isoformat() if of and of.created_at else datetime.utcnow().isoformat(),
            "updated_at": of.updated_at.isoformat() if of and of.updated_at else datetime.utcnow().isoformat(),
            "feature_key": m.feature_key,
            "display_name": m.display_name,
            "category": m.category,
            "icon": m.icon,
            "description": m.description,
            "route_path": m.route_path,
            "sort_order": m.sort_order,
            "dependencies": m.dependencies,
        })

    return {
        "modules": [FeatureModuleResponse.model_validate(m).model_dump() for m in modules],
        "flags": flags_map,
        "org_flags": enriched_flags,
    }


def _get_current_snapshot(db: Session, org_id: int) -> Dict[str, bool]:
    """获取当前机构所有功能的启用状态快照"""
    modules = db.query(FeatureModule).filter(FeatureModule.is_active == True).all()
    org_flags = db.query(OrgFeatureFlag).filter(OrgFeatureFlag.org_id == org_id).all()
    flag_map = {of.feature_id: of.is_enabled for of in org_flags}

    snapshot = {}
    for m in modules:
        if m.id in flag_map:
            snapshot[m.feature_key] = flag_map[m.id]
        else:
            snapshot[m.feature_key] = m.is_enabled_by_default
    return snapshot


def _log_change(
    db: Session,
    org_id: int,
    feature_id: Optional[int],
    change_type: str,
    before_snapshot: Dict[str, bool],
    after_snapshot: Dict[str, bool],
    change_detail: str,
    operated_by: Optional[int],
    operated_by_name: Optional[str],
) -> FeatureChangeLog:
    """记录功能配置变更日志"""
    log = FeatureChangeLog(
        org_id=org_id,
        feature_id=feature_id,
        change_type=change_type,
        before_snapshot=before_snapshot,
        after_snapshot=after_snapshot,
        change_detail=change_detail,
        operated_by=operated_by,
        operated_by_name=operated_by_name,
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


def _validate_not_bureau(org_id: int, db: Session) -> Organization:
    """验证非教育局机构"""
    logger.debug("[FEATURE] _validate_not_bureau | org_id=%s | 开始验证", org_id)
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        logger.warning("[FEATURE] _validate_not_bureau | org_id=%s | 机构不存在", org_id)
        raise HTTPException(status_code=404, detail="机构不存在")
    logger.debug("[FEATURE] _validate_not_bureau | org_id=%s | org_type=%s | 机构存在",
                 org_id, org.org_type)
    if org.org_type == OrganizationType.BUREAU:
        logger.warning("[FEATURE] _validate_not_bureau | org_id=%s | 教育局机构被拒绝访问", org_id)
        raise HTTPException(status_code=403, detail="教育局机构不支持功能屏蔽配置")
    logger.debug("[FEATURE] _validate_not_bureau | org_id=%s | 验证通过", org_id)
    return org


# ==================== 获取功能配置 ====================

@router.get("/config", response_model=Dict[str, Any])
def get_feature_config(
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
    _=Depends(require_permission(Permission.FEATURE_READ)),
):
    """
    获取当前机构的功能模块配置列表及每个功能的启用/禁用状态。
    """
    _log_request(ctx, "get_feature_config")
    try:
        _, org_id = ctx
        logger.debug("[FEATURE] get_feature_config | org_id=%s | 开始查询机构类型验证", org_id)
        org = _validate_not_bureau(org_id, db)
        logger.debug("[FEATURE] get_feature_config | org_id=%s | org_name=%s | 验证通过，开始构建配置",
                     org_id, org.name)
        result = _build_config_response(db, org_id)
        module_count = len(result.get("modules", []))
        _log_exit("get_feature_config", True, f"共 {module_count} 个功能模块")
        return result
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("[FEATURE] get_feature_config | org_id=%s | 未预期异常: %s", ctx, exc)
        _log_exit("get_feature_config", False, str(exc))
        raise


# ==================== 获取功能模块列表 ====================

@router.get("/modules", response_model=List[FeatureModuleResponse])
def list_feature_modules(
    db: Session = Depends(get_db),
    _=Depends(require_permission(Permission.FEATURE_READ)),
):
    """
    获取系统所有可配置的功能模块定义列表。
    """
    modules = db.query(FeatureModule).filter(FeatureModule.is_active == True).order_by(FeatureModule.sort_order).all()
    return [FeatureModuleResponse.model_validate(m) for m in modules]


# ==================== 切换单个功能启用/禁用 ====================

@router.post("/toggle")
def toggle_feature(
    request: FeatureToggleRequest,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
    _=Depends(require_permission(Permission.FEATURE_WRITE)),
):
    """
    切换单个功能的启用/禁用状态。
    禁用时如果有关联依赖功能，会一并禁用。
    """
    _log_request(ctx, "toggle_feature", {"feature_id": request.feature_id, "is_enabled": request.is_enabled})
    try:
        user, org_id = ctx
        logger.debug("[FEATURE] toggle_feature | user_id=%s, username=%s, org_id=%s | 机构验证开始",
                     user.id, user.username, org_id)
        org = _validate_not_bureau(org_id, db)
        logger.debug("[FEATURE] toggle_feature | org_id=%s, org_name=%s | 机构验证通过",
                     org_id, org.name)

        logger.debug("[FEATURE] toggle_feature | feature_id=%s | 查询功能模块", request.feature_id)
        module = db.query(FeatureModule).filter(FeatureModule.id == request.feature_id, FeatureModule.is_active == True).first()
        if not module:
            logger.warning("[FEATURE] toggle_feature | feature_id=%s | 功能模块不存在", request.feature_id)
            raise HTTPException(status_code=404, detail="功能模块不存在")
        logger.debug("[FEATURE] toggle_feature | feature_id=%s, feature_key=%s, display_name=%s | 功能模块已找到",
                     request.feature_id, module.feature_key, module.display_name)

        logger.debug("[FEATURE] toggle_feature | org_id=%s | 获取变更前快照（%d 个模块）",
                     org_id, len(_get_current_snapshot(db, org_id)))
        before_snapshot = _get_current_snapshot(db, org_id)
        logger.info("[FEATURE] toggle_feature | 变更前快照: %s", before_snapshot)

        # 查询/创建 OrgFeatureFlag
        org_flag = db.query(OrgFeatureFlag).filter(
            OrgFeatureFlag.org_id == org_id,
            OrgFeatureFlag.feature_id == request.feature_id,
        ).first()
        logger.debug("[FEATURE] toggle_feature | feature_id=%s, org_id=%s | OrgFeatureFlag %s",
                     request.feature_id, org_id, "已存在" if org_flag else "不存在，将创建")

        if org_flag:
            org_flag.is_enabled = request.is_enabled
            org_flag.operated_by = user.id
            org_flag.operated_by_name = user.username
            org_flag.updated_at = datetime.utcnow()
            logger.debug("[FEATURE] toggle_feature | 更新现有 OrgFeatureFlag id=%s → is_enabled=%s",
                         org_flag.id, request.is_enabled)
        else:
            org_flag = OrgFeatureFlag(
                org_id=org_id,
                feature_id=request.feature_id,
                is_enabled=request.is_enabled,
                operated_by=user.id,
                operated_by_name=user.username,
            )
            db.add(org_flag)
            logger.debug("[FEATURE] toggle_feature | 创建新 OrgFeatureFlag → is_enabled=%s", request.is_enabled)

        # 如果禁用，同时禁用依赖此功能的其他功能
        if not request.is_enabled:
            dependent_modules = db.query(FeatureModule).filter(
                FeatureModule.is_active == True,
            ).all()
            disabled_deps = []
            for dm in dependent_modules:
                if module.feature_key in (dm.dependencies or []):
                    dep_flag = db.query(OrgFeatureFlag).filter(
                        OrgFeatureFlag.org_id == org_id,
                        OrgFeatureFlag.feature_id == dm.id,
                    ).first()
                    if dep_flag:
                        dep_flag.is_enabled = False
                        dep_flag.operated_by = user.id
                        dep_flag.operated_by_name = user.username
                    else:
                        dep_flag = OrgFeatureFlag(
                            org_id=org_id,
                            feature_id=dm.id,
                            is_enabled=False,
                            operated_by=user.id,
                            operated_by_name=user.username,
                        )
                        db.add(dep_flag)
                    disabled_deps.append(dm.feature_key)
            if disabled_deps:
                logger.info("[FEATURE] toggle_feature | 级联禁用依赖功能: %s", disabled_deps)

        logger.debug("[FEATURE] toggle_feature | 提交数据库事务")
        db.commit()

        after_snapshot = _get_current_snapshot(db, org_id)
        logger.info("[FEATURE] toggle_feature | 变更后快照: %s", after_snapshot)
        change_detail = (
            f"{'启用' if request.is_enabled else '禁用'}功能「{module.display_name}」"
        )

        _log_change(
            db, org_id, request.feature_id, "toggle",
            before_snapshot, after_snapshot, change_detail,
            user.id, user.username,
        )

        logger.info("[FEATURE] toggle_feature | 操作完成 | org_id=%s, feature=%s, enabled=%s, operator=%s",
                    org_id, module.feature_key, request.is_enabled, user.username)
        _log_exit("toggle_feature", True, change_detail,
                  {"feature_key": module.feature_key, "new_enabled": request.is_enabled})

        return {
            "success": True,
            "data": _build_config_response(db, org_id),
            "message": change_detail,
        }
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("[FEATURE] toggle_feature | 未预期异常: %s", exc)
        _log_exit("toggle_feature", False, str(exc))
        raise


# ==================== 批量切换功能状态 ====================

@router.post("/batch-toggle")
def batch_toggle_features(
    request: BatchToggleRequest,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
    _=Depends(require_permission(Permission.FEATURE_WRITE)),
):
    """
    批量切换多个功能的启用/禁用状态。
    支持一次性启用或禁用多个功能模块。
    """
    _log_request(ctx, "batch_toggle_features", {"toggle_count": len(request.toggles)})
    try:
        user, org_id = ctx
        logger.debug("[FEATURE] batch_toggle_features | user_id=%s, username=%s, org_id=%s | 机构验证",
                     user.id, user.username, org_id)
        org = _validate_not_bureau(org_id, db)
        logger.debug("[FEATURE] batch_toggle_features | org_id=%s, org_name=%s | 机构验证通过", org_id, org.name)

        before_snapshot = _get_current_snapshot(db, org_id)
        logger.info("[FEATURE] batch_toggle_features | 批量操作前快照: %s", before_snapshot)
        changes = []

        for idx, toggle in enumerate(request.toggles):
            logger.debug("[FEATURE] batch_toggle_features | [%d/%d] 处理 feature_id=%s, is_enabled=%s",
                         idx + 1, len(request.toggles), toggle.feature_id, toggle.is_enabled)

            module = db.query(FeatureModule).filter(
                FeatureModule.id == toggle.feature_id, FeatureModule.is_active == True
            ).first()
            if not module:
                logger.warning("[FEATURE] batch_toggle_features | [%d/%d] feature_id=%s 不存在，跳过",
                               idx + 1, len(request.toggles), toggle.feature_id)
                continue

            org_flag = db.query(OrgFeatureFlag).filter(
                OrgFeatureFlag.org_id == org_id,
                OrgFeatureFlag.feature_id == toggle.feature_id,
            ).first()

            if org_flag:
                org_flag.is_enabled = toggle.is_enabled
                org_flag.operated_by = user.id
                org_flag.operated_by_name = user.username
                org_flag.updated_at = datetime.utcnow()
            else:
                org_flag = OrgFeatureFlag(
                    org_id=org_id,
                    feature_id=toggle.feature_id,
                    is_enabled=toggle.is_enabled,
                    operated_by=user.id,
                    operated_by_name=user.username,
                )
                db.add(org_flag)

            change_text = f"{'启用' if toggle.is_enabled else '禁用'}「{module.display_name}」"
            changes.append(change_text)
            logger.info("[FEATURE] batch_toggle_features | [%d/%d] %s", idx + 1, len(request.toggles), change_text)

        logger.debug("[FEATURE] batch_toggle_features | 提交数据库事务")
        db.commit()

        after_snapshot = _get_current_snapshot(db, org_id)
        logger.info("[FEATURE] batch_toggle_features | 批量操作后快照: %s", after_snapshot)

        change_detail = f"批量操作：{'；'.join(changes)}"
        if request.batch_note:
            change_detail += f"（备注：{request.batch_note}）"
            logger.debug("[FEATURE] batch_toggle_features | 操作备注: %s", request.batch_note)

        _log_change(
            db, org_id, None, "batch_toggle",
            before_snapshot, after_snapshot, change_detail,
            user.id, user.username,
        )

        logger.info("[FEATURE] batch_toggle_features | 操作完成 | org_id=%s, count=%d, operator=%s",
                    org_id, len(request.toggles), user.username)
        _log_exit("batch_toggle_features", True, f"批量操作完成，涉及 {len(changes)} 个功能",
                  {"affected_count": len(changes)})

        return {
            "success": True,
            "data": _build_config_response(db, org_id),
            "message": f"批量操作完成，涉及 {len(changes)} 个功能",
        }
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("[FEATURE] batch_toggle_features | 未预期异常: %s", exc)
        _log_exit("batch_toggle_features", False, str(exc))
        raise


# ==================== 获取配置变更历史 ====================

@router.get("/history", response_model=Dict[str, Any])
def get_feature_change_history(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
    _=Depends(require_permission(Permission.FEATURE_READ)),
):
    """
    获取当前机构的功能配置变更历史记录。
    支持分页，按时间倒序排列。
    """
    _, org_id = ctx
    _validate_not_bureau(org_id, db)

    query = db.query(FeatureChangeLog).filter(FeatureChangeLog.org_id == org_id)
    total = query.count()
    logs = query.order_by(FeatureChangeLog.created_at.desc()).offset(
        (page - 1) * page_size
    ).limit(page_size).all()

    items = []
    for log in logs:
        feature_name = ""
        if log.feature_id:
            module = db.query(FeatureModule).filter(FeatureModule.id == log.feature_id).first()
            if module:
                feature_name = module.display_name

        items.append({
            "id": log.id,
            "org_id": log.org_id,
            "feature_id": log.feature_id,
            "feature_name": feature_name,
            "change_type": log.change_type,
            "before_snapshot": log.before_snapshot,
            "after_snapshot": log.after_snapshot,
            "change_detail": log.change_detail,
            "operated_by": log.operated_by,
            "operated_by_name": log.operated_by_name,
            "created_at": log.created_at.isoformat() if log.created_at else None,
        })

    return {
        "success": True,
        "data": {
            "items": items,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size if total > 0 else 0,
        },
        "message": "获取配置变更历史成功",
    }


# ==================== 回滚到历史版本 ====================

@router.post("/rollback/{log_id}")
def rollback_feature_config(
    log_id: int,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
    _=Depends(require_permission(Permission.FEATURE_WRITE)),
):
    """
    将当前机构的功能配置回滚到指定历史版本。
    """
    _log_request(ctx, "rollback_feature_config", {"log_id": log_id})
    try:
        user, org_id = ctx
        logger.debug("[FEATURE] rollback_feature_config | user_id=%s, org_id=%s, log_id=%s | 机构验证",
                     user.id, org_id, log_id)
        org = _validate_not_bureau(org_id, db)
        logger.debug("[FEATURE] rollback_feature_config | org_id=%s, org_name=%s | 验证通过", org_id, org.name)

        logger.debug("[FEATURE] rollback_feature_config | log_id=%s | 查询变更记录", log_id)
        log_entry = db.query(FeatureChangeLog).filter(
            FeatureChangeLog.id == log_id,
            FeatureChangeLog.org_id == org_id,
        ).first()

        if not log_entry:
            logger.warning("[FEATURE] rollback_feature_config | log_id=%s | 变更记录不存在或不属于本机构", log_id)
            raise HTTPException(status_code=404, detail="变更记录不存在")

        logger.debug("[FEATURE] rollback_feature_config | log_id=%s | 变更类型=%s, 变更详情=%s",
                     log_id, log_entry.change_type, log_entry.change_detail)

        before_snapshot = _get_current_snapshot(db, org_id)
        logger.info("[FEATURE] rollback_feature_config | 回滚前快照: %s", before_snapshot)
        target_snapshot = log_entry.before_snapshot
        logger.info("[FEATURE] rollback_feature_config | 目标回滚快照: %s", target_snapshot)

        # 应用目标快照状态
        modules = db.query(FeatureModule).filter(FeatureModule.is_active == True).all()
        module_map = {m.feature_key: m for m in modules}
        restored_count = 0

        for feature_key, is_enabled in target_snapshot.items():
            module = module_map.get(feature_key)
            if not module:
                logger.debug("[FEATURE] rollback_feature_config | feature_key=%s | 模块不存在，跳过", feature_key)
                continue

            org_flag = db.query(OrgFeatureFlag).filter(
                OrgFeatureFlag.org_id == org_id,
                OrgFeatureFlag.feature_id == module.id,
            ).first()

            if org_flag:
                org_flag.is_enabled = is_enabled
                org_flag.operated_by = user.id
                org_flag.operated_by_name = user.username
                org_flag.updated_at = datetime.utcnow()
            else:
                org_flag = OrgFeatureFlag(
                    org_id=org_id,
                    feature_id=module.id,
                    is_enabled=is_enabled,
                    operated_by=user.id,
                    operated_by_name=user.username,
                )
                db.add(org_flag)
            restored_count += 1

        logger.debug("[FEATURE] rollback_feature_config | 回滚了 %d 个功能配置 | 提交事务", restored_count)
        db.commit()

        after_snapshot = _get_current_snapshot(db, org_id)
        logger.info("[FEATURE] rollback_feature_config | 回滚后快照: %s", after_snapshot)
        change_detail = f"回滚到变更记录 #{log_id} 前的状态"

        _log_change(
            db, org_id, None, "rollback",
            before_snapshot, after_snapshot, change_detail,
            user.id, user.username,
        )

        logger.info("[FEATURE] rollback_feature_config | 操作完成 | org_id=%s, log_id=%s, operator=%s",
                    org_id, log_id, user.username)
        _log_exit("rollback_feature_config", True, change_detail,
                  {"log_id": log_id, "restored_count": restored_count})

        return {
            "success": True,
            "data": _build_config_response(db, org_id),
            "message": "功能配置已回滚到指定历史版本",
        }
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("[FEATURE] rollback_feature_config | 未预期异常: %s", exc)
        _log_exit("rollback_feature_config", False, str(exc))
        raise


# ==================== 重置所有功能为默认状态 ====================

@router.post("/reset")
def reset_feature_config(
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
    _=Depends(require_permission(Permission.FEATURE_WRITE)),
):
    """
    将所有功能配置重置为系统默认状态。
    """
    _log_request(ctx, "reset_feature_config")
    try:
        user, org_id = ctx
        logger.debug("[FEATURE] reset_feature_config | user_id=%s, username=%s, org_id=%s | 机构验证",
                     user.id, user.username, org_id)
        org = _validate_not_bureau(org_id, db)
        logger.debug("[FEATURE] reset_feature_config | org_id=%s, org_name=%s | 验证通过", org_id, org.name)

        before_snapshot = _get_current_snapshot(db, org_id)
        logger.info("[FEATURE] reset_feature_config | 重置前快照: %s", before_snapshot)
        module_count_before = len(before_snapshot)

        # 删除该机构所有自定义功能配置
        deleted = db.query(OrgFeatureFlag).filter(OrgFeatureFlag.org_id == org_id).delete()
        logger.info("[FEATURE] reset_feature_config | 删除 %d 条自定义 OrgFeatureFlag 记录", deleted)
        db.commit()

        after_snapshot = _get_current_snapshot(db, org_id)
        logger.info("[FEATURE] reset_feature_config | 重置后快照: %s", after_snapshot)

        change_detail = "重置所有功能配置为系统默认状态"

        _log_change(
            db, org_id, None, "rollback",
            before_snapshot, after_snapshot, change_detail,
            user.id, user.username,
        )

        logger.info("[FEATURE] reset_feature_config | 操作完成 | org_id=%s, operator=%s, modules_reset=%d",
                    org_id, user.username, module_count_before)
        _log_exit("reset_feature_config", True, change_detail,
                  {"modules_reset": module_count_before})

        return {
            "success": True,
            "data": _build_config_response(db, org_id),
            "message": "所有功能配置已重置为默认状态",
        }
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("[FEATURE] reset_feature_config | 未预期异常: %s", exc)
        _log_exit("reset_feature_config", False, str(exc))
        raise