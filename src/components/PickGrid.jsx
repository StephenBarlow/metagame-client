// The big-ass table showing the entire pick history for a league.

import React, { useContext, useMemo, useState } from 'react';
import UserContext from './ActiveUserContext';
import { useQuery } from '@apollo/client/react';
import { Tooltip } from 'react-tooltip';
import ScrollContainer from 'react-indiana-drag-scroll';
import ScoreHistogram from './ScoreHistogram';
import { GET_SPORTS_GAMES } from './SharedQueries';

function PickGrid(props) {
  const activeUser = useContext(UserContext);
  const [sortMethod, setSortMethod] = useState('total');
  const [showTeamLogos, setShowTeamLogos] = useState(() => {
    const userConfig = JSON.parse(localStorage.getItem('userConfig'));
    return userConfig?.showTeamLogos ?? false;
  });
  const league = props.league;

  const updateShowTeamLogos = (showLogos) => {
    setShowTeamLogos(showLogos);
    const userConfig = JSON.parse(localStorage.getItem('userConfig')) || {};
    localStorage.setItem('userConfig', JSON.stringify({
      ...userConfig,
      showTeamLogos: showLogos,
    }));
  };

  const { loading: gamesLoading, error: gamesError, data: gamesData } = useQuery(
    GET_SPORTS_GAMES,
    {
      variables: {
        season: league.season
      },
      skip: !league
    }
  );

  const { pickResults, playerScores, playerLastScores, byePicksByPlayer } = useMemo(() => {
    if (!gamesData) {
      return {
        pickResults: {},
        playerScores: new Map(),
        playerLastScores: new Map(),
        byePicksByPlayer: new Map(),
      };
    }

    const gamesByWeekAndTeam = new Map();
    for (const game of gamesData.sportsGames) {
      gamesByWeekAndTeam.set(`${game.week}:${game.awayTeam.id}`, game);
      gamesByWeekAndTeam.set(`${game.week}:${game.homeTeam.id}`, game);
    }

    const picksByPlayerAndTeam = new Map();
    const picksByPlayerAndWeek = new Map();
    const byePicks = new Map();
    for (const pick of league.picks) {
      picksByPlayerAndTeam.set(`${pick.user.id}:${pick.team.id}`, pick);

      const playerWeekKey = `${pick.user.id}:${pick.week}`;
      const weekPicks = picksByPlayerAndWeek.get(playerWeekKey) || [];
      weekPicks.push(pick);
      picksByPlayerAndWeek.set(playerWeekKey, weekPicks);

      if (pick.team.id === 'bye') {
        const playerByePicks = byePicks.get(pick.user.id) || [];
        playerByePicks.push(pick);
        byePicks.set(pick.user.id, playerByePicks);
      }
    }

    const getGameMargin = (game, teamID) => {
      const isAwayTeam = game.awayTeam.id === teamID;
      const pickedTeamScore = isAwayTeam ? game.result.awayTeamScore : game.result.homeTeamScore;
      const otherTeamScore = isAwayTeam ? game.result.homeTeamScore : game.result.awayTeamScore;
      return pickedTeamScore - otherTeamScore;
    };

    const results = {};
    const scores = new Map();
    const lastScores = new Map();
    const weekToCheck = league.currentWeek === league.revealedWeek ? league.currentWeek : league.currentWeek - 1;

    for (const player of league.users) {
      const playerResults = {};
      let totalScore = 0;
      let lastScore = 0;

      for (const team of props.teams) {
        const firstPick = picksByPlayerAndTeam.get(`${player.id}:${team.id}`);
        if (!firstPick) continue;

        const sameWeekPicks = picksByPlayerAndWeek.get(`${player.id}:${firstPick.week}`) || [];
        const secondPick = sameWeekPicks.find(pick => pick.id !== firstPick.id);
        const pickResult = {
          week: firstPick.week,
          otherTeam: secondPick?.team.shortName,
        };
        const firstPickGame = gamesByWeekAndTeam.get(`${firstPick.week}:${firstPick.team.id}`);
        const secondPickGame = secondPick && gamesByWeekAndTeam.get(`${secondPick.week}:${secondPick.team.id}`);

        if (!(firstPickGame?.result.complete && secondPickGame?.result.complete)) {
          pickResult.value = '?';
          pickResult.outcome = 'UNKNOWN';
        } else {
          const firstGameMargin = getGameMargin(firstPickGame, firstPick.team.id);
          const secondGameMargin = getGameMargin(secondPickGame, secondPick.team.id);

          if (firstGameMargin >= 0 && secondGameMargin >= 0) {
            pickResult.value = firstGameMargin;
            pickResult.outcome = 'DOUBLE_WIN';
          } else if (firstGameMargin <= 0 && secondGameMargin <= 0) {
            pickResult.outcome = 'DOUBLE_LOSS';
            if (firstGameMargin < secondGameMargin) {
              pickResult.value = -firstGameMargin;
            } else if (firstGameMargin === secondGameMargin) {
              pickResult.value = firstPickGame.id < secondPickGame.id ? -firstGameMargin : 0;
            } else {
              pickResult.value = 0;
            }
          } else {
            pickResult.value = 0;
            pickResult.outcome = 'SPLIT';
          }
        }

        playerResults[team.id] = pickResult;
        if (Number.isInteger(pickResult.value)) totalScore += pickResult.value;
        if (pickResult.week === weekToCheck) {
          if (pickResult.value === '?') {
            lastScore = '?';
          } else if (lastScore !== '?' && Number.isInteger(pickResult.value)) {
            lastScore += pickResult.value;
          }
        }
      }

      results[player.id] = playerResults;
      scores.set(player.id, totalScore);
      lastScores.set(player.id, lastScore);
    }

    return {
      pickResults: results,
      playerScores: scores,
      playerLastScores: lastScores,
      byePicksByPlayer: byePicks,
    };
  }, [gamesData, league, props.teams]);

  const isActiveUser = function(playerID) {
    return (playerID === activeUser().id) ? 'is-active-user' : '';
  }

  if (gamesLoading) return 'Loading...';
  if (gamesError) return `Error! ${gamesError.message}`;

  // Sort teams alphabetically
  let teams = props.teams.slice().sort(function(a, b) {
    if (a.shortName > b.shortName) {
      return 1;
    } else {
      return -1;
    }
  });

  const teamHeaders = teams.map((team) => {
    const headerClassName = `team-${team.shortName.toLowerCase()}${showTeamLogos ? ' team-logo-header' : ''}`;
    const logoFilename = `${team.name.toLowerCase().replaceAll(' ', '-')}.png`;

    return (
      <th data-team-id={team.id} key={team.id} className={headerClassName} title={team.name}>
        {showTeamLogos
          ? <img src={`/logos/${logoFilename}`} alt={`${team.name} logo`} draggable={false} />
          : team.shortName
        }
      </th>
    );
  });

  const hidePlayer = function(player) {
    return (sortMethod === 'me' && !isActiveUser(player.id));
  }

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
    const byePicks = byePicksByPlayer.get(playerID) || [];
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

  const allScores = league.users.map((user) => playerScores.get(user.id));

  // Generate the grid row for each competitor
  const sortedUsers = league.users.slice().sort((firstPlayer, secondPlayer) => {
    let firstScore, secondScore;

    if (sortMethod === 'total') {
      firstScore = playerScores.get(firstPlayer.id);
      secondScore = playerScores.get(secondPlayer.id);
    } else if (sortMethod === 'last') {
      firstScore = playerLastScores.get(firstPlayer.id);
      secondScore = playerLastScores.get(secondPlayer.id);
    } else {
      return 0;
    }

    if (firstScore === '?') {
      firstScore = 0;
    }
    if (secondScore === '?') {
      secondScore = 0;
    }

    if (firstScore > secondScore) {
      return -1;
    } else if ( secondScore > firstScore) {
      return 1;
    } else {
      return 0;
    }
  });

  const playerRows = sortedUsers.map((player) => <tr key={player.id} className={(hidePlayer(player) ? 'hidden' : '')}>
    <td
      className={"player-name sticky " + isActiveUser(player.id)}
      data-tooltip-id={player.id === activeUser().id ? 'active-user-tooltip' : undefined}
      data-tooltip-content={player.id === activeUser().id ? "That's you!" : undefined}
    >
      {player.displayName}
    </td>
    <td className="player-total default-cell">{playerScores.get(player.id)}</td>
    <td className="player-last default-cell">+{playerLastScores.get(player.id)}</td>
    {
      teams.map((team) => <td key={team.id} className={'player-team ' + getOutcomeClass(pickResults[player.id][team.id])} data-tooltip-id="pick-grid-tooltip" data-tooltip-content={ pickResults[player.id][team.id] ? `Week ${pickResults[player.id][team.id].week}\n+ ${pickResults[player.id][team.id].otherTeam}` : null}>
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
      <Tooltip
        id="pick-grid-tooltip"
        classNameArrow="hidden"
        style={{ backgroundColor: '#000000', textAlign: 'center' }}
        render={({ content }) => {
          if (!content) return null;

          const [week, pairing] = content.split('\n');
          return (
            <>
              <strong>{week}</strong>
              <br />
              {pairing}
            </>
          );
        }}
      />
      <Tooltip id="active-user-tooltip" classNameArrow="hidden" style={{ backgroundColor: '#000000', zIndex: 10 }} />
      <h3>THE GRID</h3>
      <label style={{paddingLeft: '4px'}}>Sort by: </label>
      <select
          className="sort-picker" name="sort-picker" id="sort-picker"
          onChange={event => setSortMethod(event.target.value)}
        >
          <option value="total" key="total">Total score</option>
          <option value="last" key="last">Week {league.revealedWeek} score</option>
          <option value="me" key="me">Just me</option>
        </select>
      <label className="team-logo-toggle">
        <input
          type="checkbox"
          checked={showTeamLogos}
          onChange={(event) => updateShowTeamLogos(event.target.checked)}
        />
        Team logos
      </label>
      <ScrollContainer vertical="false" className="grid-wrapper" hideScrollbars="false">

          <table className={`pick-grid${showTeamLogos ? ' logo-headers' : ''}`}>
            <thead>
              <tr>
                <th className="default-cell player-name sticky">Competitor</th>
                <th className="default-cell">Total</th>
                <th className="default-cell">Wk&nbsp;{(league.currentWeek === league.revealedWeek ? league.currentWeek : league.currentWeek - 1)}</th>
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
        <ScoreHistogram
          scores={allScores}
          playerScores={league.users.map((user) => ({
            name: user.displayName,
            score: playerScores.get(user.id),
          }))}
        />
      </div>
    </>
  );
}

export default PickGrid;
