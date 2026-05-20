"""
Demo 数据自动重置脚本
每天凌晨 3:00 执行，恢复演示数据到初始状态
"""

import asyncio
import logging
from datetime import datetime
from sqlalchemy import text
from utils.database import SessionLocal, engine

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/demo_reset.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


async def reset_demo_database():
    """重置演示数据库到初始状态"""
    
    logger.info("=" * 60)
    logger.info(f"[{datetime.now()}] 开始重置演示数据...")
    logger.info("=" * 60)
    
    db = SessionLocal()
    
    try:
        # 1. 删除所有演示组织的数据（按依赖关系逆序删除）
        logger.info("步骤 1: 清理现有数据...")
        
        # 删除 Token 使用记录
        db.execute(text("DELETE FROM token_usage_records"))
        logger.info("  - 已删除 Token 使用记录")
        
        # 删除 Token 充值记录
        db.execute(text("DELETE FROM token_recharge_records"))
        logger.info("  - 已删除 Token 充值记录")
        
        # 删除用户 Token 余额
        db.execute(text("DELETE FROM user_token_balances"))
        logger.info("  - 已删除用户 Token 余额")
        
        # 删除模块租赁记录
        db.execute(text("DELETE FROM module_rental_records"))
        logger.info("  - 已删除模块租赁记录")
        
        # 删除用户许可证关联
        db.execute(text("DELETE FROM user_licenses"))
        logger.info("  - 已删除用户许可证关联")
        
        # 删除许可证
        db.execute(text("DELETE FROM licenses WHERE license_key LIKE 'DEMO-%'"))
        logger.info("  - 已删除演示许可证")
        
        # 删除用户（保留系统管理员）
        db.execute(text("DELETE FROM users WHERE email LIKE '%@student.local' OR email LIKE '%starrobotics%' OR email LIKE '%xxprimary%' OR email LIKE '%xxvocational%' OR email LIKE '%xxedu%'"))
        logger.info("  - 已删除演示用户")
        
        # 删除教室
        db.execute(text("DELETE FROM classrooms WHERE organization_id IN (SELECT id FROM organizations WHERE name LIKE '%星海%' OR name LIKE '%实验%' OR name LIKE '%职业%' OR name LIKE '%监管%')"))
        logger.info("  - 已删除演示教室")
        
        # 删除组织
        db.execute(text("DELETE FROM organizations WHERE name LIKE '%星海%' OR name LIKE '%实验%' OR name LIKE '%职业%' OR name LIKE '%监管%'"))
        logger.info("  - 已删除演示组织")
        
        db.commit()
        logger.info("✅ 数据清理完成")
        
        # 2. 重新导入种子数据
        logger.info("\n步骤 2: 重新导入种子数据...")
        
        # 调用种子脚本
        from scripts.seed_demo_data import seed_demo_data
        seed_demo_data()
        
        logger.info("✅ 种子数据导入完成")
        
        # 3. 清理缓存（如果使用 Redis）
        logger.info("\n步骤 3: 清理缓存...")
        try:
            from utils.redis_client import redis_client
            # 删除所有以 demo_ 开头的键
            demo_keys = redis_client.keys("demo_*")
            if demo_keys:
                redis_client.delete(*demo_keys)
                logger.info(f"  - 已删除 {len(demo_keys)} 个缓存键")
            else:
                logger.info("  - 无需清理的缓存")
        except Exception as e:
            logger.warning(f"  - 缓存清理跳过: {str(e)}")
        
        logger.info("\n" + "=" * 60)
        logger.info(f"[{datetime.now()}] ✅ 演示数据重置完成！")
        logger.info("=" * 60)
        
    except Exception as e:
        db.rollback()
        logger.error(f"\n❌ 重置失败: {str(e)}", exc_info=True)
        raise
    finally:
        db.close()


def main():
    """主入口"""
    asyncio.run(reset_demo_database())


if __name__ == "__main__":
    main()
