-- Topics, question bank, new game modes (countdown + rounds), timer support.
-- Run AFTER 0001_init.sql and 0002_game_mode.sql.

------------------------------------------------------------
-- EXTEND game_mode CONSTRAINT
------------------------------------------------------------
alter table public.sessions drop constraint if exists sessions_game_mode_check;
alter table public.sessions
  add constraint sessions_game_mode_check
  check (game_mode in ('turns','speed','countdown','rounds'));

------------------------------------------------------------
-- NEW COLUMNS ON sessions
------------------------------------------------------------
alter table public.sessions
  add column if not exists category          text not null default 'math',
  add column if not exists time_per_question int  not null default 0,   -- 0 = no timer
  add column if not exists total_rounds      int  not null default 0,   -- 0 = first-to-N
  add column if not exists current_round     int  not null default 0,
  add column if not exists question_started_at timestamptz;

------------------------------------------------------------
-- QUESTIONS TABLE
------------------------------------------------------------
create table if not exists public.questions (
  id         uuid primary key default gen_random_uuid(),
  category   text not null,
  text       text not null,
  options    jsonb not null,   -- ["A","B","C","D"]
  correct    int  not null check (correct between 0 and 3),
  difficulty int  not null default 1 check (difficulty between 1 and 3)
);

create index if not exists questions_category_idx on public.questions(category);

------------------------------------------------------------
-- SEED: HISTORIA
------------------------------------------------------------
insert into public.questions (category, text, options, correct) values
('historia','¿En qué año llegó Cristóbal Colón a América?','["1398","1492","1521","1500"]',1),
('historia','¿Quién fue el primer presidente de México?','["Miguel Hidalgo","Benito Juárez","Guadalupe Victoria","Santa Anna"]',2),
('historia','¿Qué civilización construyó Machu Picchu?','["Maya","Azteca","Olmeca","Inca"]',3),
('historia','¿En qué año cayó el Muro de Berlín?','["1975","1991","1989","2001"]',2),
('historia','¿En qué país nació Simón Bolívar?','["Colombia","Ecuador","Venezuela","Perú"]',2),
('historia','¿Cómo se llamaba el barco principal de Colón?','["La Niña","La Pinta","San Juan","Santa María"]',3),
('historia','¿En qué año comenzó la Primera Guerra Mundial?','["1918","1914","1939","1905"]',1),
('historia','¿Qué cultura construyó las pirámides de Giza?','["Griega","Romana","Egipcia","Mesopotámica"]',2),
('historia','¿Cuándo ocurrió la Revolución Francesa?','["1776","1848","1815","1789"]',3),
('historia','¿Quién fue el libertador de Chile?','["Bernardo O''Higgins","Simón Bolívar","San Martín","Sucre"]',0),
('historia','¿Qué civilización inventó el papel?','["Griega","China","Árabe","Romana"]',1),
('historia','¿En qué año comenzó la Segunda Guerra Mundial?','["1935","1939","1941","1945"]',1),
('historia','¿Quién fue el faraón más famoso del antiguo Egipto?','["Ramsés II","Cleopatra","Tutankamón","Amenofis"]',2),
('historia','¿Qué país fue el primero en conceder el voto a la mujer?','["Australia","EE.UU.","Nueva Zelanda","Reino Unido"]',2);

