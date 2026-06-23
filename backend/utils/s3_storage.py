"""
S3/MinIO 对象存储服务

用于云端备份、欢迎邮件附件、用户头像、教学资源等所有文件存储。

支持：
- AWS S3 / MinIO（通过 boto3）
- 预签名 URL 生成（前端直传/下载）
- 多租户 Key 前缀隔离（路径格式 ``openmt/{org_id}/{module}/{filename}``）
- 缺失 boto3 时自动降级到本地文件系统（仅开发用）

环境变量：
- S3_ENDPOINT_URL    S3/MinIO 端点（留空表示 AWS 官方）
- S3_ACCESS_KEY      Access Key
- S3_SECRET_KEY      Secret Key
- S3_BUCKET          Bucket 名称（默认 ``openmt-backups``）
- S3_REGION          Region（默认 ``us-east-1``）
"""

from __future__ import annotations

import logging
import os
import uuid
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

# 尝试加载 boto3，缺失时降级
try:
    import boto3
    from botocore.client import Config as BotoConfig
    from botocore.exceptions import BotoCoreError, ClientError
    _BOTO3_AVAILABLE = True
except ImportError:
    _BOTO3_AVAILABLE = False
    BotoConfig = None  # type: ignore
    BotoCoreError = Exception  # type: ignore
    ClientError = Exception  # type: ignore


