#  FinAccrual ERP Platform

A full-stack ERP synchronization platform for accounting firms, integrating with **QuickBooks Online** and **Xero** to automate accrual schedules, master data streaming, journal entries, client management, and financial reporting directly inside Microsoft Excel.

---

##  Platform Architecture

```
fin-12.30/
├── Admin/          — React 18 + TypeScript Admin Dashboard (Vite, Monolithic Context Store)
├── Backend/        — Node.js / Express 5 API (SQLite, SSE Streaming, QuickBooks & Xero OAuth2)
└── Frontend-React/ — Microsoft Excel Add-in (React 19, Office JS, Webpack, Streamed Synchronization)
```

---

##  Key Platform Features

###  Excel Add-in (Frontend-React)
- **Streamed Master Data Synchronization**: Real-time Server-Sent Events (SSE) streaming (`/api/pull-master-data`) to populate Accounts, Classes, Locations, Customers, and Vendors directly into Excel.
- **Incremental Refresh Schedule**:
  - Requires **Setup Master & Input Sheets** AND **Pull Master Data** steps to be completed before allowing execution.
  - Performs multi-block ID deduplication across all 5 sheet tables (Company, Accounts, Classes, Locations, Entities).
  - Appends only new/updated records below existing rows without duplicating data.
  - Displays accurate notifications reporting exact updated record counts (e.g., `1 updated record added.` or `0 updated records added.`).
- **Free Trial Lifecycle & Navigation Protection**:
  - 2-minute free trial lifecycle with real-time expiration monitoring.
  - Clears sheet data on expiration and displays the Upgrade modal.
  - Back-arrow navigation guard on the Plans View (`#btnPlansBack`) that prevents returning to the Dashboard when trial is expired.
  - Data action guards blocking Setup, Pull, and Refresh when trial is expired.
- **Multi-Company Management**: Instant active company switching with automatic state cleanup, step resets, and cursor clearance.

###  Backend API (`/Backend`)
- **OAuth 2.0 Integration**: Decoupled QuickBooks Online and Xero authentication token management.
- **Automatic Token Rotation**: Transparent 15-minute JWT session expiration handling with automatic `/api/auth/refresh` retries.
- **SSE Streaming**: Live streaming endpoint for paginated and chunked master data responses.

###  Admin Dashboard (`/Admin`)
- **Firm Management**: CRUD interfaces for Clients, Schedules, Accounts, and Journal Entries.
- **Global Monolithic State**: Real-time statistical tracking across Active Clients, Schedules, and Data Uploads.

---

##  Sub-Projects Setup

### 1. Backend API (`/Backend`)
```bash
cd Backend/Backend
cp .env.example .env        # Configure QuickBooks and Xero API credentials
npm install
npm run dev                 # Starts API server on http://localhost:8000
```

### 2. Excel Taskpane Add-in (`/Frontend-React`)
```bash
cd Frontend-React
npm install
npm run dev-server          # Starts Webpack dev server on https://localhost:3001
npm run build               # Builds production bundle
npm start                   # Sideloads Add-in inside Desktop Excel
```

### 3. Admin Dashboard (`/Admin`)
```bash
cd Admin
npm install
npm run dev                 # Starts Vite dev server on http://localhost:5173
```

---

##  Prerequisites
- Node.js >= 18.x
- npm >= 9.x
- Microsoft Excel (Desktop or Excel Online)
- QuickBooks Online Developer Account ([developer.intuit.com](https://developer.intuit.com))
- Xero Developer Account ([developer.xero.com](https://developer.xero.com))

---

##  Security
- **Do NOT commit** `.env` files containing real Client Secrets or Session Secrets.
- Review `Backend/Backend/src/core/config/` for environment variable rules.

---

##  License
MIT © 2026 FinAccrual ERP Platform. See [LICENSE](./LICENSE) for details.
