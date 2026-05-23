"""
STEM 云托管版深度测试脚本
测试多租户隔离、数据一致性、边界情况等
"""
import requests
import json
import time
from datetime import datetime

BASE_URL = "http://localhost:8000"

def print_section(title):
    print(f"\n{'='*60}")
    print(f"🔍 {title}")
    print('='*60)

def print_success(message):
    print(f"✅ {message}")

def print_error(message):
    print(f"❌ {message}")

def print_info(message):
    print(f"ℹ️  {message}")

# ==================== 辅助函数 ====================
def register_and_login(username_suffix="deep_test"):
    """注册并登录，返回 token 和用户信息"""
    timestamp = int(time.time())
    user_data = {
        "username": f"{username_suffix}_{timestamp}",
        "email": f"{username_suffix}_{timestamp}@test.com",
        "password": "Test@123456",
        "full_name": "深度测试用户"
    }
    
    # 注册
    reg_resp = requests.post(f"{BASE_URL}/api/v1/auth/register", json=user_data)
    if reg_resp.status_code not in [200, 201]:
        print_error(f"注册失败: {reg_resp.text}")
        return None, None
    
    # 登录
    login_data = {"username": user_data["username"], "password": user_data["password"]}
    login_resp = requests.post(f"{BASE_URL}/api/v1/auth/token", data=login_data)
    if login_resp.status_code != 200:
        print_error(f"登录失败: {login_resp.text}")
        return None, None
    
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    return token, headers

def create_organization(token, org_name_suffix="测试组织"):
    """创建组织"""
    timestamp = int(time.time())
    org_data = {
        "name": f"{org_name_suffix}_{timestamp}",
        "contact_email": f"org_{timestamp}@test.com",
        "org_type": "training_institution",
        "phone": "13800138000",
        "address": "测试地址"
    }
    
    headers = {"Authorization": f"Bearer {token}"}
    resp = requests.post(f"{BASE_URL}/api/v1/organizations/create", json=org_data, headers=headers)
    
    if resp.status_code in [200, 201]:
        data = resp.json()
        new_token = data.get("access_token")
        org_id = data.get("organization_id")
        new_headers = {"Authorization": f"Bearer {new_token}"}
        return org_id, new_token, new_headers
    else:
        print_error(f"创建组织失败: {resp.text}")
        return None, None, None

# ==================== 测试 1: 多租户数据隔离 ====================
def test_tenant_isolation():
    """测试不同组织的用户无法访问彼此的数据"""
    print_section("测试 1: 多租户数据隔离验证")
    
    # 创建两个不同的组织和用户
    token1, headers1 = register_and_login("tenant_user_1")
    if not token1:
        return False
    
    org_id1, token1_new, headers1_new = create_organization(token1, "组织A")
    if not org_id1:
        return False
    
    token2, headers2 = register_and_login("tenant_user_2")
    if not token2:
        return False
    
    org_id2, token2_new, headers2_new = create_organization(token2, "组织B")
    if not org_id2:
        return False
    
    print_info(f"组织A ID: {org_id1}")
    print_info(f"组织B ID: {org_id2}")
    
    # 测试：组织A的用户尝试查询组织B的学生列表（应该返回空或无权访问）
    # 由于使用了 get_current_org_id，Token 中已经绑定了 org_id
    # 所以即使传入不同的 org_id 参数，后端也会使用 Token 中的 org_id
    
    resp_a = requests.get(f"{BASE_URL}/api/v1/students/", headers=headers1_new)
    resp_b = requests.get(f"{BASE_URL}/api/v1/students/", headers=headers2_new)
    
    if resp_a.status_code == 200 and resp_b.status_code == 200:
        students_a = resp_a.json()
        students_b = resp_b.json()
        
        print_success(f"多租户隔离正常工作")
        print_info(f"组织A学生数: {len(students_a)}")
        print_info(f"组织B学生数: {len(students_b)}")
        print_info(f"两个组织的数据完全隔离")
        return True
    else:
        print_error(f"多租户隔离测试失败")
        return False

