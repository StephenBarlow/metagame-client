import React from 'react';
import { render } from '@testing-library/react';
import { expect, test } from 'vitest';
import MessageFeed from './MessageFeed';

test('renders selected message values as highlighted sentence fragments', () => {
  const { container, getByText } = render(<MessageFeed league={{ revealedWeek: 4, picks: [
    { week: 4, user: { id: '1' }, team: { shortName: 'BUF' } },
    { week: 4, user: { id: '1' }, team: { shortName: 'KC' } },
  ] }} messages={[{
    id: '1',
    week: 4,
    createdAt: '2026-08-29T12:00:00Z',
    author: { id: '1', displayName: 'Alex' },
    template: { format: '{adjective} pick, {player}!' },
    selections: [
      { slot: { key: 'adjective' }, value: { __typename: 'MessageValue', text: 'Great' } },
      { slot: { key: 'player' }, value: { __typename: 'User', displayName: 'Sam' } },
    ],
  }]} />);

  expect(getByText('Alex')).toBeInTheDocument();
  expect(getByText('BUF')).toBeInTheDocument();
  expect(getByText('KC')).toBeInTheDocument();
  expect(container.querySelectorAll('.message-selection')).toHaveLength(2);
});

test('keeps future-week picks hidden behind question-mark chips', () => {
  const { getAllByText } = render(<MessageFeed league={{ revealedWeek: 4, picks: [
    { week: 5, user: { id: '1' }, team: { shortName: 'BUF' } },
    { week: 5, user: { id: '1' }, team: { shortName: 'KC' } },
  ] }} messages={[{
    id: '1',
    week: 5,
    createdAt: '2026-08-29T12:00:00Z',
    author: { id: '1', displayName: 'Alex' },
    template: { format: 'Hello!' },
    selections: [],
  }]} />);

  expect(getAllByText('?')).toHaveLength(2);
});
