drop table if exists pastes;
create table pastes (
  id integer primary key,
  time_created integer,
  paste_text text
);