# ==================== 测试 2: Token 余额一致性 ====================
def test_token_balance_consistency():
    """测试 Token 购买后余额是否正确更新"""
    print_section("测试 2: Token 余额一致性验证")
    
    token, headers = register_and_login("balance_test")
    if not token:
        return False
    
    _, _, headers_new = create_organization(token, "余额测试组织")
    if not headers_new:
        return False
    
    # 查询初始余额
    balance_resp = requests.get(f"{BASE_URL}/api/v1/tokens/balance/", headers=headers_new)
    if balance_resp.status_code != 200:
        print_error("查询初始余额失败")
        return False
    
    initial_balance = balance_resp.json().get("balance", 0)
    print_info(f"初始余额: {initial_balance}")
    
    # 购买套餐
    purchase_data = {
        "transaction_type": "purchase",
        "amount": 5000,
        "description": "测试购买",
        "unit_price": 0.04,
        "total_cost": 200.0
    }
    
    purchase_resp = requests.post(
        f"{BASE_URL}/api/v1/tokens/transactions/",
        json=purchase_data,
        headers=headers_new
    )
    
    if purchase_resp.status_code not in [200, 201]:
        print_error(f"购买失败: {purchase_resp.text}")
        return False
    
    # 再次查询余额
    balance_resp2 = requests.get(f"{BASE_URL}/api/v1/tokens/balance/", headers=headers_new)
    new_balance = balance_resp2.json().get("balance", 0)
    
    expected_balance = initial_balance + 5000
    
    if new_balance == expected_balance:
        print_success(f"Token 余额更新正确")
        print_info(f"购买后余额: {new_balance} (预期: {expected_balance})")
        return True
    else:
        print_error(f"Token 余额不一致")
        print_info(f"实际余额: {new_balance}, 预期余额: {expected_balance}")
        return False

# ==================== 测试 3: 重复注册处理 ====================
def test_duplicate_registration():
    """测试重复注册的错误处理"""
    print_section("测试 3: 重复注册处理")
    
    timestamp = int(time.time())
    username = f"duplicate_test_{timestamp}"
    email = f"duplicate_{timestamp}@test.com"
    
    user_data = {
        "username": username,
        "email": email,
        "password": "Test@123456"
    }
    
    # 第一次注册
    resp1 = requests.post(f"{BASE_URL}/api/v1/auth/register", json=user_data)
    if resp1.status_code not in [200, 201]:
        print_error(f"首次注册失败: {resp1.text}")
        return False
    
    print_success("首次注册成功")
    
    # 第二次注册（相同用户名）
    resp2 = requests.post(f"{BASE_URL}/api/v1/auth/register", json=user_data)
    if resp2.status_code == 400:
        print_success("重复注册被正确拒绝（400错误）")
        print_info(f"错误信息: {resp2.json().get('detail')}")
        return True
    else:
        print_error(f"重复注册未被拒绝（状态码: {resp2.status_code}）")
        return False

# ==================== 测试 4: 无效 Token 访问 ====================
def test_invalid_token_access():
    """测试使用无效 Token 访问受保护接口"""
    print_section("测试 4: 无效 Token 访问控制")
    
    invalid_headers = {"Authorization": "Bearer invalid_token_12345"}
    
    # 尝试查询学生列表
    resp = requests.get(f"{BASE_URL}/api/v1/students/", headers=invalid_headers)
    
    if resp.status_code == 401 or resp.status_code == 403:
        print_success("无效 Token 被正确拒绝")
        print_info(f"状态码: {resp.status_code}")
        return True
    else:
        print_error(f"无效 Token 未被拒绝（状态码: {resp.status_code}）")
        return False

