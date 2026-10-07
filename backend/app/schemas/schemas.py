from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field, field_validator
import ipaddress, re

class LoginIn(BaseModel):
    email: str
    password: str

class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    email: str
    name: str

class ZoneIn(BaseModel):
    name: str
    comment: str = ""
    private_zone: bool = False

    @field_validator("name")
    @classmethod
    def valid_name(cls, v):
        v = v.strip().lower().rstrip(".") + "."
        if len(v) > 253 or not re.fullmatch(r"(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+", v):
            raise ValueError("Enter a valid DNS name, for example northstar.dev")
        return v

class ZoneOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int; name: str; zone_type: str; comment: str; private_zone: bool
    record_count: int = 0
    created_at: datetime; updated_at: datetime

class RecordIn(BaseModel):
    name: str
    type: str
    ttl: int = Field(default=300, ge=1, le=172800)
    value: str
    priority: int | None = Field(default=None, ge=0, le=65535)
    weight: int | None = Field(default=None, ge=0, le=65535)
    port: int | None = Field(default=None, ge=0, le=65535)

    @field_validator("type")
    @classmethod
    def valid_type(cls, v):
        allowed = {"A","AAAA","CNAME","TXT","MX","NS","PTR","SRV","CAA","SOA"}
        v = v.upper()
        if v not in allowed: raise ValueError("Unsupported record type")
        return v

class RecordOut(RecordIn):
    model_config = ConfigDict(from_attributes=True)
    id: int; zone_id: int; created_at: datetime; updated_at: datetime

class ActivityOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int; zone_id: int | None; action: str; resource_type: str; resource_name: str; details: str; created_at: datetime
