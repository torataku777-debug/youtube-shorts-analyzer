
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

export async function fetchTrendingShorts(options: FetchOptions, targetCount = 20) {
    try {
        let shorts: any[] = [];

        // Strategy 1: Real Trends (mostPopular)
        console.log(`[${options.regionCode}] Strategy 1: Scanning Most Popular...`);
        let pageToken: string | undefined = undefined;

        // Loop until we reach targetCount (or close to it/run out of pages)
        // We use a safe upper bound (e.g. 10 pages) to prevent infinite loops
        for (let i = 0; i < 10; i++) {
            if (shorts.length >= targetCount) break;

            const response: any = await youtube.videos.list({
                key: YOUTUBE_API_KEY,
                part: ['snippet', 'statistics', 'contentDetails', 'status'], // Added 'status'
                chart: 'mostPopular',
                regionCode: options.regionCode,
                maxResults: 50,
                pageToken: pageToken // Pass the token!
            });

            const items = response.data.items || [];
            const pageShorts = items.filter(item => {
                const d = parseDuration(item.contentDetails?.duration || '');
                return d > 0 && d <= 61;
            });

            console.log(`[${options.regionCode}] Page ${i + 1}: Found ${pageShorts.length} shorts`);
            shorts = [...shorts, ...pageShorts];

            pageToken = response.data.nextPageToken || undefined;
            if (!pageToken) break;
        }
        console.log(`[${options.regionCode}] Trends strategy found total: ${shorts.length}`);

        // Strategy 2: Search Backfill
        if (shorts.length < targetCount) {
            console.log(`[${options.regionCode}] Strategy 2: Searching keywords...`);

            const queries = [
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
                        part: ['snippet', 'statistics', 'contentDetails', 'status'], // Added 'status'
                        id: videoIds
                    });

                    const items = details.data.items || [];
                    const filtered = items.filter(item => {
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
                // Attach our computed is_kids flag to the object for easy access later
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
        const response = await youtube.channels.list({
            key: YOUTUBE_API_KEY,
            part: ['snippet', 'statistics'],
            id: channelIds,
        });
        return response.data.items || [];
    } catch (error) {
        console.error('Error fetching channel stats:', error);
        return [];
    }
}
