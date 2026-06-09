import paramiko
from cryptography.hazmat.primitives.asymmetric import ed25519
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.backends import default_backend
import os

# Generate ED25519 key pair
private_key = ed25519.Ed25519PrivateKey.generate()
public_key = private_key.public_key()

# Serialize private key
private_pem = private_key.private_bytes(
    encoding=serialization.Encoding.PEM,
    format=serialization.PrivateFormat.OpenSSH,
    encryption_algorithm=serialization.NoEncryption()
)

# Serialize public key
public_ssh = public_key.public_bytes(
    encoding=serialization.Encoding.OpenSSH,
    format=serialization.PublicFormat.OpenSSH
)

key_path = os.path.join(os.path.expanduser("~"), ".ssh", "id_ed25519_wardrobe_aliyun")
pub_path = key_path + ".pub"

with open(key_path, "wb") as f:
    f.write(private_pem)
os.chmod(key_path, 0o600)

with open(pub_path, "wb") as f:
    f.write(public_ssh)

print(f"Private key: {key_path}")
print(f"Public key: {pub_path}")
print(f"\nPublic key content:\n{public_ssh.decode()}")

# Upload public key to server
host = "8.162.26.192"
port = 22
username = "root"
password = "lorraine200124Lsl"

try:
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(host, port=port, username=username, password=password, timeout=10)

    # Check if .ssh directory exists
    stdin, stdout, stderr = client.exec_command("ls -la ~/.ssh 2>/dev/null || echo 'NO_SSH_DIR'")
    out = stdout.read().decode()
    print(f"\n~/.ssh directory: {out}")

    # Create .ssh dir if needed, append public key to authorized_keys
    cmd = f"mkdir -p ~/.ssh && chmod 700 ~/.ssh && echo '{public_ssh.decode().strip()}' >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys && echo 'Key added successfully!'"
    stdin, stdout, stderr = client.exec_command(cmd)
    out = stdout.read().decode()
    err = stderr.read().decode()
    print(f"\nUpload result: {out}")
    if err:
        print(f"Errors: {err}")

    # Verify
    stdin, stdout, stderr = client.exec_command("cat ~/.ssh/authorized_keys")
    out = stdout.read().decode()
    print(f"\n~/.ssh/authorized_keys now contains:")
    print(out)

    client.close()
    print("\nDone! You can now SSH using:")
    print(f"  ssh -i \"{key_path}\" root@8.162.26.192")
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
