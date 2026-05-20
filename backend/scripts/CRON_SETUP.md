# Demo 环境自动重置 - Cron 任务配置

## Linux/Mac 系统

### 方法 1: Crontab

```bash
# 编辑 crontab
crontab -e

# 添加以下行（每天凌晨 3:00 执行）
0 3 * * * cd /path/to/OpenMTEduInst/backend && /usr/bin/python3 scripts/reset_demo_data.py >> logs/cron_reset.log 2>&1
```

### 方法 2: Systemd Timer（推荐）

创建服务文件 `/etc/systemd/system/openmt-demo-reset.service`:

```ini
[Unit]
Description=OpenMT Demo Data Reset
After=network.target

[Service]
Type=oneshot
User=www-data
WorkingDirectory=/path/to/OpenMTEduInst/backend
ExecStart=/usr/bin/python3 scripts/reset_demo_data.py
StandardOutput=append:/var/log/openmt/demo-reset.log
StandardError=append:/var/log/openmt/demo-reset-error.log

[Install]
WantedBy=multi-user.target
```

创建定时器文件 `/etc/systemd/system/openmt-demo-reset.timer`:

```ini
[Unit]
Description=Run OpenMT Demo Data Reset Daily at 3:00 AM

[Timer]
OnCalendar=*-*-* 03:00:00
Persistent=true

[Install]
WantedBy=timers.target
```

启用定时器：

```bash
sudo systemctl daemon-reload
sudo systemctl enable openmt-demo-reset.timer
sudo systemctl start openmt-demo-reset.timer

# 查看状态
systemctl status openmt-demo-reset.timer
```

---

## Windows 系统

### 方法 1: 任务计划程序

1. 打开"任务计划程序"
2. 创建基本任务
3. 名称：OpenMT Demo Reset
4. 触发器：每天 03:00
5. 操作：启动程序
   - 程序：`C:\Python39\python.exe`
   - 参数：`scripts\reset_demo_data.py`
   - 起始于：`G:\OpenMTEduInst\backend`

### 方法 2: PowerShell 脚本 + 任务计划

创建 `reset_demo_task.ps1`:

```powershell
# 切换到 backend 目录
Set-Location "G:\OpenMTEduInst\backend"

# 执行重置脚本
& "C:\Python39\python.exe" scripts\reset_demo_data.py

# 记录日志
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
"$timestamp - Demo reset completed" | Out-File -Append logs\cron_reset.log
```

在任务计划程序中配置为每天 03:00 执行此 PowerShell 脚本。

---

## Docker 环境

### docker-compose.yml 配置

```yaml
version: '3.8'

services:
  backend:
    image: openmt-backend:latest
    volumes:
      - ./backend:/app
    environment:
      - DEMO_MODE=true
      - AUTO_RESET_ENABLED=true
    # 使用 cron 容器定期执行
    depends_on:
      - demo-reset-cron

  demo-reset-cron:
    image: mcuadros/ofelia:latest
    volumes:
      - ./backend:/app
      - /var/run/docker.sock:/var/run/docker.sock:ro
    command: daemon --docker
    labels:
      ofelia.job-run.demo-reset.schedule: "@daily"
      ofelia.job-run.demo-reset.command: "python /app/scripts/reset_demo_data.py"
```

### 或使用单独的 Cron 容器

```yaml
  cron:
    image: alpine:latest
    volumes:
      - ./backend:/app
      - ./cronjobs:/etc/crontabs
    entrypoint: ["/bin/sh", "-c"]
    command:
      - |
        echo "0 3 * * * cd /app && python scripts/reset_demo_data.py" > /etc/crontabs/root
        crond -f -l 8
```

创建 `cronjobs/root` 文件：

```
0 3 * * * cd /app && python scripts/reset_demo_data.py >> /app/logs/cron_reset.log 2>&1
```

---

## 测试 Cron 任务

### 手动触发测试

```bash
# Linux/Mac
python scripts/reset_demo_data.py

# Windows
python scripts\reset_demo_data.py
```

### 查看日志

```bash
# 实时查看日志
tail -f logs/demo_reset.log

# 查看 Cron 日志
grep "CRON" /var/log/syslog | grep openmt
```

### 验证数据已重置

```sql
-- 连接到数据库
psql -U postgres -d openmt

-- 检查演示组织是否存在
SELECT name, type FROM organizations WHERE name LIKE '%星海%' OR name LIKE '%实验%';

-- 应该看到 4 个演示组织
```

---

## 故障排查

### 问题 1: Cron 任务未执行

**检查清单**：
- [ ] Cron 服务是否运行：`systemctl status cron`
- [ ] 用户权限是否正确
- [ ] 路径是否正确（使用绝对路径）
- [ ] Python 解释器路径是否正确

**解决方案**：
```bash
# 检查 Cron 日志
grep CRON /var/log/syslog

# 测试命令是否可执行
cd /path/to/OpenMTEduInst/backend && python3 scripts/reset_demo_data.py
```

### 问题 2: 重置脚本报错

**常见错误**：
- 数据库连接失败
- 依赖包缺失
- 权限不足

**解决方案**：
```bash
# 检查数据库连接
psql -U postgres -d openmt -c "SELECT 1"

# 安装依赖
pip install -r requirements.txt

# 检查日志
cat logs/demo_reset.log
```

### 问题 3: 重置后数据不完整

**可能原因**：
- 种子脚本执行失败
- 事务回滚

**解决方案**：
```bash
# 手动执行种子脚本
python scripts/seed_demo_data.py

# 检查日志中的错误信息
tail -100 logs/demo_reset.log
```

---

## 监控与告警

### 添加健康检查

在重置脚本末尾添加：

```python
# 发送重置完成通知（可选）
import requests

def send_notification(success: bool):
    """发送重置完成通知到钉钉/企业微信"""
    webhook_url = "YOUR_WEBHOOK_URL"
    
    if success:
        message = {
            "msgtype": "text",
            "text": {
                "content": "✅ OpenMT Demo 数据重置成功"
            }
        }
    else:
        message = {
            "msgtype": "text",
            "text": {
                "content": "❌ OpenMT Demo 数据重置失败，请检查日志"
            }
        }
    
    try:
        requests.post(webhook_url, json=message)
    except Exception as e:
        logger.error(f"通知发送失败: {str(e)}")
```

### 监控指标

- 重置成功率
- 重置耗时
- 数据完整性检查

---

**最后更新**: 2026-05-20  
**维护人员**: DevOps Team
