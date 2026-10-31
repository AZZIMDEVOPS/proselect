-- =====================================================================
-- Proselect Fleet & Industrial Solutions Limited — core schema
-- PostgreSQL / Supabase. Run via `supabase db push` or the SQL editor.
-- =====================================================================
create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";

-- ---------- Enums ----------
create type app_role as enum (
  'super_admin','admin','sales_manager','procurement_officer','operations_officer','client','manufacturer'
);
create type org_kind as enum ('client','manufacturer','internal');
create type division as enum ('electric-mobility','renewable-energy','heavy-machinery');
create type product_status as enum ('draft','published','archived');
create type spec_verification as enum ('verified','awaiting_confirmation');
create type media_kind as enum ('image','brochure','compliance','other');
create type rfq_status as enum (
  'received','technical_review','manufacturer_engagement','quotation_issued',
  'negotiation','won','lost','cancelled'
);
create type quotation_status as enum ('draft','sent','accepted','revision_requested','declined','expired','superseded');
create type order_stage as enum (
  'inquiry_received','technical_review','manufacturer_engagement','quotation_issued',
  'commercial_negotiation','contract_signed','production_order_processing','factory_dispatch',
  'international_transit','port_clearance','site_delivery','completed'
);
create type document_type as enum (
  'quotation','commercial_invoice','sales_contract','performance_guarantee',
  'technical_specification','compliance_certificate','shipping_document','other'
);
create type representation_status as enum ('prospect','in_discussion','agreement_pending','authorised_representative','paused','declined');
create type application_status as enum ('submitted','under_review','more_info_requested','approved','rejected');
create type lead_status as enum ('new','contacted','qualified','converted','closed');
create type engagement_status as enum ('contacted','awaiting_response','quote_received','declined','confirmed');

-- ---------- Reference numbers ----------
create sequence rfq_ref_seq start 1001;
create sequence quote_ref_seq start 1001;
create sequence order_ref_seq start 1001;
create sequence lead_ref_seq start 1001;
create sequence app_ref_seq start 1001;

-- ---------- Core identity ----------
create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 200),
  kind org_kind not null default 'client',
  registration_number text,
  kra_pin text,                     -- restricted: staff only (see column grants below)
  address text, county text, country text default 'Kenya', website text,
  created_at timestamptz not null default now()
);

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text, email text not null, phone text,
  role app_role not null default 'client',
  organization_id uuid references organizations(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index on profiles(role);
create index on profiles(organization_id);

create table clients (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  primary_user_id uuid references profiles(id) on delete set null,
  contact_name text, email text, phone text,
  created_at timestamptz not null default now()
);
create index on clients(primary_user_id);
create index on clients(organization_id);

create table manufacturers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete set null,
  name text not null, country text, contact_person text, email text, phone text, website text,
  specializations text[] not null default '{}',
  representation representation_status not null default 'prospect',
  commercial_terms text,             -- internal only
  assigned_to uuid references profiles(id) on delete set null,
  is_sample boolean not null default false,
  created_at timestamptz not null default now()
);
create index on manufacturers using gin (specializations);

-- ---------- Catalogue ----------
create table product_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique, name text not null,
  division division not null,
  description text, sort_order int not null default 0
);

create table products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null, model text,
  manufacturer_id uuid references manufacturers(id) on delete set null,
  category_id uuid not null references product_categories(id),
  short_description text, overview text, performance_info text,
  configurations jsonb not null default '[]',   -- [{name, description, verified}]
  accessories jsonb not null default '[]',
  spare_parts_info text,
  is_featured boolean not null default false,
  is_sample boolean not null default false,
  status product_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on products(category_id);
create index on products(status, is_featured);
create index products_search_idx on products using gin ((name || ' ' || coalesce(model,'') || ' ' || coalesce(short_description,'')) gin_trgm_ops);

create table product_specifications (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  spec_group text not null default 'General',
  label text not null, value text, unit text,
  verification spec_verification not null default 'awaiting_confirmation',
  is_key boolean not null default false,
  sort_order int not null default 0
);
create index on product_specifications(product_id);
create index on product_specifications(label, value);

