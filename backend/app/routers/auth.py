from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User, Session as LoginSession
from ..schemas.schemas import LoginIn, UserOut
from ..auth import pwd, create_session, current_user

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/login")
def login(body: LoginIn, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email.lower()).first()
    if not user or not pwd.verify(body.password, user.password_hash): raise HTTPException(401, "Invalid email or password")
    return {"token": create_session(db, user), "user": UserOut.model_validate(user)}

@router.post("/logout")
def logout(authorization: str | None = Header(default=None), db: Session = Depends(get_db)):
    if authorization and authorization.startswith("Bearer "):
        db.query(LoginSession).filter(LoginSession.token == authorization[7:]).delete()
        db.commit()
    return {"ok": True}

@router.get("/session", response_model=UserOut)
def session(user=Depends(current_user)): return user
