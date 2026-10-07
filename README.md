# RoutePilot

A Route 53-inspired DNS management console built for the AWS Route53 clone assignment.

RoutePilot intentionally does not implement real DNS resolution or AWS integration. It focuses on the management experience: persistent hosted zones, DNS records, validation, search, filters, change previews, and activity history.

## Stack

- Next.js 15 + TypeScript
- React 19
- FastAPI
- SQLAlchemy
- SQLite

## Architecture

Browser → Next.js → FastAPI → SQLite

The frontend owns the console experience and talks to a small REST API. The API owns validation and persistence. SQLite keeps the demo self-contained and portable.

## Features

- Mock login/session persistence
- Hosted zone CRUD
- DNS record CRUD
- A, AAAA, CNAME, TXT, MX, NS, PTR, SRV and CAA records
- Type-aware record validation
- Search and record-type filtering
- Change preview inside the record editor
- Activity logging for mutations
- AWS/Route53-inspired navigation and tables
- Placeholder workspaces for Traffic Policies, Health Checks, Resolver and Profiles

## Demo account

Email: `admin@routepilot.local`

Password: `routepilot`

## Local setup

### Backend

```bash
cd backend
python -m venv .venv
# Windows
.venv\\Scripts\\activate
# macOS/Linux
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`.

## Docker

From the project root:

```bash
docker compose up --build
```

## API overview

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/login` | Create mock session |
| POST | `/api/auth/logout` | End session |
| GET | `/api/auth/session` | Current user |
| GET | `/api/zones` | List/search zones |
| POST | `/api/zones` | Create zone |
| GET | `/api/zones/{id}` | Read zone |
| PATCH | `/api/zones/{id}` | Edit zone |
| DELETE | `/api/zones/{id}` | Delete zone |
| GET | `/api/zones/{id}/records` | List/filter records |
| POST | `/api/zones/{id}/records` | Create record |
| PATCH | `/api/zones/{id}/records/record/{record_id}` | Edit record |
| DELETE | `/api/zones/{id}/records/record/{record_id}` | Delete record |
| GET | `/api/activity` | Recent mutations |

## Database schema

`users` stores the demo identity. `sessions` stores persistent mock sessions. `hosted_zones` belongs to a user and owns `records`. `activity_logs` records changes for traceability.

The `records` table keeps common structured fields (`priority`, `weight`, `port`) alongside the record value so MX/SRV/CAA workflows can be represented without hiding everything in a JSON blob.

## Design decisions

The project treats Route 53 as a management interface rather than a DNS server. That keeps the scope focused on the assignment while still making the workflow feel operational.

The record editor shows a small change preview before persistence, and every mutation is logged. These two details are intentionally part of the product rather than generic CRUD boilerplate.
