# SecureAuth IAM

![Java](https://img.shields.io/badge/Java-21-orange?style=flat-square&logo=openjdk)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.4-green?style=flat-square&logo=springboot)
![React](https://img.shields.io/badge/React-18-blue?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Tailwind](https://img.shields.io/badge/Tailwind%20CSS-3-06B6D4?style=flat-square&logo=tailwindcss)
![Build](https://github.com/bhargavdharan/secureauth-iam/actions/workflows/build.yml/badge.svg)
![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)

> Enterprise-grade Identity and Access Management platform built with Spring Boot and React. Features JWT authentication, RBAC, MFA (TOTP), audit logging, and API key management.

**[Live Demo](https://secureauth-iam-production.up.railway.app)** — Login with `admin@secureauth.com` / `Admin@123`

## Features

- **JWT Authentication** — Secure access/refresh token flow with configurable expiration
- **Role-Based Access Control** — Granular roles (SUPER_ADMIN, ADMIN, USER) with permission sets
- **Multi-Factor Authentication** — TOTP-based MFA with authenticator app support
- **User Management** — Create, update, enable/disable users, assign roles (admin)
- **Audit Logging** — Comprehensive activity tracking with filtering and CSV export
- **API Key Management** — Generate, list, and revoke API keys with secure hashing
- **Dashboard Analytics** — Real-time stats, role distribution charts, activity timeline
- **Swagger/OpenAPI** — Interactive API documentation with JWT auth support
- **Dual Database** — H2 for local dev, PostgreSQL for production (Spring Profiles)

## Architecture

```
secureauth-iam/
├── backend/                  # Spring Boot 3.4 REST API
│   ├── config/               # Security, CORS, Swagger, data seeding
│   ├── model/                # JPA entities (User, Role, Permission, AuditLog, ApiKey)
│   ├── repository/           # Spring Data JPA repositories
│   ├── service/              # Business logic layer
│   ├── controller/           # REST endpoints
│   ├── security/             # JWT provider, auth filter, user details
│   ├── dto/                  # Request/response DTOs with validation
│   └── exception/            # Global error handler
├── frontend/                 # React 18 + Vite + TypeScript + Tailwind
│   ├── api/                  # Axios client with interceptors
│   ├── components/           # Layout, Sidebar, Header, ProtectedRoute
│   ├── pages/                # Login, Register, Dashboard, Users, AuditLogs, ApiKeys, Settings
│   ├── context/              # AuthContext (JWT storage, user state)
│   └── types/                # TypeScript interfaces
└── README.md
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Java 21, Spring Boot 3.4, Spring Security, Spring Data JPA |
| Auth | JWT (jjwt), BCrypt, TOTP (samstevens totp) |
| Database | H2 (dev), PostgreSQL (prod) |
| API Docs | springdoc-openapi (Swagger UI) |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS 3 |
| Charts | Recharts |
| HTTP | Axios with JWT interceptor |

## Getting Started

### Prerequisites

- Java 21+
- Maven 3.9+
- Node.js 18+
- npm 9+

### Backend Setup

```bash
cd backend

# Run with H2 (default dev profile)
mvn spring-boot:run

# Or build and run
mvn clean package
java -jar target/secureauth-iam-1.0.0.jar
```

Backend starts at **http://localhost:8080**

### Frontend Setup

```bash
cd frontend

npm install
npm run dev
```

Frontend starts at **http://localhost:5173**

### Default Credentials

| Email | Password | Role |
|-------|----------|------|
| admin@secureauth.com | Admin@123 | SUPER_ADMIN |

## API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Register new user | Public |
| POST | `/api/auth/login` | Login (returns JWT) | Public |
| POST | `/api/auth/refresh` | Refresh access token | Public |
| GET | `/api/auth/me` | Get current user | User |
| GET | `/api/dashboard/stats` | Dashboard statistics | User |
| GET | `/api/users` | List users (paginated) | Admin |
| GET | `/api/users/{id}` | Get user details | Admin |
| PUT | `/api/users/{id}` | Update user | Admin |
| PUT | `/api/users/{id}/toggle` | Enable/disable user | Admin |
| PUT | `/api/users/{id}/roles` | Assign roles | Admin |
| GET | `/api/roles` | List roles | Admin |
| POST | `/api/roles` | Create role | Admin |
| GET | `/api/audit-logs` | List audit logs | Admin |
| GET | `/api/api-keys` | List user's API keys | User |
| POST | `/api/api-keys` | Generate API key | User |
| DELETE | `/api/api-keys/{id}` | Revoke API key | User |
| POST | `/api/mfa/setup` | Setup MFA | User |
| POST | `/api/mfa/verify` | Verify & enable MFA | User |
| PUT | `/api/settings/profile` | Update profile | User |
| PUT | `/api/settings/password` | Change password | User |

Full interactive docs at **http://localhost:8080/swagger-ui.html**

## Environment Variables (Production)

Railway PostgreSQL plugin auto-provides `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`. You only need to set:

```env
SPRING_PROFILES_ACTIVE=prod
JWT_SECRET=your-base64-encoded-secret-key
CORS_ORIGINS=https://your-railway-domain.up.railway.app
```

## Security Features

- **Password Policy** — Minimum 8 characters with uppercase, lowercase, digit, and special character
- **JWT Tokens** — Short-lived access tokens (15min) + long-lived refresh tokens (7 days)
- **BCrypt Hashing** — Passwords and API keys hashed with BCrypt
- **TOTP MFA** — Time-based one-time passwords compatible with Google Authenticator, Authy, etc.
- **CORS Protection** — Configurable allowed origins
- **Audit Trail** — All security-relevant actions logged with IP address and timestamp

## Deployment (Railway — Single JAR)

The frontend is bundled into the Spring Boot JAR's `static/` resources at build time — no separate frontend hosting needed.

### Railway Setup

1. Create a new project at [railway.app](https://railway.app)
2. Deploy from GitHub → `bhargavdharan/secureauth-iam`
3. Add **PostgreSQL** plugin (auto-provides `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`)
4. Set environment variables:
   ```
   SPRING_PROFILES_ACTIVE=prod
   JWT_SECRET=<generate a strong base64-encoded key>
   CORS_ORIGINS=https://<your-railway-domain>.up.railway.app
   ```
5. Railway reads `nixpacks.toml`, builds frontend + backend, and deploys

### CI/CD

GitHub Actions runs on every push to `main` — builds frontend, copies to backend static, and verifies Maven package succeeds.

## License

MIT

## Author

**Dharan Kumar Bera** — Identity Security Engineer

- GitHub: [@bhargavdharan](https://github.com/bhargavdharan)
- LinkedIn: [bhargavdharan](https://linkedin.com/in/bhargavdharan)
