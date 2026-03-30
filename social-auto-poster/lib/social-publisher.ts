/**
 * Auto-posting to Facebook Page, Instagram, and LinkedIn via APIs.
 * Supports images, carousels, videos/reels, and text posts.
 *
 * Env vars required:
 *   META_PAGE_ID          - Facebook Page ID
 *   META_PAGE_TOKEN       - Permanent Page Access Token
 *   META_IG_ACCOUNT_ID    - Instagram Business Account ID
 *   LINKEDIN_ORG_ID       - LinkedIn Organization (Company Page) ID
 *   LINKEDIN_CLIENT_ID    - LinkedIn App Client ID
 *   LINKEDIN_CLIENT_SECRET- LinkedIn App Client Secret
 */

import { SITE_CONFIG } from './config';
import { CAMPAIGN_POSTS, getTodaysDayNumber, getCampaignLength } from './scheduler-data';
import { ALL_ASSETS } from './asset-manifest';
import { Platform, SchedulerPost, ContentType } from './scheduler-types';
import { getSchedulerStatus, markAsPosted } from './scheduler-blobs';
import { getValidLinkedInToken } from './linkedin-tokens';

const GRAPH_API = 'https://graph.facebook.com/v25.0';

export interface SocialPostResult {
  platform: Platform;
  day: number;
  success: boolean;
  postId?: string;
  error?: string;
}

const VIDEO_CONTENT_TYPES: ContentType[] = ['reel', 'video'];

function isVideoContent(contentType: ContentType): boolean {
  return VIDEO_CONTENT_TYPES.includes(contentType);
}

// -- Asset resolution -----------------------------------------------

function findCarouselSlides(day: number): string[] {
  return ALL_ASSETS
    .filter(a => a.category === 'carousel' && a.day === day)
    .sort((a, b) => (a.slideNum || 0) - (b.slideNum || 0))
    .map(a => a.url);
}

function findVideoForPost(post: SchedulerPost): string | null {
  // 1. Day-specific video/reel asset
  const dayVideo = ALL_ASSETS.find(
    a => (a.category === 'video' || a.category === 'reel') && a.day === post.day,
  );
  if (dayVideo) return dayVideo.url;

  // 2. Any reel asset by rotation
  const reels = ALL_ASSETS.filter(a => a.category === 'reel' || a.category === 'video');
  if (reels.length > 0) {
    const idx = (post.day - 1) % reels.length;
    return reels[idx].url;
  }

  return null;
}

function findImageForPost(post: SchedulerPost): string | null {
  // 1. Carousel first slide
  if (post.contentType === 'carousel') {
    const slides = findCarouselSlides(post.day);
    if (slides.length > 0) return slides[0];
  }

  // 2. Any day-specific image asset (skip video assets)
  const dayAsset = ALL_ASSETS.find(
    a => a.day === post.day && a.category !== 'video' && a.category !== 'reel',
  );
  if (dayAsset) return dayAsset.url;

  // 3. Story frames
  if (post.contentType === 'story') {
    const stories = ALL_ASSETS.filter(a => a.category === 'story' && a.slideNum === 1);
    if (stories.length > 0) {
      const idx = (post.day - 1) % stories.length;
      return stories[idx].url;
    }
  }

  return null;
}

// -- Caption builder ------------------------------------------------

function buildCaption(post: SchedulerPost): string {
  const link = SITE_CONFIG.campaignLink;
  let caption = post.copyPrimary;

  // Replace registration link placeholder
  caption = caption.replace(/\[REGISTRATION_LINK\]/g, link);

  // Append hashtags
  if (post.hashtags.length > 0) {
    caption += '\n\n' + post.hashtags.join(' ');
  }

  // Ensure the campaign link is present
  if (!caption.includes(link)) {
    caption += '\n\n\u{1F517} ' + link;
  }

  // Bot attribution
  caption += SITE_CONFIG.botAttributionLine;

  return caption;
}

// -- Facebook publishing --------------------------------------------

