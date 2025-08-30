import React, { useState } from 'react';
import SingleWeekPicks from './SingleWeekPicks';

const NFL_FINAL_WEEK = 18;

function PickArchive({league, currentSeason, ...props}) {

  const [weekToShow, setWeekToShow] = useState('none');
  if (league.currentWeek < 2 && currentSeason === league.season) {
    return (
      <div className="pick-archive" />
    );
  }
  let maxWeek = currentSeason === league.season ? league.currentWeek - 1 : NFL_FINAL_WEEK - 1;
  return (
    <div className="pick-archive">
      <h3>THE ARCHIVE</h3>
      <label style={{paddingLeft: '4px'}}>Show picks for week </label>
      <select
        className="sort-picker" name="archive-picker" id="archive-picker"
        onChange={event => setWeekToShow(event.target.value)}
      >
        <option value="none"></option>
        {Array.from({length: maxWeek}, (_, i) => i + 1).map(week => (
          <option value={week} key={week}>{week}</option>
        ))}  
      </select>
      { weekToShow !== 'none' &&
        <SingleWeekPicks league={league} weekToShow={+weekToShow} currentSeason={currentSeason} />
      }
    </div>
  );
};

export default PickArchive;
