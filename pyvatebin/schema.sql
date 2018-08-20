create table pastes (
  id integer primary key,
  expire_time integer,
  paste_text text,
  burn_after_read boolean,
  paste_hash text,
  paste_format text,
  nonce text
);
