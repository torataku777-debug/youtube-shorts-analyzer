
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Error: Supabase keys not found in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifySupabase() {
    console.log('Verifying Supabase Connection...');

    // Try to select from a non-existent table or just check health implicitly
    // Ideally, we select from 'channels' but it might not exist yet.
    // The error "relation "channels" does not exist" confirms we reached the DB.
    // Or "401 Unauthorized" if keys are bad.

    const { data, error } = await supabase.from('channels').select('*').limit(1);

    if (error) {
        if (error.code === 'PGRST204' || error.message.includes('does not exist')) {
            console.log('✅ Connection Successful! (Tables not created yet, which is expected)');
        } else {
            console.log('⚠️ Connection reached, but error returned:', error.message);
        }
    } else {
        console.log('✅ Connection Successful! (Table exists)');
    }
}

verifySupabase();
