-- Migration to add RPM and Faceless columns to videos table

ALTER TABLE videos ADD COLUMN IF NOT EXISTS is_high_rpm BOOLEAN DEFAULT FALSE;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS is_faceless BOOLEAN DEFAULT FALSE;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS audio_info TEXT;

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_videos_is_high_rpm ON videos(is_high_rpm);
CREATE INDEX IF NOT EXISTS idx_videos_is_faceless ON videos(is_faceless);

COMMENT ON COLUMN videos.is_high_rpm IS 'Flag for high RPM categories (Finance, Edu, etc)';
COMMENT ON COLUMN videos.is_faceless IS 'Flag for faceless content (AI, Text-to-speech, etc)';
COMMENT ON COLUMN videos.audio_info IS 'Extracted audio information (BGM, etc)';

-- Update RPC function to return new fields
-- Drop first to avoid return type mismatch error
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
  WITH latest_metrics AS (
    SELECT DISTINCT ON (m.video_id) 
      m.video_id, 
      m.view_count, 
      m.recorded_at
    FROM daily_metrics m
    ORDER BY m.video_id, m.recorded_at DESC
  ),
  past_metrics AS (
    SELECT DISTINCT ON (m.video_id)
      m.video_id,
      m.view_count,
      m.recorded_at
    FROM daily_metrics m
    WHERE m.recorded_at >= now() - (period_hours || ' hours')::interval
      AND m.recorded_at < now() - (period_hours || ' hours')::interval + interval '2 hour'
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
    COALESCE(lm.view_count - pm.view_count, 0) AS growth_views,
    CASE 
      WHEN pm.view_count IS NULL OR pm.view_count = 0 THEN 0
      ELSE round(((lm.view_count - pm.view_count)::numeric / pm.view_count) * 100, 1)
    END AS growth_rate,
    v.is_kids,
    v.is_high_rpm,
    v.is_faceless,
    v.audio_info
  FROM latest_metrics lm
  LEFT JOIN past_metrics pm ON lm.video_id = pm.video_id
  JOIN videos v ON v.id = lm.video_id
  JOIN channels c ON c.id = v.channel_id
  WHERE v.region = target_region
    AND (CASE WHEN hide_kids THEN v.is_kids = FALSE ELSE TRUE END)
  ORDER BY 
    (COALESCE(lm.view_count - pm.view_count, 0)) DESC,
    lm.view_count DESC;
END;
$$;
