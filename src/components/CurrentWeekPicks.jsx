// Table that shows all picks for the current
// week after they're revealed.

import React, { useContext } from 'react';
import UserContext from './ActiveUserContext';

function CurrentWeekPicks(props) {
  const activeUser = useContext(UserContext);

  // Get picks from this week only
  const currentPicks = props.league.picks.filter(pick => (pick.week === props.league.currentWeek));

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
      <td className={'team-' + playerPick.picks[0].toLowerCase()}>{playerPick.picks[0]}</td>
      <td className={'team-' + playerPick.picks[1].toLowerCase()}>{playerPick.picks[1]}</td>
      </>
    }
    { playerPick.picks.length === 0 &&
      <>
      <td className="outcome-unknown">?</td>
      <td className="outcome-unknown">?</td>
      </>
    }
</tr>);

  return (
    <>
      { props.league.currentWeek === props.league.revealedWeek &&
      <>
        <h3>All picks for week {props.league.currentWeek}</h3>
        <table className="pick-grid week-picks">
          <thead>
            <tr>
              <th className="player-name">Competitor</th>
              <th className="default-cell">Team 1</th>
              <th className="default-cell">Team 2</th>
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

export default CurrentWeekPicks;
