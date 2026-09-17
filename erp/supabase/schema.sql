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

-- Huellas SHA-256 de contratos y addendums (persisten aunque se restaure un backup)
create table if not exists public.erp_firmas (
  id uuid primary key default gen_random_uuid(),
  proyecto_id text not null,
  cliente_id text,
  tipo text not null check (tipo in ('contrato', 'addendum')),
  documento_id text not null default '',
  content_hash text not null,
  typed_name text,
  client_email text,
  accepted_at timestamptz,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists erp_firmas_lookup_idx
  on public.erp_firmas (proyecto_id, tipo, documento_id);

create index if not exists erp_firmas_proyecto_idx
  on public.erp_firmas (proyecto_id);

alter table public.erp_firmas enable row level security;

-- Sin políticas para anon/authenticated: solo service_role (API del servidor) accede.
