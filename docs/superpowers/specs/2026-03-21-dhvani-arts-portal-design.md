# Student Management Portal — Design Spec

## Overview

A student management portal to manage students, batches, notifications, and resource links. Deployed at d111.vercel.app. One super admin controls everything. Batch admins (promoted students) can view students in their batch only. Public visitors see notifications and grade-based resource links.

## Roles

| Role | How created | Access |
|------|------------|--------|
| **Super Admin** | Seeded in DB (`dhruval@gmail.com`) | Full access to everything |
| **Batch Admin** | Super admin promotes a student via dialog (sets a password for them) | View students in their own batch only |
| **Public** | No login | Home (notifications), grade pages, file redirects |

Students do not log in. Only super admins and batch admins have credentials. Batch admins log in using their Student email + the password the super admin set for them.

## Database Schema (Prisma)

### SuperAdmin

| Column | Type | Notes |
|--------|------|-------|
| id | String (cuid) | PK |
| email | String | Unique |
| password | String | bcrypt hashed |
| name | String | Display name |
| createdAt | DateTime | Auto |

Seeded with: `dhruval@gmail.com` / `Test@123` (hashed), name: "Dhruval".

### Batch

| Column | Type | Notes |
|--------|------|-------|
| id | String (cuid) | PK |
| name | String | e.g., "Student 2022", "Student 2024" |
| createdAt | DateTime | Auto |

### Student

| Column | Type | Notes |
|--------|------|-------|
| id | String (cuid) | PK |
| name | String | Student name |
| email | String | Unique |
| phoneNumbers | String[] | Postgres array, multiple phone numbers |
| batchId | String | FK -> Batch |
| createdAt | DateTime | Auto |
| updatedAt | DateTime | Auto |

Relation: `Student.batchId -> Batch.id`

### AdminRole

| Column | Type | Notes |
|--------|------|-------|
| id | String (cuid) | PK |
| studentId | String | FK -> Student, unique (one admin role per student) |
| password | String | bcrypt hashed. Super admin sets this via a dialog when promoting a student. Can be updated by super admin later. |
| createdAt | DateTime | Auto |

An admin inherits their batch from their linked Student record. They can only access students in that same batch. If the student already has an AdminRole, the make-admin action updates the existing password instead of creating a duplicate.

### Notification

| Column | Type | Notes |
|--------|------|-------|
| id | String (cuid) | PK |
| content | String | Tiptap HTML (supports bold, etc.) |
| link | String? | Optional external URL |
| createdAt | DateTime | Auto |
| updatedAt | DateTime | Auto |

### NavbarLink

| Column | Type | Notes |
|--------|------|-------|
| id | String (cuid) | PK |
| label | String | Display text (e.g., "11th", "12th") |
| href | String | URL path (e.g., "/11th", "/12th"). Unique. |
| isGradePage | Boolean | If true, this link drives a grade page that shows file links tagged with this grade |
| order | Int | Sort order for navbar display |
| createdAt | DateTime | Auto |

Reserved slugs (`/login`, `/manage`, `/students`, `/file`) cannot be used as `href` values. Validated in API.

### FileLink

| Column | Type | Notes |
|--------|------|-------|
| id | String (cuid) | PK |
| title | String | Display title (e.g., "Attendance Sheet") |
| description | String? | Optional description |
| route | String | Unique slug. `/file/[route]` redirects to `url` |
| url | String | External URL (e.g., Google Drive link) |
| grade | String? | Optional grade (e.g., "11th"). If set, appears on that grade's page |
| createdAt | DateTime | Auto |
| updatedAt | DateTime | Auto |

## Authentication

- **Method**: Email + password
- **Token**: JWT signed with `jose`, stored in httpOnly cookie
- **Expiry**: 30 days
- **Login flow**: POST `/api/auth/login` — checks SuperAdmin table first, then AdminRole table (joining Student to get email). Returns JWT with `{ id, role: "super_admin" | "admin", batchId? }`.
- **Middleware**: Next.js middleware reads cookie, verifies JWT. Protected routes under `/manage/*` and `/students/*` require valid JWT with appropriate role.
- **Logout**: DELETE `/api/auth/logout` — clears cookie.
- **Batch admin navigation**: After login, batch admins see a "Students" link in the navbar (alongside public links). They only see `/students` (read-only, filtered to their batch).

## API Routes

All data access goes through API routes. No direct Prisma calls in frontend components.

### Auth
- `POST /api/auth/login` — Login (email + password)
- `DELETE /api/auth/logout` — Logout (clear cookie)
- `GET /api/auth/me` — Current user info

### Batches (super admin only)
- `GET /api/batches` — List all batches
- `POST /api/batches` — Create batch
- `PUT /api/batches/[id]` — Update batch
- `DELETE /api/batches/[id]` — Delete batch

### Students (super admin = all + CRUD, admin = own batch read-only)
- `GET /api/students?batchId=` — List students filtered by batch
- `POST /api/students` — Create student (super admin)
- `PUT /api/students/[id]` — Update student (super admin)
- `DELETE /api/students/[id]` — Delete student (super admin)
- `POST /api/students/[id]/make-admin` — Promote to admin with password (super admin). Upserts: if AdminRole exists, updates password.
- `DELETE /api/students/[id]/remove-admin` — Remove admin role (super admin)

### Notifications
- `GET /api/notifications?from=&to=` — List all (public). Optional date range filter on `createdAt`.
- `POST /api/notifications` — Create (super admin)
- `PUT /api/notifications/[id]` — Update (super admin)
- `DELETE /api/notifications/[id]` — Delete (super admin)

