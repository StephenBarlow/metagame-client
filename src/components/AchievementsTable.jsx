import React, { useContext, useMemo } from 'react';
import { Icon } from '@iconify/react';
import { Tooltip } from 'react-tooltip';
import UserContext from './ActiveUserContext';

const EXCLUDED_ACHIEVEMENT_USER_ID = '1';

export function AchievementIcon({ award, isCurrent = false, tooltipId = 'achievement-tooltip' }) {
  const { achievement } = award;
  return (
    <span
      className={`achievement-icon${achievement.iconId ? '' : ' achievement-icon-missing'}${isCurrent && achievement.iconId ? ' achievement-icon-current' : ''}`}
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
  const activeUser = useContext(UserContext);
  const players = useMemo(() => {
    const awardsByUser = new Map(league.users.map((user) => [String(user.id), []]));
    for (const award of league.achievementAwards || []) {
      if (String(award.user.id) === EXCLUDED_ACHIEVEMENT_USER_ID) continue;
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

  if (!players.some(({ awards }) => awards.length)) return null;

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
      <h3>THE BADGERBOARD</h3>
      <p className="badge-board-legend"><span aria-hidden="true">✦</span>: New this week</p>
      <div className="badge-board-scroll">
        <table className="achievement-table badge-board">
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
                <td className={`achievement-player-name${String(user.id) === String(activeUser()?.id) ? ' is-active-user' : ''}`}>{user.displayName}</td>
              <td className="achievement-total">{awards.length}</td>
              <td className="achievement-icons">
                  {awards.map((award) => (
                    <AchievementIcon
                      award={award}
                      isCurrent={award.week === league.revealedWeek}
                      key={award.id}
                    />
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default AchievementsTable;
