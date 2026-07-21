// Shows a user's pick for the current week if the
// full pick set has not yet been revealed.

import React, { useContext } from 'react';
import UserContext from './ActiveUserContext';
import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';

const logoFilenameForTeam = (teamName) => `${teamName.toLowerCase().replaceAll(' ', '-')}.png`;

const INVALIDATE_PICKS = gql`
  mutation InvalidatePicks($request: InvalidatePicksRequest!) {
    invalidatePicks(request: $request) {
      success
      errors {
        code
        message
      }
    }
  }
`;

function CurrentPick(props) {
  const activeUser = useContext(UserContext);
  const week = props.selectedWeek || props.league.currentWeek;

  const [invalidatePicks] = useMutation(
    INVALIDATE_PICKS,
    {
      refetchQueries: [
        'GetLeagueDetails',
      ],
      onCompleted: ({invalidatePicks: invalidatePicksResult}) => {
        if (invalidatePicksResult.success) {
          console.log('Picks invalidated successfully');
        } else if (invalidatePicksResult.errors) {
          console.error('Error invalidating picks:', invalidatePicksResult.errors[0].message);
        }
      }
    }
  );

  if (props.currentSeason !== props.league.season) {
    return (<p className="warning">This league has concluded.</p>)
  }
  const selectedWeekPicks = props.userPicks.filter(pick => pick.week === week);

  if (!selectedWeekPicks.length) {
    return (<p className="warning">You have not yet submitted picks for week {week}.</p>)
  }

  // Don't bother showing this if the table of
  // everyone's picks is being displayed.
  if (props.league.currentWeek === props.league.revealedWeek) {
    return (null);
  }

  return (
    <>
      <h3>Your week {week} picks</h3>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div className="current-picks">
        {
          selectedWeekPicks.map((pick) => {
            const isBye = pick.team.shortName === 'BYE';
            const teamClass = isBye ? '' : ` team-${pick.team.shortName.toLowerCase()}`;

            return (
              <span key={pick.id} className="current-pick">
                <span className={`team-picker-logo-frame${teamClass}`}>
                  {isBye
                    ? <span className="team-picker-bye-logo" aria-hidden="true">💤</span>
                    : <img src={`/logos/${logoFilenameForTeam(pick.team.name)}`} alt="" aria-hidden="true" />}
                </span>
                <span>{pick.team.name}</span>
              </span>
            );
          })
        }
        </div>

        {/* Clear pick button for future weeks */}
        {week > props.league.currentWeek && (
          <button
            className="clear-pick-button"
            type="button"
            onClick={() => {
              // Show confirmation dialog before clearing picks
              if (window.confirm(`Are you sure you want to clear your picks for week ${week}?`)) {
                // Invalidate all picks for this week
                const pickIDs = selectedWeekPicks.map(pick => pick.id);
                invalidatePicks({
                  variables: {
                    request: { pickIDs }
                  }
                });
              }
            }}
          >
            Clear week {week} picks
          </button>
        )}
      </div>
      <p style={{maxWidth: '400px', fontSize: '14px'}}>You can change these teams until one of their games starts or the pick list is revealed (whichever happens first).</p>
    </>
  );
}

export default CurrentPick;
