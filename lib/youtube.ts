
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY

if (!YOUTUBE_API_KEY) {
    console.warn('YOUTUBE_API_KEY is not set')
}

const BASE_URL = 'https://www.googleapis.com/youtube/v3'

export async function searchShorts(query: string = '', maxResults: number = 10) {
    // Note: YouTube API doesn't have a direct "shorts" filter. 
    // We typically search for "video" type and maybe "short" duration, but 
    // "short" duration (< 4 mins) includes normal short videos too. 
    // Often people search for "#shorts" in query.

    const q = query ? `${query} #shorts` : '#shorts'

    const params = new URLSearchParams({
        part: 'snippet',
        maxResults: maxResults.toString(),
        q: q,
        type: 'video',
        videoDuration: 'short',
        key: YOUTUBE_API_KEY!,
    })

    const res = await fetch(`${BASE_URL}/search?${params}`)
    if (!res.ok) {
        throw new Error(`YouTube API error: ${res.statusText}`)
    }
    return res.json()
}

export async function getVideoDetails(videoIds: string[]) {
    const params = new URLSearchParams({
        part: 'snippet,statistics,contentDetails',
        id: videoIds.join(','),
        key: YOUTUBE_API_KEY!,
    })

    const res = await fetch(`${BASE_URL}/videos?${params}`)
    if (!res.ok) {
        throw new Error(`YouTube API error: ${res.statusText}`)
    }
    return res.json()
}

export async function getChannelDetails(channelIds: string[]) {
    const params = new URLSearchParams({
        part: 'snippet,statistics',
        id: channelIds.join(','),
        key: YOUTUBE_API_KEY!,
    })

    const res = await fetch(`${BASE_URL}/channels?${params}`)
    if (!res.ok) {
        throw new Error(`YouTube API error: ${res.statusText}`)
    }
    return res.json()
}
