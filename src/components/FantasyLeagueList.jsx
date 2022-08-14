import React, { useContext } from 'react';
import { gql, useQuery } from '@apollo/client';
import UserContext from './ActiveUserContext';
import { Redirect } from "react-router-dom";

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
    return <Redirect to={'/leagues/' + data.leagues[0].id} />
  }

  let leagues = []

  if (data.leagues) {
    leagues = data.leagues.map((league) => <li><a href={"/leagues/" + league.id}>{league.name}</a> {(league.season !== data.currentSeason && '(concluded)')}</li>);
  }

  return (
    <div className="league-list">
      <h2>Your leagues</h2>
      <ul>
      { leagues }
      </ul>
    </div>
  );
}

export default FantasyLeagueList;
