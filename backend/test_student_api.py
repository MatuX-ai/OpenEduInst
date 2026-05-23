"""
测试学员管理API
"""
import sys
sys.path.insert(0, '.')

from utils.database import engine, Base
from models.student import Student, Enrollment, AttendanceRecord

# 创建所有表
print("创建数据库表...")
Base.metadata.create_all(bind=engine)
print("数据库表创建完成！")

# 测试查询
from sqlalchemy.orm import Session
from utils.database import SessionLocal

db = SessionLocal()
try:
    students = db.query(Student).all()
    print(f"当前学员数量: {len(students)}")
except Exception as e:
    print(f"查询错误: {e}")
finally:
    db.close()
