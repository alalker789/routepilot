# RoutePilot

A Route 53-inspired DNS management console built for the AWS Route53 clone assignment.

RoutePilot intentionally does not implement real DNS resolution or AWS integration. It focuses on the management experience: persistent hosted zones, DNS records, validation, search, filters, pagination, change previews, notifications, dark mode, and activity history.

## Stack

- Next.js 16 + TypeScript
- React 19
- FastAPI
- SQLAlchemy
- SQLite
- Vercel
- PythonAnywhere

## Architecture

```text
Browser
   |
   v
Next.js Frontend
   |
   | REST API
   v
FastAPI Backend
   |
   v
SQLAlchemy
   |
   v
SQLite
```

The frontend owns the console experience and communicates with the FastAPI REST API.

The backend handles authentication, validation, CRUD operations, activity logging, and persistence.

SQLite keeps the application self-contained and portable.

## Features

- Mock login and session persistence
- Logout
- Hosted zone CRUD
- DNS record CRUD
- A, AAAA, CNAME, TXT, MX, NS, PTR, SRV and CAA records
- Type-aware DNS record validation
- Hosted zone search
- DNS record search
- Record-type filtering
- Pagination
- Change preview inside the record editor
- Hosted zone editing
- Activity logging for mutations
- Toast notifications
- Create/edit modals
- AWS/Route53-inspired navigation and tables
- Dashboard with dynamic statistics
- Hosted zone details
- Activity history
- Responsive layout
- Dark mode
- Ctrl/Cmd + K keyboard shortcut
- Custom RoutePilot favicon
- Placeholder workspaces for Traffic Policies, Health Checks, Resolver and Profiles

## Demo Account

Email:

`admin@routepilot.local`

Password:

`routepilot`

## Local Setup

### Backend

```bash
cd backend
python -m venv .venv
```

Windows:

```powershell
.venv\Scripts\activate
```

macOS/Linux:

```bash
source .venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Start the API:

```bash
uvicorn app.main:app --reload --port 8000
```

Backend:

`http://localhost:8000`

FastAPI documentation:

`http://localhost:8000/docs`

### Frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Open:

`http://localhost:3000`

The frontend expects the following environment variable:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

For local development, create:

`frontend/.env.local`

and add the variable above.

## Production Build

```bash
cd frontend
npm run build
```

Run the production frontend:

```bash
npm start
```

## Docker

From the project root:

```bash
docker compose up --build
```

## API Overview

| Method | Endpoint                                          | Purpose                    |
| ------ | ------------------------------------------------- | -------------------------- |
| POST   | `/api/auth/login`                                 | Create mock session        |
| POST   | `/api/auth/logout`                                | End session                |
| GET    | `/api/auth/me`                                    | Current authenticated user |
| GET    | `/api/zones`                                      | List/search zones          |
| POST   | `/api/zones`                                      | Create zone                |
| GET    | `/api/zones/{zone_id}`                            | Read zone                  |
| PATCH  | `/api/zones/{zone_id}`                            | Edit zone                  |
| DELETE | `/api/zones/{zone_id}`                            | Delete zone                |
| GET    | `/api/zones/{zone_id}/records`                    | List/filter records        |
| POST   | `/api/zones/{zone_id}/records`                    | Create record              |
| PATCH  | `/api/zones/{zone_id}/records/record/{record_id}` | Edit record                |
| DELETE | `/api/zones/{zone_id}/records/record/{record_id}` | Delete record              |
| GET    | `/api/activity`                                   | Recent activity            |
| GET    | `/health`                                         | Backend health check       |

### Query Parameters

Hosted zones support:

```text
search
page
limit
```

DNS records support:

```text
search
type
page
limit
```

Example:

```text
GET /api/zones?search=example&page=1&limit=10
```

```text
GET /api/zones/1/records?search=www&type=A&page=1&limit=10
```

## Database Schema

### users

Stores authenticated users.

| Column        | Description           |
| ------------- | --------------------- |
| id            | Primary key           |
| email         | User email            |
| name          | Display name          |
| password_hash | Hashed password       |
| created_at    | Account creation time |

### hosted_zones

Stores hosted zones belonging to users.

| Column       | Description            |
| ------------ | ---------------------- |
| id           | Primary key            |
| owner_id     | Zone owner             |
| name         | Zone/domain name       |
| comment      | Zone description       |
| private_zone | Public/private flag    |
| zone_type    | Hosted zone type       |
| created_at   | Creation time          |
| updated_at   | Last modification time |

### dns_records

Stores DNS records inside hosted zones.

