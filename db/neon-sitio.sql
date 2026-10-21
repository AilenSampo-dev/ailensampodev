-- Base del sitio ailensampo.com (Neon). Correr una vez en Neon → SQL Editor.
-- consultas: cada arquitectura generada en el demo "Te lo demuestro".
-- leads: cada persona que dejó su mail para recibir el PDF. Las lee el ERP (app.ailensampo.com).

create table if not exists consultas (
  id          uuid primary key,
  created_at  timestamptz not null default now(),
  tarea       text not null,
  fuente      text not null check (fuente in ('ia', 'reglas')),
  modulos     jsonb not null,          -- [{label, title, desc}]
  resumen     text,
  visitante   text                     -- hash anónimo, nunca la IP
);
create index if not exists consultas_created_at_idx on consultas (created_at desc);

create table if not exists leads (
  id              bigint generated always as identity primary key,
  created_at      timestamptz not null default now(),
  email           text not null,
  consulta_id     uuid references consultas (id),
  tarea           text,
  modulos         jsonb,
  resumen         text,
  estado          text not null default 'nuevo'
                  check (estado in ('nuevo', 'contactado', 'convertido', 'descartado')),
  pdf_enviado_at  timestamptz,
  notas           text,
  visitante       text
);
create index if not exists leads_estado_idx on leads (estado, created_at desc);
create unique index if not exists leads_email_consulta_idx on leads (lower(email), consulta_id);