### Navbar Links (super admin only for mutations, public for reads)
- `GET /api/navbar-links` — List all (public, for navbar rendering)
- `POST /api/navbar-links` — Create (super admin). Validates href is not a reserved slug.
- `PUT /api/navbar-links/[id]` — Update (super admin)
- `DELETE /api/navbar-links/[id]` — Delete (super admin)

### File Links (super admin only for mutations, public for reads)
- `GET /api/file-links?grade=` — List (public, filterable by grade)
- `GET /api/file-links/by-route/[route]` — Get by route (for redirect)
- `POST /api/file-links` — Create (super admin)
- `PUT /api/file-links/[id]` — Update (super admin)
- `DELETE /api/file-links/[id]` — Delete (super admin)

## Pages

### Public Pages

**`/` (Home)** — Notifications list. Cards showing Tiptap-rendered HTML content with optional link buttons. Sorted by newest first. Server-rendered with ISR.

**`/login`** — Email + password form. Redirects to `/` on success. Clean, centered card design.

**`/[slug]` (e.g., `/11th`, `/12th`)** — Dynamic page. Looks up slug in NavbarLink table where `isGradePage = true`. If found, displays file links tagged with that grade. If no match, returns 404. Server-rendered with ISR.

**`/file/[route]`** — Server-side **307 temporary redirect** to the external URL. Temporary because the super admin can change the target URL at any time.

### Protected Pages (Super Admin)

All management pages live under `/manage/*` for consistency.

**`/manage/notifications`** — Table listing all notifications with date range filter (native `<input type="date">`). Add/edit forms use Tiptap editor with bold toolbar button. Delete with confirmation dialog.

**`/manage/navbar-links`** — Table of navbar links with add/edit/delete. Fields: label, href, isGradePage, order.

**`/manage/file-links`** — Table of file links with add/edit/delete. Fields: title, description, route, url, grade (optional select populated from grade-type navbar links).

**`/manage/batches`** — Table of batches with add/edit/delete. Simple name field.

**`/manage/students`** — Batch selector dropdown + student list table. Shows name, email, phone numbers (comma-separated), batch, admin status. Actions via dialogs:
- **Edit**: Dialog with name, email, phone numbers (dynamic add/remove), batch selector.
- **Delete**: Confirmation dialog.
- **Make Admin**: Dialog with password input. If already admin, updates password.
- **Remove Admin**: Confirmation dialog.

**`/manage/students/add`** — Form: name, email, phone numbers (dynamic add/remove inputs), batch selector.

### Protected Pages (Batch Admin)

**`/students`** — Read-only student list, auto-filtered to admin's batch. No mutation actions. Shows name, email, phone numbers.

## Data Fetching Strategy

- **Public pages**: Server-rendered with ISR. `revalidatePath()` called from API route handlers on mutations.
- **Admin pages**: Client-side SWR with `mutate()` for instant UI updates after mutations.
- **Navbar**: Fetched server-side in the root layout. Revalidated on navbar link mutations.
- **Note**: Verify `revalidatePath()` behavior against Next.js 16 bundled docs before implementation.

## Design System

### Color Palette (Tailwind CSS custom properties)

```
--clr-primary: #d0def2
--clr-primary-light: #f3f8fe
--clr-primary-dark: #a7bad3
--clr-gray-100: #f9fbff
--clr-gray-150: #f4f6fb
--clr-gray-200: #eef1f6
--clr-gray-300: #e1e5ee
--clr-gray-400: #767b91
--clr-gray-500: #4f546c
--clr-gray-600: #2a324b
--clr-gray-700: #161d34
```

### Neumorphic Style

- Background: `--clr-gray-100` or `--clr-primary-light`
- Cards: White/near-white with dual box-shadows (light top-left, darker bottom-right) for raised neumorphic effect
- Buttons: Soft raised appearance, primary actions use gradient (blue-purple range inspired by reference images)
- Inputs: Inset shadow for pressed/recessed look
- Rounded corners: `rounded-2xl` for cards, `rounded-xl` for inputs/buttons
- Subtle gradients on accent elements
- Clean typography with `--clr-gray-700` for headings, `--clr-gray-500` for body

### Component Patterns

- **Card**: Neumorphic raised container with padding, used for notifications, file links, forms
- **Table**: Clean rows with hover highlight, neumorphic container wrapper
- **Form**: Inset inputs, raised submit button, grouped in neumorphic card
- **Dialog/Modal**: Centered overlay with neumorphic card, used for edit student, make-admin password entry, delete confirmation
- **Navbar**: Fixed top, white background, soft bottom shadow, responsive. Public links from NavbarLink table + conditional admin dropdown.

## Tech Dependencies

| Package | Purpose |
|---------|---------|
| `prisma` + `@prisma/client` | ORM + migrations |
| `jose` | JWT signing/verification (Edge-compatible) |
| `bcryptjs` | Password hashing |
| `swr` | Client-side data fetching |
| `@tiptap/react` + `@tiptap/starter-kit` | Rich text editor (bold included in starter-kit) |

No additional UI libraries. Tailwind CSS v4 handles all styling.

## Seed Data

Initial migration seeds:
- SuperAdmin: `dhruval@gmail.com` / `Test@123` (hashed), name: "Dhruval"

## Security

- Passwords hashed with bcrypt (12 rounds)
- JWT in httpOnly, secure, sameSite=lax cookie
- API routes check JWT and role before mutations
- Batch admins scoped to their batch via `batchId` in JWT payload
- Input validation on all API routes
- Reserved slugs enforced for navbar links
- SQL injection prevented by Prisma parameterized queries
