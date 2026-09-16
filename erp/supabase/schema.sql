-- ERP Ailen Sampo: tabla de respaldo
-- Ejecutá en Supabase → SQL Editor

create table if not exists public.erp_backup (
  id text primary key,
  clientes jsonb not null default '[]'::jsonb,
  proyectos jsonb not null default '[]'::jsonb,
  data_version integer not null default 2,
  updated_at timestamptz not null default now()
);

insert into public.erp_backup (id, clientes, proyectos, data_version)
values ('main', '[]'::jsonb, '[]'::jsonb, 2)
on conflict (id) do nothing;

alter table public.erp_backup enable row level security;

-- Historial automático (snapshots antes de cada guardado)
create table if not exists public.erp_backup_history (
  id uuid primary key default gen_random_uuid(),
  clientes jsonb not null default '[]'::jsonb,
  proyectos jsonb not null default '[]'::jsonb,
  data_version integer not null default 2,
  source text not null default 'auto',
  clientes_count integer not null default 0,
  proyectos_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists erp_backup_history_created_at_idx
  on public.erp_backup_history (created_at desc);

alter table public.erp_backup_history enable row level security;

-- Sin políticas para anon/authenticated: solo service_role (API del servidor) accede.
