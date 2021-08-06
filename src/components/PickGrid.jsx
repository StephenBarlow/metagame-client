import React from 'react';
import { gql, useQuery } from '@apollo/client';

const GET_PICK_GRID = gql`
  query GetPickGrid($leagueID: ID!) {
    league(leagueID: $leagueID) {
      currentWeek
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

function PickGrid(props) {

  const { loading, error, data } = useQuery(
    GET_PICK_GRID,
    {
      variables: {
        leagueID: props.leagueID
      }
    }
  );

  if (loading) return 'Loading...';
  if (error) return `Error! ${error.message}`;

  // Sort teams alphabetically
  let teams = props.teams.slice().sort(function(a, b) {
    if (a.shortName > b.shortName) {
      return 1;
    } else {
      return -1;
    }
  });

  const teamHeaders = teams.map((team) => 
    <th data-team-id={team.id} key={team.id}>{team.shortName}</th>
  );

  let players = data.league.users;

  const playerRows = data.league.users.map((player) => <tr key={player.id}>
    <td className="player-name">{player.displayName}</td>
    <td className="player-total">0</td>
    <td className="player-last">0</td>
    {
      teams.map((team) => <td className="player-team" key={team.id}>
        
      </td>)
    }
    <td className="player-byes">2</td>
  </tr>);

  const playerNames = players.map((player) => <tr key={player.id}><td>{ player.displayName }</td></tr>)

  let playerPicks = teams.map((team) => 
    <td>Blah</td>
  );



  return (
    <table className="pick-grid">
      <thead>
        <tr>
          <th>Competitor</th>
          <th>Total</th>
          <th>Last</th>
          { teamHeaders }
          <th data-team-id="bye" className="player-byes">BYES</th>
        </tr>
      </thead>
      <tbody>
        
        { playerRows }
      </tbody>
    </table>
  );
}

export default PickGrid;
