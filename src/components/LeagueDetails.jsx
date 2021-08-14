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
    league(leagueID: $leagueID) {
      id
      name
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

  if (teamsLoading || leagueLoading) return 'Loading...';
  if (teamsError) return `Error! ${teamsError.message}`;
  if (leagueError) return `Error! ${leagueError.message}`;

  let teams = []

  if (teamsData.sportsTeams) {
    teams = teamsData.sportsTeams.map((team) => <li key={team.id}>{team.name}</li>);
  }

  return (
    <>
      <h2>{leagueData.league.name}</h2>

      { leagueData.league.currentWeek === leagueData.league.revealedWeek && 
        <CurrentWeekPicks league={leagueData.league}/>
      }
      <h3>The Grid</h3>
      <PickGrid leagueID={leagueID} teams={teamsData.sportsTeams} />
      <PickSubmitForm league={leagueData.league} teams={teamsData.sportsTeams} />
      <CurrentPick league={leagueData.league} />
    </>
  );
}

export default LeagueDetails;
