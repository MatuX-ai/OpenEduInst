"""
STEM实验项目管理API路由（多租户版）
所有接口 org_id 一律从 Token 提取，禁止通过 body/query/path 传入跨组织访问。
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from utils.database import get_db
from utils.auth_utils import require_org_context
from models.stem_project import (
    STEMProject,
    STEMProjectCreate,
    STEMProjectUpdate,
    STEMProjectResponse,
    ProjectStudent,
    ProjectStudentCreate,
    ProjectStudentResponse,
    ProjectMilestone,
    ProjectMilestoneCreate,
    ProjectMilestoneResponse,
    ProjectResource,
    ProjectResourceCreate,
    ProjectResourceResponse,
    ProjectStatus,
    ProjectCategory,
    ProjectDifficulty,
)
from models.license import Organization
from models.student import Student

router = APIRouter(prefix="/api/v1/projects", tags=["STEM实验项目"])


# ==================== 项目管理接口 ====================


@router.post("/", response_model=STEMProjectResponse)
def create_project(
    project: STEMProjectCreate,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """创建新的STEM项目（org_id 来自 Token，忽略 body 中的 org_id）"""
    _, org_id = ctx
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    db_project = STEMProject(
        name=project.name,
        description=project.description,
        category=project.category,
        difficulty=project.difficulty,
        status=getattr(project, "status", ProjectStatus.PLANNING),
        start_date=project.start_date,
        estimated_hours=getattr(project, "estimated_hours", 0),
        max_students=getattr(project, "max_students", 10),
        progress_percentage=0,
        current_students=0,
        org_id=org.id,
        technologies=str(project.technologies) if project.technologies else None,
        required_equipment=str(project.required_equipment) if project.required_equipment else None,
        is_active=True,
    )

    db.add(db_project)
    db.commit()
    db.refresh(db_project)

    return db_project


@router.get("/", response_model=List[STEMProjectResponse])
def list_projects(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    category: Optional[ProjectCategory] = None,
    status: Optional[ProjectStatus] = None,
    difficulty: Optional[ProjectDifficulty] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取当前组织的项目列表"""
    _, org_id = ctx
    query = db.query(STEMProject).filter(STEMProject.org_id == org_id)

    if category:
        query = query.filter(STEMProject.category == category)
    if status:
        query = query.filter(STEMProject.status == status)
    if difficulty:
        query = query.filter(STEMProject.difficulty == difficulty)
    if search:
        query = query.filter(
            (STEMProject.name.ilike(f"%{search}%"))
            | (STEMProject.description.ilike(f"%{search}%"))
        )

    projects = query.offset(skip).limit(limit).all()
    return projects


