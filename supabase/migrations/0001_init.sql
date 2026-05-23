-- Tug of War 1v1: schema, RLS, RPCs
-- Run in Supabase SQL Editor or via `supabase db push`.

------------------------------------------------------------
-- EXTENSIONS
------------------------------------------------------------
create extension if not exists pgcrypto;

------------------------------------------------------------
-- TABLES
------------------------------------------------------------
create table if not exists public.sessions (
  id              uuid primary key default gen_random_uuid(),
  code            text not null unique,
  teacher_id      uuid not null references auth.users(id) on delete cascade,
  status          text not null default 'waiting'
                  check (status in ('waiting','active','finished')),
  winning_score   int  not null default 5,
  blue_score      int  not null default 0,
  red_score       int  not null default 0,
  current_team    text not null default 'blue'
                  check (current_team in ('blue','red')),
  current_problem jsonb,
  winner          text check (winner in ('blue','red')),
  created_at      timestamptz not null default now(),
  started_at      timestamptz,
  ended_at        timestamptz
);

create index if not exists sessions_teacher_idx on public.sessions(teacher_id);
create index if not exists sessions_code_idx on public.sessions(code);

create table if not exists public.players (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references public.sessions(id) on delete cascade,
  nickname    text not null,
  team        text not null check (team in ('blue','red')),
  joined_at   timestamptz not null default now(),
  connected   bool not null default true,
  unique (session_id, team)
);

create index if not exists players_session_idx on public.players(session_id);

------------------------------------------------------------
-- PROBLEM GENERATOR (port of generateProblem in TS)
------------------------------------------------------------
create or replace function public.generate_problem()
returns jsonb
language plpgsql
as $$
declare
  ops text[] := array['+','-','×'];
  op  text;
  n1  int;
  n2  int;
  ans int;
begin
  op := ops[1 + floor(random() * 3)::int];
  if op = '+' then
    n1 := 1 + floor(random() * 10)::int;
    n2 := 1 + floor(random() * 10)::int;
    ans := n1 + n2;
  elsif op = '-' then
    n1 := 5 + floor(random() * 10)::int;
    n2 := floor(random() * n1)::int;
    ans := n1 - n2;
  else
    n1 := 1 + floor(random() * 5)::int;
    n2 := 1 + floor(random() * 5)::int;
    ans := n1 * n2;
  end if;
  return jsonb_build_object('num1', n1, 'num2', n2, 'operator', op, 'answer', ans);
end;
$$;

------------------------------------------------------------
-- CODE GENERATOR (6 chars, no ambiguous 0/O/1/I/L)
------------------------------------------------------------
create or replace function public.generate_session_code()
returns text
language plpgsql
as $$
declare
  alphabet text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  code text := '';
  i int;
begin
  for i in 1..6 loop
    code := code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
  end loop;
  return code;
end;
$$;

------------------------------------------------------------
-- CREATE SESSION (called by authenticated teacher)
------------------------------------------------------------
create or replace function public.create_session()
returns public.sessions
language plpgsql
security definer
set search_path = public
as $$
declare
  new_code text;
  attempt int := 0;
  s public.sessions;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  loop
    attempt := attempt + 1;
    new_code := generate_session_code();
    begin
      insert into public.sessions (code, teacher_id, current_problem)
      values (new_code, auth.uid(), generate_problem())
      returning * into s;
      return s;
    exception when unique_violation then
      if attempt > 10 then
        raise exception 'could_not_generate_code';
      end if;
    end;
  end loop;
end;
$$;

