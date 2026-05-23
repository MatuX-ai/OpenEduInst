"""
STEM实验项目管理API路由
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from utils.database import get_db
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


# 项目管理接口
@router.post("/", response_model=STEMProjectResponse)
def create_project(
    project: STEMProjectCreate,
    db: Session = Depends(get_db),
):
    """创建新的STEM项目"""
    # 验证组织是否存在（简化处理，实际应从 Token 获取 org_id）
    org = db.query(Organization).filter(Organization.id == project.org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    # 创建项目实例
    db_project = STEMProject(
        **project.dict(),
        org_id=org.id,
        technologies=str(project.technologies) if project.technologies else None,
        required_equipment=str(project.required_equipment) if project.required_equipment else None,
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
):
    """获取项目列表"""
    query = db.query(STEMProject)
    
    # 添加过滤条件
    if category:
        query = query.filter(STEMProject.category == category)
    if status:
        query = query.filter(STEMProject.status == status)
    if difficulty:
        query = query.filter(STEMProject.difficulty == difficulty)
    if search:
        query = query.filter(
            (STEMProject.name.ilike(f"%{search}%")) |
            (STEMProject.description.ilike(f"%{search}%"))
        )
    
    projects = query.offset(skip).limit(limit).all()
    return projects


@router.get("/{project_id}", response_model=STEMProjectResponse)
def get_project(
    project_id: int,
    db: Session = Depends(get_db),
):
    """获取单个项目详情"""
    project = db.query(STEMProject).filter(STEMProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.put("/{project_id}", response_model=STEMProjectResponse)
def update_project(
    project_id: int,
    project_update: STEMProjectUpdate,
    db: Session = Depends(get_db),
):
    """更新项目信息"""
    project = db.query(STEMProject).filter(STEMProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # 更新字段
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
):
    """删除项目（软删除）"""
    project = db.query(STEMProject).filter(STEMProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    project.is_active = False
    project.updated_at = datetime.utcnow()
    db.commit()
    
    return {"message": "Project deleted successfully"}


# 项目学生管理接口
@router.post("/{project_id}/students/", response_model=ProjectStudentResponse)
def add_student_to_project(
    project_id: int,
    student_data: ProjectStudentCreate,
    db: Session = Depends(get_db),
):
    """添加学生到项目"""
    # 验证项目是否存在
    project = db.query(STEMProject).filter(STEMProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # 验证学生是否存在
    student = db.query(Student).filter(Student.id == student_data.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # 检查是否已达到最大学生数
    if project.current_students >= project.max_students:
        raise HTTPException(status_code=400, detail="Project is full")
    
    # 创建项目学生关联
    db_project_student = ProjectStudent(
        project_id=project_id,
        student_id=student_data.student_id,
        org_id=project.org_id,
        role=student_data.role,
    )
    
    db.add(db_project_student)
    
    # 更新项目的当前学生数
    project.current_students += 1
    
    db.commit()
    db.refresh(db_project_student)
    
    return db_project_student


@router.get("/{project_id}/students/", response_model=List[ProjectStudentResponse])
def list_project_students(
    project_id: int,
    db: Session = Depends(get_db),
):
    """获取项目中的学生列表"""
    project = db.query(STEMProject).filter(STEMProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    students = db.query(ProjectStudent).filter(
        ProjectStudent.project_id == project_id,
        ProjectStudent.is_active == True
    ).all()
    
    return students


# 里程碑管理接口
@router.post("/{project_id}/milestones/", response_model=ProjectMilestoneResponse)
def create_milestone(
    project_id: int,
    milestone: ProjectMilestoneCreate,
    db: Session = Depends(get_db),
):
    """创建项目里程碑"""
    # 验证项目是否存在
    project = db.query(STEMProject).filter(STEMProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # 创建里程碑实例
    db_milestone = ProjectMilestone(
        **milestone.dict(),
        project_id=project_id,
        org_id=project.org_id,
    )
    
    db.add(db_milestone)
    db.commit()
    db.refresh(db_milestone)
    
    return db_milestone


@router.get("/{project_id}/milestones/", response_model=List[ProjectMilestoneResponse])
def list_project_milestones(
    project_id: int,
    db: Session = Depends(get_db),
):
    """获取项目里程碑列表"""
    project = db.query(STEMProject).filter(STEMProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    milestones = db.query(ProjectMilestone).filter(
        ProjectMilestone.project_id == project_id
    ).all()
    
    return milestones


# 资源管理接口
@router.post("/{project_id}/resources/", response_model=ProjectResourceResponse)
def create_resource(
    project_id: int,
    resource: ProjectResourceCreate,
    db: Session = Depends(get_db),
):
    """创建项目资源"""
    # 验证项目是否存在
    project = db.query(STEMProject).filter(STEMProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # 创建资源实例
    db_resource = ProjectResource(
        **resource.dict(),
        project_id=project_id,
        org_id=project.org_id,
    )
    
    db.add(db_resource)
    db.commit()
    db.refresh(db_resource)
    
    return db_resource


@router.get("/{project_id}/resources/", response_model=List[ProjectResourceResponse])
def list_project_resources(
    project_id: int,
    db: Session = Depends(get_db),
):
    """获取项目资源列表"""
    project = db.query(STEMProject).filter(STEMProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    resources = db.query(ProjectResource).filter(
        ProjectResource.project_id == project_id,
        ProjectResource.is_active == True
    ).all()
    
    return resources


# 统计接口
@router.get("/statistics/summary")
def get_project_statistics(
    db: Session = Depends(get_db),
):
    """获取项目统计信息"""
    total_projects = db.query(STEMProject).count()
    active_projects = db.query(STEMProject).filter(
        STEMProject.status == ProjectStatus.IN_PROGRESS
    ).count()
    completed_projects = db.query(STEMProject).filter(
        STEMProject.status == ProjectStatus.COMPLETED
    ).count()
    showcase_projects = db.query(STEMProject).filter(
        STEMProject.status == ProjectStatus.SHOWCASE
    ).count()
    
    # 按分类统计
    category_stats = {}
    for category in ProjectCategory:
        count = db.query(STEMProject).filter(
            STEMProject.category == category
        ).count()
        if count > 0:
            category_stats[category.value] = count
    
    return {
        "total_projects": total_projects,
        "active_projects": active_projects,
        "completed_projects": completed_projects,
        "showcase_projects": showcase_projects,
        "category_stats": category_stats,
    }