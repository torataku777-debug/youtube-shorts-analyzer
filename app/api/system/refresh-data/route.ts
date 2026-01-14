import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { runIngestProcess } from '@/lib/ingest-logic';

export const dynamic = 'force-dynamic';

export async function POST() {
    try {
        console.log('Starting System Data Refresh...');

        // 1. Clear Data
        // Order matters for foreign keys if they exist, but here we can just delete from main tables.
        // Option A: Truncate (requires owner privileges often).
        // Option B: Delete *.

        console.log('Clearing old data...');
        // Delete metrics first (FK to videos)
        const { error: error1 } = await supabase.from('daily_metrics').delete().neq('id', 0); // neq id 0 is a hack to delete all rows in Supabase sometimes if no filter provided
        if (error1) console.error('Error clearing metrics:', error1);

        // Delete videos (FK to channels - we keep channels for now? or delete them too?)
        // User asked for "Existing data clear".
        // If we keep channels, we save API quota on re-fetching channel stats IF we reused them.
        // But `ingest-logic` fetches channel stats for every video found.
        // So keeping channels is fine, but deleting videos is key.
        const { error: error2 } = await supabase.from('videos').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (error2) console.error('Error clearing videos:', error2);

        // Delete keywords too to refresh trends?
        const { error: error3 } = await supabase.from('trending_keywords').delete().neq('id', 0);
        if (error3) console.error('Error clearing keywords:', error3);

        // 2. Re-Ingest
        console.log('Triggering ingestion...');
        const result = await runIngestProcess();

        return NextResponse.json(result);

    } catch (error) {
        console.error('System Refresh Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
