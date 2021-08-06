import React, { useContext } from 'react';
import { gql, useQuery } from '@apollo/client';
import UserContext from './ActiveUserContext';

const GET_FANTASY_LEAGUES = gql`
  query GetFantasyLeagues ($userID: String!) {
    leagues(userID: $userID) {
      id
      name
    }
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

  let leagues = []

  if (data.leagues) {
    leagues = data.leagues.map((league) => <li><a href={"/leagues/" + league.id}>{league.name}</a></li>);
  }

  return (
    <>
      <h2>Your leagues</h2>
      <ul>
      { leagues }
      </ul>
    </>
  );
}

export default FantasyLeagueList;
