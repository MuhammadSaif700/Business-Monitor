import os
import time
from typing import Optional

import jwt  # PyJWT
from fastapi import HTTPException, Header, status

JWT_SECRET = os.getenv("JWT_SECRET", "dev-insecure-secret-change-me")
JWT_ALG = os.getenv("JWT_ALG", "HS256")
JWT_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "30"))
BACKEND_USERNAME = os.getenv("BACKEND_USERNAME")
BACKEND_PASSWORD = os.getenv("BACKEND_PASSWORD")


def jwt_enabled() -> bool:
    """JWT auth is enabled if BACKEND_USERNAME is set."""
    return bool(BACKEND_USERNAME)


def create_access_token(sub: str) -> str:
    now = int(time.time())
    exp = now + JWT_EXPIRE_MINUTES * 60
    payload = {"sub": sub, "iat": now, "exp": exp}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")


def get_current_user(authorization: Optional[str] = Header(None)):
    if not jwt_enabled():
        return {"username": "anonymous"}
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")
    token = authorization.split(" ", 1)[1].strip()
    data = decode_token(token)
    return {"username": data.get("sub")}


def verify_login(username: str, password: str) -> bool:
    if not jwt_enabled():
        return False
    return username == BACKEND_USERNAME and password == BACKEND_PASSWORD
