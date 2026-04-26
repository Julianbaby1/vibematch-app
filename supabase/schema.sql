-- VibeMatch Supabase schema
-- Run this in Supabase SQL Editor.

create extension if not exists "uuid-ossp";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  age int check (age >= 18 and age <= 120),
  city text not null,
  bio text,
  photo_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.swipes (
  id uuid primary key default uuid_generate_v4(),
  swiper_id uuid not null references auth.users(id) on delete cascade,
  swiped_id uuid not null references public.profiles(id) on delete cascade,
  action text not null check (action in ('like', 'pass')),
  created_at timestamptz default now(),
  unique (swiper_id, swiped_id)
);

create table if not exists public.matches (
  id uuid primary key default uuid_generate_v4(),
  user_one uuid not null references auth.users(id) on delete cascade,
  user_two uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  unique (user_one, user_two),
  check (user_one <> user_two)
);

create table if not exists public.messages (
  id uuid primary key default uuid_generate_v4(),
  match_id uuid not null references public.matches(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  created_at timestamptz default now()
);

create table if not exists public.typing_status (
  match_id uuid not null references public.matches(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  is_typing boolean default false,
  updated_at timestamptz default now(),
  primary key (match_id, user_id)
);

alter table public.profiles enable row level security;
alter table public.swipes enable row level security;
alter table public.matches enable row level security;
alter table public.messages enable row level security;
alter table public.typing_status enable row level security;

create policy "profiles are viewable" on public.profiles for select using (true);
create policy "users can insert their profile" on public.profiles for insert with check (auth.uid() = id);
create policy "users can update their profile" on public.profiles for update using (auth.uid() = id);

create policy "users can view their swipes" on public.swipes for select using (auth.uid() = swiper_id);
create policy "users can create swipes" on public.swipes for insert with check (auth.uid() = swiper_id);
create policy "users can update their swipes" on public.swipes for update using (auth.uid() = swiper_id);

create policy "users can view their matches" on public.matches
for select using (auth.uid() = user_one or auth.uid() = user_two);
create policy "users can create matches" on public.matches
for insert with check (auth.uid() = user_one or auth.uid() = user_two);

create policy "users can view messages in their matches" on public.messages
for select using (
  exists (
    select 1 from public.matches
    where matches.id = messages.match_id
    and (matches.user_one = auth.uid() or matches.user_two = auth.uid())
  )
);

create policy "users can send messages in their matches" on public.messages
for insert with check (
  sender_id = auth.uid()
  and exists (
    select 1 from public.matches
    where matches.id = messages.match_id
    and (matches.user_one = auth.uid() or matches.user_two = auth.uid())
  )
);

create policy "users can view typing in their matches" on public.typing_status
for select using (
  exists (
    select 1 from public.matches
    where matches.id = typing_status.match_id
    and (matches.user_one = auth.uid() or matches.user_two = auth.uid())
  )
);

create policy "users can update their typing" on public.typing_status
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values ('profile-photos', 'profile-photos', true)
on conflict (id) do nothing;

create policy "profile photos are public" on storage.objects
for select using (bucket_id = 'profile-photos');

create policy "users can upload profile photos" on storage.objects
for insert with check (
  bucket_id = 'profile-photos'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "users can update their profile photos" on storage.objects
for update using (
  bucket_id = 'profile-photos'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "users can delete their profile photos" on storage.objects
for delete using (
  bucket_id = 'profile-photos'
  and auth.uid()::text = (storage.foldername(name))[1]
);
