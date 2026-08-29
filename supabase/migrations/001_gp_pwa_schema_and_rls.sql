-- ===========================================================================
-- Nexora Growth Partner PWA — Growth Partner schema + RLS
-- ===========================================================================
-- Project: qwaehqsmodekbgvnaavz
--
-- This migration codifies, in ONE versioned file, the tables / columns / RPCs
-- the Growth Partner app depends on (see src/lib/gpRepository.ts,
-- src/lib/shopContext.ts, src/website-onboarding/lib/websiteOnboardingRepository.ts).
-- It is written to be IDEMPOTENT (guard on object existence) so it can be
-- applied repeatedly against an existing shared project without error.
--
-- Tables defined: growth_partners, shop_attributions,
-- growth_partner_commissions, partner_payouts, notifications,
-- shop_onboarding_applications, salon_setup_proposals, support_tickets,
-- ticket_messages, user_roles.
--
-- Security model:
--   * `anon` gets nothing on GP tables (deny by default).
--   * `authenticated` gets SELECT on the GP-scoped tables and RLS policies that
--     scope every read/write to `auth.uid()`:
--       - growth_partners.user_id = auth.uid()
--       - shop_attributions.growth_partner_id = the caller's partner id
--         (resolved via growth_partners by auth.uid())
--       - growth_partner_commissions / partner_payouts / notifications /
--         salon_setup_proposals / shop_onboarding_applications / support_tickets:
--         owner-scoped
--       - INSERT/UPDATE on shop_onboarding_applications, salon_setup_proposals,
--         support_tickets + EXECUTE on the save_growth_partner_salon_setup RPC
--         are the authenticated write path.
--   * No service_role / admin key is used anywhere in the app.
--
-- NOTE: this file is the authoritative contract for the GP role. Apply it via
-- `supabase db push` (or the Supabase SQL editor) on the shared project, then
-- run `npx tsx scripts/live-onboarding-e2e.ts --submit` to verify the full
-- authenticated round-trip.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 1. Helper: current Growth Partner id for the calling user
-- ---------------------------------------------------------------------------
create or replace function public.current_growth_partner_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select gp.id
  from public.growth_partners gp
  where gp.user_id = auth.uid()
  limit 1;
$$;

grant execute on function public.current_growth_partner_id() to authenticated;

