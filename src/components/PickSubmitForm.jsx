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

function PickSubmitForm(props) {
  const activeUser = useContext(UserContext);
  const [firstTeam, setFirstTeam] = useState('');
  const [secondTeam, setSecondTeam] = useState('');

  const formSubmit = function(event, submitPicks, teams) {
    event.preventDefault();
    console.log(teams);
    submitPicks({ variables: { "request": {
      userID: activeUser().id,
      leagueID: props.league.id,
      teamIDs: teams,
      week: props.league.currentWeek
    } }});
  };

  const [submitPicks, {loading, error, data}] = useMutation (
    SUBMIT_PICKS,
    {}
  );

  let teams = props.teams.slice().sort(function(a, b) {
    if (a.name > b.name) {
      return 1;
    } else {
      return -1;
    }
  });

  teams = teams.map((team) => <option value={team.id} key={team.id}>{team.name}</option>)

  return (
    <>
      <h3>Submit picks for week {props.league.currentWeek}</h3>
      <form onSubmit={(event) => formSubmit(event, submitPicks, [firstTeam, secondTeam])}>
        <select 
          className="team-picker" name="first-team-picker" id="first-team-picker"
          onChange={event => setFirstTeam(event.target.value)}
        >
          {teams}
        </select>
        <select 
          className="team-picker" name="second-team-picker" id="second-team-picker"
          onChange={event => setSecondTeam(event.target.value)}>
          {teams}
        </select>
        <input type="submit" />
      </form>
      <p className="form-status">
        { loading && <>Loading...</> }
        { error && <>Server error while submitting picks.</> }
        { data && <>Picks submitted successfully!</>}
      </p>
    </>
  )

}

export default PickSubmitForm;
