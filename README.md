<p align="center">
  <img src="https://img.shields.io/badge/EmPay-HRMS-3B82F6?style=for-the-badge&logo=lightning&logoColor=white" alt="EmPay HRMS" />
</p>

<h1 align="center">⚡ EmPay HRMS</h1>
<h3 align="center">Enterprise Human Resource Management System</h3>

<p align="center">
  <em>A production-grade, full-stack HRMS engineered for the Indian enterprise — featuring automated payroll compliance, role-based access control, real-time analytics, and zero-knowledge password security.</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-22.x-339933?style=flat-square&logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/PostgreSQL-Neon-4169E1?style=flat-square&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/Prisma-ORM_7.8-2D3748?style=flat-square&logo=prisma&logoColor=white" />
  <img src="https://img.shields.io/badge/TailwindCSS-4.2-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/Express-5.x-000000?style=flat-square&logo=express&logoColor=white" />
</p>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [Tech Stack](#-tech-stack)
- [Database Schema](#-database-schema)
- [Role-Based Access Control](#-role-based-access-control)
- [Security Implementation](#-security-implementation)
- [API Endpoints](#-api-endpoints)
- [Getting Started](#-getting-started)
- [Demo Credentials](#-demo-credentials)
- [Project Structure](#-project-structure)
- [Screenshots](#-screenshots)
- [Team](#-team)

---

## 🎯 Overview

**EmPay** is a comprehensive, enterprise-grade HRMS built from scratch to manage the complete employee lifecycle — from onboarding and attendance tracking to automated Indian payroll processing and organizational analytics.

The system is currently operating at a scale of **300+ employees** with **12 months of historical payroll data**, simulating a mid-sized Indian enterprise environment.

### What Makes EmPay Different?

| Feature | EmPay | Typical College Projects |
|---|---|---|
| **Scale** | 300 employees, 12 months of data | 5–10 test users |
| **Security** | SHA-256 + Bcrypt double hashing | Plain text or single hash |
| **Compliance** | PF, PT, ESIC, LOP — auto-calculated | No payroll logic |
| **Access Control** | 4-tier RBAC with data masking | Single admin role |
| **PDF Engine** | Dynamic payslip generation (PDFKit) | No document output |
| **Analytics** | Recharts with domain-scaled insights | Basic tables |

---

## ✨ Key Features

### 🔐 Authentication & Security
- **Zero-Knowledge Password Transport** — Passwords are SHA-256 hashed on the client before transmission; the server never sees raw passwords
- **Bcrypt Storage** — Server stores `bcrypt(sha256(password))`, providing defense-in-depth
- **JWT-Based Sessions** — Stateless authentication with role-embedded tokens (8h expiry)
- **Email Verification** — SMTP-based email verification flow with token expiry
- **Password Reset** — Secure token-based password recovery via email

### 👥 Employee Management
- **Complete Directory** — Searchable, paginated employee directory with 300+ profiles
- **Profile Management** — Avatar upload (Cloudinary CDN), personal details, department, designation
- **Employee Codes** — Unique identifiers for each employee (e.g., `EMP001`)
- **Data Masking** — Financial data (CTC, salary) is hidden from non-authorized roles

### ⏰ Attendance System
- **Real-Time Clock In/Out** — One-click attendance with timestamp recording
- **Admin Override** — Supervisors can override attendance with audit notes
- **Daily/Monthly Views** — Aggregated attendance tracking per department
- **LOP Integration** — Absent days automatically feed into payroll as Loss of Pay

### 🏖️ Leave Management
- **4 Leave Types** — Casual, Sick, Earned, and Unpaid leave with annual quotas
- **Balance Tracking** — Real-time consumed/remaining leave display
- **Approval Workflow** — Submit → Pending → Approved/Rejected pipeline
- **Calendar Integration** — Leave requests with date range selection

### 💰 Payroll Engine
- **Indian Compliance** — Automated calculation of:
  - **Provident Fund (PF)** — 12% of Basic Salary
  - **Professional Tax (PT)** — State-specific slab deductions
  - **ESIC** — Optional Employee State Insurance
  - **Loss of Pay (LOP)** — Attendance-based salary deduction
- **Salary Structure** — Configurable CTC breakdown: Basic (40%), HRA (50% of Basic), Special Allowance (remainder)
- **Bulk Payrun** — Process entire organization's salary in one click
- **PDF Payslips** — Professionally formatted, downloadable PDF payslips via PDFKit

### 📊 Reports & Analytics
- **Payroll Expenditure Trend** — 12-month area chart (June 2025 – May 2026) showing organizational spending patterns
- **Department Distribution** — Pie chart of workforce distribution across 7 departments
- **Departmental Attendance** — Scaled bar chart (85–100% Y-axis) for actionable HR insights
- **Audit Trail** — Immutable log of all system actions (salary changes, approvals, overrides)

### 🎨 UI/UX
- **Responsive Design** — Mobile-first layout with collapsible burger menu sidebar
- **Dark Branding** — Premium split-screen login with glassmorphism effects
- **Skeleton Loading** — Smooth loading states for all data-heavy views
- **Micro-Animations** — Hover effects, transitions, and fade-in animations throughout

---

## 🏗 System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT (Browser)                      │
│  React 19 + Vite 8 + TailwindCSS 4 + Zustand + Recharts│
│         SHA-256 hashing before any network call          │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTPS / REST API
                       ▼
┌─────────────────────────────────────────────────────────┐
│                  API SERVER (Node.js)                     │
│    Express 5  ·  JWT Auth Middleware  ·  RBAC Guards      │
│                                                           │
│  ┌──────────┐ ┌──────────┐ ┌────────┐ ┌───────────────┐ │
│  │   Auth   │ │ Employee │ │ Payroll│ │  Attendance   │ │
│  │  Module  │ │  Module  │ │ Module │ │    Module     │ │
│  └──────────┘ └──────────┘ └────────┘ └───────────────┘ │
│  ┌──────────┐ ┌──────────┐                               │
│  │  Leave   │ │Analytics │  PDFKit · Nodemailer · Multer │
│  │  Module  │ │  Module  │  Cloudinary · bcryptjs         │
│  └──────────┘ └──────────┘                               │
└──────────────────────┬──────────────────────────────────┘
                       │ Prisma ORM (pg adapter)
                       ▼
┌─────────────────────────────────────────────────────────┐
│              PostgreSQL (Neon Serverless)                 │
│   10 Tables · JSONB Audit Logs · Unique Constraints      │
│   UUID Primary Keys · Cascading Deletes                  │
└─────────────────────────────────────────────────────────┘
```

---

## 🛠 Tech Stack

### Backend
| Technology | Version | Purpose |
|---|---|---|
| **Node.js** | 22.x | Runtime environment |
| **Express** | 5.2 | HTTP framework |
| **Prisma** | 7.8 | ORM & database toolkit |
| **PostgreSQL** | 17 (Neon) | Cloud-hosted relational database |
| **bcryptjs** | 3.0 | Password hashing (server-side) |
| **jsonwebtoken** | 9.0 | JWT token generation & verification |
| **PDFKit** | 0.18 | Dynamic PDF payslip generation |
| **Nodemailer** | 8.0 | SMTP email service |
| **Cloudinary** | 1.41 | CDN image storage for avatars |
| **Multer** | 2.1 | File upload middleware |

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| **React** | 19.2 | UI component library |
| **Vite** | 8.0 | Build tool & dev server |
| **TailwindCSS** | 4.2 | Utility-first CSS framework |
| **Zustand** | 5.0 | Lightweight state management |
| **React Query** | 5.x | Server state & caching |
| **Recharts** | 3.8 | Data visualization (charts) |
| **React Router** | 7.14 | Client-side routing |
| **Lucide React** | 1.14 | Icon library |
| **js-sha256** | 0.11 | Client-side password hashing |
| **@react-pdf/renderer** | 4.5 | PDF payslip rendering |

---

## 🗄 Database Schema

The system uses **10 interconnected tables** with enforced referential integrity:

```
┌──────────┐     1:1     ┌──────────────────┐     1:1     ┌──────────────────┐
│  users   │────────────▶│ employee_profiles │────────────▶│salary_structures │
│          │             │                  │             │                  │
│ id (PK)  │             │ employeeCode (U) │             │ ctcAnnual        │
│ email(U) │             │ department       │             │ basicPct (40%)   │
│ role     │             │ designation      │             │ hraPct (50%)     │
│ passHash │             │ avatarUrl        │             │ pfEnabled        │
│ verified │             │                  │             │ state (for PT)   │
└──────────┘             └──────────────────┘             └──────────────────┘
     │                          │
     │ 1:N                      │ 1:N
     ▼                          ▼
┌──────────────┐         ┌──────────────────┐
│  attendance  │         │ leave_balances   │
│              │         │                  │
│ date (U/emp) │         │ leaveType        │
│ status       │         │ year             │
│ clockIn/Out  │         │ totalDays        │
│ overrideBy   │         │ consumed         │
└──────────────┘         └──────────────────┘

┌──────────────────┐     1:N     ┌──────────────┐
│  payroll_runs    │────────────▶│   payslips   │
│                  │             │              │
│ month/year (U)   │             │ grossSalary  │
│ status (D/F)     │             │ pfDeduction  │
│ triggeredBy      │             │ ptDeduction  │
│ finalizedAt      │             │ lopDeduction │
└──────────────────┘             │ netPay       │
                                 │ workingDays  │
┌──────────────────┐             │ presentDays  │
│ leave_requests   │             └──────────────┘
│                  │
│ leaveType        │         ┌──────────────────┐
│ fromDate/toDate  │         │   audit_logs     │
│ status (P/A/R)   │         │                  │
│ approverId       │         │ entity/action    │
│ reason           │         │ beforeValue(JSON)│
└──────────────────┘         │ afterValue(JSON) │
                             └──────────────────┘
```

### Key Design Decisions
- **UUID Primary Keys** — Non-sequential, globally unique identifiers
- **Composite Unique Constraints** — `[employeeId, date]` on attendance, `[month, year]` on payroll runs
- **JSONB Audit Snapshots** — Before/after values stored as JSON for complete change tracking
- **Cascading Deletes** — Removing a user cascades to profiles, attendance, payslips, and leave records
- **Decimal Precision** — All financial fields use `Decimal(20, 2)` for accurate currency math

---

## 🔒 Role-Based Access Control

EmPay implements a **4-tier RBAC system** where each role has precisely scoped permissions:

| Capability | Admin | HR Officer | Payroll Officer | Employee |
|---|:---:|:---:|:---:|:---:|
| View Dashboard Analytics | ✅ | ✅ | ✅ | ✅ |
| Manage Employee Profiles | ✅ | ✅ | ❌ | ❌ |
| View Salary/CTC Data | ✅ | ❌ (Masked) | ✅ | Own Only |
| Process Payroll Runs | ✅ | ❌ | ✅ | ❌ |
| Approve/Reject Leaves | ✅ | ❌ | ✅ | ❌ |
| View Attendance (All) | ✅ | ✅ | ✅ | ❌ |
| Clock In/Out | ✅ | ✅ | ✅ | ✅ |
| Download Own Payslip | ✅ | ✅ | ✅ | ✅ |
| User Management | ✅ | ❌ | ❌ | ❌ |
| View Audit Logs | ✅ | ❌ | ❌ | ❌ |

> **Data Masking**: When an HR Officer views the Employee Directory, financial columns (CTC, Basic Salary) are replaced with `••••••` to enforce privacy boundaries.

---

## 🔐 Security Implementation

```
┌───────────────┐          ┌───────────────┐          ┌──────────────┐
│   Browser     │          │   Network     │          │   Server     │
│               │          │               │          │              │
│  "Admin@123"  │──SHA256─▶│  "8c6976..."  │──HTTPS──▶│ bcrypt(hash) │
│  (plaintext)  │          │  (64-char)    │          │ $2a$10$...   │
│               │          │               │          │              │
│  Raw password │          │  Hash only    │          │  Double-     │
│  NEVER leaves │          │  on the wire  │          │  hashed      │
│  the browser  │          │               │          │  storage     │
└───────────────┘          └───────────────┘          └──────────────┘
```

### Defense Layers
1. **Client-Side SHA-256** — Raw password is hashed before leaving the browser
2. **HTTPS Transport** — Encrypted channel prevents hash interception
3. **Server-Side Bcrypt** — SHA-256 hash is bcrypt'd (10 rounds) before storage
4. **JWT Tokens** — Stateless, time-limited (8h) session tokens with embedded roles
5. **Email Verification** — Accounts require email confirmation before first login
6. **Input Validation** — All API endpoints validate and sanitize inputs

---

## 🌐 API Endpoints

### Authentication (`/api/auth`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/login` | Authenticate user (email or employee code) |
| `POST` | `/register` | Register new employee with email verification |
| `GET` | `/verify-email?token=` | Verify email address |
| `POST` | `/resend-verification` | Resend verification email |
| `POST` | `/forgot-password` | Request password reset |
| `POST` | `/reset-password` | Reset password with token |
| `GET` | `/me` | Get current user profile |
| `POST` | `/change-password` | Change authenticated user's password |

### Employees (`/api/employees`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | List all employees (paginated, searchable) |
| `GET` | `/:id` | Get employee details |
| `PUT` | `/:id` | Update employee profile |
| `POST` | `/:id/avatar` | Upload profile avatar (Cloudinary) |

### Attendance (`/api/attendance`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/clock-in` | Record clock-in timestamp |
| `POST` | `/clock-out` | Record clock-out timestamp |
| `GET` | `/my` | Get own attendance records |
| `GET` | `/all` | Get all attendance (HR/Admin) |
| `PUT` | `/:id/override` | Admin attendance override |

### Leave (`/api/leaves`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/` | Submit leave request |
| `GET` | `/my` | Get own leave requests |
| `GET` | `/pending` | Get pending approvals (Payroll/Admin) |
| `PUT` | `/:id/approve` | Approve leave request |
| `PUT` | `/:id/reject` | Reject leave request |
| `GET` | `/balances` | Get leave balances |

### Payroll (`/api/payroll`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/run` | Trigger bulk payroll processing |
| `GET` | `/runs` | List all payroll runs |
| `GET` | `/runs/:id` | Get payrun details with payslips |
| `GET` | `/my-payslips` | Get own payslips |
| `GET` | `/payslip/:id/pdf` | Download payslip as PDF |

### Analytics (`/api/analytics`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/dashboard` | Dashboard summary stats |
| `GET` | `/payroll-trend` | Monthly payroll expenditure data |
| `GET` | `/department-stats` | Department-wise distribution |
| `GET` | `/attendance-summary` | Aggregated attendance metrics |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** ≥ 18.x
- **npm** ≥ 9.x
- **PostgreSQL** database (or a [Neon](https://neon.tech) free-tier account)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/shalin0000007/HRMS_Odoo.git
cd HRMS_Odoo

# 2. Install backend dependencies
npm install

# 3. Install frontend dependencies
cd frontend && npm install && cd ..

# 4. Configure environment variables
cp .env.example .env
# Edit .env with your database URL, JWT secret, and SMTP credentials

# 5. Generate Prisma client & push schema to database
npx prisma generate
npx prisma db push

# 6. Seed the database with 300 employees and 12 months of data
npm run db:seed

# 7. Start the backend (port 5000)
npm run dev

# 8. Start the frontend (port 5173) — in a new terminal
cd frontend && npm run dev
```

### Environment Variables

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host/db` |
| `JWT_SECRET` | Secret key for JWT signing | `your-secret-key` |
| `JWT_EXPIRES_IN` | Token expiry duration | `8h` |
| `PORT` | Backend server port | `5000` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:5173` |
| `SMTP_HOST` | Email SMTP server | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP port | `587` |
| `SMTP_USER` | SMTP email address | `your-email@gmail.com` |
| `SMTP_PASS` | SMTP app password | `xxxx-xxxx-xxxx-xxxx` |

---

## 🔑 Demo Credentials

Use the **Quick Demo Access** buttons on the login page or enter manually:

| Role | Email | Password | Access Level |
|---|---|---|---|
| 🔵 **Admin** | `admin@empay.dev` | `Admin@123` | Full system control |
| 🟢 **HR Officer** | `hr@empay.dev` | `Hr@123` | Workforce management (salary masked) |
| 🟡 **Payroll Officer** | `payroll@empay.dev` | `Payroll@123` | Financial processing & approvals |
| 🟣 **Employee** | `alice@empay.dev` | `Alice@123` | Self-service portal |

---

## 📁 Project Structure

```
empay-hrms/
├── prisma/
│   ├── schema.prisma          # Database schema (10 models, 4 enums)
│   └── seed.js                # Data seeding script (300 employees)
│
├── src/                       # ── BACKEND ──
│   ├── app.js                 # Express server entry point
│   ├── prismaClient.js        # Prisma singleton (PG adapter)
│   ├── middleware/
│   │   └── auth.js            # JWT verification + RBAC guards
│   ├── modules/
│   │   ├── auth/              # Login, register, verify, reset
│   │   ├── employees/         # CRUD, avatar upload, directory
│   │   ├── attendance/        # Clock in/out, override, reports
│   │   ├── leaves/            # Requests, approvals, balances
│   │   ├── payroll/           # Payruns, payslips, PDF engine
│   │   └── analytics/         # Dashboard stats, trends
│   └── utils/
│       └── emailService.js    # Nodemailer SMTP transporter
│
├── frontend/                  # ── FRONTEND ──
│   ├── src/
│   │   ├── api/               # Axios instance + endpoint definitions
│   │   ├── store/             # Zustand auth store (persistent)
│   │   ├── components/
│   │   │   ├── AppLayout.jsx  # Protected route wrapper
│   │   │   ├── Sidebar.jsx    # Responsive burger menu navigation
│   │   │   ├── PayslipPDF.jsx # PDF payslip renderer
│   │   │   ├── StatCard.jsx   # Dashboard metric cards
│   │   │   └── ...
│   │   └── pages/
│   │       ├── auth/          # Login, Signup, Forgot Password
│   │       ├── dashboard/     # Main dashboard with charts
│   │       ├── employees/     # Directory + detail views
│   │       ├── attendance/    # Clock in/out + history
│   │       ├── leaves/        # Request form + approval queue
│   │       ├── payroll/       # Payruns + payslip download
│   │       ├── reports/       # Analytics with Recharts
│   │       └── settings/      # User management (Admin)
│   └── index.html
│
├── .env.example               # Environment template
├── package.json               # Backend dependencies
└── README.md                  # You are here
```

---

## 📸 Application Previews

### Login Screen
> Premium split-screen design with dark branding panel, trust badges, and Quick Demo Access buttons for all 4 roles.

### Admin Dashboard
> Real-time organizational metrics: total headcount (300), monthly payroll expenditure, pending leave requests, and active employees — all in a single glance.

### Reports & Analytics
> **Payroll Expenditure Trend** (June 2025 – May 2026) with realistic fluctuations. **Departmental Attendance** bar chart with Y-axis scaled to 85–100% for actionable HR insights. **Audit Trail** with timestamped action log.

### Employee Self-Service
> Clean, distraction-free portal: profile management, one-click attendance, leave request submission, and instant PDF payslip download.

---

## 🏆 Technical Highlights for Judges

1. **Production Scale** — 300 employees with 12 months of historical data, not a 5-user prototype
2. **Zero-Knowledge Security** — SHA-256 client-side + Bcrypt server-side double hashing
3. **Indian Payroll Compliance** — Automated PF (12%), Professional Tax (state-wise slabs), ESIC, and LOP
4. **4-Tier RBAC with Data Masking** — HR sees profiles but not salaries; employees see only their own data
5. **PDF Generation Engine** — Dynamic payslips with PDFKit reflecting real attendance and deduction data
6. **Immutable Audit Trail** — Every action logged with JSONB before/after snapshots
7. **Modern React Architecture** — React 19 + Zustand + React Query + Recharts for a premium SPA experience
8. **Responsive UI** — Burger menu sidebar, skeleton loaders, and micro-animations throughout

---

## 👥 Team

| Name | Role | Responsibilities |
|---|---|---|
| **Shalin** | Full-Stack Lead | Architecture, Backend APIs, Database Design, Frontend Development |

---

<p align="center">
  <strong>Built with ❤️ for the Modern Indian Enterprise</strong><br/>
  <sub>EmPay HRMS v1.0 · 2025–2026</sub>
</p>
