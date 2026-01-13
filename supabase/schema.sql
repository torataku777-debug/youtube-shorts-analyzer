
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Channels table
create table channels (
  id uuid primary key default uuid_generate_v4(),
  youtube_id text unique not null,
  title text not null,
  thumbnail_url text,
  custom_url text,
  created_at timestamptz default now()
);

-- Videos table
create table videos (
  id uuid primary key default uuid_generate_v4(),
  youtube_id text unique not null,
  channel_id uuid references channels(id) on delete cascade,
  title text not null,
  description text,
  published_at timestamptz,
  thumbnail_url text,
  duration text,
  created_at timestamptz default now()
);

-- Daily Metrics table (snapshots)
create table daily_metrics (
  id uuid primary key default uuid_generate_v4(),
  video_id uuid references videos(id) on delete cascade,
  view_count bigint not null default 0,
  like_count bigint not null default 0,
  comment_count bigint not null default 0,
  recorded_at timestamptz default now(),
  
  -- Ensure max one snapshot per video per day
  unique(video_id, recorded_at) 
);

-- Index for faster queries
create index idx_videos_channel_id on videos(channel_id);
create index idx_daily_metrics_video_id on daily_metrics(video_id);
create index idx_daily_metrics_recorded_at on daily_metrics(recorded_at);
