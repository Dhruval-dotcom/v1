# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Student Management Portal — a Next.js 16 full-stack app for managing students, batches, notifications, warnings, and resource links. Deployed at **d111.vercel.app**.

## Commands

```bash
npm run dev      # Start dev server (http://localhost:3000)
npm run build    # Production build
npm run start    # Serve production build
npm run lint     # ESLint (next core-web-vitals + typescript rules)
```

### Prisma

```bash
npx prisma generate         # Regenerate Prisma client after schema changes
npx prisma db push           # Push schema to Supabase (no migration files)
npx prisma migrate dev       # Create migration (may timeout — use db push if so)
npx prisma db seed           # Seed super admin (dhruval@gmail.com / Test@123)
npx prisma studio            # Open Prisma Studio GUI
```

**Important**: `prisma.config.ts` uses `DIRECT_URL` (port 5432, session mode) for migrations/push. The app runtime uses `DATABASE_URL` (port 6543, transaction mode via PgBouncer). If `db push` hangs, it's likely using the wrong URL.

## Architecture

- **Framework**: Next.js 16.2.1 with App Router (`src/app/`)
- **Database**: Supabase PostgreSQL via Prisma 7 with `@prisma/adapter-pg` driver adapter
- **Auth**: JWT (jose) in httpOnly cookies, 30-day expiry. Single login for super admin + batch admins.
- **AI**: Groq SDK with API key rotation for generating WhatsApp warning messages
- **Styling**: Tailwind CSS v4 with neumorphic design system (custom CSS classes in `globals.css`)
- **Fonts**: Playfair Display (headings) + Lora (body) — serif fonts via `next/font/google`
- **Data Fetching**: SWR for client-side, direct Prisma queries for server components, ISR with `revalidatePath()`
- **Rich Text**: Tiptap editor for notification content (bold, italic, lists)
- **Path alias**: `@/*` maps to `./src/*`

## Next.js 16 Breaking Changes

- `params` in pages/routes is `Promise<{}>` — must be awaited: `const { id } = await params`
- `cookies()` returns a Promise — must be awaited: `const cookieStore = await cookies()`
- Middleware is deprecated in favor of "proxy" (warning shown but still works)
- Use `Response.json()` in route handlers

## Prisma 7 Notes

- Generated client lives at `src/generated/prisma/` — import from `@/generated/prisma/client`
- Prisma 7 requires a driver adapter — `PrismaPg` from `@prisma/adapter-pg` (see `src/lib/prisma.ts`)
- `new PrismaClient()` without adapter will throw — always pass `{ adapter }`
- Schema has no `url` in datasource block — connection string comes from `prisma.config.ts`
- Seed config is in `prisma.config.ts` under `migrations.seed`, not in `package.json`

## Database Schema

9 tables in `prisma/schema.prisma`:

| Table | Purpose |
|-------|---------|
| `SuperAdmin` | Single super admin (dhruval@gmail.com) |
| `Batch` | Student groups (e.g., "Student 2022") |
| `Student` | Students with name, email, phoneNumbers[], batchId |
| `AdminRole` | Promoted students with password (batch-scoped access) |
| `Notification` | Rich text announcements with optional link |
| `NavbarLink` | Dynamic navbar links, `isGradePage` flag for grade pages |
| `FileLink` | Resource links with unique route slug, optional grade |
| `WarningType` | Preset warning categories with severity (green/yellow/orange/red/black) and details |
| `Warning` | Issued warnings linking student + type + details + action plan + AI-generated WhatsApp message |

## Roles & Access

| Role | Access |
|------|--------|
| **Super Admin** | Full CRUD on everything. Seeded in DB. |
| **Batch Admin** | Students (read-only, own batch), Warnings (full CRUD, own batch), Warning Types (full CRUD) |
| **Public** | Home (notifications), grade pages (`/[slug]`), file redirects (`/file/[route]`) |

## API Routes (`src/app/api/`)

All data access through API routes — no direct Prisma in frontend components.

- `/api/auth/login|logout|me` — JWT auth
- `/api/batches` + `/api/batches/[id]` — Batch CRUD (super admin)
- `/api/students` + `/api/students/[id]` — Student CRUD (super admin full, admin read own batch)
- `/api/students/[id]/make-admin|remove-admin` — Admin role management (super admin)
- `/api/notifications` + `/api/notifications/[id]` — Notification CRUD (super admin)
- `/api/navbar-links` + `/api/navbar-links/[id]` — Navbar link CRUD (super admin)
- `/api/file-links` + `/api/file-links/[id]` — File link CRUD (super admin)
- `/api/file-links/by-route/[route]` — Lookup by route slug (public)
- `/api/warning-types` + `/api/warning-types/[id]` — Warning type CRUD (admin + super admin)
- `/api/warnings` + `/api/warnings/[id]` — Warning CRUD with pagination, batch-scoped (admin + super admin)
- `/api/warnings/generate-message` — Groq AI WhatsApp message generation (admin + super admin)

