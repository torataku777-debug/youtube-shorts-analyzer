const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Check environments
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('--- Supabase Connection Verification ---');

const isKeyValid = supabaseUrl && supabaseAnonKey && supabaseAnonKey.startsWith('eyJ');

if (isKeyValid) {
    console.log('✅ Supabase Keys detected. Attempting connection...');
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    (async () => {
        try {
            console.log('Attempting to connect with:', {
                url: supabaseUrl,
                keyLength: supabaseAnonKey?.length,
                keyPrefix: supabaseAnonKey?.substring(0, 5)
            });
            const { data, error } = await supabase.from('channels').select('*').limit(1);

            if (error) {
                console.error('Supabase Error:', JSON.stringify(error, null, 2));
                if (error.code === 'PGRST204' || error.message.includes('does not exist')) {
                    console.log('✅ Connection Successful! (Tables not created yet, which is expected)');
                } else {
                    console.log('⚠️ Connection reached, but error returned:', error.message);
                }
            } else {
                console.log('✅ Connection Successful!');
            }
        } catch (err) {
            console.error('Unexpected Error:', err);
        }
    })();
} else {
    console.log('⚠️  Supabase Keys missing or invalid.');
    console.log('ℹ️  Checking for Local JSON Fallback configuration...');

    const dataProviderPath = path.join(__dirname, 'lib', 'data-provider.ts');
    if (fs.existsSync(dataProviderPath)) {
        console.log('✅ Local Data Provider found at lib/data-provider.ts');
        console.log('✅ System should utilize Local JSON Fallback.');
    } else {
        console.error('❌ Data Provider NOT found. System may be broken.');
        process.exit(1);
    }
}
