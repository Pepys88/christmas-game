-- Run this whole file in Supabase: SQL Editor -> New query -> Run

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  username text unique not null check (username ~ '^[a-z0-9_]{3,20}$'),
  display_name text not null,
  created_at timestamptz default now()
);

create table items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  url text,
  price text,
  created_at timestamptz default now()
);

create table claims (
  item_id uuid primary key references items on delete cascade, -- one claim per gift
  claimed_by uuid not null references profiles on delete cascade,
  created_at timestamptz default now()
);

alter table profiles enable row level security;
alter table items enable row level security;
alter table claims enable row level security;

-- Profiles: any signed-in user can see everyone; you edit only your own
create policy "profiles read" on profiles for select to authenticated using (true);
create policy "profiles update own" on profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- Items: everyone signed in can read; only the owner can add/remove their own
create policy "items read" on items for select to authenticated using (true);
create policy "items insert own" on items for insert to authenticated with check (owner_id = auth.uid());
create policy "items update own" on items for update to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "items delete own" on items for delete to authenticated using (owner_id = auth.uid());

-- Claims: you can only SEE your own claims, so nobody (including the list owner) can see who claimed what.
create policy "claims read own" on claims for select to authenticated using (claimed_by = auth.uid());
create policy "claims insert" on claims for insert to authenticated with check (
  claimed_by = auth.uid()
  and not exists (select 1 from items i where i.id = item_id and i.owner_id = auth.uid()) -- can't claim your own
);
create policy "claims delete own" on claims for delete to authenticated using (claimed_by = auth.uid());

-- Anyone signed in (including the owner) can ask WHICH of a person's items are claimed, never by whom
create or replace function claimed_item_ids(p_owner uuid)
returns setof uuid language sql stable security definer set search_path = public as $$
  select c.item_id from claims c join items i on i.id = c.item_id where i.owner_id = p_owner;
$$;
revoke all on function claimed_item_ids(uuid) from public;
grant execute on function claimed_item_ids(uuid) to authenticated;

-- Lets the signup form check a username before the account exists
create or replace function username_available(u text)
returns boolean language sql stable security definer set search_path = public as $$
  select not exists (select 1 from profiles where username = lower(u));
$$;
grant execute on function username_available(text) to anon, authenticated;

-- Auto-create a profile when someone signs up
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, username, display_name)
  values (
    new.id,
    lower(new.raw_user_meta_data->>'username'),
    coalesce(nullif(new.raw_user_meta_data->>'display_name', ''), new.raw_user_meta_data->>'username')
  );
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();
