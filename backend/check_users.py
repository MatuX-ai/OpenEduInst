import sqlite3
import bcrypt

# 连接数据库
conn = sqlite3.connect('ai_service.db')
cursor = conn.cursor()

def hash_password(password: str) -> str:
    """对密码进行哈希处理"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

# 检查 users 表是否存在
cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users';")
table_exists = cursor.fetchone()

if table_exists:
    print("Users 表存在")
    
    # 查询所有用户
    cursor.execute("SELECT id, username, email, full_name, password_hash FROM users;")
    users = cursor.fetchall()
    
    if users:
        print(f"\n找到 {len(users)} 个用户:")
        for user in users:
            print(f"  ID: {user[0]}, 用户名: {user[1]}, 邮箱: {user[2]}, 姓名: {user[3]}")
            
            # 检查 zhao_admin 用户
            if user[1] == 'zhao_admin':
                print(f"\n  找到测试账户 zhao_admin!")
                print(f"  密码哈希: {user[4][:50]}...")
                
                # 验证密码
                test_password = "demo123456"
                import bcrypt
                is_valid = bcrypt.checkpw(test_password.encode('utf-8'), user[4].encode('utf-8'))
                print(f"  密码验证结果: {'✓ 正确' if is_valid else '✗ 错误'}")
    else:
        print("\nUsers 表为空，没有用户数据")
        
        # 询问是否创建测试用户
        create_test = input("\n是否创建测试用户 zhao_admin? (y/n): ")
        if create_test.lower() == 'y':
            password_hash = hash_password("demo123456")
            cursor.execute("""
                INSERT INTO users (username, email, password_hash, full_name, is_active)
                VALUES (?, ?, ?, ?, ?)
            """, ('zhao_admin', 'zhao@starrobotics.edu.cn', password_hash, '赵敏', True))
            conn.commit()
            print("✓ 测试用户已创建")
else:
    print("Users 表不存在")

conn.close()
