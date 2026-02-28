-- =================================================================
-- Fix: Show ALL videos, not just those with daily_metrics entries
-- =================================================================

-- 1. Add view_count, like_count, comment_count columns to videos table
alter table videos
  add column if not exists view_count bigint default 0,
  add column if not exists like_count bigint default 0,
  add column if not exists comment_count bigint default 0;

-- 2. Add is_kids column if not exists (from migration_kids.sql)
alter table videos
  add column if not exists is_kids boolean default false;

-- 3. Drop old RPC functions to avoid conflicts
drop function if exists get_trending_shorts(int);
drop function if exists get_trending_shorts(int, text);
drop function if exists get_trending_shorts(int, text, boolean);

-- 4. Create new get_trending_shorts: starts from videos table (shows ALL videos)
--    Uses daily_metrics via LEFT JOIN for growth calculation only
create or replace function get_trending_shorts(
  period_hours int,
  target_region text default 'JP',
  hide_kids boolean default false
)
returns table (
  video_id uuid,
  video_youtube_id text,
  title text,
  thumbnail_url text,
  channel_title text,
  channel_youtube_id text,
  current_views bigint,
  growth_views bigint,
  growth_rate numeric,
  is_high_rpm boolean,
  is_faceless boolean,
  audio_info text,
  is_kids boolean
)
language plpgsql
as $$
begin
  return query
  with latest_metrics as (
    select distinct on (m.video_id)
      m.video_id,
      m.view_count,
      m.recorded_at
    from daily_metrics m
    order by m.video_id, m.recorded_at desc
  ),
  past_metrics as (
    select distinct on (m.video_id)
      m.video_id,
      m.view_count,
      m.recorded_at
    from daily_metrics m
    where m.recorded_at >= now() - (period_hours || ' hours')::interval
      and m.recorded_at < now() - (period_hours || ' hours')::interval + interval '2 hour'
    order by m.video_id, m.recorded_at asc
  )
  select
    v.id as video_id,
    v.youtube_id as video_youtube_id,
    v.title,
    v.thumbnail_url,
    c.title as channel_title,
    c.youtube_id as channel_youtube_id,
    -- current_views: daily_metrics優先、なければvideos.view_count使用
    coalesce(lm.view_count, v.view_count, 0) as current_views,
    -- growth_views: daily_metricsがあれば計算、なければ0
    coalesce(lm.view_count - pm.view_count, 0) as growth_views,
    case
      when pm.view_count is null or pm.view_count = 0 then 0
      else round(((lm.view_count - pm.view_count)::numeric / pm.view_count) * 100, 1)
    end as growth_rate,
    v.is_high_rpm,
    v.is_faceless,
    v.audio_info,
    v.is_kids
  from videos v
  join channels c on c.id = v.channel_id
  left join latest_metrics lm on lm.video_id = v.id
  where v.region = target_region
    and (case when hide_kids then v.is_kids = false else true end)
  order by
    coalesce(lm.view_count - pm.view_count, 0) desc,
    coalesce(lm.view_count, v.view_count, 0) desc
  limit 100;
end;
$$;
