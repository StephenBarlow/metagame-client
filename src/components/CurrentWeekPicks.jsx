import React, { useState, useContext } from 'react';
import UserContext from './ActiveUserContext';

function CurrentWeekPicks(props) {

  const activeUser = useContext(UserContext);
  const currentPicks = props.league.picks.filter(item => (item.week === props.league.currentWeek));

  const picksForPlayer = function(playerID) {
    return currentPicks.filter(pick => (pick.user.id === playerID)).map((pick) => <td className={'team-' + pick.team.shortName.toLowerCase()}>{pick.team.shortName}</td>)
  }

  const playerRows = props.league.users.map((player) => <tr key={player.id}>
    <td className="player-name">{player.displayName}</td>
    {picksForPlayer(player.id)}
  </tr>)

  return (
    <>
      <h3>All picks for week {props.league.currentWeek}</h3>
      <table className="pick-grid">
      <thead>
        <tr>
          <th>Competitor</th>
          <th>Team 1</th>
          <th>Team 2</th>
        </tr>
      </thead>
      <tbody>
        {playerRows}
      </tbody>
    </table>
    </>
  );
}

export default CurrentWeekPicks;
