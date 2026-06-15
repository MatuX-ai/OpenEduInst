"""
教学资源管理API路由（多租户版）
所有接口 org_id 一律从 Token 提取，禁止通过 query 传入。
"""

from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime

from utils.database import get_db
from utils.auth_utils import require_org_context
from models.license import Organization
from models.resource import TeachingResource, ResourceCategory, ResourceType, ResourceFormat

router = APIRouter(
    prefix="/api/v1/resources",
    tags=["teaching-resources"],
)


@router.get("/")
def get_resources(
    category: Optional[str] = Query(None, description="资源类别筛选"),
    resource_type: Optional[str] = Query(None, description="资源类型筛选"),
    format: Optional[str] = Query(None, description="文件格式筛选"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取当前组织的教学资源列表"""
    _, org_id = ctx

    query = db.query(TeachingResource).filter(TeachingResource.org_id == org_id)

    if category:
        query = query.filter(TeachingResource.category == category)
    if resource_type:
        query = query.filter(TeachingResource.resource_type == resource_type)
    if format:
        query = query.filter(TeachingResource.format == format)

    total = query.count()
    resources = query.order_by(TeachingResource.upload_time.desc()).offset(skip).limit(limit).all()

    return {
        "resources": [resource.to_dict() for resource in resources],
        "total": total,
        "skip": skip,
        "limit": limit,
    }


@router.get("/stats")
def get_resource_stats(
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取当前组织的资源统计数据"""
    _, org_id = ctx

    total_resources = (
        db.query(TeachingResource).filter(TeachingResource.org_id == org_id).count()
    )

    first_day_of_month = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    monthly_downloads = (
        db.query(TeachingResource)
        .filter(
            TeachingResource.org_id == org_id,
            TeachingResource.last_download_time >= first_day_of_month,
        )
        .with_entities(db.func.sum(TeachingResource.download_count))
        .scalar()
        or 0
    )

    video_count = (
        db.query(TeachingResource)
        .filter(TeachingResource.org_id == org_id, TeachingResource.resource_type == ResourceType.VIDEO)
        .count()
    )
    video_hours = video_count * 0.5

    code_count = (
        db.query(TeachingResource)
        .filter(TeachingResource.org_id == org_id, TeachingResource.resource_type == ResourceType.CODE)
        .count()
    )

    categories = (
        db.query(
            TeachingResource.category,
            db.func.count(TeachingResource.id).label("count"),
        )
        .filter(TeachingResource.org_id == org_id)
        .group_by(TeachingResource.category)
        .all()
    )

    category_stats = [{"category": cat[0], "count": cat[1]} for cat in categories]

    return {
        "total_resources": total_resources,
        "monthly_downloads": monthly_downloads,
        "video_hours": round(video_hours, 1),
        "code_examples": code_count,
        "category_stats": category_stats,
    }


@router.get("/categories")
def get_categories(
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取当前组织的资源分类列表"""
    _, org_id = ctx

    categories = (
        db.query(ResourceCategory)
        .filter(ResourceCategory.org_id == org_id)
        .order_by(ResourceCategory.sort_order.asc())
        .all()
    )

    for category in categories:
        count = (
            db.query(TeachingResource)
            .filter(
                TeachingResource.org_id == org_id,
                TeachingResource.category == category.name,
            )
            .count()
        )
        category.resource_count = count

    db.commit()

    return {"categories": [cat.to_dict() for cat in categories]}


@router.post("/")
def create_resource(
    name: str = Query(..., description="资源名称"),
    category: str = Query(..., description="资源类别"),
    resource_type: str = Query(..., description="资源类型"),
    format: str = Query(..., description="文件格式"),
    description: Optional[str] = Query(None, description="资源描述"),
    file_size: Optional[float] = Query(None, description="文件大小(MB)"),
    tags: Optional[str] = Query(None, description="标签"),
    difficulty_level: Optional[str] = Query(None, description="难度等级"),
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """创建新的教学资源（org_id 来自 Token）"""
    _, org_id = ctx

    try:
        resource_type_enum = ResourceType(resource_type)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid resource type: {resource_type}")

    try:
        format_enum = ResourceFormat(format)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid format: {format}")

    new_resource = TeachingResource(
        org_id=org_id,
        name=name,
        category=category,
        resource_type=resource_type_enum,
        format=format_enum,
        description=description,
        file_size=file_size,
        tags=tags,
        difficulty_level=difficulty_level,
        download_count=0,
    )

    db.add(new_resource)
    db.commit()
    db.refresh(new_resource)

    return {"message": "Resource created successfully", "resource": new_resource.to_dict()}


@router.put("/{resource_id}/download")
def record_download(
    resource_id: int,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """记录资源下载（校验所属组织）"""
    _, org_id = ctx
    resource = (
        db.query(TeachingResource)
        .filter(TeachingResource.id == resource_id, TeachingResource.org_id == org_id)
        .first()
    )

    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")

    resource.download_count += 1
    resource.last_download_time = datetime.utcnow()

    db.commit()

    return {"message": "Download recorded", "download_count": resource.download_count}


@router.delete("/{resource_id}")
def delete_resource(
    resource_id: int,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """删除教学资源（校验所属组织）"""
    _, org_id = ctx
    resource = (
        db.query(TeachingResource)
        .filter(TeachingResource.id == resource_id, TeachingResource.org_id == org_id)
        .first()
    )

    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")

    db.delete(resource)
    db.commit()

    return {"message": "Resource deleted successfully"}


@router.post("/categories")
def create_category(
    name: str = Query(..., description="分类名称"),
    icon: Optional[str] = Query(None, description="图标emoji"),
    description: Optional[str] = Query(None, description="分类描述"),
    sort_order: int = Query(0, description="排序顺序"),
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """创建资源分类（org_id 来自 Token）"""
    _, org_id = ctx

    existing = (
        db.query(ResourceCategory)
        .filter(ResourceCategory.org_id == org_id, ResourceCategory.name == name)
        .first()
    )

    if existing:
        raise HTTPException(status_code=400, detail="Category already exists")

    new_category = ResourceCategory(
        org_id=org_id,
        name=name,
        icon=icon,
        description=description,
        sort_order=sort_order,
        resource_count=0,
    )

    db.add(new_category)
    db.commit()
    db.refresh(new_category)

    return {"message": "Category created successfully", "category": new_category.to_dict()}
