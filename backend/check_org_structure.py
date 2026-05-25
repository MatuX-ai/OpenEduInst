import sqlite3

# 连接数据库
conn = sqlite3.connect('ai_service.db')
cursor = conn.cursor()

# 检查 organizations 表结构
cursor.execute("PRAGMA table_info(organizations);")
columns = cursor.fetchall()

print("Organizations 表结构:")
for col in columns:
    print(f"  {col[1]} ({col[2]})")

# 查询所有组织
cursor.execute("SELECT * FROM organizations LIMIT 5;")
orgs = cursor.fetchall()

if orgs:
    print(f"\n找到 {len(orgs)} 个组织:")
    for org in orgs:
        print(f"  {org}")
else:
    print("\nOrganizations 表为空")

conn.close()
