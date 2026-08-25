# scripts/ — dev-only tooling (never shipped)

Nothing in this folder is part of the application bundle: it lives outside
`src/`, no application file imports it, and `npm run build` (root
`vite.config.ts`, entry `index.html`) never sees it.

Dev dependencies used here (`jsdom`, `ws`) are declared in the root
`package.json` as `devDependencies` and never affect the shipped bundle.

## `verify-nexora-auth.ts` — Nexora auth architecture verification

Offline assertions (no credentials required):

- the locked auth config is EXACTLY the Nexora contract — storageKey
  `nexora.auth.qwaehqsmodekbgvnaavz`, `persistSession`, `autoRefreshToken`,
  `detectSessionInUrl`, `flowType: 'pkce'`;
- `validateSupabaseConfig()` pins the project to `qwaehqsmodekbgvnaavz`,
  rejects http/other projects/service-role/`sb_secret_` keys;
- `src/lib/supabaseClient.ts` re-exports the SAME client as
  `src/lib/supabase.ts` (no second auth system);
- the `/auth/login` redirect helpers are idempotent and loop-free;
- legacy-session storage migration is one-way and safe;
- `clearProtectedState()` wipes the full protected `nexora_*` cache inventory.

With the real `.env.local` it extends to live checks against the shared
project: real-key acceptance, PKCE OAuth initiation (code verifier persisted
under the Nexora storage key), and — with `GP_TEST_EMAIL`/`GP_TEST_PASSWORD`
in the environment — sign-in → persistent-session recovery across a second
client (simulated reload) → sign-out clearing the shared slot.

```bash
npx tsx scripts/verify-nexora-auth.ts                 # offline + live when env present
npx tsx scripts/verify-nexora-auth.ts --require-live  # exit 1 unless real key + credentials pass live checks
```

## `verify-location-sync.ts` — location sync lifecycle verification

Renders `src/hooks/useLocationSync.ts` in jsdom against an in-memory fake of
supabase-js and a stubbed `navigator.geolocation`. Asserts the watcher runs
only for authenticated sessions, is deduplicated to a single instance (even
under StrictMode), saves accepted fixes through the canonical RPC
`save_my_private_location` (payload carries **no** target user id — identity
from `auth.uid()`), falls back to the RLS-gated table upsert when the RPC is
absent, restores the user's saved row on session start without re-writing it,
and stops the watcher on SIGNED_OUT and unmount. No network.

```bash
npx tsx scripts/verify-location-sync.ts
```

## `probe-location-schema.ts` — live location-schema probe

Read-only probes against the real project using the anon key: canonical
`user_private_locations` table + all ten columns, anonymous-write denial,
`save_my_private_location` / `clear_my_private_location` existence and
posture, and the legacy `user_locations` / `salons` shapes. With
`--write` and GP test credentials it additionally performs an authenticated
save → read-back → restore round-trip through the user JWT + RLS.

```bash
npx tsx scripts/probe-location-schema.ts            # read-only
npx tsx scripts/probe-location-schema.ts --strict   # exit 1 on any failure
GP_TEST_EMAIL=… GP_TEST_PASSWORD=… \
  npx tsx scripts/probe-location-schema.ts --write  # authenticated round-trip
```

Live evidence captured on 2026-08-25 is recorded in
`NEXORA-LIVE-VERIFICATION.md` (the dev sandbox has no direct egress to
`*.supabase.co`; the scripts run the same probes on any machine/CI with
egress).

## `verify-supabase-env.ts`

Verifies the Supabase environment configuration end to end **without ever
printing a key**: loads `.env` / `.env.local` exactly the way Vite does, runs
the values through the app's own `validateSupabaseConfig()`, confirms the
project ref is the existing shared `qwaehqsmodekbgvnaavz` project, refuses
service-role/secret keys, initialises `createClient()` with the same options
as `src/lib/supabaseClient.ts`, and performs a read-only live handshake
(`/auth/v1/health`, `/rest/v1/`, `auth.getSession()`, one RLS-protected
select).

```bash
npx tsx scripts/verify-supabase-env.ts             # includes the live handshake
npx tsx scripts/verify-supabase-env.ts --offline   # config checks only
```

## `onboarding-smoke-test.tsx`

Renders the ported Website Onboarding wizard in jsdom and walks all 15 steps,
failing on any exception, empty render, or loss of the locked shop context.
Also asserts that shop-selecting URL parameters are stripped.

```bash
npx tsx scripts/onboarding-smoke-test.tsx
```

## `onboarding-data-test.ts`

Contract test for `src/lib/shopContext.ts` and
`src/website-onboarding/lib/websiteOnboardingRepository.ts` against an
in-memory fake of supabase-js. Verifies the shop allow-list, the legacy
proposal-payload compatibility, that saves hit the existing
`shop_onboarding_applications` table and `save_growth_partner_salon_setup`
RPC, that no service-role path exists, and that the local draft cache is
scoped per shop.

```bash
npx tsx scripts/onboarding-data-test.ts
```

## `preview/`

Visual harness that mounts the wizard with a mock shop and a stubbed
persistence layer, for reviewing the UI without Supabase credentials. It
contains **no authentication bypass** — the real route (`website-onboarding`)
still requires a signed-in Growth Partner session.

```bash
npx vite --config scripts/preview/vite.config.ts   # http://localhost:5180
```
