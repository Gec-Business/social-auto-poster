'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SITE_CONFIG } from '@/lib/config';

const NAV_ITEMS = [
  { href: '/dashboard', icon: '\u2302', label: 'Today' },
  { href: '/dashboard/schedule', icon: '\uD83D\uDCC5', label: 'Schedule' },
];

export default function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  return (
    <aside className="mcc-sidebar">
      <div className="mcc-sidebar-brand">
        <h1>Command Center</h1>
        <p>{SITE_CONFIG.name}</p>
      </div>

      <nav className="mcc-sidebar-nav">
        {NAV_ITEMS.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`mcc-sidebar-link${isActive(item.href) ? ' active' : ''}`}
          >
            <span className="mcc-nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="mcc-sidebar-footer">
        <a href={SITE_CONFIG.campaignLink} target="_blank" rel="noopener noreferrer">
          Campaign Site
        </a>
      </div>
    </aside>
  );
}
