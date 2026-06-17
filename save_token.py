#!/usr/bin/env python3
"""Save access_token to /tmp/token.txt"""
import json, sys
try:
    with open('/tmp/login.json') as f:
        d = json.load(f)
    t = d.get('access_token', '')
    print('TOKEN_LEN:', len(t))
    with open('/tmp/token.txt', 'w') as f:
        f.write(t)
except Exception as e:
    print('ERR:', e)
    sys.exit(1)