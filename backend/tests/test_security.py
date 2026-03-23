# tests/test_security.py
"""Unit tests for password hashing and JWT token flow."""
from __future__ import annotations

import pytest
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_access_token,
    decode_refresh_token,
    hash_password,
    verify_password,
    generate_invitation_token,
)
from fastapi import HTTPException


class TestPasswordHashing:
    def test_hash_and_verify(self):
        hashed = hash_password("MyP@ssw0rd!")
        assert hashed != "MyP@ssw0rd!"
        assert verify_password("MyP@ssw0rd!", hashed)

    def test_wrong_password(self):
        hashed = hash_password("Correct1!")
        assert not verify_password("Wrong1!", hashed)


class TestJWT:
    def test_access_token_roundtrip(self):
        token = create_access_token(user_id=42)
        user_id = decode_access_token(token)
        assert user_id == 42

    def test_refresh_token_roundtrip(self):
        token = create_refresh_token(user_id=7)
        user_id = decode_refresh_token(token)
        assert user_id == 7

    def test_invalid_access_token(self):
        with pytest.raises(HTTPException) as exc_info:
            decode_access_token("bad.token.here")
        assert exc_info.value.status_code == 401

    def test_invalid_refresh_token(self):
        with pytest.raises(HTTPException) as exc_info:
            decode_refresh_token("bad.token.here")
        assert exc_info.value.status_code == 401


class TestInvitationToken:
    def test_uniqueness(self):
        t1 = generate_invitation_token()
        t2 = generate_invitation_token()
        assert t1 != t2
        assert len(t1) > 20
