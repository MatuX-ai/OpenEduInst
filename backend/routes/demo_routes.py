"""
演示系统一键登录路由
提供演示账号列表和免密码一键登录功能
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from models.base_models import User
from models.license import Organization
from models.user_organization import UserOrganization, UserOrganizationRole
from utils.auth_utils import create_access_token_sync
from utils.database import get_db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/demo", tags=["演示系统"])

# 演示账号配置
DEMO_ACCOUNTS = [
    {
        "username": "admin_k12",
        "label": "K12 学校管理员",
        "org_name": "XX 实验小学科创中心",
        "description": "学校 STEM 教育管理员，可查看和管理所有 STEM 模块",
        "org_type": "k12_school",
    },
    {
        "username": "teacher_k12_01",
        "label": "K12 教师（林老师）",
        "org_name": "XX 实验小学科创中心",
        "description": "STEM 社团导师，可管理社团、耗材和项目",
        "org_type": "k12_school",
    },
    {
        "username": "zhao_admin",
        "label": "机构管理员（赵敏）",
        "org_name": "星海机器人培训中心",
        "description": "培训机构管理员，可查看经营仪表盘和教务管理",
        "org_type": "training_institution",
    },
    {
        "username": "zhang_teacher",
        "label": "机构教师（张明华）",
        "org_name": "星海机器人培训中心",
        "description": "培训机构 STEM 讲师，可管理课程和学员",
        "org_type": "training_institution",
    },
    {
        "username": "director_voc",
        "label": "职校管理员（马主任）",
        "org_name": "XX 职业技术学院实训基地",
        "description": "职业学校管理员，可管理实训设备和课程",
        "org_type": "vocational_school",
    },
    {
        "username": "bureau_director",
        "label": "教育局管理员（钱局长）",
        "org_name": "XX 区教育局科创监管平台",
        "description": "教育局监管人员，可查看全区 STEM 教育数据",
        "org_type": "education_bureau",
    },
]


class DemoAccountInfo(BaseModel):
    """演示账号信息"""
    username: str
    label: str
    org_name: str
    description: str
    org_type: str


class DemoAccountList(BaseModel):
    """演示账号列表响应"""
    accounts: list[DemoAccountInfo]
    password_hint: str


class DemoLoginRequest(BaseModel):
    """演示登录请求"""
    username: str


class DemoLoginResponse(BaseModel):
    """演示登录响应"""
    access_token: str
    token_type: str = "bearer"
    username: str
    user_id: int
    org_id: int | None
    role: str


@router.get("/accounts", response_model=DemoAccountList)
def list_demo_accounts():
    """获取可用演示账号列表"""
    return DemoAccountList(
        accounts=[DemoAccountInfo(**acc) for acc in DEMO_ACCOUNTS],
        password_hint="一键登录无需密码，或使用统一密码 demo123456",
    )


@router.post("/login", response_model=DemoLoginResponse)
def demo_login(
    req: DemoLoginRequest,
    db: Session = Depends(get_db),
):
    """演示账号一键登录（无需密码）"""
    username = req.username.strip()

    # 验证是否为演示账号
    valid_usernames = {acc["username"] for acc in DEMO_ACCOUNTS}
    if username not in valid_usernames:
        raise HTTPException(status_code=400, detail="无效的演示账号")

    # 查找用户
    user = db.query(User).filter(
        User.username == username,
        User.is_active.is_(True),
    ).first()
    if not user:
        raise HTTPException(status_code=404, detail="演示用户不存在，请先运行种子脚本初始化数据")

    # 获取用户所属组织
    user_org = db.query(UserOrganization).filter(
        UserOrganization.user_id == user.id,
        UserOrganization.is_active.is_(True),
    ).first()
    org_id = user_org.org_id if user_org else None
    role = user_org.role.value if user_org and user_org.role else "user"

    # 生成访问令牌
    access_token = create_access_token_sync(
        data={
            "sub": user.username,
            "org_id": org_id,
            "role": role,
        },
    )

    logger.info(
        "[demo.login] OK username=%s user_id=%d org_id=%s role=%s",
        username, user.id, org_id, role,
    )

    return DemoLoginResponse(
        access_token=access_token,
        username=user.username,
        user_id=user.id,
        org_id=org_id,
        role=role,
    )