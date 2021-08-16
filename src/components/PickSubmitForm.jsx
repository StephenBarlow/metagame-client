import React, { useState, useContext } from 'react';
import { gql, useMutation } from '@apollo/client';
import LoginButton from './LoginButton';
import UserContext from './ActiveUserContext';

const SUBMIT_PICKS = gql`
mutation SubmitPicks($request: SubmitPickRequest!) {
  submitPick(request: $request) {
    pick {
      id
      week
      league {
        id
      }
      user {
        id
      }
      team {
        id
      }
    }
    errors {
      code
      message
    }
  }
}
`;

const FIRST_DEADLINE = new Date('2021-09-12T13:00:00-05:00');

function PickSubmitForm(props) {
  const activeUser = useContext(UserContext);
  const [firstTeam, setFirstTeam] = useState('');
  const [secondTeam, setSecondTeam] = useState('');
  const [message, setMessage] = useState('\xa0');

  const formSubmit = function(event, submitPicks, teams) {
    event.preventDefault();
    submitPicks({ variables: { "request": {
      userID: activeUser().id,
      leagueID: props.league.id,
      teamIDs: teams,
      week: props.league.currentWeek
    } }});
  };

  const [submitPicks, {loading, error, data}] = useMutation (
    SUBMIT_PICKS,
    {
      refetchQueries: [
        'GetLeagueDetails',
        'GetCurrentPick',
        'GetPickGrid'
      ],
      onCompleted: ({submitPick}) => {
        if (submitPick.pick) {
          setMessage('Picks submitted successfully!');
        }
        if (submitPick.errors) {
          setMessage(`Error: ${submitPick.errors[0].message}`);
        }
      }
    }
  );

  let teams = props.teams.slice().sort(function(a, b) {
    if (a.name > b.name) {
      return 1;
    } else {
      return -1;
    }
  });

  const pastPicks = props.league.picks;
  teams = teams.filter(team => {
    return !(pastPicks.find(pick => pick.user.id === activeUser().id && pick.team.id === team.id))
  });

  teams = teams.map((team) => <option value={team.id} key={team.id}>{team.name}</option>)

  return (
    <>
      <h3>Submit picks for week {props.league.currentWeek}</h3>
      <p>
        <a href="https://www.vegas.com/gaming/sportsline/football/" target="_blank">Odds</a>
      </p>
      <form onSubmit={(event) => formSubmit(event, submitPicks, [firstTeam, secondTeam])}>
        <select 
          className="team-picker" name="first-team-picker" id="first-team-picker"
          onChange={event => setFirstTeam(event.target.value)}
        >
          <option value="" key="blank"></option>
          <option value="-1" key="bye">BYE</option>
          {teams}
        </select>
        <select 
          className="team-picker" name="second-team-picker" id="second-team-picker"
          onChange={event => setSecondTeam(event.target.value)}>
          <option value="" key="blank"></option>
          <option value="-1" key="bye">BYE</option>
          {teams} 
        </select>
        <input className="pick-submit" type="submit" value="Submit" />
      </form>
      <p className="form-status">
        { message }
      </p>
    </>
  )

}

export default PickSubmitForm;
