import React, { useState, useContext } from 'react';
import UserContext from './ActiveUserContext';

function CurrentPick(props) {

  const activeUser = useContext(UserContext);
  const currentPicks = props.league.picks.filter(item => (item.user.id === activeUser().id && item.week === props.league.currentWeek));

  return (
    <>
      <h3>Current picks for week {props.league.currentWeek}</h3>
      <ul>
      {
        currentPicks.map((pick) => <li key={pick.id}>
          {pick.team.name}
        </li>)
      }
      </ul>
    </>
  );
}

export default CurrentPick;
