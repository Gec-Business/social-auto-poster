'use client';

import { useState } from 'react';
import { SchedulerPost, PostStatus, Platform } from '@/lib/scheduler-types';
import { PLATFORM_INFO } from '@/lib/scheduler-data';
import { SITE_CONFIG } from '@/lib/config';
import PlatformBadge from './PlatformBadge';
import CopyButton from './CopyButton';

type Lang = 'primary' | 'secondary';

interface PostCardProps {
  post: SchedulerPost;
  isPosted: (day: number, platform: string) => boolean;
  getPostStatus?: (day: number, platform: string) => PostStatus | undefined;
  onTogglePosted: (day: number, platform: string, currentlyPosted: boolean) => void;
  onPostNow?: (day: number, platform: Platform) => Promise<void>;
  variant?: 'today' | 'overdue' | 'default';
}

export default function PostCard({ post, isPosted, getPostStatus, onTogglePosted, onPostNow, variant = 'default' }: PostCardProps) {
  const [postingPlatform, setPostingPlatform] = useState<string | null>(null);
  const [lang, setLang] = useState<Lang>('primary');
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const copyText = lang === 'primary' ? post.copyPrimary : post.copySecondary;

  return (
    <div className={`mcc-post ${variant}`}>
      {/* Header */}
      <div className="mcc-post-header">
        <div className="mcc-post-meta">
          <span className="mcc-post-day">Day {post.day}</span>
          {post.platforms.map(p => (
            <PlatformBadge key={p} platform={p} />
          ))}
          <span className="mcc-post-type">{post.contentType.replace('_', ' ')}</span>
          <span className="mcc-post-goal">{post.goal}</span>
        </div>
      </div>
      <h4 className="mcc-post-topic">{post.topic}</h4>

      {/* Copy area */}
      <div className="mcc-post-copy">
        <div className="mcc-lang-tabs">
          <button className={`mcc-lang-tab${lang === 'primary' ? ' active' : ''}`} onClick={() => setLang('primary')}>
            {SITE_CONFIG.primaryLanguageLabel}
          </button>
          <button className={`mcc-lang-tab${lang === 'secondary' ? ' active' : ''}`} onClick={() => setLang('secondary')}>
            {SITE_CONFIG.secondaryLanguageLabel}
          </button>
          <CopyButton text={isEditing ? editText : copyText} label="Copy Text" />
          <button
            className="mcc-edit-link"
            style={{ border: 'none', cursor: 'pointer', marginLeft: 4 }}
            onClick={() => {
              if (isEditing) {
                setIsEditing(false);
              } else {
                setEditText(copyText);
                setIsEditing(true);
              }
            }}
          >
            {isEditing ? 'Done' : 'Edit'}
          </button>
        </div>
        {isEditing ? (
          <textarea
            className="mcc-copy-text"
            style={{ width: '100%', minHeight: 120, resize: 'vertical', outline: 'none' }}
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
          />
        ) : (
          <pre className="mcc-copy-text">{copyText}{SITE_CONFIG.botAttributionLine}</pre>
        )}
      </div>

      {/* Extras */}
      <div className="mcc-post-extras">
        <div className="mcc-post-row">
          <span className="mcc-post-row-label">Hashtags</span>
          <span className="mcc-post-row-value hashtags">{post.hashtags.join(' ')}</span>
          <CopyButton text={post.hashtags.join(' ')} label="Copy" />
        </div>
        <div className="mcc-post-row">
          <span className="mcc-post-row-label">UTM</span>
          <span className="mcc-post-row-value">{post.utmLink}</span>
          <CopyButton text={post.utmLink} label="Copy" />
        </div>
        {post.visualDescription && (
          <div className="mcc-post-row">
            <span className="mcc-post-row-label">Visual</span>
            <span className="mcc-post-row-value" style={{ fontFamily: 'inherit', color: '#94a3b8' }}>{post.visualDescription}</span>
          </div>
        )}
        {post.notes && (
          <div className="mcc-post-row">
            <span className="mcc-post-row-label">Note</span>
            <span className="mcc-post-row-value" style={{ fontFamily: 'inherit', color: '#f97316' }}>{post.notes}</span>
          </div>
        )}
      </div>

      {/* Posted toggles */}
      <div className="mcc-post-actions">
        {post.platforms.map(p => {
          const posted = isPosted(post.day, p);
          const status = getPostStatus?.(post.day, p);
          const isAutoPosted = status?.autoPosted === true;
          const canPostNow = onPostNow && !posted;
          return (
            <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <button
                className={`mcc-posted-btn${posted ? ' posted' : ''}`}
                onClick={() => onTogglePosted(post.day, p, posted)}
              >
                {posted ? '\u2713' : '\u25CB'} {PLATFORM_INFO[p].name}
                {posted && isAutoPosted && (
                  <span style={{
                    marginLeft: 6, fontSize: '0.65rem', padding: '1px 5px',
                    borderRadius: 4, background: '#22c55e', color: '#fff',
                    fontWeight: 600, verticalAlign: 'middle',
                  }}>Bot</span>
                )}
              </button>
              {canPostNow && (
                <button
                  className="mcc-edit-link"
                  style={{
                    fontSize: '0.7rem', padding: '2px 8px',
                    border: '1px solid #3b82f6', borderRadius: 4,
                    cursor: 'pointer', opacity: postingPlatform === p ? 0.5 : 1,
                  }}
                  disabled={postingPlatform === p}
                  onClick={async () => {
                    setPostingPlatform(p);
                    try {
                      await onPostNow(post.day, p as Platform);
                    } finally {
                      setPostingPlatform(null);
                    }
                  }}
                >
                  {postingPlatform === p ? 'Posting...' : 'Post Now'}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
