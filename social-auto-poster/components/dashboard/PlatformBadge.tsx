import { Platform } from '@/lib/scheduler-types';
import { PLATFORM_INFO } from '@/lib/scheduler-data';

interface PlatformBadgeProps {
  platform: Platform;
}

export default function PlatformBadge({ platform }: PlatformBadgeProps) {
  return (
    <span className={`mcc-badge ${platform}`}>
      {PLATFORM_INFO[platform].iconLabel}
    </span>
  );
}