------------------------------------------------------------
-- SEED: CIENCIAS NATURALES
------------------------------------------------------------
insert into public.questions (category, text, options, correct) values
('ciencias','¿Cuántos huesos tiene el cuerpo humano adulto?','["126","156","206","300"]',2),
('ciencias','¿Cuál es el planeta más grande del sistema solar?','["Saturno","Neptuno","Júpiter","Urano"]',2),
('ciencias','¿Qué gas producen las plantas en la fotosíntesis?','["CO₂","Nitrógeno","Oxígeno","Hidrógeno"]',2),
('ciencias','¿Cuántas patas tiene una araña?','["6","10","12","8"]',3),
('ciencias','¿Cuál es el animal más grande del mundo?','["Elefante africano","Tiburón ballena","Ballena azul","Jirafa"]',2),
('ciencias','¿Qué órgano del cuerpo produce insulina?','["Hígado","Riñón","Páncreas","Bazo"]',2),
('ciencias','¿Cuántos planetas tiene el sistema solar?','["7","9","10","8"]',3),
('ciencias','¿A qué velocidad viaja la luz (aproximada)?','["200,000 km/s","300,000 km/s","150,000 km/s","500,000 km/s"]',1),
('ciencias','¿Qué parte de la célula controla sus funciones?','["Membrana","Mitocondria","Núcleo","Ribosoma"]',2),
('ciencias','¿Cuántas cámaras tiene el corazón humano?','["2","3","4","5"]',2),
('ciencias','¿Cuál es el símbolo químico del agua?','["WA","HO","AH","H₂O"]',3),
('ciencias','¿Cuál es el elemento más ligero de la tabla periódica?','["Helio","Litio","Hidrógeno","Berilio"]',2),
('ciencias','¿En qué unidad se mide la corriente eléctrica?','["Voltio","Ohmio","Amperio","Watt"]',2),
('ciencias','¿Cuál es el proceso por el que el agua pasa de líquido a gas?','["Fusión","Condensación","Evaporación","Sublimación"]',2);

------------------------------------------------------------
-- SEED: GEOGRAFÍA
------------------------------------------------------------
insert into public.questions (category, text, options, correct) values
('geografia','¿Cuál es la capital de Australia?','["Sídney","Melbourne","Canberra","Brisbane"]',2),
('geografia','¿Cuál es el río más largo del mundo?','["Amazonas","Nilo","Yangtsé","Misisipi"]',1),
('geografia','¿En qué continente está Egipto?','["Asia","Europa","África","Oceanía"]',2),
('geografia','¿Cuál es el océano más grande?','["Atlántico","Índico","Ártico","Pacífico"]',3),
('geografia','¿Cuál es el país más grande del mundo por superficie?','["China","Canadá","Rusia","EE.UU."]',2),
('geografia','¿En qué país se encuentra la Torre Eiffel?','["Bélgica","Italia","Francia","España"]',2),
('geografia','¿Cuál es la montaña más alta del mundo?','["K2","Kangchenjunga","Lhotse","Everest"]',3),
('geografia','¿Cuál es la capital de Japón?','["Osaka","Kioto","Tokio","Hiroshima"]',2),
('geografia','¿Cuál es el desierto más grande del mundo?','["Gobi","Arábigo","Kalahari","Sahara"]',3),
('geografia','¿Cuál es la capital de Brasil?','["Río de Janeiro","São Paulo","Brasilia","Salvador"]',2),
('geografia','¿Qué continente tiene más países?','["Asia","Europa","América","África"]',3),
('geografia','¿En qué país se encuentra el río Amazonas principalmente?','["Colombia","Perú","Brasil","Venezuela"]',2),
('geografia','¿Cuál es la capital de Canadá?','["Toronto","Vancouver","Montreal","Ottawa"]',3),
('geografia','¿Cuántos países tiene América del Sur?','["10","12","13","14"]',1);

