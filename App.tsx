/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { useEffect } from 'react';
import AgentEdit from './components/AgentEdit';
import ControlTray from './components/console/control-tray/ControlTray';
import ErrorScreen from './components/demo/ErrorSreen';
import KeynoteCompanion from './components/demo/keynote-companion/KeynoteCompanion';
import Header from './components/Header';
import UserSettings from './components/UserSettings';
import PersonalitySelectionScreen from './components/PersonalitySelectionScreen';
import { LiveAPIProvider } from './contexts/LiveAPIContext';
import { useUI, useAgent } from './lib/state';

// API Key Logic
const urlParams = new URLSearchParams(window.location.search);
let apiKeyToUse = urlParams.get('apiKey');

if (apiKeyToUse) {
  console.warn(
    'AVISO DE SEGURANÇA: A chave da API foi fornecida através de um parâmetro de URL. ' +
    'Isso é inseguro e só deve ser usado para desenvolvimento ou em cenários confiáveis. ' +
    'Não exponha esta URL publicamente.'
  );
} else {
  apiKeyToUse = process.env.API_KEY as string;
}

if (!apiKeyToUse) {
  throw new Error(
    'Variável de ambiente obrigatória API_KEY não encontrada e não fornecida via URL.'
  );
}


/**
 * Main application component that provides a streaming interface for Live API.
 * Manages video streaming state and provides controls for webcam/screen capture.
 */
function App() {
  const { isEmbedded, showUserConfig, showAgentEdit, showPersonalitySelectionScreen, setShowPersonalitySelectionScreen } = useUI();
  const { setCurrent, availablePresets, availablePersonal } = useAgent();

  useEffect(() => {
    if (isEmbedded) {
      const agentIdFromUrl = urlParams.get('agentId');
      if (agentIdFromUrl) {
        const agentExists =
          availablePresets.find(a => a.id === agentIdFromUrl) ||
          availablePersonal.find(a => a.id === agentIdFromUrl);

        if (agentExists) {
          setCurrent(agentIdFromUrl);
          // setShowPersonalitySelectionScreen(false) is handled by initial state in useUI
          // but good to ensure if needed, though initial state should cover it.
          // if (showPersonalitySelectionScreen) setShowPersonalitySelectionScreen(false);
        } else {
          console.warn(
            `Agente com ID "${agentIdFromUrl}" fornecido via URL não foi encontrado. ` +
            `Prosseguindo com o fluxo padrão (tela de seleção de personalidade).`
          );
        }
      }
    }
  }, [isEmbedded, availablePresets, availablePersonal, setCurrent, setShowPersonalitySelectionScreen, showPersonalitySelectionScreen]);

  return (
    <div className="App">
      <LiveAPIProvider apiKey={apiKeyToUse}>
        {showPersonalitySelectionScreen ? (
          <PersonalitySelectionScreen />
        ) : (
          <>
            <ErrorScreen />
            {/* Can optionally hide or simplify Header in embed mode */}
            {/* {!isEmbedded && <Header />} */}
            <Header apiKeyForEmbed={apiKeyToUse} />

            {showUserConfig && <UserSettings />}
            {showAgentEdit && <AgentEdit />}
            <div className="streaming-console">
              <main>
                <div className="main-app-area">
                  <KeynoteCompanion />
                </div>
                <ControlTray></ControlTray>
              </main>
            </div>
          </>
        )}
      </LiveAPIProvider>
    </div>
  );
}

export default App;