export interface KeywordStats {
    keyword: string;
    count: number;
}

const STOP_WORDS = new Set([
    // English Stop Words
    'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
    'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there',
    'their', 'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me', 'when', 'make', 'can', 'like', 'time', 'no',
    'just', 'him', 'know', 'take', 'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other', 'than', 'then',
    'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also', 'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well',
    'way', 'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us', 'youtube', 'video', 'shorts', 'short', 'channel',
    // Japanese Stop Words (common particles and generic terms)
    'の', 'に', 'は', 'を', 'た', 'が', 'で', 'て', 'と', 'し', 'れ', 'さ', 'ある', 'いる', 'も', 'する', 'から', 'な', 'こと', 'として',
    'い', 'や', 'れる', 'など', 'なっ', 'ない', 'この', 'ため', 'その', 'あっ', 'よう', 'また', 'もの', 'という', 'あり', 'まで',
    'られ', 'なる', 'へ', 'か', 'だ', 'これ', 'によって', 'により', 'おり', 'より', 'による', 'ず', 'なり', 'られる', 'において',
    'ば', 'なかっ', 'なく', 'しかし', 'について', 'せ', 'だっ', 'その後', 'できる', 'そこ', '動画', 'ショート', '登録', 'チャンネル'
]);

export function extractTrendingKeywords(videos: { title: string, description: string }[]): KeywordStats[] {
    const wordCounts = new Map<string, number>();

    videos.forEach(video => {
        // Combine title and description
        const text = (video.title + " " + (video.description || "")).toLowerCase();

        // Extract hashtags explicitly
        const hashtags = text.match(/#[^\s#]+/g) || [];
        hashtags.forEach(tag => {
            const cleanTag = tag.replace('#', '');
            if (cleanTag.length > 1) {
                wordCounts.set(cleanTag, (wordCounts.get(cleanTag) || 0) + 1);
            }
        });

        // Tokenize text for words (simple space separation for EN, could use tokenizer for JP but simple regex works for major keywords)
        // Removing special chars
        const cleanText = text.replace(/#[^\s#]+/g, '') // remove hashtags from text stream to avoid double counting
            .replace(/[!?,.。"';:()\[\]]/g, ' ');

        const words = cleanText.split(/\s+/);

        words.forEach(word => {
            if (word.length < 2) return;
            if (STOP_WORDS.has(word)) return;
            if (/^\d+$/.test(word)) return; // skip numbers

            wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
        });
    });

    // Convert to array and sort
    const sortedKeywords = Array.from(wordCounts.entries())
        .map(([keyword, count]) => ({ keyword, count }))
        .sort((a, b) => b.count - a.count);

    // Return top 20
    return sortedKeywords.slice(0, 20);
}
