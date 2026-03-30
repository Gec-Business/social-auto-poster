'use client';

import { useCallback, useEffect } from 'react';
import { Asset } from '@/lib/asset-manifest';

interface AssetLightboxProps {
  asset: Asset;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
}

export default function AssetLightbox({ asset, onClose, onPrev, onNext }: AssetLightboxProps) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowLeft' && onPrev) onPrev();
    if (e.key === 'ArrowRight' && onNext) onNext();
  }, [onClose, onPrev, onNext]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [handleKeyDown]);

  return (
    <div className="mcc-lightbox" onClick={onClose}>
      <button className="mcc-lightbox-close" onClick={onClose}>&times;</button>

      {onPrev && (
        <button className="mcc-lightbox-nav prev" onClick={(e) => { e.stopPropagation(); onPrev(); }}>
          &#8249;
        </button>
      )}

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="mcc-lightbox-img"
        src={asset.url}
        alt={asset.label}
        onClick={(e) => e.stopPropagation()}
      />

      {onNext && (
        <button className="mcc-lightbox-nav next" onClick={(e) => { e.stopPropagation(); onNext(); }}>
          &#8250;
        </button>
      )}

      <div className="mcc-lightbox-info" onClick={(e) => e.stopPropagation()}>
        <div>{asset.label}</div>
        <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'center' }}>
          <button
            className="mcc-edit-link-lg"
            style={{ border: 'none', cursor: 'pointer', background: '#1e293b', color: '#e2e8f0' }}
            onClick={() => navigator.clipboard.writeText(asset.url)}
          >
            Copy URL
          </button>
          <a
            href={asset.url}
            download
            className="mcc-edit-link-lg"
            style={{ background: '#1e293b', color: '#e2e8f0' }}
          >
            Download
          </a>
        </div>
      </div>
    </div>
  );
}
