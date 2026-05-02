# EmPay HRMS — Backend

> **Engineer A's domain.** Node.js + Express + Prisma + PostgreSQL

## Quick Start

### 1. Prerequisites
- Node.js 18+
- PostgreSQL 15+ running locally or on Railway

### 2. Setup
```bash
cd empay/backend
cp .env.example .env
# Edit .env — set DATABASE_URL to your PostgreSQL connection string
```

### 3. Database Setup
```bash
# Generate Prisma client
npm run db:generate

# Push schema to DB (creates all tables)
npm run db:push

# Seed with demo data
npm run db:seed
```

### 4. Run Dev Server
```bash
npm run dev
# Server starts at http://localhost:5000
```

### 5. Health Check
```
GET http://localhost:5000/health
```

---

## Demo Credentials (after seeding)

| Role             | Email                  | Password     |
|------------------|------------------------|--------------|
| Admin            | admin@empay.dev        | Admin@123    |
| HR Officer       | hr@empay.dev           | Hr@123       |
| Payroll Officer  | payroll@empay.dev      | Payroll@123  |
| Employee (Alice) | alice@empay.dev        | Alice@123    |
| Employee (Bob)   | bob@empay.dev          | Bob@123      |

---

## API Reference

### Auth
| Method | Endpoint                    | Auth   | Roles       |
|--------|-----------------------------|--------|-------------|
| POST   | /api/auth/login             | ❌     | Public      |
| GET    | /api/auth/me                | ✅     | All         |
| POST   | /api/auth/change-password   | ✅     | All         |

### Employees
| Method | Endpoint                    | Roles                         |
|--------|-----------------------------|-------------------------------|
| GET    | /api/employees              | admin, hr_officer, payroll_officer |
| POST   | /api/employees              | admin, hr_officer             |
| GET    | /api/employees/:id          | All (self-access for employee)|
| PUT    | /api/employees/:id          | admin, hr_officer             |
| DELETE | /api/employees/:id          | admin only (soft delete)      |
| GET    | /api/employees/:id/salary   | admin, payroll_officer        |
| PUT    | /api/employees/:id/salary   | admin, payroll_officer        |

### Attendance
| Method | Endpoint                       | Roles                    |
|--------|--------------------------------|--------------------------|
| POST   | /api/attendance/clock-in       | All staff                |
| POST   | /api/attendance/clock-out      | All staff                |
| GET    | /api/attendance/today          | All staff                |
| GET    | /api/attendance/my/:month/:year| All staff (own)          |
| GET    | /api/attendance                | admin, hr, payroll       |
| PUT    | /api/attendance/:id/override   | admin only               |

### Leaves
| Method | Endpoint                       | Roles                    |
|--------|--------------------------------|--------------------------|
| POST   | /api/leaves                    | All staff                |
| GET    | /api/leaves/my                 | All staff (own)          |
| GET    | /api/leaves/pending            | admin, payroll_officer   |
| GET    | /api/leaves/balances/:userId   | All (self/management)    |
| PUT    | /api/leaves/balances/:userId   | admin, hr_officer        |
| GET    | /api/leaves                    | admin, hr, payroll       |
| PATCH  | /api/leaves/:id/approve        | admin, payroll_officer   |
| PATCH  | /api/leaves/:id/reject         | admin, payroll_officer   |

### Payroll
| Method | Endpoint                        | Roles                   |
|--------|---------------------------------|-------------------------|
| POST   | /api/payroll/runs               | admin, payroll_officer  |
| GET    | /api/payroll/runs               | admin, payroll_officer  |
| GET    | /api/payroll/runs/:id           | admin, payroll_officer  |
| PATCH  | /api/payroll/runs/:id/finalize  | admin, payroll_officer  |
| GET    | /api/payroll/payslips/my        | All staff (own)         |
| GET    | /api/payroll/payslips/:id       | All (self-gated)        |
| GET    | /api/payroll/payslips/:id/pdf   | All (self-gated) → PDF  |

### Analytics
| Method | Endpoint                   | Roles                    |
|--------|----------------------------|--------------------------|
| GET    | /api/analytics/dashboard   | admin only               |
| GET    | /api/analytics/attendance  | admin, hr, payroll       |
| GET    | /api/analytics/payroll     | admin, payroll_officer   |
| GET    | /api/analytics/leaves      | admin, hr, payroll       |
| GET    | /api/analytics/me          | All staff (own stats)    |

---

## Payrun Trigger Example

```bash
curl -X POST http://localhost:5000/api/payroll/runs \
  -H "Authorization: Bearer <PAYROLL_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{ "month": 4, "year": 2025 }'
```

---

## Folder Structure

```
backend/
├── prisma/
│   ├── schema.prisma          # DB schema (Engineer A owns)
│   └── seed.js                # Demo data seeder
├── src/
│   ├── app.js                 # Express entry point
│   ├── prismaClient.js        # Prisma singleton
│   ├── middleware/
│   │   ├── auth.js            # JWT verification
│   │   ├── roleGuard.js       # RBAC middleware
│   │   └── errorHandler.js    # Global error handler
│   ├── modules/
│   │   ├── auth/              # login, me, change-password
│   │   ├── employees/         # CRUD + salary management
│   │   ├── attendance/        # clock-in/out + override
│   │   ├── leaves/            # apply + approve + balances
│   │   ├── payroll/           # payrun engine + PDF payslips
│   │   └── analytics/         # dashboard + chart data
│   └── utils/
│       ├── payrollEngine.js   # Pure computation function
│       ├── ptSlab.js          # Professional Tax slabs (8 states)
│       └── pdf.js             # PDFKit payslip generator
├── .env                       # Local env (gitignored)
├── .env.example               # Env template
└── prisma.config.ts           # Prisma 7 adapter config
```

---

## Payroll Engine Logic (for Engineer B's reference)

```
Basic      = CTC_annual × 40% ÷ 12
HRA        = Basic × 50%
SpecAllow  = (CTC_annual ÷ 12) - Basic - HRA - EmployerPF
Gross      = Basic + HRA + SpecAllow
PF         = Basic × 12%
PT         = Maharashtra slab lookup (₹175 or ₹200)
ESIC       = Gross × 0.75% (if gross ≤ ₹21,000 and enabled)
LOP        = (Gross ÷ workingDays) × lopDays
Net        = Gross - PF - PT - ESIC - LOP
```
