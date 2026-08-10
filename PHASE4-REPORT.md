# Phase 4 — Production UI & Website Onboarding Cleanup

**Scope:** Clean up the NEW Website Onboarding module so no invented financial figures,
fake success states, fake URLs, or unbacked "publicly published" claims are ever presented
as real Growth Partner earnings/status. All prior work (Phases 1–3) preserved; the shared
Growth Partner app is untouched.

**Lock honored:** No real credentials, no live/production writes, no `--write` E2E, no
migration/table/RPC/RLS/Auth changes, no Commission/Referral calc changes, no refactor of
shared modules. Work confined to `src/website-onboarding/` and its route entry.

---

## 1. Files changed (Phase 4)

Inside the module only:

- `src/website-onboarding/types.ts` — added `createBlankSalonData({name, city, area})`.
- `src/website-onboarding/components/StaffManagementModule.tsx`
- `src/website-onboarding/components/PreviewPane.tsx`
- `src/website-onboarding/screens/StepSocials.tsx`
- `src/website-onboarding/screens/StepFullWebsitePreview.tsx`
- `src/website-onboarding/screens/StepPublishSuccess.tsx`
- `src/website-onboarding/screens/StepPublish.tsx`
- `src/website-onboarding/screens/StepPublishSetup.tsx` (copy reinforced)
- `src/website-onboarding/screens/StepAIContentReview.tsx`
- `src/website-onboarding/screens/StepDetails.tsx`
- `src/website-onboarding/screens/HeroSplit.tsx`
- `src/website-onboarding/lib/websiteOnboardingRepository.ts`
- `src/components/dashboard/WebsiteOnboardingScreen.tsx` (route entry, uses `createBlankSalonData`)

(Phases 1–3 files preserved; no deletions of prior work.)

## 2. Fake / invented UI removed

- **StaffManagementModule:** removed fake payroll summary (₹1,42,500.00 / ₹25,650.00 / 17.6%)
  → replaced with a "Commission Rates" heading + amber note "No revenue or payout figures are
  shown here…"; removed "Est. Revenue"/"Earned Payout" columns, the "Process Payout" button, and
  `mockRev`/`mockPayout`; rating no longer invents 4.9/5.0 — shows `No reviews yet` when absent.
- **PreviewPane:** removed invented deposit amounts (₹500 / ₹125 / ₹375). Now derives
  `depositExample` from the shop's **own** first priced service (featured or first `price > 0`),
  or renders nothing — no fabricated figures.
- **StepSocials:** removed invented `likesCount` on the 4 stock video thumbnails and the
  `Math.random()` like generator; now requires a *real* video URL; "Connect/Connected" buttons
  replaced with passive "Added"/"Not added" indicators.
- **Demo persona removed from the real flow:** `createBlankSalonData()` now seeds blank
  structural defaults from the **real** shop identity (`name`, `city`, `area`) — no "Royal Hair &
  Beauty Studio", no sample prices/photos/socials. `WebsiteOnboardingScreen` and the repository
  merge bases use it (services default to `[]`).
- **StepFullWebsitePreview:** hardcoded `royalhairstudio.nexora.site` →
  `{data.websiteSlug ? \`nexora.site/${data.websiteSlug}\` : 'Preview — not published yet'}`.
- **StepPublishSuccess:** default slug `'royal-hair-studio'` → `'your-website'`; QR URL uses the
  display URL; caption "view your live website instantly" → "Points to the reserved address. It
  opens the website once the Shop Owner publishes it."
- **StepPublish / StepPublishSetup:** "You're 5 minutes away from being live." → "The website
  goes live only after the Shop Owner approves and publishes it."; "proceed with publishing /
  Publishing… / Publish Website" → "before submitting for approval / Submitting… / Submit for
  Approval".
- **StepAIContentReview:** "SEO Perfect" → "Good length" (length heuristic is not an SEO verdict).

## 3. Publish / approval lifecycle result