------------------------------------------------------------
-- SEED: LENGUA Y LITERATURA
------------------------------------------------------------
insert into public.questions (category, text, options, correct) values
('lengua','¿Quién escribió Don Quijote de la Mancha?','["Lope de Vega","Miguel de Cervantes","Federico García Lorca","Bécquer"]',1),
('lengua','¿Cuántas sílabas tiene "mariposa"?','["3","4","5","6"]',1),
('lengua','¿Cuál de estas palabras es un adverbio?','["correr","rápido","rápidamente","corredor"]',2),
('lengua','¿Quién escribió Cien años de soledad?','["Vargas Llosa","Pablo Neruda","García Márquez","Borges"]',2),
('lengua','¿Cuántas letras tiene el abecedario español?','["25","26","27","28"]',2),
('lengua','¿Qué figura retórica repite sonidos al inicio de palabras?','["Metáfora","Hipérbole","Aliteración","Símil"]',2),
('lengua','¿Quién escribió Rayuela?','["Julio Cortázar","Jorge Luis Borges","Octavio Paz","Carlos Fuentes"]',0),
('lengua','¿Qué obra de Shakespeare trata sobre los amantes de Verona?','["Otelo","Hamlet","Romeo y Julieta","Macbeth"]',2),
('lengua','¿Qué es un sinónimo?','["Palabra de significado opuesto","Palabra que suena igual","Palabra de significado similar","Palabra derivada"]',2),
('lengua','¿Cómo se llama la tilde que va sobre la ñ?','["Diéresis","Circunflejo","Tilde","Virgulilla"]',3),
('lengua','¿Qué tipo de oración es "¡Qué hermoso día!"?','["Interrogativa","Exclamativa","Imperativa","Declarativa"]',1),
('lengua','¿Cuál de estas palabras es un sustantivo abstracto?','["Mesa","Árbol","Libertad","Perro"]',2),
('lengua','¿Qué autor escribió La casa de Bernarda Alba?','["Cervantes","García Lorca","Machado","Unamuno"]',1),
('lengua','¿Cuántas vocales tiene el español?','["4","5","6","7"]',1);

------------------------------------------------------------
-- SEED: CULTURA GENERAL
------------------------------------------------------------
insert into public.questions (category, text, options, correct) values
('cultura','¿Cuántos colores tiene el arcoíris?','["5","6","7","8"]',2),
('cultura','¿Cuál es el elemento más abundante en el universo?','["Oxígeno","Hidrógeno","Helio","Carbono"]',1),
('cultura','¿Cuántos lados tiene un hexágono?','["5","6","7","8"]',1),
('cultura','¿Quién pintó la Mona Lisa?','["Miguel Ángel","Rafael","Leonardo da Vinci","Botticelli"]',2),
('cultura','¿Cuántos segundos tiene una hora?','["600","3600","6000","36000"]',1),
('cultura','¿Cuántos jugadores tiene un equipo de fútbol?','["9","10","11","12"]',2),
('cultura','¿Cuál es la moneda oficial de Japón?','["Won","Yuan","Yen","Ringgit"]',2),
('cultura','¿Cuántos continentes hay en el mundo?','["5","6","7","8"]',2),
('cultura','¿A cuántos grados Celsius hierve el agua al nivel del mar?','["90°C","95°C","100°C","110°C"]',2),
('cultura','¿Cuánto mide un kilómetro en metros?','["100","500","1000","10000"]',2),
('cultura','¿Cuántos anillos tiene el símbolo olímpico?','["4","5","6","7"]',1),
('cultura','¿Cuál es el instrumento de cuerda más grande de la orquesta?','["Violín","Viola","Cello","Contrabajo"]',3),
('cultura','¿En qué país se originó el sushi?','["China","Corea","Japón","Vietnam"]',2),
('cultura','¿Cuántos días tiene un año bisiesto?','["364","365","366","367"]',2);

------------------------------------------------------------
-- UPDATED generate_problem (adds "type":"math")
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
  return jsonb_build_object(
    'type', 'math',
    'num1', n1, 'num2', n2, 'operator', op, 'answer', ans
  );
end;
$$;

------------------------------------------------------------
-- GET RANDOM QUESTION FOR CATEGORY
------------------------------------------------------------
create or replace function public.get_question(p_category text)
returns jsonb
language plpgsql
as $$
declare
  q record;
begin
  select * into q
    from public.questions
   where category = p_category
   order by random()
   limit 1;

  if not found then
    raise exception 'no_questions_for_category:%', p_category;
  end if;

  return jsonb_build_object(
    'type',    'mc',
    'id',      q.id,
    'text',    q.text,
    'options', q.options,
    'correct', q.correct
  );
end;
$$;

------------------------------------------------------------
-- HELPER: next problem for a session
------------------------------------------------------------
create or replace function public.next_problem(p_category text)
returns jsonb
language plpgsql
as $$
begin
  if p_category = 'math' then
    return generate_problem();
  else
    return get_question(p_category);
  end if;