async function postToFacebook(
  message: string,
  imageUrl?: string,
): Promise<{ success: boolean; postId?: string; error?: string }> {
  const pageId = process.env.META_PAGE_ID;
  const token = process.env.META_PAGE_TOKEN;
  if (!pageId || !token) return { success: false, error: 'META_PAGE_ID or META_PAGE_TOKEN not set' };

  try {
    const endpoint = imageUrl
      ? `${GRAPH_API}/${pageId}/photos`
      : `${GRAPH_API}/${pageId}/feed`;

    const body: Record<string, string> = { message, access_token: token };
    if (imageUrl) body.url = imageUrl;

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (data.error) return { success: false, error: data.error.message };
    return { success: true, postId: data.id || data.post_id };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

async function postVideoToFacebook(
  description: string,
  videoUrl: string,
): Promise<{ success: boolean; postId?: string; error?: string }> {
  const pageId = process.env.META_PAGE_ID;
  const token = process.env.META_PAGE_TOKEN;
  if (!pageId || !token) return { success: false, error: 'META_PAGE_ID or META_PAGE_TOKEN not set' };

  try {
    // Download the video file
    const videoRes = await fetch(videoUrl);
    if (!videoRes.ok) return { success: false, error: `Failed to download video: ${videoRes.status}` };
    const videoBuffer = await videoRes.arrayBuffer();
    const videoBlob = new Blob([videoBuffer], { type: 'video/mp4' });

    // Facebook video upload via resumable upload
    // Step 1: Start upload session
    const startRes = await fetch(`${GRAPH_API}/${pageId}/videos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        upload_phase: 'start',
        file_size: videoBuffer.byteLength,
        access_token: token,
      }),
    });

    const startData = await startRes.json();
    if (startData.error) return { success: false, error: startData.error.message };

    const { upload_session_id, start_offset, end_offset } = startData;

    // Step 2: Upload chunks
    let currentStart = Number(start_offset);
    let currentEnd = Number(end_offset);

    while (currentStart < videoBuffer.byteLength) {
      const chunk = videoBlob.slice(currentStart, currentEnd);
      const formData = new FormData();
      formData.append('upload_phase', 'transfer');
      formData.append('upload_session_id', upload_session_id);
      formData.append('start_offset', String(currentStart));
      formData.append('access_token', token);
      formData.append('video_file_chunk', chunk, 'chunk.mp4');

      const chunkRes = await fetch(`${GRAPH_API}/${pageId}/videos`, {
        method: 'POST',
        body: formData,
      });

      const chunkData = await chunkRes.json();
      if (chunkData.error) return { success: false, error: chunkData.error.message };

      currentStart = Number(chunkData.start_offset);
      currentEnd = Number(chunkData.end_offset);
    }

    // Step 3: Finish upload
    const finishRes = await fetch(`${GRAPH_API}/${pageId}/videos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        upload_phase: 'finish',
        upload_session_id,
        description,
        access_token: token,
      }),
    });

    const finishData = await finishRes.json();
    if (finishData.error) return { success: false, error: finishData.error.message };
    return { success: true, postId: finishData.id || finishData.post_id };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

// -- Instagram publishing -------------------------------------------

async function igCreateContainer(
  imageUrl: string,
  caption?: string,
  isCarouselItem?: boolean,
): Promise<string | null> {
  const igId = process.env.META_IG_ACCOUNT_ID;
  const token = process.env.META_PAGE_TOKEN;
  if (!igId || !token) return null;

  const params: Record<string, string> = { image_url: imageUrl, access_token: token };
  if (caption) params.caption = caption;
  if (isCarouselItem) params.is_carousel_item = 'true';

  const res = await fetch(`${GRAPH_API}/${igId}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const data = await res.json();
  if (data.error) {
    console.error('[social-publisher] IG container error:', data.error);
    return null;
  }
  return data.id || null;
}

async function igCreateReelContainer(
  videoUrl: string,
  caption: string,
): Promise<string | null> {
  const igId = process.env.META_IG_ACCOUNT_ID;
  const token = process.env.META_PAGE_TOKEN;
  if (!igId || !token) return null;

  const params: Record<string, string> = {
    media_type: 'REELS',
    video_url: videoUrl,
    caption,
    access_token: token,
  };

  const res = await fetch(`${GRAPH_API}/${igId}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const data = await res.json();
  if (data.error) {
    console.error('[social-publisher] IG reel container error:', data.error);
    return null;
  }
  return data.id || null;
}

async function igCheckContainerStatus(containerId: string): Promise<'FINISHED' | 'IN_PROGRESS' | 'ERROR'> {
  const token = process.env.META_PAGE_TOKEN;
  if (!token) return 'ERROR';

  const res = await fetch(
    `${GRAPH_API}/${containerId}?fields=status_code&access_token=${token}`,
  );
  const data = await res.json();
  if (data.error) return 'ERROR';
  return data.status_code || 'IN_PROGRESS';
}

async function igCreateCarouselContainer(childIds: string[], caption: string): Promise<string | null> {
  const igId = process.env.META_IG_ACCOUNT_ID;
  const token = process.env.META_PAGE_TOKEN;
  if (!igId || !token) return null;

  const res = await fetch(`${GRAPH_API}/${igId}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      media_type: 'CAROUSEL',
      children: childIds.join(','),
      caption,
      access_token: token,
    }),
  });

  const data = await res.json();
  if (data.error) {
    console.error('[social-publisher] IG carousel container error:', data.error);
    return null;
  }
  return data.id || null;
}

async function igPublish(containerId: string): Promise<{ success: boolean; postId?: string; error?: string }> {
  const igId = process.env.META_IG_ACCOUNT_ID;
  const token = process.env.META_PAGE_TOKEN;
  if (!igId || !token) return { success: false, error: 'META_IG_ACCOUNT_ID or META_PAGE_TOKEN not set' };

  // Instagram needs a few seconds to process the container
  await new Promise(r => setTimeout(r, 5000));

  const res = await fetch(`${GRAPH_API}/${igId}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ creation_id: containerId, access_token: token }),
  });

  const data = await res.json();
  if (data.error) return { success: false, error: data.error.message };
  return { success: true, postId: data.id };
}

