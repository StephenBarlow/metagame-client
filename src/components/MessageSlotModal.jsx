import React, { useEffect, useMemo, useState } from 'react';
import Modal from './Modal';
import { getSlotOptionGroups } from './messageUtils';

const logoFilenameForTeam = (teamName) => `${teamName.toLowerCase().replaceAll(' ', '-')}.png`;

function MessageSlotModal({ slot, sources, selectedOption, onSelect, onClose }) {
  const groups = useMemo(
    () => slot ? getSlotOptionGroups(slot, sources) : [],
    [slot, sources]
  );
  const [activeType, setActiveType] = useState(null);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    setActiveType(groups[0]?.valueType || null);
    setFilter('');
  }, [slot, groups]);

  const activeGroup = groups.find((group) => group.valueType === activeType) || groups[0];
  const normalizedFilter = filter.trim().toLowerCase();
  const options = (activeGroup?.options || []).filter((option) =>
    !normalizedFilter || option.label.toLowerCase().includes(normalizedFilter)
  );
  const showFilter = (activeGroup?.options.length || 0) > 12;

  return (
    <Modal show={Boolean(slot)} handleClose={onClose} ariaLabel={slot?.prompt || 'Choose a message value'}>
      {slot &&
        <div className="message-slot-modal">
          <h3>{slot.prompt}</h3>

          {groups.length > 1 &&
            <div className="message-slot-tabs" role="tablist" aria-label="Value type">
              {groups.map((group) => (
                <button
                  type="button"
                  role="tab"
                  aria-selected={group.valueType === activeGroup?.valueType}
                  className={group.valueType === activeGroup?.valueType ? 'active' : ''}
                  key={group.valueType}
                  onClick={() => {
                    setActiveType(group.valueType);
                    setFilter('');
                  }}
                >
                  {group.label}
                </button>
              ))}
            </div>}

          {showFilter &&
            <input
              className="message-slot-filter"
              type="search"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              placeholder={`Filter ${activeGroup.label.toLowerCase()}`}
              aria-label={`Filter ${activeGroup.label.toLowerCase()}`}
            />}

          <div className="message-slot-options" role="listbox" aria-label={activeGroup?.label}>
            {options.map((option) => {
              const selected = selectedOption?.valueType === option.valueType &&
                selectedOption?.valueID === option.valueID;

              return (
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  className="message-slot-option"
                  key={`${option.valueType}-${option.id}`}
                  onClick={() => onSelect(option)}
                >
                  {option.valueType === 'TEAM' &&
                    <span className={`message-slot-team-logo team-${option.source.shortName.toLowerCase()}`}>
                      <img src={`/logos/${logoFilenameForTeam(option.source.name)}`} alt="" aria-hidden="true" />
                    </span>}
                  <span>{option.label}</span>
                </button>
              );
            })}
            {!options.length && <p className="message-slot-empty">No matching options.</p>}
          </div>
        </div>}
    </Modal>
  );
}

export default MessageSlotModal;
