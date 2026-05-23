"""
初始化学员管理数据库表
"""
import sys
sys.path.insert(0, '.')

from utils.database import engine, Base
from models import student  # 导入以注册模型

# 创建学员相关表
print("创建学员管理数据库表...")
student.Student.__table__.create(engine, checkfirst=True)
student.Enrollment.__table__.create(engine, checkfirst=True)
student.AttendanceRecord.__table__.create(engine, checkfirst=True)
print("✓ 学员表创建完成")
print("✓ 报名表创建完成")
print("✓ 出勤记录表创建完成")
print("\n所有表创建成功！")
