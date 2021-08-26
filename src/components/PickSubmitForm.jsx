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

  const canSubmit = function() {

    // Can't pick the same team in both dropdowns except BYE
    if (firstTeam === secondTeam && firstTeam !== '-1') {
      return false;
    }

    // Gotta pick something in both dropdowns
    if (firstTeam === '' || secondTeam === '') {
      return false;
    }

    // Gotta pick BYE in both dropdowns if you pick it at all
    if ((firstTeam === '-1' && secondTeam !== '-1') || (firstTeam !== '-1' && secondTeam === '-1')) {
      return false;
    }

    return true;
  }

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

  // Checks if the active user has already
  // picked a particular team
  const alreadyPicked = function(teamID) {
    return !!props.league.picks.find(pick => pick.user.id === activeUser().id && pick.team.id === teamID);
  }

  let teams = props.teams.slice().sort(function(a, b) {
    if (a.name > b.name) {
      return 1;
    } else {
      return -1;
    }
  });

  teams = teams.map((team) => <option value={team.id} key={team.id} disabled={alreadyPicked(team.id)}>{team.name}</option>)

  // Don't show the form if picks have been revealed
  // and this player has already picked
  const userHasPicked = props.league.picks.find(pick => (pick.user.id === activeUser().id && pick.week === props.league.currentWeek));
  if (userHasPicked && props.league.currentWeek === props.league.revealedWeek) {
    return (null);
  }

  return (
    <>
      { props.userMustPick &&
        <p className="warning">
          The week's games have started and you haven't submitted a pick! You must pick before league details are shown.
        </p>
      }
      <h3>Submit picks for week {props.league.currentWeek}</h3>
      <p className="resources">
        <a href="https://www.vegas.com/gaming/sportsline/football/" target="_blank">Odds</a>

        <a href="https://docs.google.com/document/d/1Ui9Nwc9xW597GhBqPj6KhbDCau997BFU6OVWYOcVVMc/edit?usp=sharing" target="_blank">Rules</a>
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
        <input className="pick-submit" type="submit" value="Submit" disabled={!canSubmit()} />
      </form>
      <p className="form-status">
        { message }
      </p>
    </>
  )

}

export default PickSubmitForm;
