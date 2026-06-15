"""
数据库迁移脚本：为 users 表添加 phone 和 imatu_user_id 字段
支持 iMato 系统集成
"""

import sys
sys.path.insert(0, '.')

from sqlalchemy import text, inspect
from utils.database import engine, SessionLocal
import logging

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def check_column_exists(table_name: str, column_name: str, db) -> bool:
    """检查列是否存在"""
    inspector = inspect(engine)
    columns = [col['name'] for col in inspector.get_columns(table_name)]
    return column_name in columns


def check_index_exists(table_name: str, index_name: str, db) -> bool:
    """检查索引是否存在"""
    inspector = inspect(engine)
    indexes = [idx['name'] for idx in inspector.get_indexes(table_name)]
    return index_name in indexes


def migrate_users_table():
    """迁移 users 表，添加 iMato 集成相关字段"""
    
    db = SessionLocal()
    
    try:
        # 检查 users 表是否存在
        inspector = inspect(engine)
        if 'users' not in inspector.get_table_names():
            logger.warning("users 表不存在，请先创建基础表结构")
            return False
        
        logger.info("开始迁移 users 表...")
        
        # 检查并添加 phone 列
        if not check_column_exists('users', 'phone', db):
            logger.info("添加 phone 列...")
            with engine.connect() as conn:
                conn.execute(text(
                    "ALTER TABLE users ADD COLUMN phone VARCHAR(20) UNIQUE"
                ))
                conn.commit()
            logger.info("✓ phone 列添加成功")
        else:
            logger.info("✓ phone 列已存在，跳过")
        
        # 检查并添加 imatu_user_id 列
        if not check_column_exists('users', 'imatu_user_id', db):
            logger.info("添加 imatu_user_id 列...")
            with engine.connect() as conn:
                conn.execute(text(
                    "ALTER TABLE users ADD COLUMN imatu_user_id VARCHAR(100) UNIQUE"
                ))
                conn.commit()
            logger.info("✓ imatu_user_id 列添加成功")
        else:
            logger.info("✓ imatu_user_id 列已存在，跳过")
        
        # 检查并创建 phone 索引
        if not check_index_exists('users', 'ix_users_phone', db):
            logger.info("创建 phone 索引...")
            with engine.connect() as conn:
                conn.execute(text(
                    "CREATE INDEX ix_users_phone ON users(phone)"
                ))
                conn.commit()
            logger.info("✓ phone 索引创建成功")
        else:
            logger.info("✓ phone 索引已存在，跳过")
        
        # 检查并创建 imatu_user_id 索引
        if not check_index_exists('users', 'ix_users_imatu_user_id', db):
            logger.info("创建 imatu_user_id 索引...")
            with engine.connect() as conn:
                conn.execute(text(
                    "CREATE INDEX ix_users_imatu_user_id ON users(imatu_user_id)"
                ))
                conn.commit()
            logger.info("✓ imatu_user_id 索引创建成功")
        else:
            logger.info("✓ imatu_user_id 索引已存在，跳过")
        
        logger.info("\n✅ users 表迁移完成！")
        
        # 验证迁移结果
        logger.info("\n验证迁移结果...")
        inspector = inspect(engine)
        columns = [col['name'] for col in inspector.get_columns('users')]
        indexes = [idx['name'] for idx in inspector.get_indexes('users')]
        
        logger.info(f"当前 users 表列: {', '.join(columns)}")
        logger.info(f"当前 users 表索引: {', '.join(indexes)}")
        
        if 'phone' in columns and 'imatu_user_id' in columns:
            logger.info("✅ 验证成功：所有字段已添加")
            return True
        else:
            logger.error("❌ 验证失败：字段未正确添加")
            return False
        
    except Exception as e:
        logger.error(f"❌ 迁移失败: {str(e)}")
        db.rollback()
        return False
    finally:
        db.close()


def main():
    """主函数"""
    logger.info("=" * 60)
    logger.info("开始执行数据库迁移")
    logger.info("目标: 为 users 表添加 phone 和 imatu_user_id 字段")
    logger.info("=" * 60 + "\n")
    
    success = migrate_users_table()
    
    if success:
        logger.info("\n" + "=" * 60)
        logger.info("数据库迁移成功完成！")
        logger.info("=" * 60)
        sys.exit(0)
    else:
        logger.error("\n" + "=" * 60)
        logger.error("数据库迁移失败！请检查错误日志")
        logger.error("=" * 60)
        sys.exit(1)


if __name__ == "__main__":
    main()