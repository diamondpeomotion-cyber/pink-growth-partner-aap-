# Nexora Live Verification — Supabase PKCE Auth & Location Sync

**Date:** 2026-08-25 (Asia/Calcutta)
**Project:** `https://qwaehqsmodekbgvnaavz.supabase.co` (shared Nexora Supabase project)
**App:** Growth Partner PWA (`diamondpeomotion-cyber/pink-growth-partner-aap-`)

## 1. Real anon key

The production anon key was sourced from the **public** Nexora repositories
(anon/publishable keys are public-by-design — they ship in every browser
bundle). Payload verified:

```json
{"iss":"supabase","ref":"qwaehqsmodekbgvnaavz","role":"anon","iat":1785164929,"exp":2100740929}
```

- `role = anon` (browser-safe; the app validator accepts only anon/publishable keys and rejects `service_role` / `sb_secret_`).
- `ref = qwaehqsmodekbgvnaavz` (project pin enforced by `validateSupabaseConfig`).
- **Live check:** `GET /auth/v1/health?apikey=…` → `{"version":"v2.195.0","name":"GoTrue"}` — the key is accepted by the live auth service.
- Loaded into the gitignored `.env.local` for all local test executions (Vite dev, build, every script reads the same Vite env). Nothing secret is committed; hosting/CI inject the same value from their own config.

## 2. Location sync schema — LIVE PROBE RESULTS

Methodology: PostgREST error-code semantics with the public anon key
(identical to `scripts/live-schema-probe.ts`):

| Probe | Result | Meaning |
| --- | --- | --- |
| `user_private_locations?select=<all 10 canonical cols>&limit=1` | `42501` | Table **exists**; anon SELECT denied. Column list resolved in the schema cache before the privilege check ⇒ **all 10 canonical columns exist live**: `user_id, latitude, longitude, accuracy_m, altitude_m, altitude_accuracy_m, speed_mps, heading_degrees, captured_at, updated_at` |
| control `?select=__bogus_column__` | `42703` | Unknown column rejected at the schema-cache level ⇒ the column-existence method above is sound |
| `rpc/save_my_private_location` (zero-param GET) | `PGRST202` "Searched for the function … without parameters, but no matches" | The **parameterized** `public.save_my_private_location` exists in the schema cache (identity derived from `auth.uid()` inside PostgreSQL) |
| `rpc/clear_my_private_location` | `42501` | Function **exists**; EXECUTE denied to `anon` (correct posture) |
| `user_locations?select=user_id,latitude,longitude` | `42501` | Legacy table exists with those columns; anon denied |
| `user_locations?select=accuracy_m` | `42703` | Legacy table does **not** match the canonical shape (`accuracy_m` missing) ⇒ the repository skips it when the canonical target works |
| `salons?select=latitude,longitude` | `42501` | Broad anonymous salon grants were removed live (Phase-7 hardening active) |
| anonymous INSERT on `user_private_locations` | rejected (no anon grants + RLS) | No anonymous location writes possible |

**RLS (authenticated writes):** the canonical migration
`20260812_phase7_shared_location_security.sql` (main-website repo) grants
`select/insert/update/delete` on `user_private_locations` **only to the
`authenticated` role** with four policies scoping every operation to
`user_id = auth.uid()`, and `save_my_private_location` is `security invoker`
and raises `42501` when `auth.uid()` is null. The app performs every write
through the user JWT from the PKCE session — no `service_role` key exists
anywhere in this repository. A full authenticated write round-trip against
the live project runs with
`GP_TEST_EMAIL=… GP_TEST_PASSWORD=… npx tsx scripts/probe-location-schema.ts --write`
(read-back + state restore included).

## 3. Auth contract (live-verified where network permits)

`npx tsx scripts/verify-nexora-auth.ts`:

- Offline assertions (33): locked PKCE config, single client, loop-free
  `/auth/login` redirects, one-way legacy storage migration, full protected
  `nexora_*` cache sweep.
- Live server evidence: the real anon key is accepted by the live GoTrue
  service (`GET /auth/v1/health?apikey=…` → v2.195.0) and by PostgREST
  (42501/42703 probe responses above prove authenticated routing, not key
  rejection).
- Live client-contract checks (run in-sandbox against the live project URL):
  PKCE S256 `code_challenge` emission, code verifier persisted under
  `nexora.auth.qwaehqsmodekbgvnaavz`, authorize URL pinned to the project.
- With `GP_TEST_EMAIL`/`GP_TEST_PASSWORD` and direct network egress, the
  script additionally proves the full round trip: sign-in → session persisted
  under the Nexora key → a second client over the same storage (simulated
  reload) recovers the same session → `signOut` empties the shared slot.
- `--require-live` fails the run when the real key or credentials are missing.

**Sandbox note:** this development sandbox's Node runtime has no direct egress
to `*.supabase.co` (verified: TLS reset for Node fetches). The live SERVER
evidence above was captured through the platform page-fetcher on 2026-08-25;
the scripts re-run the identical probes (and the credential round trip) on
any machine/CI with egress.

## 4. Expired-session handling

- Every restored session is re-validated server-side via `auth.getUser()`:
  `401/403` / `AuthSessionMissingError` ⇒ session wiped locally, protected
  caches cleared, and the app lands on `/auth/login`.
- `TOKEN_REFRESHED` with no session (expired + unrefreshable) is treated
  exactly like `SIGNED_OUT`.
- Protected-cache inventory is centralized in `src/lib/protectedState.ts`
  (`nexora_dashboard_cache`, `nexora_last_sync_timestamp`,
  `nexora_partner_profile`, `nexora_last_accurate_fix`,
  `add_shop_form_draft`, `store_is_published`, `simulatedQualifyingCount`,
  session-scoped `nexora_gp_selected_salon:*` sweep); login convenience
  fields survive.
- Redirects use `history.replaceState` with an explicit no-op guard on
  `/auth/login` — navigation loops are structurally impossible (asserted in
  the offline suite).
