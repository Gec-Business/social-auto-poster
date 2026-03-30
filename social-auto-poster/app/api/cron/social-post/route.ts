import { NextRequest, NextResponse } from 'next/server';
import { runAutoPost } from '@/lib/social-publisher';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// In-memory lock to prevent concurrent runs within the same instance
let isRunning = false;

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-cron-secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (isRunning) {
    console.log('[social-post] Skipping — another run is already in progress');
    return NextResponse.json({ skipped: 'Already running' });
  }

  isRunning = true;
  try {
    const result = await runAutoPost();
    console.log('[social-post] Auto-post result:', JSON.stringify(result, null, 2));
    return NextResponse.json(result);
  } catch (err) {
    console.error('[social-post] Error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  } finally {
    isRunning = false;
  }
}
