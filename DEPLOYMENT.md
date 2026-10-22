# The Madras Christian College Chronicles (Est. 1837)
## Production Operations & Deployment Guide (Task 140 / 140)

> **Official Broadsheet Journal of Record for Madras Christian College**  
> *Autonomous Institution Affiliated with the University of Madras • Tambaram, Chennai - 600059*

---

### 1. System Architecture Overview

The MCC Chronicles platform is architected as a decoupled, high-availability digital publishing and archival system:

- **Frontend Broadsheet Client**: React 18, Vite 6, Tailwind CSS, Lucide Icons, and Vanilla CSS broadsheet design tokens (`mcc-maroon`, `mcc-navy`, `mcc-gold`, `mcc-paper`, `Playfair Display`, `Inter`).
- **Backend API Engine**: Node.js 20 LTS, Express, Connection-pooled MySQL (`mysql2/promise`), Server-Sent Events (SSE) dispatch stream.
- **Relational Database**: MySQL 8.4 LTS with relational foreign key cascading locks across 18 schema tables.
- **Reverse Proxy & Edge**: Nginx Alpine serving compressed static SPA assets with cache-control headers, proxying `/api/` and media `/uploads/`.
- **Process Orchestration**: Docker Compose and PM2 cluster process management with automatic failover recovery.

---

### 2. Environment Configuration

The application validates required environment keys on startup via `server/config/validateEnv.js`. Ensure `server/.env` contains:

```env
# Server Port & Environment
PORT=5000
NODE_ENV=production

# Database Credentials (MySQL 8.4)
DB_HOST=127.0.0.1
DB_PORT=3307
DB_USER=root
DB_PASSWORD=
DB_NAME=mcc_chronicles

# Security & Session Authentication
JWT_SECRET=mcc_chronicles_super_secret_jwt_key_2026

# Client CORS & Public Domain
CLIENT_URL=http://localhost
```

---

### 3. Containerized Deployment (Docker & Compose)

Deploy the full production stack (MySQL 8.4, Node.js API, and Nginx SPA) in three isolated containers:

```bash
# 1. Build and start all orchestrated containers in detached mode
docker compose up --build -d

# 2. Verify running services and health probes
docker compose ps

# 3. View unified runtime logs
docker compose logs -f backend
```

#### Exposed Ports
- `http://localhost:80` — Nginx Broadsheet Web Application
- `http://localhost:5000` — Express API Engine & SSE Stream
- `http://localhost:3307` — MySQL 8.4 Database Engine

---

### 4. Bare-Metal & PM2 Production Deployment

For bare-metal Linux/Windows production servers:

```bash
# 1. Install production dependencies
cd server
npm ci --only=production

cd ../client
npm ci
npm run build

# 2. Initialize or migrate database schema
node ../server/scripts/initDb.js

# 3. Start clustered backend with PM2
cd ..
pm2 start ecosystem.config.js --env production

# 4. Save PM2 startup process list
pm2 save
pm2 startup
```

---

### 5. Automated Backup & Disaster Recovery

Run automated timestamped backups of all 18 database tables with automatic 10-file retention pruning:

```bash
node server/scripts/automatedBackup.js
```

Backups are serialized to `server/backups/backup_mcc_chronicles_YYYY-MM-DD_HH-mm-ss.json` and audited in `activity_logs`.

---

### 6. Production Security & Compliance Checklist

- [x] **Role-Based Access Control (RBAC)**: 4-Tier security matrix (`guest`, `reporter`, `editor`, `super_admin`).
- [x] **Security Headers**: Enforced via Helmet and custom middleware (`X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`).
- [x] **Brute-Force Rate Limiting**: `express-rate-limit` throttles auth endpoints to 10 requests per 15 minutes.
- [x] **SQL Injection Defense**: 100% prepared parameterized queries across all database access layers.
- [x] **Cascading Integrity**: Foreign key `ON DELETE CASCADE` locks on junction tables (`article_tags`, `article_authors`, `article_revisions`, `poll_votes`).
- [x] **Offline Resilience**: Progressive Web App (PWA) manifest and Service Worker (`sw.js`) with offline broadsheet notice.
- [x] **Log Maintenance**: Background cron prunes activity logs older than 90 days.

---

### 7. Diagnostics & Health Monitoring

Query the live diagnostics probe at `GET /api/health`:

```bash
curl http://localhost:5000/api/health
```

Sample output:
```json
{
  "status": "ok",
  "service": "The MCC Chronicles API Engine",
  "version": "1.0.0",
  "timestamp": "2026-10-07T10:45:00.000Z",
  "uptimeSeconds": 1420,
  "environment": "production",
  "database": {
    "status": "connected",
    "latencyMs": 4
  },
  "memoryUsage": {
    "rss": "79.34 MB",
    "heapTotal": "15.93 MB",
    "heapUsed": "13.62 MB",
    "external": "2.12 MB"
  },
  "realtime": {
    "activeSseClients": 2
  }
}
```

---

### 8. Milestone 140/140 Sign-Off Certification

| Phase | Scope | Status |
|---|---|---|
| **Phase 1** | Brand Tokens, DB Schema & Authentication Engine (Tasks 1 - 24) | **Complete (100%)** |
| **Phase 2** | Broadsheet Layout, Grand Lead & Article Publishing Core (Tasks 25 - 48) | **Complete (100%)** |
| **Phase 3** | Reader Engagement, Lightbox Galleries & Administrative Consoles (Tasks 49 - 84) | **Complete (100%)** |
| **Phase 4** | Polls, Revisions, User Profiles, Kanban & Cloud Sync (Tasks 85 - 100) | **Complete (100%)** |
| **Phase 5** | SSE Real-Time Stream, Cartography, Audio & Liaison (Tasks 101 - 110) | **Complete (100%)** |
| **Phase 6** | Analytics Engine, PWA, Dockerization & Master E2E Suite (Tasks 111 - 140) | **Complete (100%)** |

**Total Completion: 140 of 140 Tasks Successfully Delivered and Certified.**
