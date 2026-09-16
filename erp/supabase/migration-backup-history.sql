-- Historial automático de backups ERP
-- Ejecutá en Supabase → SQL Editor (después de schema.sql)

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
