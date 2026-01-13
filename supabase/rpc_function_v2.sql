
-- Function to get trending shorts based on growth in a specific period
-- Updated to LEFT JOIN to include videos even without historical data (Growth = 0)

create or replace function get_trending_shorts(period_hours int)
returns table (
  video_id uuid,
  title text,
  thumbnail_url text,
  channel_title text,
  current_views bigint,
  growth_views bigint,
  growth_rate numeric
)
language plpgsql
as $$
begin
  return query
  with latest_metrics as (
    -- Get the very latest snapshot for each video
    select distinct on (m.video_id) 
      m.video_id, 
      m.view_count, 
      m.recorded_at
    from daily_metrics m
    order by m.video_id, m.recorded_at desc
  ),
  past_metrics as (
    -- Get the snapshot closest to (Now - period)
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
    end as growth_rate
  from latest_metrics lm
  left join past_metrics pm on lm.video_id = pm.video_id
  join videos v on v.id = lm.video_id
  join channels c on c.id = v.channel_id
  order by 
    (coalesce(lm.view_count - pm.view_count, 0)) desc, -- High growth first
    lm.view_count desc; -- Then high absolute views
end;
$$;
