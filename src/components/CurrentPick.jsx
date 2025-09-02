// Shows a user's pick for the current week if the
// full pick set has not yet been revealed.

import React, { useContext } from 'react';
import UserContext from './ActiveUserContext';
import { gql, useQuery, useMutation } from '@apollo/client';

const GET_USER_PICKS = gql`
  query GetUserPicks($leagueID: ID!, $userID: ID!) {
    picksForUser(leagueID: $leagueID, userID: $userID) {
      id
      week
      team {
        id
        name
        shortName
      }
    }
  }
`;

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
  const { loading, error, data } = useQuery(GET_USER_PICKS, {
    variables: {
      leagueID: props.league.id,
      userID: activeUser().id,
      week: week
    },
    skip: props.currentSeason !== props.league.season
  });

  const [invalidatePicks] = useMutation(
    INVALIDATE_PICKS,
    {
      refetchQueries: [
        'GetLeagueDetails',
        'GetUserPicks',
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
  if (loading) return 'Loading...';
  if (error) return `Error! ${error.message}`;

  const selectedWeekPicks = data.picksForUser.filter(pick => pick.week === week);

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
      <h3>Your picks for week {week}</h3>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div>
        {
          selectedWeekPicks.map((pick) => <span key={pick.id} className={`team-${pick.team.shortName.toLowerCase()} current-pick`}>
            {pick.team.shortName}
          </span>)
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
