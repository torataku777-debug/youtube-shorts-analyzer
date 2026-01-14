
import { supabase } from '@/lib/supabase';
import { fetchTrendingShorts, fetchChannelStats } from '@/lib/youtube-server';
import { extractTrendingKeywords } from '@/lib/keyword-extractor';

// Helper to save channels and videos to DB (reusable for both main ingest and deep ingest)
async function saveToDatabase(videoStats: any[], regionCode: string) {
    if (videoStats.length === 0) return 0;

    // Upsert Channels
    const channelIds = [...new Set(videoStats.map((v: any) => v.snippet.channelId))];
    const channelStats = await fetchChannelStats(channelIds as string[]);

    const channelsData = channelStats.map((c: any) => ({
        youtube_id: c.id,
        title: c.snippet.title,
        thumbnail_url: c.snippet.thumbnails.default.url,
        custom_url: c.snippet.customUrl,
        video_count: parseInt(c.statistics.videoCount || '0'),
        view_count: parseInt(c.statistics.viewCount || '0'),
        published_at: c.snippet.publishedAt,
        country: c.snippet.country || regionCode
    }));

    await supabase.from('channels').upsert(channelsData, { onConflict: 'youtube_id' });

    // Upsert Videos
    const { data: storedChannels } = await supabase
        .from('channels')
        .select('id, youtube_id')
        .in('youtube_id', channelIds);

    const channelMap = new Map(storedChannels?.map(c => [c.youtube_id, c.id]));

    const videosData = videoStats.map((v: any) => {
        const title = v.snippet.title || '';
        const desc = v.snippet.description || '';
        const combinedText = (title + ' ' + desc).toLowerCase();

        // 1. High RPM Logic
        // Category 27 = Education, 28 = Science & Technology
        const isCategoryHighRpm = ['27', '28'].includes(v.snippet.categoryId);
        const hasHighRpmKeywords = ['節約', '金融', 'ビジネス', 'ガジェット', 'money', 'finance', 'business', 'invest', 'stock'].some(k => combinedText.includes(k.toLowerCase()));
        const isHighRpm = isCategoryHighRpm || hasHighRpmKeywords;

        // 2. Faceless Logic
        const hasFacelessKeywords = ['ai', 'ゆっくり', '解説', '素材', '切り抜き', 'faceless', 'voiceover', 'animation'].some(k => combinedText.includes(k.toLowerCase()));
        const isFaceless = hasFacelessKeywords;

        // 3. Audio Info Extraction
        // Heuristic: Look for "Music in this video" or lines starting with "Music:" or "Song:"
        let audioInfo = null;
        const musicMatch = desc.match(/(?:Music in this video|Music|Song|Track|Soundtrack)[:\s]+([^\n]+)/i);
        if (musicMatch && musicMatch[1]) {
            audioInfo = musicMatch[1].trim();
        }

        return {
            youtube_id: v.id,
            channel_id: channelMap.get(v.snippet.channelId),
            title: v.snippet.title,
            description: v.snippet.description,
            published_at: v.snippet.publishedAt,
            thumbnail_url: v.snippet.thumbnails.high?.url || v.snippet.thumbnails.default.url,
            duration: v.contentDetails.duration,
            region: regionCode,
            is_kids: v.is_kids_computed,
            is_high_rpm: isHighRpm,
            is_faceless: isFaceless,
            audio_info: audioInfo
        };
    }).filter(v => v.channel_id);

    const { data: storedVideos, error: videoError } = await supabase
        .from('videos')
        .upsert(videosData, { onConflict: 'youtube_id' })
        .select();

    if (videoError) console.error(videoError);

    // Metrics
    if (storedVideos) {
        const videoMap = new Map(storedVideos.map((v: any) => [v.youtube_id, v.id]));
        const metricsData = videoStats.map((v: any) => ({
            video_id: videoMap.get(v.id),
            view_count: parseInt(v.statistics.viewCount || '0'),
            like_count: parseInt(v.statistics.likeCount || '0'),
            comment_count: parseInt(v.statistics.commentCount || '0'),
            recorded_at: new Date().toISOString()
        })).filter(m => m.video_id);

        await supabase.from('daily_metrics').insert(metricsData);
    }

    return videosData.length;
}

export async function runIngestProcess() {
    console.log('Starting Multi-Region Deep Ingest...');
    const TARGET_COUNT = 200;

    const regions = [
        {
            code: 'JP',
            lang: 'ja',
            keywords: ['切り抜き', 'あるある', '歌ってみた', '解説', '猫', '料理', 'ダンス']
        },
        {
            code: 'US',
            lang: 'en',
            keywords: ['funny', 'challenge', 'tutorial', 'gameplay', 'meme', 'lifehack']
        }
    ];

    let totalVideos = 0;

    for (const region of regions) {
        console.log(`Processing Region: ${region.code} with target ${TARGET_COUNT}`);

        // 1. Initial Ingest (Trends + Manual Keywords)
        const initialVideos = await fetchTrendingShorts({
            regionCode: region.code,
            relevanceLanguage: region.lang,
            keywords: region.keywords
        }, TARGET_COUNT);

        const savedCount = await saveToDatabase(initialVideos, region.code);
        totalVideos += savedCount;

        // 2. Keyword Extraction
        const videosForExtraction = initialVideos.map((v: any) => ({
            title: v.snippet.title,
            description: v.snippet.description
        }));
        const extractedKeywords = extractTrendingKeywords(videosForExtraction);

        // Save keywords to DB
        const keywordsToUpsert = extractedKeywords.slice(0, 20).map(k => ({
            keyword: k.keyword,
            region: region.code,
            frequency: k.count
        }));

        if (keywordsToUpsert.length > 0) {
            await supabase
                .from('trending_keywords')
                .upsert(keywordsToUpsert, { onConflict: 'keyword,region' });
        }

        // 3. Deep Search (Top 5 Keywords)
        console.log(`[${region.code}] Starting Deep Search on top keywords...`);
        const topKeywords = extractedKeywords.slice(0, 5); // Take top 5

        for (const k of topKeywords) {
            console.log(`[${region.code}] Deep Search: ${k.keyword}`);
            const deepVideos = await fetchTrendingShorts({
                regionCode: region.code,
                relevanceLanguage: region.lang,
                keywords: [k.keyword] // Recursively search for this new keyword
            }, 10); // Fetch a small batch per keyword

            const deepSaved = await saveToDatabase(deepVideos, region.code);
            totalVideos += deepSaved;
        }
    }

    return { success: true, totalProcessed: totalVideos };
}