async function igWaitForProcessing(containerId: string, maxWaitMs = 60_000): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    const status = await igCheckContainerStatus(containerId);
    if (status === 'FINISHED') return true;
    if (status === 'ERROR') return false;
    await new Promise(r => setTimeout(r, 3000));
  }
  return false;
}

async function postToInstagram(
  caption: string,
  imageUrls: string[],
): Promise<{ success: boolean; postId?: string; error?: string }> {
  if (imageUrls.length === 0) {
    return { success: false, error: 'No image for Instagram' };
  }

  try {
    if (imageUrls.length === 1) {
      const containerId = await igCreateContainer(imageUrls[0], caption);
      if (!containerId) return { success: false, error: 'Failed to create IG container' };
      return igPublish(containerId);
    }

    // Carousel (2-10 images)
    const childIds: string[] = [];
    for (const url of imageUrls.slice(0, 10)) {
      const id = await igCreateContainer(url, undefined, true);
      if (id) childIds.push(id);
    }

    if (childIds.length < 2) {
      const containerId = await igCreateContainer(imageUrls[0], caption);
      if (!containerId) return { success: false, error: 'Failed to create IG container' };
      return igPublish(containerId);
    }

    const carouselId = await igCreateCarouselContainer(childIds, caption);
    if (!carouselId) return { success: false, error: 'Failed to create carousel container' };

    // igPublish already waits 5s internally — no extra wait needed here
    return igPublish(carouselId);
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

async function postReelToInstagram(
  caption: string,
  videoUrl: string,
): Promise<{ success: boolean; postId?: string; error?: string }> {
  try {
    const containerId = await igCreateReelContainer(videoUrl, caption);
    if (!containerId) return { success: false, error: 'Failed to create IG reel container' };

    // Videos need longer processing — poll status instead of fixed wait
    const ready = await igWaitForProcessing(containerId);
    if (!ready) return { success: false, error: 'IG reel processing timed out or failed' };

    // Publish the processed reel
    const igId = process.env.META_IG_ACCOUNT_ID;
    const token = process.env.META_PAGE_TOKEN;
    if (!igId || !token) return { success: false, error: 'META_IG_ACCOUNT_ID or META_PAGE_TOKEN not set' };

    const res = await fetch(`${GRAPH_API}/${igId}/media_publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ creation_id: containerId, access_token: token }),
    });

    const data = await res.json();
    if (data.error) return { success: false, error: data.error.message };
    return { success: true, postId: data.id };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

// -- LinkedIn publishing --------------------------------------------

const LINKEDIN_API = 'https://api.linkedin.com';
const LINKEDIN_VERSION = '202602';

function getLinkedInOrgUrn(): string | null {
  const orgId = process.env.LINKEDIN_ORG_ID;
  return orgId ? `urn:li:organization:${orgId}` : null;
}

async function liUploadImage(
  token: string,
  ownerUrn: string,
  imageUrl: string,
): Promise<string | null> {
  try {
    const initRes = await fetch(`${LINKEDIN_API}/rest/images?action=initializeUpload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
        'LinkedIn-Version': LINKEDIN_VERSION,
      },
      body: JSON.stringify({
        initializeUploadRequest: { owner: ownerUrn },
      }),
    });

    const initData = await initRes.json();
    if (!initData.value) {
      console.error('[social-publisher] LI image init error:', initData);
      return null;
    }

    const { uploadUrl, image: imageUrn } = initData.value;

    const imgRes = await fetch(imageUrl);
    const imgBuffer = await imgRes.arrayBuffer();

    const uploadRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` },
      body: imgBuffer,
    });

    if (uploadRes.status !== 201 && uploadRes.status !== 200) {
      console.error('[social-publisher] LI image upload failed:', uploadRes.status);
      return null;
    }

    return imageUrn;
  } catch (err) {
    console.error('[social-publisher] LI image upload error:', err);
    return null;
  }
}

async function liUploadVideo(
  token: string,
  ownerUrn: string,
  videoUrl: string,
): Promise<string | null> {
  try {
    // Download the video
    const videoRes = await fetch(videoUrl);
    if (!videoRes.ok) {
      console.error('[social-publisher] LI video download failed:', videoRes.status);
      return null;
    }
    const videoBuffer = await videoRes.arrayBuffer();

    // Step 1: Initialize video upload
    const initRes = await fetch(`${LINKEDIN_API}/rest/videos?action=initializeUpload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
        'LinkedIn-Version': LINKEDIN_VERSION,
      },
      body: JSON.stringify({
        initializeUploadRequest: {
          owner: ownerUrn,
          fileSizeBytes: videoBuffer.byteLength,
        },
      }),
    });

    const initData = await initRes.json();
    if (!initData.value) {
      console.error('[social-publisher] LI video init error:', initData);
      return null;
    }

    const { video: videoUrn, uploadInstructions } = initData.value;

    if (!uploadInstructions || uploadInstructions.length === 0) {
      console.error('[social-publisher] LI video: no upload instructions');
      return null;
    }

    // Step 2: Upload each chunk
    for (const instruction of uploadInstructions) {
      const { uploadUrl, firstByte, lastByte } = instruction;
      const chunk = videoBuffer.slice(firstByte, lastByte + 1);

      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/octet-stream',
        },
        body: chunk,
      });

      if (uploadRes.status !== 200 && uploadRes.status !== 201) {
        console.error('[social-publisher] LI video chunk upload failed:', uploadRes.status);
        return null;
      }
    }

    // Step 3: Finalize upload
    const finalizeRes = await fetch(`${LINKEDIN_API}/rest/videos?action=finalizeUpload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
        'LinkedIn-Version': LINKEDIN_VERSION,
      },
      body: JSON.stringify({
        finalizeUploadRequest: { video: videoUrn, uploadToken: '' },
      }),
    });

    if (finalizeRes.status !== 200 && finalizeRes.status !== 202) {
      console.error('[social-publisher] LI video finalize failed:', finalizeRes.status);
      return null;
    }

    return videoUrn;
  } catch (err) {
    console.error('[social-publisher] LI video upload error:', err);
    return null;
  }
}

async function postToLinkedIn(
  caption: string,
  opts?: { imageUrl?: string; videoUrl?: string },
): Promise<{ success: boolean; postId?: string; error?: string }> {
  const token = await getValidLinkedInToken();
  if (!token) return { success: false, error: 'LinkedIn not connected \u2014 visit /api/linkedin to authorize' };

  const orgUrn = getLinkedInOrgUrn();
  if (!orgUrn) return { success: false, error: 'LINKEDIN_ORG_ID not set' };

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const postBody: any = {
      author: orgUrn,
      commentary: caption,
      visibility: 'PUBLIC',
      distribution: {
        feedDistribution: 'MAIN_FEED',
        targetEntities: [],
        thirdPartyDistributionChannels: [],
      },
      lifecycleState: 'PUBLISHED',
      isReshareDisabledByAuthor: false,
    };

    if (opts?.videoUrl) {
      const videoUrn = await liUploadVideo(token, orgUrn, opts.videoUrl);
      if (videoUrn) {
        postBody.content = {
          media: { altText: 'Post video', id: videoUrn },
        };
      } else {
        console.error('[social-publisher] LI video upload failed, posting as text');
      }
    } else if (opts?.imageUrl) {
      const imageUrn = await liUploadImage(token, orgUrn, opts.imageUrl);
      if (imageUrn) {
        postBody.content = {
          media: { altText: 'Post image', id: imageUrn },
        };
      }
    }

    const res = await fetch(`${LINKEDIN_API}/rest/posts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
        'LinkedIn-Version': LINKEDIN_VERSION,
      },
      body: JSON.stringify(postBody),
    });

    if (res.status === 201) {
      const postId = res.headers.get('x-restli-id') || '';
      return { success: true, postId };
    }

    const errData = await res.json().catch(() => ({}));
    return { success: false, error: errData.message || `LinkedIn API returned ${res.status}` };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

