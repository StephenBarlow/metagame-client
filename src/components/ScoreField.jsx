import React from 'react';
import { Tooltip } from 'react-tooltip';

export const TOTAL_WEEKS = 18;
const MAX_FIELD_PLAYERS = 9;

const FIELD_LEFT_EDGE = 15;
const FIELD_RIGHT_EDGE = 88;

const comparePlayersByScore = (firstPlayer, secondPlayer) =>
  secondPlayer.score - firstPlayer.score || firstPlayer.name.localeCompare(secondPlayer.name);

export const getInitials = (name) => {
  const nameParts = name.trim().split(/\s+/).filter(Boolean);
  const initials = nameParts.map((part) => part[0]).join('').toUpperCase();

  return initials.length === 1 && nameParts[0]?.length > 1
    ? `${initials}${nameParts[0][1].toLocaleLowerCase()}`
    : initials;
};

export const getQueuedPlayers = (playerScores) => playerScores
  .slice()
  .sort(comparePlayersByScore)
  .slice(MAX_FIELD_PLAYERS)
  .map((player) => ({ ...player, initials: getInitials(player.name) }));

const hashString = (value) => {
  let hash = 2166136261;

  for (const character of String(value)) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
};

const createSeededRandom = (initialSeed) => {
  let seed = initialSeed;

  return () => {
    seed = (seed + 0x6D2B79F5) | 0;
    let value = seed;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
};

const shuffleForBatch = (players) => {
  const batchSeed = hashString(players.map(({ id }) => String(id)).sort().join('|'));
  const random = createSeededRandom(batchSeed);
  const shuffledPlayers = [...players];

  for (let index = shuffledPlayers.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffledPlayers[index], shuffledPlayers[swapIndex]] = [shuffledPlayers[swapIndex], shuffledPlayers[index]];
  }

  return shuffledPlayers;
};

export const getFieldPlayers = (playerScores, currentWeek, totalWeeks = TOTAL_WEEKS) => {
  const leaders = playerScores
    .slice()
    .sort(comparePlayersByScore)
    .slice(0, MAX_FIELD_PLAYERS);

  if (!leaders.length) return [];

  const lowestScore = Math.min(...leaders.map(({ score }) => score));
  const highestScore = Math.max(...leaders.map(({ score }) => score));
  const weekProgress = Math.min(Math.max(currentWeek / totalWeeks, 0), 1);
  const furthestPosition = FIELD_LEFT_EDGE + (FIELD_RIGHT_EDGE - FIELD_LEFT_EDGE) * weekProgress;
  const shuffledLeaders = shuffleForBatch(leaders);
  const yPositionsByPlayerID = new Map(
    shuffledLeaders.map((player, index) => [
      String(player.id),
      ((index + 1) / (shuffledLeaders.length + 1)) * 100,
    ])
  );

  return leaders.map((player) => {
    const scorePosition = highestScore === lowestScore
      ? 0
      : (player.score - lowestScore) / (highestScore - lowestScore);

    return {
      ...player,
      initials: getInitials(player.name),
      x: FIELD_LEFT_EDGE + (furthestPosition - FIELD_LEFT_EDGE) * scorePosition,
      y: yPositionsByPlayerID.get(String(player.id)),
    };
  });
};

function ScoreField({ playerScores, currentWeek }) {
  const players = getFieldPlayers(playerScores, currentWeek);
  const queuedPlayers = getQueuedPlayers(playerScores);

  if (!players.length) return null;

  const getPlayerClassName = (player, isLeader = false) =>
    `score-field-player${player.favoriteTeam ? ` team-${player.favoriteTeam.shortName.toLowerCase()}` : ''}${isLeader ? ' score-field-player-leader' : ''}`;

  return (
    <>
      <div className={`score-field${queuedPlayers.length ? ' has-queue' : ''}`} aria-label="Season score leaders on the field">
        {players.map((player) => (
          <span
            key={player.id}
            className={getPlayerClassName(player, player.score === players[0].score)}
            style={{ left: `${player.x}%`, top: `${player.y}%` }}
            data-tooltip-id="score-field-tooltip"
            data-tooltip-content={player.name}
            aria-label={`${player.name}: ${player.score} points`}
            tabIndex="0"
          >
            <span className="score-field-player-initials">{player.initials}</span>
          </span>
        ))}
      </div>
      {queuedPlayers.length > 0 &&
        <div className="score-field-queue" aria-label="Players outside the top nine">
          {queuedPlayers.map((player) => (
            <span
              key={player.id}
              className={`${getPlayerClassName(player)} score-field-queued-player`}
              data-tooltip-id="score-field-tooltip"
              data-tooltip-content={player.name}
              aria-label={`${player.name}: ${player.score} points`}
              tabIndex="0"
            >
              <span className="score-field-player-initials">{player.initials}</span>
            </span>
          ))}
        </div>
      }
      <Tooltip
        id="score-field-tooltip"
        classNameArrow="hidden"
        style={{ backgroundColor: '#000000', zIndex: 10 }}
      />
    </>
  );
}

export default ScoreField;
