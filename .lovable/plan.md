# Create the Super Admin

Your project uses the mirrored admin panel — there is **no `/admin/setup` page and no setup token** here. Roles live in the `user_roles` table and the first admin is claimed via a one-time button on `/admin` itself (backed by the `claim_first_admin` DB function, which only succeeds when zero admins exist).

## Steps

1. Go to **`/auth`** and either sign up or sign in with the email you want to make the Super Admin.
   - If sign-ups are disabled in Cloud → Users → Auth Settings, enable "Allow new users to sign up" temporarily, or invite the user from the Users list.
2. After signing in, go to **`/admin`**.
3. You'll see a card that says *"No admin has been created yet…"* with a **"Claim first admin"** button. Click it.
4. The page reloads showing the full admin dashboard. That account is now the Super Admin.
5. (Optional) Turn sign-ups back off in Cloud auth settings so no one else can register.

## Adding more admins later

From the admin dashboard's **Admins** tab, invite additional users by email — they'll appear in `user_roles` with the `admin` role.

## Notes

- The old `/admin/setup` + `ADMIN_BOOTSTRAP_TOKEN` flow was replaced when we switched to the mirrored admin panel. The `ADMIN_BOOTSTRAP_TOKEN` secret is currently unused; it can stay or be deleted — your call.
- If the "Claim first admin" button errors with *"already claimed"*, an admin row already exists — sign in as that account, or (if you've lost access) I can walk you through resetting it.

## Want me to change anything?

- Delete the unused `ADMIN_BOOTSTRAP_TOKEN` secret?
- Restore a dedicated `/admin/setup` page instead of the inline button?

Otherwise no code changes needed — just follow the 5 steps above.
