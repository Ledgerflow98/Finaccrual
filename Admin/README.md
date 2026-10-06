# FinAccrual — ERP Sync Admin Dashboard
A modern, high-performance React dashboard designed for accounting firms to manage clients, accrual schedules, journal entries, master data, and workflows.
---

## Features
- **Global Monolithic State**: The entire application runs on a centralized, highly-reactive state tree using React Context and Reducers, ensuring data is instantly synchronized across all views (e.g, adding a client instantly updates the Dashboard statistics).
- **Authentication Gateway**: Login screen with email validation and password rules that connects to the backend API, with graceful offline/demo fallback during development.
- **Dynamic Dashboard**: Real-time statistical tracking of Active Clients, Active Schedules, Journal Entries, and Data Uploads.
- **Entity Management**: Fully functional CRUD interfaces for Clients, Schedules, Accounts, and Journal Entries.
- **Advanced Filtering & Search**: Instant, client-side text filtering across all major data tables.
- **Premium UI/UX**: Built with modern CSS variables, soft shadows, micro-animations, and clean typography. Toast notifications provided by `sonner`.
---

## Tech Stack
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Routing**: React Router DOM v7
- **State Management**: Context API + `useReducer` (Monolithic Store Pattern)
- **HTTP Client**: Axios
- **Styling**: Vanilla CSS with Design Tokens (`src/styles/admin.css`)
- **Icons**: `lucide-react`
- **Notifications**: `sonner`
---
 
## Project Structure
```
src/
├── components/          # Reusable UI components
│   └── layout/          # Sidebar, Header, etc.
├── context/             # Global State Management
│   └── AppContext.tsx   # The Monolithic Store & Reducers
├── layouts/             # Page Layout wrappers
│   └── AdminLayout.tsx  # Main authenticated wrapper
├── modules/             # Feature-based architecture
│   ├── auth/            # Login screen
│   ├── dashboard/       # Main statistical dashboard
│   ├── clients/         # Client management
│   ├── schedules/       # Accrual schedules
│   ├── master-data/     # Chart of Accounts
│   ├── journal-entries/ # JE tracking and posting
│   ├── exports/         # Export management
│   ├── workpapers/      # Workpaper generation
│   └── bulk-upload/     # CSV/Excel upload simulation
├── routes/              # Application routing definitions
│   └── AppRoutes.tsx    # Auth guards and route mapping
└── styles/              # Global CSS and Design Tokens
```
---
 
## Installation
 
1. Install dependencies
 
```bash
npm install
```
 
2. Start the application
 
```bash
npm run dev
```
 
## Login
 
Use the configured login credentials to access the application.
 
## State Management
 
The application uses React Context API and useReducer for global state management.
 
## Notes
 
- This project follows a modular folder structure.
- Each module is maintained separately for better scalability and maintainability.  