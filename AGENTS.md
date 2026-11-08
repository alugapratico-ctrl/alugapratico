<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->
## Project rules

- App data lives in the backend database; `StoreProvider` (`src/lib/store.tsx`) loads and writes the signed-in user's rows through the browser client, so row-level security policies (owner = `auth.uid()`) are the real isolation layer, never frontend filters.
- Every user-owned table has a `user_id` column plus select/insert/update/delete RLS policies scoped to `auth.uid()`; cross-table links (rentals, product records) also check the linked rows belong to the same user.
- Table privileges are granted explicitly and narrowly (no `anon` access; `profiles` only allows updating editable columns), because the database's default grants are too broad.
- User files go in the private `user-files` bucket under `<user_id>/...` and are shown through signed URLs, because storage policies grant access by top-level folder.
- Every page route sets its head via the shared `seo()` helper in `src/lib/seo.ts`, so titles and social tags stay consistent.
- Private pages live under `src/routes/_authenticated/` (client-only gate, redirects to `/entrar`) and render inside the shared `AppShell` from that layout; public auth pages use `AuthLayout` and must not add the app shell.
- Login state changes are handled by the single `onAuthStateChange` listener in `__root.tsx`; pages must not add their own auth listeners for routing.
- UI libraries the app imports are listed in `optimizeDeps.include` in `vite.config.ts`; add new ones there so the dev preview never re-optimizes mid-session and loads two React copies.
- Dashboard alerts are computed from live data by the pure `computeAlerts` (`src/lib/alerts.ts`); attention/urgent ones are persisted to `notifications` with a per-user `dedupe_key` so each situation notifies once.
- Client messages (WhatsApp/e-mail) are opened in the user's own app for manual sending and logged to `communications`; nothing is sent automatically.
- Theme mode lives in localStorage and is applied by the `.dark` class (boot script in `__root.tsx`); colors only come from tokens in `src/styles.css`.
- The support WhatsApp number comes only from `VITE_SUPPORT_WHATSAPP`; with no valid number the floating button is hidden.
- Admin access is the `admin` role in `public.user_roles`, checked by `has_role()`; admin data comes only from SECURITY DEFINER functions (`admin_overview`, `admin_set_role`) that refuse non-admins and write to `admin_audit`, so the `/admin` route guard is UI-only.
