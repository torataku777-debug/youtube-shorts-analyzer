
import { supabase } from '@/lib/supabase';
import fs from 'fs';
import path from 'path';

const DATA_KEYWORDS_FILE = () => path.join(process.cwd(), 'data', 'keywords.json');

// Types
export interface Channel {
    id: string;
    youtube_id: string;
    title: string;
    thumbnail_url: string;
    custom_url: string;
    video_count: number;
    view_count: number;
    published_at: string;
    country: string;
}

export interface Video {
    id: string;
    youtube_id: string;
    title: string;
    description: string;
    thumbnail_url: string;
    published_at: string;
    view_count: number;
    like_count: number;
    comment_count: number;
    channel_id: string;
    is_high_rpm: boolean;
    is_faceless: boolean;
    is_kids: boolean;
    audio_info?: string;
    region: string; // Add region to interface
}

export interface TrendGenre {
    id: string;
    name: string;
    description?: string;
    tags: string[];
    score: number;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const CHANNELS_FILE = path.join(DATA_DIR, 'channels.json');
const VIDEOS_FILE = path.join(DATA_DIR, 'videos.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize empty files if not exist
if (!fs.existsSync(CHANNELS_FILE)) fs.writeFileSync(CHANNELS_FILE, '[]');
if (!fs.existsSync(VIDEOS_FILE)) fs.writeFileSync(VIDEOS_FILE, '[]');

// Helper to check if Supabase is available
const isSupabaseAvailable = () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    // Check if key is valid: JWT形式(eyJ)または新しいsupabase形式(sb_)に対応
    // URLとKeyの両方が存在し、空でないことを確認
    return !!url && !!key && key.length > 20;
};

export const dataProvider = {
    async getTrendingShorts(params: {
        period_hours: number;
        target_region: string;
        hide_kids: boolean;
    }): Promise<any[]> {
        if (isSupabaseAvailable()) {
            console.log('Using Supabase for Trending Shorts');
            const { data, error } = await supabase.rpc('get_trending_shorts', params);
            if (error) throw error;
            return data || [];
        } else {
            console.log('Using Local JSON for Trending Shorts');
            // Ensure files exist
            if (!fs.existsSync(VIDEOS_FILE) || !fs.existsSync(CHANNELS_FILE)) return [];

            const videos: Video[] = JSON.parse(fs.readFileSync(VIDEOS_FILE, 'utf-8'));
            const channels: Channel[] = JSON.parse(fs.readFileSync(CHANNELS_FILE, 'utf-8'));
            const channelMap = new Map(channels.map(c => [c.id, c]));

            // Filter
            let filtered = videos.filter(v => {
                if (v.region !== params.target_region) return false;
                if (params.hide_kids && v.is_kids) return false;
                return true; // ローカルJSONではperiodフィルタは緩和（実データはSupabaseから取得するため）
            });

            // Sort by views (simple approximation of trending)
            filtered.sort((a, b) => b.view_count - a.view_count);

            // Limit to 100
            filtered = filtered.slice(0, 100);

            // Map to RPC response shape
            return filtered.map(v => {
                const channel = channelMap.get(v.channel_id);
                return {
                    video_id: v.id,
                    video_youtube_id: v.youtube_id,
                    title: v.title,
                    thumbnail_url: v.thumbnail_url,
                    channel_title: channel?.title || 'Unknown',
                    channel_youtube_id: channel?.youtube_id || '',
                    current_views: v.view_count, // Fallback: use total views as current views
                    growth_views: 0, // Cannot calculate without history
                    growth_rate: 0, // Cannot calculate without history
                    is_high_rpm: v.is_high_rpm,
                    is_faceless: v.is_faceless,
                    audio_info: v.audio_info,
                    is_kids: v.is_kids
                };
            });
        }
    },

    async getRisingStars(params: {
        region_code: string;
        max_video_count: number;
        min_avg_views: number;
        max_months_since_creation: number;
    }): Promise<Channel[]> {
        if (isSupabaseAvailable()) {
            console.log('Using Supabase for Rising Stars');
            const { data, error } = await supabase.rpc('get_rising_stars', params);
            if (error) throw error;
            return data || [];
        } else {
            console.log('Using Local JSON for Rising Stars');
            const channels: Channel[] = JSON.parse(fs.readFileSync(CHANNELS_FILE, 'utf-8'));

            // Filter logic mimicking the SQL RPC
            const now = new Date();
            const cutoffDate = new Date();
            cutoffDate.setMonth(now.getMonth() - params.max_months_since_creation);

            return channels.filter(c => {
                const pubDate = new Date(c.published_at);
                const avgViews = c.video_count > 0 ? c.view_count / c.video_count : 0;

                return (
                    c.country === params.region_code &&
                    c.video_count <= params.max_video_count &&
                    avgViews >= params.min_avg_views &&
                    pubDate >= cutoffDate
                );
            });
        }
    },

    async saveChannels(channels: Channel[]) {
        if (isSupabaseAvailable()) {
            const { error } = await supabase.from('channels').upsert(channels, { onConflict: 'youtube_id' });
            if (error) console.error('Supabase Save Error:', error);
            return;
        }

        // Local Save
        const current: Channel[] = JSON.parse(fs.readFileSync(CHANNELS_FILE, 'utf-8'));
        const map = new Map(current.map(c => [c.youtube_id, c]));

        channels.forEach(c => {
            // Merge or add
            // We need to generate a fake UUID if it's new
            const existing = map.get(c.youtube_id);
            const id = existing?.id || crypto.randomUUID();
            map.set(c.youtube_id, { ...c, id });
        });

        fs.writeFileSync(CHANNELS_FILE, JSON.stringify(Array.from(map.values()), null, 2));
    },

    async saveVideos(videos: any[]) { // accepting raw video objects meant for DB
        if (isSupabaseAvailable()) {
            const { error } = await supabase.from('videos').upsert(videos, { onConflict: 'youtube_id' });
            if (error) console.error('Supabase Save Video Error:', error);
            return;
        }

        const current: Video[] = JSON.parse(fs.readFileSync(VIDEOS_FILE, 'utf-8'));
        const map = new Map(current.map(v => [v.youtube_id, v]));

        videos.forEach(v => {
            const existing = map.get(v.youtube_id);
            // Use existing ID if available, else new random UUID
            const id = existing?.id || crypto.randomUUID();
            map.set(v.youtube_id, { ...v, id });
        });

        fs.writeFileSync(VIDEOS_FILE, JSON.stringify(Array.from(map.values()), null, 2));
    },

    // Helper to get channel ID map for ingest logic
    async getChannelMap(youtubeIds: string[]): Promise<Map<string, string>> {
        if (isSupabaseAvailable()) {
            const { data } = await supabase.from('channels').select('id, youtube_id').in('youtube_id', youtubeIds);
            return new Map(data?.map(c => [c.youtube_id, c.id]));
        }

        const channels: Channel[] = JSON.parse(fs.readFileSync(CHANNELS_FILE, 'utf-8'));
        const map = new Map();
        channels.forEach(c => {
            if (youtubeIds.includes(c.youtube_id)) {
                map.set(c.youtube_id, c.id);
            }
        });
        return map;
    },

    // daily_metricsを保存する (Supabase時: daily_metricsテーブル / ローカル時: videos.jsonのview_count等を更新)
    async saveMetrics(metricsData: Array<{ video_id: string; view_count: number; like_count: number; comment_count: number; youtube_id: string }>) {
        if (isSupabaseAvailable()) {
            // まずyoutube_idからvideo_id(UUID)をlookup
            const youtubeIds = metricsData.map(m => m.youtube_id).filter(Boolean);
            const { data: videoRows } = await supabase
                .from('videos')
                .select('id, youtube_id')
                .in('youtube_id', youtubeIds);

            if (!videoRows || videoRows.length === 0) {
                console.log('saveMetrics: No matching videos found in Supabase.');
                return;
            }

            const videoIdMap = new Map(videoRows.map((v: any) => [v.youtube_id, v.id]));
            const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD形式

            const rows = metricsData
                .map(m => {
                    const vid = videoIdMap.get(m.youtube_id);
                    if (!vid) return null;
                    return {
                        video_id: vid,
                        view_count: m.view_count,
                        like_count: m.like_count,
                        comment_count: m.comment_count,
                        recorded_at: `${today}T00:00:00Z`
                    };
                })
                .filter(Boolean);

            if (rows.length > 0) {
                const { error } = await supabase.from('daily_metrics').upsert(rows, { onConflict: 'video_id,recorded_at' });
                if (error) console.error('Supabase daily_metrics Save Error:', error);
            }
            return;
        }

        // ローカルJSON: videos.jsonのview_count等を更新
        const videoFile = path.join(process.cwd(), 'data', 'videos.json');
        if (!fs.existsSync(videoFile)) return;
        const current: Video[] = JSON.parse(fs.readFileSync(videoFile, 'utf-8'));
        const metricsMap = new Map(metricsData.map(m => [m.youtube_id, m]));
        const updated = current.map(v => {
            const metrics = metricsMap.get(v.youtube_id);
            if (metrics) {
                return { ...v, view_count: metrics.view_count, like_count: metrics.like_count, comment_count: metrics.comment_count };
            }
            return v;
        });
        fs.writeFileSync(videoFile, JSON.stringify(updated, null, 2));
    },

    // trending_keywordsを保存する
    async saveKeywords(keywords: Array<{ keyword: string; region: string; frequency: number }>) {
        if (isSupabaseAvailable()) {
            const { error } = await supabase
                .from('trending_keywords')
                .upsert(keywords.map(k => ({ keyword: k.keyword, region: k.region, frequency: k.frequency })), { onConflict: 'keyword,region' });
            if (error) console.error('Supabase Keywords Save Error:', error);
            return;
        }

        // ローカルJSON: data/keywords.jsonに保存
        const kFile = DATA_KEYWORDS_FILE();
        let current: any[] = [];
        if (fs.existsSync(kFile)) {
            current = JSON.parse(fs.readFileSync(kFile, 'utf-8'));
        }
        const kMap = new Map(current.map((k: any) => [`${k.keyword}_${k.region}`, k]));
        keywords.forEach(k => kMap.set(`${k.keyword}_${k.region}`, k));
        fs.writeFileSync(kFile, JSON.stringify(Array.from(kMap.values()), null, 2));
    },

    // videoを削除する (7日以上古いもの)
    async deleteOldVideos() {
        if (isSupabaseAvailable()) {
            const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
            const { error } = await supabase
                .from('videos')
                .delete()
                .lt('published_at', cutoff);
            if (error) console.error('Supabase Cleanup Error:', error);
            return;
        }
        // ローカルJSON: data/videos.jsonから古いビデオを削除
        const videoFile = path.join(process.cwd(), 'data', 'videos.json');
        if (!fs.existsSync(videoFile)) return;
        const current: Video[] = JSON.parse(fs.readFileSync(videoFile, 'utf-8'));
        const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const filtered = current.filter(v => new Date(v.published_at) >= cutoff);
        fs.writeFileSync(videoFile, JSON.stringify(filtered, null, 2));
        console.log(`Cleanup: Removed ${current.length - filtered.length} old videos from local JSON.`);
    }
};
