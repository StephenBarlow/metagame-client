import React from 'react';
import { getMessageFragments } from './messageUtils';

const formatMessageTime = (createdAt) => {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
};

export function MessageSentence({ message }) {
  return (
    <span className="message-sentence">
      {getMessageFragments(message).map((fragment, index) => (
        <span
          className={fragment.type === 'selection' ? 'message-selection' : undefined}
          key={`${fragment.key || 'literal'}-${index}`}
        >
          {fragment.text}
        </span>
      ))}
    </span>
  );
}

function MessagePickChips({ message, league }) {
  const picksAreRevealed = message.week <= league.revealedWeek;
  const authorPicks = league.picks.filter(
    (pick) => pick.week === message.week && pick.user.id === message.author.id
  );
  const pickedBye = authorPicks.some((pick) => pick.team.shortName === 'BYE');
  const chips = picksAreRevealed
    ? pickedBye
      ? ['BYE']
      : authorPicks.slice(0, 2).map((pick) => pick.team.shortName)
    : ['?', '?'];

  return (
    <span className="message-pick-chips" aria-label={picksAreRevealed ? "Author's picks" : 'Picks not yet revealed'}>
      {chips.map((label, index) => (
        <React.Fragment key={`${label}-${index}`}>
          {index > 0 && <span className="message-pick-chip-separator" aria-hidden="true">+</span>}
          <span className="message-pick-chip">{label}</span>
        </React.Fragment>
      ))}
    </span>
  );
}

function MessageFeed({ messages, league }) {
  if (!messages.length) {
    return <p className="message-feed-empty">No league messages yet.</p>;
  }

  return (
    <div className="message-feed" aria-label="Latest league messages">
      {messages.map((message) => {
        const formattedTime = formatMessageTime(message.createdAt);

        return (
          <article className="message-feed-item" key={message.id}>
            <div className="message-feed-meta">
              <strong>{message.author.displayName}</strong>
              <span>Week {message.week}</span>
              <MessagePickChips message={message} league={league} />
              {formattedTime && <time dateTime={message.createdAt}>{formattedTime}</time>}
            </div>
            <MessageSentence message={message} />
          </article>
        );
      })}
    </div>
  );
}

export default MessageFeed;
