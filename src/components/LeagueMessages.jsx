import React from 'react';
import MessageComposer from './MessageComposer';
import MessageFeed from './MessageFeed';

function LeagueMessages({ league, teams, userID, currentSeason, currentUserLimited }) {
  const canCompose = league.season === currentSeason;
  const messages = league.messages || [];

  if (currentUserLimited) return null;
  if (league.revealedWeek < 1 && String(userID) !== '1') return null;
  if (!canCompose && !messages.length) return null;

  return (
    <section className={`league-messages${canCompose ? '' : ' league-messages-read-only'}`}>
      <h3>THE FEED</h3>
      <div className="league-messages-layout">
        <div className="message-feed-panel">
          <strong className="message-feed-heading">Latest messages</strong>
          <MessageFeed messages={messages} league={league} />
        </div>
        {canCompose && <MessageComposer league={league} teams={teams} userID={userID} />}
      </div>
    </section>
  );
}

export default LeagueMessages;
