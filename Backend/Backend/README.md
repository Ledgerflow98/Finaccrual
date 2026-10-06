#  Backend ERP Project

## 1. Project Title
**FinAccrual Node Backend (ERP System)**

## 2. Project Overview
This project serves as the robust backend for an Enterprise Resource Planning (ERP) system, specifically designed to handle financial data accruals and synchronize seamlessly with third-party accounting software such as QuickBooks and Xero. It provides a reliable API to manage master data, oauth token persistence, and financial synchronization. 

## 3. Key Features
- **Third-Party Integrations:** Seamless OAuth 2.0 integration with QuickBooks Online and Xero.
- **Master Data Management & Streaming:** Server-Sent Events (SSE) streaming endpoint `/api/pull-master-data` for live progress and paginated/streamed Master Data synchronization (Accounts, Classes, Locations, Customers, Vendors).
- **Authentication & Automatic Token Refresh:** 15-minute JWT access token lifecycle with transparent `/api/auth/refresh` token rotation.
- **Excel Export:** Automated generation of `.xlsx` files and Excel Add-in mapping formats for master data.
- **Company Ownership & Session Scoping:** Multi-tenant scoping per user and active company connection.
- **Modular Architecture:** Highly scalable and decoupled module-based structure.
- **Robust Error Handling:** Centralized error logging and exception management.

## 4. Technology Stack
- **Runtime:** Node.js
- **Framework:** Express.js (v5.x)
- **Database:** SQLite3
- **ORM:** Sequelize
- **Authentication/Sessions:** `express-session`
- **Data Export:** `exceljs`
- **HTTP Client:** `axios`
- **Environment Management:** `dotenv`
- **Cross-Origin Requests:** `cors`

## 5. Backend Architecture Overview
The backend follows a **Modular Monolith** architecture with a strong separation of concerns. The application is divided into a `core` directory (containing shared configurations, database connections, and middleware) and a `modules` directory (containing domain-specific logic). Each module enforces the Controller-Service-Repository pattern.

## 6. Folder Structure
```text
Backend/
├── src/
│   ├── core/
│   │   ├── config/       # Environment variables & app configuration
│   │   ├── constants/    # Application-wide constants & enums
│   │   ├── database/     # Sequelize instance and database setup
│   │   ├── helpers/      # Reusable utility functions (e.g., OAuth state generation)
│   │   ├── logger/       # Application logging configuration
│   │   └── middleware/   # Express middlewares (e.g., Auth, Error handlers)
│   ├── modules/
│   │   ├── quickbooks/   # QuickBooks Domain Module
│   │   │   ├── controllers/
│   │   │   ├── repositories/
│   │   │   ├── routes/
│   │   │   └── services/
│   │   └── xero/         # Xero Domain Module
│   │       ├── controllers/
│   │       ├── repositories/
│   │       ├── routes/
│   │       └── services/
│   ├── routes/           # Centralized API Route registration
│   ├── app.js            # Express app initialization
│   └── server.js         # HTTP Server entry point
├── package.json
└── README.md
```

## 7. Module Description
- **QuickBooks Module (`src/modules/quickbooks`):**
  Handles OAuth2 authentication with Intuit. Manages API interactions with QuickBooks Online to pull ledgers, customers, accounts, and vendor data. Provides routes to generate Excel spreadsheets of master data.
- **Xero Module (`src/modules/xero`):**
  Manages the Xero OAuth2 authorization flow. Retrieves Xero Contacts and Accounts data and maps it to the internal ERP models.

## 8. Request Flow
The application strictly adheres to the following data flow for every API request:
1. **Route (`routes/`):** Receives the HTTP request and delegates it to the appropriate Controller method.
2. **Controller (`controllers/`):** Parses request parameters, validates input, handles `try/catch` blocks, and calls the Service layer. Sends the HTTP response back to the client.
3. **Service (`services/`):** Contains the core business logic. Communicates with external APIs (QuickBooks/Xero) and calls the Repository layer for database operations.
4. **Repository (`repositories/`):** Abstracts all database queries (using Sequelize).
5. **Database (`sqlite3`):** The persistent data storage.

## 9. Installation & Setup
```bash
# 1. Clone the repository
git clone <repository-url>
cd ERP-Project/Backend

# 2. Install dependencies
npm install

# 3. Create a .env file (see Environment Variables section)
touch .env

# 4. Start the development server
npm run dev
```

## 10. Prerequisites
- Node.js (v18.x or higher recommended)
- npm or yarn package manager
- Registered Developer Accounts for Intuit (QuickBooks) and Xero to obtain Client IDs and Secrets.

