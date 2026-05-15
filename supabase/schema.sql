create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  full_name text not null,
  destination_country text not null,
  target_model text not null,
  lead_source text not null default '',
  whatsapp text not null default '',
  steering text not null default 'LHD',
  stage text not null default 'AI Intake',
  deposit_paid boolean not null default false,
  balance_closed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists leads_destination_country_idx on public.leads (destination_country);
create index if not exists leads_target_model_idx on public.leads (target_model);
create index if not exists leads_stage_idx on public.leads (stage);

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
  completed boolean not null default false,
  last_inquiry_at timestamptz,
  next_follow_up_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists inquiry_events_created_at_idx on public.inquiry_events (created_at desc);

-- RLS: enable on tables
alter table public.leads enable row level security;
alter table public.inquiry_events enable row level security;

-- RLS: authenticated users can CRUD their own rows
create policy "Users can manage own leads" on public.leads
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can manage own inquiries" on public.inquiry_events
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- auto-update updated_at
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists leads_updated_at on public.leads;
create trigger leads_updated_at
  before update on public.leads
  for each row execute function public.update_updated_at();
