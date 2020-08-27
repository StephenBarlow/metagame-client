import React from 'react';
import { gql, useQuery } from '@apollo/client';

const GET_FANTASY_LEAGUES = gql`
  query GetFantasyLeagues ($email: String!) {
    me @client @export(as: "email")

    user(email: $email) {
      fantasyLeagues {
        id
        name
      }
    }
  }
`;

function FantasyLeagueList() {

  const { loading, error, data } = useQuery(GET_FANTASY_LEAGUES);

  if (loading) return 'Loading...';
  if (error) return `Error! ${error.message}`;

  let leagues = []

  if (data.user?.fantasyLeagues) {
    leagues = data.user.fantasyLeagues.map((league) => <li><a href={"/leagues/" + league.id}>{league.name}</a></li>);
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
