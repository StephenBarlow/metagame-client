import { describe, expect, test } from 'vitest';
import {
  getMessageFragments,
  getSlotOptionGroups,
  parseMessageFormat,
} from './messageUtils';

describe('parseMessageFormat', () => {
  test('retains literals and identifies selected placeholders', () => {
    expect(parseMessageFormat('Behold, {subject}!', (key) => key === 'subject' ? 'chaos' : '')).toEqual([
      { type: 'literal', text: 'Behold, ' },
      { type: 'selection', key: 'subject', text: 'chaos' },
      { type: 'literal', text: '!' },
    ]);
  });

  test('keeps an unresolved placeholder visible', () => {
    expect(parseMessageFormat('{adjective} pick', () => '')[0]).toEqual({
      type: 'placeholder',
      key: 'adjective',
      text: '{adjective}',
    });
  });

  test('capitalizes a selected phrase when its slot begins a sentence', () => {
    const fragments = parseMessageFormat(
      '{opening} arrived. {next}',
      (key) => key === 'opening' ? 'the first phrase' : 'another phrase'
    );

    expect(fragments.map(({ text }) => text).join('')).toBe('The first phrase arrived. Another phrase');
  });
});

test('renders union selection values using their display fields', () => {
  const fragments = getMessageFragments({
    template: { format: '{adjective} pick, {player}!' },
    selections: [
      { slot: { key: 'adjective' }, value: { __typename: 'MessageValue', text: 'Great' } },
      { slot: { key: 'player' }, value: { __typename: 'User', displayName: 'Sam' } },
    ],
  });

  expect(fragments.map(({ text }) => text).join('')).toBe('Great pick, Sam!');
});

test('assembles option groups in the slot type order', () => {
  const groups = getSlotOptionGroups(
    { valueTypes: ['TEAM', 'LEAGUE_MEMBER'] },
    {
      teams: [{ id: '2', name: 'Buffalo Bills' }],
      users: [{ id: '7', displayName: 'Zoe' }, { id: '8', displayName: 'Alex' }],
      catalogValues: [],
      adjectives: [],
    }
  );

  expect(groups.map(({ label }) => label)).toEqual(['Teams', 'People']);
  expect(groups[0].options[0]).toMatchObject({ valueType: 'TEAM', valueID: '2' });
  expect(groups[1].options.map(({ label }) => label)).toEqual(['Alex', 'Zoe']);
});
