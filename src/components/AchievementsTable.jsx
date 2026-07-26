import React, { useMemo } from 'react';
import { Icon } from '@iconify/react';
import { Tooltip } from 'react-tooltip';

export function AchievementIcon({ award, tooltipId = 'achievement-tooltip' }) {
  const { achievement } = award;
  return (
    <span
      className={`achievement-icon${achievement.iconId ? '' : ' achievement-icon-missing'}`}
      data-tooltip-id={tooltipId}
      data-achievement-name={achievement.name}
      data-achievement-description={achievement.description}
      data-award-week={award.week}
      aria-label={`${achievement.name}, Week ${award.week}`}
    >
      {achievement.iconId
        ? <Icon icon={achievement.iconId} aria-hidden="true" />
        : '?'
      }
    </span>
  );
}

function AchievementsTable({ league }) {
  const players = useMemo(() => {
    const awardsByUser = new Map(league.users.map((user) => [String(user.id), []]));
    for (const award of league.achievementAwards || []) {
      awardsByUser.get(String(award.user.id))?.push(award);
    }

    return league.users.map((user, index) => ({
      user,
      index,
      awards: (awardsByUser.get(String(user.id)) || []).sort((first, second) =>
        second.week - first.week ||
        new Date(second.awardedAt) - new Date(first.awardedAt) ||
        Number(second.id) - Number(first.id)
      )
    })).sort((first, second) =>
      second.awards.length - first.awards.length || first.index - second.index
    );
  }, [league.users, league.achievementAwards]);

  if (!league.achievementAwards?.length) return null;

  return (
    <>
      <Tooltip
        id="achievement-tooltip"
        classNameArrow="hidden"
        style={{ backgroundColor: '#000000', zIndex: 10 }}
        render={({ activeAnchor }) => (
          <>
            <strong>{activeAnchor?.getAttribute('data-achievement-name')}</strong>
            <br />
            {activeAnchor?.getAttribute('data-achievement-description')}
            <br />
            Earned Week {activeAnchor?.getAttribute('data-award-week')}
          </>
        )}
      />
      <h3>BADGES</h3>
      <table className="achievement-table">
        <thead>
          <tr>
            <th>Competitor</th>
            <th className="achievement-total">Total</th>
            <th>Badges</th>
          </tr>
        </thead>
        <tbody>
          {players.map(({ user, awards }) => (
            <tr key={user.id}>
              <td className="achievement-player-name">{user.displayName}</td>
              <td className="achievement-total">{awards.length}</td>
              <td className="achievement-icons">
                {awards.map((award) => <AchievementIcon award={award} key={award.id} />)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

export default AchievementsTable;
