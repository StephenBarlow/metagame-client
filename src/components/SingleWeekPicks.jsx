// Table that shows all picks for the current
// week after they're revealed.

import React, { useContext } from 'react';
import UserContext from './ActiveUserContext';
import { useQuery } from '@apollo/client';
import { GET_SPORTS_GAMES } from './SharedQueries';

const TeamOutcome = ({weekToShow, league, team, ...props}) => {
  const { loading: gamesLoading, error: gamesError, data: gamesData } = useQuery(
    GET_SPORTS_GAMES,
    {
      variables: {
        season: league.season
      },
      skip: !league
    }
  );

  if (team === 'BYE') {
    return (
      <td className="team-bye">BYE</td>
    );
  }

  if (gamesLoading || gamesError) {
    return (
      <td className={`team-${team.toLowerCase()} gameresult-unknown`}>{team}</td>
    );
  }

  const teamGame = gamesData.sportsGames.find(game => (game.week === weekToShow && (game.awayTeam.shortName === team || game.homeTeam.shortName === team)));

  let gameResult;

  if (teamGame.result.awayTeamScore === null || teamGame.result.homeTeamScore === null) {
    gameResult = 'unknown';
  } else {
    const isAwayTeam = (teamGame.awayTeam.shortName === team);
    let pickedTeamScore, otherTeamScore;
    if (isAwayTeam) {
      pickedTeamScore = teamGame.result.awayTeamScore;
      otherTeamScore = teamGame.result.homeTeamScore
    } else {
      pickedTeamScore = teamGame.result.homeTeamScore;
      otherTeamScore = teamGame.result.awayTeamScore;
    }


    if (pickedTeamScore > otherTeamScore) {
      gameResult = 'win';
    } else if (pickedTeamScore < otherTeamScore) {
      gameResult = 'loss';
    } else {
      gameResult = 'tie';
    }
  }

  return (
    <td className={`team-${team.toLowerCase()} gameresult gameresult-${gameResult} gameresult-${props.side}`}>{team}</td>
  );
}

const PickOutcome = ({weekToShow, ...props}) => {
  const { loading: gamesLoading, error: gamesError, data: gamesData } = useQuery(
    GET_SPORTS_GAMES,
    {
      variables: {
        season: props.league.season
      },
      skip: !props.league
    }
  );

  const getPickResult = function(league, firstTeam, secondTeam) {


    let pickResult = {
      week: weekToShow,
    };

    // If player picked BYE, no points
    if (firstTeam === 'BYE') {
      pickResult.value = '–';
      pickResult.outcome = 'UNKNOWN';
      return pickResult;
    }

    // Get the result of both picked games
    const firstPickGame = gamesData.sportsGames.find(game => (game.week === weekToShow && (game.awayTeam.shortName === firstTeam || game.homeTeam.shortName === firstTeam)));

    const secondPickGame = gamesData.sportsGames.find(game => (game.week === weekToShow && (game.awayTeam.shortName === secondTeam || game.homeTeam.shortName === secondTeam)));

    // Result unknown if either game is incomplete
    if (!(firstPickGame.result.complete && secondPickGame.result.complete )) {
      pickResult.value = '?';
      pickResult.outcome = 'UNKNOWN';
      return pickResult;
    }

    // Get each game's margin of victory/loss
    const firstGameMargin = getGameMargin(firstPickGame, firstTeam);

    const secondGameMargin = getGameMargin(secondPickGame, secondTeam);

    if (firstGameMargin >= 0 && secondGameMargin >= 0) {

      // Double win, always points equal
      // to margin of victory
      pickResult.value = firstGameMargin + secondGameMargin;
      pickResult.outcome = 'DOUBLE_WIN';
      return pickResult;
    } else if (firstGameMargin <= 0 && secondGameMargin <= 0) {

      // Double loss, points depend on "larger" margin of loss

      pickResult.outcome = 'DOUBLE_LOSS';
      if (firstGameMargin < secondGameMargin) {
        pickResult.value = -firstGameMargin;
      } else {
        pickResult.value = -secondGameMargin;
      }

      return pickResult;
    } else {
      // Split, no points
      pickResult.value = '❌';
      pickResult.outcome = 'SPLIT';
      return pickResult;
    }
  };

  const getResultClass = function(result) {
    if (!result) {
      return 'default-cell';
    } else if (result.outcome === 'DOUBLE_WIN') {
      return 'outcome-double-win';
    } else if (result.outcome === 'DOUBLE_LOSS') {
      return 'outcome-double-loss';
    } else if (result.outcome === 'UNKNOWN') {
      return 'outcome-unknown';
    } else if (result.outcome === 'SPLIT') {
      return 'outcome-split';
    }
  };

  const getGameMargin = function(game, teamName) {
    const isAwayTeam = (game.awayTeam.shortName === teamName);
    let pickedTeamScore, otherTeamScore;
    if (isAwayTeam) {
      pickedTeamScore = game.result.awayTeamScore;
      otherTeamScore = game.result.homeTeamScore
    } else {
      pickedTeamScore = game.result.homeTeamScore;
      otherTeamScore = game.result.awayTeamScore;
    }

    return pickedTeamScore - otherTeamScore;
  };

  if (gamesLoading) {
    return (
      <td className="pickoutcome">
        ...
      </td>
    );
  }

  if (gamesError) {
    return (
      <td className="pickoutcome">
        ?
      </td>
    );
  }

  const pickResult = getPickResult(props.league, props.team1, props.team2);

  return (
    <td className={`${getResultClass(pickResult)}`}>
      {
        typeof pickResult.value === 'number' ? `+${pickResult.value}` : pickResult.value
      }
    </td>
  );
}