end;
$$;

------------------------------------------------------------
-- UPDATED create_session
------------------------------------------------------------
create or replace function public.create_session(
  p_game_mode          text default 'turns',
  p_category           text default 'math',
  p_time_per_question  int  default 0,
  p_total_rounds       int  default 0
)
returns public.sessions
language plpgsql
security definer
set search_path = public
as $$
declare
  new_code text;
  attempt  int := 0;
  s        public.sessions;
  tpq      int;
  tr       int;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if p_game_mode not in ('turns','speed','countdown','rounds') then
    raise exception 'invalid_game_mode';
  end if;

  -- Defaults per mode
  tpq := p_time_per_question;
  tr  := p_total_rounds;
  if p_game_mode = 'countdown' and tpq = 0 then tpq := 15; end if;
  if p_game_mode = 'rounds'    and tpq = 0 then tpq := 15; end if;
  if p_game_mode = 'rounds'    and tr  = 0 then tr  := 10; end if;

  loop
    attempt := attempt + 1;
    new_code := generate_session_code();
    begin
      insert into public.sessions
        (code, teacher_id, current_problem, game_mode, category,
         time_per_question, total_rounds, question_started_at)
      values
        (new_code, auth.uid(), next_problem(p_category), p_game_mode, p_category,
         tpq, tr, now())
      returning * into s;
      return s;
    exception when unique_violation then
      if attempt > 10 then raise exception 'could_not_generate_code'; end if;
    end;
  end loop;
end;
$$;

------------------------------------------------------------
-- UPDATED submit_answer  (handles MC, rounds end condition)
------------------------------------------------------------
create or replace function public.submit_answer(p_player_id uuid, p_answer int)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  s           public.sessions;
  p           public.players;
  is_correct  boolean;
  new_blue    int;
  new_red     int;
  new_team    text;
  new_status  text;
  new_winner  text;
  new_problem jsonb;
  new_round   int;
  prob_type   text;
  correct_ans int;
begin
  select pl.* into p from public.players pl where pl.id = p_player_id;
  if not found then raise exception 'player_not_found'; end if;

  select * into s from public.sessions where id = p.session_id for update;
  if s.status <> 'active' then raise exception 'not_active'; end if;

  -- Turn check (turns + countdown only)
  if s.game_mode in ('turns','countdown') and p.team <> s.current_team then
    raise exception 'not_your_turn';
  end if;

  -- Determine correct answer from problem type
  prob_type   := coalesce(s.current_problem->>'type', 'math');
  correct_ans := case when prob_type = 'mc'
                   then (s.current_problem->>'correct')::int
                   else (s.current_problem->>'answer')::int
                 end;

  is_correct := (p_answer = correct_ans);

  -- Speed / rounds: wrong = no state change at all
  if s.game_mode in ('speed','rounds') and not is_correct then
    return jsonb_build_object('is_correct', false, 'status', s.status, 'winner', null);
  end if;

  -- Compute new scores
  new_blue := s.blue_score;
  new_red  := s.red_score;
  if is_correct then
    if p.team = 'blue' then new_blue := new_blue + 1;
    else                     new_red  := new_red  + 1;
    end if;
  end if;

  -- Advance round counter
  new_round := s.current_round + 1;

  -- Determine next team
  if s.game_mode in ('speed','rounds') then
    new_team := p.team; -- track last scorer
  else
    new_team := case when s.current_team = 'blue' then 'red' else 'blue' end;
  end if;

  -- Determine game over condition
  if s.game_mode = 'rounds' and new_round >= s.total_rounds then
    -- End of rounds: winner by points
    new_status  := 'finished';
    new_problem := s.current_problem;
    new_winner  := case
      when new_blue > new_red  then 'blue'
      when new_red  > new_blue then 'red'
      else null  -- draw (no winner set)
    end;
  elsif s.game_mode <> 'rounds' and new_blue >= s.winning_score then
    new_status  := 'finished'; new_winner := 'blue';
    new_problem := s.current_problem;
  elsif s.game_mode <> 'rounds' and new_red >= s.winning_score then
    new_status  := 'finished'; new_winner := 'red';
    new_problem := s.current_problem;
  else
    new_status  := 'active';
    new_winner  := null;
    new_problem := next_problem(s.category);
  end if;

  update public.sessions
     set blue_score           = new_blue,
         red_score            = new_red,
         current_team         = new_team,
         current_problem      = new_problem,
         status               = new_status,
         winner               = new_winner,
         current_round        = new_round,
         question_started_at  = case when new_status = 'active' then now() else question_started_at end,
         ended_at             = case when new_status = 'finished' then now() else ended_at end
   where id = s.id;

  return jsonb_build_object(
    'is_correct', is_correct,
    'status',     new_status,
    'winner',     new_winner
  );
