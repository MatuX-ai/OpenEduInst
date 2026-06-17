#!/usr/bin/env python3
"""Decode JWT payload to check expiration"""
import json, base64, sys

def decode_jwt(token):
    parts = token.split('.')
    if len(parts) != 3:
        return None
    payload = parts[1]
    # Add padding
    payload += '=' * ((4 - len(payload) % 4) % 4)
    try:
        return json.loads(base64.urlsafe_b64decode(payload))
    except Exception as e:
        print(f"Decode error: {e}", file=sys.stderr)
        return None

import os
if os.path.exists('/tmp/token.txt'):
    token = open('/tmp/token.txt').read().strip()
    print(f"TOKEN_LEN: {len(token)}")
    payload = decode_jwt(token)
    if payload:
        print(f"Payload: {json.dumps(payload, indent=2)}")
        import datetime
        exp = payload.get('exp')
        if exp:
            exp_dt = datetime.datetime.fromtimestamp(exp)
            now = datetime.datetime.now()
            diff = exp_dt - now
            print(f"Expires at: {exp_dt} (UTC)")
            print(f"Now: {now} (UTC)")
            print(f"Time until expiry: {diff}")
            if diff.total_seconds() < 0:
                print("!!! TOKEN EXPIRED !!!")
            else:
                print(f"Token valid for: {diff.total_seconds() / 60:.1f} minutes")
    else:
        print("Failed to decode token")
else:
    print("No token file")