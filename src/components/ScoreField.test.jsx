import React from 'react';
import { render } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import ScoreField, { getFieldPlayers, getInitials } from './ScoreField';

describe('getInitials', () => {
  test('uses one letter for each available name part', () => {
    expect(getInitials('Ada Lovelace')).toBe('AL');
    expect(getInitials('Madonna')).toBe('M');
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

  test('arranges leaders outward from the middle in a V', () => {
    const players = getFieldPlayers([
      { id: 'a', name: 'A', score: 9 },
      { id: 'b', name: 'B', score: 8 },
      { id: 'c', name: 'C', score: 7 },
      { id: 'd', name: 'D', score: 6 },
      { id: 'e', name: 'E', score: 5 },
    ], 9);

    expect(players.map(({ y }) => y)).toEqual([50, 40, 60, 30, 70]);
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
