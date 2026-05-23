"""
STEM培训机构管理系统API测试脚本
测试硬件设备管理、Token计费、项目管理和创客空间调度功能
"""

import requests
import json
from datetime import datetime, timedelta

# API基础URL
BASE_URL = "http://localhost:8000"

def test_health_check():
    """测试健康检查接口"""
    print("=== 测试健康检查 ===")
    response = requests.get(f"{BASE_URL}/health")
    print(f"状态码: {response.status_code}")
    print(f"响应: {response.json()}")
    print()

def test_hardware_device_management():
    """测试硬件设备管理功能"""
    print("=== 测试硬件设备管理 ===")
    
    # 1. 创建设备
    device_data = {
        "name": "Arduino Uno开发板",
        "model": "Arduino Uno R3",
        "serial_number": "ARD001234567",
        "category": "arduino",
        "description": "用于STEM教学的Arduino开发板",
        "purchase_date": "2026-01-15T00:00:00",
        "purchase_price": 150.0,
        "supplier": "Arduino官方",
        "warranty_period": 12,
        "location": "A栋3楼实验室1",
        "specifications": {"microcontroller": "ATmega328P", "flash_memory": "32KB"},
        "accessories": ["USB线", "电源适配器"],
        "notes": "主要用于初级课程教学"
    }
    
    response = requests.post(f"{BASE_URL}/hardware/devices/", json=device_data)
    print(f"创建设备 - 状态码: {response.status_code}")
    if response.status_code == 200:
        device = response.json()
        device_id = device["id"]
        print(f"创建成功，设备ID: {device_id}")
    else:
        print(f"创建失败: {response.text}")
        return
    
    # 2. 获取设备列表
    response = requests.get(f"{BASE_URL}/hardware/devices/")
    print(f"获取设备列表 - 状态码: {response.status_code}")
    if response.status_code == 200:
        devices = response.json()
        print(f"设备总数: {len(devices)}")
    else:
        print(f"获取失败: {response.text}")
    
    # 3. 获取单个设备
    response = requests.get(f"{BASE_URL}/hardware/devices/{device_id}")
    print(f"获取单个设备 - 状态码: {response.status_code}")
    if response.status_code == 200:
        device = response.json()
        print(f"设备名称: {device['name']}, 状态: {device['status']}")
    else:
        print(f"获取失败: {response.text}")
    
    # 4. 更新设备
    update_data = {
        "status": "in_use",
        "location": "B栋2楼实验室2"
    }
    response = requests.put(f"{BASE_URL}/hardware/devices/{device_id}", json=update_data)
    print(f"更新设备 - 状态码: {response.status_code}")
    if response.status_code == 200:
        print("设备更新成功")
    else:
        print(f"更新失败: {response.text}")
    
    # 5. 获取设备统计
    response = requests.get(f"{BASE_URL}/hardware/statistics/summary")
    print(f"获取设备统计 - 状态码: {response.status_code}")
    if response.status_code == 200:
        stats = response.json()
        print(f"统计信息: {json.dumps(stats, indent=2, ensure_ascii=False)}")
    else:
        print(f"获取统计失败: {response.text}")
    
    print()

