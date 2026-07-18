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

function FantasyLeagueList() {
  const activeUser = useContext(UserContext);
  const { loading, error, data } = useQuery(GET_FANTASY_LEAGUES, {
    variables: {
      userID: activeUser().id
    }
  });

  if (loading) return 'Loading...';
  if (error) return `Error! ${error.message}`;

  if (data.leagues && data.leagues.length === 1) {
    return <Navigate to={'/leagues/' + data.leagues[0].id} />
  }

  let currentLeagues = [];
  let pastLeagues = [];

  if (data.leagues) {

    const cLeagues = data.leagues.filter((league) => league.season === data.currentSeason);
    const pLeagues = data.leagues.filter((league) => league.season !== data.currentSeason);

    currentLeagues = cLeagues.map((league) => <li><Link to={'/leagues/' + league.id}>{league.name}</Link></li>);
    pastLeagues = pLeagues.map((league) => <li><Link to={'/leagues/' + league.id}>{league.name}</Link></li>);
  }

  return (
    <div className="league-list">
      <h2>Current leagues</h2>
      <ul>
      { currentLeagues }
      </ul>

      <h2>Past leagues</h2>
      <ul>
        { pastLeagues }
      </ul>
    </div>
  );
}

export default FantasyLeagueList;
