create extension if not exists vector;
create schema if not exists private;

alter table public.profiles add column if not exists display_name text;
alter table public.profiles add column if not exists intent text;
alter table public.profiles add column if not exists personality_type text;
alter table public.profiles add column if not exists interests text[] not null default '{}';
alter table public.profiles add column if not exists photo_url text;
alter table public.profiles add column if not exists embedding vector(1536);
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

update public.profiles
set display_name = coalesce(display_name, full_name, username),
    intent = coalesce(intent, interested_in, 'Intentional dating'),
    photo_url = coalesce(photo_url, avatar_url),
    personality_type = coalesce(personality_type, 'ENFP')
where display_name is null
   or intent is null
   or photo_url is null
   or personality_type is null;

create index if not exists profiles_embedding_idx
  on public.profiles using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

create index if not exists likes_liker_idx on public.likes (liker_id);
create index if not exists likes_liked_idx on public.likes (liked_id);
create unique index if not exists likes_unique_pair_idx on public.likes (liker_id, liked_id);
create unique index if not exists matches_unique_pair_idx on public.matches (least(user1_id, user2_id), greatest(user1_id, user2_id));
create index if not exists messages_match_created_idx on public.messages (match_id, created_at);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create or replace function private.create_match_for_like()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  low_user uuid;
  high_user uuid;
begin
  if exists (
    select 1 from public.likes
    where liker_id = new.liked_id
      and liked_id = new.liker_id
  ) then
    low_user := least(new.liker_id, new.liked_id);
    high_user := greatest(new.liker_id, new.liked_id);
    insert into public.matches (user1_id, user2_id)
    values (low_user, high_user)
    on conflict do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists likes_create_match on public.likes;
create trigger likes_create_match
after insert on public.likes
for each row execute function private.create_match_for_like();

create or replace function public.match_profiles(limit_count int default 20)
returns table (
  id uuid,
  display_name text,
  age int,
  city text,
  intent text,
  personality_type text,
  bio text,
  interests text[],
  photo_url text,
  compatibility numeric
)
language sql
stable
as $$
  with me as (
    select * from public.profiles where id = (select auth.uid())
  )
  select
    p.id,
    coalesce(p.display_name, p.full_name, p.username) as display_name,
    p.age,
    p.city,
    coalesce(p.intent, p.interested_in, 'Intentional dating') as intent,
    coalesce(p.personality_type, 'ENFP') as personality_type,
    p.bio,
    coalesce(p.interests, '{}') as interests,
    coalesce(p.photo_url, p.avatar_url) as photo_url,
    case
      when p.embedding is not null and me.embedding is not null
        then round(((1 - (p.embedding <=> me.embedding)) * 100)::numeric, 1)
      else 70
    end as compatibility
  from public.profiles p, me
  where p.id <> me.id
    and not exists (
      select 1 from public.likes l
      where l.liker_id = me.id and l.liked_id = p.id
    )
  order by
    case when p.embedding is not null and me.embedding is not null then p.embedding <=> me.embedding else 1 end,
    p.updated_at desc
  limit limit_count;
$$;

insert into storage.buckets (id, name, public)
values ('profile-photos', 'profile-photos', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "profile photos are publicly readable" on storage.objects;
create policy "profile photos are publicly readable"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'profile-photos');

drop policy if exists "users upload their own profile photos" on storage.objects;
create policy "users upload their own profile photos"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'profile-photos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "users update their own profile photos" on storage.objects;
create policy "users update their own profile photos"
on storage.objects for update
to authenticated
using (
  bucket_id = 'profile-photos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'profile-photos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
