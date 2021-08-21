// Table that shows all picks for the current
// week after they're revealed.

import React, { useContext } from 'react';
import UserContext from './ActiveUserContext';

function CurrentWeekPicks(props) {
  const activeUser = useContext(UserContext);

  const currentPicks = props.league.picks.filter(item => (item.week === props.league.currentWeek));

  const picksForPlayer = function(playerID) {
    return currentPicks.filter(pick => (pick.user.id === playerID)).map((pick) => <td key={pick.team.shortName.toLowerCase()} className={'team-' + pick.team.shortName.toLowerCase()}>{pick.team.shortName}</td>)
  }

  const isActiveUser = function(playerID) {
    return (playerID === activeUser().id) ? 'is-active-user' : '';
  }

  const playerRows = props.league.users.map((player) => <tr key={player.id}>
    <td className={ "player-name default-cell " + isActiveUser(player.id)}>{player.displayName}</td>
    {picksForPlayer(player.id)}
  </tr>)

  return (
    <>
      { props.league.currentWeek === props.league.revealedWeek &&
      <>
        <h3>All picks for week {props.league.currentWeek}</h3>
        <table className="pick-grid">
          <thead>
            <tr>
              <th className="default-cell">Competitor</th>
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
