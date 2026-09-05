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

  test('keeps tied scores aligned and limits the field to ten leaders', () => {
    const players = getFieldPlayers(scores, 9);

    expect(players).toHaveLength(3);
    expect(players[0].x).toBe(players[1].x);
    expect(players[0].y).not.toBe(players[1].y);
  });

  test('only lets the leader travel as far as the current week permits', () => {
    const halfwayThroughSeason = getFieldPlayers(scores, 9).find(({ id }) => id === 'a');
    const finalWeek = getFieldPlayers(scores, 18).find(({ id }) => id === 'a');

    expect(halfwayThroughSeason.x).toBe(52);
    expect(finalWeek.x).toBe(92);
  });
});

test('shows initials and the full name on hover', () => {
  const { getByTitle, getByText } = render(
    <ScoreField currentWeek={9} playerScores={[{ id: 'a', name: 'Ada Lovelace', score: 20 }]} />
  );

  expect(getByText('AL')).toBeTruthy();
  expect(getByTitle('Ada Lovelace')).toBeTruthy();
});
