import os
import re

# 需要修复的文件列表
files_to_fix = [
    r'g:\OpenMTEduInst\frontend\src\app\organization-management\organization-portal\organization-dashboard.component.ts',
    r'g:\OpenMTEduInst\frontend\src\app\organization-management\organization-portal\components\schedule-management\schedule-main.component.ts',
    r'g:\OpenMTEduInst\frontend\src\app\organization-management\organization-portal\components\schedule-management\batch-schedule.component.ts',
]

def fix_file(file_path):
    """修复文件中的路由前缀"""
    if not os.path.exists(file_path):
        print(f"❌ 文件不存在: {file_path}")
        return False
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 替换 /management/organization 为 /organization
    new_content = content.replace('/management/organization', '/organization')
    
    if new_content != content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"✅ 已修复: {os.path.basename(file_path)}")
        return True
    else:
        print(f"⚠️  无需修复: {os.path.basename(file_path)}")
        return False

def main():
    print("=" * 60)
    print("🔧 修复路由前缀: /management/organization → /organization")
    print("=" * 60)
    
    fixed_count = 0
    for file_path in files_to_fix:
        if fix_file(file_path):
            fixed_count += 1
    
    print("\n" + "=" * 60)
    print(f"✅ 共修复 {fixed_count} 个文件")
    print("=" * 60)

if __name__ == "__main__":
    main()
