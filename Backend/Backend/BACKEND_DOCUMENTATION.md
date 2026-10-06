# Backend Documentation

## 1. Overview
The backend is a Node.js + Express application for the ERP system. It exposes REST APIs for:
- QuickBooks Online OAuth connection and data access
- Xero OAuth connection and data access
- Admin-related operations
- Excel launch integration with the frontend

The project is structured as an **Advanced Modular Monolith**, with shared infrastructure under the `core` folder and strict domain-driven logic under the `modules` folder.

---

## 2. Project Purpose
This backend serves as the integration layer between the ERP application and external accounting systems. Its main responsibilities are:
- Handling OAuth 2.0 authorization flows for QuickBooks and Xero
- Persisting access and refresh tokens
- Fetching accounting data such as customers, vendors, accounts, contacts, and accounts
- Exposing endpoints to the frontend
- Launching the frontend application from the backend

---

## 3. Technology Stack
- **Runtime**: Node.js
- **Framework**: Express.js
- **ORM**: Sequelize
- **Database**: SQLite
- **Authentication**: express-session
- **HTTP Client**: axios
- **Environment Variables**: dotenv
- **CORS**: cors
- **Excel generation**: exceljs
- **Testing**: Jest & Supertest

---

## 4. Project Structure (Modular Monolith)

The codebase is organized into vertical slices (domains) rather than horizontal technical layers. This keeps domains strictly isolated and makes the system easily scalable or extractable into microservices in the future.

```text
Backend/
├── src/
│   ├── app.js               # Express application and middleware configuration
│   ├── server.js            # Entry point for starting the server
│   ├── routes/
│   │   └── index.js         # Global router that mounts module routes
│   │
│   ├── core/                # Shared utilities and global config
│   │   ├── config/          # Environment variables and basic settings
│   │   ├── constants/       # Global constants (e.g., OAuth URLs)
│   │   ├── database/        # Sequelize instance setup
│   │   ├── helpers/         # Utility functions
│   │   ├── logger/          # Logging wrapper
│   │   └── middleware/      # Express middleware (e.g., OAuth state validation)
│   │
│   └── modules/             # Business Domains
│       ├── admin/           # Admin authentication module
│       ├── quickbooks/      # QuickBooks API integration module
│       └── xero/            # Xero API integration module
│
├── tests/                   # Jest Test Suite
│   ├── integration/         # API Route integration testing
│   └── unit/                # Unit tests for Mappers and Core functions
```

---

## 5. The 7-File Module Pattern

Every module inside `src/modules/<domain>/` strictly adheres to the following 7-file structure:

| File | Responsibility |
|------|----------------|
| `index.js` | The public entry point for the module. Exports what the rest of the application is allowed to access. |
| `controller.js` | The HTTP layer. It parses the incoming `req`, delegates work to the Service layer, and sends the HTTP `res`. No business logic. |
| `service.js` | The Business Logic layer. Orchestrates database reads/writes (via repository) and external API calls. |
| `repository.js` | The Database layer. Contains all logic that directly queries or mutates Sequelize models. |
| `mapper.js` | The Transformation layer. Takes raw API or Database payloads and converts them into clean, standardized DTOs (Data Transfer Objects). |
| `model.js` | The Sequelize schema definition for tables owned by this module. |
| `routes.js` | Express route definitions. Maps URLs (e.g., `/connect`) to the appropriate Controller methods. |

### Data Flow
1. **Request** hits `routes.js` -> routes it to `controller.js`.
2. **Controller** extracts params and calls `service.js`.
3. **Service** makes external API calls or talks to `repository.js`.
4. **Service** receives raw data and passes it through `mapper.js`.
5. **Controller** receives clean data from Service and sends it to the client.

---

## 6. How to Run

### Development
```bash
npm install
npm run dev
```

### Production
```bash
npm start
```

### Running Tests
The project uses `jest` and `supertest` to verify functionality without hitting live external APIs.

```bash
# Run the entire test suite
npm test

# Run tests in watch mode during development
npm run test:watch
```