-- ---------------------------------------------------------------------------
-- 2. growth_partners
-- ---------------------------------------------------------------------------
create table if not exists public.growth_partners (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid unique references auth.users(id) on delete cascade,
  full_name   text,
  name        text,
  email       text,
  phone       text,
  status      text not null default 'active',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.growth_partners enable row level security;

drop policy if exists "growth_partners_select_own" on public.growth_partners;
create policy "growth_partners_select_own"
  on public.growth_partners for select
  to authenticated
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 3. shop_attributions
-- ---------------------------------------------------------------------------
create table if not exists public.shop_attributions (
  id                  uuid primary key default gen_random_uuid(),
  growth_partner_id   uuid not null references public.growth_partners(id) on delete cascade,
  salon_id            uuid not null,
  status              text not null default 'active',
  attribution_method  text,
  effective_from      timestamptz,
  created_at          timestamptz not null default now(),
  -- Live count of qualifying customer QR scans (drives Rewards qualification).
  active_scans        integer not null default 0
);

-- Idempotent column addition for projects where the table pre-dates this
-- migration (create table ... if not exists will not add the column).
alter table public.shop_attributions
  add column if not exists active_scans integer not null default 0;

create index if not exists shop_attributions_partner_idx
  on public.shop_attributions (growth_partner_id);
create index if not exists shop_attributions_salon_idx
  on public.shop_attributions (salon_id);

alter table public.shop_attributions enable row level security;

drop policy if exists "shop_attributions_select_own" on public.shop_attributions;
create policy "shop_attributions_select_own"
  on public.shop_attributions for select
  to authenticated
  using (growth_partner_id = public.current_growth_partner_id());

-- ---------------------------------------------------------------------------
-- 4. growth_partner_commissions (read-only ledger for the app)
-- ---------------------------------------------------------------------------
create table if not exists public.growth_partner_commissions (
  id                  uuid primary key default gen_random_uuid(),
  growth_partner_id   uuid not null references public.growth_partners(id) on delete cascade,
  salon_id            uuid,
  booking_id          uuid,
  commission_paise    bigint not null default 0,
  status              text not null default 'held' check (status in ('held','payable','paid','void','clawed_back')),
  hold_until          timestamptz,
  created_at          timestamptz not null default now()
);

create index if not exists growth_partner_commissions_partner_idx
  on public.growth_partner_commissions (growth_partner_id);
create index if not exists growth_partner_commissions_status_idx
  on public.growth_partner_commissions (status);

alter table public.growth_partner_commissions enable row level security;

drop policy if exists "growth_partner_commissions_select_own" on public.growth_partner_commissions;
create policy "growth_partner_commissions_select_own"
  on public.growth_partner_commissions for select
  to authenticated
  using (growth_partner_id = public.current_growth_partner_id());

-- ---------------------------------------------------------------------------
-- 5. partner_payouts
-- ---------------------------------------------------------------------------
create table if not exists public.partner_payouts (
  id                  uuid primary key default gen_random_uuid(),
  growth_partner_id   uuid not null references public.growth_partners(id) on delete cascade,
  amount_paise        bigint not null default 0,
  status              text not null default 'pending' check (status in ('pending','processing','paid','failed')),
  created_at          timestamptz not null default now(),
  paid_at             timestamptz,
  settled_at          timestamptz
);

create index if not exists partner_payouts_partner_idx
  on public.partner_payouts (growth_partner_id);

alter table public.partner_payouts enable row level security;

drop policy if exists "partner_payouts_select_own" on public.partner_payouts;
create policy "partner_payouts_select_own"
  on public.partner_payouts for select
  to authenticated
  using (growth_partner_id = public.current_growth_partner_id());

-- ---------------------------------------------------------------------------
-- 6. notifications
-- ---------------------------------------------------------------------------
create table if not exists public.notifications (
  id                  uuid primary key default gen_random_uuid(),
  recipient_user_id   uuid not null references auth.users(id) on delete cascade,
  notification_type   text not null default 'general',
  title               text,
  message             text,
  read_at             timestamptz,
  created_at          timestamptz not null default now()
);

create index if not exists notifications_recipient_idx
  on public.notifications (recipient_user_id, created_at desc);

alter table public.notifications enable row level security;

drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own"
  on public.notifications for select
  to authenticated
  using (recipient_user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 7. shop_onboarding_applications (authenticated INSERT/UPDATE/SELECT)
-- ---------------------------------------------------------------------------
create table if not exists public.shop_onboarding_applications (
  id                        uuid primary key default gen_random_uuid(),
  submitted_by_partner_id   uuid not null references public.growth_partners(id) on delete cascade,
  existing_salon_id         uuid,
  status                    text not null default 'draft' check (status in ('draft','submitted','approved','rejected','changes_requested','published')),
  current_step              integer not null default 0,
  owner_email               text,
  owner_phone               text,
  shop_name                 text,
  city                      text,
  locality                  text,
  full_address              text,
  opening_time              text,
  closing_time              text,
  about_shop                text,
  website_template          text,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

create index if not exists shop_onboarding_applications_partner_idx
  on public.shop_onboarding_applications (submitted_by_partner_id, created_at desc);

-- De-duplication guard (paired with the client-side find-or-create in
-- src/lib/gpRepository.ts). Only ONE open (non-terminal) application may exist
-- per partner+salon, and only ONE per partner+exact shop_name.
create unique index if not exists shop_onboarding_applications_uniq_salon
  on public.shop_onboarding_applications (submitted_by_partner_id, existing_salon_id)
  where status in ('draft','submitted','changes_requested');
create unique index if not exists shop_onboarding_applications_uniq_name
  on public.shop_onboarding_applications (submitted_by_partner_id, shop_name)
  where status in ('draft','submitted','changes_requested');

alter table public.shop_onboarding_applications enable row level security;

drop policy if exists "shop_onboarding_applications_select_own" on public.shop_onboarding_applications;
create policy "shop_onboarding_applications_select_own"
  on public.shop_onboarding_applications for select
  to authenticated
  using (submitted_by_partner_id = public.current_growth_partner_id());

drop policy if exists "shop_onboarding_applications_insert_own" on public.shop_onboarding_applications;
create policy "shop_onboarding_applications_insert_own"
  on public.shop_onboarding_applications for insert
  to authenticated
  with check (submitted_by_partner_id = public.current_growth_partner_id());

drop policy if exists "shop_onboarding_applications_update_own" on public.shop_onboarding_applications;
create policy "shop_onboarding_applications_update_own"
  on public.shop_onboarding_applications for update
  to authenticated
  using (submitted_by_partner_id = public.current_growth_partner_id())
  with check (submitted_by_partner_id = public.current_growth_partner_id());

-- ---------------------------------------------------------------------------
-- 8. salon_setup_proposals + payload handling
-- ---------------------------------------------------------------------------
create table if not exists public.salon_setup_proposals (
  id                    uuid primary key default gen_random_uuid(),
  growth_partner_id     uuid not null references public.growth_partners(id) on delete cascade,
  salon_id              uuid,
  application_id        uuid,
  status                text not null default 'draft' check (status in ('draft','submitted','approved','rejected','changes_requested','published')),
  payload               jsonb,
  submitted_at          timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists salon_setup_proposals_partner_idx
  on public.salon_setup_proposals (growth_partner_id, updated_at desc);

alter table public.salon_setup_proposals enable row level security;

drop policy if exists "salon_setup_proposals_select_own" on public.salon_setup_proposals;
create policy "salon_setup_proposals_select_own"
  on public.salon_setup_proposals for select
  to authenticated
  using (growth_partner_id = public.current_growth_partner_id());

drop policy if exists "salon_setup_proposals_insert_own" on public.salon_setup_proposals;
create policy "salon_setup_proposals_insert_own"
  on public.salon_setup_proposals for insert
  to authenticated
  with check (growth_partner_id = public.current_growth_partner_id());

drop policy if exists "salon_setup_proposals_update_own" on public.salon_setup_proposals;
create policy "salon_setup_proposals_update_own"
  on public.salon_setup_proposals for update
  to authenticated
  using (growth_partner_id = public.current_growth_partner_id())
  with check (growth_partner_id = public.current_growth_partner_id());

-- ---------------------------------------------------------------------------
-- 9. support_tickets (authenticated INSERT/UPDATE/SELECT for the owner)
-- ---------------------------------------------------------------------------
create table if not exists public.support_tickets (
  id                    uuid primary key default gen_random_uuid(),
  recipient_user_id     uuid not null references auth.users(id) on delete cascade,
  subject               text not null,
  description           text,
  category              text,
  priority              text not null default 'medium' check (priority in ('low','medium','high','urgent')),
  status                text not null default 'open' check (status in ('open','in_progress','resolved','closed')),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists support_tickets_recipient_idx
  on public.support_tickets (recipient_user_id, created_at desc);

alter table public.support_tickets enable row level security;

drop policy if exists "support_tickets_select_own" on public.support_tickets;
create policy "support_tickets_select_own"
  on public.support_tickets for select
  to authenticated
  using (recipient_user_id = auth.uid());

drop policy if exists "support_tickets_insert_own" on public.support_tickets;
create policy "support_tickets_insert_own"
  on public.support_tickets for insert
  to authenticated
  with check (recipient_user_id = auth.uid());

drop policy if exists "support_tickets_update_own" on public.support_tickets;
create policy "support_tickets_update_own"
  on public.support_tickets for update
  to authenticated
  using (recipient_user_id = auth.uid())
  with check (recipient_user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 9b. ticket_messages (conversation on a support_ticket)
-- ---------------------------------------------------------------------------
create table if not exists public.ticket_messages (
  id                uuid primary key default gen_random_uuid(),
  ticket_id         uuid not null references public.support_tickets(id) on delete cascade,
  sender_user_id    uuid references auth.users(id) on delete set null,
  message           text not null,
  created_at        timestamptz not null default now()
);

create index if not exists ticket_messages_ticket_idx
  on public.ticket_messages (ticket_id, created_at asc);

alter table public.ticket_messages enable row level security;

-- Participants (the ticket owner) may read the thread and append messages. The
-- check resolves the ticket owner so a caller cannot post into someone else's
-- ticket. Applies to the signed-in user's own ticket only.
drop policy if exists "ticket_messages_select_own" on public.ticket_messages;
create policy "ticket_messages_select_own"
  on public.ticket_messages for select
  to authenticated
  using (
    exists (
      select 1 from public.support_tickets t
      where t.id = ticket_id and t.recipient_user_id = auth.uid()
    )
  );

drop policy if exists "ticket_messages_insert_own" on public.ticket_messages;
create policy "ticket_messages_insert_own"
  on public.ticket_messages for insert
  to authenticated
  with check (
    sender_user_id = auth.uid()
    and exists (
      select 1 from public.support_tickets t
      where t.id = ticket_id and t.recipient_user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- 10. save_growth_partner_salon_setup RPC (authenticated write path)
-- ---------------------------------------------------------------------------
create or replace function public.save_growth_partner_salon_setup(
  p_application_id uuid,
  p_payload jsonb,
  p_submit boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_partner_id uuid;
  v_salon_id uuid;
  v_proposal_id uuid;
  v_status text := 'draft';
begin
  v_partner_id := public.current_growth_partner_id();
  if v_partner_id is null then
    raise exception 'No growth partner linked to this account.' using errcode = '42501';
  end if;

  -- The application must belong to the caller.
  select existing_salon_id into v_salon_id
  from public.shop_onboarding_applications
  where id = p_application_id
    and submitted_by_partner_id = v_partner_id;

  if v_salon_id is null then
    raise exception 'Application not found or not owned by this partner.' using errcode = '42501';
  end if;

  if p_submit then
    update public.shop_onboarding_applications
       set status = 'submitted', updated_at = now()
     where id = p_application_id;
    v_status := 'submitted';
  end if;

  insert into public.salon_setup_proposals
    (growth_partner_id, salon_id, application_id, status, payload, submitted_at, updated_at)
  values
    (v_partner_id, v_salon_id, p_application_id, v_status, p_payload,
     case when p_submit then now() end, now())
  on conflict do nothing
  returning id into v_proposal_id;

  -- Fallback when ON CONFLICT did not fire (no unique constraint in place):
  -- reuse the most recent proposal for this (partner, application).
  if v_proposal_id is null then
    select id into v_proposal_id
    from public.salon_setup_proposals
    where application_id = p_application_id and growth_partner_id = v_partner_id
    order by updated_at desc
    limit 1;
  end if;

  return v_proposal_id;
end;
$$;

revoke all on function public.save_growth_partner_salon_setup(uuid, jsonb, boolean) from public, anon;
grant execute on function public.save_growth_partner_salon_setup(uuid, jsonb, boolean) to authenticated;

-- ---------------------------------------------------------------------------
-- 11. user_roles (role lookup used by checkGrowthPartnerAccess)
-- ---------------------------------------------------------------------------
create table if not exists public.user_roles (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  role        text not null,
  created_at  timestamptz not null default now()
);

create index if not exists user_roles_user_idx on public.user_roles (user_id);

alter table public.user_roles enable row level security;

drop policy if exists "user_roles_select_own" on public.user_roles;
create policy "user_roles_select_own"
  on public.user_roles for select
  to authenticated
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 12. Explicitly deny anon on every GP table (defense in depth)
-- ---------------------------------------------------------------------------
revoke all on table public.growth_partners,
                  public.shop_attributions,
                  public.growth_partner_commissions,
                  public.partner_payouts,
                  public.notifications,
                  public.shop_onboarding_applications,
                  public.salon_setup_proposals,
                  public.support_tickets,
                  public.ticket_messages,
                  public.user_roles
  from anon, public;

grant select on table public.growth_partners,
                  public.shop_attributions,
                  public.growth_partner_commissions,
                  public.partner_payouts,
                  public.notifications,
                  public.shop_onboarding_applications,
                  public.salon_setup_proposals,
                  public.support_tickets,
                  public.ticket_messages,
                  public.user_roles
  to authenticated;
grant insert, update on table public.shop_onboarding_applications,
                          public.salon_setup_proposals,
                          public.support_tickets,
                          public.ticket_messages
  to authenticated;
