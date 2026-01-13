-- Drop existing function to avoid signature conflicts if needed (though 'create or replace' usually handles same name/different params by overloading, we want to replace the old behavior or overloading might be confusing if we don't use it)
drop function if exists get_rising_stars(text);

-- Create updated function with parameters
create or replace function get_rising_stars(
  region_code text,
  max_video_count int default 10,
  min_avg_views int default 100000,
  max_months_since_creation int default 3
)
returns setof channels
language sql
as $$
  select * from channels
  where 
    -- Condition A: <= max_video_count
    video_count <= max_video_count
    -- Condition B: Created within X months
    and published_at > (now() - (max_months_since_creation || ' months')::interval)
    -- Condition C: Avg views >= min_avg_views
    and video_count > 0
    and (view_count / video_count) >= min_avg_views
    -- Filter by region
    and (country = region_code or country is null)
  order by (view_count / video_count) desc;
$$;
