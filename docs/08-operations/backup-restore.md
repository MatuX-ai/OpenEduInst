# 数据备份与恢复流程

**文档版本**：v1.0
**最后更新**：2026-06-23

---

## 目录

1. [自动备份配置](#自动备份配置)
2. [手动备份操作](#手动备份操作)
3. [数据恢复流程](#数据恢复流程)
4. [备份验证与测试](#备份验证与测试)
5. [版本历史](#版本历史)

---

## 自动备份配置

### 备份策略

| 备份类型 | 频率 | 保留时间 | 适用场景 |
|---------|------|---------|---------|
| 每日完整备份 | 每天 02:00 | 30 天 | 常规数据保护 |
| 每周完整备份 | 每周日 02:00 | 90 天 | 长期归档 |
| 手动触发备份 | 按需 | 永久归档 | 重大操作前 |

### Cron 任务配置

```cron
# 每日自动备份 (02:00)
0 2 * * * /opt/scripts/auto_backup.sh >> /var/log/backup.log 2>&1

# 每周完整备份并归档 (每周日 02:00)
0 2 * * 0 /opt/scripts/weekly_archive.sh >> /var/log/backup.log 2>&1

# 清理 30 天前的每日备份
0 4 * * * find /backups/daily/ -mtime +30 -delete
```

### 备份脚本示例

```bash
#!/bin/bash
# /opt/scripts/auto_backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/daily/$DATE"
DB_PASSWORD=$(grep DB_PASSWORD /app/.env | cut -d'=' -f2)

mkdir -p $BACKUP_DIR

# 1. 备份数据库 (所有 Schema)
docker-compose exec -T db pg_dump -U postgres -d platform_db \
    | gzip > $BACKUP_DIR/platform_db_$DATE.sql.gz

# 2. 备份配置文件
tar -czf $BACKUP_DIR/config_$DATE.tar.gz /app/.env /app/docker-compose.yml

# 3. 备份上传文件
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /app/backend/uploads

# 4. 记录元数据
echo "{\"date\":\"$DATE\",\"size\":\"$(du -sh $BACKUP_DIR)\"}" > $BACKUP_DIR/metadata.json

# 5. 上传到对象存储 (可选)
# aws s3 cp $BACKUP_DIR s3://your-bucket/backups/$DATE/

# 6. 清理过期备份
find /backups/daily/ -mtime +30 -type d -exec rm -rf {} +

echo "[$DATE] Backup completed: $BACKUP_DIR"
```

---

## 手动备份操作

### 前端界面操作

1. 登录机构管理员账户
2. 进入"系统设置" → "数据备份"
3. 点击"创建备份"按钮
4. 填写备份说明 (例如: "升级 v1.1 前备份")
5. 等待备份完成 (通常 1-5 分钟)
6. 在备份列表中查看新生成的备份

### 命令行操作

```bash
# 直接使用 pg_dump 备份
docker-compose exec -T db pg_dump -U postgres -d platform_db \
    --schema=inst_$(cat institution_id.txt) \
    | gzip > backup_$(date +%Y%m%d).sql.gz

# 记录备份信息
python -m app.commands.record_backup \
    --file backup_20260623.sql.gz \
    --type manual \
    --description "手动备份"
```

---

## 数据恢复流程

### ⚠️ 恢复前必读

1. 恢复操作将**覆盖当前数据**，请谨慎操作
2. 恢复前务必**先创建当前数据的备份**
3. 建议先在**测试环境**验证备份文件的完整性
4. 选择合适的业务低峰期进行恢复操作

### 恢复步骤

```
Step 1: 选择要恢复的备份点
  从"数据备份"页面的备份列表中选择
  建议选择离当前时间最近的完好备份

Step 2: 创建当前数据的紧急备份
  系统自动触发 → 等待完成

Step 3: 确认恢复操作 (二次确认)
  输入机构名称确认 → 点击"确认恢复"

Step 4: 等待恢复完成
  大型数据库可能需要 5-30 分钟
  期间系统将处于维护模式

Step 5: 验证恢复结果
  检查关键数据: 学员数、课程数、订单数
  检查最近的操作是否正确恢复

Step 6: 通知相关人员
  恢复完成后通知团队成员
```

### 命令行恢复操作

```bash
# 1. 停止前端访问 (维护模式)
docker-compose stop frontend

# 2. 创建当前状态备份 (防回滚失败)
docker-compose exec -T db pg_dump -U postgres -d platform_db \
    | gzip > /backups/pre_restore_backup_$(date +%Y%m%d_%H%M%S).sql.gz

# 3. 恢复数据库
gunzip -c backup_20260623.sql.gz \
    | docker-compose exec -T db psql -U postgres -d platform_db

# 4. 重启所有服务
docker-compose restart

# 5. 验证恢复结果
docker-compose exec -T db psql -U postgres -d platform_db \
    -c "SELECT COUNT(*) FROM inst_<id>.students;"
```

---

## 备份验证与测试

### 自动验证

每次备份完成后，系统自动进行以下验证:

| 验证项 | 说明 | 通过标准 |
|--------|------|---------|
| 文件大小 | 备份文件大小合理 | > 10KB 且 > 上次备份的 50% |
| 文件完整性 | gzip 文件可正常解压 | exit code = 0 |
| SQL 语法 | SQL 文件可正常执行 | 无语法错误 |
| 数据记录数 | 关键表的记录数检查 | 与系统中一致 |

### 定期恢复测试

建议每月进行一次完整的备份恢复测试:

1. 创建一个独立的测试环境
2. 选择最近的每日备份进行恢复
3. 验证数据一致性
4. 记录恢复所需时间和任何问题

### 测试结果记录

| 日期 | 备份点 | 恢复耗时 | 数据一致性 | 问题记录 |
|------|--------|---------|-----------|---------|
| 2026-06-01 | daily_20260601 | 3 分钟 | 通过 | - |
| 2026-05-15 | daily_20260515 | 2.5 分钟 | 通过 | - |

---

## 版本历史

| 版本 | 日期 | 变更内容 |
|------|------|---------|
| v1.0 | 2026-06-23 | 初始版本，自动备份配置和恢复流程 |

---

**上一级**：[README.md](README.md)
