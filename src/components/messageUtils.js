export const MESSAGE_TYPE_LABELS = {
  CATALOG_VALUE: 'Phrases',
  ADJECTIVE: 'Adjectives',
  LEAGUE_MEMBER: 'People',
  TEAM: 'Teams',
};

export const getMessageValueText = (value) => {
  if (!value) return '';
  if (value.__typename === 'MessageValue' || value.text) return value.text;
  if (value.__typename === 'SportsTeam' || value.name) return value.name;
  if (value.__typename === 'User' || value.displayName) return value.displayName;
  return '';
};

const capitalizeSentenceStart = (text) => text.replace(/^(\s*)(\p{L})/u, (match, whitespace, letter) =>
  `${whitespace}${letter.toLocaleUpperCase()}`
);

const slotStartsSentence = (format, slotIndex) => {
  const precedingText = format.slice(0, slotIndex);
  return !precedingText.trim() || /[.!?]["')\]]*\s*$/.test(precedingText);
};

export const parseMessageFormat = (format, getSelectionText) => {
  const fragments = [];
  const placeholderPattern = /\{([^{}]+)\}/g;
  let cursor = 0;

  for (const match of format.matchAll(placeholderPattern)) {
    if (match.index > cursor) {
      fragments.push({ type: 'literal', text: format.slice(cursor, match.index) });
    }

    const key = match[1];
    const selectionText = getSelectionText(key);
    const text = selectionText && slotStartsSentence(format, match.index)
      ? capitalizeSentenceStart(selectionText)
      : selectionText || match[0];
    fragments.push({
      type: selectionText ? 'selection' : 'placeholder',
      key,
      text,
    });
    cursor = match.index + match[0].length;
  }

  if (cursor < format.length) {
    fragments.push({ type: 'literal', text: format.slice(cursor) });
  }

  return fragments;
};

export const getMessageFragments = (message) => {
  const selectionsByKey = new Map(
    (message.selections || []).map((selection) => [selection.slot.key, selection.value])
  );

  return parseMessageFormat(
    message.template.format,
    (key) => {
      const value = selectionsByKey.get(key);
      const isAuthorSelfReference = value?.id != null && message.author?.id != null &&
        (value.__typename === 'User' || value.displayName) &&
        String(value?.id) === String(message.author?.id);

      return isAuthorSelfReference ? 'me' : getMessageValueText(value);
    }
  );
};

const mapOptions = (items, valueType, getLabel) => (items || []).map((item) => ({
  id: String(item.id),
  label: getLabel(item),
  valueID: String(item.id),
  valueType,
  source: item,
}));

export const getSlotOptionGroups = (slot, { catalogValues, adjectives, users, activeUserID, teams }) => {
  const optionsByType = {
    CATALOG_VALUE: mapOptions(catalogValues, 'CATALOG_VALUE', (value) => value.text),
    ADJECTIVE: mapOptions(adjectives, 'ADJECTIVE', (value) => value.text),
    LEAGUE_MEMBER: mapOptions(
      [...(users || [])].sort((firstUser, secondUser) => {
        const firstIsActiveUser = String(firstUser.id) === String(activeUserID);
        const secondIsActiveUser = String(secondUser.id) === String(activeUserID);

        if (firstIsActiveUser !== secondIsActiveUser) return firstIsActiveUser ? -1 : 1;
        return firstUser.displayName.localeCompare(secondUser.displayName);
      }),
      'LEAGUE_MEMBER',
      (user) => String(user.id) === String(activeUserID) ? 'me' : user.displayName
    ),
    TEAM: mapOptions(teams, 'TEAM', (team) => team.name),
  };

  return slot.valueTypes.map((valueType) => ({
    valueType,
    label: MESSAGE_TYPE_LABELS[valueType] || valueType,
    options: optionsByType[valueType] || [],
  }));
};
