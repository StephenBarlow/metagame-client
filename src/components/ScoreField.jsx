import React from 'react';
import { Tooltip } from 'react-tooltip';

export const TOTAL_WEEKS = 18;
const MAX_FIELD_PLAYERS = 9;

const FIELD_LEFT_EDGE = 12;
const FIELD_RIGHT_EDGE = 88;

export const getInitials = (name) => name
  .trim()
  .split(/\s+/)
  .filter(Boolean)
  .map((part) => part[0])
  .join('')
  .toUpperCase();

export const getFieldPlayers = (playerScores, currentWeek, totalWeeks = TOTAL_WEEKS) => {
  const leaders = playerScores
    .slice()
    .sort((firstPlayer, secondPlayer) =>
      secondPlayer.score - firstPlayer.score || firstPlayer.name.localeCompare(secondPlayer.name)
    )
    .slice(0, MAX_FIELD_PLAYERS);

  if (!leaders.length) return [];

  const highestScore = Math.max(...leaders.map(({ score }) => score));
  const weekProgress = Math.min(Math.max(currentWeek / totalWeeks, 0), 1);
  const furthestPosition = FIELD_LEFT_EDGE + (FIELD_RIGHT_EDGE - FIELD_LEFT_EDGE) * weekProgress;

  return leaders.map((player, index) => {
    const scorePosition = highestScore === 0 ? 0 : player.score / highestScore;
    const distanceFromCenter = Math.ceil(index / 2) * 10;
    const y = index === 0
      ? 50
      : index % 2 === 1
        ? 50 - distanceFromCenter
        : 50 + distanceFromCenter;

    return {
      ...player,
      initials: getInitials(player.name),
      x: FIELD_LEFT_EDGE + (furthestPosition - FIELD_LEFT_EDGE) * scorePosition,
      y,
    };
  });
};

function ScoreField({ playerScores, currentWeek }) {
  const players = getFieldPlayers(playerScores, currentWeek);

  if (!players.length) return null;

  return (
    <div className="score-field" aria-label="Season score leaders on the field">
      {players.map((player) => (
        <span
          key={player.id}
          className={`score-field-player${player.score === players[0].score ? ' score-field-player-leader' : ''}`}
          style={{ left: `${player.x}%`, top: `${player.y}%` }}
          data-tooltip-id="score-field-tooltip"
          data-tooltip-content={player.name}
          aria-label={`${player.name}: ${player.score} points`}
          tabIndex="0"
        >
          <span className="score-field-player-initials">{player.initials}</span>
        </span>
      ))}
      <Tooltip
        id="score-field-tooltip"
        classNameArrow="hidden"
        style={{ backgroundColor: '#000000', zIndex: 10 }}
      />
    </div>
  );
}

export default ScoreField;
