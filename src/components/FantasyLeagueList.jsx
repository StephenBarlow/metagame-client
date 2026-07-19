import React, { useContext } from 'react';
import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import UserContext from './ActiveUserContext';
import { Link, Navigate } from "react-router";

const GET_FANTASY_LEAGUES = gql`
  query GetFantasyLeagues ($userID: String!) {
    leagues(userID: $userID) {
      id
      name
      season
    }
    currentSeason
  }
`;

function FantasyLeagueList({ autoRedirect = true }) {
  const activeUser = useContext(UserContext);
  const { loading, error, data } = useQuery(GET_FANTASY_LEAGUES, {
    variables: {
      userID: activeUser().id
    }
  });

  if (loading) return 'Loading...';
  if (error) return `Error! ${error.message}`;

  const leagues = data.leagues ?? [];
  const currentLeagues = leagues.filter((league) => league.season === data.currentSeason);
  const pastLeagues = leagues.filter((league) => league.season !== data.currentSeason);

  if (autoRedirect && currentLeagues.length === 1) {
    return <Navigate to={'/leagues/' + currentLeagues[0].id} />
  }

  const currentLeagueLinks = currentLeagues.map((league) => <li key={league.id}><Link to={'/leagues/' + league.id}>{league.name}</Link></li>);
  const pastLeagueLinks = pastLeagues.map((league) => <li key={league.id}><Link to={'/leagues/' + league.id}>{league.name}</Link></li>);

  return (
    <div className="league-list">
      <h2>Current leagues</h2>
      <ul>
      { currentLeagueLinks }
      </ul>

      <h2>Past leagues</h2>
      <ul>
        { pastLeagueLinks }
      </ul>
    </div>
  );
}

export default FantasyLeagueList;
