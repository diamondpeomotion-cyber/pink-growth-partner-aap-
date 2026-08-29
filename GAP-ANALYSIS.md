# Gap Analysis — Nexora Growth Partner PWA
**Repo:** `diamondpeomotion-cyber/pink-growth-partner-aap-`
**Branch audited:** `arena/01a04bd7-pink-growth-partner-aap` (@ `38cca1a`)
**Shared Supabase project:** `qwaehqsmodekbgvnaavz` (live docs dated 2026-08-25)
**Audit date:** 2026-08-29

> Verified state before reading: `tsc --noEmit` → **0 errors**, `npm run build` → **success**,
> `eslint .` → **0 errors / 72 warnings** (all unused imports/vars). The app compiles cleanly;
> the gaps below are structural/integration gaps, not build breaks.

---

## 1. Supabase database tables, schema mismatches & unapplied migrations

### 1.1 There are **zero SQL migrations / DDL in this repo**
`find . -name "*.sql"` returns nothing. Every table, RPC, and RLS policy is expected to
already exist in the external `main-website` project. Consequences:
- No versioned, reviewable record of the GP schema → **silent drift** between repos.
- Nothing here can be applied to a fresh DB; onboarding a new project is impossible.
- No `service_role` usage (good — read-only ledger posture is honored), but also no
  documented grants/RLS for the GP write path.

### 1.2 Tables / columns the app reads & writes that are **NOT live-verified** in this repo
`src/lib/gpRepository.ts`, the dashboard, earnings, and payouts screens depend on these,
but the live schema probes (`scripts/live-schema-probe.ts`, `probe-location-schema.ts`)
and `NEXORA-LIVE-VERIFICATION.md` only verified **location tables + salons**:

| Object | Columns assumed by code | Verified live? |
|---|---|---|
| `growth_partner_commissions` | `commission_paise, status('held'/'payable'/'paid'), hold_until, created_at, salon_id, booking_id, growth_partner_id` | **No** — GP ledger is the app's core feature |
| `partner_payouts` | unknown; code *guesses* amount + date columns (see 1.3) | **No** |
| `notifications` | `notification_type, title, message, read_at, created_at, recipient_user_id` | **No** |
| `user_roles` | `role` (code treats it as a view, one row per profile) | **No** |
| `profiles` | `platform_role, full_name, phone, avatar_path, city, created_at, latitude, longitude, location_updated_at` | **No** (location columns are a *fallback* target) |
| `shop_onboarding_applications` insert/update by GP | `submitted_by_partner_id, existing_salon_id, status, current_step, owner_email, owner_phone, shop_name, city, locality, full_address, opening_time, closing_time, about_shop, website_template` | Existence/columns probed (Phase 2), **authenticated write + RLS UNVERIFIED** |

`PHASE4-REPORT.md` §7.1 is explicit: *"Live-DB verification still UNVERIFIED … an
authenticated round-trip of save/reload/submit/isolation is the only unproven path."*

### 1.3 `partner_payouts` column-guessing (schema mismatch risk)
`fetchMyPayouts` (`src/lib/gpRepository.ts`) uses `select('*')` and then guesses the amount
as `amount_paise ?? total_paise ?? amount` and the paid date as `paid_at ?? settled_at`.
If the real column is any other name, **every payout silently renders as ₹0**. This is a
symptom of an undocumented schema, not a defensible mapping.

### 1.4 `salon_setup_proposals.payload` column is environment-dependent
`websiteOnboardingRepository.ts` probes **5 candidate column names**
(`payload, proposal_payload, setup_payload, data, content`) to find the JSON payload, and
`live-schema-probe.ts` tries the same. A versioned migration would remove this fragility.

### 1.5 Legacy / fallback targets with possible missing columns
- `user_locations` — **live-verified** to lack `accuracy_m` (canonical shape mismatch), so
  the sync layer intentionally skips it.
- `profiles.latitude / longitude / location_updated_at` (final fallback in
  `locationSyncRepository.ts`) — **not verified**; if absent, the fallback chain silently no-ops.
