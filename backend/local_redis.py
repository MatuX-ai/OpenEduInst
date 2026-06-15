# -*- coding: utf-8 -*-
"""
OpenMT 开发用 - 微型 Redis-compatible 服务器（RESP 协议子集）
在 Windows 本地监听 localhost:6379，提供项目用到的命令：
  PING / SET / GET / INCR / DECR / EXPIRE / KEYS / DEL / EXISTS / COMMAND
仅用于开发与集成测试；生产环境请用真正的 Redis / Docker Redis。

使用：
    python local_redis.py             # 默认 6379
    python local_redis.py --port 6379
"""

from __future__ import annotations

import argparse
import socket
import sys
import threading
import time
from collections import OrderedDict


class TinyRedis:
    """线程安全的 KV 存储，支持带过期时间。"""

    def __init__(self) -> None:
        self._data: "OrderedDict[str, tuple]" = OrderedDict()  # key -> (value, expire_ts or None)
        self._lock = threading.Lock()

    # ------------------------------------------------------------
    # 内部工具
    # ------------------------------------------------------------
    def _gc_if_expired(self, key: str) -> bool:
        """返回 True 表示 key 已过期并被移除。"""
        if key not in self._data:
            return False
        _, expire_ts = self._data[key]
        if expire_ts is not None and expire_ts < time.time():
            del self._data[key]
            return True
        return False

    # ------------------------------------------------------------
    # 命令实现
    # ------------------------------------------------------------
    def cmd_ping(self, _args) -> bytes:
        return b"+PONG\r\n"

    def cmd_set(self, args) -> bytes:
        if len(args) < 2:
            return b"-ERR wrong number of arguments for 'set' command\r\n"
        key, value = args[0], args[1]
        expire_ts = None
        i = 2
        while i < len(args):
            opt = args[i].upper()
            if opt == b"EX" and i + 1 < len(args):
                expire_ts = time.time() + int(args[i + 1])
                i += 2
            elif opt == b"PX" and i + 1 < len(args):
                expire_ts = time.time() + int(args[i + 1]) / 1000.0
                i += 2
            else:
                i += 1
        with self._lock:
            self._data[key.decode() if isinstance(key, bytes) else key] = (
                value if isinstance(value, bytes) else value.encode(),
                expire_ts,
            )
        return b"+OK\r\n"

    def cmd_get(self, args) -> bytes:
        if not args:
            return b"-ERR wrong number of arguments for 'get' command\r\n"
        key = args[0].decode() if isinstance(args[0], bytes) else args[0]
        with self._lock:
            self._gc_if_expired(key)
            if key not in self._data:
                return b"_\r\n"
            value = self._data[key][0]
        if isinstance(value, str):
            value = value.encode()
        return b"$" + str(len(value)).encode() + b"\r\n" + value + b"\r\n"

    def cmd_incr(self, args) -> bytes:
        if not args:
            return b"-ERR wrong number of arguments for 'incr' command\r\n"
        key = args[0].decode() if isinstance(args[0], bytes) else args[0]
        with self._lock:
            self._gc_if_expired(key)
            if key in self._data:
                val = int(self._data[key][0])
            else:
                val = 0
            val += 1
            expire = self._data[key][1] if key in self._data else None
            self._data[key] = (str(val).encode(), expire)
        return b":" + str(val).encode() + b"\r\n"

    def cmd_decr(self, args) -> bytes:
        if not args:
            return b"-ERR wrong number of arguments for 'decr' command\r\n"
        key = args[0].decode() if isinstance(args[0], bytes) else args[0]
        with self._lock:
            self._gc_if_expired(key)
            if key in self._data:
                val = int(self._data[key][0])
            else:
                val = 0
            val -= 1
            expire = self._data[key][1] if key in self._data else None
            self._data[key] = (str(val).encode(), expire)
        return b":" + str(val).encode() + b"\r\n"

    def cmd_incrby(self, args) -> bytes:
        if len(args) < 2:
            return b"-ERR wrong number of arguments for 'incrby' command\r\n"
        key = args[0].decode() if isinstance(args[0], bytes) else args[0]
        delta = int(args[1])
        with self._lock:
            self._gc_if_expired(key)
            if key in self._data:
                val = int(self._data[key][0])
            else:
                val = 0
            val += delta
            expire = self._data[key][1] if key in self._data else None
            self._data[key] = (str(val).encode(), expire)
        return b":" + str(val).encode() + b"\r\n"

    def cmd_decrby(self, args) -> bytes:
        if len(args) < 2:
            return b"-ERR wrong number of arguments for 'decrby' command\r\n"
        key = args[0].decode() if isinstance(args[0], bytes) else args[0]
        delta = int(args[1])
        with self._lock:
            self._gc_if_expired(key)
            if key in self._data:
                val = int(self._data[key][0])
            else:
                val = 0
            val -= delta
            expire = self._data[key][1] if key in self._data else None
            self._data[key] = (str(val).encode(), expire)
        return b":" + str(val).encode() + b"\r\n"

    def cmd_ttl(self, args) -> bytes:
        if not args:
            return b":-2\r\n"
        key = args[0].decode() if isinstance(args[0], bytes) else args[0]
        with self._lock:
            if self._gc_if_expired(key):
                return b":-2\r\n"
            if key not in self._data:
                return b":-2\r\n"
            _, expire_ts = self._data[key]
            if expire_ts is None:
                return b":-1\r\n"
            remaining = int(expire_ts - time.time())
            return b":" + str(max(remaining, -2)).encode() + b"\r\n"

    def cmd_type(self, args) -> bytes:
        if not args:
            return b"+none\r\n"
        key = args[0].decode() if isinstance(args[0], bytes) else args[0]
        with self._lock:
            if self._gc_if_expired(key):
                return b"+none\r\n"
            if key in self._data:
                return b"+string\r\n"
        return b"+none\r\n"

    def cmd_select(self, args) -> bytes:
        return b"+OK\r\n"

    def cmd_flushdb(self, _args) -> bytes:
        with self._lock:
            self._data.clear()
        return b"+OK\r\n"

    def cmd_flushall(self, _args) -> bytes:
        with self._lock:
            self._data.clear()
        return b"+OK\r\n"

    def cmd_info(self, _args) -> bytes:
        info = b"# Server\r\nredis_version:7.2.9-local\r\nos:Windows\r\n"
        info += b"process_id:" + str(__import__("os").getpid()).encode() + b"\r\n"
        info += b"tcp_port:6379\r\n"
        info += b"# Keyspace\r\n"
        with self._lock:
            info += b"db0:keys=" + str(len(self._data)).encode() + b",expires=0,avg_ttl=0\r\n"
        return b"$" + str(len(info)).encode() + b"\r\n" + info + b"\r\n"

    def cmd_dbsize(self, _args) -> bytes:
        with self._lock:
            n = len(self._data)
        return b":" + str(n).encode() + b"\r\n"

    def cmd_expire(self, args) -> bytes:
        if len(args) < 2:
            return b"-ERR wrong number of arguments for 'expire' command\r\n"
        key = args[0].decode() if isinstance(args[0], bytes) else args[0]
        seconds = int(args[1])
        with self._lock:
            if key not in self._data:
                return b":0\r\n"
            val, _ = self._data[key]
            self._data[key] = (val, time.time() + seconds)
        return b":1\r\n"

    def cmd_keys(self, args) -> bytes:
        if not args:
            return b"-ERR wrong number of arguments for 'keys' command\r\n"
        pattern = args[0].decode() if isinstance(args[0], bytes) else args[0]
        import fnmatch

        with self._lock:
            matched = []
            for k in list(self._data.keys()):
                if self._gc_if_expired(k):
                    continue
                if fnmatch.fnmatchcase(k, pattern.replace(b"*" if isinstance(pattern, bytes) else pattern, pattern)):
                    matched.append(k.encode() if isinstance(k, str) else k)
        resp = b"*" + str(len(matched)).encode() + b"\r\n"
        for k in matched:
            kb = k if isinstance(k, bytes) else k.encode()
            resp += b"$" + str(len(kb)).encode() + b"\r\n" + kb + b"\r\n"
        return resp

    def cmd_del(self, args) -> bytes:
        if not args:
            return b"-ERR wrong number of arguments for 'del' command\r\n"
        removed = 0
        with self._lock:
            for a in args:
                k = a.decode() if isinstance(a, bytes) else a
                if k in self._data:
                    del self._data[k]
                    removed += 1
        return b":" + str(removed).encode() + b"\r\n"

    def cmd_exists(self, args) -> bytes:
        if not args:
            return b":0\r\n"
        found = 0
        with self._lock:
            for a in args:
                k = a.decode() if isinstance(a, bytes) else a
                if not self._gc_if_expired(k) and k in self._data:
                    found += 1
        return b":" + str(found).encode() + b"\r\n"

    def cmd_command(self, _args) -> bytes:
        # redis-py 启动时会发 COMMAND，这里返回空数组就好
        return b"*0\r\n"

    def cmd_quit(self, _args) -> bytes:
        return b"+OK\r\n"

    # ------------------------------------------------------------
    # 命令分派
    # ------------------------------------------------------------
    DISPATCH = {
        b"PING": cmd_ping,
        b"SET": cmd_set,
        b"GET": cmd_get,
        b"INCR": cmd_incr,
        b"INCRBY": cmd_incrby,
        b"DECR": cmd_decr,
        b"DECRBY": cmd_decrby,
        b"EXPIRE": cmd_expire,
        b"KEYS": cmd_keys,
        b"DEL": cmd_del,
        b"DELETE": cmd_del,
        b"EXISTS": cmd_exists,
        b"TTL": cmd_ttl,
        b"TYPE": cmd_type,
        b"SELECT": cmd_select,
        b"FLUSHDB": cmd_flushdb,
        b"FLUSHALL": cmd_flushall,
        b"INFO": cmd_info,
        b"DBSIZE": cmd_dbsize,
        b"COMMAND": cmd_command,
        b"QUIT": cmd_quit,
    }

    def execute(self, parts: list) -> bytes:
        if not parts:
            return b"-ERR empty command\r\n"
        cmd = parts[0]
        if isinstance(cmd, str):
            cmd = cmd.encode()
        cmd_upper = cmd.upper()
        fn = self.DISPATCH.get(cmd_upper)
        if fn is None:
            return b"-ERR unknown command '" + cmd_upper + b"'\r\n"
        try:
            return fn(self, parts[1:])
        except Exception as exc:
            return b"-ERR " + str(exc).encode() + b"\r\n"


