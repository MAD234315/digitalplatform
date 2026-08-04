# Fix: Admin panel sign-in loop

## What I checked

- Your admin account (`madmaxhub9@gmail.com`) exists and **does** have the `admin` role in the database, and it signed in successfully at 17:11 UTC today.
- The auth log shows a **logout a few seconds after that successful login** — so the account is fine; the app is throwing you out.
- In the admin page code, the entry check does this: after sign-in it calls a server-side role check, and if that call fails with any message containing "unauthorized / authorization / jwt / session", it **signs you out and sends you back to the login page**. The login page then silently swallows its own role-check failure and leaves you sitting on the login screen with no error.

So one transient/failing server call is enough to eject a legitimate admin, with no visible reason. The exact reason the server call fails is not yet confirmed (no server error was captured in the last hour of logs), so step 1 of the fix is to surface it instead of guessing.

## The fix

1. **Stop the forced sign-out.** The admin page must never call `signOut()` because a role check failed. A valid session stays valid.
2. **Show the real error.** If the role check fails, render an "Access check failed" panel inside the admin shell with the actual message, a **Retry** button, and a **Sign out** button — instead of a silent bounce to `/admin/login`.
3. **Add a browser-side fallback check.** Before deciding anything, verify admin status directly from the browser using the existing `has_role` database function with the signed-in session. If that says admin, let the user in even when the server-function route is unhappy. Only if both checks agree the user is not an admin do we show a clear "This account is not an admin" screen (with sign-out), rather than a redirect loop.
4. **Fix the login page's silent swallow.** When already signed in and the role check errors, show the error and a retry, instead of leaving a blank-looking login form.
5. **Log the failure reason** on the server side of the role check so future failures show up in the server logs.

## Technical notes

- Files touched: `src/routes/admin.index.tsx` (the `useEffect` gate around lines 92-137 and its status rendering), `src/components/admin/AdminLoginPage.tsx` (the bootstrap/role effect), and `src/lib/admin.functions.ts` (`getMyRole` — add error logging, no behaviour change to its auth requirement).
- Fallback check uses `supabase.rpc("has_role", { _user_id, _role: "admin" })` from the browser client; RLS/`SECURITY DEFINER` already allow this for the signed-in user.
- No database migration, no change to who is allowed in — security stays exactly as it is (admin role required for every mutating server function; `assertAdmin` untouched).

## After the change

If the panel still refuses entry, it will now display the precise error text, which pins down whether it is a token-attach problem, a JWT verification problem, or an actual role problem — and I can fix that root cause directly.