end;
$$;

------------------------------------------------------------
-- timeout_question  (countdown + rounds: advance with no points)
------------------------------------------------------------
create or replace function public.timeout_question(
  p_session_id          uuid,
  p_question_started_at timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  s          public.sessions;
  new_team   text;
  new_round  int;
  new_status text;
  new_winner text;
  new_problem jsonb;
begin
  select * into s from public.sessions where id = p_session_id for update;

  -- Idempotency: if question already advanced, return current state
  if s.question_started_at <> p_question_started_at then
    return jsonb_build_object('skipped', false, 'status', s.status);
  end if;

  if s.status <> 'active' then
    return jsonb_build_object('skipped', false, 'status', s.status);
  end if;

  new_round := s.current_round + 1;

  -- Determine next team (flip in countdown/turns; keep last in speed/rounds)
  if s.game_mode = 'countdown' then
    new_team := case when s.current_team = 'blue' then 'red' else 'blue' end;
  else
    new_team := s.current_team;
  end if;

  -- End condition for rounds
  if s.game_mode = 'rounds' and new_round >= s.total_rounds then
    new_status  := 'finished';
    new_problem := s.current_problem;
    new_winner  := case
      when s.blue_score > s.red_score then 'blue'
      when s.red_score  > s.blue_score then 'red'
      else null
    end;
  else
    new_status  := 'active';
    new_winner  := null;
    new_problem := next_problem(s.category);
  end if;

  update public.sessions
     set current_team        = new_team,
         current_problem     = new_problem,
         status              = new_status,
         winner              = new_winner,
         current_round       = new_round,
         question_started_at = case when new_status = 'active' then now() else question_started_at end,
         ended_at            = case when new_status = 'finished' then now() else ended_at end
   where id = s.id;

  return jsonb_build_object('skipped', true, 'status', new_status);
end;
$$;

------------------------------------------------------------
-- updated start_session (sets question_started_at)
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
  if auth.uid() is null then raise exception 'not_authenticated'; end if;

  select * into s from public.sessions
   where id = p_session_id and teacher_id = auth.uid() for update;
  if not found then raise exception 'session_not_found'; end if;
  if s.status <> 'waiting' then raise exception 'already_started'; end if;

  select count(*) into player_count from public.players where session_id = s.id;
  if player_count < 2 then raise exception 'need_two_players'; end if;

  update public.sessions
     set status               = 'active',
         started_at           = now(),
         current_problem      = next_problem(s.category),
         question_started_at  = now()
   where id = s.id
   returning * into s;

  return s;
end;
$$;

------------------------------------------------------------
-- GRANTS
------------------------------------------------------------
grant execute on function public.get_question(text)                         to anon, authenticated;
grant execute on function public.next_problem(text)                         to anon, authenticated;
grant execute on function public.timeout_question(uuid, timestamptz)        to anon, authenticated;
grant execute on function public.create_session(text,text,int,int)          to authenticated;
grant execute on function public.start_session(uuid)                        to authenticated;

------------------------------------------------------------
-- RLS for questions (public read)
------------------------------------------------------------
alter table public.questions enable row level security;

drop policy if exists questions_select_all on public.questions;
create policy questions_select_all on public.questions for select using (true);
