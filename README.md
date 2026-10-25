# 📧 ReachInbox — Full-stack Email Job Scheduler

> **ReachInbox Hiring Assignment** · Built by Outbox Labs  
> A production-grade email scheduling service with dashboard, BullMQ delayed jobs, Redis rate limiting, MySQL persistence, and Elasticsearch full-text search.

---

## 📐 Architecture

```
┌────────────────┐    REST API     ┌─────────────────────────────────┐
│  Next.js 14    │◄───────────────►│  Express + TypeScript Backend   │
│  (Port 3000)   │   credentials   │  (Port 4000)                    │
└────────────────┘                 └───────┬───────────────┬─────────┘
                                           │               │
                           ┌───────────────┘               │
                           ▼                               ▼
                    ┌─────────────┐              ┌──────────────────┐
                    │   MySQL 8   │              │   Redis 7        │
                    │  TypeORM    │              │  BullMQ Queue    │
                    │  (Port 3306)│              │  Session Store   │
                    └─────────────┘              │  Rate Limiter    │
                                                 └──────────────────┘
                                                          │
                                                 ┌────────▼─────────┐
                                                 │ Elasticsearch 8  │
                                                 │  Full-text Search│
                                                 │  (Port 9200)     │
                                                 └──────────────────┘
```

### Key Design Decisions

| Concern | Solution |
|---|---|
| **Scheduling** | BullMQ `delay` option — jobs stored in Redis sorted set, no cron polling |
| **Persistence** | Startup reconciliation re-queues any `pending`/`rate_limited` DB jobs after restart |
| **Idempotency** | BullMQ `jobId` = DB UUID — duplicate `add()` calls are no-ops |
| **Rate Limiting** | Redis atomic `INCR` + `EXPIRE` per sender per hour window |
| **Rate Limit Recovery** | Jobs exceeding limit are rescheduled to next hour window (not dropped) |
| **Concurrency** | Worker concurrency configurable via `WORKER_CONCURRENCY` env var |
| **Min Delay** | BullMQ queue-level `limiter` enforces minimum inter-email delay |
| **Search** | Elasticsearch fuzzy full-text search across subject/body/recipient |
| **Auth** | Passport.js Google OAuth 2.0 + Redis-backed session store |
| **Dev Login** | `/api/auth/dev-login` — bypass Google OAuth for local dev |

---

## 🚀 Quick Start

### Prerequisites

- **Docker Desktop** (running)
- **Node.js ≥ 20**
- **npm ≥ 10**

### 1. Start Infrastructure (MySQL + Redis + Elasticsearch)

```bash
docker-compose up -d
```

Wait ~15 seconds for MySQL to initialize on first run.

### 2. Set Up Backend

```bash
cd backend
cp .env.example .env   # Already pre-filled for Docker setup
npm install
npm run dev
```

Backend starts at **http://localhost:4000**

### 3. Set Up Frontend

```bash
cd frontend
# .env.local already pre-filled (NEXT_PUBLIC_API_URL=http://localhost:4000)
npm install
npm run dev
```

Frontend starts at **http://localhost:3000**

---

## 🔑 Environment Variables

### Backend (`backend/.env`)

| Variable | Default | Description |
|---|---|---|
| `PORT` | `4000` | Backend HTTP port |
| `DB_HOST` | `localhost` | MySQL host |
| `DB_PORT` | `3306` | MySQL port |
| `DB_USERNAME` | `reachinbox` | MySQL user |
| `DB_PASSWORD` | `reachinboxpass` | MySQL password |
| `DB_DATABASE` | `reachinbox` | MySQL database name |
| `REDIS_HOST` | `localhost` | Redis host |
| `REDIS_PORT` | `6379` | Redis port |
| `ELASTICSEARCH_URL` | `http://localhost:9200` | Elasticsearch URL |
| `SESSION_SECRET` | _(set this!)_ | Express session secret |
| `GOOGLE_CLIENT_ID` | — | Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | — | Google OAuth Client Secret |
| `GOOGLE_CALLBACK_URL` | `http://localhost:4000/api/auth/google/callback` | OAuth redirect |
| `FRONTEND_URL` | `http://localhost:3000` | For CORS + redirect |
| `SLACK_CLIENT_ID` | — | Slack App Client ID |
| `SLACK_CLIENT_SECRET` | — | Slack App Client Secret |
| `SLACK_REDIRECT_URI` | `http://localhost:4000/api/slack/callback` | Slack OAuth redirect |
| `WORKER_CONCURRENCY` | `5` | BullMQ worker concurrency |
| `MIN_DELAY_BETWEEN_EMAILS_MS` | `2000` | Minimum delay between email sends |
| `MAX_EMAILS_PER_HOUR_PER_SENDER` | `200` | Hourly rate limit per sender |

### Frontend (`frontend/.env.local`)

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000` | Backend API base URL |

---

## 🌐 API Reference

### Auth

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/auth/google` | Initiate Google OAuth flow |
| `GET` | `/api/auth/google/callback` | Google OAuth callback |
| `GET` | `/api/auth/dev-login` | Dev bypass (creates test user) |
| `GET` | `/api/auth/me` | Get current user |
| `POST` | `/api/auth/logout` | Logout |

