// Shows a user's pick for the current week if the
// full pick set has not yet been revealed.

import React, { useContext } from 'react';
import UserContext from './ActiveUserContext';
import { gql, useQuery } from '@apollo/client';

const GET_USER_PICKS = gql`
  query GetUserPicks($leagueID: ID!, $userID: ID!) {
    picksForUser(leagueID: $leagueID, userID: $userID) {
      id
      week
      team {
        id
        name
        shortName
      }
    }
  }
`;

function CurrentPick(props) {
  const activeUser = useContext(UserContext);
  const week = props.selectedWeek || props.league.currentWeek;
  const { loading, error, data } = useQuery(GET_USER_PICKS, {
    variables: {
      leagueID: props.league.id,
      userID: activeUser().id,
      week: week
    },
    skip: props.currentSeason !== props.league.season
  });

  if (props.currentSeason !== props.league.season) {
    return (<p className="warning">This league has concluded.</p>)
  }
  if (loading) return 'Loading...';
  if (error) return `Error! ${error.message}`;

  const selectedWeekPicks = data.picksForUser.filter(pick => pick.week === week);

  if (!selectedWeekPicks.length) {
    return (<p className="warning">You have not yet submitted picks for week {week}.</p>)
  }

  // Don't bother showing this if the table of
  // everyone's picks is being displayed.
  if (props.league.currentWeek === props.league.revealedWeek) {
    return (null);
  }

  return (
    <>
      <h3>Your picks for week {week}</h3>
      <div>
      {
        selectedWeekPicks.map((pick) => <span key={pick.id} className={`team-${pick.team.shortName.toLowerCase()} current-pick`}>
          {pick.team.shortName}
        </span>)
      }
      </div>
      <p style={{maxWidth: '400px', fontSize: '14px'}}>You can change these teams until one of their games starts or the pick list is revealed (whichever happens first).</p>
    </>
  );
}

export default CurrentPick;
