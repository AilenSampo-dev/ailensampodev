-- Registro inmutable de huellas SHA-256 (contratos y addendums firmados)
-- Ejecutá en Supabase → SQL Editor (después de schema.sql)

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
