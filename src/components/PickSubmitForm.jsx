import React, { useState, useContext } from 'react';
import { gql, useMutation, useQuery } from '@apollo/client';
import UserContext from './ActiveUserContext';

const SUBMIT_PICKS = gql`
mutation SubmitPicks($request: SubmitPickRequest!) {
  submitPick(request: $request) {
    errors {
      code
      message
    }
  }
}
`;

const GET_USER_PICKS = gql`
  query GetUserPicks($leagueID: ID!, $userID: ID!) {
    picksForUser(leagueID: $leagueID, userID: $userID) {
      id
      week
      team {
        id
        name
        shortName
      }
    }
  }
`;

function PickSubmitForm(props) {
  const activeUser = useContext(UserContext);
  const [firstTeam, setFirstTeam] = useState('');
  const [secondTeam, setSecondTeam] = useState('');
  const [message, setMessage] = useState('\xa0');
  const [showPicked, setShowPicked] = useState(props.config?.showPicked);
  const currentWeek = props.league.currentWeek;
  const maxWeek = 18;
  // selectedWeek and setSelectedWeek are now props
  const { selectedWeek, setSelectedWeek } = props;

  // Get user's picks to check which weeks have picks
  const { data: userPicksData } = useQuery(GET_USER_PICKS, {
    variables: {
      leagueID: props.league.id,
      userID: activeUser().id
    }
  });

  const updateShowPicked = function(sp) {
    setShowPicked(sp);
    let userConfig = (props.config ? { ...props.config } : {});
    userConfig.showPicked = sp;
    localStorage.setItem('userConfig', JSON.stringify(userConfig));
  }

  const formSubmit = function(event, submitPicks, teams) {
    event.preventDefault();
    submitPicks({ variables: { "request": {
      userID: activeUser().id,
      leagueID: props.league.id,
      teamIDs: teams,
      week: selectedWeek
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

  const [submitPicks] = useMutation (
    SUBMIT_PICKS,
    {
      refetchQueries: [
        'GetLeagueDetails',
        'GetUserPicks',
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
    // Check if the user has picked this team in any week except the selected week
    return !!userPicksData?.picksForUser?.find(pick => pick.team.id === teamID && pick.week !== selectedWeek);
  }

  let teams = props.teams.slice().sort(function(a, b) {
    if (a.name > b.name) {
      return 1;
    } else {
      return -1;
    }
  });

  if (!showPicked) {
    teams = teams.filter((team) => !alreadyPicked(team.id));
  }

  teams = teams.map((team) => <option value={team.id} key={team.id} disabled={alreadyPicked(team.id)}>{team.name}</option>)

  // Don't show the form if picks have been revealed
  // and this player has already picked for the current week
  const userHasPickedCurrent = props.league.picks.find(pick => (pick.user.id === activeUser().id && pick.week === currentWeek));
  if (userHasPickedCurrent && currentWeek === props.league.revealedWeek) {
    return (null);
  }

  return (
    <>
      { props.userMustPick &&
        <p className="warning">
          The week's games have started and you haven't submitted a pick! You must pick before league details are shown.
        </p>
      }
      <h3>
        Submit your picks for week {' '}
        <select
          value={selectedWeek}
          onChange={e => setSelectedWeek(Number(e.target.value))}
          style={{ fontSize: '1em', fontWeight: 'bold', marginLeft: 4, marginRight: 4 }}
        >
          {Array.from({length: maxWeek - currentWeek + 1}, (_, i) => currentWeek + i).map(week => {
            const hasPick = userPicksData?.picksForUser?.find(pick => pick.week === week);
            return (
              <option value={week} key={week}>
                {week}{hasPick ? ' •' : ''}
              </option>
            );
          })}
        </select>
      </h3>
      <p className="resources">
        <a href="https://www.espn.com/nfl/odds" target="_blank" rel="noopener noreferrer">Odds</a>
        <a href="https://docs.google.com/document/d/1Ui9Nwc9xW597GhBqPj6KhbDCau997BFU6OVWYOcVVMc/edit?usp=sharing" target="_blank" rel="noopener noreferrer">Rules</a>
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
      <input
        type="checkbox" id="show-picked" value="ShowPicked"
        checked={showPicked} onChange={event => updateShowPicked(event.target.checked)}
        /><label htmlFor="show-picked">Show teams I've picked</label>
      <p className="form-status">
        { message }
      </p>
    </>
  )

}

export default PickSubmitForm;