# ============================================================
# RESP 协议解析
# ============================================================
class RespReader:
    def __init__(self, sock: socket.socket) -> None:
        self._sock = sock
        self._buf = b""

    def _recv_more(self) -> bool:
        try:
            chunk = self._sock.recv(4096)
        except Exception:
            return False
        if not chunk:
            return False
        self._buf += chunk
        return True

    def _read_line(self) -> bytes:
        while b"\r\n" not in self._buf:
            if not self._recv_more():
                raise ConnectionError("peer closed")
        line, self._buf = self._buf.split(b"\r\n", 1)
        return line

    def _read_n(self, n: int) -> bytes:
        while len(self._buf) < n + 2:
            if not self._recv_more():
                raise ConnectionError("peer closed")
        data = self._buf[:n]
        self._buf = self._buf[n + 2:]
        return data

    def read_command(self) -> list:
        line = self._read_line()
        if not line.startswith(b"*"):
            # Inline command (non-RESP)
            return line.split()
        count = int(line[1:])
        parts = []
        for _ in range(count):
            header = self._read_line()
            if not header.startswith(b"$"):
                raise ValueError("bad bulk string")
            length = int(header[1:])
            if length == -1:
                parts.append(b"")
            else:
                parts.append(self._read_n(length))
        return parts


