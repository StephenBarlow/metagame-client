import React from 'react';
import { render } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import MessageSlotModal from './MessageSlotModal';

const sources = {
  catalogValues: [],
  adjectives: [{ id: '1', text: 'Great' }],
  users: [{ id: '2', displayName: 'Alex' }],
  teams: [{ id: '3', name: 'Buffalo Bills', shortName: 'BUF' }],
};

describe('MessageSlotModal', () => {
  test('shows type tabs only when the slot supports multiple types', () => {
    const { getAllByRole } = render(
      <MessageSlotModal
        slot={{ id: '1', prompt: 'Choose', valueTypes: ['TEAM', 'LEAGUE_MEMBER'] }}
        sources={sources}
        onSelect={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(getAllByRole('tab')).toHaveLength(2);
  });

  test('omits tabs for a single-type slot', () => {
    const { queryByRole } = render(
      <MessageSlotModal
        slot={{ id: '2', prompt: 'Choose', valueTypes: ['ADJECTIVE'] }}
        sources={sources}
        onSelect={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(queryByRole('tab')).not.toBeInTheDocument();
  });
});
