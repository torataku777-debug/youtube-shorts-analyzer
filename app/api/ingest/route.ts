import { NextResponse } from 'next/server';
import { runIngestProcess } from '@/lib/ingest-logic';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const result = await runIngestProcess();
        return NextResponse.json(result);
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