- Dead hook tables `professionals`, `categories`, `services` (see §3.5) are referenced by
  `catalogData.ts` but are **never queried** anywhere; if they were wired they would
  likely `PGRST205`.

### 1.6 Duplicate-application row risk (data integrity)
`submitShopApplication` writes `existing_salon_id = input.existingSalonId || null` for
brand-new shops. `ensureApplication` (in the onboarding repo) then keys de-duplication on
`existing_salon_id`, so a brand-new shop can produce a **second `shop_onboarding_applications`
row**. Documented in `PHASE4-REPORT.md` §7.3 as "not addressed here."

---

## 2. Missing API routes, broken integrations & unhandled egress

### 2.1 Declared server-side Gemini capability is unfulfilled (CRITICAL)
- `metadata.json` declares `MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API`.
- `.env.example` documents `GEMINI_API_KEY`, and `@google/genai` + `express` are dependencies.
- **But there is no server**: `vercel.json` contains only `rewrites` → `index.html`; no
  `/api` serverless functions exist; `express` and `@google/genai` are imported **nowhere**.
- `src/website-onboarding/lib/aiAssist.ts` calls `POST /api/generate-bio` and
  `POST /api/improve-text`. In production the SPA rewrite returns `index.html` (non-JSON),
  which the code detects and **silently falls back to a rule-based template**. Net effect:
  the "AI" feature is a local template generator, not the advertised Gemini integration.

### 2.2 No committed environment → app is non-functional out-of-the-box (CRITICAL)
- Only `.env.example` exists; no `.env.local`, no anon key committed (correct security-wise).
- `src/lib/supabase.ts` → `validateSupabaseConfig()` fails without `VITE_SUPABASE_URL` +
  `VITE_SUPABASE_ANON_KEY`, and `App.tsx` renders the **"Configuration required"** screen.
- **Action:** ops must inject the two VITE vars at build/deploy (Vercel env or AI Studio
  secrets); otherwise the portal is a dead screen.

