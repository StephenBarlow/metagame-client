import React, { useEffect, useMemo, useState } from 'react';
import { gql } from '@apollo/client';
import { useMutation, useQuery } from '@apollo/client/react';
import MessageSlotModal from './MessageSlotModal';
import { parseMessageFormat } from './messageUtils';

const MESSAGE_COMPOSER = gql`
  query MessageComposer {
    messageTemplates {
      id
      key
      format
      slots {
        id
        key
        position
        prompt
        valueTypes
      }
    }
    catalogValues: messageValues(kind: CATALOG_VALUE) {
      id
      key
      text
      kind
    }
    adjectives: messageValues(kind: ADJECTIVE) {
      id
      key
      text
      kind
    }
  }
`;

const SUBMIT_MESSAGE = gql`
  mutation SubmitMessage($request: SubmitMessageRequest!, $leagueID: ID!) {
    submitMessage(request: $request) {
      message {
        id
        week
        createdAt
        author {
          id
          displayName(leagueID: $leagueID)
        }
        template {
          id
          key
          format
          slots {
            id
            key
            position
            prompt
            valueTypes
          }
        }
        selections {
          slot {
            id
            key
            position
          }
          value {
            __typename
            ... on MessageValue {
              id
              key
              text
              kind
            }
            ... on SportsTeam {
              id
              name
              shortName
            }
            ... on User {
              id
              displayName(leagueID: $leagueID)
            }
          }
        }
      }
      errors {
        code
        message
      }
    }
  }
`;

function MessageComposer({ league, teams, userID }) {
  const { loading: composerLoading, error: composerError, data: composerData } = useQuery(MESSAGE_COMPOSER);
  const [templateID, setTemplateID] = useState('');
  const [selections, setSelections] = useState({});
  const [activeSlot, setActiveSlot] = useState(null);
  const [status, setStatus] = useState('');

  const templates = composerData?.messageTemplates || [];
  const templateOptions = useMemo(
    () => [...templates].sort((first, second) => first.format.localeCompare(second.format)),
    [templates]
  );
  const template = templates.find(({ id }) => String(id) === String(templateID)) || templates[0];
  const slots = useMemo(
    () => [...(template?.slots || [])].sort((first, second) => first.position - second.position),
    [template]
  );
  const slotsByKey = useMemo(
    () => new Map(slots.map((slot) => [slot.key, slot])),
    [slots]
  );
  const optionSources = useMemo(() => ({
    catalogValues: composerData?.catalogValues || [],
    adjectives: composerData?.adjectives || [],
    users: league.users,
    teams,
  }), [composerData, league.users, teams]);

  useEffect(() => {
    if (templates.length && !templates.some(({ id }) => String(id) === String(templateID))) {
      setTemplateID(String(templates[0].id));
    }
  }, [templates, templateID]);

  const [submitMessage, { loading: submitting }] = useMutation(SUBMIT_MESSAGE, {
    update: (cache, { data }) => {
      const message = data?.submitMessage?.message;
      if (!message) return;
      const leagueCacheID = cache.identify(league);
      if (!leagueCacheID) return;

      cache.modify({
        id: leagueCacheID,
        fields: {
          messages(existingMessages = [], { readField, toReference }) {
            const messageReference = toReference(message, true);
            return [
              messageReference,
              ...existingMessages.filter((existingMessage) =>
                String(readField('id', existingMessage)) !== String(message.id)
              ),
            ];
          },
        },
      });
    },
    onCompleted: ({ submitMessage: result }) => {
      if (result?.errors?.length) {
        setStatus(`Error: ${result.errors[0].message}`);
        return;
      }

      if (result?.message) {
        setSelections({});
        setStatus('Message sent!');
      }
    },
    onError: (error) => setStatus(`Error: ${error.message}`),
  });

  const changeTemplate = (nextTemplateID) => {
    setTemplateID(nextTemplateID);
    setSelections({});
    setActiveSlot(null);
    setStatus('');
  };

  const selectOption = (option) => {
    setSelections((currentSelections) => ({
      ...currentSelections,
      [activeSlot.id]: option,
    }));
    setActiveSlot(null);
    setStatus('');
  };

  const submit = (event) => {
    event.preventDefault();
    if (!template || !slots.every((slot) => selections[slot.id])) return;

    setStatus('');
    submitMessage({
      variables: {
        leagueID: league.id,
        request: {
          userID,
          leagueID: league.id,
          week: league.currentWeek,
          templateID: template.id,
          selections: slots.map((slot) => ({
            slotID: slot.id,
            valueType: selections[slot.id].valueType,
            valueID: selections[slot.id].valueID,
          })),
        },
      },
    });
  };

  if (composerLoading) return <div className="message-composer"><p className="message-composer-status">Loading message builder…</p></div>;
  if (composerError) return <div className="message-composer"><p className="form-status">Unable to load message builder.</p></div>;
  if (!template) return <div className="message-composer"><p className="message-composer-status">No message templates are available.</p></div>;

  const sentenceFragments = parseMessageFormat(
    template.format,
    (key) => {
      const slot = slotsByKey.get(key);
      return slot ? selections[slot.id]?.label : '';
    }
  );
  const canSubmit = slots.every((slot) => selections[slot.id]);

  return (
    <form className="message-composer" onSubmit={submit}>
      <div className="message-composer-heading">
        <strong>Add a message</strong>
      </div>

      {templates.length > 1 &&
        <label className="message-template-picker">
          Template
          <select value={template.id} onChange={(event) => changeTemplate(event.target.value)}>
            {templateOptions.map((messageTemplate) => (
              <option value={messageTemplate.id} key={messageTemplate.id}>{messageTemplate.format}</option>
            ))}
          </select>
        </label>}

      <div className="message-composer-sentence">
        {sentenceFragments.map((fragment, index) => {
          const slot = fragment.key ? slotsByKey.get(fragment.key) : null;
          if (!slot) return <span key={`literal-${index}`}>{fragment.text}</span>;

          const selection = selections[slot.id];
          return (
            <button
              type="button"
              className={`message-slot-trigger${selection ? ' selected' : ''}`}
              key={`${slot.id}-${index}`}
              onClick={() => setActiveSlot(slot)}
              aria-label={`${slot.prompt}: ${selection?.label || 'not selected'}`}
            >
              {selection?.label || '________'}
            </button>
          );
        })}
      </div>

      <div className="message-composer-actions">
        <button type="submit" disabled={!canSubmit || submitting}>
          {submitting ? 'Sending…' : 'Send'}
        </button>
        {status && <span className="form-status" role="status">{status}</span>}
      </div>

      <MessageSlotModal
        slot={activeSlot}
        sources={optionSources}
        selectedOption={activeSlot ? selections[activeSlot.id] : null}
        onSelect={selectOption}
        onClose={() => setActiveSlot(null)}
      />
    </form>
  );
}

export default MessageComposer;
