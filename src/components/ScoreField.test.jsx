import React from 'react';
import { render } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import ScoreField, { getFieldPlayers, getInitials, getQueuedPlayers } from './ScoreField';

describe('getInitials', () => {
  test('uses one letter for each available name part', () => {
    expect(getInitials('Ada Lovelace')).toBe('AL');
    expect(getInitials('Madonna')).toBe('Ma');
  });
});

describe('getFieldPlayers', () => {
  const scores = [
    { id: 'a', name: 'Alex Adams', score: 40 },
    { id: 'b', name: 'Blair Brown', score: 40 },
    { id: 'c', name: 'Casey Clark', score: 10 },
  ];

  test('keeps tied scores aligned and limits the field to nine leaders', () => {
    const players = getFieldPlayers(scores, 9);

    expect(players).toHaveLength(3);
    expect(players[0].x).toBe(players[1].x);
    expect(players[0].y).not.toBe(players[1].y);
  });

  test('uses a stable shuffled vertical order instead of score rank', () => {
    const playerScores = [
      { id: 'a', name: 'A', score: 9 },
      { id: 'b', name: 'B', score: 8 },
      { id: 'c', name: 'C', score: 7 },
      { id: 'd', name: 'D', score: 6 },
      { id: 'e', name: 'E', score: 5 },
    ];
    const players = getFieldPlayers(playerScores, 9);
    const repeatPlayers = getFieldPlayers(playerScores, 9);

    expect(players.map(({ y }) => y)).toEqual(repeatPlayers.map(({ y }) => y));
    expect(new Set(players.map(({ y }) => y))).toHaveLength(playerScores.length);
    expect(players.map(({ y }) => y)).not.toEqual([50, 40, 60, 30, 70]);
  });

  test('reshuffles vertical lanes when the displayed player batch changes', () => {
    const firstBatch = getFieldPlayers([
      { id: 'a', name: 'A', score: 9 },
      { id: 'b', name: 'B', score: 8 },
      { id: 'c', name: 'C', score: 7 },
      { id: 'd', name: 'D', score: 6 },
      { id: 'e', name: 'E', score: 5 },
      { id: 'f', name: 'F', score: 4 },
    ], 9);
    const secondBatch = getFieldPlayers([
      { id: 'a', name: 'A', score: 9 },
      { id: 'b', name: 'B', score: 8 },
      { id: 'c', name: 'C', score: 7 },
      { id: 'd', name: 'D', score: 6 },
      { id: 'e', name: 'E', score: 5 },
      { id: 'g', name: 'G', score: 4 },
    ], 9);

    const getSharedPlayerOrder = (players) => players
      .sort((firstPlayer, secondPlayer) => firstPlayer.y - secondPlayer.y)
      .map(({ id }) => id)
      .filter((id) => id !== 'f' && id !== 'g');

    expect(getSharedPlayerOrder(firstBatch)).not.toEqual(getSharedPlayerOrder(secondBatch));
  });

  test('only lets the leader travel as far as the current week permits', () => {
    const halfwayThroughSeason = getFieldPlayers(scores, 9).find(({ id }) => id === 'a');
    const finalWeek = getFieldPlayers(scores, 18).find(({ id }) => id === 'a');

    expect(halfwayThroughSeason.x).toBe(50);
    expect(finalWeek.x).toBe(88);
  });

  test('uses zero rather than tenth place as the left end of the score scale', () => {
    const trailingPlayer = getFieldPlayers(scores, 9).find(({ id }) => id === 'c');

    expect(trailingPlayer.x).toBe(21.5);
  });

  test('queues players outside the top nine in score order', () => {
    const players = Array.from({ length: 11 }, (_, index) => ({
      id: String(index + 1),
      name: `Player ${index + 1}`,
      score: 11 - index,
    }));

    expect(getQueuedPlayers(players).map(({ id }) => id)).toEqual(['10', '11']);
  });
});

test('provides initials and a tooltip with the full name', () => {
  const { getByLabelText, getByText } = render(
    <ScoreField currentWeek={9} playerScores={[{ id: 'a', name: 'Ada Lovelace', score: 20 }]} />
  );

  expect(getByText('AL')).toBeTruthy();
  expect(getByLabelText('Ada Lovelace: 20 points')).toHaveAttribute('data-tooltip-content', 'Ada Lovelace');
});

test('styles every player tied for first as a leader', () => {
  const { getByLabelText } = render(
    <ScoreField currentWeek={9} playerScores={[
      { id: 'a', name: 'Ada Lovelace', score: 20 },
      { id: 'g', name: 'Grace Hopper', score: 20 },
      { id: 'm', name: 'Margaret Hamilton', score: 10 },
    ]} />
  );

  expect(getByLabelText('Ada Lovelace: 20 points')).toHaveClass('score-field-player-leader');
  expect(getByLabelText('Grace Hopper: 20 points')).toHaveClass('score-field-player-leader');
  expect(getByLabelText('Margaret Hamilton: 10 points')).not.toHaveClass('score-field-player-leader');
});

test('uses a player’s favorite-team colors when available', () => {
  const { getByLabelText } = render(
    <ScoreField currentWeek={9} playerScores={[
      { id: 'a', name: 'Ada Lovelace', score: 20, favoriteTeam: { shortName: 'BUF' } },
    ]} />
  );

  expect(getByLabelText('Ada Lovelace: 20 points')).toHaveClass('team-buf');
});