Lifecycle is now accurate end-to-end: **GP submits → Owner reviews → Owner publishes → live.**
- `publishState` is `'submitted'` (set in Phase 3), never claimed `published`.
- Success screen copy: "Sent for Owner Approval", "Awaiting owner review", and a static ledger
  note spelling out `proposal 'submitted' → Shop Owner reviews & publishes → bookings`.
- The GP onboarding never claims "publicly published" before owner approval.
- Data-layer test confirms the submit flag `p_submit = true`, no silent fakes, and that writing
  to a **non-attributed** salon is refused *before* it reaches the network.

## 4. Mobile / PWA fixes (obvious issues inside the module)

- `StepDetails`: `p-12 lg:p-16` → `p-5 md:p-12 lg:p-16`.
- `StepPublish`: `p-8 … pb-28` → `p-5 md:p-8 … pb-28`.
- `HeroSplit`: `w-[700px] h-[500px]` → `w-full max-w-[700px] h-[360px] md:h-[500px]`; page
  `px-8 py-16 … gap-12` → `px-5 py-8 md:px-8 md:py-16 … gap-8 md:gap-12`.
- Verified all remaining fixed widths are `max-w-[Npx]`-constrained
  (HeroSplit `max-w-[1280px]`, CustomerBookingPreview / PreviewPane / TemplateRenderer /
  StepPublish), so they shrink on mobile with no horizontal overflow.

## 5. Supabase / database / RPC / RLS / Auth — untouched ✓

- `git diff HEAD` is **empty** for `src/lib/supabaseClient.ts`, `src/lib/gpRepository.ts`, and
  `src/lib/shopContext.ts` (shopContext is an untracked Phase 1 addition, not modified this phase).
- No migration / `.sql` / RPC / RLS / Auth files added or changed.
- `.env` is git-ignored; no service-role key present; client still strictly read-only on
  `growth_partner_commissions`, `shop_attributions`, etc. Commission/Referral calculations
  unchanged. Same project `qwaehqsmodekbgvnaavz` reused; no new project/DB/tables/RPC.

## 6. Build / test result

- `tsc --noEmit`: **0 errors**.
- `npm run build`: **success**; `WebsiteOnboardingScreen` chunk = **350.10 kB** (71.52 kB gzip).
- `scripts/onboarding-data-test.ts`: **passed** — all assertions incl. "no service-role usage
  anywhere in the save path" and "writing to a NON-attributed salon is refused before it reaches
  the network".
- `scripts/onboarding-smoke-test.tsx`: **passed** — **15/15** steps rendered, **0 persist calls**.
- ESLint: module + route entry = **0 errors**; the pre-existing baseline (6 errors + 76 warnings)
  remains only in `App.tsx`, `AddShop.tsx`, `ResetPasswordScreen.tsx`, `useAccurateLocation.ts`
  — none in the Website Onboarding module.

## 7. Remaining issues

1. **Live-DB verification still UNVERIFIED** — no credentials were used (barred by the SCOPE
   LOCK, no `--write`/live writes). Schema, RPC names, and the `payload` column were all
   confirmed matching expectations in Phase 2 via read-only schema-cache probing without a
   session; an authenticated round-trip of save/reload/submit/isolation is the only unproven path.
2. **`initialData` demo persona still exists in `types.ts`** as the structural spread base inside
   `createBlankSalonData` (overridden by empty values) and is still imported by the dev-only test
   harnesses (`scripts/onboarding-smoke-test.tsx`, `scripts/onboarding-data-test.ts`). It is **not**
   seeded into the real GP flow. Acceptable for render/data tests, but flag if those harnesses are
   ever wired to a real session.
3. **Pre-existing data-only risk (outside Phase 4 scope):** `submitShopApplication()` writes
   `existing_salon_id = input.existingSalonId || null` for brand-new shops, which can cause
   `ensureApplication()` to insert a 2nd application row. Data-only, not schema — not addressed here.
4. ESLint baseline (6 errors + 76 warnings) in shared files is pre-existing and not introduced by
   this module.

---
**Phase 4 complete. No further changes made. STOP.**