create table product_media (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  kind media_kind not null default 'image',
  storage_path text not null,       -- path inside bucket product-media
  title text, alt_text text, is_primary boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index on product_media(product_id);

-- ---------- RFQs ----------
create table rfqs (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique default ('PS-RFQ-' || to_char(now(),'YYYY') || '-' || nextval('rfq_ref_seq')),
  client_id uuid references clients(id) on delete set null,
  user_id uuid references profiles(id) on delete set null,
  status rfq_status not null default 'received',
  assigned_to uuid references profiles(id) on delete set null,
  category division,
  company_name text not null, contact_person text not null,
  email text not null, phone text not null,
  project_location text, county_country text,
  intended_application text, procurement_timeline text, additional_requirements text,
  delivery_destination text, delivery_arrangement text, site_accessibility text, logistics_support text,
  technical_requirements jsonb not null default '{}',
  follow_up_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on rfqs(client_id);
create index on rfqs(status);
create index on rfqs(category);
create index on rfqs(assigned_to);
create index on rfqs(created_at desc);

create table rfq_items (
  id uuid primary key default gen_random_uuid(),
  rfq_id uuid not null references rfqs(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  custom_description text,
  category_label text, model text, preferred_manufacturer text,
  quantity int not null default 1 check (quantity > 0 and quantity < 100000),
  specifications text, power_requirements text, accessories text, spare_parts text,
  maintenance text, custom_configuration text
);
create index on rfq_items(rfq_id);

create table manufacturer_engagements (
  id uuid primary key default gen_random_uuid(),
  rfq_id uuid not null references rfqs(id) on delete cascade,
  manufacturer_id uuid not null references manufacturers(id) on delete cascade,
  status engagement_status not null default 'contacted',
  note text, follow_up_at timestamptz,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index on manufacturer_engagements(rfq_id);

-- ---------- Quotations ----------
create table quotations (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique default ('PS-QTN-' || to_char(now(),'YYYY') || '-' || nextval('quote_ref_seq')),
  rfq_id uuid not null references rfqs(id) on delete cascade,
  client_id uuid references clients(id) on delete set null,
  version int not null default 1,
  status quotation_status not null default 'draft',
  currency text not null default 'USD' check (currency in ('USD','KES','EUR','GBP','CNY')),
  validity_until date,
  delivery_estimate text, logistics_estimate text,
  commercial_terms text, payment_terms text, incoterm text,
  tax_label text default 'VAT', tax_rate numeric(5,2) not null default 0 check (tax_rate between 0 and 100),
  other_charges numeric(14,2) not null default 0, other_charges_label text,
  logistics_charge numeric(14,2) not null default 0,   -- disclosed to client
  client_response_note text, responded_at timestamptz,
  sent_at timestamptz,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on quotations(rfq_id);
create index on quotations(client_id);
create index on quotations(status);

-- client-facing lines
create table quotation_items (
  id uuid primary key default gen_random_uuid(),
  quotation_id uuid not null references quotations(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  description text not null, quantity int not null check (quantity > 0),
  unit_price numeric(14,2) not null check (unit_price >= 0),
  sort_order int not null default 0
);
create index on quotation_items(quotation_id);

-- INTERNAL ONLY: never readable by clients (RLS: staff only)
create table quotation_internal_costs (
  quotation_id uuid primary key references quotations(id) on delete cascade,
  manufacturer_cost_total numeric(14,2) not null default 0,
  logistics_cost_total numeric(14,2) not null default 0,
  other_internal_costs numeric(14,2) not null default 0,
  notes text
);

create table quotation_revisions (
  id uuid primary key default gen_random_uuid(),
  quotation_id uuid not null references quotations(id) on delete cascade,
  version int not null, note text,
  snapshot jsonb not null,           -- client-facing snapshot only
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index on quotation_revisions(quotation_id);

-- ---------- Orders & shipment ----------
create table orders (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique default ('PS-ORD-' || to_char(now(),'YYYY') || '-' || nextval('order_ref_seq')),
  quotation_id uuid not null references quotations(id),
  rfq_id uuid references rfqs(id) on delete set null,
  client_id uuid not null references clients(id),
  stage order_stage not null default 'contract_signed',
  title text, delivery_site text, estimated_delivery date,
  value_amount numeric(14,2), currency text default 'USD',
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on orders(client_id);
create index on orders(stage);

create table shipment_milestones (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  stage order_stage not null,
  note text, location text,
  occurred_at timestamptz not null default now(),
  visible_to_client boolean not null default true,
  created_by uuid references profiles(id) on delete set null
);
create index on shipment_milestones(order_id);

-- ---------- Documents, messaging, notifications ----------
create table documents (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade,
  rfq_id uuid references rfqs(id) on delete set null,
  quotation_id uuid references quotations(id) on delete set null,
  order_id uuid references orders(id) on delete set null,
  doc_type document_type not null default 'other',
  title text not null,
  storage_path text not null,       -- path inside private bucket `documents`: {client_id}/{uuid}-{name}
  mime_type text, size_bytes bigint,
  visible_to_client boolean not null default true,
  uploaded_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index on documents(client_id);
create index on documents(order_id);

create table messages (
  id uuid primary key default gen_random_uuid(),
  rfq_id uuid not null references rfqs(id) on delete cascade,
  sender_id uuid not null references profiles(id) on delete cascade,
  from_staff boolean not null default false,
  body text not null check (char_length(body) between 1 and 5000),
  created_at timestamptz not null default now()
);
create index on messages(rfq_id, created_at);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null, body text, link text,
  read_at timestamptz, created_at timestamptz not null default now()
);
create index on notifications(user_id, created_at desc);

create table internal_notes (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('rfq','client','manufacturer','order','quotation','lead','application')),
  entity_id uuid not null,
  body text not null check (char_length(body) between 1 and 5000),
  author_id uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index on internal_notes(entity_type, entity_id);

create table audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid, actor_email text,
  action text not null, entity_type text, entity_id text,
  details jsonb, created_at timestamptz not null default now()
);
create index on audit_logs(created_at desc);
create index on audit_logs(entity_type, entity_id);

-- ---------- Leads & manufacturer applications ----------
create table leads (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique default ('PS-LEAD-' || to_char(now(),'YYYY') || '-' || nextval('lead_ref_seq')),
  source text not null default 'contact_form',
  category text, name text not null, company text, email text not null, phone text,
  message text not null,
  status lead_status not null default 'new',
  assigned_to uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index on leads(status);

create table manufacturer_applications (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique default ('PS-MFR-' || to_char(now(),'YYYY') || '-' || nextval('app_ref_seq')),
  status application_status not null default 'submitted',
  company_name text not null, country_of_manufacture text not null,
  website text, contact_person text not null, email text not null, phone text,
  product_categories text[] not null default '{}',
  products_summary text, certifications text,
  representation_arrangement text, message text,
  attachments jsonb not null default '[]',   -- [{path, name, kind}] in private bucket `manufacturer-submissions`
  manufacturer_id uuid references manufacturers(id) on delete set null,
  reviewed_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ---------- Settings (CMS-managed) ----------
create table site_settings (
  key text primary key, value jsonb not null,
  is_public boolean not null default true,
  updated_at timestamptz not null default now()
);

-- ---------- Rate limiting ----------
create table rate_limits (
  key text not null, window_start timestamptz not null, hits int not null default 1,
  primary key (key, window_start)
);

-- =====================================================================
-- Helper functions
-- =====================================================================
create or replace function public.current_role_name() returns app_role
language sql stable security definer set search_path = public as $$
  select role from profiles where id = auth.uid() and is_active
$$;

create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(current_role_name() in ('super_admin','admin','sales_manager','procurement_officer','operations_officer'), false)
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(current_role_name() in ('super_admin','admin'), false)
$$;

create or replace function public.can_manage_commercial() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(current_role_name() in ('super_admin','admin','sales_manager','procurement_officer'), false)
$$;

create or replace function public.can_manage_ops() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(current_role_name() in ('super_admin','admin','operations_officer'), false)
$$;

create or replace function public.my_client_id() returns uuid
language sql stable security definer set search_path = public as $$
  select c.id from clients c join profiles p on p.id = c.primary_user_id where p.id = auth.uid() limit 1
$$;

-- Atomic, DB-backed rate limiter used by server actions (service role).
create or replace function public.check_rate_limit(p_key text, p_limit int, p_window_seconds int)
returns boolean language plpgsql security definer set search_path = public as $$
declare w timestamptz; h int;
begin
  w := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  insert into rate_limits(key, window_start, hits) values (p_key, w, 1)
    on conflict (key, window_start) do update set hits = rate_limits.hits + 1
    returning hits into h;
  delete from rate_limits where window_start < now() - interval '1 day';
  return h <= p_limit;
end $$;
revoke all on function public.check_rate_limit(text,int,int) from public, anon, authenticated;

-- New auth user → profile + organisation + client record (role is ALWAYS client here;
-- staff roles can only be granted by an administrator).
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare org uuid; cname text := coalesce(new.raw_user_meta_data->>'company_name', 'Unnamed company');
begin
  insert into organizations(name, kind) values (left(cname,200), 'client') returning id into org;
  insert into profiles(id, full_name, email, phone, role, organization_id)
    values (new.id, new.raw_user_meta_data->>'full_name', new.email, new.raw_user_meta_data->>'phone', 'client', org);
  insert into clients(organization_id, primary_user_id, contact_name, email, phone)
    values (org, new.id, new.raw_user_meta_data->>'full_name', new.email, new.raw_user_meta_data->>'phone');
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
create trigger t_products_u before update on products for each row execute function touch_updated_at();
create trigger t_rfqs_u before update on rfqs for each row execute function touch_updated_at();
create trigger t_quotes_u before update on quotations for each row execute function touch_updated_at();
create trigger t_orders_u before update on orders for each row execute function touch_updated_at();

-- Prevent privilege escalation: only admins may change role / active flag / org.
create or replace function public.guard_profile_update() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not is_admin() then
    new.role := old.role; new.is_active := old.is_active; new.organization_id := old.organization_id;
    new.email := old.email;
  end if;
  return new;
end $$;
create trigger t_profiles_guard before update on profiles for each row execute function guard_profile_update();

-- Client responses to quotations: clients may only accept / request revision on sent quotes.
create or replace function public.respond_to_quotation(p_id uuid, p_decision text, p_note text)
returns void language plpgsql security definer set search_path = public as $$
declare q quotations;
begin
  select * into q from quotations where id = p_id and client_id = my_client_id();
  if not found then raise exception 'Quotation not found'; end if;
  if q.status <> 'sent' then raise exception 'Quotation is not awaiting a response'; end if;
  if q.validity_until is not null and q.validity_until < current_date then raise exception 'Quotation has expired'; end if;
  if p_decision not in ('accepted','revision_requested','declined') then raise exception 'Invalid decision'; end if;
  update quotations set status = p_decision::quotation_status, client_response_note = left(p_note, 2000), responded_at = now() where id = p_id;
  insert into audit_logs(actor_id, action, entity_type, entity_id, details)
    values (auth.uid(), 'quotation.client_' || p_decision, 'quotation', p_id::text, jsonb_build_object('note', left(p_note,2000)));
end $$;
grant execute on function public.respond_to_quotation(uuid,text,text) to authenticated;

-- =====================================================================
-- Row Level Security
-- =====================================================================
alter table organizations enable row level security;
alter table profiles enable row level security;
alter table clients enable row level security;
alter table manufacturers enable row level security;
alter table product_categories enable row level security;
alter table products enable row level security;
alter table product_specifications enable row level security;
alter table product_media enable row level security;
alter table rfqs enable row level security;
alter table rfq_items enable row level security;
alter table manufacturer_engagements enable row level security;
alter table quotations enable row level security;
alter table quotation_items enable row level security;
alter table quotation_internal_costs enable row level security;
alter table quotation_revisions enable row level security;
alter table orders enable row level security;
alter table shipment_milestones enable row level security;
alter table documents enable row level security;
alter table messages enable row level security;
alter table notifications enable row level security;
alter table internal_notes enable row level security;
alter table audit_logs enable row level security;
alter table leads enable row level security;
alter table manufacturer_applications enable row level security;
alter table site_settings enable row level security;
alter table rate_limits enable row level security;   -- no policies = no direct access

-- Public catalogue (published only)
create policy cat_read on product_categories for select using (true);
create policy cat_write on product_categories for all using (is_admin()) with check (is_admin());

create policy prod_public on products for select using (status = 'published' or is_staff());
create policy prod_write on products for all using (can_manage_commercial()) with check (can_manage_commercial());

create policy spec_public on product_specifications for select
  using (exists (select 1 from products p where p.id = product_id and (p.status = 'published' or is_staff())));
create policy spec_write on product_specifications for all using (can_manage_commercial()) with check (can_manage_commercial());

create policy media_public on product_media for select
  using (exists (select 1 from products p where p.id = product_id and (p.status = 'published' or is_staff())));
create policy media_write on product_media for all using (can_manage_commercial()) with check (can_manage_commercial());

-- Manufacturers directory contains agreements → staff only. Public catalogue exposes name via a view.
create policy mfr_staff on manufacturers for select using (is_staff());
create policy mfr_write on manufacturers for all using (can_manage_commercial()) with check (can_manage_commercial());
create view public.manufacturer_public with (security_invoker = false) as
  select id, name, country, website from manufacturers
  where exists (select 1 from products p where p.manufacturer_id = manufacturers.id and p.status = 'published');
grant select on public.manufacturer_public to anon, authenticated;

-- Identity
create policy org_self on organizations for select
  using (is_staff() or id = (select organization_id from profiles where id = auth.uid()));
create policy org_write on organizations for all using (can_manage_commercial()) with check (can_manage_commercial());
-- KRA PIN / registration number are sensitive: column-level grants hide them from the browser-facing
-- roles entirely. Authorised staff read them server-side only (service role, after a role check).
revoke select on organizations from anon, authenticated;
grant select (id, name, kind, address, county, country, website, created_at) on organizations to authenticated;

create policy prof_self on profiles for select using (id = auth.uid() or is_staff());
create policy prof_update_self on profiles for update using (id = auth.uid() or is_admin()) with check (id = auth.uid() or is_admin());

create policy cli_read on clients for select using (is_staff() or primary_user_id = auth.uid());
create policy cli_write on clients for all using (can_manage_commercial()) with check (can_manage_commercial());

-- RFQs
create policy rfq_read on rfqs for select using (is_staff() or client_id = my_client_id());
create policy rfq_staff_write on rfqs for update using (is_staff()) with check (is_staff());
create policy rfq_staff_del on rfqs for delete using (is_admin());
-- inserts happen through server actions using the service role (validated, rate limited, spam protected)

create policy rfqi_read on rfq_items for select
  using (exists (select 1 from rfqs r where r.id = rfq_id and (is_staff() or r.client_id = my_client_id())));
create policy rfqi_staff on rfq_items for all using (is_staff()) with check (is_staff());

create policy eng_staff on manufacturer_engagements for all using (is_staff()) with check (is_staff());

-- Quotations: clients only see SENT-or-later quotes that belong to them; never drafts
create policy q_read on quotations for select
  using (can_manage_commercial() or (client_id = my_client_id() and status <> 'draft'));
create policy q_write on quotations for all using (can_manage_commercial()) with check (can_manage_commercial());
create policy qi_read on quotation_items for select
  using (exists (select 1 from quotations q where q.id = quotation_id
         and (can_manage_commercial() or (q.client_id = my_client_id() and q.status <> 'draft'))));
create policy qi_write on quotation_items for all using (can_manage_commercial()) with check (can_manage_commercial());
create policy qic_staff on quotation_internal_costs for all using (can_manage_commercial()) with check (can_manage_commercial());
create policy qrev_read on quotation_revisions for select
  using (can_manage_commercial() or exists (select 1 from quotations q where q.id = quotation_id and q.client_id = my_client_id() and q.status <> 'draft'));
create policy qrev_write on quotation_revisions for all using (can_manage_commercial()) with check (can_manage_commercial());

-- Orders & milestones
create policy ord_read on orders for select using (is_staff() or client_id = my_client_id());
create policy ord_write on orders for all using (can_manage_commercial() or can_manage_ops()) with check (can_manage_commercial() or can_manage_ops());
create policy ms_read on shipment_milestones for select
  using (is_staff() or (visible_to_client and exists (select 1 from orders o where o.id = order_id and o.client_id = my_client_id())));
create policy ms_write on shipment_milestones for all using (can_manage_commercial() or can_manage_ops()) with check (can_manage_commercial() or can_manage_ops());

-- Documents: strict client isolation
create policy doc_read on documents for select
  using (is_staff() or (visible_to_client and client_id = my_client_id()));
create policy doc_write on documents for all using (is_staff()) with check (is_staff());

-- Messages
create policy msg_read on messages for select
  using (is_staff() or exists (select 1 from rfqs r where r.id = rfq_id and r.client_id = my_client_id()));
create policy msg_client_insert on messages for insert
  with check (sender_id = auth.uid() and (
      (is_staff() and from_staff) or
      (not from_staff and exists (select 1 from rfqs r where r.id = rfq_id and r.client_id = my_client_id()))));

-- Notifications
create policy notif_own on notifications for select using (user_id = auth.uid());
create policy notif_own_update on notifications for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy notif_staff_insert on notifications for insert with check (is_staff());

-- Internal data: staff only
create policy notes_staff on internal_notes for all using (is_staff()) with check (is_staff());
create policy audit_admin on audit_logs for select using (is_admin());
create policy leads_staff on leads for all using (is_staff()) with check (is_staff());
create policy app_staff on manufacturer_applications for all using (can_manage_commercial()) with check (can_manage_commercial());

-- Settings: public keys readable by all; writes by admin
create policy set_read on site_settings for select using (is_public or is_staff());
create policy set_write on site_settings for all using (is_admin()) with check (is_admin());

-- =====================================================================
-- Storage buckets & policies
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
 ('product-media','product-media', true, 15728640, array['image/jpeg','image/png','image/webp','image/avif','application/pdf']),
 ('documents','documents', false, 26214400, array['application/pdf','image/jpeg','image/png','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']),
 ('manufacturer-submissions','manufacturer-submissions', false, 26214400, array['application/pdf','image/jpeg','image/png'])
on conflict (id) do nothing;

create policy "product media public read" on storage.objects for select using (bucket_id = 'product-media');
create policy "product media staff write" on storage.objects for all
  using (bucket_id = 'product-media' and can_manage_commercial()) with check (bucket_id = 'product-media' and can_manage_commercial());
-- Private documents: path is {client_id}/{file}. Clients may read only objects in their own folder AND flagged visible.
create policy "documents staff all" on storage.objects for all
  using (bucket_id = 'documents' and is_staff()) with check (bucket_id = 'documents' and is_staff());
create policy "documents client read" on storage.objects for select
  using (bucket_id = 'documents' and exists (
     select 1 from public.documents d where d.storage_path = storage.objects.name
       and d.visible_to_client and d.client_id = my_client_id()));
create policy "mfr submissions staff read" on storage.objects for select
  using (bucket_id = 'manufacturer-submissions' and can_manage_commercial());
-- anonymous uploads for manufacturer submissions go through server action + service role (validated).
