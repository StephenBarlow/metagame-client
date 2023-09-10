// Shows all of the details of the current league.

import React, { useContext } from 'react';
import { gql, useQuery } from '@apollo/client';
import PickGrid from './PickGrid';
import UserContext from './ActiveUserContext';
import PickSubmitForm from './PickSubmitForm'
import CurrentPick from './CurrentPick';
import CurrentWeekPicks from './CurrentWeekPicks'
import { useParams } from 'react-router-dom';

const GET_SPORTS_TEAMS = gql`
  query GetSportsTeams {
    sportsTeams {
      id
      name
      shortName
    }
  }
`;

const GET_LEAGUE_DETAILS = gql`
  query GetLeagueDetails($leagueID: ID!) {
    currentSeason
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

  const { loading: teamsLoading, error: teamsError, data: teamsData } = useQuery(GET_SPORTS_TEAMS);
  const { loading: leagueLoading, error: leagueError, data: leagueData } = useQuery(GET_LEAGUE_DETAILS, {
    variables: {
      'leagueID': leagueID
    }
  });

  const userConfig = JSON.parse(localStorage.getItem('userConfig'));

  if (teamsLoading || leagueLoading) return 'Loading...';
  if (teamsError) return `Error! ${teamsError.message}`;
  if (leagueError) return `Error! ${leagueError.message}`;

  // User must pick if the current week's picks
  // have been revealed and this user
  // hasn't made a pick yet.
  const userMustPick = !(leagueData.league.picks.find(pick => (pick.user.id === activeUser().id && pick.week === leagueData.league.currentWeek))) && leagueData.league.currentWeek === leagueData.league.revealedWeek;

  return (
    <>
      <h2>{leagueData.league.name}</h2>

      { !userMustPick &&
        <CurrentWeekPicks league={leagueData.league}/>
      }

      { (leagueData.currentSeason === leagueData.league.season) &&
        <PickSubmitForm league={leagueData.league} teams={teamsData.sportsTeams} userMustPick={userMustPick} config={userConfig} />
      }

      <CurrentPick league={leagueData.league} currentSeason={leagueData.currentSeason} />

      { !userMustPick &&
        <PickGrid league={leagueData.league} teams={teamsData.sportsTeams} />
      }
    </>
  );
}

export default LeagueDetails;
