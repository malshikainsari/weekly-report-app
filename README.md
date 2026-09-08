# Weekly Report Generator & Team Dashboard

A full-stack web application for managing weekly team reports with role-based access control, review workflows, and AI-powered insights.

## Tech Stack

- **Frontend:** Next.js 14, Tailwind CSS, Recharts
- **Backend:** NestJS, Prisma ORM
- **Database:** PostgreSQL
- **AI:** Groq API (llama3)
- **Auth:** JWT

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
2. Create `backend/prisma7.config.ts` and add your database URL:

```ts
import { defineConfig } from 'prisma'

export default defineConfig({
  datasource: {
    url: 'postgresql://USER:PASSWORD@localhost:5432/weekly_report_db'
  }
})
```

3. Run migrations and seed:

```bash
cd backend
npx prisma migrate deploy
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

## Seed Users

| Email | Password | Role |
|-------|----------|------|
| manager@company.com | password123 | Manager |
| alice@company.com | password123 | Team Member |
| bob@company.com | password123 | Team Member |
| carol@company.com | password123 | Team Member |

---

## Features

- Role-based access (Team Member / Manager)
- Weekly report creation with tasks, blockers, achievements
- Report review workflow: Draft → Submitted → Needs Correction → Approved
- Version history per report
- Manager dashboard with charts (Recharts)
- AI chat assistant (Groq API)
- Team section view (side-by-side blockers/achievements)
- Projects & categories management
- User management