### Email

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/email/schedule` | Schedule emails (multipart form) |
| `GET` | `/api/email/scheduled` | List pending/scheduled emails |
| `GET` | `/api/email/sent` | List sent/failed emails |
| `GET` | `/api/email/stats` | Get email counts by status |
| `GET` | `/api/email/search?q=query` | Full-text search via Elasticsearch |

#### POST `/api/email/schedule` — Form Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `subject` | `string` | ✅ | Email subject |
| `body` | `string` | ✅ | Email body (HTML or plain text) |
| `startTime` | `ISO 8601` | ✅ | When to start sending |
| `recipients` | `file` (CSV) or `JSON array` | ✅ | Recipient email addresses |
| `delayBetweenEmailsMs` | `number` | — | Stagger delay per recipient (default: 2000) |
| `hourlyLimit` | `number` | — | Per-sender hourly cap (default: 200) |
| `senderEmail` | `string` | — | Override sender address |
| `senderName` | `string` | — | Override sender name |

### Slack

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/slack/status` | Check if Slack is connected |
| `GET` | `/api/slack/connect` | Initiate Slack OAuth |
| `GET` | `/api/slack/callback` | Slack OAuth callback |
| `DELETE` | `/api/slack/disconnect` | Disconnect Slack |

---

## 📊 Dashboards

| URL | Description |
|---|---|
| `http://localhost:3000` | Frontend dashboard (login page) |
| `http://localhost:3000/dashboard` | Email management UI |
| `http://localhost:4000/api/queue` | **Bull Board** — live BullMQ queue inspector |
| `http://localhost:4000/api/health` | Health check endpoint |

---

## 🧪 Testing Email Delivery

This project uses **Ethereal Email** — a fake SMTP service. Emails are never actually delivered.

1. Schedule an email via the UI or API
2. Watch the backend console for a line like:
   ```
   [Worker] ✓ Sent abc123 → user@example.com | Preview: https://ethereal.email/message/xxx
   ```
3. Open the preview URL to see the rendered email

Ethereal accounts are created automatically on startup — no configuration needed.

---

## 🏗️ Project Structure

```
Assignment/
├── docker-compose.yml          # MySQL + Redis + Elasticsearch
├── backend/
│   ├── src/
│   │   ├── config/             # DB, Redis, Elasticsearch, env
│   │   ├── controllers/        # emailController, slackController
│   │   ├── middleware/         # Passport config, auth guard
│   │   ├── models/             # TypeORM: EmailJob, User
│   │   ├── routes/             # auth, email, slack routers
│   │   ├── services/
│   │   │   ├── emailService.ts       # Ethereal SMTP sender
│   │   │   ├── queueService.ts       # BullMQ producer + stats
│   │   │   ├── workerService.ts      # BullMQ consumer + rate limiting
│   │   │   ├── rateLimitService.ts   # Redis atomic rate limiter
│   │   │   ├── reconcileService.ts   # Startup persistence recovery
│   │   │   ├── elasticsearchService.ts # Index + search
│   │   │   └── slackService.ts       # Slack WebClient notifications
│   │   ├── types/index.ts      # Shared TypeScript interfaces
│   │   └── index.ts            # Express app + Bootstrap
│   ├── .env                    # Environment variables
│   ├── package.json
│   └── tsconfig.json
└── frontend/
    ├── app/
    │   ├── globals.css         # Custom animations + glass morphism
    │   ├── layout.tsx          # Root layout + SEO metadata
    │   ├── page.tsx            # Login landing page
    │   └── dashboard/
    │       └── page.tsx        # Main dashboard
    ├── components/
    │   ├── Header.tsx          # Sticky nav with search + user menu
    │   ├── StatCards.tsx       # Animated stat overview cards
    │   ├── EmailTable.tsx      # Paginated email table (scheduled/sent)
    │   ├── ComposeModal.tsx    # Schedule email modal with CSV upload
    │   ├── SlackConnect.tsx    # Slack OAuth connect/disconnect
    │   └── ui/                 # Badge, Button, Input, Modal, Toast
    ├── hooks/useEmails.ts      # Data fetching hooks with auto-polling
    ├── lib/api.ts              # Typed API client
    └── .env.local              # NEXT_PUBLIC_API_URL
```

---

## 🔒 Google OAuth Setup (Optional)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project → Enable **Google+ API** or **Google Identity**
3. Create OAuth 2.0 credentials (Web application)
4. Add authorized redirect URI: `http://localhost:4000/api/auth/google/callback`
5. Copy Client ID + Secret into `backend/.env`

> **Skip this for local dev** — use the "Dev Login" button on the login page instead.

---

## 🔔 Slack Integration Setup (Optional)

1. Go to [api.slack.com/apps](https://api.slack.com/apps)
2. Create a new app → OAuth & Permissions
3. Add scopes: `chat:write`, `channels:read`
4. Add redirect URL: `http://localhost:4000/api/slack/callback`
5. Copy Client ID + Secret into `backend/.env`

When rate limit is hit, the worker sends a Slack message to the connected workspace.

---

## ✅ Feature Checklist

- [x] REST API to accept email send requests
- [x] MySQL (TypeORM) storage for all email jobs
- [x] BullMQ delayed jobs — no cron, pure queue-based scheduling
- [x] Ethereal Email (fake SMTP) with preview URLs in console
- [x] Survives server restarts — reconcile service re-queues pending jobs
- [x] BullMQ idempotency — jobId = DB UUID, no duplicates on re-queue
- [x] Worker concurrency via `WORKER_CONCURRENCY` env var
- [x] Minimum delay between emails via BullMQ `limiter`
- [x] Hourly rate limit per sender (Redis atomic INCR)
- [x] Auto-reschedule rate-limited jobs to next hour window
- [x] Slack notification on rate limit hit
- [x] Elasticsearch full-text search across emails
- [x] Bull Board live queue inspector at `/api/queue`
- [x] Google OAuth 2.0 login via Passport.js
- [x] Dev login bypass for local development
- [x] Redis-backed session store
- [x] Frontend dashboard (Next.js 14 App Router + Tailwind)
- [x] Compose email modal with CSV recipient upload
- [x] Real-time stat cards with auto-polling
- [x] Paginated scheduled + sent email tables
- [x] Slack OAuth connect/disconnect from UI
- [x] Docker Compose for all infrastructure
