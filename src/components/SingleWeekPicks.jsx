// Table that shows all picks for the current
// week after they're revealed.

import React, { useContext, useState } from 'react';
import UserContext from './ActiveUserContext';
import { useQuery } from '@apollo/client/react';
import { Tooltip } from 'react-tooltip';
import { GET_SPORTS_GAMES } from './SharedQueries';

const TeamOutcome = ({weekToShow, league, team, side, rowSpan, hoveredTeam, setHoveredTeam}) => {
  const { loading: gamesLoading, error: gamesError, data: gamesData } = useQuery(
    GET_SPORTS_GAMES,
    {
      variables: {
        season: league.season
      },
      skip: !league
    }
  );

  const teamHighlightClass = hoveredTeam === team ? ' team-highlighted' : '';
  const handleMouseEnter = () => setHoveredTeam(team);

  if (team === 'BYE') {
    return (
      <td colSpan={2} rowSpan={rowSpan} className={`team-bye${teamHighlightClass}`} onMouseEnter={handleMouseEnter}>BYE</td>
    );
  }

  if (gamesLoading || gamesError) {
    return (
      <td rowSpan={rowSpan} className={`team-${team.toLowerCase()} gameresult-unknown${teamHighlightClass}`} onMouseEnter={handleMouseEnter}>{team}</td>
    );
  }

  const teamGame = gamesData.sportsGames.find(game => (game.week === weekToShow && (game.awayTeam.shortName === team || game.homeTeam.shortName === team)));

  let gameResult;
  let pickedTeamScore;
  let otherTeamScore;

  if (teamGame.result.awayTeamScore === null || teamGame.result.homeTeamScore === null) {
    gameResult = 'unknown';
  } else {
    const isAwayTeam = (teamGame.awayTeam.shortName === team);
    if (isAwayTeam) {
      pickedTeamScore = teamGame.result.awayTeamScore;
      otherTeamScore = teamGame.result.homeTeamScore
    } else {
      pickedTeamScore = teamGame.result.homeTeamScore;
      otherTeamScore = teamGame.result.awayTeamScore;
    }


    if (pickedTeamScore > otherTeamScore) {
      gameResult = 'win';
    } else if (pickedTeamScore < otherTeamScore) {
      gameResult = 'loss';
    } else {
      gameResult = 'tie';
    }
  }

  const gameResultTooltip = gameResult === 'unknown'
    ? null
    : gameResult === 'tie'
      ? 'Tied'
      : `${gameResult === 'win' ? 'Won' : 'Lost'} by ${Math.abs(pickedTeamScore - otherTeamScore)}`;

  return (
      <td
        rowSpan={rowSpan}
        className={`team-${team.toLowerCase()} gameresult gameresult-${gameResult} gameresult-${side}${teamHighlightClass}`}
        onMouseEnter={handleMouseEnter}
        data-tooltip-id="single-week-game-result-tooltip"
        data-tooltip-content={gameResultTooltip}
      >
        {team}
      </td>
    );
}

