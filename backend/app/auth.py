"""Password hashing for Student/Admin accounts.

PBKDF2-SHA256 via stdlib hashlib — no new dependency (bcrypt/passlib) for
what a POC's login needs. 390000 iterations matches OWASP's current
PBKDF2-SHA256 recommendation.
"""

import hashlib
import hmac
import secrets

_ITERATIONS = 390_000


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), bytes.fromhex(salt), _ITERATIONS).hex()
    return f"pbkdf2_sha256${_ITERATIONS}${salt}${digest}"


def verify_password(password: str, password_hash: str) -> bool:
    try:
        algo, iterations, salt, digest = password_hash.split("$")
        if algo != "pbkdf2_sha256":
            return False
    except ValueError:
        return False
    candidate = hashlib.pbkdf2_hmac("sha256", password.encode(), bytes.fromhex(salt), int(iterations)).hex()
    return hmac.compare_digest(candidate, digest)
