import React, { useState } from 'react';
import SingleWeekPicks from './SingleWeekPicks';

function PickArchive({league, ...props}) {

  const [weekToShow, setWeekToShow] = useState('none');
  return (
    <div className="pick-archive">
      <h3>THE ARCHIVE</h3>
      <label style={{paddingLeft: '4px'}}>Show picks for week </label>
      <select
        className="sort-picker" name="archive-picker" id="archive-picker"
        onChange={event => setWeekToShow(event.target.value)}
      >
        <option value="none"></option>
        {Array.from({length: league.currentWeek - 1}, (_, i) => i + 1).map(week => (
          <option value={week} key={week}>{week}</option>
        ))}  
      </select>
      { weekToShow !== 'none' &&
        <SingleWeekPicks league={league} weekToShow={+weekToShow} />
      }
    </div>
  );
};

export default PickArchive;