const PickOutcome = ({weekToShow, ...props}) => {
  const { loading: gamesLoading, error: gamesError, data: gamesData } = useQuery(
    GET_SPORTS_GAMES,
    {
      variables: {
        season: props.league.season
      },
      skip: !props.league
    }
  );

  const getPickResult = function(league, firstTeam, secondTeam) {


    let pickResult = {
      week: weekToShow,
    };

    // If player picked BYE, no points
    if (firstTeam === 'BYE') {
      pickResult.value = '–';
      pickResult.outcome = 'UNKNOWN';
      return pickResult;
    }

    // Get the result of both picked games
    const firstPickGame = gamesData.sportsGames.find(game => (game.week === weekToShow && (game.awayTeam.shortName === firstTeam || game.homeTeam.shortName === firstTeam)));

    const secondPickGame = gamesData.sportsGames.find(game => (game.week === weekToShow && (game.awayTeam.shortName === secondTeam || game.homeTeam.shortName === secondTeam)));

    // Result unknown if either game is incomplete
    if (!(firstPickGame.result.complete && secondPickGame.result.complete )) {
      pickResult.value = '?';
      pickResult.outcome = 'UNKNOWN';
      return pickResult;
    }

    // Get each game's margin of victory/loss
    const firstGameMargin = getGameMargin(firstPickGame, firstTeam);

    const secondGameMargin = getGameMargin(secondPickGame, secondTeam);

    if (firstGameMargin >= 0 && secondGameMargin >= 0) {

      // Double win, always points equal
      // to margin of victory
      pickResult.value = firstGameMargin + secondGameMargin;
      pickResult.outcome = 'DOUBLE_WIN';
      return pickResult;
    } else if (firstGameMargin <= 0 && secondGameMargin <= 0) {

      // Double loss, points depend on "larger" margin of loss

      pickResult.outcome = 'DOUBLE_LOSS';
      if (firstGameMargin < secondGameMargin) {
        pickResult.value = -firstGameMargin;
      } else {
        pickResult.value = -secondGameMargin;
      }

      return pickResult;
    } else {
      // Split, no points
      pickResult.value = '❌';
      pickResult.outcome = 'SPLIT';
      return pickResult;
    }
  };

  const getResultClass = function(result) {
    if (!result) {
      return 'default-cell';
    } else if (result.outcome === 'DOUBLE_WIN') {
      return 'outcome-double-win';
    } else if (result.outcome === 'DOUBLE_LOSS') {
      return 'outcome-double-loss';
    } else if (result.outcome === 'UNKNOWN') {
      return 'outcome-unknown';
    } else if (result.outcome === 'SPLIT') {
      return 'outcome-split';
    }
  };

  const getGameMargin = function(game, teamName) {
    const isAwayTeam = (game.awayTeam.shortName === teamName);
    let pickedTeamScore, otherTeamScore;
    if (isAwayTeam) {
      pickedTeamScore = game.result.awayTeamScore;
      otherTeamScore = game.result.homeTeamScore
    } else {
      pickedTeamScore = game.result.homeTeamScore;
      otherTeamScore = game.result.awayTeamScore;
    }

    return pickedTeamScore - otherTeamScore;
  };

  if (gamesLoading) {
    return (
      <td className="pickoutcome">
        ...
      </td>
    );
  }

  if (gamesError) {
    return (
      <td className="pickoutcome">
        ?
      </td>
    );
  }

  const pickResult = getPickResult(props.league, props.team1, props.team2);

  return (
    <td className={`${getResultClass(pickResult)}`}>
      {
        typeof pickResult.value === 'number' ? `+${pickResult.value}` : pickResult.value
      }
    </td>
  );
}

const clonePlayerPicks = (playerPicks) => playerPicks.map((playerPick) => ({
  player: playerPick.player,
  picks: [...playerPick.picks],
}));

const comparePlayerPicks = (playerOne, playerTwo, pickFrequencies) => {
  // Put the most frequent team picks on top for left column.
  if (pickFrequencies[playerOne.picks[0]] > pickFrequencies[playerTwo.picks[0]]) {
    return -1;
  } else if (pickFrequencies[playerOne.picks[0]] < pickFrequencies[playerTwo.picks[0]]) {
    return 1;
  }

  // Fall back to alphabetical sorting.
  if (playerOne.picks[0] < playerTwo.picks[0]) {
    return -1;
  } else if (playerTwo.picks[0] < playerOne.picks[0]) {
    return 1;
  }

  // Flip the sort for the right-hand column so its most-frequent teams
  // might join up with the left-hand column's second-most-frequent teams.
  if (pickFrequencies[playerOne.picks[1]] < pickFrequencies[playerTwo.picks[1]]) {
    return -1;
  } else if (pickFrequencies[playerOne.picks[1]] > pickFrequencies[playerTwo.picks[1]]) {
    return 1;
  }

  if (playerOne.picks[1] < playerTwo.picks[1]) {
    return -1;
  } else if (playerTwo.picks[1] < playerOne.picks[1]) {
    return 1;
  }

  return 0;
};

