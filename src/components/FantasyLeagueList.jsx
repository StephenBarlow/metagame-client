import React from 'react';
import { gql, useQuery } from '@apollo/client';

const GET_FANTASY_LEAGUES = gql`
  query GetFantasyLeagues {
    leagues {
      id
      name
    }
  }
`;

function FantasyLeagueList() {

  const { loading, error, data } = useQuery(GET_FANTASY_LEAGUES);

  if (loading) return 'Loading...';
  if (error) return `Error! ${error.message}`;

  return (
    <table>
      <thead>
        <tr>
          <th>
            Name
          </th>
        </tr>
      </thead>
      <tbody>

      </tbody>
    </table>
  );
}

export default FantasyLeagueList;
