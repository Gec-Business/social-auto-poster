'use client';

import { ReactNode } from 'react';
import Sidebar from '@/components/dashboard/Sidebar';
import CampaignStatusBar from '@/components/dashboard/CampaignStatusBar';
import './dashboard.css';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mcc-layout">
      <Sidebar />
      <main className="mcc-main">
        <CampaignStatusBar />
        <div className="mcc-content">
          {children}
        </div>
      </main>
    </div>
  );
}
