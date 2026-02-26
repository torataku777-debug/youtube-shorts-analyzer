-- Migration to update ranking logic: daily_metricsベースのフィルタに変更
-- v2: published_at フィルタ -> daily_metrics.recorded_at ベースに変更して表示件数を増やす

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
  -- 1. 指定リージョンの全動画から最新メトリクスを取得
  latest_metrics AS (
    SELECT DISTINCT ON (m.video_id) 
      m.video_id, 
      m.view_count, 
      m.recorded_at
    FROM daily_metrics m
    JOIN videos v ON v.id = m.video_id
    WHERE v.region = target_region
      AND (CASE WHEN hide_kids THEN v.is_kids = FALSE ELSE TRUE END)
    ORDER BY m.video_id, m.recorded_at DESC
  ),
  -- 2. period_hours前のメトリクスを取得（成長率計算用）
  past_metrics AS (
    SELECT DISTINCT ON (m.video_id)
      m.video_id,
      m.view_count
    FROM daily_metrics m
    WHERE m.recorded_at <= now() - (period_hours || ' hours')::interval
    ORDER BY m.video_id, m.recorded_at DESC
  )
  SELECT 
    v.id AS video_id,
    v.youtube_id AS video_youtube_id,
    v.title,
    v.thumbnail_url,
    c.title AS channel_title,
    c.youtube_id AS channel_youtube_id,
    lm.view_count AS current_views,
    -- 成長ビュー数 = 現在 - period前（なければ現在値をそのまま）
    COALESCE(lm.view_count - pm.view_count, lm.view_count) AS growth_views,
    -- 成長率
    CASE 
      WHEN pm.view_count IS NULL OR pm.view_count = 0 THEN 100.0
      ELSE ROUND(((lm.view_count - pm.view_count)::numeric / pm.view_count) * 100, 1)
    END AS growth_rate,
    v.is_kids,
    v.is_high_rpm,
    v.is_faceless,
    v.audio_info
  FROM latest_metrics lm
  LEFT JOIN past_metrics pm ON pm.video_id = lm.video_id
  JOIN videos v ON v.id = lm.video_id
  JOIN channels c ON c.id = v.channel_id
  ORDER BY 
    lm.view_count DESC,
    v.published_at DESC
  LIMIT 100;
END;
$$;
