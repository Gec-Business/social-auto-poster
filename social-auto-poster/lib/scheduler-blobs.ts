import { getStore } from '@netlify/blobs';
import { SchedulerStatusMap, PostStatus } from './scheduler-types';

const STORE_NAME = 'social-scheduler';
const SCHEDULER_KEY = 'scheduler-status';

function getSchedulerStore() {
  if (process.env.NETLIFY_API_TOKEN) {
    return getStore({
      name: STORE_NAME,
      siteID: process.env.NETLIFY_SITE_ID!,
      token: process.env.NETLIFY_API_TOKEN,
    });
  }
  return getStore(STORE_NAME);
}

export async function getSchedulerStatus(): Promise<SchedulerStatusMap> {
  const store = getSchedulerStore();
  const data = await store.get(SCHEDULER_KEY, { type: 'json' }) as SchedulerStatusMap | null;
  return data || {};
}

export async function markAsPosted(
  day: number,
  platform: string,
  options?: { autoPosted?: boolean; postId?: string },
): Promise<SchedulerStatusMap> {
  const store = getSchedulerStore();
  const status = await getSchedulerStatus();

  const key = `day${day}_${platform}`;
  const entry: PostStatus = {
    posted: true,
    postedAt: new Date().toISOString(),
    ...(options?.autoPosted !== undefined && { autoPosted: options.autoPosted }),
    ...(options?.postId && { postId: options.postId }),
  };

  const updated: SchedulerStatusMap = { ...status, [key]: entry };
  await store.setJSON(SCHEDULER_KEY, updated);
  return updated;
}

export async function unmarkAsPosted(day: number, platform: string): Promise<SchedulerStatusMap> {
  const store = getSchedulerStore();
  const status = await getSchedulerStatus();

  const key = `day${day}_${platform}`;
  const { [key]: _, ...rest } = status;
  void _;

  await store.setJSON(SCHEDULER_KEY, rest);
  return rest;
}