const orientPlayerPicks = (playerPicks) => {
  for (let i = 1; i < playerPicks.length; i++) {
    if (playerPicks[i].picks[0] === playerPicks[i - 1].picks[1]) {
      playerPicks[i].picks.reverse();
    }
  }

  return playerPicks;
};

// Previous algorithm: frequency/alphabetical sorting followed by the
// same-column adjacency adjustment.
const sortPlayerPicksOriginal = (playerPicks, pickFrequencies) => {
  const orderedPlayerPicks = clonePlayerPicks(playerPicks).sort(
    (playerOne, playerTwo) => comparePlayerPicks(playerOne, playerTwo, pickFrequencies)
  );

  return orientPlayerPicks(orderedPlayerPicks);
};

// Current algorithm: grow the table from one end, switching ends when the
// opposite end offers a closer matching team.
const sortPlayerPicksCurrent = (playerPicks, pickFrequencies) => {
  const sortedPlayerPicks = clonePlayerPicks(playerPicks).sort(
    (playerOne, playerTwo) => comparePlayerPicks(playerOne, playerTwo, pickFrequencies)
  );

  const sharesTeam = (playerOne, playerTwo) =>
    playerOne.picks.some(team => playerTwo.picks.includes(team));

  const nearestSharedTeamDistance = (playerPick, rows, fromTop) => {
    let nearestDistance = Infinity;

    rows.forEach((row, index) => {
      if (sharesTeam(playerPick, row)) {
        const distance = fromTop ? index + 1 : rows.length - index;
        nearestDistance = Math.min(nearestDistance, distance);
      }
    });

    return nearestDistance;
  };

  const orderedPlayerPicks = [];
  let insertionDirection = 'bottom';

  for (const playerPick of sortedPlayerPicks) {
    if (!orderedPlayerPicks.length) {
      orderedPlayerPicks.push(playerPick);
      continue;
    }

    const previousRow = insertionDirection === 'bottom'
      ? orderedPlayerPicks[orderedPlayerPicks.length - 1]
      : orderedPlayerPicks[0];

    if (sharesTeam(playerPick, previousRow)) {
      if (insertionDirection === 'bottom') {
        orderedPlayerPicks.push(playerPick);
      } else {
        orderedPlayerPicks.unshift(playerPick);
      }
      continue;
    }

    const topDistance = nearestSharedTeamDistance(playerPick, orderedPlayerPicks, true);
    const bottomDistance = nearestSharedTeamDistance(playerPick, orderedPlayerPicks, false);

    if (insertionDirection === 'bottom' && topDistance < bottomDistance) {
      orderedPlayerPicks.unshift(playerPick);
      insertionDirection = 'top';
      continue;
    }

    if (insertionDirection === 'top' && bottomDistance < topDistance) {
      orderedPlayerPicks.push(playerPick);
      insertionDirection = 'bottom';
      continue;
    }

    if (insertionDirection === 'bottom') {
      orderedPlayerPicks.push(playerPick);
    } else {
      orderedPlayerPicks.unshift(playerPick);
    }
  }

  return orientPlayerPicks(orderedPlayerPicks);
};

const sharedTeamCount = (playerOne, playerTwo) =>
  playerOne.picks.filter(team => playerTwo.picks.includes(team)).length;

const getAdjacencyScore = (playerPicks) => {
  let score = 0;

  for (let i = 1; i < playerPicks.length; i++) {
    score += sharedTeamCount(playerPicks[i - 1], playerPicks[i]);
  }

  return score;
};

const getProximityScore = (playerPicks) => {
  let score = 0;

  for (let firstIndex = 0; firstIndex < playerPicks.length; firstIndex++) {
    for (let secondIndex = firstIndex + 1; secondIndex < playerPicks.length; secondIndex++) {
      const sharedTeams = sharedTeamCount(playerPicks[firstIndex], playerPicks[secondIndex]);
      if (sharedTeams) {
        score += sharedTeams / (secondIndex - firstIndex);
      }
    }
  }

  return score;
};

