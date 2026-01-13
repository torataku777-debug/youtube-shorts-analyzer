
-- Function to get trending shorts based on growth in a specific period
-- Usage: select * from get_trending_shorts(24); -- for last 24 hours

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
    -- Get the snapshot closest to (Now - period) for each video
    -- We use distinct on video_id and order by ABS(diff) to find closest
    select distinct on (m.video_id)
      m.video_id,
      m.view_count,
      m.recorded_at
    from daily_metrics m
    where m.recorded_at >= now() - (period_hours || ' hours')::interval
      and m.recorded_at < now() - (period_hours || ' hours')::interval + interval '1 hour' -- Optimization to look in a window? 
      -- Actually simpler: just find the record closest to the target time
      -- But efficiently: specifically we want the oldest record WITHIN the period? 
      -- Or the record immediately preceding the period?
      -- Let's take the record that is OLDER than (now - slightly less than period) but closest to the target.
      -- To keep it robust even with sparse data: get the *oldest* record available in the window [now - period, now].
      -- If the period is 24h, we want the record from 24h ago.
      -- If we only have data from 1h ago, growth is based on that 1h.
    order by m.video_id, m.recorded_at asc -- Ascending gets the oldest in the set
  )
  select 
    v.id as video_id,
    v.title,
    v.thumbnail_url,
    c.title as channel_title,
    lm.view_count as current_views,
    (lm.view_count - pm.view_count) as growth_views,
    case 
      when pm.view_count = 0 then 0
      else round(((lm.view_count - pm.view_count)::numeric / pm.view_count) * 100, 1)
    end as growth_rate
  from latest_metrics lm
  join past_metrics pm on lm.video_id = pm.video_id
  join videos v on v.id = lm.video_id
  join channels c on c.id = v.channel_id
  where (lm.view_count - pm.view_count) > 0 -- Only show positive growth
  order by (lm.view_count - pm.view_count) desc; -- Sort by absolute growth (viral) or use growth_rate for %
end;
$$;
