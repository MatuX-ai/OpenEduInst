"""
STEM培训机构管理系统数据库初始化脚本
创建所有新功能所需的数据库表
"""

from utils.database import engine, Base
# 导入基础模型（解决外键依赖）
from models.base_models import User, Teacher, Course
# 导入STEM功能模型
from models.hardware_device import HardwareDevice, DeviceMaintenanceRecord, DeviceUsageLog
from models.token_billing import TokenPackage, TokenBalance, TokenTransaction, TokenUsageLog
from models.stem_project import STEMProject, ProjectStudent, ProjectMilestone, ProjectResource
from models.maker_space import MakerSpace, SpaceBooking, EquipmentSlot

def init_stem_tables():
    """初始化STEM功能相关的数据库表"""
    print("开始创建STEM培训机构管理系统数据库表...")
    
    # 创建所有表
    Base.metadata.create_all(bind=engine)
    
    print("✅ 数据库表创建完成！")
    print("\n已创建的表包括:")
    print("\n【基础表】")
    print("  - users (用户)")
    print("  - teachers (教师)")
    print("  - students (学生) - 来自 student.py")
    print("  - courses (课程) - 来自其他模块")
    print("\n【硬件设备管理】")
    print("  - hardware_devices (硬件设备)")
    print("  - device_maintenance_records (设备维护记录)")
    print("  - device_usage_logs (设备使用日志)")
    print("\n【Token计费系统】")
    print("  - stem_token_packages (Token套餐)")
    print("  - stem_token_balances (Token余额)")
    print("  - stem_token_transactions (Token交易)")
    print("  - stem_token_usage_logs (Token使用日志)")
    print("\n【STEM项目管理】")
    print("  - stem_projects (STEM项目)")
    print("  - project_students (项目学生)")
    print("  - project_milestones (项目里程碑)")
    print("  - project_resources (项目资源)")
    print("\n【创客空间调度】")
    print("  - maker_spaces (创客空间)")
    print("  - space_bookings (空间预约)")
    print("  - equipment_slots (设备时段预约)")
    print("\n✨ 所有表创建成功！可以启动后端服务进行测试。")

if __name__ == "__main__":
    init_stem_tables()