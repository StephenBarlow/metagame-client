// Shows all of the details of the current league.

import React, { useContext, useEffect, useRef, useState } from 'react';
import { gql } from '@apollo/client';
import { useMutation, useQuery } from '@apollo/client/react';
import PickGrid from './PickGrid';
import UserContext from './ActiveUserContext';
import PickSubmitForm from './PickSubmitForm';
import CurrentPick from './CurrentPick';
import SingleWeekPicks from './SingleWeekPicks';
import PickArchive from './PickArchive';
import { TeamPicker } from './PickSubmitForm';
import AchievementsTable from './AchievementsTable';
import LatestAchievementsTable from './LatestAchievementsTable';
import LeagueMessages from './LeagueMessages';
import { useParams } from 'react-router';

const GET_LEAGUE_DETAILS = gql`
  query GetLeagueDetails($leagueID: ID!, $userID: ID!) {
    currentSeason
    sportsTeams {
      id
      name
      shortName
    }
    picksForUser(leagueID: $leagueID, userID: $userID) {
      id
      week
      team {
        id
        name
        shortName
      }
    }
    league(leagueID: $leagueID) {
      id
      name
      season
      currentWeek
      revealedWeek
      picks {
        id
        user {
          id
        }
        team {
          id
          name
          shortName
        }
        week
      }
      achievementAwards {
        id
        week
        awardedAt
        user {
          id
          displayName(leagueID: $leagueID)
        }
        achievement {
          id
          key
          name
          description
          iconId
        }
      }
      messages {
        id
        week
        createdAt
        author {
          id
          displayName(leagueID: $leagueID)
        }
        template {
          id
          key
          format
          slots {
            id
            key
            position
            prompt
            valueTypes
          }
        }
        selections {
          slot {
            id
            key
            position
          }
          value {
            __typename
            ... on MessageValue {
              id
              key
              text
              kind
            }
            ... on SportsTeam {
              id
              name
              shortName
            }
            ... on User {
              id
              displayName(leagueID: $leagueID)
            }
          }
        }
      }
      users {
        id
        limited
        displayName(leagueID: $leagueID)
        favoriteTeam(leagueID: $leagueID) {
          id
          name
          shortName
        }
      }
      messageEligibleUsers {
        id
        displayName(leagueID: $leagueID)
      }
    }
  }
`;

const SET_FAVORITE_TEAM = gql`
  mutation SetFavoriteTeam($request: SetFavoriteTeamRequest!) {
    setFavoriteTeam(request: $request) {
      favoriteTeam {
        id
        name
        shortName
      }
      errors {
        code
        message
      }
    }
  }
`;