// -- Unified publish for a single platform --------------------------

async function publishPost(
  post: SchedulerPost,
  platform: Platform,
  caption: string,
): Promise<SocialPostResult> {
  const isVideo = isVideoContent(post.contentType);
  const videoUrl = isVideo ? findVideoForPost(post) : null;
  const imageUrl = findImageForPost(post);
  const carouselImages = findCarouselSlides(post.day);

  if (platform === 'facebook') {
    if (isVideo && videoUrl) {
      const fb = await postVideoToFacebook(caption, videoUrl);
      return { platform, day: post.day, ...fb };
    }
    const fb = await postToFacebook(caption, imageUrl || undefined);
    return { platform, day: post.day, ...fb };
  }

  if (platform === 'linkedin') {
    if (isVideo && videoUrl) {
      const li = await postToLinkedIn(caption, { videoUrl });
      return { platform, day: post.day, ...li };
    }
    const li = await postToLinkedIn(caption, { imageUrl: imageUrl || undefined });
    return { platform, day: post.day, ...li };
  }

  // Instagram
  if (isVideo && videoUrl) {
    const ig = await postReelToInstagram(caption, videoUrl);
    return { platform, day: post.day, ...ig };
  }

  const imgs = carouselImages.length >= 2 ? carouselImages : imageUrl ? [imageUrl] : [];
  if (imgs.length === 0) {
    return { platform, day: post.day, success: false, error: 'No image or video available for Instagram' };
  }
  const ig = await postToInstagram(caption, imgs);
  return { platform, day: post.day, ...ig };
}

