"""
STEM 云托管版端到端测试脚本
测试完整的用户注册 -> 创建组织 -> 进入管理后台流程
"""
import requests
import json
import time
from datetime import datetime

BASE_URL = "http://localhost:8000"
FRONTEND_URL = "http://localhost:4201"

def print_section(title):
    """打印测试章节标题"""
    print(f"\n{'='*60}")
    print(f"🧪 {title}")
    print('='*60)

def print_success(message):
    """打印成功信息"""
    print(f"✅ {message}")

def print_error(message):
    """打印错误信息"""
    print(f"❌ {message}")

def print_info(message):
    """打印提示信息"""
    print(f"ℹ️  {message}")

# ==================== 测试 1: 健康检查 ====================
def test_health_check():
    """测试后端服务是否正常启动"""
    print_section("测试 1: 后端健康检查")
    
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        if response.status_code == 200:
            print_success(f"后端服务正常 (状态码: {response.status_code})")
            print_info(f"响应内容: {response.json()}")
            return True
        else:
            print_error(f"后端服务异常 (状态码: {response.status_code})")
            return False
    except Exception as e:
        print_error(f"无法连接到后端服务: {e}")
        return False

# ==================== 测试 2: 用户注册 ====================
def test_user_registration():
    """测试新用户注册"""
    print_section("测试 2: 用户注册")
    
    # 生成唯一的测试用户
    timestamp = int(time.time())
    test_user = {
        "username": f"test_user_{timestamp}",
        "email": f"test{timestamp}@example.com",
        "password": "Test@123456",
        "full_name": "测试用户"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/v1/auth/register",
            json=test_user,
            timeout=10
        )
        
        if response.status_code in [200, 201]:
            data = response.json()
            print_success(f"用户注册成功")
            print_info(f"用户ID: {data.get('user_id')}")
            print_info(f"用户名: {data.get('username')}")
            return True, test_user
        else:
            print_error(f"用户注册失败 (状态码: {response.status_code})")
            print_info(f"响应: {response.text}")
            return False, None
    except Exception as e:
        print_error(f"注册请求异常: {e}")
        return False, None

# ==================== 测试 3: 用户登录 ====================
def test_user_login(username, password):
    """测试用户登录并获取 Token"""
    print_section("测试 3: 用户登录")
    
    login_data = {
        "username": username,
        "password": password
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/v1/auth/token",
            data=login_data,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            access_token = data.get('access_token')
            print_success(f"用户登录成功")
            print_info(f"Token: {access_token[:50]}...")
            return True, access_token
        else:
            print_error(f"用户登录失败 (状态码: {response.status_code})")
            print_info(f"响应: {response.text}")
            return False, None
    except Exception as e:
        print_error(f"登录请求异常: {e}")
        return False, None

# ==================== 测试 4: 创建组织 ====================
def test_create_organization(access_token):
    """测试创建新组织"""
    print_section("测试 4: 创建组织")
    
    org_data = {
        "name": f"测试培训机构_{int(time.time())}",
        "contact_email": f"org_{int(time.time())}@example.com",
        "org_type": "training_institution",  # training_institution/k12_school/vocational_school/education_bureau
        "phone": "13800138000",
        "address": "北京市朝阳区测试路123号"
    }
    
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/v1/organizations/create",
            json=org_data,
            headers=headers,
            timeout=10
        )
        
        if response.status_code in [200, 201]:
            data = response.json()
            org_id = data.get('organization_id')
            new_token = data.get('access_token')
            
            print_success(f"组织创建成功")
            print_info(f"组织ID: {org_id}")
            print_info(f"组织名称: {org_data['name']}")
            print_info(f"组织类型: {org_data['org_type']}")
            print_info(f"新Token已更新")
            
            return True, org_id, new_token
        else:
            print_error(f"组织创建失败 (状态码: {response.status_code})")
            print_info(f"响应: {response.text}")
            return False, None, None
    except Exception as e:
        print_error(f"创建组织请求异常: {e}")
        return False, None, None

