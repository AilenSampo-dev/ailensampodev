-- Calendario de contenido compartido por link (ERP app.ailensampo.com).
-- Correr una vez en Supabase → SQL Editor. Solo el servidor (service role) accede: RLS activo y sin políticas.

create table if not exists public.calendario_accesos (
  token          text primary key,
  nombre         text not null,
  activo         boolean not null default true,
  created_at     timestamptz not null default now(),
  ultimo_acceso  timestamptz
);

create table if not exists public.calendario_comentarios (
  id          bigint generated always as identity primary key,
  pieza_id    text not null,
  token       text references public.calendario_accesos (token) on delete set null,
  autor       text not null,
  texto       text not null,
  resuelto    boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists calendario_comentarios_pieza_idx on public.calendario_comentarios (pieza_id, created_at);

alter table public.calendario_accesos enable row level security;
alter table public.calendario_comentarios enable row level security;
