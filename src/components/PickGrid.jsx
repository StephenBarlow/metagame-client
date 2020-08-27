import React from 'react';
import { useParams } from "react-router-dom";
import { gql, useQuery } from '@apollo/client';

const GET_PICK_GRID = gql`
  query GetPickGrid($leagueID: ID!) {
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
        displayName(leagueID: $leagueID)
      }
      picks {
        user {
          id
        }
        team {
          id
        }
        week
      }
    }
  }
`;

function PickGrid() {

  const { id } = useParams();
  const { loading, error, data } = useQuery(
    GET_PICK_GRID,
    {
      variables: {
        leagueID: id
      }
    }
  );

  if (loading) return 'Loading...';
  if (error) return `Error! ${error.message}`;

  // Sort teams alphabetically
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

  let players = data.league.users;
  const playerNames = players.map((player) => <tr><td>{ player.displayName }</td></tr>)

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
        { playerNames }
      </tbody>
    </table>
  );
}

export default PickGrid;
