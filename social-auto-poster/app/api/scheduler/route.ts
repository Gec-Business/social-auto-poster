import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { getSchedulerStatus, markAsPosted, unmarkAsPosted } from '@/lib/scheduler-blobs';

export const dynamic = 'force-dynamic';

export async function GET() {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const status = await getSchedulerStatus();
    return NextResponse.json({ status });
  } catch (error) {
    console.error('Failed to get scheduler status:', error);
    return NextResponse.json({ error: 'Failed to get scheduler status' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { day, platform, posted } = body;

    if (typeof day !== 'number' || typeof platform !== 'string' || typeof posted !== 'boolean') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const status = posted
      ? await markAsPosted(day, platform)
      : await unmarkAsPosted(day, platform);

    return NextResponse.json({ status });
  } catch (error) {
    console.error('Failed to update scheduler status:', error);
    return NextResponse.json({ error: 'Failed to update scheduler status' }, { status: 500 });
  }
}
