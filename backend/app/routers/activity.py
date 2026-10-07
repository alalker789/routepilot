from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import ActivityLog
from ..schemas.schemas import ActivityOut
from ..auth import current_user
router=APIRouter(prefix="/api/activity",tags=["activity"])
@router.get("",response_model=list[ActivityOut])
def activity(user=Depends(current_user),db:Session=Depends(get_db)):
    return db.query(ActivityLog).filter(ActivityLog.user_id==user.id).order_by(ActivityLog.created_at.desc()).limit(50).all()
