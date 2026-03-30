import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { postSingleNow } from '@/lib/social-publisher';
import { Platform } from '@/lib/scheduler-types';
import { getCampaignLength } from '@/lib/scheduler-data';

export const dynamic = 'force-dynamic';

const VALID_PLATFORMS: Platform[] = ['facebook', 'instagram', 'linkedin'];

export async function POST(request: Request) {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { day, platform } = body;
    const maxDay = getCampaignLength();

    if (typeof day !== 'number' || day < 1 || day > maxDay) {
      return NextResponse.json({ error: `Invalid day (must be 1-${maxDay})` }, { status: 400 });
    }

    if (!VALID_PLATFORMS.includes(platform)) {
      return NextResponse.json({ error: 'Platform must be facebook, instagram, or linkedin' }, { status: 400 });
    }

    const result = await postSingleNow(day, platform);

    if (!result.success) {
      return NextResponse.json({ error: result.error, result }, { status: 422 });
    }

    return NextResponse.json({ result });
  } catch (error) {
    console.error('Post-now failed:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
