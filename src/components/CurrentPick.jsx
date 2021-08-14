import React, { useState, useContext } from 'react';
import UserContext from './ActiveUserContext';
import { gql, useQuery } from '@apollo/client';

const GET_CURRENT_PICK = gql`
  query GetCurrentPick($leagueID: ID!, $userID: ID!) {
    currentPick(leagueID: $leagueID, userID: $userID) {
      id
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
  const { loading, error, data } = useQuery(GET_CURRENT_PICK, {
    variables: {
      leagueID: props.league.id,
      userID: activeUser().id
    }
  });

  if (loading) return 'Loading...';
  if (error) return `Error! ${error.message}`;

  return (
    <>
      <h3>Current picks for week {props.league.currentWeek}</h3>
      <ul>
      {
        data.currentPick.map((pick) => <li key={pick.id}>
          {pick.team.name}
        </li>)
      }
      </ul>
    </>
  );
}

export default CurrentPick;
