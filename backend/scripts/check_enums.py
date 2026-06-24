
"""
查询数据库中所有枚举类型及其值，用于验证 seed 脚本。
"""
import os, sys
os.chdir('i:/OpenMTEduInst/backend')
sys.path.insert(0, 'i:/OpenMTEduInst/backend')

from utils.database import engine
from sqlalchemy import text

# 先触发模型导入（确保有表）
import models.base_models
import models.license
import models.classroom
import models.schedule
import models.user_organization
import models.user_license
import models.club
import models.consumable
import models.hardware_device
import models.stem_project
import models.maker_space
import models.marketing
import models.parent_portal
import models.competition
import models.resource
import models.backup
import models.token_billing
import models.tenant
import models.notification

conn = engine.connect()

query = text("""
SELECT t.typname, array_agg(e.enumlabel ORDER BY e.enumlabel) as values
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typname IN (
    'resourcetype', 'resourceformat', 'clubcategory', 'clubstatus',
    'clubmemberrole', 'clubmemberstatus', 'activitytype', 'attendancestatus',
    'applicationstatus', 'consumablecategory', 'purchaserequeststatus',
    'devicestatus', 'devicecategory', 'maintenancetype',
    'projectstatus', 'projectcategory', 'projectdifficulty',
    'milestonestatus', 'spacetype', 'spacestatus', 'bookingstatus',
    'campaigntype', 'campaignstatus', 'socialplatform',
    'feedbackrating', 'notificationtype', 'notificationpriority',
    'competitionlevel', 'competitioncategory', 'competitionstatus',
    'backuptype', 'backupstatus', 'restorestatus',
    'tokentransactiontype', 'tokenorderstatus', 'paymentmethod',
    'tokentype', 'leadstatus', 'leadsource', 'schedulestatus',
    'studentstatus', 'gender'
)
GROUP BY t.typname
ORDER BY t.typname
""")

rows = conn.execute(query)
for row in rows:
    print(f"{row[0]:30s} {row[1]}")

conn.close()
print("\n--- 查询完成 ---")
