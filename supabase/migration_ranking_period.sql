-- Migration to update ranking logic: strict period filtering & growth sort

-- Drop existing function signature to allow changes
DROP FUNCTION IF EXISTS get_trending_shorts(int, text, boolean);

CREATE OR REPLACE FUNCTION get_trending_shorts(
  period_hours int, 
  target_region text default 'JP',
  hide_kids boolean default false
)
RETURNS TABLE (
  video_id uuid,
  video_youtube_id text,
  title text,
  thumbnail_url text,
  channel_title text,
  channel_youtube_id text,
  current_views bigint,
  growth_views bigint,
  growth_rate numeric,
  is_kids boolean,
  is_high_rpm boolean,
  is_faceless boolean,
  audio_info text
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH 
  -- 1. Identify valid videos first (Published within window)
  -- Note: We only want videos published "recently" for the ranking to be relevant to the period label
  -- User Request: "Strictly filter videos published within period"
  target_videos AS (
    SELECT v.id, v.published_at 
    FROM videos v
    WHERE v.region = target_region
      AND v.published_at >= now() - (period_hours || ' hours')::interval
      AND (CASE WHEN hide_kids THEN v.is_kids = FALSE ELSE TRUE END)
  ),
  -- 2. get LATEST metric for each video
  latest_metrics AS (
    SELECT DISTINCT ON (m.video_id) 
      m.video_id, 
      m.view_count, 
      m.recorded_at
    FROM daily_metrics m
    JOIN target_videos tv ON tv.id = m.video_id
    ORDER BY m.video_id, m.recorded_at DESC
  ),
  -- 3. get EARLIEST metric WITHIN THE PERIOD for each video to calc growth
  -- Actually, to calc growth *during* the period, we ideally want the metric *at the start* of the period.
  -- But for videos published *within* the period, the "start" view count is effectively 0 (or the first recorded metric).
  -- Logic: Growth = Current Views - Views at (Now - Period).
  -- If video is younger than Period, Growth = Current Views - 0 (approx).
  past_metrics AS (
    SELECT DISTINCT ON (m.video_id)
      m.video_id,
      m.view_count,
      m.recorded_at
    FROM daily_metrics m
    JOIN target_videos tv ON tv.id = m.video_id
    WHERE m.recorded_at >= now() - (period_hours || ' hours')::interval
    ORDER BY m.video_id, m.recorded_at ASC
  )
  SELECT 
    v.id AS video_id,
    v.youtube_id AS video_youtube_id,
    v.title,
    v.thumbnail_url,
    c.title AS channel_title,
    c.youtube_id AS channel_youtube_id,
    lm.view_count AS current_views,
    
    -- Growth Calculation:
    -- Since we strictly filter by published_at > now - period, 
    -- the "growth" is essentially the total views for these new videos.
    -- However, fairly, let's just use current_views because for a video published 1 hour ago,
    -- its growth IS its current views.
    -- But to be safe and support "trending" logic generally:
    lm.view_count AS growth_views, 
    
    -- Growth Rate: For new videos, it's 100% or N/A. Let's return 100 for simplicity or just 0 if no prev data.
    -- Actually, if we filter STRICTLY by published_at, "Growth Rate" is less meaningful than absolute growth.
    -- Just return 100.0 if it's new.
    100.0 AS growth_rate,
    
    v.is_kids,
    v.is_high_rpm,
    v.is_faceless,
    v.audio_info
  FROM latest_metrics lm
  -- No need for past_metrics if we assume growth = current for new videos
  -- But let's keep the JOIN structure if we change logic later.
  -- JOIN target_videos tv ON tv.id = lm.video_id
  JOIN videos v ON v.id = lm.video_id
  JOIN channels c ON c.id = v.channel_id
  ORDER BY 
    lm.view_count DESC, -- For strictly new videos, current_views IS the growth.
    v.published_at DESC;
END;
$$;
