-- Add game_mode to sessions and update RPCs accordingly.
-- Run in Supabase SQL Editor after 0001_init.sql.

------------------------------------------------------------
-- NEW COLUMN
------------------------------------------------------------
alter table public.sessions
  add column if not exists game_mode text not null default 'turns'
  check (game_mode in ('turns', 'speed'));

------------------------------------------------------------
-- UPDATED create_session (accepts p_game_mode)
------------------------------------------------------------
create or replace function public.create_session(p_game_mode text default 'turns')
returns public.sessions
language plpgsql
security definer
set search_path = public
as $$
declare
  new_code text;
  attempt  int := 0;
  s        public.sessions;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;
  if p_game_mode not in ('turns', 'speed') then
    raise exception 'invalid_game_mode';
  end if;

  loop
    attempt := attempt + 1;
    new_code := generate_session_code();
    begin
      insert into public.sessions (code, teacher_id, current_problem, game_mode)
      values (new_code, auth.uid(), generate_problem(), p_game_mode)
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
-- UPDATED submit_answer (speed-mode aware)
--
-- TURNS mode (existing behaviour):
--   · Only the current team may answer.
--   · Correct  → +1 point, flip team, new problem.
--   · Wrong    → flip team, new problem (no penalty).
--
-- SPEED mode (new):
--   · Both players may answer any time.
--   · Correct  → +1 point, update current_team to winner, new problem.
--   · Wrong    → no state change; the other player can still answer.
------------------------------------------------------------
create or replace function public.submit_answer(p_player_id uuid, p_answer int)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  s          public.sessions;
  p          public.players;
  is_correct boolean;
  new_blue   int;
  new_red    int;
  new_team   text;
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

  -- Turn restriction only applies to turns mode
  if s.game_mode = 'turns' and p.team <> s.current_team then
    raise exception 'not_your_turn';
  end if;

  is_correct := (p_answer = (s.current_problem->>'answer')::int);

  -- Speed mode: wrong answer → no change at all, return early
  if s.game_mode = 'speed' and not is_correct then
    return jsonb_build_object(
      'is_correct', false,
      'status', s.status,
      'winner', null
    );
  end if;

  -- From here: either correct answer (any mode), or wrong answer in turns mode
  new_blue := s.blue_score;
  new_red  := s.red_score;

  if is_correct then
    if p.team = 'blue' then new_blue := new_blue + 1;
    else                     new_red  := new_red  + 1;
    end if;
  end if;

  -- Determine new game status
  if new_blue >= s.winning_score then
    new_status  := 'finished';
    new_winner  := 'blue';
    new_team    := 'blue';
    new_problem := s.current_problem;
  elsif new_red >= s.winning_score then
    new_status  := 'finished';
    new_winner  := 'red';
    new_team    := 'red';
    new_problem := s.current_problem;
  else
    new_status  := 'active';
    new_winner  := null;
    new_problem := generate_problem();
    if s.game_mode = 'speed' then
      -- current_team tracks who scored last (for presenter display)
      new_team := p.team;
    else
      -- turns: always flip
      new_team := case when s.current_team = 'blue' then 'red' else 'blue' end;
    end if;
  end if;

  update public.sessions
     set blue_score      = new_blue,
         red_score       = new_red,
         current_team    = new_team,
         current_problem = new_problem,
         status          = new_status,
         winner          = new_winner,
         ended_at        = case when new_status = 'finished' then now() else ended_at end
   where id = s.id;

  return jsonb_build_object(
    'is_correct', is_correct,
    'status',     new_status,
    'winner',     new_winner
  );
end;
$$;
