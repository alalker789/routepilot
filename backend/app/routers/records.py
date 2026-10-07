import ipaddress, re
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import HostedZone, DNSRecord, ActivityLog
from ..schemas.schemas import RecordIn, RecordOut
from ..auth import current_user

router=APIRouter(prefix="/api/zones/{zone_id}/records",tags=["records"])

def zone_or_404(db,zone_id,user):
    z=db.query(HostedZone).filter(HostedZone.id==zone_id,HostedZone.owner_id==user.id).first()
    if not z: raise HTTPException(404,"Hosted zone not found")
    return z

def validate(r):
    v=r.value.strip()
    try:
        if r.type=="A": ipaddress.IPv4Address(v)
        elif r.type=="AAAA": ipaddress.IPv6Address(v)
        elif r.type in {"CNAME","NS","PTR"}: 
            if not re.fullmatch(r"[A-Za-z0-9._-]+\.?",v): raise ValueError()
        elif r.type=="MX" and r.priority is None: raise ValueError()
        elif r.type=="SRV" and None in (r.priority,r.weight,r.port): raise ValueError()
        elif r.type=="CAA" and r.priority is None: raise ValueError()
    except Exception: raise HTTPException(422,f"Invalid {r.type} record value")

def log(db,user,z,action,rec):
    db.add(ActivityLog(user_id=user.id,zone_id=z.id,action=action,resource_type="dns_record",resource_name=rec.name,details=f"{action.title()} {rec.type} record"))

@router.get("",response_model=list[RecordOut])
def list_records(
    zone_id: int,
    search: str = "",
    type: str = "",
    page: int = 1,
    limit: int = 10,
    user=Depends(current_user),
    db: Session = Depends(get_db),
):
    zone_or_404(db, zone_id, user)

    q = db.query(DNSRecord).filter(DNSRecord.zone_id == zone_id)

    if search:
        q = q.filter(DNSRecord.name.contains(search.lower()))

    if type:
        q = q.filter(DNSRecord.type == type.upper())

    return (
        q.order_by(DNSRecord.name, DNSRecord.type)
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )

@router.post("",response_model=RecordOut)
def create_record(zone_id:int,body:RecordIn,user=Depends(current_user),db:Session=Depends(get_db)):
    z=zone_or_404(db,zone_id,user); validate(body)
    if db.query(DNSRecord).filter(DNSRecord.zone_id==zone_id,DNSRecord.name==body.name,DNSRecord.type==body.type).first(): raise HTTPException(409,"A record with the same name and type already exists")
    r=DNSRecord(zone_id=zone_id,**body.model_dump()); db.add(r); db.flush(); log(db,user,z,"CREATE",r); db.commit(); db.refresh(r); return r

@router.patch("/record/{record_id}",response_model=RecordOut)
def edit_record(record_id:int,body:RecordIn,user=Depends(current_user),db:Session=Depends(get_db)):
    r=db.query(DNSRecord).join(HostedZone).filter(DNSRecord.id==record_id,HostedZone.owner_id==user.id).first()
    if not r: raise HTTPException(404,"Record not found")
    validate(body)
    for k,v in body.model_dump().items(): setattr(r,k,v)
    log(db,user,r.zone,"UPDATE",r); db.commit(); db.refresh(r); return r

@router.delete("/record/{record_id}")
def delete_record(record_id:int,user=Depends(current_user),db:Session=Depends(get_db)):
    r=db.query(DNSRecord).join(HostedZone).filter(DNSRecord.id==record_id,HostedZone.owner_id==user.id).first()
    if not r: raise HTTPException(404,"Record not found")
    z=r.zone; name=r.name; db.delete(r); db.flush(); db.add(ActivityLog(user_id=user.id,zone_id=z.id,action="DELETE",resource_type="dns_record",resource_name=name,details="DNS record deleted")); db.commit(); return {"ok":True}
