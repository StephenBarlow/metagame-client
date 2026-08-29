import React, { useMemo } from 'react';
import { Icon } from '@iconify/react';
import { Tooltip } from 'react-tooltip';

const EXCLUDED_ACHIEVEMENT_USER_ID = '1';

function LatestAchievementsTable({ league }) {
  const displayedWeek = league.revealedWeek;
  const awards = (league.achievementAwards || []).filter(
    (award) => String(award.user.id) !== EXCLUDED_ACHIEVEMENT_USER_ID
  );
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
      awards
    })).sort((first, second) =>
      first.awards.length - second.awards.length ||
      new Date(second.awards[0].awardedAt) - new Date(first.awards[0].awardedAt) ||
      first.achievement.name.localeCompare(second.achievement.name)
    );
  }, [awards, displayedWeek]);

  if (!rows.length) return null;

  return (
    <section className="latest-achievements">
      <Tooltip
        id="latest-achievement-tooltip"
        classNameArrow="hidden"
        style={{ backgroundColor: '#000000', zIndex: 10 }}
        render={({ activeAnchor }) => (
          <>
            <strong>{activeAnchor?.getAttribute('data-achievement-name')}</strong>
            <br />
            {activeAnchor?.getAttribute('data-achievement-description')}
          </>
        )}
      />
      <h3>WEEK {displayedWeek} BADGES</h3>
      <div className="latest-achievements-scroll">
        <table className="achievement-table latest-achievements-table">
          <thead>
            <tr>
              <th>Badge</th>
              <th>Earned by</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ achievement, awards }) => (
              <tr key={achievement.id}>
                <td className="latest-achievement-icon-cell">
                  <span
                    className={`achievement-icon${achievement.iconId ? '' : ' achievement-icon-missing'}`}
                    data-tooltip-id="latest-achievement-tooltip"
                    data-achievement-name={achievement.name}
                    data-achievement-description={achievement.description}
                    aria-label={`${achievement.name}: ${achievement.description}`}
                  >
                    {achievement.iconId ? <Icon icon={achievement.iconId} aria-hidden="true" /> : '?'}
                  </span>
                </td>
                <td className="latest-achievement-earners">
                  {awards.map((award) => award.user.displayName).join(', ')}
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
