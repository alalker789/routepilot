from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from ..database import get_db
from ..models import HostedZone, DNSRecord, ActivityLog, User
from ..schemas.schemas import ZoneIn, ZoneOut
from ..auth import current_user

router=APIRouter(prefix="/api/zones", tags=["zones"])

def log(db,user,zone,action,name,details):
    db.add(ActivityLog(user_id=user.id, zone_id=zone.id if zone else None, action=action, resource_type="hosted_zone", resource_name=name, details=details))

def out(z):
    d=ZoneOut.model_validate(z); d.record_count=len(z.records); return d

@router.get("", response_model=list[ZoneOut])
def list_zones(
    search: str = "",
    page: int = 1,
    limit: int = 10,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    q = db.query(HostedZone).filter(HostedZone.owner_id == user.id)

    if search:
        q = q.filter(HostedZone.name.contains(search.lower()))

    return [
        out(z)
        for z in q.order_by(HostedZone.name)
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    ]

@router.post("", response_model=ZoneOut)
def create_zone(body:ZoneIn,user=Depends(current_user),db:Session=Depends(get_db)):
    if db.query(HostedZone).filter(HostedZone.owner_id==user.id, HostedZone.name==body.name).first(): raise HTTPException(409,"A hosted zone with this name already exists")
    z=HostedZone(owner_id=user.id,name=body.name,comment=body.comment,private_zone=body.private_zone,zone_type="Private hosted zone" if body.private_zone else "Public hosted zone")
    db.add(z); db.flush()
    log(db,user,z,"CREATE",z.name,"Hosted zone created")
    db.commit(); db.refresh(z); return out(z)

@router.get("/{zone_id}",response_model=ZoneOut)
def get_zone(zone_id:int,user=Depends(current_user),db:Session=Depends(get_db)):
    z=db.query(HostedZone).filter(HostedZone.id==zone_id,HostedZone.owner_id==user.id).first()
    if not z: raise HTTPException(404,"Hosted zone not found")
    return out(z)

@router.patch("/{zone_id}",response_model=ZoneOut)
def edit_zone(zone_id:int,body:ZoneIn,user=Depends(current_user),db:Session=Depends(get_db)):
    z=db.query(HostedZone).filter(HostedZone.id==zone_id,HostedZone.owner_id==user.id).first()
    if not z: raise HTTPException(404,"Hosted zone not found")
    z.name=body.name; z.comment=body.comment; z.private_zone=body.private_zone; z.zone_type="Private hosted zone" if body.private_zone else "Public hosted zone"
    log(db,user,z,"UPDATE",z.name,"Hosted zone settings updated"); db.commit(); db.refresh(z); return out(z)

@router.delete("/{zone_id}")
def delete_zone(zone_id:int,user=Depends(current_user),db:Session=Depends(get_db)):
    z=db.query(HostedZone).filter(HostedZone.id==zone_id,HostedZone.owner_id==user.id).first()
    if not z: raise HTTPException(404,"Hosted zone not found")
    name=z.name; db.delete(z); db.flush(); log(db,user,None,"DELETE",name,"Hosted zone deleted"); db.commit(); return {"ok":True}
