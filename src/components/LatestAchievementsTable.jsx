import React, { useMemo } from 'react';
import { Icon } from '@iconify/react';
import { Tooltip } from 'react-tooltip';
import { filterSoloSpecialUserAwards } from './achievementUtils';

const RECENT_AWARD_WINDOW_MS = 3 * 60 * 60 * 1000;

const getAwardedTimestamp = (awardedAt) => {
  const timestamp = new Date(awardedAt).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

function LatestAchievementsTable({ league, expandToContent = false }) {
  const displayedWeek = league.revealedWeek;
  const awards = filterSoloSpecialUserAwards(league.achievementAwards);
  const rows = useMemo(() => {
    if (!displayedWeek) return [];
    const awardsByAchievement = new Map();
    for (const award of awards) {
      if (award.week !== displayedWeek) continue;
      const awards = awardsByAchievement.get(String(award.achievement.id)) || [];
      awards.push(award);
      awardsByAchievement.set(String(award.achievement.id), awards);
    }

    return [...awardsByAchievement.values()].map((awards) => ({
      achievement: awards[0].achievement,
      awards,
      awardedAt: Math.max(...awards.map(({ awardedAt }) => getAwardedTimestamp(awardedAt))),
    })).sort((first, second) =>
      second.awardedAt - first.awardedAt ||
      first.awards.length - second.awards.length ||
      first.achievement.name.localeCompare(second.achievement.name)
    );
  }, [awards, displayedWeek]);

  if (!rows.length) return null;
  const latestAwardedAt = rows[0].awardedAt;

  return (
    <section className={`latest-achievements${expandToContent ? ' latest-achievements-expanded' : ''}`}>
      <Tooltip
        id="latest-achievement-tooltip"
        classNameArrow="hidden"
        style={{ backgroundColor: '#000000', zIndex: 10, maxWidth: '300px' }}
        render={({ activeAnchor }) => (
          <>
            <strong>{activeAnchor?.getAttribute('data-achievement-name')}</strong>
            <br />
            {activeAnchor?.getAttribute('data-achievement-description')}
          </>
        )}
      />
      <h3>Week {displayedWeek} badges</h3>
      <p className="badge-board-legend"><span aria-hidden="true">✦</span>: Most recently earned</p>
      <div className="latest-achievements-scroll">
        <table className="achievement-table latest-achievements-table">
          <thead>
            <tr>
              <th className="latest-achievement-icon-cell">Badge</th>
              <th>Earned by</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ achievement, awards, awardedAt }) => (
              <tr key={achievement.id}>
                <td className="latest-achievement-icon-cell">
                  <span
                    className={`achievement-icon${achievement.iconId ? '' : ' achievement-icon-missing'}${latestAwardedAt - awardedAt <= RECENT_AWARD_WINDOW_MS ? ' achievement-icon-latest-day' : ''}`}
                    data-tooltip-id="latest-achievement-tooltip"
                    data-achievement-name={achievement.name}
                    data-achievement-description={achievement.description}
                    aria-label={`${achievement.name}: ${achievement.description}`}
                  >
                    {achievement.iconId ? <Icon icon={achievement.iconId} aria-hidden="true" /> : '?'}
                  </span>
                </td>
                <td className="latest-achievement-earners">
                  {awards.map((award, index) => (
                    <React.Fragment key={award.id}>
                      {index > 0 && ', '}
                      <span className="latest-achievement-earner">{award.user.displayName}</span>
                    </React.Fragment>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default LatestAchievementsTable;
