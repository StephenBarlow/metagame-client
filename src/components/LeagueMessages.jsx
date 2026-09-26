import React, { useState } from 'react';
import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import MessageComposer from './MessageComposer';
import MessageFeed from './MessageFeed';

const SET_MESSAGE_REACTION = gql`
  mutation SetMessageReaction($request: SetMessageReactionRequest!, $leagueID: ID!) {
    setMessageReaction(request: $request) {
      reactions {
        id
        reactionType
        user {
          id
          displayName(leagueID: $leagueID)
        }
      }
      errors {
        code
        message
      }
    }
  }
`;

function LeagueMessages({ league, teams, userID, currentSeason, currentUserLimited, sidebar = false }) {
  const canCompose = league.season === currentSeason;
  const messages = league.messages || [];
  const [reactionOverrides, setReactionOverrides] = useState({});
  const [pendingReactionMessageID, setPendingReactionMessageID] = useState(null);
  const [setMessageReaction] = useMutation(SET_MESSAGE_REACTION);

  if (currentUserLimited) return null;
  if (league.revealedWeek < 1 && String(userID) !== '1') return null;
  if (!canCompose && !messages.length) return null;

  const setReactionForMessage = async (messageID, reactionType) => {
    setPendingReactionMessageID(String(messageID));

    try {
      const { data } = await setMessageReaction({
        variables: {
          leagueID: league.id,
          request: { userID, messageID, reactionType },
        },
      });
      const result = data?.setMessageReaction;

      if (!result?.errors?.length && result?.reactions) {
        setReactionOverrides((currentOverrides) => ({
          ...currentOverrides,
          [messageID]: result.reactions,
        }));
      }
    } finally {
      setPendingReactionMessageID(null);
    }
  };

  const composer = canCompose && <MessageComposer league={league} teams={teams} userID={userID} />;
  const feed = (
    <div className="message-feed-panel">
      <strong className="message-feed-heading">Latest messages</strong>
      <MessageFeed
        messages={messages}
        league={league}
        userID={userID}
        reactionOverrides={reactionOverrides}
        pendingReactionMessageID={pendingReactionMessageID}
        onSetReaction={setReactionForMessage}
      />
    </div>
  );

  return (
    <section className={`league-messages${sidebar ? ' league-messages-sidebar' : ''}${canCompose ? '' : ' league-messages-read-only'}`}>
      <h3>THE FEED</h3>
      <div className="league-messages-layout">
        {sidebar ? <>{composer}{feed}</> : <>{feed}{composer}</>}
      </div>
    </section>
  );
}

export default LeagueMessages;
