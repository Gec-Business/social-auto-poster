'use client';

import { getTodaysDayNumber, getCampaignLength, PHASES, CAMPAIGN_START } from '@/lib/scheduler-data';
import { CampaignPhase } from '@/lib/scheduler-types';

export default function CampaignStatusBar() {
  const todayDay = getTodaysDayNumber();
  const maxDay = getCampaignLength();

  const campaignStatus = todayDay <= 0
    ? 'upcoming'
    : todayDay > maxDay
      ? 'ended'
      : 'live';

  const currentPhase: CampaignPhase = todayDay <= 0 ? 1
    : todayDay > maxDay ? 4
    : todayDay <= 7 ? 1
    : todayDay <= 14 ? 2
    : todayDay <= 21 ? 3
    : 4;

  const daysLeft = campaignStatus === 'live' ? maxDay - todayDay : 0;
  const startDate = new Date(CAMPAIGN_START + 'T00:00:00');
  const now = new Date();
  const daysToStart = campaignStatus === 'upcoming'
    ? Math.ceil((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className="mcc-status-bar">
      <div className="mcc-status-item">
        <span className={`mcc-status-dot ${campaignStatus}`} />
        <span className="mcc-status-value">
          {campaignStatus === 'live' && `Day ${todayDay} of ${maxDay}`}
          {campaignStatus === 'upcoming' && `Starts in ${daysToStart}d`}
          {campaignStatus === 'ended' && 'Campaign Ended'}
        </span>
      </div>

      <span className="mcc-status-sep" />

      <div className="mcc-status-item">
        Phase <span className="mcc-status-accent">{currentPhase}</span>:
        <span className="mcc-status-value">{PHASES[currentPhase].name.split('&')[0].trim()}</span>
      </div>

      <span className="mcc-status-sep" />

      <div className="mcc-status-item">
        {campaignStatus === 'live' && (
          <>
            <span className="mcc-status-value">{daysLeft}</span> days left
          </>
        )}
        {campaignStatus === 'upcoming' && PHASES[1].dateRange}
        {campaignStatus === 'ended' && 'Completed'}
      </div>

      <span className="mcc-status-sep" />

      <div className="mcc-status-item">
        <span className="mcc-status-value">{PHASES[currentPhase].dateRange}</span>
      </div>
    </div>
  );
}
