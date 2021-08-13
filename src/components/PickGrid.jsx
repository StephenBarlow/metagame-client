// The big-ass table showing the entire pick history for a league.

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
        id
        user {
          id
        }
        team {
          id
        }
        week
      }
    }
    sportsGames {
      id
      awayTeam {
        id
        shortName
      }
      homeTeam {
        id
        shortName
      }
      week
      result {
        complete
        awayTeamScore
        homeTeamScore
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

  const getPickResults = function() {
    let results = {};

    // For each player...
    for (const player of data.league.users) {
      results[player.id] = {};

      // For each team...
      for (const team of props.teams) {

        // If the player has picked that team...
        const teamPick = data.league.picks.find(pick => (pick.team.id === team.id && pick.user.id === player.id));

        if (teamPick) {
          results[player.id][team.id] = calculatePickResult(player.id, teamPick);
        }
      }
    }

    return results;
  };

  // These next few functions are like the only Pick-2-specific logic
  const calculatePickResult = function(playerID, firstPick) {

    // Find the other pick by the same
    // player from the same week
    const secondPick = data.league.picks.find(pick => (pick.week === firstPick.week && pick.user.id === firstPick.user.id && pick.id !== firstPick.id));

    // Get the result of both picked games
    const firstPickGame = data.sportsGames.find(game => (game.week === firstPick.week && (game.awayTeam.id === firstPick.team.id || game.homeTeam.id === firstPick.team.id)));

    const secondPickGame = data.sportsGames.find(game => (game.week === secondPick.week && (game.awayTeam.id === secondPick.team.id || game.homeTeam.id === secondPick.team.id)));

    // Result unknown if either game is incomplete
    if (!(firstPickGame.result.complete && secondPickGame.result.complete )) {
      return {
        value: '?',
        week: firstPick.week,
        outcome: 'UNKNOWN'
      };
    }

    const firstGameMargin = calculateGameMargin(firstPickGame, firstPick.team.id);

    const secondGameMargin = calculateGameMargin(secondPickGame, secondPick.team.id);

    if (firstGameMargin >= 0 && secondGameMargin >= 0) {

      // Double win, always points equal
      // to margin of victory
      return {
        value: firstGameMargin,
        week: firstPick.week,
        outcome: 'DOUBLE_WIN'
      }
    } else if (firstGameMargin <= 0 && secondGameMargin <= 0) {

      // Double loss, points depend on "larger" margin of LOSS
      let firstGameScore;

      if (firstGameMargin < secondGameMargin) {
        // This margin is larger, so use it
        firstGameScore = -firstGameMargin;
      } else if (firstGameMargin === secondGameMargin) {
        // The two margins are equal, so always use a deterministic one
        if (firstPickGame.id < secondPickGame.id) {
          firstGameScore = -firstGameMargin;
        } else {
          firstGameScore = 0;
        }
      } else {
        // The other margin is larger, so use that one
        firstGameScore = 0;
      }

      return {
        value: firstGameScore,
        week: firstPick.week,
        outcome: 'DOUBLE_LOSS'
      }
    } else {
      // Split, no points
      return {
        value: 0,
        week: firstPick.week,
        outcome: 'SPLIT'
      }
    }

  };

  const calculateGameMargin = function(game, teamID) {
    const isAwayTeam = (game.awayTeam.id === teamID);
    let pickedTeamScore, otherTeamScore;
    if (isAwayTeam) {
      pickedTeamScore = game.result.awayTeamScore;
      otherTeamScore = game.result.homeTeamScore
    } else {
      pickedTeamScore = game.result.homeTeamScore;
      otherTeamScore = game.result.awayTeamScore;
    }

    return pickedTeamScore - otherTeamScore;
  }

  if (loading) return 'Loading...';
  if (error) return `Error! ${error.message}`;

  const pickResults = getPickResults();

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
        {pickResults[player.id][team.id] &&
          <>
            {pickResults[player.id][team.id].value}
          </>
        }
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
