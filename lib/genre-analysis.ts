
export interface TrendGenre {
    id: string;
    name: string;
    description?: string;
    tags: string[];
    score: number; // 0-100 relevance
}

export async function getTrendGenres(region: 'JP' | 'US'): Promise<TrendGenre[]> {
    // In a real implementation, this would call an AI service that analyzes
    // the latest keywords from the DB and groups them.
    // For now, we return a hardcoded "Live" snapshot of current probable trends.

    if (region === 'JP') {
        return [
            {
                id: 'jp-1',
                name: '猫ミーム / 動物',
                tags: ['#猫', '#猫ミーム', '#cat', '#面白動画'],
                score: 95
            },
            {
                id: 'jp-2',
                name: '粗品 / 芸人ロケ',
                tags: ['#粗品', '#太客', '#ロケ', '#芸人'],
                score: 92
            },
            {
                id: 'jp-3',
                name: '崩壊スターレイル / 原神',
                tags: ['#崩壊スターレイル', '#原神', '#ピノコニー', '#ホタル'],
                score: 88
            },
            {
                id: 'jp-4',
                name: 'ASMR / 料理',
                tags: ['#ASMR', '#mukbang', '#料理', '#レシピ'],
                score: 85
            },
            {
                id: 'jp-5',
                name: 'VTuber切り抜き',
                tags: ['#ホロライブ', '#にじさんじ', '#葛葉', '#マリン'],
                score: 82
            },
            {
                id: 'jp-6',
                name: 'ライフハック / 掃除',
                tags: ['#ライフハック', '#掃除', '#便利グッズ', '#100均'],
                score: 78
            },
            {
                id: 'jp-7',
                name: 'K-POPダンス',
                tags: ['#ILLIT', '#Magnetic', '#LE_SSERAFIM', '#DanceChallenge'],
                score: 75
            },
            {
                id: 'jp-8',
                name: 'Minecraft / マイクラ',
                tags: ['#マイクラ', '#Minecraft', '#建築', '#サバイバル'],
                score: 72
            },
            {
                id: 'jp-9',
                name: '美容 / メイク',
                tags: ['#メイク', '#コスメ', '#スキンケア', '#垢抜け'],
                score: 70
            },
            {
                id: 'jp-10',
                name: '心霊 / 怖い話',
                tags: ['#心霊', '#怖い話', '#都市伝説', '#ホラー'],
                score: 68
            }
        ];
    } else {
        return [
            {
                id: 'us-1',
                name: 'Minecraft Mods / Challenges',
                tags: ['#minecraft', '#minecraftmods', '#challenge', '#camman18'],
                score: 98
            },
            {
                id: 'us-2',
                name: 'Skibidi Toilet / G-Man',
                tags: ['#skibiditoilet', '#dafuqboom', '#tvman', '#gman'],
                score: 95
            },
            {
                id: 'us-3',
                name: 'Gym Motivation / Fitness',
                tags: ['#gym', '#fitness', '#motivation', '#bodybuilding'],
                score: 90
            },
            {
                id: 'us-4',
                name: 'Roblox',
                tags: ['#roblox', '#robloxfyp', '#brookhaven', '#bloxfruits'],
                score: 88
            },
            {
                id: 'us-5',
                name: 'DIY / Satisfying',
                tags: ['#diy', '#satisfying', '#crafts', '#oddlysatisfying'],
                score: 85
            },
            {
                id: 'us-6',
                name: 'GTA 5 / Gaming',
                tags: ['#gta5', '#gta', '#gaming', '#grandtheftauto'],
                score: 82
            },
            {
                id: 'us-7',
                name: 'Sigma / Gigachad Memes',
                tags: ['#sigma', '#gigachad', '#patrickbateman', '#phonk'],
                score: 80
            },
            {
                id: 'us-8',
                name: 'Gadget Reviews / Tech',
                tags: ['#tech', '#iphone', '#samsung', '#gadgets'],
                score: 78
            },
            {
                id: 'us-9',
                name: 'Food / Cooking Hacks',
                tags: ['#food', '#cooking', '#recipe', '#foodie'],
                score: 75
            },
            {
                id: 'us-10',
                name: 'Pranks / Comedy',
                tags: ['#prank', '#funny', '#comedy', '#humor'],
                score: 72
            }
        ];
    }
}
