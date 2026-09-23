"""Password hashing + session tokens for Student/Admin accounts.

PBKDF2-SHA256 via stdlib hashlib — no new dependency (bcrypt/passlib) for
what a POC's login needs. 390000 iterations matches OWASP's current
PBKDF2-SHA256 recommendation.
"""

import base64
import hashlib
import hmac
import json
import secrets
import time

_ITERATIONS = 390_000

# 7 days — long enough that a student doesn't get logged out mid-week, short
# enough that a leaked token (these travel in query strings/logs — see
# deps.py for why) doesn't stay valid indefinitely.
TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60


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


class TokenError(Exception):
    """Raised for a malformed, forged, or expired session token."""


def _b64encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def _b64decode(data: str) -> bytes:
    return base64.urlsafe_b64decode(data + "=" * (-len(data) % 4))


def create_token(account_id: int, role: str, secret_key: str) -> str:
    """A stateless, HMAC-signed session token — no server-side session table
    needed for a POC's scale. Carries account id/role/expiry; sent back as
    ?token=... rather than an Authorization header (see deps.py) so it
    doesn't trigger the CORS preflight Catalyst AppSail's gateway drops."""
    payload = json.dumps(
        {"id": account_id, "role": role, "exp": int(time.time()) + TOKEN_TTL_SECONDS},
        separators=(",", ":"),
    ).encode()
    payload_b64 = _b64encode(payload)
    sig = hmac.new(secret_key.encode(), payload_b64.encode(), hashlib.sha256).digest()
    return f"{payload_b64}.{_b64encode(sig)}"


def decode_token(token: str, secret_key: str) -> dict:
    try:
        payload_b64, sig_b64 = token.split(".")
    except ValueError:
        raise TokenError("malformed token") from None
    expected_sig = _b64encode(hmac.new(secret_key.encode(), payload_b64.encode(), hashlib.sha256).digest())
    if not hmac.compare_digest(sig_b64, expected_sig):
        raise TokenError("bad signature")
    try:
        payload = json.loads(_b64decode(payload_b64))
    except (ValueError, json.JSONDecodeError):
        raise TokenError("malformed payload") from None
    if payload.get("exp", 0) < time.time():
        raise TokenError("expired")
    return payload
