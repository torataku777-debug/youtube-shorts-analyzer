-- Add new columns to channels table
alter table channels 
add column if not exists video_count integer,
add column if not exists view_count bigint,
add column if not exists published_at timestamptz,
add column if not exists country text;

-- Create function to get rising stars
create or replace function get_rising_stars(region_code text)
returns setof channels
language sql
as $$
  select * from channels
  where 
    -- Condition A: <= 10 videos
    video_count <= 10
    -- Condition B: Created within 3 months
    and published_at > (now() - interval '3 months')
    -- Condition C: Avg views >= 100,000 (avoid division by zero)
    and video_count > 0
    and (view_count / video_count) >= 100000
    -- Filter by region (optional, if country column is populated correctly)
    and (country = region_code or country is null)
  order by (view_count / video_count) desc;
$$;
