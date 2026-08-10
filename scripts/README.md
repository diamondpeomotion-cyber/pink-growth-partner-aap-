# scripts/ — dev-only tooling (never shipped)

Nothing in this folder is part of the application bundle: it lives outside
`src/`, no application file imports it, and `npm run build` (root
`vite.config.ts`, entry `index.html`) never sees it.

Requires one extra dev dependency, installed without touching `package.json`:

```bash
npm install --no-save jsdom
```

## `verify-supabase-env.ts`

Verifies the Supabase environment configuration end to end **without ever
printing a key**: loads `.env` / `.env.local` exactly the way Vite does, runs
the values through the app's own `validateSupabaseConfig()`, confirms the
project ref is the existing shared `qwaehqsmodekbgvnaavz` project, refuses
service-role/secret keys, initialises `createClient()` with the same options
as `src/lib/supabaseClient.ts`, and performs a read-only live handshake
(`/auth/v1/health`, `/rest/v1/`, `auth.getSession()`, one RLS-protected
select). No dependency beyond what is already installed.

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
