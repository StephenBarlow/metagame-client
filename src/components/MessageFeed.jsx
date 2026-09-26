import React from 'react';
import { Icon } from '@iconify/react';
import { Tooltip } from 'react-tooltip';
import { getMessageFragments } from './messageUtils';

const REACTION_OPTIONS = [
  { type: 'UPVOTE', icon: 'codicon:thumbsup', label: 'Upvote' },
  { type: 'DOWNVOTE', icon: 'codicon:thumbsdown', label: 'Downvote' },
];

const formatMessageTime = (createdAt) => {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return '';

  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (elapsedSeconds < 60) return 'just now';

  const intervals = [
    ['year', 365 * 24 * 60 * 60],
    ['month', 30 * 24 * 60 * 60],
    ['week', 7 * 24 * 60 * 60],
    ['day', 24 * 60 * 60],
    ['hour', 60 * 60],
    ['minute', 60],
  ];
  const [unit, seconds] = intervals.find(([, intervalSeconds]) => elapsedSeconds >= intervalSeconds);
  const count = Math.floor(elapsedSeconds / seconds);

  return `${count} ${unit}${count === 1 ? '' : 's'} ago`;
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

function MessageReactions({ message, userID, reactions, pending, onSetReaction }) {
  const reactionsByType = REACTION_OPTIONS.reduce((groupedReactions, { type }) => {
    groupedReactions[type] = reactions.filter((reaction) => reaction.reactionType === type);
    return groupedReactions;
  }, {});
  const activeReactionType = reactions.find((reaction) => String(reaction.user.id) === String(userID))?.reactionType;

  return (
    <div className="message-reactions" aria-label="Message reactions">
      {REACTION_OPTIONS.map(({ type, icon, label }) => {
        const matchingReactions = reactionsByType[type];
        const count = matchingReactions.length;
        const isActive = activeReactionType === type;
        const reactorNames = matchingReactions.map((reaction) =>
          String(reaction.user.id) === String(userID) ? 'You' : reaction.user.displayName
        ).join(', ');

        return (
          <button
            key={type}
            type="button"
            className={`message-reaction${count ? '' : ' message-reaction-empty'}${isActive ? ' message-reaction-active' : ''}`}
            aria-label={`${label}${count ? `, ${count}` : ''}`}
            data-tooltip-id={count ? 'message-reaction-tooltip' : undefined}
            data-tooltip-content={reactorNames || undefined}
            disabled={pending}
            onClick={() => onSetReaction(message.id, isActive ? null : type)}
          >
            <Icon icon={icon} aria-hidden="true" />
            {count > 0 && <span>{count}</span>}
          </button>
        );
      })}
    </div>
  );
}

function MessageFeed({
  messages,
  league,
  userID,
  reactionOverrides = {},
  pendingReactionMessageID,
  onSetReaction = () => {},
}) {
  if (!messages.length) {
    return <p className="message-feed-empty">No league messages yet.</p>;
  }

  return (
    <div className="message-feed" aria-label="Latest league messages">
      <Tooltip id="message-reaction-tooltip" classNameArrow="hidden" style={{ backgroundColor: '#000000', zIndex: 10 }} />
      {messages.map((message) => {
        const formattedTime = formatMessageTime(message.createdAt);
        const reactions = reactionOverrides[message.id] || message.reactions || [];

        return (
          <article className="message-feed-item" key={message.id}>
            <div className="message-feed-meta">
              <strong>{message.author.displayName}</strong>
              <span>Week {message.week}</span>
              <MessagePickChips message={message} league={league} />
              {formattedTime && <time dateTime={message.createdAt}>{formattedTime}</time>}
            </div>
            <MessageSentence message={message} />
            <MessageReactions
              message={message}
              userID={userID}
              reactions={reactions}
              pending={String(pendingReactionMessageID) === String(message.id)}
              onSetReaction={onSetReaction}
            />
          </article>
        );
      })}
    </div>
  );
}

export default MessageFeed;
