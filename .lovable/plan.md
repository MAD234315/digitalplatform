# Multi-Admin Management System

An enterprise-grade admin system on top of the existing Lovable Cloud auth, with a single Super Admin, request/approval flow, role & permission management, and full audit trail.

## 1. Data model (new migration)

New enum + tables in `public`:

- `app_role` — extend with `'super_admin'`, `'editor'`, `'viewer'` (keep existing `'admin'`).
- `admin_profiles`
  - `user_id uuid PK → auth.users(id) on delete cascade`
  - `full_name`, `email`, `mobile`, `status` (`pending | active | suspended | rejected`), `last_login_at`, `created_at`, `updated_at`, `suspended_at`, `suspended_reason`
- `admin_requests`
  - `id`, `user_id` (nullable — user is created on approval), `full_name`, `email`, `mobile`, `reason`, `device_info`, `status` (`pending | approved | rejected`), `reviewed_by`, `reviewed_at`, `rejection_reason`, `password_hash` (temporary, cleared on approval), `created_at`
- `role_permissions`
  - `role app_role`, `permission text` (e.g. `proofs.manage`, `settings.manage`, `status.manage`, `products.manage`, `users.manage`, `admins.manage`), PK `(role, permission)`
- `admin_audit_log`
  - `id`, `actor_user_id`, `action` (`admin.approved`, `admin.rejected`, `admin.suspended`, `admin.reactivated`, `admin.deleted`, `admin.role_changed`, `admin.password_reset`, `login.success`, `login.failed`, `permission.changed`), `target_user_id`, `metadata jsonb`, `ip`, `user_agent`, `created_at`
- `login_attempts`
  - `id`, `email`, `success`, `ip`, `user_agent`, `created_at` — used for failed-login lockout (5 fails in 15m → temporary block, surfaced on `/admin/login`).

All tables get GRANTs, RLS on, and policies. Add two SECURITY DEFINER helpers:
- `is_super_admin(uid)` — checks `user_roles` for `super_admin`.
- `has_permission(uid, perm)` — joins `user_roles` → `role_permissions`.

Seed default permissions for `super_admin` (all), `admin` (proofs/settings/status/products), `editor` (proofs), `viewer` (read-only flags surfaced in UI).

Bootstrap: keep existing `claim_admin()` behavior, but a new `claim_super_admin()` grants `super_admin` when no super admin exists yet (one-time).

## 2. Server functions (`src/lib/admins.functions.ts`)

All protected via `requireSupabaseAuth` + role/permission checks using `context.supabase`:

- `submitAdminRequest` — public server fn. Validates with Zod, creates `auth.users` (email+password via `supabaseAdmin`, `email_confirm: true`), inserts `admin_profiles` row (`status='pending'`), inserts `admin_requests` row, writes `admin_notifications` for super admins.
- `listAdminRequests` — super admin only, paginated + search.
- `approveAdminRequest(id, role, permissions?)` — super admin only. Sets profile status `active`, inserts `user_roles`, marks request `approved`, audit log, notification.
- `rejectAdminRequest(id, reason)` — super admin only. Deletes the pending auth user (via `supabaseAdmin.auth.admin.deleteUser`), marks request `rejected`, audit log.
- `listAdmins` — with `users.manage` permission; returns joined profile + roles + last login.
- `updateAdmin(userId, patch)` / `suspendAdmin` / `reactivateAdmin` / `deleteAdmin` (super admin only) / `resetAdminPassword` (generates one-time password via admin API, returns to super admin to share).
- `updateRolePermissions(role, permissions[])` — super admin only.
- `getAuditLog` — paginated, super admin only.
- `recordLoginOutcome(email, success)` — called by login page; enforces 5-fail / 15-min lockout server-side.

Super Admin can never be suspended, deleted, or demoted — enforced in every mutation.

## 3. Client integration

- `src/hooks/use-permissions.ts` — reads current user's roles + permission set once, exposes `hasPermission(perm)` and `isSuperAdmin`. Consumed by admin layout to hide nav items and by pages to gate actions.
- Session timeout: activity listener in `_authenticated` layout — 30 min idle → `supabase.auth.signOut()` + redirect to `/admin/login` with a toast.
- Login page: on submit, call server fn to check lockout first; record success/failure; on success update `last_login_at`.

## 4. Routes

Public:
- `/admin/request` — "Request Admin Access" form (Full Name, Email, Mobile, Password, Confirm Password, Reason). Zod validation, strong password rule, submits `submitAdminRequest`. Success screen: "Pending approval".

Protected under `_authenticated/admin/`:
- `admin.requests.tsx` — super admin. Table on desktop, cards on mobile. Approve modal (choose role + permissions), Reject modal (reason), View details drawer.
- `admin.admins.tsx` — `users.manage`. List, edit, suspend, reactivate, reset password, delete (super admin only).
- `admin.roles.tsx` — super admin. Matrix of role × permission checkboxes, save per row.
- `admin.audit.tsx` — super admin. Filterable log with search + date range + pagination (reuses patterns already in `admin.proofs`).
- Existing admin pages get `hasPermission` gates so Editor/Viewer roles only see what they may touch.

Admin sidebar/drawer adds: Requests (with unread badge), Admins, Roles, Audit Log — visible per permission.

## 5. Notifications

Extend `admin_notifications.kind` with `admin_requested`, `admin_approved`, `admin_rejected`, `admin_suspended`, `admin_deleted`. DB trigger on `admin_requests` insert emits `admin_requested`. Server fns write the other kinds directly. Bell already paginated + searchable from previous turn.

## 6. UX & responsive

- Reuse existing black/gold tokens, glassmorphism cards, and the mobile drawer from admin chrome.
- All tables collapse to stacked cards under `md:`. Action buttons ≥ 44px tap targets. Modals use `w-[min(94vw,480px)]`.

## Technical notes

- Passwords never stored in plaintext — created via `supabaseAdmin.auth.admin.createUser({ email, password, email_confirm: true })`; the request row only keeps a bcrypt hash in `password_hash` until approval (needed so the account can be created at approval time without asking the user again), then cleared.
- `supabaseAdmin` only imported inside handlers (`await import('@/integrations/supabase/client.server')`) after role check.
- All list endpoints paginate + accept search to stay scalable.
- Audit log is append-only (no UPDATE/DELETE policy).
- Login lockout uses `login_attempts` count in last 15 min per email + IP.
- No new secrets required — everything runs on existing Lovable Cloud.

## Rollout order

1. Migration (schema + roles + permissions + helpers + trigger + seed).
2. Server functions + shared Zod schemas.
3. `use-permissions` hook + session timeout in `_authenticated` layout.
4. `/admin/request` public page.
5. Admin routes: requests → admins → roles → audit.
6. Wire nav + notification kinds + permission gates on existing admin pages.
7. Mobile QA pass at 360/390/768/1280.
