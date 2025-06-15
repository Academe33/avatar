/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { create } from 'zustand';
import { Agent, CharlotteChique, PaulEtiqueta, ChefShane, PennyPassaporte, INTERLOCUTOR_VOICE, AGENT_COLORS } from './presets/agents';

/**
 * User
 */
export type User = {
  name?: string;
  info?: string;
};

export const useUser = create<
  {
    setName: (name: string) => void;
    setInfo: (info: string) => void;
  } & User
>(set => ({
  name: '',
  info: '',
  setName: name => set({ name }),
  setInfo: info => set({ info }),
}));

/**
 * Agents
 */
function getAgentById(id: string) {
  const { availablePersonal, availablePresets } = useAgent.getState();
  return (
    availablePersonal.find(agent => agent.id === id) ||
    availablePresets.find(agent => agent.id === id)
  );
}

export const useAgent = create<{
  current: Agent;
  availablePresets: Agent[];
  availablePersonal: Agent[];
  setCurrent: (agent: Agent | string) => void;
  addAgent: (agent: Agent) => void;
  update: (agentId: string, adjustments: Partial<Agent>) => void;
}>(set => ({
  current: PaulEtiqueta,
  availablePresets: [PaulEtiqueta, CharlotteChique, ChefShane, PennyPassaporte],
  availablePersonal: [],

  addAgent: (agent: Agent) => {
    set(state => ({
      availablePersonal: [...state.availablePersonal, agent],
      current: agent,
    }));
  },
  setCurrent: (agent: Agent | string) =>
    set({ current: typeof agent === 'string' ? getAgentById(agent) : agent }),
  update: (agentId: string, adjustments: Partial<Agent>) => {
    let agent = getAgentById(agentId);
    if (!agent) return;
    const updatedAgent = { ...agent, ...adjustments };
    set(state => ({
      availablePresets: state.availablePresets.map(a =>
        a.id === agentId ? updatedAgent : a
      ),
      availablePersonal: state.availablePersonal.map(a =>
        a.id === agentId ? updatedAgent : a
      ),
      current: state.current.id === agentId ? updatedAgent : state.current,
    }));
  },
}));

/**
 * UI
 */
const urlParamsForUI = new URLSearchParams(window.location.search);
const isEmbeddedCheck = window.self !== window.top;
const agentIdFromUrlForUI = urlParamsForUI.get('agentId');

export const useUI = create<{
  isEmbedded: boolean;
  showUserConfig: boolean;
  setShowUserConfig: (show: boolean) => void;
  showAgentEdit: boolean;
  setShowAgentEdit: (show: boolean) => void;
  showPersonalitySelectionScreen: boolean;
  setShowPersonalitySelectionScreen: (show: boolean) => void;
}>(set => ({
  isEmbedded: isEmbeddedCheck,
  showUserConfig: true,
  setShowUserConfig: (show: boolean) => set({ showUserConfig: show }),
  showAgentEdit: false,
  setShowAgentEdit: (show: boolean) => set({ showAgentEdit: show }),
  showPersonalitySelectionScreen: !(isEmbeddedCheck && !!agentIdFromUrlForUI), // If embedded with agentId, don't show personality screen
  setShowPersonalitySelectionScreen: (show: boolean) => set({ showPersonalitySelectionScreen: show }),
}));