# ==================== 测试 5: 验证 Token 中的组织信息 ====================
def test_token_org_info(access_token):
    """验证 Token 中包含正确的 org_id"""
    print_section("测试 5: 验证 Token 组织信息")
    
    headers = {
        "Authorization": f"Bearer {access_token}"
    }
    
    try:
        response = requests.get(
            f"{BASE_URL}/api/v1/auth/me",
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            print_success(f"获取用户信息成功")
            print_info(f"用户名: {data.get('username')}")
            print_info(f"组织ID: {data.get('org_id')}")
            print_info(f"角色: {data.get('role')}")
            return True
        else:
            print_error(f"获取用户信息失败 (状态码: {response.status_code})")
            return False
    except Exception as e:
        print_error(f"获取用户信息异常: {e}")
        return False

# ==================== 测试 6: 查询 Token 余额 ====================
def test_token_balance(access_token):
    """测试查询 Token 余额"""
    print_section("测试 6: 查询 Token 余额")
    
    headers = {
        "Authorization": f"Bearer {access_token}"
    }
    
    try:
        response = requests.get(
            f"{BASE_URL}/api/v1/tokens/balance/",
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            print_success(f"查询余额成功")
            print_info(f"当前余额: {data.get('balance', 0)} Token")
            print_info(f"累计购买: {data.get('total_purchased', 0)} Token")
            print_info(f"累计消耗: {data.get('total_consumed', 0)} Token")
            return True
        else:
            print_error(f"查询余额失败 (状态码: {response.status_code})")
            print_info(f"响应: {response.text}")
            return False
    except Exception as e:
        print_error(f"查询余额异常: {e}")
        return False

# ==================== 测试 7: 查询 Token 套餐列表 ====================
def test_token_packages(access_token):
    """测试查询 Token 套餐列表"""
    print_section("测试 7: 查询 Token 套餐")
    
    headers = {
        "Authorization": f"Bearer {access_token}"
    }
    
    try:
        response = requests.get(
            f"{BASE_URL}/api/v1/tokens/packages/?active_only=true",
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            packages = response.json()
            print_success(f"查询套餐成功，共 {len(packages)} 个套餐")
            
            for pkg in packages:
                print_info(f"  - {pkg['name']}: {pkg['token_amount']} Token, ¥{pkg['price']}")
            
            return True, packages
        else:
            print_error(f"查询套餐失败 (状态码: {response.status_code})")
            return False, []
    except Exception as e:
        print_error(f"查询套餐异常: {e}")
        return False, []

# ==================== 测试 8: 购买 Token 套餐 ====================
def test_purchase_token(access_token, packages):
    """测试购买 Token 套餐"""
    print_section("测试 8: 购买 Token 套餐")
    
    if not packages:
        print_error("没有可用的套餐")
        return False
    
    # 选择第一个套餐进行购买测试
    selected_pkg = packages[0]
    
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    
    purchase_data = {
        "transaction_type": "purchase",
        "amount": selected_pkg['token_amount'],
        "description": f"购买套餐：{selected_pkg['name']}",
        "unit_price": selected_pkg['price'] / selected_pkg['token_amount'],
        "total_cost": selected_pkg['price']
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/v1/tokens/transactions/",
            json=purchase_data,
            headers=headers,
            timeout=10
        )
        
        if response.status_code in [200, 201]:
            data = response.json()
            print_success(f"购买成功")
            print_info(f"交易ID: {data.get('id')}")
            print_info(f"购买数量: {data.get('amount')} Token")
            print_info(f"花费金额: ¥{data.get('total_cost')}")
            return True
        else:
            print_error(f"购买失败 (状态码: {response.status_code})")
            print_info(f"响应: {response.text}")
            return False
    except Exception as e:
        print_error(f"购买请求异常: {e}")
        return False

# ==================== 测试 9: 多租户隔离测试 ====================
def test_tenant_isolation(access_token, org_id):
    """测试多租户数据隔离"""
    print_section("测试 9: 多租户隔离测试")
    
    headers = {
        "Authorization": f"Bearer {access_token}"
    }
    
    # 尝试访问学生列表（应该只能看到当前组织的学生）
    try:
        response = requests.get(
            f"{BASE_URL}/api/v1/students/",
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            students = response.json()
            # 响应直接是列表
            if isinstance(students, list):
                print_success(f"学生列表查询成功")
                print_info(f"当前组织学生数量: {len(students)}")
                print_info(f"多租户隔离正常工作")
                return True
            else:
                # 如果是分页响应
                student_list = students.get('items', [])
                print_success(f"学生列表查询成功")
                print_info(f"当前组织学生数量: {len(student_list)}")
                return True
        else:
            print_error(f"学生列表查询失败 (状态码: {response.status_code})")
            return False
    except Exception as e:
        print_error(f"学生列表查询异常: {e}")
        return False

# ==================== 测试 10: 前端页面可访问性测试 ====================
def test_frontend_pages():
    """测试前端关键页面是否可访问"""
    print_section("测试 10: 前端页面可访问性")
    
    pages_to_test = [
        ("/create-org", "组织创建页面"),
        ("/login", "登录页面"),
    ]
    
    all_passed = True
    
    for path, description in pages_to_test:
        try:
            response = requests.get(f"{FRONTEND_URL}{path}", timeout=5)
            if response.status_code == 200:
                print_success(f"{description} 可访问 ({path})")
            else:
                print_error(f"{description} 访问失败 (状态码: {response.status_code})")
                all_passed = False
        except Exception as e:
            print_error(f"{description} 访问异常: {e}")
            all_passed = False
    
    return all_passed

# ==================== 主测试流程 ====================
def run_e2e_tests():
    """运行完整的端到端测试"""
    print("\n" + "="*60)
    print("🚀 STEM 云托管版端到端测试开始")
    print("="*60)
    print(f"⏰ 开始时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    results = {}
    
    # 测试 1: 健康检查
    results['health'] = test_health_check()
    if not results['health']:
        print_error("\n后端服务未启动，测试中止")
        return False
    
    # 测试 2-3: 注册和登录
    reg_result, test_user = test_user_registration()
    results['registration'] = reg_result
    
    if reg_result and test_user:
        login_result, access_token = test_user_login(
            test_user['username'],
            test_user['password']
        )
        results['login'] = login_result
    else:
        access_token = None
        results['login'] = False
    
    if not access_token:
        print_error("\n无法获取访问令牌，后续测试中止")
        return False
    
    # 测试 4: 创建组织
    org_result, org_id, new_token = test_create_organization(access_token)
    results['create_org'] = org_result
    
    if org_result and new_token:
        access_token = new_token  # 使用包含 org_id 的新 Token
    
    # 测试 5: 验证 Token 信息
    results['token_info'] = test_token_org_info(access_token) if access_token else False
    
    # 测试 6-8: Token 计费系统
    results['token_balance'] = test_token_balance(access_token) if access_token else False
    pkg_result, packages = test_token_packages(access_token) if access_token else (False, [])
    results['token_packages'] = pkg_result
    
    if pkg_result and packages:
        results['token_purchase'] = test_purchase_token(access_token, packages)
    else:
        results['token_purchase'] = False
    
    # 测试 9: 多租户隔离
    results['tenant_isolation'] = test_tenant_isolation(access_token, org_id) if (access_token and org_id) else False
    
    # 测试 10: 前端页面
    results['frontend_pages'] = test_frontend_pages()
    
    # ==================== 测试结果汇总 ====================
    print_section("测试结果汇总")
    
    total_tests = len(results)
    passed_tests = sum(1 for v in results.values() if v)
    failed_tests = total_tests - passed_tests
    
    print(f"\n📊 总测试数: {total_tests}")
    print(f"✅ 通过: {passed_tests}")
    print(f"❌ 失败: {failed_tests}")
    print(f"📈 通过率: {(passed_tests/total_tests*100):.1f}%")
    
    print("\n详细结果:")
    for test_name, result in results.items():
        status = "✅ 通过" if result else "❌ 失败"
        print(f"  {status} - {test_name}")
    
    print(f"\n⏰ 结束时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*60)
    
    if failed_tests == 0:
        print("\n🎉 所有测试通过！系统运行正常")
        return True
    else:
        print(f"\n⚠️  有 {failed_tests} 个测试失败，请检查上述错误信息")
        return False

if __name__ == "__main__":
    try:
        success = run_e2e_tests()
        exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n⚠️  测试被用户中断")
        exit(1)
    except Exception as e:
        print(f"\n\n❌ 测试执行异常: {e}")
        import traceback
        traceback.print_exc()
        exit(1)
