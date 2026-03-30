'use client';

import { useCallback, useEffect, useState } from 'react';
import { SchedulerStatusMap, PostStatus, CampaignPhase, Platform } from '@/lib/scheduler-types';
import {
  CAMPAIGN_POSTS,
  PHASES,
  PLATFORM_INFO,
  getTodaysDayNumber,
  getPostsByPhase,
} from '@/lib/scheduler-data';
import PostCard from '@/components/dashboard/PostCard';
import MetricCard from '@/components/dashboard/MetricCard';

export default function SchedulePage() {
  const [statusMap, setStatusMap] = useState<SchedulerStatusMap>({});
  const [expandedDay, setExpandedDay] = useState<number | null>(null);
  const [platformFilter, setPlatformFilter] = useState<'all' | Platform | 'reel' | 'story'>('all');

  const todayDay = getTodaysDayNumber();

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/scheduler');
      if (res.ok) {
        const data = await res.json();
        setStatusMap(data.status || {});
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  const isPosted = (day: number, platform: string) => !!statusMap[`day${day}_${platform}`];
  const getPostStatus = (day: number, platform: string): PostStatus | undefined => statusMap[`day${day}_${platform}`];

  const handlePostNow = useCallback(async (day: number, platform: Platform) => {
    try {
      const res = await fetch('/api/marketing/post-now', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ day, platform }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(`Post failed: ${data.error || 'Unknown error'}`);
        return;
      }
      await fetchStatus();
    } catch {
      alert('Network error \u2013 could not post');
    }
  }, [fetchStatus]);

  const togglePosted = useCallback(async (day: number, platform: string, currentlyPosted: boolean) => {
    const key = `day${day}_${platform}`;
    setStatusMap(prev => {
      if (currentlyPosted) {
        const { [key]: _, ...rest } = prev;
        void _;
        return rest;
      }
      return { ...prev, [key]: { posted: true, postedAt: new Date().toISOString() } };
    });
    try {
      const res = await fetch('/api/scheduler', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ day, platform, posted: !currentlyPosted }),
      });
      if (res.ok) {
        const data = await res.json();
        setStatusMap(data.status || {});
      }
    } catch { fetchStatus(); }
  }, [fetchStatus]);

  const totalPlatformPosts = CAMPAIGN_POSTS.reduce((sum, p) => sum + p.platforms.length, 0);
  const totalPosted = CAMPAIGN_POSTS.reduce((sum, p) =>
    sum + p.platforms.filter(pl => isPosted(p.day, pl)).length, 0);

  const filterPosts = (posts: typeof CAMPAIGN_POSTS) => {
    if (platformFilter === 'all') return posts;
    if (platformFilter === 'reel') return posts.filter(p => p.contentType === 'reel');
    if (platformFilter === 'story') return posts.filter(p => p.contentType === 'story');
    return posts.filter(p => p.platforms.includes(platformFilter as Platform));
  };

  return (
    <>
      <h1 className="mcc-page-title">Schedule</h1>
      <p className="mcc-page-subtitle">Full campaign calendar with post status tracking</p>

      <div className="mcc-metrics" style={{ marginBottom: 16 }}>
        <MetricCard label="Total Posts" value={totalPlatformPosts} sub="across all platforms" />
        <MetricCard label="Posted" value={totalPosted} sub="completed" color="green" />
        <MetricCard label="Remaining" value={totalPlatformPosts - totalPosted} sub="to go" color="orange" />
      </div>

      {/* Platform Filter */}
      <div className="mcc-gallery-tabs" style={{ marginBottom: 16 }}>
        {[
          { key: 'all', label: 'All' },
          { key: 'facebook', label: 'Facebook' },
          { key: 'instagram', label: 'Instagram' },
          { key: 'linkedin', label: 'LinkedIn' },
          { key: 'reel', label: 'Reels' },
          { key: 'story', label: 'Stories' },
        ].map(f => (
          <button
            key={f.key}
            className={`mcc-gallery-tab${platformFilter === f.key ? ' active' : ''}`}
            onClick={() => setPlatformFilter(f.key as typeof platformFilter)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Campaign Progress */}
      <div className="mcc-progress">
        {([1, 2, 3, 4] as CampaignPhase[]).map(phase => {
          const phasePosts = getPostsByPhase(phase);
          const phaseTotal = phasePosts.reduce((s, p) => s + p.platforms.length, 0);
          const phasePosted = phasePosts.reduce((s, p) =>
            s + p.platforms.filter((pl: Platform) => isPosted(p.day, pl)).length, 0);
          const pct = phaseTotal > 0 ? Math.round((phasePosted / phaseTotal) * 100) : 0;
          return (
            <div key={phase} className={`mcc-progress-seg p${phase}`}>
              <div className="mcc-progress-bar">
                <div className="mcc-progress-fill" style={{ width: `${pct}%` }} />
              </div>
              <span className="mcc-progress-label">P{phase}: {pct}%</span>
            </div>
          );
        })}
      </div>

      {/* Full Calendar by Phase */}
      {([1, 2, 3, 4] as CampaignPhase[]).map(phase => {
        const phasePosts = filterPosts(getPostsByPhase(phase));
        if (phasePosts.length === 0) return null;
        return (
          <div key={phase} className="mcc-phase-group">
            <div className={`mcc-phase-header p${phase}`}>
              <span>Phase {phase}: {PHASES[phase].name}</span>
              <span className="mcc-phase-dates">{PHASES[phase].dateRange}</span>
            </div>

            {phasePosts.map(post => {
              const isToday = post.day === todayDay;
              const isPast = post.day < todayDay;
              const allDone = post.platforms.every(p => isPosted(post.day, p));
              const isExpanded = expandedDay === post.day;

              const rowClass = isToday ? 'today' : (isPast && !allDone) ? 'overdue' : '';

              return (
                <div key={`${post.day}-${post.topic}`}>
                  <div
                    className={`mcc-day-row ${rowClass}`}
                    onClick={() => setExpandedDay(isExpanded ? null : post.day)}
                  >
                    <span className="mcc-day-num">Day {post.day}</span>
                    <span className="mcc-day-date">
                      {new Date(post.date + 'T12:00:00').toLocaleDateString('en-US', {
                        weekday: 'short', month: 'short', day: 'numeric',
                      })}
                    </span>
                    <span className="mcc-day-topic">{post.topic}</span>

                    <div className="mcc-day-badges">
                      {post.platforms.map(p => (
                        <span
                          key={p}
                          className={`mcc-day-dot ${p}${isPosted(post.day, p) ? ' done' : ''}`}
                          title={`${PLATFORM_INFO[p].name}${isPosted(post.day, p) ? ' (posted)' : ''}`}
                        >
                          {PLATFORM_INFO[p].iconLabel}
                        </span>
                      ))}
                    </div>
                    <span className="mcc-day-status">
                      {allDone ? '\u2713' : isPast && !allDone ? '!' : ''}
                    </span>
                    <span className="mcc-day-expand">{isExpanded ? '\u25B2' : '\u25BC'}</span>
                  </div>

                  {isExpanded && (
                    <div className="mcc-day-expanded">
                      <PostCard
                        post={post}
                        isPosted={isPosted}
                        getPostStatus={getPostStatus}
                        onTogglePosted={togglePosted}
                        onPostNow={handlePostNow}
                        variant={isToday ? 'today' : (isPast && !allDone) ? 'overdue' : 'default'}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </>
  );
}