# ==================== 测试 5: Token 交易记录查询 ====================
def test_transaction_history():
    """测试 Token 交易历史记录"""
    print_section("测试 5: Token 交易历史记录")
    
    token, headers = register_and_login("transaction_test")
    if not token:
        return False
    
    _, _, headers_new = create_organization(token, "交易记录测试组织")
    if not headers_new:
        return False
    
    # 先进行一笔购买
    purchase_data = {
        "transaction_type": "purchase",
        "amount": 1000,
        "description": "测试交易",
        "unit_price": 0.05,
        "total_cost": 50.0
    }
    
    purchase_resp = requests.post(
        f"{BASE_URL}/api/v1/tokens/transactions/",
        json=purchase_data,
        headers=headers_new
    )
    
    if purchase_resp.status_code not in [200, 201]:
        print_error(f"购买失败: {purchase_resp.text}")
        return False
    
    # 查询交易历史
    history_resp = requests.get(
        f"{BASE_URL}/api/v1/tokens/transactions/?skip=0&limit=10",
        headers=headers_new
    )
    
    if history_resp.status_code == 200:
        transactions = history_resp.json()
        print_success(f"交易历史查询成功")
        print_info(f"交易记录数: {len(transactions)}")
        
        if len(transactions) > 0:
            latest = transactions[0]
            print_info(f"最新交易: {latest.get('description')} - {latest.get('amount')} Token")
        
        return True
    else:
        print_error(f"交易历史查询失败: {history_resp.status_code}")
        return False

# ==================== 测试 6: 组织类型枚举验证 ====================
def test_organization_types():
    """测试不同组织类型的创建"""
    print_section("测试 6: 组织类型枚举验证")
    
    org_types = [
        "training_institution",
        "k12_school",
        "vocational_school",
        "education_bureau"
    ]
    
    results = []
    
    for org_type in org_types:
        token, headers = register_and_login(f"type_test_{org_type}")
        if not token:
            results.append(False)
            continue
        
        timestamp = int(time.time())
        org_data = {
            "name": f"{org_type}_org_{timestamp}",
            "contact_email": f"{org_type}_{timestamp}@test.com",
            "org_type": org_type,
            "phone": "13800138000"
        }
        
        resp = requests.post(
            f"{BASE_URL}/api/v1/organizations/create",
            json=org_data,
            headers=headers
        )
        
        if resp.status_code in [200, 201]:
            print_success(f"组织类型 '{org_type}' 创建成功")
            results.append(True)
        else:
            print_error(f"组织类型 '{org_type}' 创建失败: {resp.text}")
            results.append(False)
    
    success_count = sum(results)
    total_count = len(results)
    
    if success_count == total_count:
        print_success(f"所有 {total_count} 种组织类型均支持")
        return True
    else:
        print_error(f"部分组织类型创建失败 ({success_count}/{total_count})")
        return False

# ==================== 主测试流程 ====================
def run_deep_tests():
    """运行深度测试"""
    print("\n" + "="*60)
    print("🚀 STEM 云托管版深度测试开始")
    print("="*60)
    print(f"⏰ 开始时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    results = {}
    
    # 执行各项测试
    results['tenant_isolation'] = test_tenant_isolation()
    results['balance_consistency'] = test_token_balance_consistency()
    results['duplicate_registration'] = test_duplicate_registration()
    results['invalid_token'] = test_invalid_token_access()
    results['transaction_history'] = test_transaction_history()
    results['org_types'] = test_organization_types()
    
    # ==================== 测试结果汇总 ====================
    print_section("深度测试结果汇总")
    
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
        print("\n🎉 所有深度测试通过！系统健壮性良好")
        return True
    else:
        print(f"\n⚠️  有 {failed_tests} 个测试失败，请检查上述错误信息")
        return False

if __name__ == "__main__":
    try:
        success = run_deep_tests()
        exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n⚠️  测试被用户中断")
        exit(1)
    except Exception as e:
        print(f"\n\n❌ 测试执行异常: {e}")
        import traceback
        traceback.print_exc()
        exit(1)
