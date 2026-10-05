# AMDEMIS - Atwima Mponua District Education Management Information System

> **Atwima Mponua District Education Directorate — Planning & Statistics Unit, Ghana**  
> Modern, mobile-first, offline-resilient EMIS platform replacing the 35-page annual data collection Google Form.

---

## 🏛️ System Overview

AMDEMIS is designed specifically for the low-bandwidth, mobile-heavy reality of headteachers across Atwima Mponua District in Ghana. The system collects granular annual school data (enrolments, teacher counts, age distributions, infrastructure, WASH facilities, special education, and furniture) with real-time arithmetic cross-validations, offline auto-save persistence, and automatic supervisor review workflows.

### Key Highlights
- **Zero-Seeded Cold Start**: The system boots clean. The Planning & Statistics Directorate creates circuits, registers schools, and generates secure credentials directly within the app.
- **Headteacher Authentication via School Login ID & PIN**: Clean numeric credentials (`AMD-0001` + 6-digit numeric PIN) with automatic rate limiting, 15-minute lockouts, and forced first-time PIN changes.
- **Strict Row-Level Security (RLS)**: Enforced directly at the Postgres kernel level. Headteachers can strictly read and write data for their assigned school only.
- **Dynamic Education Levels Architecture**: Schools configure their active levels (`creche`, `kg`, `primary`, `jhs`) dynamically per academic collection round. The multi-step wizard and validation rules dynamically adjust in real time.
- **Ghana National Curriculum Alignment**: Pre-tertiary Basic School standards (BS1–BS3 early childhood numeracy/literacy breakdown, BS4–BS6, JHS1–JHS3, subject teacher allocations).
- **Ghana Coat of Arms & Directorate Branding**: Built with the Directorate's official color palette (Navy `#0A2A66`, Mid Blue `#123B86`, Gold `#F2B705`, Background `#EEF3FB`) and includes printable PIN slips, submission receipts, and PWA capabilities.
- **Enterprise Reporting & Export**: Real-time district completion KPIs, circuit progress charts with Recharts, multi-sheet formatted Excel `.xlsx` exports (`exceljs`), and CSV exports for national EMIS ingest.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router) + React 19 + TypeScript (Strict Mode)
- **Styling & UI**: Tailwind CSS + shadcn/ui + Radix UI primitives + Lucide Icons + Next Themes (Light/Dark Mode)
- **Database & Auth**: Supabase (PostgreSQL 15+, Supabase Auth, Row Level Security)
- **Forms & Validation**: `react-hook-form` + `zod` shared validation schemas
- **Reporting & Data Export**: `exceljs` (multi-tab Excel workbooks), `recharts` (district analytics charts)
- **PWA & Offline**: Installable Progressive Web App with Service Worker cache and `localStorage` form persistence
- **Testing**: Vitest for validation math and RLS isolation test suites

---

## 🚀 Quickstart & Setup Guide

### 1. Prerequisites
- Node.js `v18.17+` or `v20+`
- A Supabase Project (Cloud or local via Supabase CLI)

### 2. Environment Configuration
Copy `.env.example` to `.env.local` in the project root:
```bash
cp .env.example .env.local
```
Fill in your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-keep-secret
```

### 3. Database Migration
Execute the migration scripts in sequential order inside the Supabase SQL Editor (or via `supabase db push`):
1. `supabase/migrations/20261005000001_initial_schema.sql` (Tables, constraints, trigger sequences)
2. `supabase/migrations/20261005000002_row_level_security.sql` (Security definer functions and RLS policies)
3. `supabase/migrations/20261005000003_auth_functions.sql` (Failed attempt counter, lockouts, audit triggers)

### 4. Create Initial Super Admin Account
Run the automated bootstrap script to provision the first Super Admin:
```bash
node scripts/create-super-admin.mjs admin@amdemis.gov.gh "DistrictAdmin2026!" "Directorate Planning Officer"
```

### 5. Install Dependencies & Launch Development Server
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing

Run the automated test suite covering zod validation schemas, classroom constraints, teacher math, and RLS isolation invariants:
```bash
npm run test
```

---

## 📂 Project Structure

```
AMDEMIS/
├── public/
│   ├── branding/              # Directorate banner, logo, reference interface
│   ├── coat_of_arms.png       # Ghana coat of arms
│   ├── favicon.ico
│   ├── manifest.json          # PWA Manifest
│   └── sw.js                  # Service worker cache
├── scripts/
│   └── create-super-admin.mjs # CLI bootstrap for Super Admin
├── src/
│   ├── app/
│   │   ├── admin/             # Admin portal (dashboard, circuits, schools, rounds, submissions, reports, audit)
│   │   ├── headteacher/       # Headteacher wizard portal (dashboard, form, profile, submissions, guidelines)
│   │   ├── api/               # Next.js API route handlers (auth, submissions, admin operations, export)
│   │   ├── globals.css        # AMDEMIS color system, custom scrollbars, print styles
│   │   ├── layout.tsx         # Root layout with metadata and ThemeProvider
│   │   └── page.tsx           # Dual-tab Landing & Sign In page (Headteacher & Admin)
│   ├── components/
│   │   ├── layout/            # Headteacher and Admin sidebars and navigation headers
│   │   ├── ui/                # Accessible shadcn/ui components (Button, Dialog, Select, etc.)
│   │   └── wizard/            # Headteacher multi-step form steps, progress ring, stepper, and receipt
│   ├── lib/
│   │   ├── levels-config.ts   # Dynamic educational level definitions and helpers
│   │   ├── form-default-state.ts
│   │   ├── utils.ts
│   │   ├── schemas/           # Shared Zod schemas (auth, school, submission)
│   │   └── supabase/          # Supabase client, server, and admin service instances
│   └── types/                 # Strict TypeScript schemas and wizard models
├── supabase/
│   └── migrations/            # Versioned SQL migrations with full RLS
└── tests/
    ├── validation.test.ts     # Math, age-band caps, BS1-BS3 detail validation tests
    └── rls-isolation.test.ts  # Headteacher cross-school isolation tests
```

---

## 🔒 Security Architecture

1. **Service Role Isolation**: `SUPABASE_SERVICE_ROLE_KEY` is strictly accessed in server-side API routes and never bundled to the client.
2. **Postgres RLS**: Every table (`schools`, `submissions`, `enrolment`, `classrooms`, etc.) enforces tenant boundaries where `auth.uid() = profile.id` matching `profile.school_id`.
3. **Audit Trails**: Administrative actions (PIN resets, reopening submissions, creating schools) log actor IDs, target schools, timestamps, and IP addresses to the `audit_log` table.
4. **Brute Force Protection**: Headteacher synthetic accounts lock automatically for 15 minutes after 5 failed attempts.

---

## 📜 License
Developed for the **Atwima Mponua District Education Directorate**, Ghana. All rights reserved.
