
-- 1. Add is_kids column to videos table
alter table videos 
add column if not exists is_kids boolean default false;

-- 2. Update the RPC function to filter by is_kids
create or replace function get_trending_shorts(
  period_hours int, 
  target_region text default 'JP',
  hide_kids boolean default false
)
returns table (
  video_id uuid,
  title text,
  thumbnail_url text,
  channel_title text,
  current_views bigint,
  growth_views bigint,
  growth_rate numeric,
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
    v.title,
    v.thumbnail_url,
    c.title as channel_title,
    lm.view_count as current_views,
    coalesce(lm.view_count - pm.view_count, 0) as growth_views,
    case 
      when pm.view_count is null or pm.view_count = 0 then 0
      else round(((lm.view_count - pm.view_count)::numeric / pm.view_count) * 100, 1)
    end as growth_rate,
    v.is_kids
  from latest_metrics lm
  left join past_metrics pm on lm.video_id = pm.video_id
  join videos v on v.id = lm.video_id
  join channels c on c.id = v.channel_id
  where v.region = target_region
    and (case when hide_kids then v.is_kids = false else true end) -- Filter Logic
  order by 
    (coalesce(lm.view_count - pm.view_count, 0)) desc,
    lm.view_count desc;
end;
$$;
