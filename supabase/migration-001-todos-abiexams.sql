-- Migration: Add todos, abi_exams tables and deadlines.done column
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/rqpulmgnyhzjifeeanzm/sql

-- ============================================================
-- TODOS (daily to-do items)
-- ============================================================
create table if not exists todos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  text text not null,
  done boolean not null default false,
  date date not null,
  created_at timestamptz default now()
);

alter table todos enable row level security;
create policy "Users can CRUD own todos" on todos
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- ABI EXAMS (Abiturprüfungen Block II)
-- ============================================================
create table if not exists abi_exams (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  subject_id uuid references subjects(id) on delete cascade not null,
  type text not null check (type in ('written', 'oral')),
  points int check (points >= 0 and points <= 15),
  created_at timestamptz default now()
);

alter table abi_exams enable row level security;
create policy "Users can CRUD own abi exams" on abi_exams
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- DEADLINES: add 'done' column + new types (test, lek)
-- ============================================================
alter table deadlines add column if not exists done boolean not null default false;

-- Expand the type check constraint to include 'test' and 'lek'
alter table deadlines drop constraint if exists deadlines_type_check;
alter table deadlines add constraint deadlines_type_check
  check (type in ('klausur', 'hausaufgabe', 'referat', 'abgabe', 'test', 'lek'));
