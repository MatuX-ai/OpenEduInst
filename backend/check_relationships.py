"""
检查所有模型中的关系引用，找出未定义的模型
"""
import re
import os
from pathlib import Path

# 已知的模型类列表
known_models = {
    # 基础模型
    'User', 'Teacher', 'Course', 'Student',
    # STEM新功能模型
    'HardwareDevice', 'DeviceMaintenanceRecord', 'DeviceUsageLog',
    'TokenPackage', 'TokenBalance', 'TokenTransaction', 'TokenUsageLog',
    'STEMProject', 'ProjectStudent', 'ProjectMilestone', 'ProjectResource',
    'MakerSpace', 'SpaceBooking', 'EquipmentSlot',
    # 现有模型
    'Organization', 'License', 'Classroom', 'Schedule',
    'TenantConfig', 'TenantFeatureFlag',
    'UserLicense', 'UserTokenBalance', 'TokenRechargeRecord', 'TokenUsageRecord',
    'Lead', 'Settlement', 'AttendanceRecord', 'Enrollment', 'ClassSchedule'
}

models_dir = Path(__file__).parent / 'models'

print("=" * 80)
print("检查模型关系引用")
print("=" * 80)

for py_file in models_dir.glob('*.py'):
    if py_file.name == '__init__.py':
        continue
    
    print(f"\n📄 检查 {py_file.name}...")
    
    with open(py_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 查找所有relationship调用
    pattern = r'relationship\(["\']([^"\']+)["\']'
    matches = re.findall(pattern, content)
    
    for model_name in matches:
        # 处理带模块路径的情况
        clean_name = model_name.split('.')[-1]
        
        if clean_name not in known_models:
            print(f"  ⚠️  未定义的模型引用: {model_name}")
        else:
            print(f"  ✅ {model_name}")

print("\n" + "=" * 80)
print("检查完成")
print("=" * 80)