class S3StorageService:
    """S3/MinIO 对象存储服务（多租户隔离）"""

    def __init__(self) -> None:
        self.bucket = os.getenv("S3_BUCKET", "openmt-backups")
        self.endpoint_url = os.getenv("S3_ENDPOINT_URL", "").strip() or None
        self.region = os.getenv("S3_REGION", "us-east-1")
        self._client: Optional[Any] = None
        self._local_fallback_dir = os.getenv(
            "S3_LOCAL_FALLBACK_DIR", "./_local_s3_fallback"
        )
        self._init_client()

    def _init_client(self) -> None:
        """初始化 S3 客户端"""
        if not _BOTO3_AVAILABLE:
            logger.warning("boto3 未安装，S3 服务将使用本地降级模式")
            return

        access_key = os.getenv("S3_ACCESS_KEY", "")
        secret_key = os.getenv("S3_SECRET_KEY", "")

        if not access_key or not secret_key:
            logger.warning(
                "S3_ACCESS_KEY/S3_SECRET_KEY 未配置，S3 服务将使用本地降级模式"
            )
            return

        try:
            self._client = boto3.client(
                "s3",
                endpoint_url=self.endpoint_url,
                aws_access_key_id=access_key,
                aws_secret_access_key=secret_key,
                region_name=self.region,
                config=BotoConfig(signature_version="s3v4"),
            )
            # 健康检查：尝试 head bucket
            try:
                self._client.head_bucket(Bucket=self.bucket)
            except ClientError as exc:
                code = exc.response.get("Error", {}).get("Code", "")
                if code in ("404", "NoSuchBucket"):
                    logger.info("Bucket %s 不存在，尝试创建", self.bucket)
                    self._create_bucket()
                else:
                    raise
            logger.info(
                "✅ S3 客户端初始化成功: endpoint=%s bucket=%s",
                self.endpoint_url or "AWS",
                self.bucket,
            )
        except Exception as exc:  # noqa: BLE001
            logger.error("S3 客户端初始化失败: %s", exc)
            self._client = None

    def _create_bucket(self) -> None:
        if self._client is None:
            return
        try:
            self._client.create_bucket(Bucket=self.bucket)
        except Exception as exc:  # noqa: BLE001
            logger.warning("Bucket 创建失败（可能无权限）: %s", exc)

    @property
    def is_available(self) -> bool:
        return self._client is not None

    def _build_key(self, org_id: int, module: str, filename: str) -> str:
        """生成多租户隔离的存储 Key"""
        safe = filename.replace(" ", "_")
        return f"openmt/{org_id}/{module}/{safe}"

    # --------------------------------------------------------
    # 上传/下载
    # --------------------------------------------------------

    def upload_file(
        self,
        org_id: int,
        module: str,
        filename: str,
        file_bytes: bytes,
        content_type: str = "application/octet-stream",
    ) -> Dict[str, str]:
        """上传文件，返回存储元信息"""
        key = self._build_key(org_id, module, filename)

        if self._client is None:
            # 本地降级
            return self._upload_local(org_id, module, filename, file_bytes, key)

        try:
            self._client.put_object(
                Bucket=self.bucket,
                Key=key,
                Body=file_bytes,
                ContentType=content_type,
                Metadata={"org_id": str(org_id), "module": module},
            )
            return {
                "bucket": self.bucket,
                "key": key,
                "endpoint": self.endpoint_url or "https://s3.amazonaws.com",
                "size": str(len(file_bytes)),
                "uploaded_at": datetime.utcnow().isoformat(),
            }
        except (BotoCoreError, ClientError) as exc:  # type: ignore[misc]
            logger.error("S3 上传失败: key=%s err=%s", key, exc)
            # 失败时回退到本地
            return self._upload_local(org_id, module, filename, file_bytes, key)

    def _upload_local(
        self,
        org_id: int,
        module: str,
        filename: str,
        file_bytes: bytes,
        key: str,
    ) -> Dict[str, str]:
        """本地文件系统降级（仅用于开发）"""
        import pathlib

        target = pathlib.Path(self._local_fallback_dir) / key
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(file_bytes)
        logger.warning("S3 降级到本地: %s", target)
        return {
            "bucket": "local-fallback",
            "key": str(target),
            "endpoint": "file://",
            "size": str(len(file_bytes)),
            "uploaded_at": datetime.utcnow().isoformat(),
        }

    def download_file(self, org_id: int, module: str, filename: str) -> Optional[bytes]:
        """下载文件"""
        key = self._build_key(org_id, module, filename)
        if self._client is None:
            import pathlib
            target = pathlib.Path(self._local_fallback_dir) / key
            return target.read_bytes() if target.exists() else None
        try:
            obj = self._client.get_object(Bucket=self.bucket, Key=key)
            return obj["Body"].read()
        except (BotoCoreError, ClientError) as exc:  # type: ignore[misc]
            logger.error("S3 下载失败: key=%s err=%s", key, exc)
            return None

    def delete_file(self, org_id: int, module: str, filename: str) -> bool:
        key = self._build_key(org_id, module, filename)
        if self._client is None:
            import pathlib
            target = pathlib.Path(self._local_fallback_dir) / key
            if target.exists():
                target.unlink()
            return True
        try:
            self._client.delete_object(Bucket=self.bucket, Key=key)
            return True
        except (BotoCoreError, ClientError) as exc:  # type: ignore[misc]
            logger.error("S3 删除失败: %s", exc)
            return False

    def list_files(self, org_id: int, module: str) -> List[Dict[str, Any]]:
        """列出某 org 某 module 下的所有文件"""
        prefix = f"openmt/{org_id}/{module}/"
        if self._client is None:
            import pathlib
            base = pathlib.Path(self._local_fallback_dir) / prefix
            if not base.exists():
                return []
            return [{"key": str(p.relative_to(self._local_fallback_dir)), "size": p.stat().st_size} for p in base.rglob("*") if p.is_file()]
        try:
            response = self._client.list_objects_v2(
                Bucket=self.bucket, Prefix=prefix
            )
            return [
                {
                    "key": item["Key"],
                    "size": item.get("Size", 0),
                    "last_modified": item.get("LastModified", "").isoformat()
                    if hasattr(item.get("LastModified", ""), "isoformat")
                    else str(item.get("LastModified", "")),
                }
                for item in response.get("Contents", [])
            ]
        except (BotoCoreError, ClientError) as exc:  # type: ignore[misc]
            logger.error("S3 列表失败: %s", exc)
            return []

    def generate_presigned_url(
        self,
        org_id: int,
        module: str,
        filename: str,
        expires_in: int = 3600,
        method: str = "get_object",
    ) -> Optional[str]:
        """生成预签名 URL（前端可直传/下载，无需暴露 AK/SK）"""
        if self._client is None:
            return None
        key = self._build_key(org_id, module, filename)
        try:
            return self._client.generate_presigned_url(
                ClientMethod=method,
                Params={"Bucket": self.bucket, "Key": key},
                ExpiresIn=expires_in,
            )
        except Exception as exc:  # noqa: BLE001
            logger.error("生成预签名 URL 失败: %s", exc)
            return None

    def upload_backup_snapshot(
        self, org_id: int, snapshot_id: str, payload: bytes
    ) -> Dict[str, str]:
        """上传备份快照（专用入口，文件名带时间戳）"""
        ts = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        filename = f"{snapshot_id}_{ts}.tar.gz"
        return self.upload_file(
            org_id=org_id,
            module="backups",
            filename=filename,
            file_bytes=payload,
            content_type="application/gzip",
        )


# 全局单例
_s3_instance: Optional[S3StorageService] = None


def get_s3_service() -> S3StorageService:
    global _s3_instance
    if _s3_instance is None:
        _s3_instance = S3StorageService()
    return _s3_instance