------------------------------------------------------------
-- JOIN SESSION (anon-callable)
------------------------------------------------------------
create or replace function public.join_session(p_code text, p_nickname text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  s public.sessions;
  taken_blue boolean;
  taken_red  boolean;
  assigned_team text;
  new_player public.players;
  clean_nick text;
begin
  clean_nick := trim(p_nickname);
  if clean_nick is null or length(clean_nick) = 0 then
    raise exception 'invalid_nickname';
  end if;
  if length(clean_nick) > 24 then
    clean_nick := substr(clean_nick, 1, 24);
  end if;

  select * into s from public.sessions where code = upper(p_code) for update;
  if not found then
    raise exception 'invalid_session';
  end if;
  if s.status <> 'waiting' then
    raise exception 'session_not_waiting';
  end if;

  select
    bool_or(team = 'blue'),
    bool_or(team = 'red')
    into taken_blue, taken_red
  from public.players
  where session_id = s.id;

  if coalesce(taken_blue, false) = false then
    assigned_team := 'blue';
  elsif coalesce(taken_red, false) = false then
    assigned_team := 'red';
  else
    raise exception 'session_full';
  end if;

  insert into public.players (session_id, nickname, team)
  values (s.id, clean_nick, assigned_team)
  returning * into new_player;

  return jsonb_build_object(
    'player_id', new_player.id,
    'session_id', s.id,
    'team', new_player.team,
    'nickname', new_player.nickname,
    'code', s.code
  );
end;
$$;

------------------------------------------------------------
-- START SESSION (teacher)
------------------------------------------------------------
create or replace function public.start_session(p_session_id uuid)
returns public.sessions
language plpgsql
security definer
set search_path = public
as $$
declare
  s public.sessions;
  player_count int;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  select * into s from public.sessions
   where id = p_session_id and teacher_id = auth.uid()
   for update;
  if not found then
    raise exception 'session_not_found';
  end if;
  if s.status <> 'waiting' then
    raise exception 'already_started';
  end if;

  select count(*) into player_count from public.players where session_id = s.id;
  if player_count < 2 then
    raise exception 'need_two_players';
  end if;

  update public.sessions
     set status = 'active',
         started_at = now(),
         current_problem = generate_problem()
   where id = s.id
   returning * into s;

  return s;
end;
$$;

------------------------------------------------------------
-- END SESSION (teacher cancels)
------------------------------------------------------------
create or replace function public.end_session(p_session_id uuid)
returns public.sessions
language plpgsql
security definer
set search_path = public
as $$
declare
  s public.sessions;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  update public.sessions
     set status = 'finished', ended_at = now()
   where id = p_session_id
     and teacher_id = auth.uid()
     and status <> 'finished'
   returning * into s;

  if not found then
    raise exception 'session_not_found';
  end if;
  return s;
end;
$$;

------------------------------------------------------------
-- SUBMIT ANSWER (player)
------------------------------------------------------------
create or replace function public.submit_answer(p_player_id uuid, p_answer int)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  s public.sessions;
  p public.players;
  is_correct boolean;
  new_blue int;
  new_red  int;
  new_team text;
  new_status text;
  new_winner text;
  new_problem jsonb;
begin
  select pl.* into p from public.players pl where pl.id = p_player_id;
  if not found then
    raise exception 'player_not_found';
  end if;

  select * into s from public.sessions where id = p.session_id for update;
  if s.status <> 'active' then
    raise exception 'not_active';
  end if;
  if p.team <> s.current_team then
    raise exception 'not_your_turn';
  end if;

  is_correct := (p_answer = (s.current_problem->>'answer')::int);

  new_blue := s.blue_score;
  new_red  := s.red_score;
  if is_correct then
    if p.team = 'blue' then new_blue := new_blue + 1; else new_red := new_red + 1; end if;
  end if;

  if new_blue >= s.winning_score then
    new_status := 'finished';
    new_winner := 'blue';
    new_team   := s.current_team;
    new_problem := s.current_problem;
  elsif new_red >= s.winning_score then
    new_status := 'finished';
    new_winner := 'red';
    new_team   := s.current_team;
    new_problem := s.current_problem;
  else
    new_status := 'active';
    new_winner := null;
    new_team   := case when s.current_team = 'blue' then 'red' else 'blue' end;
    new_problem := generate_problem();
  end if;

  update public.sessions
     set blue_score = new_blue,
         red_score  = new_red,
         current_team = new_team,
         current_problem = new_problem,
         status = new_status,
         winner = new_winner,
         ended_at = case when new_status = 'finished' then now() else ended_at end
   where id = s.id;

  return jsonb_build_object(
    'is_correct', is_correct,
    'status', new_status,
    'winner', new_winner
  );
end;
$$;

------------------------------------------------------------
-- RLS
------------------------------------------------------------
alter table public.sessions enable row level security;
alter table public.players  enable row level security;

-- Sessions: anyone (including anon) can read; only owner can mutate.
drop policy if exists sessions_select_all on public.sessions;
create policy sessions_select_all on public.sessions
  for select using (true);

drop policy if exists sessions_owner_modify on public.sessions;
create policy sessions_owner_modify on public.sessions
  for all using (teacher_id = auth.uid()) with check (teacher_id = auth.uid());

-- Players: anyone can read. Direct insert/update by clients is disabled —
-- joining is done through the join_session RPC (security definer). Teacher
-- can manage rows in their own sessions.
drop policy if exists players_select_all on public.players;
create policy players_select_all on public.players
  for select using (true);

drop policy if exists players_teacher_manage on public.players;
create policy players_teacher_manage on public.players
  for all using (
    exists (
      select 1 from public.sessions s
      where s.id = players.session_id and s.teacher_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.sessions s
      where s.id = players.session_id and s.teacher_id = auth.uid()
    )
  );

------------------------------------------------------------
-- EXECUTE GRANTS
------------------------------------------------------------
grant execute on function public.create_session()                       to authenticated;
grant execute on function public.start_session(uuid)                    to authenticated;
grant execute on function public.end_session(uuid)                      to authenticated;
grant execute on function public.join_session(text, text)               to anon, authenticated;
grant execute on function public.submit_answer(uuid, int)               to anon, authenticated;

------------------------------------------------------------
-- REALTIME PUBLICATION
------------------------------------------------------------
-- Enable Realtime on both tables (idempotent: ignore if already added).
do $$
begin
  begin
    execute 'alter publication supabase_realtime add table public.sessions';
  exception when duplicate_object then null;
  end;
  begin
    execute 'alter publication supabase_realtime add table public.players';
  exception when duplicate_object then null;
  end;
end $$;
