"""
验证三个新页面的路由和组件配置
"""
import os
import sys

def check_file_exists(filepath: str, description: str) -> bool:
    """检查文件是否存在"""
    exists = os.path.exists(filepath)
    status = "✅" if exists else "❌"
    print(f"{status} {description}: {filepath}")
    return exists

def check_file_content(filepath: str, keyword: str, description: str) -> bool:
    """检查文件是否包含特定内容"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            exists = keyword in content
            status = "✅" if exists else "❌"
            print(f"{status} {description}")
            return exists
    except Exception as e:
        print(f"❌ {description} - 读取失败: {e}")
        return False

def main():
    print("=" * 70)
    print("验证三个新页面的配置")
    print("=" * 70)
    print()
    
    base_path = r"g:\OpenMTEduInst\frontend\src\app\organization-management\organization-portal"
    
    all_passed = True
    
    # 1. 检查组件文件是否存在
    print("1. 检查组件文件")
    print("-" * 70)
    
    components = [
        (r"components\license-management\license-management.component.ts", "许可证管理组件"),
        (r"components\token-purchase\token-purchase.component.ts", "购买 Token 组件"),
        (r"components\user-management\user-management.component.ts", "用户管理组件"),
    ]
    
    for rel_path, desc in components:
        full_path = os.path.join(base_path, rel_path)
        if not check_file_exists(full_path, desc):
            all_passed = False
    
    print()
    
    # 2. 检查路由配置
    print("2. 检查路由配置")
    print("-" * 70)
    
    routing_file = os.path.join(base_path, "organization-routing.module.ts")
    
    route_keywords = [
        ("path: 'licenses'", "许可证管理路由"),
        ("path: 'purchase-tokens'", "购买 Token 路由"),
        ("path: 'users'", "用户管理路由"),
    ]
    
    for keyword, desc in route_keywords:
        if not check_file_content(routing_file, keyword, desc):
            all_passed = False
    
    print()
    
    # 3. 检查侧边栏配置
    print("3. 检查侧边栏路由链接")
    print("-" * 70)
    
    sidebar_file = os.path.join(base_path, r"components\organization-side-nav\organization-side-nav.component.ts")
    
    sidebar_keywords = [
        ("getNavLink('licenses')", "许可证管理链接"),
        ("getNavLink('purchase-tokens')", "购买 Token 链接"),
        ("getNavLink('users')", "用户管理链接"),
    ]
    
    for keyword, desc in sidebar_keywords:
        if not check_file_content(sidebar_file, keyword, desc):
            all_passed = False
    
    print()
    
    # 4. 检查组件导出
    print("4. 检查组件导出")
    print("-" * 70)
    
    export_keywords = [
        (os.path.join(base_path, r"components\license-management\license-management.component.ts"), 
         "export class LicenseManagementComponent", 
         "许可证管理组件导出"),
        (os.path.join(base_path, r"components\token-purchase\token-purchase.component.ts"), 
         "export class TokenPurchaseComponent", 
         "购买 Token 组件导出"),
        (os.path.join(base_path, r"components\user-management\user-management.component.ts"), 
         "export class UserManagementComponent", 
         "用户管理组件导出"),
    ]
    
    for filepath, keyword, desc in export_keywords:
        if not check_file_content(filepath, keyword, desc):
            all_passed = False
    
    print()
    print("=" * 70)
    
    if all_passed:
        print("🎉 所有配置检查通过！三个页面已正确配置")
        print()
        print("访问方式:")
        print(f"  http://localhost:4200/organization/4/licenses")
        print(f"  http://localhost:4200/organization/4/purchase-tokens")
        print(f"  http://localhost:4200/organization/4/users")
    else:
        print("⚠️  部分配置存在问题，请检查上述标记 ❌ 的项")
    
    print("=" * 70)
    
    return 0 if all_passed else 1

if __name__ == "__main__":
    sys.exit(main())
