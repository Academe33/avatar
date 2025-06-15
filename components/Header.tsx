/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useLiveAPIContext } from '@/contexts/LiveAPIContext';
import { Agent, createNewAgent } from '@/lib/presets/agents';
import { useAgent, useUI, useUser } from '@/lib/state';
import c from 'classnames';
import { useEffect, useState } from 'react';
import EmbedModal from './EmbedModal'; // Import the new modal

interface HeaderProps {
  apiKeyForEmbed: string;
}

export default function Header({ apiKeyForEmbed }: HeaderProps) {
  const { showUserConfig, setShowUserConfig, setShowAgentEdit } = useUI();
  const { name } = useUser();
  const { current, setCurrent, availablePresets, availablePersonal, addAgent } =
    useAgent();
  const { disconnect } = useLiveAPIContext();

  const [showRoomList, setShowRoomList] = useState(false);
  const [showEmbedModal, setShowEmbedModal] = useState(false); // State for embed modal

  useEffect(() => {
    const closeModals = () => {
      setShowRoomList(false);
      // setShowEmbedModal(false); // Modal manages its own close via its close button & backdrop click
    };
    // Add event listener to the document for closing modals on outside click
    document.addEventListener('click', closeModals);
    // Cleanup function to remove the event listener
    return () => document.removeEventListener('click', closeModals);
  }, []); // Empty dependency array means this effect runs once on mount and cleanup on unmount


  function changeAgent(agent: Agent | string) {
    disconnect();
    setCurrent(agent);
  }

  function addNewChatterBot() {
    disconnect();
    addAgent(createNewAgent());
    setShowAgentEdit(true);
  }

  return (
    <header>
      <div className="roomInfo">
        <div className="roomName">
          <button
            onClick={e => {
              e.stopPropagation(); // Prevent global click listener from closing immediately
              setShowRoomList(prev => !prev);
            }}
            aria-expanded={showRoomList}
            aria-controls="room-list-dropdown"
          >
            <h1 className={c({ active: showRoomList })}>
              {current.name}
              <span className="icon" aria-hidden="true">arrow_drop_down</span>
            </h1>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowAgentEdit(true);
            }}
            className="button createButton"
            aria-label="Editar agente atual"
          >
            <span className="icon" aria-hidden="true">edit</span> Editar
          </button>
          {/* Removed !isEmbedded condition to always show the button */}
          <button
            onClick={(e) => {
              e.stopPropagation(); // Prevent closing due to global click listener
              setShowEmbedModal(true);
            }}
            className="button embedButton"
            aria-label="Incorporar avatar"
            title="Incorporar Avatar"
          >
            <span className="icon" aria-hidden="true">link</span> Incorporar Avatar
          </button>
        </div>

        <div id="room-list-dropdown" className={c('roomList', { active: showRoomList })} onClick={e => e.stopPropagation()}>
          <div>
            <h3>Predefinições</h3>
            <ul>
              {availablePresets
                .filter(agent => agent.id !== current.id)
                .map(agent => (
                  <li
                    key={agent.name}
                    className={c({ active: agent.id === current.id })}
                  >
                    <button onClick={() => changeAgent(agent)}>
                      {agent.name}
                    </button>
                  </li>
                ))}
            </ul>
          </div>

          <div>
            <h3>Seus ChatterBots</h3>
            {
              <ul>
                {availablePersonal.length ? (
                  availablePersonal.map(({ id, name }) => (
                    <li key={name} className={c({ active: id === current.id })}>
                      <button onClick={() => changeAgent(id)}>{name}</button>
                    </li>
                  ))
                ) : (
                  <p>Nenhum ainda.</p>
                )}
              </ul>
            }
            <button
              className="newRoomButton"
              onClick={() => {
                addNewChatterBot();
              }}
            >
              <span className="icon" aria-hidden="true">add</span>Novo ChatterBot
            </button>
          </div>
        </div>
      </div>
      <button
        className="userSettingsButton"
        onClick={(e) => {
           e.stopPropagation();
           setShowUserConfig(!showUserConfig);
        }}
        aria-label="Configurações do usuário"
        aria-expanded={showUserConfig}
      >
        <p className='user-name'>{name || 'Seu nome'}</p>
        <span className="icon" aria-hidden="true">tune</span>
      </button>

      {showEmbedModal && current && (
        <EmbedModal
          agentId={current.id}
          apiKey={apiKeyForEmbed}
          onClose={() => setShowEmbedModal(false)}
        />
      )}
    </header>
  );
}