
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Error: Supabase keys not found');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function clearData() {
    console.log('Clearing all data from Supabase...');

    // Delete videos (Cascade deletes metrics)
    // We need to delete mostly everything to start fresh with JP data.
    // Channels too? Yes, to keep it clean.

    const { error: vError } = await supabase.from('videos').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    if (vError) console.error('Error deleting videos:', vError.message);
    else console.log('✅ Videos deleted');

    const { error: cError } = await supabase.from('channels').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    if (cError) console.error('Error deleting channels:', cError.message);
    else console.log('✅ Channels deleted');

    console.log('Data cleared.');
}

clearData();
