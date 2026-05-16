-- VVCRM 2026 Database Schema
-- Run this in Supabase SQL Editor

-- ============================================================================
-- 1. Leads (客户商机主表)
-- ============================================================================
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  -- Customer Info
  full_name text not null,
  company_cn text default '',
  company_en text default '',
  title text default '',
  phone text default '',
  email text default '',
  destination_country text not null,
  destination_port text default '',
  lead_source text not null default '',
  whatsapp text not null default '',
  qualification text default '',
  -- Vehicle Demand
  target_model text not null,
  brand text default '',
  year text default '',
  power_type text default '',
  steering text not null default 'LHD',
  color text default '',
  quantity text default '',
  moq text default '',
  -- Pricing
  target_price text default '',
  currency text default 'USD',
  trade_terms text default '',
  delivery_date text default '',
  -- Sales Process
  stage text not null default 'New Lead',
  competitor text default '',
  lost_reason text default '',
  lost_detail text default '',
  hot_score text default '',
  assignee text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists leads_stage_idx on public.leads (stage);
create index if not exists leads_country_idx on public.leads (destination_country);
create index if not exists leads_model_idx on public.leads (target_model);
create index if not exists leads_assignee_idx on public.leads (assignee);

-- ============================================================================
-- 2. Inquiry Events (询盘/跟进记录)
-- ============================================================================
create table if not exists public.inquiry_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete cascade,
  full_name text not null default '',
  destination_country text not null default '',
  target_model text not null default '',
  event_note text not null default '',
  channel text not null default '',
  status text not null default 'pending',
  follow_ups jsonb not null default '[]'::jsonb,
  company_cn text default '',
  company_en text default '',
  port text default '',
  vin text default '',
  trade_terms text default '',
  quantity text default '',
  completed boolean not null default false,
  last_inquiry_at timestamptz,
  next_follow_up_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists inquiry_events_created_at_idx on public.inquiry_events (created_at desc);

-- ============================================================================
-- 3. Attachments (附件表)
-- ============================================================================
create table if not exists public.inquiry_attachments (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id) on delete cascade,
  file_name text not null,
  file_url text not null,
  file_type text default '',
  uploaded_at timestamptz not null default now()
);

-- ============================================================================
-- 4. PI Records (形式发票记录)
-- ============================================================================
create table if not exists public.inquiry_pi (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id) on delete cascade,
  pi_number text default '',
  pi_date date,
  pi_file_url text default '',
  created_at timestamptz not null default now()
);

-- ============================================================================
-- 5. Tasks (跟进任务)
-- ============================================================================
create table if not exists public.inquiry_tasks (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id) on delete cascade,
  title text not null,
  due_date timestamptz,
  assignee text default '',
  remind_type text default 'app',
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- 6. Communication Log (沟通记录)
-- ============================================================================
create table if not exists public.inquiry_communication (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id) on delete cascade,
  type text not null default 'note',
  content text default '',
  file_url text default '',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

-- ============================================================================
-- 7. Operation Log (操作日志)
-- ============================================================================
create table if not exists public.inquiry_log (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id) on delete cascade,
  field_name text not null,
  old_value text default '',
  new_value text default '',
  changed_by uuid references auth.users(id),
  changed_at timestamptz not null default now()
);

-- ============================================================================
-- 8. RHD Countries Config (右舵国家配置)
-- ============================================================================
create table if not exists public.right_hand_drive_countries (
  id uuid primary key default gen_random_uuid(),
  country_name text not null unique,
  country_code text default ''
);

insert into public.right_hand_drive_countries (country_name, country_code) values
  ('UK','UK'),('Australia','AU'),('Japan','JP'),('India','IN'),
  ('Indonesia','ID'),('South Africa','ZA'),('Thailand','TH'),
  ('Malaysia','MY'),('Singapore','SG'),('New Zealand','NZ'),
  ('Ireland','IE'),('Kenya','KE'),('Tanzania','TZ'),('Uganda','UG'),
  ('Zambia','ZM'),('Zimbabwe','ZW'),('Botswana','BW'),('Namibia','NA'),
  ('Mozambique','MZ'),('Pakistan','PK'),('Bangladesh','BD'),
  ('Sri Lanka','LK'),('Nepal','NP'),('Bhutan','BT')
on conflict (country_name) do nothing;

-- ============================================================================
-- RLS Policies
-- ============================================================================
alter table public.leads enable row level security;
alter table public.inquiry_events enable row level security;
alter table public.inquiry_attachments enable row level security;
alter table public.inquiry_pi enable row level security;
alter table public.inquiry_tasks enable row level security;
alter table public.inquiry_communication enable row level security;
alter table public.inquiry_log enable row level security;
alter table public.right_hand_drive_countries enable row level security;

create policy "Users can manage own leads" on public.leads for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can manage own inquiries" on public.inquiry_events for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================================
-- Triggers
-- ============================================================================
create or replace function public.update_updated_at()
returns trigger as $$ begin new.updated_at = now(); return new; end; $$ language plpgsql security definer;

drop trigger if exists leads_updated_at on public.leads;
create trigger leads_updated_at before update on public.leads for each row execute function public.update_updated_at();
