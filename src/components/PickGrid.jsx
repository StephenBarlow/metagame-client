import React from 'react';
import { gql, useQuery } from '@apollo/client';

const GET_PICK_GRID = gql`
  query GetPickGrid {
    sportsTeams {
      id
      shortName
    }

    sportsGames {
      startsAt
      awayTeam {
        id
      }
      homeTeam {
        id
      }
      result {
        awayTeamScore
        homeTeamScore
      }
    }

    league(leagueID: $leagueID) {
      users {
        id
        displayName
      }
      picks {
        user {
          id
        }
        teams {
          id
        }
        week
      }
    }
  }
`;

function PickGrid() {

  const { loading, error, data } = useQuery(GET_PICK_GRID);

  if (loading) return 'Loading...';
  if (error) return `Error! ${error.message}`;

  let teams = data.sportsTeams.slice().sort(function(a, b) {
    if (a.shortName > b.shortName) {
      return 1;
    } else {
      return -1;
    }
  });

  const teamHeaders = teams.map((team) => 
    <th data-team-id="{ team.id }">{ team.shortName }</th>
  );

  return (
    <table>
      <thead>
        <tr>
          <th>Competitor</th>
          <th>Score</th>
          { teamHeaders }
          <th data-team-id="bye">BYE</th>
        </tr>
      </thead>
      <tbody>

      </tbody>
    </table>
  );
}

export default PickGrid;
