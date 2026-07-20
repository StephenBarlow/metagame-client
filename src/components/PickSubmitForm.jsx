import React, { useEffect, useRef, useState, useContext } from 'react';
import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import UserContext from './ActiveUserContext';

const SUBMIT_PICKS = gql`
mutation SubmitPicks($request: SubmitPickRequest!) {
  submitPick(request: $request) {
    pick {
      id
      week
      team {
        id
        name
        shortName
      }
    }
    errors {
      code
      message
    }
  }
}
`;

const logoFilenameForTeam = (teamName) => `${teamName.toLowerCase().replaceAll(' ', '-')}.png`;

function TeamPicker({ id, value, onChange, teams, placeholder, openPicker, setOpenPicker }) {
  const isOpen = openPicker === id;
  const options = [
    { value: '', name: '' },
    { value: '-1', name: 'BYE' },
    ...teams.map((team) => ({
      ...team,
      value: team.id,
    })),
  ];
  const selectedOption = options.find((option) => option.value === value);
  const selectedTeamClass = selectedOption?.shortName
    ? `team-${selectedOption.shortName.toLowerCase()}`
    : '';

  const selectOption = (option) => {
    if (option.disabled) return;
    onChange(option.value);
    setOpenPicker(null);
  };

  return (
    <>
      <div className="team-picker-custom">
        <button
          type="button"
          className="team-picker-button"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-label={id}
          onClick={() => setOpenPicker(isOpen ? null : id)}
          >
          {(selectedOption?.shortName || selectedOption?.value === '-1') &&
            <span className={`team-picker-logo-frame ${selectedTeamClass}`}>
              {selectedOption.value === '-1'
                ? <span className="team-picker-bye-logo" aria-hidden="true">💤</span>
                : <img src={`/logos/${logoFilenameForTeam(selectedOption.name)}`} alt="" aria-hidden="true" />}
            </span>
          }
          <span className={!selectedOption?.name ? 'team-picker-placeholder' : ''}>{selectedOption?.name || placeholder}</span>
        </button>
        {isOpen &&
          <div className="team-picker-menu" role="listbox">
            {options.map((option) => (
              <button
                type="button"
                role="option"
                aria-selected={option.value === value}
                className="team-picker-option"
                key={option.value || 'blank'}
                disabled={option.disabled}
                onClick={() => selectOption(option)}
              >
                {option.name &&
                  <span className={`team-picker-logo-frame${option.shortName ? ` team-${option.shortName.toLowerCase()}` : ''}`}>
                    {option.value === '-1'
                      ? <span className="team-picker-bye-logo" aria-hidden="true">💤</span>
                      : <img src={`/logos/${logoFilenameForTeam(option.name)}`} alt="" aria-hidden="true" />}
                  </span>
                }
                <span>{option.name || placeholder}</span>
              </button>
            ))}
          </div>
        }
      </div>
      <select
        className="team-picker team-picker-native"
        name={id}
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value=""></option>
        <option value="-1">BYE</option>
        {teams.map((team) => (
          <option value={team.id} key={team.id} disabled={team.disabled}>{team.name}</option>
        ))}
      </select>
    </>
  );
}

function PickSubmitForm(props) {
  const activeUser = useContext(UserContext);
  const [firstTeam, setFirstTeam] = useState('');
  const [secondTeam, setSecondTeam] = useState('');
  const [openPicker, setOpenPicker] = useState(null);
  const teamPickerGroupRef = useRef(null);
  const [message, setMessage] = useState('\xa0');
  const [showPicked, setShowPicked] = useState(props.config?.showPicked);
  const currentWeek = props.league.currentWeek;
  const maxWeek = 18;
  // selectedWeek and setSelectedWeek are now props
  const { selectedWeek, setSelectedWeek } = props;

  useEffect(() => {
    if (!openPicker) return undefined;

    const closeOnOutsideClick = (event) => {
      if (!teamPickerGroupRef.current?.contains(event.target)) {
        setOpenPicker(null);
      }
    };

    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, [openPicker]);

  const updateShowPicked = function(sp) {
    setShowPicked(sp);
    let userConfig = (props.config ? { ...props.config } : {});
    userConfig.showPicked = sp;
    localStorage.setItem('userConfig', JSON.stringify(userConfig));
  }

  const formSubmit = function(event, submitPicks, teams) {
    event.preventDefault();
    setMessage('\xa0');
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

  const optimisticTeams = [firstTeam, secondTeam].map((teamID) =>
    teamID === '-1'
      ? { id: '-1', name: 'BYE', shortName: 'BYE' }
      : props.teams.find((team) => team.id === teamID)
  );

  const [submitPicks] = useMutation (
    SUBMIT_PICKS,
    {
      optimisticResponse: {
        submitPick: {
          __typename: 'SubmitPickResponse',
          pick: optimisticTeams.map((team, index) => ({
            __typename: 'Pick',
            id: `optimistic-${selectedWeek}-${team?.id}-${index}`,
            week: selectedWeek,
            team: {
              __typename: 'SportsTeam',
              ...team,
            },
          })),
          errors: [],
        },
      },
      update: (cache, { data }) => {
        const picks = data?.submitPick?.pick || [];
        if (!picks.length) return;

        cache.modify({
          id: 'ROOT_QUERY',
          fields: {
            picksForUser(existingPicks = [], { args, readField, toReference }) {
              if (String(args?.leagueID) !== String(props.league.id) ||
                  String(args?.userID) !== String(activeUser().id)) {
                return existingPicks;
              }

              const updatedPicks = existingPicks.filter((pickReference) => {
                const teamReference = readField('team', pickReference);
                return !picks.some((pick) =>
                  readField('week', pickReference) === pick.week &&
                  readField('id', teamReference) === pick.team.id
                );
              });

              return [
                ...updatedPicks,
                ...picks.map((pick) => toReference(pick, true)),
              ];
            },
          },
        });
      },
      onCompleted: ({submitPick}) => {
        if (submitPick?.errors?.length) {
          setMessage(`Error: ${submitPick.errors[0].message}`);
          return;
        }
        setMessage('Picks submitted successfully!');
        props.onPicksSubmitted(submitPick.pick || []);
      },
      onError: (error) => {
        setMessage(`Error: ${error.message}`);
      },
    }
  );

  // Checks if the active user has already
  // picked a particular team
  const alreadyPicked = function(teamID) {
    // Check if the user has picked this team in any week except the selected week
    return !!props.userPicks.find(pick => pick.team.id === teamID && pick.week !== selectedWeek);
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

  teams = teams.map((team) => ({
    ...team,
    disabled: alreadyPicked(team.id),
  }));

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
          onChange={e => {
            setFirstTeam('');
            setSecondTeam('');
            setOpenPicker(null);
            setSelectedWeek(Number(e.target.value));
          }}
          style={{ fontSize: '1em', fontWeight: 'bold', marginLeft: 4, marginRight: 4 }}
        >
          {Array.from({length: maxWeek - currentWeek + 1}, (_, i) => currentWeek + i).map(week => {
            const hasPick = props.userPicks.find(pick => pick.week === week);
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
        <div className="team-picker-group" ref={teamPickerGroupRef}>
          <TeamPicker id="first-team-picker" value={firstTeam} onChange={setFirstTeam} teams={teams} placeholder="Select your first team" openPicker={openPicker} setOpenPicker={setOpenPicker} />
          <TeamPicker id="second-team-picker" value={secondTeam} onChange={setSecondTeam} teams={teams} placeholder="Select your second team" openPicker={openPicker} setOpenPicker={setOpenPicker} />
        </div>
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