def test_token_billing_system():
    """测试Token计费系统"""
    print("=== 测试Token计费系统 ===")
    
    # 1. 创建Token套餐
    package_data = {
        "name": "基础套餐",
        "description": "适合初学者的Token套餐",
        "token_amount": 1000,
        "price": 99.0,
        "currency": "CNY",
        "validity_days": 365,
        "is_popular": True
    }
    
    response = requests.post(f"{BASE_URL}/tokens/packages/", json=package_data)
    print(f"创建Token套餐 - 状态码: {response.status_code}")
    if response.status_code == 200:
        package = response.json()
        print(f"套餐创建成功，ID: {package['id']}")
    else:
        print(f"创建失败: {response.text}")
    
    # 2. 获取Token套餐列表
    response = requests.get(f"{BASE_URL}/tokens/packages/")
    print(f"获取Token套餐列表 - 状态码: {response.status_code}")
    if response.status_code == 200:
        packages = response.json()
        print(f"套餐总数: {len(packages)}")
    else:
        print(f"获取失败: {response.text}")
    
    # 3. 获取Token余额
    response = requests.get(f"{BASE_URL}/tokens/balance/")
    print(f"获取Token余额 - 状态码: {response.status_code}")
    if response.status_code == 200:
        balance = response.json()
        print(f"当前余额: {balance['balance']} tokens")
    else:
        print(f"获取失败: {response.text}")
    
    # 4. 创建Token交易（购买）
    transaction_data = {
        "transaction_type": "purchase",
        "token_type": "ai_tutor",
        "amount": 1000,
        "description": "购买基础套餐",
        "reference_id": "ORDER_20260101001",
        "user_id": 1,
        "unit_price": 0.099,
        "total_cost": 99.0
    }
    
    response = requests.post(f"{BASE_URL}/tokens/transactions/", json=transaction_data)
    print(f"创建Token交易 - 状态码: {response.status_code}")
    if response.status_code == 200:
        transaction = response.json()
        print(f"交易创建成功，ID: {transaction['id']}")
    else:
        print(f"创建失败: {response.text}")
    
    # 5. 创建Token使用日志
    usage_log_data = {
        "user_id": 1,
        "token_type": "ai_tutor",
        "amount": 50,
        "description": "AI助教辅助编程学习",
        "project_id": None,
        "session_id": "SESSION_001",
        "api_endpoint": "/api/ai/tutor",
        "input_tokens": 100,
        "output_tokens": 200,
        "processing_time": 2.5
    }
    
    response = requests.post(f"{BASE_URL}/tokens/usage-logs/", json=usage_log_data)
    print(f"创建Token使用日志 - 状态码: {response.status_code}")
    if response.status_code == 200:
        log = response.json()
        print(f"使用日志创建成功，ID: {log['id']}")
    else:
        print(f"创建失败: {response.text}")
    
    # 6. 获取Token统计
    response = requests.get(f"{BASE_URL}/tokens/statistics/summary")
    print(f"获取Token统计 - 状态码: {response.status_code}")
    if response.status_code == 200:
        stats = response.json()
        print(f"Token统计: {json.dumps(stats, indent=2, ensure_ascii=False)}")
    else:
        print(f"获取统计失败: {response.text}")
    
    print()

def test_stem_project_management():
    """测试STEM实验项目管理"""
    print("=== 测试STEM实验项目管理 ===")
    
    # 1. 创建项目
    project_data = {
        "name": "智能温室控制系统",
        "description": "基于Arduino的物联网温室监控项目",
        "category": "iot",
        "difficulty": "intermediate",
        "start_date": "2026-02-01T00:00:00",
        "end_date": "2026-04-30T00:00:00",
        "estimated_hours": 40,
        "mentor_id": 1,
        "max_students": 8,
        "technologies": ["Arduino", "IoT", "Python", "MQTT"],
        "required_equipment": ["Arduino开发板", "温湿度传感器", "WiFi模块"],
        "notes": "适合有基础的学生参与"
    }
    
    response = requests.post(f"{BASE_URL}/projects/", json=project_data)
    print(f"创建项目 - 状态码: {response.status_code}")
    if response.status_code == 200:
        project = response.json()
        project_id = project["id"]
        print(f"项目创建成功，ID: {project_id}")
    else:
        print(f"创建失败: {response.text}")
        return
    
    # 2. 获取项目列表
    response = requests.get(f"{BASE_URL}/projects/")
    print(f"获取项目列表 - 状态码: {response.status_code}")
    if response.status_code == 200:
        projects = response.json()
        print(f"项目总数: {len(projects)}")
    else:
        print(f"获取失败: {response.text}")
    
    # 3. 添加里程碑
    milestone_data = {
        "title": "需求分析与设计",
        "description": "完成项目需求分析和系统设计",
        "planned_date": "2026-02-15T00:00:00"
    }
    
    response = requests.post(f"{BASE_URL}/projects/{project_id}/milestones/", json=milestone_data)
    print(f"创建里程碑 - 状态码: {response.status_code}")
    if response.status_code == 200:
        milestone = response.json()
        print(f"里程碑创建成功，ID: {milestone['id']}")
    else:
        print(f"创建失败: {response.text}")
    
    # 4. 添加项目资源
    resource_data = {
        "name": "项目需求文档",
        "description": "详细的项目需求说明",
        "resource_type": "document",
        "url": "https://example.com/requirements.pdf"
    }
    
    response = requests.post(f"{BASE_URL}/projects/{project_id}/resources/", json=resource_data)
    print(f"创建项目资源 - 状态码: {response.status_code}")
    if response.status_code == 200:
        resource = response.json()
        print(f"资源创建成功，ID: {resource['id']}")
    else:
        print(f"创建失败: {response.text}")
    
    # 5. 获取项目统计
    response = requests.get(f"{BASE_URL}/projects/statistics/summary")
    print(f"获取项目统计 - 状态码: {response.status_code}")
    if response.status_code == 200:
        stats = response.json()
        print(f"项目统计: {json.dumps(stats, indent=2, ensure_ascii=False)}")
    else:
        print(f"获取统计失败: {response.text}")
    
    print()

