-- Supabase/Postgres schema for recalls & outbreaks

create table if not exists recalls (
  rec_id text primary key,
  date date not null,
  agency text not null check (agency in ('FDA','USDA')),
  class text,
  product text not null,
  pathogen text,
  firm text,
  states text[],
  url text
);

create table if not exists outbreaks (
  ob_id text primary key,
  onset_date date not null,
  state text not null,
  county text,
  pathogen text,
  food_cat text,
  cases int,
  hospitalizations int,
  deaths int,
  status text,
  url text
);

create table if not exists geo_county (
  fips text primary key,
  state text not null,
  county text not null,
  pop int
);
