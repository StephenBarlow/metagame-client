import React from 'react';

export const TOTAL_WEEKS = 18;

const FIELD_LEFT_EDGE = 12;
const FIELD_RIGHT_EDGE = 92;

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
    .slice(0, 10);

  if (!leaders.length) return [];

  const lowestScore = Math.min(...leaders.map(({ score }) => score));
  const highestScore = Math.max(...leaders.map(({ score }) => score));
  const weekProgress = Math.min(Math.max(currentWeek / totalWeeks, 0), 1);
  const furthestPosition = FIELD_LEFT_EDGE + (FIELD_RIGHT_EDGE - FIELD_LEFT_EDGE) * weekProgress;

  return leaders.map((player, index) => {
    const scorePosition = highestScore === lowestScore
      ? 1
      : (player.score - lowestScore) / (highestScore - lowestScore);

    return {
      ...player,
      initials: getInitials(player.name),
      x: FIELD_LEFT_EDGE + (furthestPosition - FIELD_LEFT_EDGE) * scorePosition,
      y: ((index + 1) / (leaders.length + 1)) * 100,
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
          className="score-field-player"
          style={{ left: `${player.x}%`, top: `${player.y}%` }}
          title={player.name}
          aria-label={`${player.name}: ${player.score} points`}
          tabIndex="0"
        >
          {player.initials}
        </span>
      ))}
    </div>
  );
}

export default ScoreField;
