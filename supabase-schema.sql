-- ============================================================
-- AUTONOMO NO CONTROLE - banco externo (Supabase / Postgres)
-- Rode este SQL no editor SQL do Supabase antes do primeiro deploy.
-- Espelha as tabelas do sistema. A primeira conta criada pelo
-- cadastro vira administradora (role = 'admin', access_status = 'active').
-- ============================================================

create table if not exists users (
  id bigint generated always as identity primary key,
  name text not null,
  email text not null unique,
  password_hash text not null,
  salt text not null,
  role text not null default 'user',
  access_status text not null default 'pending',
  profession text not null default '',
  safety_margin_percent integer not null default 20,
  reset_code text,
  reset_expires bigint,
  created_at timestamptz not null default now()
);

create table if not exists sessions (
  id bigint generated always as identity primary key,
  user_id bigint not null,
  token text not null unique,
  expires_at bigint not null,
  created_at timestamptz not null default now()
);

create table if not exists atendimentos (
  id bigint generated always as identity primary key,
  user_id bigint not null,
  date text not null,
  client_name text not null,
  service text not null,
  amount_cents integer not null,
  payment_method text not null default 'Pix',
  status text not null default 'pago',
  notes text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists despesas (
  id bigint generated always as identity primary key,
  user_id bigint not null,
  description text not null,
  amount_cents integer not null,
  category text not null default 'Outras',
  due_date text not null,
  paid_date text,
  status text not null default 'pendente',
  notes text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists reservas (
  id bigint generated always as identity primary key,
  user_id bigint not null,
  name text not null,
  category text not null default 'Outros',
  target_cents integer not null default 0,
  notes text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists reserva_movimentos (
  id bigint generated always as identity primary key,
  reserva_id bigint not null,
  user_id bigint not null,
  type text not null,
  amount_cents integer not null,
  date text not null,
  notes text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists retiradas (
  id bigint generated always as identity primary key,
  user_id bigint not null,
  amount_cents integer not null,
  date text not null,
  notes text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists payment_events (
  id bigint generated always as identity primary key,
  user_id bigint,
  email text not null default '',
  gateway text not null default 'Cakto',
  external_id text not null unique,
  status text not null,
  amount_cents integer not null default 3700,
  created_at timestamptz not null default now()
);

create table if not exists settings (
  key text primary key,
  value text not null
);

create table if not exists support_tickets (
  id bigint generated always as identity primary key,
  user_id bigint,
  name text not null default '',
  email text not null default '',
  subject text not null,
  message text not null,
  status text not null default 'aberto',
  created_at timestamptz not null default now()
);
