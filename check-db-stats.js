
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');


const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Error: Supabase keys not found in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: false
    }
});

async function checkStats() {
    console.log('Checking Video Statistics...');

    // 1. Total Count
    const { count: total, error: countError } = await supabase
        .from('videos')
        .select('*', { count: 'exact', head: true });

    if (countError) {
        console.error('Error fetching total count:', countError.message);
    } else {
        console.log(`Total Videos: ${total}`);
    }

    // 2. Breakdown by Region
    // Note: 'videos' table has 'region' column (JP/US)
    const { data: regionData, error: regionError } = await supabase
        .from('videos')
        .select('region');

    if (regionError) {
        console.error('Error fetching region stats:', regionError.message);
    } else {
        const stats = regionData.reduce((acc, curr) => {
            const r = curr.region || 'Unknown';
            acc[r] = (acc[r] || 0) + 1;
            return acc;
        }, {});

        console.log('Breakdown by Region:');
        console.log(JSON.stringify(stats, null, 2));
    }
}

checkStats();
