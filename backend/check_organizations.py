import sqlite3

# 连接数据库
conn = sqlite3.connect('ai_service.db')
cursor = conn.cursor()

# 检查 organizations 表是否存在
cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='organizations';")
table_exists = cursor.fetchone()

if table_exists:
    print("Organizations 表存在")
    
    # 查询所有组织
    cursor.execute("SELECT id, name, type FROM organizations;")
    orgs = cursor.fetchall()
    
    if orgs:
        print(f"\n找到 {len(orgs)} 个组织:")
        for org in orgs:
            print(f"  ID: {org[0]}, 名称: {org[1]}, 类型: {org[2]}")
    else:
        print("\nOrganizations 表为空，没有组织数据")
        
        # 创建默认 STEM 培训机构
        create_org = input("\n是否创建默认 STEM 培训机构? (y/n): ")
        if create_org.lower() == 'y':
            cursor.execute("""
                INSERT INTO organizations (name, type, description, is_active)
                VALUES (?, ?, ?, ?)
            """, ('星创机器人培训中心', 'training_center', 'STEM 教育培训机构', True))
            conn.commit()
            org_id = cursor.lastrowid
            print(f"✓ 已创建组织，ID: {org_id}")
            
            # 将 zhao_admin 用户关联到这个组织
            cursor.execute("SELECT id FROM users WHERE username = 'zhao_admin';")
            user = cursor.fetchone()
            if user:
                user_id = user[0]
                cursor.execute("""
                    INSERT INTO user_organizations (user_id, organization_id, role)
                    VALUES (?, ?, ?)
                """, (user_id, org_id, 'admin'))
                conn.commit()
                print(f"✓ 已将用户 zhao_admin 关联到组织 {org_id}")
else:
    print("Organizations 表不存在")

conn.close()
