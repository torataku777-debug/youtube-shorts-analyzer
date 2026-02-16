const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const CHANNELS_FILE = path.join(DATA_DIR, 'channels.json');
const VIDEOS_FILE = path.join(DATA_DIR, 'videos.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DUMMY_CHANNELS = [
    {
        id: "c1",
        youtube_id: "UC123456789",
        title: "Test Channel JP",
        thumbnail_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=test1",
        custom_url: "@testjp",
        video_count: 100,
        view_count: 500000,
        published_at: "2023-01-01T00:00:00Z",
        country: "JP"
    },
    {
        id: "c2",
        youtube_id: "UC987654321",
        title: "Gaming Channel",
        thumbnail_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=test2",
        custom_url: "@gaming",
        video_count: 50,
        view_count: 200000,
        published_at: "2023-01-01T00:00:00Z",
        country: "JP"
    }
];

const DUMMY_VIDEOS = [
    {
        id: "v1",
        youtube_id: "vid1",
        title: "すごい！30秒でわかる料理ハック #Shorts",
        description: "Easy cooking Hack! #shorts",
        thumbnail_url: "https://placehold.co/400x700/orange/white?text=Cooking",
        published_at: new Date().toISOString(), // Now
        view_count: 15000,
        like_count: 500,
        comment_count: 50,
        channel_id: "c1",
        is_high_rpm: false,
        is_faceless: true,
        is_kids: false,
        audio_info: "Original Sound",
        region: "JP"
    },
    {
        id: "v2",
        youtube_id: "vid2",
        title: "マインクラフト裏技！ #Minecraft",
        description: "Minecraft tricks",
        thumbnail_url: "https://placehold.co/400x700/green/white?text=Minecraft",
        published_at: new Date().toISOString(), // Now
        view_count: 25000,
        like_count: 1200,
        comment_count: 100,
        channel_id: "c2",
        is_high_rpm: true,
        is_faceless: true,
        is_kids: false,
        audio_info: "Game Sound",
        region: "JP"
    },
    {
        id: "v3",
        youtube_id: "vid3",
        title: "Old Video (Should be hidden)",
        description: "Old",
        thumbnail_url: "https://placehold.co/400x700/gray/white?text=Old",
        published_at: "2023-01-01T00:00:00Z",
        view_count: 100,
        like_count: 1,
        comment_count: 1,
        channel_id: "c1",
        is_high_rpm: false,
        is_faceless: false,
        is_kids: false,
        audio_info: "None",
        region: "JP"
    }
];

console.log('Seeding dummy data...');
fs.writeFileSync(CHANNELS_FILE, JSON.stringify(DUMMY_CHANNELS, null, 2));
fs.writeFileSync(VIDEOS_FILE, JSON.stringify(DUMMY_VIDEOS, null, 2));
console.log('Done!');
