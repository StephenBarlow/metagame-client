// The big-ass table showing the entire pick history for a league.

import React, { useContext } from 'react';
import UserContext from './ActiveUserContext';
import { gql, useQuery } from '@apollo/client';
import ReactTooltip from 'react-tooltip';
import ScrollContainer from 'react-indiana-drag-scroll';
import { Histogram, BarSeries, DensitySeries, XAxis, YAxis } from '@data-ui/histogram';

const GET_SPORTS_GAMES = gql`
  query GetSportsGames($season: String) {
    sportsGames(season: $season) {
      id
      awayTeam {
        id
        shortName
      }
      homeTeam {
        id
        shortName
      }
      week
      result {
        complete
        awayTeamScore
        homeTeamScore
      }
    }
  }
`;

function PickGrid(props) {
  const activeUser = useContext(UserContext);
  const league = props.league;

  const { loading: gamesLoading, error: gamesError, data: gamesData } = useQuery(
    GET_SPORTS_GAMES,
    {
      variables: {
        season: league.season
      },
      skip: !league
    }
  );

  const getPickResults = function() {
    let results = {};

    // For each player...
    for (const player of league.users) {
      results[player.id] = {};

      // For each team...
      for (const team of props.teams) {

        // If the player has picked that team...
        const teamPick = league.picks.find(pick => (pick.team.id === team.id && pick.user.id === player.id));

        // Calculate the result of that pick
        if (teamPick) {
          results[player.id][team.id] = calculatePickResult(player.id, teamPick);
        }
      }
    }

    return results;
  };

  // These next few functions are like the only Pick-2-specific logic
  const calculatePickResult = function(playerID, firstPick) {

    let pickResult = {
      week: firstPick.week
    };

    // Find the other pick by the same
    // player from the same week
    const secondPick = league.picks.find(pick => (pick.week === firstPick.week && pick.user.id === firstPick.user.id && pick.id !== firstPick.id));

    // Get the result of both picked games
    const firstPickGame = gamesData.sportsGames.find(game => (game.week === firstPick.week && (game.awayTeam.id === firstPick.team.id || game.homeTeam.id === firstPick.team.id)));

    const secondPickGame = gamesData.sportsGames.find(game => (game.week === secondPick.week && (game.awayTeam.id === secondPick.team.id || game.homeTeam.id === secondPick.team.id)));

    // Result unknown if either game is incomplete
    if (!(firstPickGame.result.complete && secondPickGame.result.complete )) {
      pickResult.value = '?';
      pickResult.outcome = 'UNKNOWN';
      return pickResult;
    }

    // Get each game's margin of victory/loss
    const firstGameMargin = calculateGameMargin(firstPickGame, firstPick.team.id);

    const secondGameMargin = calculateGameMargin(secondPickGame, secondPick.team.id);

    if (firstGameMargin >= 0 && secondGameMargin >= 0) {

      // Double win, always points equal
      // to margin of victory
      pickResult.value = firstGameMargin;
      pickResult.outcome = 'DOUBLE_WIN';
      return pickResult;
    } else if (firstGameMargin <= 0 && secondGameMargin <= 0) {

      // Double loss, points depend on "larger" margin of loss
      pickResult.outcome = 'DOUBLE_LOSS';
      let firstGameScore;

      if (firstGameMargin < secondGameMargin) {
        // This margin is larger, so use it
        firstGameScore = -firstGameMargin;
      } else if (firstGameMargin === secondGameMargin) {
        // The two margins are equal, so always use a deterministic one
        if (firstPickGame.id < secondPickGame.id) {
          firstGameScore = -firstGameMargin;
        } else {
          firstGameScore = 0;
        }
      } else {
        // The other margin is larger, so use that one
        firstGameScore = 0;
      }

      pickResult.value = firstGameScore;

      return pickResult;
    } else {
      // Split, no points
      pickResult.value = 0;
      pickResult.outcome = 'SPLIT';
      return pickResult;
    }
  };

  const calculateGameMargin = function(game, teamID) {
    const isAwayTeam = (game.awayTeam.id === teamID);
    let pickedTeamScore, otherTeamScore;
    if (isAwayTeam) {
      pickedTeamScore = game.result.awayTeamScore;
      otherTeamScore = game.result.homeTeamScore
    } else {
      pickedTeamScore = game.result.homeTeamScore;
      otherTeamScore = game.result.awayTeamScore;
    }

    return pickedTeamScore - otherTeamScore;
  }

  const calculatePlayerScore = function(playerID) {
    let totalScore = 0;
    for (const [key, value] of Object.entries(pickResults[playerID])) {
      if (Number.isInteger(value.value)) {
        totalScore += value.value;
      }
    }
    return totalScore;
  };

  const calculatePlayerLast = function(playerID) {
    let totalScore = 0;
    for (const [key, value] of Object.entries(pickResults[playerID])) {
      if (Number.isInteger(value.value) && value.week === league.currentWeek - 1) {
        totalScore += value.value;
      }
    }
    return totalScore;
  };

  const isActiveUser = function(playerID) {
    return (playerID === activeUser().id) ? 'is-active-user' : '';
  }

  if (gamesLoading) return 'Loading...';
  if (gamesError) return `Error! ${gamesError.message}`;

  const pickResults = getPickResults();

  // Sort teams alphabetically
  let teams = props.teams.slice().sort(function(a, b) {
    if (a.shortName > b.shortName) {
      return 1;
    } else {
      return -1;
    }
  });

  const teamHeaders = teams.map((team) =>
    <th data-team-id={team.id} key={team.id} className={'team-' + team.shortName.toLowerCase()} title={team.name}>{team.shortName}</th>
  );

  const getOutcomeClass = function(result) {
    let baseClass = (result?.week === league.currentWeek) ? 'current-week ' : '';
    if (!result) {
      return 'default-cell';
    } else if (result.outcome === 'DOUBLE_WIN') {
      return baseClass + 'outcome-double-win';
    } else if (result.outcome === 'DOUBLE_LOSS') {
      return baseClass + 'outcome-double-loss';
    } else if (result.outcome === 'UNKNOWN') {
      return baseClass + 'outcome-unknown';
    } else if (result.outcome === 'SPLIT') {
      return baseClass + 'outcome-split';
    }
  }

  const getByeCell = function(playerID) {
    const byePicks = league.picks.filter(pick => (pick.user.id === playerID && pick.team.id === 'bye'));
    const byeThisWeek = byePicks.find(pick => pick.week === league.currentWeek);
    const byesRemaining = 2 - (byePicks.length / 2);

    if (byesRemaining >= 0) {
      return (
        <td className={'player-byes ' + (byeThisWeek ? 'current-week' : '') }>
          {
            [...Array(byesRemaining)].map(_ => '● ')
          }
        </td>
      )
    } else {
      return (
        <td className={'player-byes ' + (byeThisWeek ? 'current-week' : '') }>!!!</td>
      )
    }
  }

  const allScores = league.users.map((user) => calculatePlayerScore(user.id));

  // Generate the grid row for each competitor
  const sortedUsers = league.users.slice().sort((firstPlayer, secondPlayer) => {
    const firstScore = calculatePlayerScore(firstPlayer.id);
    const secondScore = calculatePlayerScore(secondPlayer.id);

    if (firstScore > secondScore) {
      return -1;
    } else if ( secondScore > firstScore) {
      return 1;
    } else {
      return 0;
    }
  });
  const playerRows = sortedUsers.map((player) => <tr key={player.id}>
    <td className={"player-name sticky " + isActiveUser(player.id)} >{player.displayName}</td>
    <td className="player-total default-cell">{calculatePlayerScore(player.id)}</td>
    <td className="player-last default-cell">{calculatePlayerLast(player.id)}</td>
    {
      teams.map((team) => <td key={team.id} className={'player-team ' + getOutcomeClass(pickResults[player.id][team.id])} data-tip={ pickResults[player.id][team.id] ? 'Week ' + pickResults[player.id][team.id].week : null}>
        {pickResults[player.id][team.id] &&
          <>
            {pickResults[player.id][team.id].value}
          </>
        }
      </td>)
    }
    {
      getByeCell(player.id)
    }
  </tr>);

  return (
    <>
      <ReactTooltip effect="solid" backgroundColor="#000000"/>
      <h3>THE GRID</h3>
      <ScrollContainer vertical="false" className="grid-wrapper" hideScrollbars="false">

          <table className="pick-grid">
            <thead>
              <tr>
                <th className="default-cell player-name sticky">Competitor</th>
                <th className="default-cell">Total</th>
                <th className="default-cell">Last</th>
                { teamHeaders }
                <th data-team-id="bye" className="player-byes">BYES</th>
              </tr>
            </thead>
            <tbody>
              { playerRows }
            </tbody>
          </table>
      </ScrollContainer>
      <h3>THE GRAPH</h3>
      <div className="histogram">
        <Histogram
          ariaLabel="Histogram of Pick 2 scores"
          height={400}
          width={600}
          orientation="vertical"
          cumulative={false}
          normalized={false}
          binCount={10}
          valueAccessor={datum => datum}
          binType="numeric"
        >
          <BarSeries
            animated
            rawData={allScores}
            strokeWidth={0}
          />
          <DensitySeries
            showArea={false}
            smoothing={0.01}
            kernel="gaussian"
            rawData={allScores}
            strokeWidth={3}
          />
          <XAxis/>
          <YAxis/>
        </Histogram>
      </div>
    </>
  );
}

export default PickGrid;