const isBetterOrder = (candidate, current) => {
  const candidateAdjacency = getAdjacencyScore(candidate);
  const currentAdjacency = getAdjacencyScore(current);

  if (candidateAdjacency !== currentAdjacency) {
    return candidateAdjacency > currentAdjacency;
  }

  return getProximityScore(candidate) > getProximityScore(current);
};

const movePlayerPick = (playerPicks, fromIndex, toIndex) => {
  const movedPlayerPicks = [...playerPicks];
  const [playerPick] = movedPlayerPicks.splice(fromIndex, 1);
  movedPlayerPicks.splice(toIndex, 0, playerPick);
  return movedPlayerPicks;
};

// Third algorithm: start with the original order, then use a greedy local
// search to maximize shared-team adjacency first and overall team proximity
// second. It is intentionally heuristic rather than a global optimization.
const sortPlayerPicksAdjacency = (playerPicks, pickFrequencies) => {
  let bestOrder = sortPlayerPicksOriginal(playerPicks, pickFrequencies);
  let improved = true;
  let iterations = 0;
  const maxIterations = Math.min(playerPicks.length * playerPicks.length, 10);

  while (improved && iterations < maxIterations) {
    improved = false;
    iterations += 1;

    for (let fromIndex = 0; fromIndex < bestOrder.length; fromIndex++) {
      for (let toIndex = 0; toIndex < bestOrder.length; toIndex++) {
        if (fromIndex === toIndex) {
          continue;
        }

        const candidateOrder = movePlayerPick(bestOrder, fromIndex, toIndex);
        if (isBetterOrder(candidateOrder, bestOrder)) {
          bestOrder = candidateOrder;
          improved = true;
        }
      }
    }
  }

  return orientPlayerPicks(bestOrder);
};

// Swap this assignment among sortPlayerPicksOriginal,
// sortPlayerPicksCurrent, and sortPlayerPicksAdjacency to compare them.
const sortPlayerPicks = sortPlayerPicksAdjacency;


