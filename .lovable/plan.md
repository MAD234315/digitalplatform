# Recover the Super Admin Setup Token

## Situation

The `/admin/setup` page requires the `ADMIN_BOOTSTRAP_TOKEN` server secret. This secret was generated previously and stored securely on the server. Secret values are write-only — neither the Lovable UI nor I can read back the stored value, so it can't simply be "shown" to you.

## Options

Pick one:

### Option A — Reset the token to a value you choose (recommended)
1. Open the secure secret form for `ADMIN_BOOTSTRAP_TOKEN`.
2. You paste in a new strong random string (e.g. from a password manager, or `openssl rand -hex 32`).
3. Use that same string on the `/admin/setup` page to create the Super Admin.
4. After Super Admin is created, the token stops being needed for day-to-day use.

### Option B — Skip the token gate for first-time bootstrap
1. Temporarily relax `bootstrapSuperAdmin` in `src/lib/admins.functions.ts` so that when zero admins exist, the token check is bypassed (still requires an authenticated user).
2. You complete `/admin/setup` without a token.
3. Immediately re-enable the token check so no one else can claim admin later.

Option A is safer (no code change, no temporary open window). Option B is faster if you want to skip touching secrets.

## What I need from you

- Confirm Option A or Option B.
- If Option A: I'll open the secure form; you paste the new token, then reuse it on `/admin/setup`.