Auth pattern in protected routes:
```ts
const cookieStore = await cookies();
const token = cookieStore.get("token")?.value;
const user = token ? await verifyToken(token) : null;
if (!user || user.role !== "super_admin") return Response.json({ error: "Unauthorized" }, { status: 403 });
```

For admin+super_admin routes (warnings):
```ts
if (!user || (user.role !== "super_admin" && user.role !== "admin")) return Response.json({ error: "Unauthorized" }, { status: 403 });
```

## Pages

| Route | Type | Access | Purpose |
|-------|------|--------|---------|
| `/` | Server (ISR) | Public | Notifications list |
| `/login` | Client | Public | Login form |
| `/[slug]` | Server (ISR) | Public | Grade page (shows file links for that grade) |
| `/file/[route]` | Server | Public | 307 redirect to external URL |
| `/manage/notifications` | Client | Super Admin | Notification CRUD with Tiptap editor, date filter |
| `/manage/navbar-links` | Client | Super Admin | Navbar link CRUD |
| `/manage/file-links` | Client | Super Admin | File link CRUD with grade tagging |
| `/manage/batches` | Client | Super Admin | Batch CRUD |
| `/manage/students` | Client | Super Admin | Student CRUD, search, make/remove admin |
| `/manage/students/add` | Client | Super Admin | Add student form |
| `/manage/warning-types` | Client | Admin + Super Admin | Warning type CRUD with severity colors |
| `/manage/warnings/new` | Client | Admin + Super Admin | Issue warning form with Groq AI message gen |
| `/manage/warnings` | Client | Admin + Super Admin | Paginated warnings table, batch/student filters |
| `/students` | Client | Batch Admin | Read-only student list (own batch) |

## Key Files

| File | Purpose |
|------|---------|
| `src/lib/prisma.ts` | Prisma singleton with PrismaPg adapter |
| `src/lib/auth.ts` | JWT sign/verify using jose |
| `src/lib/password.ts` | bcrypt hash/compare helpers |
| `src/lib/groq.ts` | Groq AI client with key rotation for warning messages |
| `src/middleware.ts` | Protects `/manage/*` and `/students/*` routes. Warning paths allow admin+super_admin. |
| `src/components/Navbar.tsx` | Dynamic navbar with SWR, admin dropdown, warning links for admins |
| `src/components/Dialog.tsx` | Reusable modal dialog |
| `src/components/TiptapEditor.tsx` | Rich text editor (bold, italic, lists) |
| `src/components/ConfirmDialog.tsx` | Delete confirmation dialog |
| `src/hooks/useAuth.ts` | Auth hook using SWR |
| `src/app/globals.css` | Neumorphic design system (neu-raised, neu-btn, neu-input, etc.) |
| `prisma.config.ts` | Prisma config — uses DIRECT_URL for migrations, seed command |
| `prisma/seed.ts` | Seeds super admin account |

## Warning System

Severity levels with colors used across warning pages:
- 🟢 **green** — General Note, Heads Up (`bg-emerald-100 text-emerald-700`)
- 🟡 **yellow** — Medium Priority, Important, Action Needed (`bg-amber-100 text-amber-700`)
- 🟠 **orange** — High Priority, Urgent, Time-Sensitive (`bg-orange-100 text-orange-700`)
- 🔴 **red** — Critical, Very Critical, Top Priority (`bg-red-100 text-red-700`)
- ⚫ **black** — Immediate Action Required, Final Warning, Zero Tolerance (`bg-gray-900 text-white`)

AI message generation uses Groq with `GROQ_API_KEYS` env var (comma-separated keys for rotation). Model: `llama-3.1-8b-instant`. Generates WhatsApp-formatted messages (bold=`*text*`, italic=`_text_`).

## Design System

Neumorphic CSS classes defined in `globals.css`:
- `neu-raised` — Card with soft shadow (use for containers)
- `neu-flat` — Flat neumorphic surface
- `neu-pressed` — Inset shadow (active/toggled states)
- `neu-btn` — Primary soft button
- `neu-btn-gradient` — Purple gradient button (CTAs)
- `neu-btn-danger` — Red danger button
- `neu-input` — Inset input field

Color palette (CSS custom properties + Tailwind theme):
- Primary: `#d0def2` / `#f3f8fe` / `#a7bad3`
- Grays: `#f9fbff` through `#161d34` (100–700)
- Accent gradient: `#667eea → #764ba2`

## Environment Variables

```
DATABASE_URL     — Supabase pooled connection (port 6543, PgBouncer transaction mode)
DIRECT_URL       — Supabase direct connection (port 5432, session mode — for migrations)
JWT_SECRET       — JWT signing secret
GROQ_API_KEYS    — Comma-separated Groq API keys for AI message generation
```

## Supabase Skill

A Supabase Postgres best practices guide is available at `.agents/skills/supabase-postgres-best-practices/` — reference when working with database queries, schemas, RLS, or connection pooling.
