
const DOTENV_PATH = '.env.local';
const fs = require('fs');
const path = require('path');

// Basic env parser since we might not have dotenv installed
const envPath = path.resolve(process.cwd(), DOTENV_PATH);
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = envContent.split('\n').reduce((acc, line) => {
    const [key, value] = line.split('=');
    if (key && value) acc[key.trim()] = value.trim();
    return acc;
}, {});

const API_KEY = envVars.YOUTUBE_API_KEY;

if (!API_KEY) {
    console.error('Error: YOUTUBE_API_KEY not found in .env.local');
    process.exit(1);
}

const BASE_URL = 'https://www.googleapis.com/youtube/v3';

async function verifyKey() {
    console.log('Verifying YouTube API Key...');
    // Search for a generic term
    const params = new URLSearchParams({
        part: 'snippet',
        q: 'YouTube',
        maxResults: '1',
        type: 'video',
        key: API_KEY
    });

    try {
        const res = await fetch(`${BASE_URL}/search?${params}`);
        const data = await res.json();

        if (!res.ok) {
            console.error('API Error:', JSON.stringify(data, null, 2));
            return;
        }

        if (data.items && data.items.length > 0) {
            console.log('✅ Success! Found video:', data.items[0].snippet.title);
        } else {
            console.log('⚠️ API request succeeded but no items found (unlikely for "YouTube").');
            console.log(JSON.stringify(data, null, 2));
        }
    } catch (error) {
        console.error('Request Failed:', error);
    }
}

verifyKey();