# ============================================================
# 客户端处理
# ============================================================
def handle_client(conn: socket.socket, addr, store: TinyRedis) -> None:
    reader = RespReader(conn)
    try:
        while True:
            try:
                parts = reader.read_command()
            except Exception:
                break
            resp = store.execute(parts)
            try:
                conn.sendall(resp)
            except Exception:
                break
    finally:
        try:
            conn.close()
        except Exception:
            pass


# ============================================================
# 服务器主循环
# ============================================================
def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=6379)
    args = parser.parse_args()

    store = TinyRedis()
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    try:
        sock.bind((args.host, args.port))
    except OSError as exc:
        print(f"[ERR] 绑定 {args.host}:{args.port} 失败: {exc}")
        print("       端口可能已被占用，请先关闭占用该端口的进程。")
        return 1
    sock.listen(32)
    print(f"[OK]  本地 Redis 服务器已启动 -> {args.host}:{args.port}")
    print(f"      (微型 RESP 实现，仅用于开发/集成测试)")
    print(f"      按 Ctrl+C 停止")

    try:
        while True:
            conn, addr = sock.accept()
            t = threading.Thread(target=handle_client, args=(conn, addr, store), daemon=True)
            t.start()
    except KeyboardInterrupt:
        print("\n[INFO] 收到 Ctrl+C，退出")
    finally:
        try:
            sock.close()
        except Exception:
            pass
    return 0


if __name__ == "__main__":
    sys.exit(main())
