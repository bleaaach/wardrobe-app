import paramiko
import sys
import time
import re

host = "8.162.26.192"
port = 22
username = "root"
password = "lorraine200124Lsl"

COMMANDS = [
    "echo '=== SYSTEM INFO ===' && uname -a",
    "echo '=== MEMORY ===' && free -h",
    "echo '=== DISK ===' && df -h",
    "echo '=== CPU ===' && top -bn1 | head -5",
    "echo '=== NETWORK ===' && ip addr show | grep 'inet '",
    "echo '=== RUNNING SERVICES ===' && systemctl list-units --type=service --state=running | head -20",
    "echo '=== PORTS ===' && ss -tlnp",
    "echo '=== DOCKER ===' && docker ps -a 2>/dev/null || echo 'docker not installed or not running'",
    "echo '=== NGINX ===' && systemctl status nginx 2>/dev/null | head -5 || echo 'nginx not installed'",
    "echo '=== NODE ===' && node --version 2>/dev/null || echo 'node not installed'",
    "echo '=== PM2 ===' && pm2 list 2>/dev/null || echo 'pm2 not installed'",
]

try:
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(host, port=port, username=username, password=password, timeout=10)
    print("=" * 60)
    print(f"Connected to {host} as {username}")
    print("=" * 60)

    for cmd in COMMANDS:
        print(f"\n$ {cmd.split('&&')[-1].strip() if '&&' in cmd else cmd}")
        print("-" * 40)
        stdin, stdout, stderr = client.exec_command(cmd, timeout=30)
        out = stdout.read().decode(errors="replace")
        err = stderr.read().decode(errors="replace")
        if out:
            print(out.rstrip())
        if err:
            print("STDERR:", err.rstrip())

    client.close()
    print("\n" + "=" * 60)
    print("Disconnected.")
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
