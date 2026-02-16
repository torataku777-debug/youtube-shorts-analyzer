'use server';

import { dataProvider, Channel, TrendGenre } from '@/lib/data-provider';
import { getTrendGenres } from '@/lib/genre-analysis'; // This was original logic, but we might want to abstract it too

export async function fetchRisingStarsAction(params: {
    region_code: string;
    max_video_count: number;
    min_avg_views: number;
    max_months_since_creation: number;
}): Promise<Channel[]> {
    return await dataProvider.getRisingStars(params);
}

export async function fetchTrendGenresAction(region: 'JP' | 'US'): Promise<TrendGenre[]> {
    // For now, keeping the original logic which was in lib/genre-analysis, 
    // but exposing it via Server Action just in case we move it to dataProvider later.
    // Actually, let's just populate it properly.
    return await getTrendGenres(region);
}