### 2.3 Sandbox egress is blocked to Supabase (verification only)
`NEXORA-LIVE-VERIFICATION.md` §3: this sandbox's Node runtime has **no direct egress to
`*.supabase.co`** (TLS reset for Node fetches). All `scripts/*probe*.ts` / `verify-*.ts`
live checks fail in-sandbox; the docs were captured via the platform page-fetcher. This
limits the *ability to verify*, not the browser app (a user's browser does have egress),
but it means the critical unverified GP write path cannot be proven here.

### 2.4 Other unhandled third-party egress
Runtime code references these origins; in a locked-down sandbox/firewalled browser they
will fail silently (broken images/embeds, dead links):
`fonts.googleapis.com` / `fonts.gstatic.com`, `images.unsplash.com`,
`lh3.googleusercontent.com/aida-public`, `www.youtube.com/embed`, `instagram.com/reels/embed`,
`api.whatsapp.com`, external maps/booking links (`AddShop.tsx`). None have error UI.
`Permissions-Policy` allows only `camera` + `geolocation`.

### 2.5 Service worker intercepts `/api/*` that don't exist
`public/sw.js` applies a stale-while-revalidate strategy to `/api/` paths, but no `/api`
route exists (§2.1). Harmless today, misleading for future serverless work.

### 2.6 Dead server dependencies
`express` and `@google/genai` are installed but unused; `package.json` `clean` removes a
`server.js` that doesn't exist. Sign of a removed backend the port never replaced.

---

## 3. Incomplete UI components, missing RLS/authz, broken state handlers

### 3.1 Support / Tickets are fully mock — not persisted (HIGH)
- `SupportScreen.tsx` / `NewTicketScreen.tsx`: on submit → toast
  *"Support tickets are not stored on the server from this screen yet. Email Nexora ops
  instead."*
- Success screen hardcodes a **fake ticket id `SUP-1035`**.
- `TicketDetailsScreen.tsx` falls back to a fake `TK-882` by default; `App.tsx` passes
  `selectedTicketId || 'TK-882'`.
- No `tickets`/`support_tickets` table or RPC is referenced anywhere.

### 3.2 QR scanning is not wired (HIGH)
- `ScanQRScreen.tsx`: *"Camera QR decoding is not enabled in this build."* Manual text lookup
  only. Yet `metadata.json` requests `requestFramePermissions: ["camera"]` and the UI shows a
  camera placeholder — the permission is requested but never used. Dashboard "Activate QR"
  actions hardcode count `0 Shops`.

### 3.3 Rewards program fabricates qualifying state (HIGH)
`RewardsScreen.tsx` hardcodes `activeScansCount: 0` and exposes a claim/"Instant Qualify"
modal where a user can type a scan count and mark a shop qualified on **made-up** numbers.
Progress bars/milestones derive purely from this hand-entered count, not from real
QR/booking scan data. This is a fake state handler that can misreport commission
eligibility to the user.

### 3.4 RLS / authorization for the GP role is unverified (CRITICAL)
- **No RLS/GRANT SQL exists in this repo** (§1.1); the app depends entirely on the external
  project's policies.
- Client-side role gating (`checkGrowthPartnerAccess` in `gpRepository.ts`) reads
  `user_roles` then `profiles.platform_role` — the *client* is strict, but the server-side
  enforcement of `growth_partner_commissions`, `shop_attributions`,
  `shop_onboarding_applications`, `salon_setup_proposals`, `partner_payouts`,
  `notifications`, and the `save_growth_partner_salon_setup` RPC is the actual security
  boundary and it is **never proven in this repo**.
- Anonymous reads of `salons` were revoked live (Phase-7 hardening) — expected, but confirms
  grants/RLS are changing out-of-band from this codebase.

### 3.5 Dead / unused code (MEDIUM)
- `src/hooks/catalog.ts`, `catalogData.ts`, `useSalons.ts`, `useServices.ts`,
  `useCategories.ts`, `useProfessionals.ts` — **never imported** by any component. They also
  carry `MOCK_*` demo data (Unsplash images, ratings) that would surface as fake data if ever
  wired.
- `src/components/Hero.tsx`, `Footer.tsx`, `Header.tsx`, `MapPreview.tsx`, `LoginForm.tsx`,
  `InstallAppModal.tsx`, `useSwipe`, `geo.ts`, `clipboard.ts` — audit whether they are
  actually reachable; several appear vestigial.

### 3.6 Lint hygiene (MEDIUM)
`eslint .` → **72 warnings**, all unused imports/vars (e.g. `AlertCircle`, `Eye`,
`RefreshCw`, `mode/setMode` in onboarding screens, plus `Instagram/Facebook/Youtube` in
`TemplateRenderer.tsx`).

### 3.7 Broken/weak state handlers (MEDIUM)
- `submitShopApplication` duplicate-row risk (§1.6).
- `isOnline / isSyncing` is cosmetic: it flips `isSyncing` false after a hardcoded 2s or on
  a `SYNC_COMPLETE` BroadcastChannel message that nothing emits.
- Offline banner + `nexora_last_sync_timestamp` cache writes are best-effort with no
  reconciliation of unsynced rows.

---

## 4. Priority matrix & immediate action items

### CRITICAL — blocks correctness, security, or the "it works" claim

| # | Finding | Immediate action |
|---|---|---|
| C1 | App cannot boot without `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` (`App.tsx` renders "Configuration required"). | Inject both VITE vars into the hosting env / AI Studio secrets; confirm the anon role/`ref=qwaehqsmodekbgvnaavz` contract before release. |
| C2 | GP write path (onboarding save/submit, application insert/update) is **never live-verified**; RLS/grants unknown (`PHASE4-REPORT.md` §7.1). | Run `npx tsx scripts/live-onboarding-e2e.ts` (+ `--submit`) against a real GP session on a machine with egress; record results. This is the highest-risk unknown. |
| C3 | Declared server-side Gemini capability has **no backend**: `/api/generate-bio` & `/api/improve-text` return the SPA; `GEMINI_API_KEY` unused. | Either deploy Vercel serverless `/api` functions that proxy Gemini server-side, or remove the capability claim from `metadata.json` and the `GEMINI_API_KEY`/`@google/genai`/`express` cruft. |
| C4 | RLS for the GP role is not defined or verified anywhere in this repo; client-side gating is not a security boundary. | Add a versioned migration in this repo granting GP-scoped `SELECT` on ledger/payout/notification tables + `INSERT/UPDATE` on `shop_onboarding_applications` and `EXECUTE` on `save_growth_partner_salon_setup`, scoped by `auth.uid()`; verify each. |

### HIGH — real functional or data-integrity gaps

| # | Finding | Immediate action |
|---|---|---|
| H1 | `partner_payouts` amount/date columns are guessed (`amount_paise ?? total_paise ?? amount`) → payouts can silently show ₹0. | Discover the true columns (or add a migration), then type `fetchMyPayouts` against the real schema and surface a clear "unavailable" instead of ₹0. |
| H2 | Support/tickets are mock-only with a fake ticket id `SUP-1035`/`TK-882`. | Create a `support_tickets` table + RPC (`create_my_ticket`, `list_my_tickets`) with GP RLS, and wire `NewTicketScreen`/`SupportScreen`/`TicketDetailsScreen` to it; remove fake ids. |
| H3 | QR scanning is not wired despite requesting camera permission. | Either integrate a decoder (e.g. `html5-qrcode`/`zxing`-style) into `ScanQRScreen`, or remove the camera permission request and the dead camera placeholder. |
| H4 | Rewards screen fabricates qualifying state (`activeScansCount: 0` + manual "Instant Qualify"). | Back rewards with real scan/booking counts from the DB; disable manual qualify; show "no data yet" instead of editable fake counts. |
| H5 | Anonymous `salons` read revoked + grants/RLS drift out-of-band. | Freeze the schema contract: move all GP grants/RLS/policies into a migration file in this repo so they version with the app. |

### MEDIUM — hygiene, fragility, deferred work

| # | Finding | Immediate action |
|---|---|---|
| M1 | Duplicate `shop_onboarding_applications` row risk when `existing_salon_id` is null (`gpRepository.ts`). | Add a unique index / application-scoped key, and de-dup by `(submitted_by_partner_id, shop_name, status IN draft/submitted)` in one place. |
| M2 | `salon_setup_proposals.payload` resolved by probing 5 column names. | Migrate to one canonical `payload jsonb` column; drop the candidate search. |
| M3 | Dead catalog hooks + `MOCK_*` demo data (`professionals`/`categories`/`services` tables). | Delete `catalog.ts`, `catalogData.ts`, `use{Salons,Services,Categories,Professionals}.ts` or wire them to real tables. |
| M4 | 72 ESLint warnings (unused imports/vars). | Run `eslint --fix`; remove dead imports in onboarding screens. |
| M5 | Legacy location fallbacks reference possibly-missing `profiles.latitude/longitude/location_updated_at` and `user_locations.accuracy_m`. | Verify or remove fallback targets; keep only the canonical `user_private_locations` path. |
| M6 | No migrations in repo + unused `express`/`@google/genai` deps. | Introduce `supabase/migrations/` for all GP DDL/RLS; prune unused deps. |
| M7 | External-asset egress (fonts, Unsplash, aida images, embeds, WhatsApp) has no failure UI. | Lazy-load with fallbacks; confirm CSP/Permissions-Policy allows what the UI claims to show. |

---

## Summary
The app is **architecturally sound and builds cleanly** (PKCE auth, single shared client,
no service_role, strict client-side role gating, read-only ledger posture, Phase-4 cleanup
of fabricated financial figures). The gaps are concentrated in **unproven server-side
contracts**: the GP write path and RLS are the single biggest risk (C2/C4), the declared
Gemini/API capability has no backend (C3), and several flagship screens (Support/tickets,
QR scan, Rewards) are still mock/fake (H2–H4). Highest-leverage next steps: verify the
authenticated onboarding round-trip against the live project, then add a versioned migration
in this repo that codifies the GP schema, RLS, and RPC contracts.