## 11. Environment Variables (.env)
Create a `.env` file in the root of the Backend directory. Ensure it contains:
```env
PORT=3000
SESSION_SECRET=your_super_secret_session_key

# QuickBooks Config
QB_CLIENT_ID=your_quickbooks_client_id
QB_CLIENT_SECRET=your_quickbooks_client_secret
QB_REDIRECT_URI=http://localhost:3000/api/quickbooks/callback
QB_ENVIRONMENT=sandbox

# Xero Config
XERO_CLIENT_ID=your_xero_client_id
XERO_CLIENT_SECRET=your_xero_client_secret
XERO_REDIRECT_URI=http://localhost:3000/api/xero/callback
```

## 12. Available Scripts
- `npm start`: Starts the production Node server.
- `npm run dev`: Starts the application in development mode.
- `npm test`: Placeholder for running the test suite.

## 13. API Structure
The API endpoints are prefixed and registered in `src/routes/index.js`.
- **QuickBooks:** `/api/quickbooks/*` (e.g., `/connect`, `/callback`, `/export-master-data`)
- **Xero:** `/api/xero/*` (e.g., `/connect`, `/callback`, `/contacts`, `/accounts`)

## 14. Database Configuration
The project uses **SQLite3** coupled with **Sequelize ORM** for local, file-based rapid development. The configuration is handled in `src/core/database/index.js`. Moving to production, the dialect can be easily swapped to PostgreSQL or MySQL via Sequelize configurations.

## 15. Authentication & Security
- **OAuth 2.0:** Secure authorization code flow with state validation is implemented for third-party integrations to prevent CSRF attacks.
- **Sessions:** `express-session` is used to maintain state across the OAuth flows.
- **CORS:** Cross-Origin Resource Sharing is enabled to allow frontend web applications to interact with the API securely.

## 16. Error Handling
Controllers implement standardized `try...catch` wrappers. Errors from external APIs (like Axios network errors) are caught, logged gracefully, and transformed into standard HTTP 400/500 JSON error responses so the frontend can display meaningful messages without crashing the server.

## 17. Logging
A centralized logger is implemented in `src/core/logger/index.js`. 
- **Info Logs:** Used for tracking standard operations (e.g., server start, OAuth redirects).
- **Error Logs:** Captures stack traces, external API error payloads, and database connection issues.

## 18. Validation
Incoming requests are validated via middleware before hitting the Controller logic. For example, OAuth state parameters are validated using custom middleware (`validateQuickBooksState`).

## 19. Testing Strategy
*Currently pending implementation.* 
Future iterations should implement:
- **Unit Tests:** Using Jest to test individual Services and Repositories.
- **Integration Tests:** Using Supertest to validate API endpoint responses.

## 20. Configuration Management
All configuration values (ports, OAuth scopes, external URLs) are centralized. Environment variables are loaded in `src/core/config/index.js`, while static string variables and API paths live in `src/core/constants/index.js`.

## 21. Deployment Guide
1. Provision a Node.js supported environment (e.g., AWS EC2, Heroku, Render).
2. Set up the production `.env` variables securely.
3. If changing from SQLite to a production DB (PostgreSQL), install the appropriate driver (`npm install pg pg-hstore`).
4. Start the server using a process manager like PM2: `pm2 start src/server.js --name "finaccrual-api"`

## 22. Project Standards & Best Practices
- **OOP Concepts:** Controllers and Services are structured as Classes.
- **Asynchronous Code:** `async/await` is used extensively for thread-like asynchronous behavior, avoiding callback hell. `Promise.all` is leveraged for parallel execution.
- **DRY Principle:** Reusable logic is extracted to the `core/` directory.

## 23. Troubleshooting
- **OAuth Redirect Mismatch:** Ensure the `REDIRECT_URI` in your `.env` perfectly matches the one registered in the QuickBooks/Xero Developer Portals.
- **Database Lock Errors:** Since SQLite is file-based, heavy concurrent writes may cause locks. Consider upgrading to PostgreSQL for high-concurrency environments.
- **Session Lost:** Ensure `express-session` is configured correctly if deploying behind a reverse proxy (e.g., setting `trust proxy = 1`).

## 24. Future Enhancements
- Migrate database to PostgreSQL for production readiness.
- Add comprehensive Unit & Integration test coverage.
- Add Swagger/OpenAPI documentation.

## 25. Contributing Guidelines
1. Fork the repository and create your feature branch: `git checkout -b feature/my-new-feature`
2. Ensure your code follows the existing Object-Oriented patterns.
3. Commit your changes logically and push to your branch.
4. Submit a Pull Request with a detailed description of your changes.

## 26. License
This project is licensed under the MIT License - see the LICENSE file for details.

## 27. Author Information
Developed for the FinAccrual ERP System. 
Maintainer: [Your Name/Team Name]
Contact: [Your Email]
