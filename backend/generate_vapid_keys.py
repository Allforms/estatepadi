from base64 import urlsafe_b64encode
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import serialization

# Generate a new ECDSA private key (P-256 curve)
private_key = ec.generate_private_key(ec.SECP256R1())
public_key = private_key.public_key()

# Export private key
priv_bytes = private_key.private_numbers().private_value.to_bytes(32, "big")

# Export public key in uncompressed form: 0x04 + X + Y
pub_numbers = public_key.public_numbers()
x = pub_numbers.x.to_bytes(32, "big")
y = pub_numbers.y.to_bytes(32, "big")
pub_bytes = b"\x04" + x + y

# Convert to URL-safe Base64 (remove "=" padding)
vapid_private_key = urlsafe_b64encode(priv_bytes).decode("utf-8").rstrip("=")
vapid_public_key = urlsafe_b64encode(pub_bytes).decode("utf-8").rstrip("=")

print("VAPID_PUBLIC_KEY=", vapid_public_key)
print("VAPID_PRIVATE_KEY=", vapid_private_key)
