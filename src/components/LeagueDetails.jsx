// Shows all of the details of the current league.

import React, { useContext, useEffect, useState } from 'react';
import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import PickGrid from './PickGrid';
import UserContext from './ActiveUserContext';
import PickSubmitForm from './PickSubmitForm';
import CurrentPick from './CurrentPick';
import SingleWeekPicks from './SingleWeekPicks';
import PickArchive from './PickArchive';
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
      users {
        id
        displayName(leagueID: $leagueID)
      }
    }
  }
`;

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


  // User must pick if the current week's picks
  // have been revealed and this user
  // hasn't made a pick yet.
  const userMustPick = !(leagueData.league.picks.find(pick => (pick.user.id === activeUser().id && pick.week === leagueData.league.currentWeek))) && leagueData.league.currentWeek === leagueData.league.revealedWeek;

  return (
    <>
      <h2 className="league-name">{leagueData.league.name}</h2>

      { !userMustPick &&
        <SingleWeekPicks league={leagueData.league} currentSeason={leagueData.currentSeason}/>
      }

      { (leagueData.currentSeason === leagueData.league.season) && selectedWeek !== undefined &&
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
      }

      {selectedWeek !== undefined &&
        <CurrentPick
          league={leagueData.league}
          currentSeason={leagueData.currentSeason}
          selectedWeek={selectedWeek}
          userPicks={userPicks}
        />
      }

      { !userMustPick &&
        <>
          <PickGrid league={leagueData.league} teams={leagueData.sportsTeams} />

          <PickArchive league={leagueData.league} teams={leagueData.sportsTeams} currentSeason={leagueData.currentSeason} />
        </>
      }
    </>
  );
}

export default LeagueDetails;