| Column     | Description                          |
| ---------- | ------------------------------------ |
| id         | Primary key                          |
| zone_id    | Parent hosted zone                   |
| name       | Record name                          |
| type       | DNS record type                      |
| ttl        | Time to live                         |
| value      | Record value                         |
| priority   | Priority for applicable record types |
| weight     | Weight for SRV records               |
| port       | Port for SRV records                 |
| created_at | Creation time                        |
| updated_at | Last modification time               |

The `records` table keeps common structured fields such as `priority`, `weight`, and `port` alongside the record value so MX, SRV, and CAA workflows can be represented without hiding everything inside a JSON blob.

### activity_logs

Stores important user actions.

| Column        | Description                       |
| ------------- | --------------------------------- |
| id            | Primary key                       |
| user_id       | User performing the action        |
| zone_id       | Related hosted zone               |
| action        | CREATE, UPDATE or DELETE          |
| resource_type | Resource category                 |
| resource_name | Resource name                     |
| details       | Human-readable action description |
| created_at    | Action timestamp                  |

## Route53-style Experience

The interface is designed around the AWS Route53 workflow rather than a generic CRUD application.

The application includes:

- AWS-style dark navigation
- Hosted zone tables
- DNS record tables
- Search
- Filters
- Pagination
- Create/edit modals
- Toast notifications
- Zone details
- Activity history
- Dashboard statistics
- Responsive layout
- Dark mode

## Design Decisions

The project treats Route 53 as a management interface rather than a DNS server.

This keeps the scope focused on the assignment while still making the workflow feel operational.

The record editor provides a change preview before persistence, and mutations are recorded in the activity log for traceability.

The application does not connect to AWS or modify real DNS records.

## Mocked Sections

The following sections are included as placeholders:

- Traffic Policies
- Health Checks
- Resolver
- Profiles

These sections display a simple "Coming soon" state because they are outside the core assignment workflow.

## Keyboard Shortcut

Press:

```text
Ctrl + K
```

or on macOS:

```text
Cmd + K
```

to focus the global resource search field.

## Dark Mode

RoutePilot includes dark mode as an optional bonus feature.

The selected theme is persisted locally so it remains active after refreshing the page.

## Project Structure

```text
routepilot/
│
├── frontend/
│   ├── app/
│   │   ├── zones/
│   │   │   └── [zoneId]/
│   │   ├── health-checks/
│   │   ├── profiles/
│   │   ├── resolver/
│   │   ├── traffic-policies/
│   │   ├── icon.svg
│   │   ├── globals.css
│   │   └── page.tsx
│   │
│   ├── components/
│   │   └── Shell.tsx
│   │
│   └── lib/
│       └── api.ts
│
├── backend/
│   ├── app/
│   │   ├── routers/
│   │   │   ├── auth.py
│   │   │   ├── zones.py
│   │   │   ├── records.py
│   │   │   └── activity.py
│   │   ├── schemas/
│   │   ├── auth.py
│   │   ├── database.py
│   │   ├── models.py
│   │   └── main.py
│   │
│   └── requirements.txt
│
├── docker-compose.yml
├── README.md
└── .gitignore
```

## Deployment

### Frontend

Vercel:

https://routepilot-omega.vercel.app

### Backend

PythonAnywhere:

https://alalker789.pythonanywhere.com

### API Documentation

https://alalker789.pythonanywhere.com/docs

The production frontend communicates with the hosted FastAPI backend.

SQLite is used as required by the assignment.

## Assignment Coverage

| Requirement              | Status   |
| ------------------------ | -------- |
| Next.js + TypeScript     | Complete |
| FastAPI                  | Complete |
| SQLite                   | Complete |
| Login                    | Complete |
| Logout                   | Complete |
| Session Persistence      | Complete |
| Hosted Zone CRUD         | Complete |
| DNS Record CRUD          | Complete |
| A Records                | Complete |
| AAAA Records             | Complete |
| CNAME Records            | Complete |
| TXT Records              | Complete |
| MX Records               | Complete |
| NS Records               | Complete |
| PTR Records              | Complete |
| SRV Records              | Complete |
| CAA Records              | Complete |
| Search                   | Complete |
| Filters                  | Complete |
| Pagination               | Complete |
| Modals                   | Complete |
| Notifications            | Complete |
| Route53-style Navigation | Complete |
| Dashboard                | Complete |
| Mocked Sections          | Complete |
| Persistent Storage       | Complete |
| Hosted Demo              | Complete |
| Dark Mode                | Bonus    |
| Keyboard Shortcut        | Bonus    |

## Limitations

RoutePilot is a mock Route53 management console.

It does not:

- Connect to AWS
- Require AWS credentials
- Modify real DNS records
- Use the real Route53 API
- Implement AWS IAM
- Manage real AWS accounts
- Perform real DNS resolution

The project focuses on recreating the Route53 management experience and core CRUD workflows required by the assignment.

## License

This project was created as an educational assignment.
