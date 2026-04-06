-- MyDay Database Schema
-- Run this in Supabase SQL Editor to set up the database.
-- Requires Supabase Auth to be enabled (email/password).

-- ============================================================
-- SUBJECTS
-- ============================================================
create table subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  color text not null,
  type text not null check (type in ('GK', 'LK')),
  created_at timestamptz default now()
);

alter table subjects enable row level security;
create policy "Users can CRUD own subjects" on subjects
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- TIMETABLE
-- ============================================================
create table timetable_slots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  day text not null check (day in ('mo', 'di', 'mi', 'do', 'fr')),
  period int not null,
  subject_id uuid references subjects(id) on delete cascade not null,
  unique(user_id, day, period)
);

alter table timetable_slots enable row level security;
create policy "Users can CRUD own timetable" on timetable_slots
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- GRADES
-- ============================================================
create table grades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  subject_id uuid references subjects(id) on delete cascade not null,
  semester text not null check (semester in ('Q1', 'Q2', 'Q3', 'Q4')),
  type text not null check (type in ('allgemein', 'klausur')),
  points int not null check (points >= 0 and points <= 15),
  weight numeric not null,
  label text,
  created_at timestamptz default now()
);

alter table grades enable row level security;
create policy "Users can CRUD own grades" on grades
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- DEADLINES
-- ============================================================
create table deadlines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  subject_id uuid references subjects(id) on delete cascade not null,
  title text not null,
  type text not null check (type in ('klausur', 'hausaufgabe', 'referat', 'abgabe')),
  due_date date not null,
  notes text,
  created_at timestamptz default now()
);

alter table deadlines enable row level security;
create policy "Users can CRUD own deadlines" on deadlines
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- GYM DAYS (which courses the user added to their day)
-- ============================================================
create table my_gym_days (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null,
  course_id text not null,
  unique(user_id, date, course_id)
);

alter table my_gym_days enable row level security;
create policy "Users can CRUD own gym days" on my_gym_days
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- MATERIALS (metadata; files stored in Supabase Storage)
-- ============================================================
create table materials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  mime_type text not null,
  size int not null,
  linked_type text not null check (linked_type in ('timetable', 'deadline')),
  linked_id text not null,
  storage_path text not null,
  created_at timestamptz default now()
);

alter table materials enable row level security;
create policy "Users can CRUD own materials" on materials
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- STORAGE BUCKET for material files
-- ============================================================
insert into storage.buckets (id, name, public) values ('materials', 'materials', false);

create policy "Users can upload own materials" on storage.objects
  for insert with check (bucket_id = 'materials' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can read own materials" on storage.objects
  for select using (bucket_id = 'materials' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can delete own materials" on storage.objects
  for delete using (bucket_id = 'materials' and auth.uid()::text = (storage.foldername(name))[1]);
