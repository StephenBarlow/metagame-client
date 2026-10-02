import { expect, test } from 'vitest';
import { filterSoloSpecialUserAwards } from './achievementUtils';

const award = (id, userID, achievementID) => ({
  id,
  user: { id: userID },
  achievement: { id: achievementID },
});

test('removes only special-user awards that no other player has earned', () => {
  const awards = [
    award('1', '1', 'solo'),
    award('2', '1', 'shared'),
    award('3', '2', 'shared'),
    award('4', '2', 'other'),
  ];

  expect(filterSoloSpecialUserAwards(awards).map(({ id }) => id)).toEqual(['2', '3', '4']);
});
