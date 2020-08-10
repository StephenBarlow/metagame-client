import React from 'react';
import { gql, useQuery } from '@apollo/client';

const GET_TEAMS = gql`
  query GetTeams {
    sportsTeams {
      shortName
    }
  }
`;

function PickGrid() {

  const { loading, error, data } = useQuery(GET_TEAMS);

  if (loading) return 'Loading...';
  if (error) return `Error! ${error.message}`;

  let teams = data.sportsTeams.slice().sort(function(a, b) {
    if (a.shortName > b.shortName) {
      return 1;
    } else {
      return -1;
    }
  });

  console.log(teams);

  const teamHeaders = teams.map((team) => 
    <th>{ team.shortName }</th>
  );

  return (
    <table>
      <thead>
        <tr>
          { teamHeaders }
        </tr>
      </thead>
      <tbody>

      </tbody>
    </table>
  );
}

export default PickGrid;
