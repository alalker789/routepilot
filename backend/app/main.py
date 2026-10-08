import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine, SessionLocal
from .models import User, HostedZone, DNSRecord
from .routers import auth, zones, records, activity
from .auth import pwd


app = FastAPI(
    title="RoutePilot API",
    version="1.0.0",
)


# ---------------------------------------------------------
# CORS
# ---------------------------------------------------------
# Local development:
#   FRONTEND_URL is not set
#   → defaults to http://localhost:3000
#
# Production:
#   Set FRONTEND_URL to your Vercel URL.
#   Example:
#   https://routepilot.vercel.app
# ---------------------------------------------------------

FRONTEND_URL = os.getenv(
    "FRONTEND_URL",
    "http://localhost:3000",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        FRONTEND_URL,
        "http://localhost:3000",
        "https://routepilot-omega.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------
# API Routers
# ---------------------------------------------------------

app.include_router(auth.router)
app.include_router(zones.router)
app.include_router(records.router)
app.include_router(activity.router)


# ---------------------------------------------------------
# Startup
# ---------------------------------------------------------

@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    try:
        # Create initial demo user only if database is empty
        if not db.query(User).first():

            user = User(
                email="admin@routepilot.local",
                name="Mansoor",
                password_hash=pwd.hash("routepilot"),
            )

            db.add(user)
            db.flush()

            zones_data = [
                (
                    "northstar.dev.",
                    "Primary public zone",
                ),
                (
                    "northstar.app.",
                    "Application zone",
                ),
                (
                    "northstar-labs.dev.",
                    "Sandbox environment",
                ),
            ]

            for zone_name, comment in zones_data:

                zone = HostedZone(
                    owner_id=user.id,
                    name=zone_name,
                    comment=comment,
                    private_zone=False,
                    zone_type="Public hosted zone",
                )

                db.add(zone)
                db.flush()

                initial_records = [
                    (
                        zone_name,
                        "NS",
                        172800,
                        "ns-101.awsdns-12.com.",
                        None,
                    ),
                    (
                        zone_name,
                        "SOA",
                        900,
                        (
                            "ns-101.awsdns-12.com. "
                            "hostmaster.routepilot.local. "
                            "1 7200 900 1209600 86400"
                        ),
                        None,
                    ),
                    (
                        f"api.{zone_name}",
                        "A",
                        300,
                        "203.0.113.42",
                        None,
                    ),
                    (
                        f"www.{zone_name}",
                        "CNAME",
                        300,
                        f"cdn.{zone_name}",
                        None,
                    ),
                    (
                        f"mail.{zone_name}",
                        "MX",
                        300,
                        f"mail.{zone_name}",
                        10,
                    ),
                ]

                for (
                    record_name,
                    record_type,
                    ttl,
                    value,
                    priority,
                ) in initial_records:

                    record = DNSRecord(
                        zone_id=zone.id,
                        name=record_name,
                        type=record_type,
                        ttl=ttl,
                        value=value,
                        priority=priority,
                    )

                    db.add(record)

            db.commit()

    finally:
        db.close()


# ---------------------------------------------------------
# Health Check
# ---------------------------------------------------------

@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "routepilot-api",
    }


# ---------------------------------------------------------
# Root
# ---------------------------------------------------------

@app.get("/")
def root():
    return {
        "name": "RoutePilot API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health",
    }