function SingleWeekPicks (props) {
  const activeUser = useContext(UserContext);
  const [hoveredTeam, setHoveredTeam] = useState(null);

  const weekToShow = (props.weekToShow) ? props.weekToShow : props.league.currentWeek;

  // Get picks from specified week only
  const currentPicks = props.league.picks.filter(pick => (pick.week === weekToShow));

  // Make a convenient array mapping users and their picks
  let playerPicks = [];
  for(const player of props.league.users) {
    const currentPlayerPicks = currentPicks.filter(pick => (pick.user.id === player.id));
    let pickArray = currentPlayerPicks.map(pick => pick.team.shortName).sort();
    playerPicks.push({
      player: player,
      picks: pickArray
    });
  }

  // Get the frequency of each picked team
  let pickFrequencies = {};
  for (const playerPick of playerPicks) {
    for (const shortName of playerPick.picks) {
      if (pickFrequencies.hasOwnProperty(shortName)) {
        pickFrequencies[shortName] += 1;
      } else {
        pickFrequencies[shortName] = 1;
      }
    }
  }

  for (const playerPick of playerPicks) {
    if (playerPick.picks.length) {

      // Put the more frequent of the two picks in the left column.
      // If same frequency, alphabetically first goes on the left.
      if (pickFrequencies[playerPick.picks[1]] > pickFrequencies[playerPick.picks[0]] || (pickFrequencies[playerPick.picks[1]] === pickFrequencies[playerPick.picks[0]] && playerPick.picks[1] < playerPick.picks[0])) {
        playerPick.picks.reverse();
      }
    }
  }

  const pickedPlayerPicks = playerPicks.filter((playerPick) =>
    playerPick.picks.length > 0 && !playerPick.picks.includes('BYE')
  );
  const byePlayerPicks = playerPicks.filter((playerPick) =>
    playerPick.picks.includes('BYE')
  );
  const unpickedPlayerPicks = playerPicks.filter((playerPick) =>
    playerPick.picks.length === 0
  );

  const orderedPickedPlayerPicks = sortPlayerPicks(pickedPlayerPicks, pickFrequencies);

  // Keep the table tail reserved for BYEs, followed by users without picks.
  const orderedPlayerPicks = [
    ...orderedPickedPlayerPicks,
    ...byePlayerPicks,
    ...unpickedPlayerPicks,
  ];


  const isActiveUser = (playerID) => playerID === activeUser().id;

  const getTeamRowSpan = (rowIndex, teamIndex) => {
    const team = orderedPlayerPicks[rowIndex].picks[teamIndex];
    if (!team || orderedPlayerPicks[rowIndex - 1]?.picks[teamIndex] === team) return 0;

    let rowSpan = 1;
    while (orderedPlayerPicks[rowIndex + rowSpan]?.picks[teamIndex] === team) {
      rowSpan += 1;
    }
    return rowSpan;
  };

  const playerRows = orderedPlayerPicks.map((playerPick, rowIndex) => {
    const firstTeamRowSpan = getTeamRowSpan(rowIndex, 0);
    const secondTeamRowSpan = getTeamRowSpan(rowIndex, 1);

    return <tr key={playerPick.player.id}>
    <td
      className={ "player-name " + (isActiveUser(playerPick.player.id) ? 'is-active-user' : '')}
      data-tooltip-id={isActiveUser(playerPick.player.id) ? 'single-week-active-user-tooltip' : undefined}
      data-tooltip-content={isActiveUser(playerPick.player.id) ? "That's you!" : undefined}
    >
      {playerPick.player.displayName}
    </td>
    { playerPick.picks.length > 0 &&
      <>
      {firstTeamRowSpan > 0 &&
        <TeamOutcome weekToShow={weekToShow} team={playerPick.picks[0]} league={props.league} side="left" rowSpan={firstTeamRowSpan} hoveredTeam={hoveredTeam} setHoveredTeam={setHoveredTeam} />
      }
      {/* Bye has colspan 2, no need for right column */}
      {playerPick.picks[1] !== 'BYE' && secondTeamRowSpan > 0 &&
        <TeamOutcome weekToShow={weekToShow} team={playerPick.picks[1]} league={props.league} side="right" rowSpan={secondTeamRowSpan} hoveredTeam={hoveredTeam} setHoveredTeam={setHoveredTeam} />
      }
      <PickOutcome weekToShow={weekToShow} team1={playerPick.picks[0]} team2={playerPick.picks[1]} league={props.league} />
      </>
    }
    { playerPick.picks.length === 0 &&
      <>
      <td className="outcome-unknown">?</td>
      <td className="outcome-unknown">?</td>
      <td className="outcome-unknown">?</td>
      </>
    }
</tr>;
  });

  return (
    <>
      { (weekToShow <= props.league.revealedWeek || props.league.season < props.currentSeason) &&
      <>
        <h3>All picks for week {weekToShow}</h3>
        <Tooltip id="single-week-active-user-tooltip" classNameArrow="hidden" style={{ backgroundColor: '#000000', zIndex: 10 }} />
        <Tooltip id="single-week-game-result-tooltip" classNameArrow="hidden" style={{ backgroundColor: '#000000', zIndex: 10 }} />
        <table className="pick-grid week-picks">
          <thead>
            <tr>
              <th className="player-name">Competitor</th>
              <th className="default-cell">Team 1</th>
              <th className="default-cell">Team 2</th>
              <th className="default-cell">Result</th>
            </tr>
          </thead>
          <tbody onMouseLeave={() => setHoveredTeam(null)}>
            {playerRows}
          </tbody>
        </table>
      </>
      }
    </>
  );
}

export default SingleWeekPicks;
