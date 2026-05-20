"""
教育局宏观统计服务
提供辖区学校、师生及资源的聚合分析逻辑
"""

from typing import Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func

from models.license import Organization, OrganizationType


class BureauStatsService:
    """教育局统计服务"""

    @staticmethod
    def get_district_summary(db: Session) -> Dict[str, Any]:
        """获取辖区整体概况"""
        # 统计各类学校数量
        school_counts = db.query(
            Organization.org_type, 
            func.count(Organization.id)
        ).filter(
            Organization.org_type.in_([
                OrganizationType.K12, 
                OrganizationType.VOCATIONAL, 
                OrganizationType.TRAINING
            ])
        ).group_by(Organization.org_type).all()

        return {
            "total_schools": sum(count for _, count in school_counts),
            "breakdown": {t.value: c for t, c in school_counts},
            "total_teachers": 0,  # 需关联用户表统计
            "total_students": 0   # 需关联用户表统计
        }

    @staticmethod
    def get_resource_allocation(db: Session) -> Dict[str, Any]:
        """获取资源分配情况（如许可证使用情况）"""
        total_orgs = db.query(func.count(Organization.id)).filter(
            Organization.is_active == True
        ).scalar()
        
        return {
            "active_orgs": total_orgs,
            "avg_license_per_org": 0
        }