def test_maker_space_scheduling():
    """测试创客空间调度功能"""
    print("=== 测试创客空间调度 ===")
    
    # 1. 创建创客空间
    space_data = {
        "name": "Arduino实验室",
        "description": "专门用于Arduino开发的实验室",
        "space_type": "lab_arduino",
        "capacity": 20,
        "location": "A栋3楼",
        "floor": 3,
        "room_number": "301",
        "equipment_list": ["Arduino开发板", "面包板", "各种传感器", "杜邦线"],
        "open_time": "08:00",
        "close_time": "22:00",
        "max_booking_hours": 4,
        "advance_booking_days": 7,
        "cancellation_hours": 24,
        "notes": "需要提前预约"
    }
    
    response = requests.post(f"{BASE_URL}/spaces/", json=space_data)
    print(f"创建创客空间 - 状态码: {response.status_code}")
    if response.status_code == 200:
        space = response.json()
        space_id = space["id"]
        print(f"空间创建成功，ID: {space_id}")
    else:
        print(f"创建失败: {response.text}")
        return
    
    # 2. 获取空间列表
    response = requests.get(f"{BASE_URL}/spaces/")
    print(f"获取空间列表 - 状态码: {response.status_code}")
    if response.status_code == 200:
        spaces = response.json()
        print(f"空间总数: {len(spaces)}")
    else:
        print(f"获取失败: {response.text}")
    
    # 3. 创建空间预约
    booking_data = {
        "space_id": space_id,
        "start_time": (datetime.utcnow() + timedelta(days=1)).isoformat(),
        "end_time": (datetime.utcnow() + timedelta(days=1, hours=2)).isoformat(),
        "purpose": "Arduino基础课程教学",
        "participant_count": 15,
        "required_equipment": ["Arduino开发板", "笔记本电脑"],
        "project_id": None
    }
    
    response = requests.post(f"{BASE_URL}/spaces/bookings/", json=booking_data)
    print(f"创建空间预约 - 状态码: {response.status_code}")
    if response.status_code == 200:
        booking = response.json()
        booking_id = booking["id"]
        print(f"预约创建成功，ID: {booking_id}")
    else:
        print(f"创建失败: {response.text}")
        return
    
    # 4. 审批预约
    response = requests.put(f"{BASE_URL}/spaces/bookings/{booking_id}/approve")
    print(f"审批预约 - 状态码: {response.status_code}")
    if response.status_code == 200:
        print("预约审批成功")
    else:
        print(f"审批失败: {response.text}")
    
    # 5. 获取预约列表
    response = requests.get(f"{BASE_URL}/spaces/bookings/")
    print(f"获取预约列表 - 状态码: {response.status_code}")
    if response.status_code == 200:
        bookings = response.json()
        print(f"预约总数: {len(bookings)}")
    else:
        print(f"获取失败: {response.text}")
    
    # 6. 获取空间统计
    response = requests.get(f"{BASE_URL}/spaces/statistics/summary")
    print(f"获取空间统计 - 状态码: {response.status_code}")
    if response.status_code == 200:
        stats = response.json()
        print(f"空间统计: {json.dumps(stats, indent=2, ensure_ascii=False)}")
    else:
        print(f"获取统计失败: {response.text}")
    
    print()

def main():
    """主测试函数"""
    print("开始测试STEM培训机构管理系统...")
    print("=" * 50)
    
    try:
        # 测试健康检查
        test_health_check()
        
        # 测试各个功能模块
        test_hardware_device_management()
        test_token_billing_system()
        test_stem_project_management()
        test_maker_space_scheduling()
        
        print("=" * 50)
        print("所有测试完成！")
        
    except requests.exceptions.ConnectionError:
        print("错误: 无法连接到服务器，请确保后端服务正在运行")
    except Exception as e:
        print(f"测试过程中出现错误: {str(e)}")

if __name__ == "__main__":
    main()