create table pastes (
  id integer primary key,
  expire_time integer,
  paste_text text,
  burn_after_read boolean,
  nonce text
);