function SingleWeekPicks (props) {
  const activeUser = useContext(UserContext);

  const weekToShow = (props.weekToShow) ? props.weekToShow : props.league.currentWeek;

  // Get picks from specified week only
  const currentPicks = props.league.picks.filter(pick => (pick.week === weekToShow));

  // Make a convenient array mapping users and their picks
  let playerPicks = [];
  for(const player of props.league.users) {
    const currentPlayerPicks = currentPicks.filter(pick => (pick.user.id === player.id));
    let pickArray = currentPlayerPicks.map(pick => pick.team.shortName).sort();
    playerPicks.push({
      player: player,
      picks: pickArray
    });
  }

  // Get the frequency of each picked team
  let pickFrequencies = {};
  for (const playerPick of playerPicks) {
    for (const shortName of playerPick.picks) {
      if (pickFrequencies.hasOwnProperty(shortName)) {
        pickFrequencies[shortName] += 1;
      } else {
        pickFrequencies[shortName] = 1;
      }
    }
  }

  for (const playerPick of playerPicks) {
    if (playerPick.picks.length) {

      // Put the more frequent of the two picks in the left column.
      // If same frequency, alphabetically first goes on the left.
      if (pickFrequencies[playerPick.picks[1]] > pickFrequencies[playerPick.picks[0]] || (pickFrequencies[playerPick.picks[1]] === pickFrequencies[playerPick.picks[0]] && playerPick.picks[1] < playerPick.picks[0])) {
        playerPick.picks.reverse();
      }
    }
  }

  playerPicks.sort((playerOne, playerTwo) => {

    // If somebody hasn't made picks yet, shove 'em to the bottom
    if (!playerOne.picks.length) {
      return 1;
    } else if (!playerTwo.picks.length) {
      return -1;
    }

    // If somebody picked BYE, shove 'em to the almost-botom
    if (playerOne.picks[0] === 'BYE') {
      return 1;
    } else if (playerTwo.picks[0] === 'BYE') {
      return -1;
    }

    // Put the most frequent team picks on top for left column
    if (pickFrequencies[playerOne.picks[0]] > pickFrequencies[playerTwo.picks[0]]) {
      return -1;
    } else if (pickFrequencies[playerOne.picks[0]] < pickFrequencies[playerTwo.picks[0]]) {
      return 1;
    }

    // Fall back to alphabetical sorting
    if (playerOne.picks[0] < playerTwo.picks[0]) {
      return -1;
    } else if (playerTwo.picks[0] < playerOne.picks[0]) {
      return 1;
    }

    // Flip the sort for right-hand column so the right-column
    // most-frequent might join up with the left-column second-most-frequent
    if (pickFrequencies[playerOne.picks[1]] < pickFrequencies[playerTwo.picks[1]]) {
      return -1;
    } else if (pickFrequencies[playerOne.picks[1]] > pickFrequencies[playerTwo.picks[1]]) {
      return 1;
    }

    // Fall back to alphabetical sorting again
    if (playerOne.picks[1] < playerTwo.picks[1]) {
      return -1;
    } else if (playerTwo.picks[1] < playerOne.picks[1]) {
      return 1;
    }

    return 0;
  });

  if (playerPicks.length > 1) {
    for (let i = 1; i < playerPicks.length; i++){
      if (playerPicks[i].picks[0] === playerPicks[i-1].picks[1]){
        playerPicks[i].picks.reverse();
      }
    }
  }


  const isActiveUser = function(playerID) {
    return (playerID === activeUser().id) ? 'is-active-user' : '';
  }

  const playerRows = playerPicks.map((playerPick) => <tr key={playerPick.player.id}>
    <td className={ "player-name " + isActiveUser(playerPick.player.id)}>{playerPick.player.displayName}</td>
    { playerPick.picks.length > 0 &&
      <>
      <TeamOutcome weekToShow={weekToShow} team={playerPick.picks[0]} league={props.league} side="left" />
      <TeamOutcome weekToShow={weekToShow} team={playerPick.picks[1]} league={props.league} side="right" />
      <PickOutcome weekToShow={weekToShow} team1={playerPick.picks[0]} team2={playerPick.picks[1]} league={props.league} />
      </>
    }
    { playerPick.picks.length === 0 &&
      <>
      <td className="outcome-unknown">?</td>
      <td className="outcome-unknown">?</td>
      <td className="outcome-unknown">?</td>
      </>
    }
</tr>);

  return (
    <>
      { weekToShow <= props.league.revealedWeek &&
      <>
        <h3>All picks for week {weekToShow}</h3>
        <table className="pick-grid week-picks">
          <thead>
            <tr>
              <th className="player-name">Competitor</th>
              <th className="default-cell">Team 1</th>
              <th className="default-cell">Team 2</th>
              <th className="default-cell">Result</th>
            </tr>
          </thead>
          <tbody>
            {playerRows}
          </tbody>
        </table>
      </>
      }
    </>
  );
}

export default SingleWeekPicks;
