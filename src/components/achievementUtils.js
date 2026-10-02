export const SPECIAL_ACHIEVEMENT_USER_ID = '1';

export const filterSoloSpecialUserAwards = (awards = []) => {
  const achievementIDsEarnedByOtherPlayers = new Set(
    awards
      .filter((award) => String(award.user.id) !== SPECIAL_ACHIEVEMENT_USER_ID)
      .map((award) => String(award.achievement.id))
  );

  return awards.filter((award) =>
    String(award.user.id) !== SPECIAL_ACHIEVEMENT_USER_ID ||
    achievementIDsEarnedByOtherPlayers.has(String(award.achievement.id))
  );
};
