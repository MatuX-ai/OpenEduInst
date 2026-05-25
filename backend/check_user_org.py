import sqlite3

# 连接数据库
conn = sqlite3.connect('ai_service.db')
cursor = conn.cursor()

# 检查 user_organizations 表结构
cursor.execute("PRAGMA table_info(user_organizations);")
columns = cursor.fetchall()

print("User Organizations 表结构:")
for col in columns:
    print(f"  {col[1]} ({col[2]})")

# 查询 zhao_admin 的组织关联
cursor.execute("""
    SELECT uo.user_id, uo.org_id, uo.role, o.name 
    FROM user_organizations uo
    JOIN organizations o ON uo.org_id = o.id
    JOIN users u ON uo.user_id = u.id
    WHERE u.username = 'zhao_admin';
""")
relations = cursor.fetchall()

if relations:
    print(f"\nzhao_admin 关联的组织:")
    for rel in relations:
        print(f"  用户ID: {rel[0]}, 组织ID: {rel[1]}, 角色: {rel[2]}, 组织名称: {rel[3]}")
else:
    print("\nzhao_admin 没有关联任何组织")
    
    # 关联到第一个组织（ID=1）
    cursor.execute("SELECT id FROM users WHERE username = 'zhao_admin';")
    user = cursor.fetchone()
    if user:
        user_id = user[0]
        org_id = 1  # 使用第一个组织
        
        cursor.execute("""
            INSERT INTO user_organizations (user_id, org_id, role)
            VALUES (?, ?, ?)
        """, (user_id, org_id, 'admin'))
        conn.commit()
        print(f"\n✓ 已将 zhao_admin 关联到组织 ID={org_id}")

conn.close()
