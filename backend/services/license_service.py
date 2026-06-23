"""
许可证核心服务
提供许可证生成、验证、管理等核心功能
"""

from datetime import datetime, timedelta
import hashlib
import logging
import secrets
import string
from typing import Any, Dict, List, Optional

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from config.license_config import load_sentinel_config
from config.settings import settings
from models.license import (
    License,
    LicenseActivityLog,
    LicenseCreate,
    LicenseStatus,
    LicenseUpdate,
    LicenseValidationAttempt,
    Organization,
)
from utils.redis_client import redis_license_store

logger = logging.getLogger(__name__)


# ==================== 阶段三 3.3 激活相关异常 ====================


class LicenseAlreadyActivatedError(Exception):
    """许可证已绑定其他组织"""


class LicenseRevokedError(Exception):
    """许可证已被撤销，无法激活"""


class LicenseExpiredError(Exception):
    """许可证已过期，无法激活"""


class LicenseInvalidStateError(Exception):
    """许可证状态不允许激活（如 PENDING 之外）"""


class LicenseService:
    """许可证核心服务类"""

    def __init__(self, db: Session):
        self.db = db
        self.config = load_sentinel_config()
        self.secret_key = settings.SECRET_KEY

    def _generate_license_key(self, prefix: str = None) -> str:
        """
        生成唯一的许可证密钥

        Args:
            prefix: 密钥前缀

        Returns:
            str: 生成的许可证密钥
        """
        if prefix is None:
            prefix = self.config.license.prefix

        # 生成随机字符
        characters = string.ascii_uppercase + string.digits
        random_part = "".join(
            secrets.choice(characters) for _ in range(self.config.license.key_length)
        )

        # 添加校验和
        checksum = hashlib.md5(random_part.encode()).hexdigest()[:4].upper()

        return f"{prefix}-{random_part}-{checksum}"

    def _validate_license_key_format(self, license_key: str) -> bool:
        """
        验证许可证密钥格式

        Args:
            license_key: 许可证密钥

        Returns:
            bool: 格式是否有效

        Note:
            兼容多种密钥：
            1. 内部生成的标准格式：PREFIX-XXXX-YYYY（3 段、4 位 hex 校验和）
            2. 外部传入的手工密钥（如 DEMO-TRAINING_INSTITUTION-2026-001）：只校验非空、长度 8-128、字符集
        """
        if not license_key or not isinstance(license_key, str):
            return False
        s = license_key.strip()
        if len(s) < 8 or len(s) > 128:
            return False
        # 不允许空白/控制字符
        if any(c.isspace() or ord(c) < 32 for c in s):
            return False
        # 允许字母、数字、连字符、下划线、点（兼容 DEMO-TRAINING_INSTITUTION-2026-001 等）
        if not all(c.isalnum() or c in "-_." for c in s):
            return False

        parts = s.split("-")
        if len(parts) == 3:
            prefix, random_part, checksum = parts
            # 尝试按内部格式校验（不强制，前缀不匹配时仍放行）
            if (
                prefix == self.config.license.prefix
                and len(random_part) == self.config.license.key_length
            ):
                expected_checksum = hashlib.md5(random_part.encode()).hexdigest()[:4].upper()
                if checksum != expected_checksum:
                    return False
        # 其它长度一律放行（外部密钥 DEMO-XXX-2026-001 等）
        return True

    def create_organization(self, org_data: Dict[str, Any]) -> Organization:
        """
        创建新组织

        Args:
            org_data: 组织数据

        Returns:
            Organization: 创建的组织对象

        Raises:
            ValueError: 数据验证失败
            Exception: 数据库操作失败
        """
        try:
            # 创建组织对象
            organization = Organization(**org_data)
            self.db.add(organization)
            self.db.commit()
            self.db.refresh(organization)

            logger.info(f"组织创建成功: {organization.name} (ID: {organization.id})")
            return organization

        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"创建组织失败: {e}")
            raise Exception(f"数据库操作失败: {str(e)}")
        except Exception as e:
            logger.error(f"创建组织异常: {e}")
            raise

    def create_license(self, license_data: LicenseCreate) -> License:
        """
        创建新许可证

        Args:
            license_data: 许可证创建数据

        Returns:
            License: 创建的许可证对象

        Raises:
            ValueError: 数据验证失败
            Exception: 操作失败
        """
        try:
            # 验证组织是否存在
            organization = (
                self.db.query(Organization)
                .filter(
                    Organization.id == license_data.organization_id,
                    Organization.is_active == True,
                )
                .first()
            )

            if not organization:
                raise ValueError("指定的组织不存在或已被禁用")

            # 生成唯一许可证密钥
            license_key = self._generate_license_key()

            # 确保密钥唯一性
            while (
                self.db.query(License)
                .filter(License.license_key == license_key)
                .first()
            ):
                license_key = self._generate_license_key()

            # 计算过期时间
            expires_at = datetime.utcnow() + timedelta(days=license_data.duration_days)

            # 创建许可证对象
            license_obj = License(
                license_key=license_key,
                organization_id=license_data.organization_id,
                product_id=license_data.product_id,
                license_type=license_data.license_type,
                expires_at=expires_at,
                max_users=license_data.max_users,
                max_devices=license_data.max_devices,
                features=license_data.features,
                notes=license_data.notes,
                status=LicenseStatus.ACTIVE,
            )

            # 保存到数据库
            self.db.add(license_obj)
            self.db.commit()
            self.db.refresh(license_obj)

            # 更新组织的许可证计数
            organization.license_count += 1
            self.db.commit()

            # 存储到Redis缓存
            cache_data = {
                "id": license_obj.id,
                "license_key": license_obj.license_key,
                "organization_id": license_obj.organization_id,
                "status": license_obj.status.value,
                "issued_at": license_obj.issued_at.isoformat(),
                "expires_at": license_obj.expires_at.isoformat(),
                "max_users": license_obj.max_users,
                "current_users": license_obj.current_users,
                "features": license_obj.features,
            }
            redis_license_store.store_license(license_key, cache_data)

            # 记录活动日志
            self._log_license_activity(
                license_key=license_obj.license_key,
                organization_id=license_obj.organization_id,
                activity_type="license_created",
                details={
                    "duration_days": license_data.duration_days,
                    "max_users": license_data.max_users,
                    "license_type": license_data.license_type.value,
                },
            )

            logger.info(f"许可证创建成功: {license_key} (组织: {organization.name})")
            return license_obj

        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"创建许可证失败: {e}")
            raise Exception(f"数据库操作失败: {str(e)}")
        except Exception as e:
            logger.error(f"创建许可证异常: {e}")
            raise

    def validate_license(
        self, license_key: str, ip_address: str = None, user_agent: str = None
    ) -> Dict[str, Any]:
        """
        验证许可证有效性

        Args:
            license_key: 许可证密钥
            ip_address: IP地址（可选）
            user_agent: 用户代理（可选）

        Returns:
            Dict: 验证结果
        """
        validation_result = {
            "is_valid": False,
            "license_key": license_key,
            "error": None,
            "license_info": None,
        }

        try:
            # 格式验证
            if not self._validate_license_key_format(license_key):
                validation_result["error"] = "许可证密钥格式无效"
                self._log_validation_attempt(
                    license_key, ip_address, user_agent, False, validation_result
                )
                return validation_result

            # 先检查Redis缓存
            cached_license = redis_license_store.get_license(license_key)
            if cached_license:
                # 检查缓存中的状态
                if (
                    cached_license.get("status") == "active"
                    and datetime.fromisoformat(cached_license["expires_at"])
                    > datetime.utcnow()
                ):

                    validation_result["is_valid"] = True
                    validation_result["license_info"] = cached_license
                    self._log_validation_attempt(
                        license_key, ip_address, user_agent, True, validation_result
                    )
                    return validation_result

            # 缓存未命中，查询数据库
            license_obj = (
                self.db.query(License)
                .filter(License.license_key == license_key)
                .first()
            )

            if not license_obj:
                validation_result["error"] = "许可证不存在"
                self._log_validation_attempt(
                    license_key, ip_address, user_agent, False, validation_result
                )
                return validation_result

            # 检查许可证状态
            if license_obj.status != LicenseStatus.ACTIVE:
                validation_result["error"] = (
                    f"许可证状态无效: {license_obj.status.value}"
                )
                self._log_validation_attempt(
                    license_key, ip_address, user_agent, False, validation_result
                )
                return validation_result

            # 检查是否过期
            if license_obj.is_expired:
                # 更新数据库状态
                license_obj.status = LicenseStatus.EXPIRED
                self.db.commit()
                validation_result["error"] = "许可证已过期"
                self._log_validation_attempt(
                    license_key, ip_address, user_agent, False, validation_result
                )
                return validation_result

            # 检查是否被禁用
            if not license_obj.is_active:
                validation_result["error"] = "许可证已被禁用"
                self._log_validation_attempt(
                    license_key, ip_address, user_agent, False, validation_result
                )
                return validation_result

            # 验证通过
            validation_result["is_valid"] = True
            validation_result["license_info"] = {
                "id": license_obj.id,
                "license_key": license_obj.license_key,
                "organization_id": license_obj.organization_id,
                "status": license_obj.status.value,
                "issued_at": license_obj.issued_at.isoformat(),
                "expires_at": license_obj.expires_at.isoformat(),
                "max_users": license_obj.max_users,
                "current_users": license_obj.current_users,
                "features": license_obj.features,
            }

            # 更新Redis缓存
            redis_license_store.store_license(
                license_key, validation_result["license_info"]
            )

            # 记录验证成功
            self._log_validation_attempt(
                license_key, ip_address, user_agent, True, validation_result
            )

            logger.info(f"许可证验证成功: {license_key}")
            return validation_result

        except Exception as e:
            logger.error(f"许可证验证异常: {e}")
            validation_result["error"] = f"验证过程出错: {str(e)}"
            self._log_validation_attempt(
                license_key, ip_address, user_agent, False, validation_result
            )
            return validation_result

    def revoke_license(self, license_key: str, reason: str = None) -> bool:
        """
        撤销许可证

        Args:
            license_key: 许可证密钥
            reason: 撤销原因（可选）

        Returns:
            bool: 是否成功撤销
        """
        try:
            license_obj = (
                self.db.query(License)
                .filter(License.license_key == license_key)
                .first()
            )

            if not license_obj:
                logger.warning(f"尝试撤销不存在的许可证: {license_key}")
                return False

            # 更新状态
            license_obj.status = LicenseStatus.REVOKED
            license_obj.is_active = False
            license_obj.updated_at = datetime.utcnow()

            self.db.commit()

            # 从Redis删除缓存
            redis_license_store.delete_license(license_key)

            # 记录活动日志
            self._log_license_activity(
                license_key=license_key,
                organization_id=license_obj.organization_id,
                activity_type="license_revoked",
                details={"reason": reason} if reason else {},
            )

            logger.info(f"许可证已撤销: {license_key}")
            return True

        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"撤销许可证失败: {e}")
            return False
        except Exception as e:
            logger.error(f"撤销许可证异常: {e}")
            return False

    def get_organization_licenses(self, organization_id: int) -> List[License]:
        """
        获取组织的所有许可证

        Args:
            organization_id: 组织ID

        Returns:
            List[License]: 许可证列表
        """
        try:
            licenses = (
                self.db.query(License)
                .filter(License.organization_id == organization_id)
                .order_by(License.created_at.desc())
                .all()
            )
            return licenses
        except Exception as e:
            logger.error(f"获取组织许可证失败: {e}")
            return []

    # ============================================================
    # 阶段三 3.3：许可证自激活
    # ============================================================

    def activate_license_for_org(
        self,
        license_key: str,
        org_id: int,
        activated_by_user: Optional[int] = None,
    ) -> Dict[str, Any]:
        """
        组织管理员自助激活许可证

        状态机：
        - PENDING  → ACTIVE（首次激活）
        - ACTIVE   → 已激活的同 org 调用 → 返回 200 + features（幂等）
        - ACTIVE   → 已绑定的不同 org → 抛 LicenseAlreadyActivatedError
        - REVOKED  → 抛 LicenseRevokedError
        - EXPIRED  → 抛 LicenseExpiredError

        Returns:
            dict: {
                license, features, max_users, max_devices,
                expires_at, days_until_expiry, already_activated
            }

        Raises:
            ValueError: 密钥格式无效
            LicenseAlreadyActivatedError: 已被其他组织绑定
            LicenseRevokedError: 已撤销
            LicenseExpiredError: 已过期
            LicenseInvalidStateError: 状态机不允许
        """
        # 1) 格式校验
        if not self._validate_license_key_format(license_key):
            raise ValueError("许可证密钥格式无效")

        # 2) 行级锁查询
        license_obj = (
            self.db.query(License)
            .filter(License.license_key == license_key)
            .with_for_update()
            .first()
        )
        if not license_obj:
            raise ValueError("许可证不存在")

        # 3) 状态机分支
        already_activated = False

        if license_obj.status == LicenseStatus.REVOKED:
            raise LicenseRevokedError(f"许可证 {license_key} 已被撤销")

        if license_obj.is_expired:
            # 自动纠正 DB 状态
            license_obj.status = LicenseStatus.EXPIRED
            self.db.commit()
            raise LicenseExpiredError(f"许可证 {license_key} 已过期")

        if license_obj.status == LicenseStatus.EXPIRED:
            raise LicenseExpiredError(f"许可证 {license_key} 已过期")

        if license_obj.status == LicenseStatus.ACTIVE:
            # 幂等：已激活
            if (
                license_obj.organization_id
                and license_obj.organization_id != org_id
            ):
                raise LicenseAlreadyActivatedError(
                    f"许可证已被组织 {license_obj.organization_id} 绑定"
                )
            already_activated = True
        elif license_obj.status == LicenseStatus.PENDING:
            # 首次激活：绑定 org + 写 activated_at
            license_obj.organization_id = org_id
            license_obj.activated_at = datetime.utcnow()
            license_obj.status = LicenseStatus.ACTIVE
        else:
            raise LicenseInvalidStateError(
                f"许可证状态 {license_obj.status.value} 不允许激活"
            )

        # 4) 同步组织 license_count
        org = (
            self.db.query(Organization)
            .filter(Organization.id == org_id)
            .first()
        )
        if org and not already_activated:
            org.license_count = (org.license_count or 0) + 1

        license_obj.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(license_obj)

        # 5) 同步 Redis 缓存
        cache_data = {
            "id": license_obj.id,
            "license_key": license_obj.license_key,
            "organization_id": license_obj.organization_id,
            "status": license_obj.status.value,
            "issued_at": license_obj.issued_at.isoformat(),
            "expires_at": license_obj.expires_at.isoformat(),
            "max_users": license_obj.max_users,
            "current_users": license_obj.current_users,
            "features": license_obj.features or [],
        }
        try:
            redis_license_store.store_license(license_key, cache_data)
        except Exception as e:  # noqa: BLE001
            logger.warning("Redis 缓存写入失败（不阻塞激活）: %s", e)

        # 6) 写活动日志
        self._log_license_activity(
            license_key=license_key,
            organization_id=org_id,
            activity_type=(
                "license_activated_idempotent"
                if already_activated
                else "license_activated"
            ),
            details={
                "org_id": org_id,
                "activated_by_user": activated_by_user,
                "already_activated": already_activated,
                "license_type": license_obj.license_type.value,
            },
        )

        # 7) 提取 features
        features = self.get_active_features_for_org(org_id)

        return {
            "license": license_obj,
            "features": features,
            "max_users": license_obj.max_users,
            "max_devices": license_obj.max_devices,
            "expires_at": license_obj.expires_at,
            "days_until_expiry": license_obj.days_until_expiry,
            "license_type": license_obj.license_type.value,
            "already_activated": already_activated,
        }

    def get_active_features_for_org(self, org_id: int) -> List[str]:
        """
        聚合当前 org 所有 ACTIVE 且未过期的 license.features，去重后返回。

        同时把聚合结果回写到 ``tenant_feature_flags`` 表，保证：
        - features 列表作为 feature_key 出现时 is_enabled=True
        - license 过期/撤销后对应的 feature 自动置为 False

        用于前端路由守卫：返回的 feature 列表决定哪些模块可见。
        """
        try:
            now = datetime.utcnow()
            rows = (
                self.db.query(License.features)
                .filter(
                    License.organization_id == org_id,
                    License.status == LicenseStatus.ACTIVE,
                    License.is_active.is_(True),
                    License.expires_at > now,
                )
                .all()
            )
            seen = set()
            result: List[str] = []
            for (feats,) in rows:
                if not feats:
                    continue
                for f in feats:
                    if f and f not in seen:
                        seen.add(f)
                        result.append(f)

            # --- 写入/刷新 TenantFeatureFlag ---
            try:
                from models.tenant import TenantFeatureFlag

                # 先读取该 org 已有的所有 flag（防止与人工配置冲突）
                existing = (
                    self.db.query(TenantFeatureFlag)
                    .filter(TenantFeatureFlag.org_id == org_id)
                    .all()
                )
                existing_map = {flag.feature_key: flag for flag in existing}

                # 1) features 列表中的：is_enabled=True
                for key in result:
                    flag = existing_map.get(key)
                    if flag is None:
                        flag = TenantFeatureFlag(
                            org_id=org_id, feature_key=key, is_enabled=True
                        )
                        self.db.add(flag)
                    else:
                        flag.is_enabled = True
                        flag.updated_at = now
                    existing_map.pop(key, None)

                # 2) 剩下由 license 注入但不在 active features 中的自动关闭
                #    （仅对曾由 license 注入的 flag 做操作，避免影响其他业务开关）
                for key, flag in list(existing_map.items()):
                    # 标记由 license 注入：通过 custom_metadata.license_managed 标识
                    # 如果没有标识，保守保留原值（由人工配置的开关应保留）
                    extra = flag.extra_config or {}
                    if extra.get("license_managed"):
                        flag.is_enabled = False
                        flag.updated_at = now

                self.db.commit()
            except Exception as exc:  # noqa: BLE001
                logger.warning(
                    "同步 License.features -> TenantFeatureFlag 失败 org=%s err=%s",
                    org_id, exc,
                )
                self.db.rollback()

            return result
        except Exception as e:  # noqa: BLE001
            logger.error("聚合 org features 失败: %s", e)
            return []

    def get_active_licenses_for_org(self, org_id: int) -> List[License]:
        """获取当前 org 的所有有效许可证（ACTIVE 且未过期）"""
        try:
            now = datetime.utcnow()
            return (
                self.db.query(License)
                .filter(
                    License.organization_id == org_id,
                    License.status == LicenseStatus.ACTIVE,
                    License.is_active.is_(True),
                    License.expires_at > now,
                )
                .order_by(License.expires_at.asc())
                .all()
            )
        except Exception as e:  # noqa: BLE001
            logger.error("获取 org 有效许可证失败: %s", e)
            return []

    def update_license(
        self, license_key: str, update_data: LicenseUpdate
    ) -> Optional[License]:
        """
        更新许可证信息

        Args:
            license_key: 许可证密钥
            update_data: 更新数据

        Returns:
            License: 更新后的许可证对象，如果不存在返回None
        """
        try:
            license_obj = (
                self.db.query(License)
                .filter(License.license_key == license_key)
                .first()
            )

            if not license_obj:
                return None

            # 更新字段
            update_fields = update_data.dict(exclude_unset=True)
            for field, value in update_fields.items():
                if hasattr(license_obj, field):
                    setattr(license_obj, field, value)

            license_obj.updated_at = datetime.utcnow()
            self.db.commit()
            self.db.refresh(license_obj)

            # 更新Redis缓存
            cache_data = {
                "id": license_obj.id,
                "license_key": license_obj.license_key,
                "organization_id": license_obj.organization_id,
                "status": license_obj.status.value,
                "issued_at": license_obj.issued_at.isoformat(),
                "expires_at": license_obj.expires_at.isoformat(),
                "max_users": license_obj.max_users,
                "current_users": license_obj.current_users,
                "features": license_obj.features,
            }
            redis_license_store.store_license(license_key, cache_data)

            logger.info(f"许可证已更新: {license_key}")
            return license_obj

        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"更新许可证失败: {e}")
            return None
        except Exception as e:
            logger.error(f"更新许可证异常: {e}")
            return None

    def _log_license_activity(
        self,
        license_key: str,
        organization_id: int,
        activity_type: str,
        details: Dict[str, Any],
    ):
        """记录许可证活动日志"""
        try:
            log_entry = LicenseActivityLog(
                license_key=license_key,
                organization_id=organization_id,
                activity_type=activity_type,
                details=details,
            )
            self.db.add(log_entry)
            self.db.commit()
        except Exception as e:
            logger.error(f"记录活动日志失败: {e}")
            self.db.rollback()

    def _log_validation_attempt(
        self,
        license_key: str,
        ip_address: str,
        user_agent: str,
        is_valid: bool,
        result: Dict[str, Any],
    ):
        """记录许可证验证尝试"""
        try:
            validation_log = LicenseValidationAttempt(
                license_key=license_key,
                ip_address=ip_address,
                user_agent=user_agent,
                is_valid=is_valid,
                validation_result=result,
            )
            self.db.add(validation_log)
            self.db.commit()
        except Exception as e:
            logger.error(f"记录验证日志失败: {e}")
            self.db.rollback()

    def get_license_statistics(self) -> Dict[str, Any]:
        """
        获取许可证统计信息

        Returns:
            Dict: 统计信息
        """
        try:
            total_count = self.db.query(License).count()
            active_count = (
                self.db.query(License)
                .filter(License.status == LicenseStatus.ACTIVE)
                .count()
            )
            expired_count = (
                self.db.query(License)
                .filter(License.status == LicenseStatus.EXPIRED)
                .count()
            )
            revoked_count = (
                self.db.query(License)
                .filter(License.status == LicenseStatus.REVOKED)
                .count()
            )

            # 获取Redis统计
            redis_stats = redis_license_store.get_statistics()

            return {
                "database_stats": {
                    "total_licenses": total_count,
                    "active_licenses": active_count,
                    "expired_licenses": expired_count,
                    "revoked_licenses": revoked_count,
                },
                "cache_stats": redis_stats,
                "generated_at": datetime.utcnow().isoformat(),
            }
        except Exception as e:
            logger.error(f"获取统计信息失败: {e}")
            return {"error": str(e)}