function FavoriteTeamForm({ league, teams, userID }) {
  const [teamID, setTeamID] = useState('');
  const [openPicker, setOpenPicker] = useState(null);
  const [message, setMessage] = useState('');
  const formRef = useRef(null);
  const sortedTeams = teams.slice().sort((firstTeam, secondTeam) =>
    firstTeam.name.localeCompare(secondTeam.name)
  );
  const [setFavoriteTeam, { loading }] = useMutation(SET_FAVORITE_TEAM, {
    refetchQueries: [{
      query: GET_LEAGUE_DETAILS,
      variables: { leagueID: league.id, userID },
    }],
    onCompleted: ({ setFavoriteTeam: result }) => {
      if (result?.errors?.length) {
        setMessage(`Error: ${result.errors[0].message}`);
      }
    },
    onError: (error) => setMessage(`Error: ${error.message}`),
  });

  const submit = (event) => {
    event.preventDefault();
    setMessage('');
    setFavoriteTeam({
      variables: {
        request: { userID, leagueID: league.id, teamID },
      },
    });
  };

  useEffect(() => {
    if (!openPicker) return undefined;

    const closeOnOutsideClick = (event) => {
      if (!formRef.current?.contains(event.target)) {
        setOpenPicker(null);
      }
    };

    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, [openPicker]);

  return (
    <section className="favorite-team-form" ref={formRef}>
      <p>Welcome to <strong>{league.name}!</strong></p>
      <p>First, which NFL team do you <em>personally</em> root for? (This won&apos;t affect standings at all. If you don&apos;t follow the NFL, feel free to pick anything.)</p>
      <form onSubmit={submit}>
        <TeamPicker
          id="favorite-team"
          value={teamID}
          onChange={setTeamID}
          teams={sortedTeams}
          placeholder="Choose a team"
          openPicker={openPicker}
          setOpenPicker={setOpenPicker}
          includeBye={false}
          ariaLabel="Favorite team"
        />
        <input
          className="pick-submit"
          type="submit"
          value={loading ? 'Saving…' : 'Save favorite team'}
          disabled={!teamID || loading}
        />
      </form>
      {message && <p className="form-status">{message}</p>}
    </section>
  );
}

function LeagueDetails() {
  const { id: leagueID } = useParams();
  const activeUser = useContext(UserContext);

  const { loading: leagueLoading, error: leagueError, data: leagueData } = useQuery(GET_LEAGUE_DETAILS, {
    variables: {
      leagueID,
      userID: activeUser().id,
    }
  });
  const [submittedPicks, setSubmittedPicks] = useState([]);
  const [selectedWeek, setSelectedWeek] = useState(undefined);

  const onPicksSubmitted = (picks) => {
    setSubmittedPicks((currentPicks) => [
      ...currentPicks.filter((currentPick) => !picks.some((pick) => pick.week === currentPick.week)),
      ...picks,
    ]);
  };
  // Set default selectedWeek to currentWeek after data loads
  useEffect(() => {
    if (selectedWeek === undefined && leagueData?.league?.currentWeek) {
      setSelectedWeek(leagueData.league.currentWeek);
    }
  }, [selectedWeek, leagueData]);

  const userConfig = JSON.parse(localStorage.getItem('userConfig'));

  if (leagueLoading && !leagueData) {
    return (
      <span className="loading-footballs" role="status" aria-label="Loading">
        <span className="loading-football" aria-hidden="true">🏈</span>
        <span className="loading-football" aria-hidden="true">🏈</span>
      </span>
    );
  }
  if (leagueError && !leagueData) return `Error! ${leagueError.message}`;

  const submittedWeeks = new Set(submittedPicks.map((pick) => pick.week));
  const userPicks = [
    ...(leagueData.picksForUser || []).filter((pick) => !submittedWeeks.has(pick.week)),
    ...submittedPicks,
  ];
  const currentLeagueUser = leagueData.league.users.find((user) => String(user.id) === String(activeUser().id));
  const needsFavoriteTeam = leagueData.currentSeason === leagueData.league.season &&
    currentLeagueUser && !currentLeagueUser.favoriteTeam;
  const currentWeekPicksVisible = leagueData.league.currentWeek <= leagueData.league.revealedWeek ||
    leagueData.league.season < leagueData.currentSeason;
  const pickFormVisible = leagueData.currentSeason === leagueData.league.season && selectedWeek !== undefined;


  // User must pick if the current week's picks
  // have been revealed and this user
  // hasn't made a pick yet.
  const userMustPick = !(leagueData.league.picks.find(pick => (pick.user.id === activeUser().id && pick.week === leagueData.league.currentWeek))) && leagueData.league.currentWeek === leagueData.league.revealedWeek;

  return (
    <>
      <h2 className="league-name">{leagueData.league.name}</h2>

      {needsFavoriteTeam &&
        <FavoriteTeamForm
          league={leagueData.league}
          teams={leagueData.sportsTeams}
          userID={activeUser().id}
        />
      }

      { !needsFavoriteTeam && currentWeekPicksVisible &&
        <div className="league-current-week-layout">
          <SingleWeekPicks league={leagueData.league} currentSeason={leagueData.currentSeason}/>
          <LatestAchievementsTable league={leagueData.league} />
        </div>
      }

      { !needsFavoriteTeam && pickFormVisible &&
        <div className={currentWeekPicksVisible ? undefined : 'league-current-week-layout'}>
          <PickSubmitForm
            league={leagueData.league}
            teams={leagueData.sportsTeams}
            userPicks={userPicks}
            userMustPick={userMustPick}
            config={userConfig}
            selectedWeek={selectedWeek}
            setSelectedWeek={setSelectedWeek}
            onPicksSubmitted={onPicksSubmitted}
          />
          {!currentWeekPicksVisible && <LatestAchievementsTable league={leagueData.league} />}
        </div>
      }

      { !needsFavoriteTeam && selectedWeek !== undefined &&
        <CurrentPick
          league={leagueData.league}
          currentSeason={leagueData.currentSeason}
          selectedWeek={selectedWeek}
          userPicks={userPicks}
        />
      }

      {!needsFavoriteTeam &&
        <LeagueMessages
          league={leagueData.league}
          teams={leagueData.sportsTeams}
          userID={activeUser().id}
          currentSeason={leagueData.currentSeason}
          currentUserLimited={currentLeagueUser?.limited}
        />
      }

      { !needsFavoriteTeam && !userMustPick &&
        <>
          <PickGrid league={leagueData.league} teams={leagueData.sportsTeams} />

          <AchievementsTable league={leagueData.league} />

          <PickArchive league={leagueData.league} teams={leagueData.sportsTeams} currentSeason={leagueData.currentSeason} />
        </>
      }
    </>
  );
}

export default LeagueDetails;
