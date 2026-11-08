export const SPECIAL_ACHIEVEMENT_USER_ID = '1';

// Add icons here when their SVG artwork needs a display treatment beyond
// the default currentColor behavior.
export const ACHIEVEMENT_ICON_STYLE_CLASSES = {
  'noto:family-man-boy-boy': 'achievement-icon-noto-family',
};

export const getAchievementIconStyleClass = (iconId) =>
  ACHIEVEMENT_ICON_STYLE_CLASSES[iconId] ? ` ${ACHIEVEMENT_ICON_STYLE_CLASSES[iconId]}` : '';

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