@router.get("/{project_id}", response_model=STEMProjectResponse)
def get_project(
    project_id: int,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取单个项目详情（校验所属组织）"""
    _, org_id = ctx
    project = (
        db.query(STEMProject)
        .filter(STEMProject.id == project_id, STEMProject.org_id == org_id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.put("/{project_id}", response_model=STEMProjectResponse)
def update_project(
    project_id: int,
    project_update: STEMProjectUpdate,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """更新项目信息（校验所属组织）"""
    _, org_id = ctx
    project = (
        db.query(STEMProject)
        .filter(STEMProject.id == project_id, STEMProject.org_id == org_id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    for field, value in project_update.dict(exclude_unset=True).items():
        setattr(project, field, value)

    project.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(project)

    return project


@router.delete("/{project_id}")
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """删除项目（软删除，校验所属组织）"""
    _, org_id = ctx
    project = (
        db.query(STEMProject)
        .filter(STEMProject.id == project_id, STEMProject.org_id == org_id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    project.is_active = False
    project.updated_at = datetime.utcnow()
    db.commit()

    return {"message": "Project deleted successfully"}


# ==================== 项目学生管理接口 ====================


@router.post("/{project_id}/students/", response_model=ProjectStudentResponse)
def add_student_to_project(
    project_id: int,
    student_data: ProjectStudentCreate,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """添加学生到项目（校验项目 & 学生都属当前组织）"""
    _, org_id = ctx

    project = (
        db.query(STEMProject)
        .filter(STEMProject.id == project_id, STEMProject.org_id == org_id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    student = (
        db.query(Student)
        .filter(Student.id == student_data.student_id, Student.org_id == org_id)
        .first()
    )
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    if project.current_students >= project.max_students:
        raise HTTPException(status_code=400, detail="Project is full")

    db_project_student = ProjectStudent(
        project_id=project_id,
        student_id=student_data.student_id,
        org_id=org_id,
        role=student_data.role,
    )

    db.add(db_project_student)
    project.current_students += 1

    db.commit()
    db.refresh(db_project_student)

    return db_project_student


@router.get("/{project_id}/students/", response_model=List[ProjectStudentResponse])
def list_project_students(
    project_id: int,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取项目中的学生列表（校验所属组织）"""
    _, org_id = ctx
    project = (
        db.query(STEMProject)
        .filter(STEMProject.id == project_id, STEMProject.org_id == org_id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    students = (
        db.query(ProjectStudent)
        .filter(ProjectStudent.project_id == project_id, ProjectStudent.org_id == org_id, ProjectStudent.is_active == True)
        .all()
    )

    return students


# ==================== 里程碑管理接口 ====================


@router.post("/{project_id}/milestones/", response_model=ProjectMilestoneResponse)
def create_milestone(
    project_id: int,
    milestone: ProjectMilestoneCreate,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """创建项目里程碑（校验所属组织）"""
    _, org_id = ctx

    project = (
        db.query(STEMProject)
        .filter(STEMProject.id == project_id, STEMProject.org_id == org_id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    db_milestone = ProjectMilestone(
        title=milestone.title,
        description=getattr(milestone, "description", None),
        due_date=getattr(milestone, "due_date", None),
        status=getattr(milestone, "status", "pending"),
        project_id=project_id,
        org_id=org_id,
    )

    db.add(db_milestone)
    db.commit()
    db.refresh(db_milestone)

    return db_milestone


@router.get("/{project_id}/milestones/", response_model=List[ProjectMilestoneResponse])
def list_project_milestones(
    project_id: int,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取项目里程碑列表（校验所属组织）"""
    _, org_id = ctx
    project = (
        db.query(STEMProject)
        .filter(STEMProject.id == project_id, STEMProject.org_id == org_id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    milestones = (
        db.query(ProjectMilestone)
        .filter(ProjectMilestone.project_id == project_id, ProjectMilestone.org_id == org_id)
        .all()
    )

    return milestones


# ==================== 资源管理接口 ====================


@router.post("/{project_id}/resources/", response_model=ProjectResourceResponse)
def create_resource(
    project_id: int,
    resource: ProjectResourceCreate,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """创建项目资源（校验所属组织）"""
    _, org_id = ctx

    project = (
        db.query(STEMProject)
        .filter(STEMProject.id == project_id, STEMProject.org_id == org_id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    db_resource = ProjectResource(
        name=resource.name,
        resource_type=getattr(resource, "resource_type", None),
        url=getattr(resource, "url", None),
        description=getattr(resource, "description", None),
        project_id=project_id,
        org_id=org_id,
        is_active=True,
    )

    db.add(db_resource)
    db.commit()
    db.refresh(db_resource)

    return db_resource


@router.get("/{project_id}/resources/", response_model=List[ProjectResourceResponse])
def list_project_resources(
    project_id: int,
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取项目资源列表（校验所属组织）"""
    _, org_id = ctx
    project = (
        db.query(STEMProject)
        .filter(STEMProject.id == project_id, STEMProject.org_id == org_id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    resources = (
        db.query(ProjectResource)
        .filter(
            ProjectResource.project_id == project_id,
            ProjectResource.org_id == org_id,
            ProjectResource.is_active == True,
        )
        .all()
    )

    return resources


# ==================== 统计接口 ====================


@router.get("/statistics/summary")
def get_project_statistics(
    db: Session = Depends(get_db),
    ctx=Depends(require_org_context),
):
    """获取当前组织的项目统计信息"""
    _, org_id = ctx

    base = db.query(STEMProject).filter(STEMProject.org_id == org_id)
    total_projects = base.count()
    active_projects = base.filter(STEMProject.status == ProjectStatus.IN_PROGRESS).count()
    completed_projects = base.filter(STEMProject.status == ProjectStatus.COMPLETED).count()
    showcase_projects = base.filter(STEMProject.status == ProjectStatus.SHOWCASE).count()

    category_stats = {}
    for category in ProjectCategory:
        count = base.filter(STEMProject.category == category).count()
        if count > 0:
            category_stats[category.value] = count

    return {
        "total_projects": total_projects,
        "active_projects": active_projects,
        "completed_projects": completed_projects,
        "showcase_projects": showcase_projects,
        "category_stats": category_stats,
    }