-- VVCRM 2026 增量迁移（安全，不丢数据）
-- 在 Supabase SQL Editor 中运行

-- ============================================================================
-- 1. 给 leads 表增加新列
-- ============================================================================
alter table public.leads add column if not exists company_cn text default '';
alter table public.leads add column if not exists company_en text default '';
alter table public.leads add column if not exists title text default '';
alter table public.leads add column if not exists phone text default '';
alter table public.leads add column if not exists email text default '';
alter table public.leads add column if not exists destination_port text default '';
alter table public.leads add column if not exists qualification text default '';
alter table public.leads add column if not exists brand text default '';
alter table public.leads add column if not exists year text default '';
alter table public.leads add column if not exists power_type text default '';
alter table public.leads add column if not exists color text default '';
alter table public.leads add column if not exists quantity text default '';
alter table public.leads add column if not exists moq text default '';
alter table public.leads add column if not exists target_price text default '';
alter table public.leads add column if not exists currency text default 'USD';
alter table public.leads add column if not exists trade_terms text default '';
alter table public.leads add column if not exists delivery_date text default '';
alter table public.leads add column if not exists competitor text default '';
alter table public.leads add column if not exists lost_reason text default '';
alter table public.leads add column if not exists lost_detail text default '';
alter table public.leads add column if not exists hot_score text default '';
alter table public.leads add column if not exists assignee text default '';

-- 更新默认 stage 值
alter table public.leads alter column stage set default 'New Lead';

-- ============================================================================
-- 2. 新建辅助表
-- ============================================================================
create table if not exists public.inquiry_attachments (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id) on delete cascade,
  file_name text not null,
  file_url text not null,
  file_type text default '',
  uploaded_at timestamptz not null default now()
);

create table if not exists public.inquiry_pi (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id) on delete cascade,
  pi_number text default '',
  pi_date date,
  pi_file_url text default '',
  created_at timestamptz not null default now()
);

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

create table if not exists public.inquiry_communication (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id) on delete cascade,
  type text not null default 'note',
  content text default '',
  file_url text default '',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

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
-- 3. 新增索引
-- ============================================================================
create index if not exists leads_country_idx on public.leads (destination_country);
create index if not exists leads_assignee_idx on public.leads (assignee);

-- ============================================================================
-- 4. inquiry_events 新增列
-- ============================================================================
alter table public.inquiry_events add column if not exists company_cn text default '';
alter table public.inquiry_events add column if not exists company_en text default '';
alter table public.inquiry_events add column if not exists port text default '';
alter table public.inquiry_events add column if not exists vin text default '';
alter table public.inquiry_events add column if not exists trade_terms text default '';
alter table public.inquiry_events add column if not exists quantity text default '';
