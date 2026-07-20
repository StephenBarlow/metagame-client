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
  const [selectedWeek, setSelectedWeek] = useState(undefined);
  // Set default selectedWeek to currentWeek after data loads
  useEffect(() => {
    if (selectedWeek === undefined && leagueData?.league?.currentWeek) {
      setSelectedWeek(leagueData.league.currentWeek);
    }
  }, [selectedWeek, leagueData]);

  const userConfig = JSON.parse(localStorage.getItem('userConfig'));

  if (leagueLoading) {
    return (
      <span className="loading-footballs" role="status" aria-label="Loading">
        <span className="loading-football" aria-hidden="true">🏈</span>
        <span className="loading-football" aria-hidden="true">🏈</span>
      </span>
    );
  }
  if (leagueError) return `Error! ${leagueError.message}`;


  // User must pick if the current week's picks
  // have been revealed and this user
  // hasn't made a pick yet.
  const userMustPick = !(leagueData.league.picks.find(pick => (pick.user.id === activeUser().id && pick.week === leagueData.league.currentWeek))) && leagueData.league.currentWeek === leagueData.league.revealedWeek;

  return (
    <>
      <h2>{leagueData.league.name}</h2>

      { !userMustPick &&
        <SingleWeekPicks league={leagueData.league} currentSeason={leagueData.currentSeason}/>
      }

      { (leagueData.currentSeason === leagueData.league.season) && selectedWeek !== undefined &&
        <PickSubmitForm
          league={leagueData.league}
          teams={leagueData.sportsTeams}
          userPicks={leagueData.picksForUser}
          userMustPick={userMustPick}
          config={userConfig}
          selectedWeek={selectedWeek}
          setSelectedWeek={setSelectedWeek}
        />
      }

      {selectedWeek !== undefined &&
        <CurrentPick
          league={leagueData.league}
          currentSeason={leagueData.currentSeason}
          selectedWeek={selectedWeek}
          userPicks={leagueData.picksForUser}
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
