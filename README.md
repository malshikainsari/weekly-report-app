# Weekly Report Generator & Team Dashboard

A full-stack web application for managing weekly team reports with role-based access control, review workflows, and AI-powered insights.

## Tech Stack

- **Frontend:** Next.js 14, Tailwind CSS, Recharts
- **Backend:** NestJS, Prisma ORM
- **Database:** PostgreSQL
- **AI:** Groq API (llama3)
- **Auth:** JWT

---

## Setup Instructions

### Prerequisites
- Node.js v20
- PostgreSQL
- Git

---

### 1. Installing Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

---

### 2. Running the Database

1. Create a PostgreSQL database named `weekly_report_db`

2. Inside the `backend` folder, create a file named `prisma7.config.ts` with the following content:

```ts
import { defineConfig } from 'prisma'

export default defineConfig({
  datasource: {
    url: 'postgresql://USER:PASSWORD@localhost:5432/weekly_report_db'
  }
})
```

> Replace `USER` and `PASSWORD` with the PostgreSQL credentials configured on the local machine.

3. Run migrations:

```bash
cd backend
npx prisma migrate deploy
```

4. Seed the database with sample data:

```bash
cd backend
npx prisma db seed
```

---

### 3. Running the Backend

```bash
cd backend
npm run start:dev
```

Backend runs on: `http://localhost:3001`

---

### 4. Running the Frontend

```bash
cd frontend
npm run dev
```

Frontend runs on: `http://localhost:3000`

---

## Running Tests

```bash
cd backend
npm run test
```

### Test Coverage
- Role-based access control (RBAC) logic
- Report service unit tests

---

## Seed Users

| Email | Password | Role |
|-------|----------|------|
| manager@company.com | password123 | Manager |
| alice@company.com | password123 | Team Member |
| bob@company.com | password123 | Team Member |
| carol@company.com | password123 | Team Member |

---

## Features

- **Authentication:** JWT-based login with role-based access control (Team Member / Manager)
- **Weekly Reports:** Create reports with tasks, blockers, achievements, hours breakdown, and optional notes/links
- **Review Workflow:** Draft → Submitted → Needs Correction → Approved
- **Version History:** Every correction cycle saves a new version; managers can view all past versions
- **Manager Dashboard:** Summary metrics, charts (status distribution, reports by member, time by task type, workload by project), submission compliance, and recent activity feed
- **Team Section View:** Side-by-side view of blockers, achievements, or next week tasks across all team members for a selected week
- **AI Chat Assistant:** Groq-powered assistant for managers to query team activity, blockers, and generate weekly summaries
- **Projects & Categories:** Full CRUD with team member assignment
- **User Management:** Invite users, view roles, access team member profiles