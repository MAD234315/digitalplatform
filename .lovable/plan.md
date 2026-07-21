# Admin Login UX Improvements

Scope: `src/components/admin/AdminLoginPage.tsx` only. Keep the existing black & gold theme, layout, and auth logic. No changes to server functions, routes, or auth flow.

## Changes

1. **First-time setup banner (prominent)**
   - When `adminExists === false`, replace the small amber note with a large, unmissable card: shield icon, heading "No admin exists yet — create the first one", and a primary "Create first admin account" button that switches to signup mode immediately (one click instead of scrolling to find the small link).

2. **Clearer mode header + icons**
   - Add a small icon per mode (LogIn / UserPlus / KeyRound) next to the title.
   - Rewrite subtitles to be action-oriented: "Sign in to the admin console", "Create the first Super Admin account", "We'll email you a reset link".

3. **Show/hide password toggle**
   - Add an eye icon inside the password field to toggle visibility. Standard accessibility pattern with `aria-label`.

4. **Inline field validation + friendlier errors**
   - Map common Supabase error strings to human copy:
     - "Invalid login credentials" → "Email or password is incorrect."
     - "Email not confirmed" → "Please confirm your email first — check your inbox."
     - Rate-limit errors → "Too many attempts. Please wait a minute and try again."
   - Fall back to the raw message otherwise.

5. **Loading state polish**
   - Replace "Please wait…" with a spinner + contextual label ("Signing in…", "Creating account…", "Sending reset link…").
   - Disable form fields (not just the button) during submit to prevent double-submits.

6. **Success feedback for reset + signup**
   - After signup with email confirmation required, show a success card (green check, "Account created — check your inbox") instead of only swapping the mode + tiny amber message.
   - After reset link sent, show the same success card style with the email address echoed back.

7. **Caps Lock warning on password**
   - Small inline hint under the password field when Caps Lock is detected — prevents the #1 cause of "wrong password" complaints.

8. **Helpful footer links**
   - Add a small footer row: "← Back to site" (links to `/`) and "Need help? Contact support" (mailto). Currently there's no escape hatch if a user lands here by mistake.

9. **Accessibility**
   - Add `aria-live="polite"` region for error/success messages so screen readers announce them.
   - Ensure the submit button has a descriptive `aria-label` matching current mode.
   - Autofocus the email field on mount (and password field after switching modes).

## Out of scope
- No changes to `src/lib/admin.functions.ts`, routing, or the `/admin/setup` page.
- No visual theme changes — same amber/gold tokens, same `PageShell`, same card structure.
- No new dependencies.

## Files touched
- `src/components/admin/AdminLoginPage.tsx` (single file)
