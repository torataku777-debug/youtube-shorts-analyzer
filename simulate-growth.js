
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Error: Supabase keys not found');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function simulateGrowth() {
    console.log('Simulating Future Data Growth...');

    // 1. Get existing videos
    const { data: videos, error } = await supabase
        .from('videos')
        .select('id, title, daily_metrics(view_count, recorded_at)')
        .limit(10); // simulate top 10

    if (error) {
        console.error('Error fetching videos:', error);
        return;
    }

    // 2. Insert new metrics for 25 hours LATER (so it falls into 24h+ window to show growth compared to "now")
    // Actually, wait.
    // "Now" is real time.
    // The "Past" data is what we have (recorded ~20 mins ago).
    // If we want to verify "Growth", we need "Current" data that is BIGGER than "Past".
    // So we just need to insert a NEW record with timestamp = NOW() (or close to it) with HIGHER views.
    // The previous record will serve as the "Past" (since it was recorded earlier).
    // The RPC function looks for:
    //   Latest = Order by recorded_at DESC limit 1
    //   Past = recorded_at >= now() - period

    // So if we insert a new record NOW with +1000 views, 
    // Latest = New Record
    // Past = The one from 20 mins ago (which falls in "24h ago" window? No.)

    // Wait, the logic: `m.recorded_at >= now() - period`. 
    // If period=24h, then ANY record from last 24h matches "Past".
    // We pick the OLDEST in that window (`order by asc limit 1` in the distinct set).
    // So if we have Record A (20 mins ago) and Record B (Now), and window is 24h.
    // Oldest in window = Record A.
    // Latest = Record B.
    // Growth = B - A.
    // This works!

    const metricsToInsert = videos.map(v => {
        // Determine last view count
        const lastMetric = v.daily_metrics.sort((a, b) => new Date(b.recorded_at) - new Date(a.recorded_at))[0]; // actually we just need any base
        const baseViews = lastMetric ? lastMetric.view_count : 0;

        // Growth: Add 5% to 50% random
        const growthFactor = 1.05 + Math.random() * 0.45;
        const newViews = Math.floor(baseViews * growthFactor);

        return {
            video_id: v.id,
            view_count: newViews,
            like_count: Math.floor(newViews * 0.05), // approx 5% likes
            comment_count: Math.floor(newViews * 0.005),
            recorded_at: new Date().toISOString() // Now
        };
    });

    const { error: insertError } = await supabase
        .from('daily_metrics')
        .insert(metricsToInsert);

    if (insertError) {
        console.error('Error inserting simulated data:', insertError);
    } else {
        console.log(`✅ Successfully added ${metricsToInsert.length} new data points with higher views!`);
        console.log('Refresh the dashboard to see growth.');
    }
}

simulateGrowth();
