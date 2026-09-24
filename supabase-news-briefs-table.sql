-- Run this ONCE in Supabase -> SQL Editor -> New query -> Run.
-- Creates the table that holds "The Credible Briefing" story cards.
-- Anyone can read published briefs (the homepage strip, the ticker, and
-- the /briefing page all need this). Nobody can write to it from the
-- website -- only the local /news command can, using the service_role
-- key, which bypasses row level security entirely.

create table if not exists news_briefs (
  id bigint generated always as identity primary key,
  headline text not null,
  summary text not null,
  key_number text not null,             -- e.g. "7.8%", "$2.4B" -- must come from a sourced figure, never invented
  topic_label text not null,            -- e.g. "SANCTIONS", "ENERGY", "TRADE"
  dateline text not null,               -- e.g. "NEW DELHI, 12 SEPT"
  source_links jsonb not null default '[]'::jsonb,  -- [{"name": "Reuters", "url": "https://..."}]
  region_tags text[] not null default '{}',         -- e.g. {India, China}
  related_article_url text,             -- link to a full Credible article, if one exists
  desk_story_id integer,                -- the story's id in desk.db, for traceability back to sourcing
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists news_briefs_published_at_idx
  on news_briefs (published_at desc);

alter table news_briefs enable row level security;

-- Everyone (logged in or not) can read every brief -- there is no draft
-- state in this table; a row only exists once it has been published.
create policy "Anyone can read briefs"
  on news_briefs for select
  using (true);

-- Deliberately no insert/update/delete policy for anon or authenticated
-- roles -- only the server-side service_role key (used by the local
-- /news command, never shipped in website code) can write here.