// -- Single post on demand ------------------------------------------

export async function postSingleNow(
  day: number,
  platform: Platform,
  { auto = false }: { auto?: boolean } = {},
): Promise<SocialPostResult> {
  const post = CAMPAIGN_POSTS.find(p => p.day === day && p.platforms.includes(platform));
  if (!post) {
    return { platform, day, success: false, error: `No post found for day ${day} / ${platform}` };
  }

  // Check if already posted to prevent duplicate posts
  const status = await getSchedulerStatus();
  const key = `day${day}_${platform}`;
  if (status[key]?.posted) {
    return { platform, day, success: false, error: `Already posted (day ${day} / ${platform})` };
  }

  const caption = buildCaption(post);
  const result = await publishPost(post, platform, caption);

  if (result.success) {
    await markAsPosted(day, platform, { autoPosted: auto, postId: result.postId });
  }

  return result;
}

// -- Main entry point (cron) ----------------------------------------

export async function runAutoPost(): Promise<{
  day: number;
  results: SocialPostResult[];
  skipped: string[];
}> {
  const today = getTodaysDayNumber();
  const results: SocialPostResult[] = [];
  const skipped: string[] = [];
  const maxDay = getCampaignLength();

  if (today === 0 || today > maxDay) {
    return { day: today, results, skipped: ['Campaign not active'] };
  }

  // Catch-up: post ALL missed days from Day 1 to today
  const daysToCheck = Array.from({ length: today }, (_, i) => i + 1);

  for (const dayNum of daysToCheck) {
    const posts = CAMPAIGN_POSTS.filter(p => p.day === dayNum);

    for (const post of posts) {
      const caption = buildCaption(post);

      for (const platform of post.platforms) {
        const key = `day${post.day}_${platform}`;

        // Re-read status before each publish to prevent duplicate posts
        // from concurrent cron runs or overlapping manual "Post Now" actions
        const freshStatus = await getSchedulerStatus();
        if (freshStatus[key]?.posted) {
          skipped.push(`${key} \u2192 already posted`);
          continue;
        }

        const result = await publishPost(post, platform, caption);
        results.push(result);

        if (result.success) {
          await markAsPosted(post.day, platform, { autoPosted: true, postId: result.postId });
        }
      }
    }
  }

  return { day: today, results, skipped };
}
