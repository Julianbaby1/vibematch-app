drop trigger if exists mutual_like_creates_match on public.likes;
drop function if exists public.create_match_when_mutual_like();

alter function public.match_profiles(int) set search_path = public, extensions;
alter function public.set_updated_at() set search_path = public;
alter function private.create_match_for_like() set search_path = public;

alter extension vector set schema extensions;

drop policy if exists "profile photos are publicly readable" on storage.objects;

drop index if exists public.likes_unique_pair_idx;
create index if not exists matches_user1_id_idx on public.matches (user1_id);
create index if not exists matches_user2_id_idx on public.matches (user2_id);
create index if not exists messages_sender_id_idx on public.messages (sender_id);

alter policy "Users can insert their own profile"
on public.profiles
with check ((select auth.uid()) = id);

alter policy "Users can update their own profile"
on public.profiles
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

alter policy "Users can like other users"
on public.likes
with check ((select auth.uid()) = liker_id);

alter policy "Users can view likes involving them"
on public.likes
using ((select auth.uid()) = liker_id or (select auth.uid()) = liked_id);

alter policy "Users can view their matches"
on public.matches
using ((select auth.uid()) = user1_id or (select auth.uid()) = user2_id);

alter policy "Users can view messages in their matches"
on public.messages
using (
  exists (
    select 1 from public.matches
    where public.matches.id = public.messages.match_id
      and (public.matches.user1_id = (select auth.uid()) or public.matches.user2_id = (select auth.uid()))
  )
);

alter policy "Users can send messages in their matches"
on public.messages
with check (
  (select auth.uid()) = sender_id
  and exists (
    select 1 from public.matches
    where public.matches.id = public.messages.match_id
      and (public.matches.user1_id = (select auth.uid()) or public.matches.user2_id = (select auth.uid()))
  )
);
