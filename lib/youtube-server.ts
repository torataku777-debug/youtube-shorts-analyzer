
import { google } from 'googleapis';

const youtube = google.youtube('v3');
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

if (!YOUTUBE_API_KEY) {
    throw new Error('YOUTUBE_API_KEY is not defined');
}

function parseDuration(duration: string): number {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    if (!match) return 0;
    const hours = (parseInt(match[1] || '0')) || 0;
    const minutes = (parseInt(match[2] || '0')) || 0;
    const seconds = (parseInt(match[3] || '0')) || 0;
    return hours * 3600 + minutes * 60 + seconds;
}

function containsJapanese(text: string): boolean {
    return /[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/.test(text);
}

// Kids Content Blacklist
const KIDS_KEYWORDS = [
    'CoComelon', 'BabyBus', 'Bebefinn', 'Little Angel', 'Super Simple Songs',
    'Pinkfong', 'ChuChu TV', 'LooLoo Kids', 'Blippi', 'Vlad and Niki',
    'Diana and Roma', 'Like Nastya', 'Maria Clara & JP', 'Kids', 'Nursery Rhymes',
    'あかちゃん', 'キッズ', '子供向け', '童謡'
];

function isKidsContent(item: any): boolean {
    // 1. YouTube API Flag
    if (item.status?.madeForKids) return true;

    // 2. Category 1 (Film & Animation) - very high correlation with kids content on Shorts
    // But strictly, we might not want to ban ALL animation. 
    // User asked to exclude Category 1 previously, so we keep that logic as "Kids-like" for now?
    // Actually, user said "Exclude Category 1 OR global kids channels".
    if (item.snippet?.categoryId === '1') return true;

    // 3. Keyword/Channel Check
    const title = (item.snippet?.title || '').toLowerCase();
    const channel = (item.snippet?.channelTitle || '').toLowerCase();

    return KIDS_KEYWORDS.some(k => title.includes(k.toLowerCase()) || channel.includes(k.toLowerCase()));
}

interface FetchOptions {
    regionCode: string;
    relevanceLanguage: string;
    keywords: string[];
}

export async function fetchTrendingShorts(options: FetchOptions & { forceSearch?: boolean }, targetCount = 20) {
    try {
        let shorts: any[] = [];
        let fetchedDataCount = 0;

        // Strategy 1: Real Trends (mostPopular)
        // Skip if forceSearch is true
        if (!options.forceSearch) {
            console.log(`[${options.regionCode}] Strategy 1: Scanning Most Popular...`);
            let pageToken: string | undefined = undefined;

            for (let i = 0; i < 10; i++) {
                if (shorts.length >= targetCount) break;

                const response: any = await youtube.videos.list({
                    key: YOUTUBE_API_KEY,
                    part: ['snippet', 'statistics', 'contentDetails', 'status'],
                    chart: 'mostPopular',
                    regionCode: options.regionCode,
                    maxResults: 50,
                    pageToken: pageToken
                });

                const items = response.data.items || [];
                const pageShorts = items.filter((item: any) => {
                    const d = parseDuration(item.contentDetails?.duration || '');
                    return d > 0 && d <= 61;
                });

                console.log(`[${options.regionCode}] Page ${i + 1}: Found ${pageShorts.length} shorts`);
                shorts = [...shorts, ...pageShorts];

                pageToken = response.data.nextPageToken || undefined;
                if (!pageToken) break;
            }
            console.log(`[${options.regionCode}] Trends strategy found total: ${shorts.length}`);
        }

        // Strategy 2: Search Backfill (or Primary if forceSearch is true)
        if (shorts.length < targetCount) {
            console.log(`[${options.regionCode}] Strategy 2: Searching keywords...`);

            // If forceSearch is on, we might want to iterate keywords more aggressively
            const queries = options.forceSearch
                ? options.keywords.map(k => `${k} #Shorts`)
                : [
                    `${options.keywords.join('|')} #Shorts`,
                    '#Shorts'
                ];

            for (const query of queries) {
                if (shorts.length >= targetCount) break;

                const response = await youtube.search.list({
                    key: YOUTUBE_API_KEY,
                    part: ['snippet'],
                    q: query,
                    type: ['video'],
                    videoDuration: 'short',
                    regionCode: options.regionCode,
                    relevanceLanguage: options.relevanceLanguage,
                    order: 'viewCount',
                    maxResults: 50
                });

                const searchItems = response.data.items || [];
                const videoIds = searchItems.map(i => i.id?.videoId).filter(Boolean) as string[];

                if (videoIds.length > 0) {
                    const details = await youtube.videos.list({
                        key: YOUTUBE_API_KEY,
                        part: ['snippet', 'statistics', 'contentDetails', 'status'],
                        id: videoIds
                    });

                    const items = details.data.items || [];
                    const filtered = items.filter((item: any) => {
                        const d = parseDuration(item.contentDetails?.duration || '');
                        if (d <= 0 || d > 61) return false;

                        // Language Filter
                        if (options.regionCode === 'JP') {
                            const hasJP = containsJapanese(item.snippet?.title || '') || containsJapanese(item.snippet?.description || '');
                            if (!hasJP) return false;
                        }

                        return true;
                    });

                    shorts = [...shorts, ...filtered];
                }
            }
        }

        // Dedup & Determine is_kids
        const uniqueMap = new Map();
        shorts.forEach(s => {
            if (!uniqueMap.has(s.id)) {
                s.is_kids_computed = isKidsContent(s);
                uniqueMap.set(s.id, s);
            }
        });

        const finalShorts = Array.from(uniqueMap.values());
        console.log(`[${options.regionCode}] Final count: ${finalShorts.length}`);
        return finalShorts;

    } catch (error) {
        console.error('Error fetching trending shorts:', error);
        return [];
    }
}

export async function fetchChannelStats(channelIds: string[]) {
    try {
        // 1. Strict Cleaning & Uniquing
        // .trim() each ID and filter out empty strings/falsy values
        const uniqueIds = [...new Set(
            channelIds
                .map(id => id?.trim())
                .filter((id): id is string => Boolean(id) && id.length > 0)
        )];

        if (uniqueIds.length === 0) {
            console.log('fetchChannelStats: No valid IDs found after cleaning.');
            return [];
        }

        console.log(`fetchChannelStats: Fetching stats for ${uniqueIds.length} channels.`);

        // 2. Chunking (max 50 per request)
        const CHUNK_SIZE = 50;
        let allItems: any[] = [];

        for (let i = 0; i < uniqueIds.length; i += CHUNK_SIZE) {
            const chunk = uniqueIds.slice(i, i + CHUNK_SIZE);

            const params = {
                key: YOUTUBE_API_KEY,
                part: ['snippet', 'statistics'],
                id: chunk, // Pass array, client handles join
            };

            // 3. Debug Logging
            console.log(`fetchChannelStats [Chunk ${Math.floor(i / CHUNK_SIZE) + 1}]: Fetching ${chunk.length} IDs`);
            // Explicitly log the exact params object to catch any "invalid filter" issues
            console.log('API Params:', JSON.stringify({ ...params, key: 'HIDDEN' }));

            const response = await youtube.channels.list(params);

            if (response.data.items) {
                allItems = [...allItems, ...response.data.items];
            }
        }

        return allItems;

    } catch (error: any) {
        console.error('Error fetching channel stats:',
            error.response?.data?.error || error.message || error
        );
        return [];
    }
}
