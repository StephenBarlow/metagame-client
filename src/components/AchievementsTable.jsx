import React, { useContext, useMemo } from 'react';
import { Icon } from '@iconify/react';
import { Tooltip } from 'react-tooltip';
import UserContext from './ActiveUserContext';

const EXCLUDED_ACHIEVEMENT_USER_ID = '1';

const getBadgeIDs = (player) => new Set(player.awards.map((award) => String(award.achievement.id)));

const sharedBadgeCount = (firstPlayer, secondPlayer) => {
  const firstPlayerBadgeIDs = getBadgeIDs(firstPlayer);
  return [...getBadgeIDs(secondPlayer)].filter((badgeID) => firstPlayerBadgeIDs.has(badgeID)).length;
};

const getNewBadgePriority = (player, newBadgeRarities, revealedWeek) => {
  const rarities = player.awards
    .filter((award) => award.week === revealedWeek)
    .map((award) => newBadgeRarities.get(String(award.achievement.id)));

  if (!rarities.length) return { uniqueCount: 0, rarestBadge: Infinity };

  return {
    uniqueCount: rarities.filter((rarity) => rarity === 1).length,
    rarestBadge: Math.min(...rarities),
  };
};

const compareNewBadgePriority = (firstPlayer, secondPlayer, newBadgeRarities, revealedWeek) => {
  const firstPriority = getNewBadgePriority(firstPlayer, newBadgeRarities, revealedWeek);
  const secondPriority = getNewBadgePriority(secondPlayer, newBadgeRarities, revealedWeek);

  return secondPriority.uniqueCount - firstPriority.uniqueCount ||
    firstPriority.rarestBadge - secondPriority.rarestBadge ||
    firstPlayer.index - secondPlayer.index;
};

const orderEqualTotalPlayers = (players, newBadgeRarities, revealedWeek) => {
  const remainingPlayers = [...players];
  const orderedPlayers = [];

  while (remainingPlayers.length) {
    const previousPlayer = orderedPlayers.at(-1);
    const neighboringPlayers = previousPlayer
      ? remainingPlayers.filter((player) => sharedBadgeCount(previousPlayer, player))
      : [];
    const candidates = neighboringPlayers.length ? neighboringPlayers : remainingPlayers;

    candidates.sort((firstPlayer, secondPlayer) =>
      previousPlayer && sharedBadgeCount(previousPlayer, secondPlayer) - sharedBadgeCount(previousPlayer, firstPlayer) ||
      compareNewBadgePriority(firstPlayer, secondPlayer, newBadgeRarities, revealedWeek)
    );

    const nextPlayer = candidates[0];
    orderedPlayers.push(nextPlayer);
    remainingPlayers.splice(remainingPlayers.indexOf(nextPlayer), 1);
  }

  return orderedPlayers;
};

const orderPlayers = (players, revealedWeek) => {
  const newBadgeRarities = new Map();
  for (const player of players) {
    for (const award of player.awards) {
      if (award.week !== revealedWeek) continue;
      const badgeID = String(award.achievement.id);
      newBadgeRarities.set(badgeID, (newBadgeRarities.get(badgeID) || 0) + 1);
    }
  }

  const playersByTotal = new Map();
  for (const player of players) {
    const group = playersByTotal.get(player.awards.length) || [];
    group.push(player);
    playersByTotal.set(player.awards.length, group);
  }

  return [...playersByTotal.entries()]
    .sort(([firstTotal], [secondTotal]) => secondTotal - firstTotal)
    .flatMap(([, sameTotalPlayers]) =>
      orderEqualTotalPlayers(sameTotalPlayers, newBadgeRarities, revealedWeek)
    );
};

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

    const players = league.users
      .filter((user) => String(user.id) !== EXCLUDED_ACHIEVEMENT_USER_ID)
      .map((user, index) => ({
        user,
        index,
        awards: (awardsByUser.get(String(user.id)) || []).sort((first, second) =>
          second.week - first.week ||
          new Date(second.awardedAt) - new Date(first.awardedAt) ||
          Number(second.id) - Number(first.id)
        )
      }));

    return orderPlayers(players, league.revealedWeek);
  }, [league.users, league.achievementAwards, league.revealedWeek]);

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
