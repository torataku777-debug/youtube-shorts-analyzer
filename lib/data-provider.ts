
import { supabase } from '@/lib/supabase';
import fs from 'fs';
import path from 'path';

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
    // Check if key is valid (JWT format)
    return url && key && key.startsWith('eyJ');
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

                // Period filter: published within last X hours
                // Note: Real trending logic uses view velocity, but here we just use recency for fallback
                const pubDate = new Date(v.published_at);
                const cutoff = new Date(Date.now() - params.period_hours * 60 * 60 * 1000);
                return pubDate >= cutoff;
            });

            // Sort by views (simple approximation of trending)
            filtered.sort((a, b) => b.view_count - a.view_count);

            // Limit to 50
            filtered = filtered.slice(0, 50);

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
    }
};
