-- ============================================================================
-- ShuttlePulse Badminton Club — Supabase PostgreSQL Schema
-- Paste and run this entire script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql
-- ============================================================================

-- 1. Club Users Table (Admin & Playing Members)
create table if not exists public.sp_users (
  id text primary key,
  name text not null,
  email text unique not null,
  password text not null,
  role text not null check (role in ('admin', 'member')),
  tokens numeric not null default 500,
  avatar_color text not null default 'from-emerald-500 to-teal-600',
  avatar_url text,
  joined_at text not null,
  play_style text
);

-- Seed Default Club Admin Account (Name: Admin)
insert into public.sp_users (id, name, email, password, role, tokens, avatar_color, joined_at, play_style)
values (
  'admin-1',
  'Admin',
  'admin@shuttlepulse.com',
  'Admin@123',
  'admin',
  0,
  'from-emerald-700 to-teal-800',
  '2026-11-01',
  'Club Management'
)
on conflict (id) do nothing;

-- 2. Regular Attendance & Shuttle Cost Split Sessions Table
create table if not exists public.sp_sessions (
  id text primary key,
  date text not null,
  title text not null,
  shuttle_cost numeric not null,
  present_count integer not null,
  cost_per_member numeric not null,
  records jsonb not null default '[]'::jsonb,
  created_at text not null
);

-- 3. 25-Question Weekly Peer Survey Ratings Table (Permanent / Non-Updatable)
create table if not exists public.sp_ratings (
  id text primary key,
  week_key text not null,
  week_label text not null,
  month_key text not null,
  rater_id text not null,
  target_member_id text not null,
  question_scores jsonb not null default '{}'::jsonb,
  scores jsonb not null default '{}'::jsonb,
  overall_score numeric not null,
  comment text,
  created_at text not null,
  unique (week_key, rater_id, target_member_id)
);

-- 4. Public Donations Table (Supports Multiple Donations per Member)
create table if not exists public.sp_donations (
  id text primary key,
  member_id text not null,
  member_name text not null,
  member_email text not null,
  avatar_color text not null,
  avatar_url text,
  amount numeric not null,
  purpose text not null,
  note text,
  date text not null,
  added_by_admin text not null
);

-- 5. Token Transactions Ledger Table
create table if not exists public.sp_transactions (
  id text primary key,
  member_id text not null,
  member_name text not null,
  amount numeric not null,
  type text not null,
  description text not null,
  date text not null
);

-- 6. Club Authority 25 Survey Questions Configuration Table
create table if not exists public.sp_questions (
  id text primary key,
  number integer not null,
  category text not null,
  text text not null
);

-- Enable Row Level Security (RLS) with open club policy so Web & Mobile App can sync
alter table public.sp_users enable row level security;
alter table public.sp_sessions enable row level security;
alter table public.sp_ratings enable row level security;
alter table public.sp_donations enable row level security;
alter table public.sp_transactions enable row level security;
alter table public.sp_questions enable row level security;

create policy "Allow public access to sp_users" on public.sp_users for all using (true) with check (true);
create policy "Allow public access to sp_sessions" on public.sp_sessions for all using (true) with check (true);
create policy "Allow public access to sp_ratings" on public.sp_ratings for all using (true) with check (true);
create policy "Allow public access to sp_donations" on public.sp_donations for all using (true) with check (true);
create policy "Allow public access to sp_transactions" on public.sp_transactions for all using (true) with check (true);
create policy "Allow public access to sp_questions" on public.sp_questions for all using (true) with check (true);
