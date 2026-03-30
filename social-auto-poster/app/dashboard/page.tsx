'use client';

import { useCallback, useEffect, useState } from 'react';
import { SchedulerStatusMap, PostStatus, Platform } from '@/lib/scheduler-types';
import {
  CAMPAIGN_POSTS,
  PHASES,
  getTodaysDayNumber,
  getPostsForDay,
  getPostsByPhase,
  getCampaignLength,
} from '@/lib/scheduler-data';
import { CampaignPhase } from '@/lib/scheduler-types';
import PostCard from '@/components/dashboard/PostCard';
import MetricCard from '@/components/dashboard/MetricCard';

export default function DashboardPage() {
  const [statusMap, setStatusMap] = useState<SchedulerStatusMap>({});
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const todayDay = getTodaysDayNumber();
  const maxDay = getCampaignLength();

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/scheduler');
      if (res.ok) {
        const data = await res.json();
        setStatusMap(data.status || {});
        setIsLoggedIn(true);
      } else if (res.status === 401) {
        setIsLoggedIn(false);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        setIsLoggedIn(true);
        fetchStatus();
      } else {
        setLoginError('Invalid password');
      }
    } catch {
      setLoginError('Network error');
    }
  };

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

  // Login screen
  if (!isLoggedIn) {
    return (
      <div className="mcc-login">
        <div className="mcc-login-card">
          <h1>Dashboard Login</h1>
          <p>Enter your admin password to continue.</p>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Password"
              style={{
                width: '100%', padding: '12px 16px', marginBottom: 12,
                border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14,
              }}
            />
            {loginError && <p style={{ color: '#ef4444', fontSize: 13, margin: '0 0 12px' }}>{loginError}</p>}
            <button type="submit" style={{
              width: '100%', padding: '12px', background: '#0284c7', color: '#fff',
              border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}>
              Log In
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Stats
  const totalPlatformPosts = CAMPAIGN_POSTS.reduce((sum, p) => sum + p.platforms.length, 0);
  const totalPosted = CAMPAIGN_POSTS.reduce((sum, p) =>
    sum + p.platforms.filter(pl => isPosted(p.day, pl)).length, 0);
  const autoPostedCount = CAMPAIGN_POSTS.reduce((sum, p) =>
    sum + p.platforms.filter(pl => statusMap[`day${p.day}_${pl}`]?.autoPosted).length, 0);
  const manualPostedCount = totalPosted - autoPostedCount;
  const todayPosts = getPostsForDay(todayDay);
  const todayPlatformCount = todayPosts.reduce((s, p) => s + p.platforms.length, 0);
  const todayPostedCount = todayPosts.reduce((s, p) =>
    s + p.platforms.filter(pl => isPosted(p.day, pl)).length, 0);

  const currentPhase: CampaignPhase = (() => {
    for (const [key, phase] of Object.entries(PHASES)) {
      const [start, end] = phase.dayRange;
      if (todayDay >= start && todayDay <= end) return Number(key) as CampaignPhase;
    }
    return todayDay <= 0 ? 1 : 4;
  })();

  const overduePosts = CAMPAIGN_POSTS.filter(p =>
    p.day < todayDay && p.platforms.some(pl => !isPosted(p.day, pl)),
  );

  const comingUpPosts = CAMPAIGN_POSTS.filter(p =>
    p.day > todayDay && p.day <= todayDay + 3,
  );

  return (
    <>
      <h1 className="mcc-page-title">
        {todayDay >= 1 && todayDay <= maxDay ? `Day ${todayDay}: ${todayPosts[0]?.topic || 'Today'}` : 'Dashboard'}
      </h1>
      <p className="mcc-page-subtitle">
        {todayDay >= 1 && todayDay <= maxDay
          ? `Phase ${currentPhase}: ${PHASES[currentPhase].name}`
          : todayDay <= 0 ? 'Campaign hasn\u2019t started yet' : 'Campaign ended'}
      </p>

      {/* Quick Stats */}
      <div className="mcc-metrics">
        <MetricCard label="Today" value={`${todayPostedCount}/${todayPlatformCount}`} sub="posts done" color="accent" />
        <MetricCard
          label="Campaign"
          value={`${totalPosted}/${totalPlatformPosts}`}
          sub={totalPosted > 0 ? `${autoPostedCount} bot, ${manualPostedCount} manual` : 'total posted'}
          color="green"
        />
        <MetricCard
          label="Overdue"
          value={overduePosts.length}
          sub="need attention"
          color={overduePosts.length > 0 ? 'red' : 'green'}
        />
        <MetricCard label="Phase" value={`P${currentPhase}`} sub={PHASES[currentPhase].name} color="accent" />
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

      {/* Overdue Posts */}
      {overduePosts.length > 0 && (
        <div className="mcc-section">
          <h2 className="mcc-section-title" style={{ color: '#f87171' }}>
            Overdue ({overduePosts.length})
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {overduePosts.map(post => (
              <PostCard
                key={`${post.day}-${post.topic}`}
                post={post}
                isPosted={isPosted}
                getPostStatus={getPostStatus}
                onTogglePosted={togglePosted}
                onPostNow={handlePostNow}
                variant="overdue"
              />
            ))}
          </div>
        </div>
      )}

      {/* Today's Posts */}
      {todayPosts.length > 0 && (
        <div className="mcc-section">
          <h2 className="mcc-section-title">Today&apos;s Posts</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {todayPosts.map(post => (
              <PostCard
                key={`${post.day}-${post.topic}`}
                post={post}
                isPosted={isPosted}
                getPostStatus={getPostStatus}
                onTogglePosted={togglePosted}
                onPostNow={handlePostNow}
                variant="today"
              />
            ))}
          </div>
        </div>
      )}

      {/* Coming Up */}
      {comingUpPosts.length > 0 && (
        <div className="mcc-section">
          <h2 className="mcc-section-title" style={{ color: '#94a3b8' }}>Coming Up (Next 3 Days)</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {comingUpPosts.map(post => (
              <PostCard
                key={`${post.day}-${post.topic}`}
                post={post}
                isPosted={isPosted}
                getPostStatus={getPostStatus}
                onTogglePosted={togglePosted}
                onPostNow={handlePostNow}
                variant="default"
              />
            ))}
          </div>
        </div>
      )}

      {todayDay < 1 && (
        <div className="mcc-empty">Campaign hasn&apos;t started yet. Check the Schedule for the full calendar.</div>
      )}
      {todayDay > maxDay && todayPosts.length === 0 && (
        <div className="mcc-empty">Campaign has ended. Check the Schedule for a full recap.</div>
      )}
    </>
  );
}
