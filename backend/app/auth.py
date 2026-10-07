import secrets
from datetime import datetime, timedelta, timezone
from fastapi import Depends, Header, HTTPException
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from .database import get_db
from .models import User, Session as LoginSession

pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_session(db, user):
    token = secrets.token_urlsafe(32)
    db.add(LoginSession(token=token, user_id=user.id, expires_at=datetime.now(timezone.utc)+timedelta(days=7)))
    db.commit()
    return token

def current_user(authorization: str | None = Header(default=None), db: Session = Depends(get_db)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Authentication required")
    token = authorization[7:]
    session = db.query(LoginSession).filter(LoginSession.token == token).first()
    if not session or session.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise HTTPException(401, "Session expired")
    user = db.get(User, session.user_id)
    if not user: raise HTTPException(401, "User not found")
    return user
