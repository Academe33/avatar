/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useState } from 'react';
import { useAgent, useUI } from '@/lib/state';
import { fetchWikipediaData, WikipediaFetchStatus } from '@/lib/wikipedia-client';
import { AGENT_COLORS, INTERLOCUTOR_VOICE, createNewAgent } from '@/lib/presets/agents';
import { GoogleGenAI } from "@google/genai"; // Import GoogleGenAI

// Define voice groups based on perceived gender
const MALE_VOICES: INTERLOCUTOR_VOICE[] = ['Charon', 'Fenrir', 'Orus', 'Puck'];
const FEMALE_VOICES: INTERLOCUTOR_VOICE[] = ['Aoede', 'Kore', 'Leda', 'Zephyr'];


export default function PersonalitySelectionScreen() {
  const [personalityName, setPersonalityName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { setShowPersonalitySelectionScreen } = useUI();
  const { addAgent, setCurrent } = useAgent();

  const handleCreateAvatar = async () => {
    if (!personalityName.trim()) {
      setError('Por favor, insira o nome de uma personalidade.');
      return;
    }
    setIsLoading(true);
    setLoadingMessage('Buscando informações na Wikipedia...');
    setError(null);

    try {
      const wikipediaResult = await fetchWikipediaData(personalityName.trim());

      if (wikipediaResult.status === WikipediaFetchStatus.SUCCESS && wikipediaResult.data) {
        const { title, extract, imageUrl } = wikipediaResult.data;
        
        setLoadingMessage('Analisando informações para voz...');
        let inferredGender: 'masculino' | 'feminino' | 'incerto' = 'incerto';

        try {
          // Ensure API_KEY is available (comes from process.env.API_KEY in App.tsx)
          const apiKey = process.env.API_KEY as string;
          if (!apiKey) {
            throw new Error("Chave de API não configurada para inferência de gênero.");
          }
          const ai = new GoogleGenAI({ apiKey });
          
          const genderPrompt = `Analise o seguinte texto biográfico e determine o gênero da pessoa.
Responda em formato JSON com uma única chave "genero" e o valor "masculino", "feminino", ou "incerto".
Não inclua nenhuma explicação adicional, apenas o JSON.

Texto:
"""
${extract.substring(0, 1500)} 
"""`;
          
          const genResponse = await ai.models.generateContent({
              model: 'gemini-2.5-flash-preview-04-17',
              contents: genderPrompt,
              config: { responseMimeType: "application/json" }
          });

          let jsonStr = genResponse.text.trim();
          const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
          const match = jsonStr.match(fenceRegex);
          if (match && match[2]) {
            jsonStr = match[2].trim();
          }

          try {
            const parsedGender = JSON.parse(jsonStr);
            if (parsedGender.genero === 'masculino') {
              inferredGender = 'masculino';
            } else if (parsedGender.genero === 'feminino') {
              inferredGender = 'feminino';
            }
          } catch (parseError) {
            console.warn('Falha ao parsear JSON de gênero da IA:', parseError, "Resposta recebida:", genResponse.text);
            // Keep 'incerto'
          }
        } catch (genderError) {
          console.warn('Falha ao inferir gênero via IA, usando fallback:', genderError);
          // Keep 'incerto', will use fallback voice selection
        }

        let selectedVoice: INTERLOCUTOR_VOICE;
        if (inferredGender === 'masculino') {
          selectedVoice = MALE_VOICES[Math.floor(Math.random() * MALE_VOICES.length)];
        } else if (inferredGender === 'feminino') {
          selectedVoice = FEMALE_VOICES[Math.floor(Math.random() * FEMALE_VOICES.length)];
        } else {
          // Fallback for "incerto" or error in gender inference
          selectedVoice = Math.random() > 0.5 ? 'Charon' : 'Aoede';
        }

        const newPersonality = `Você É ${title}. Incorpore totalmente esta persona. Sua maneira de falar, sua personalidade e seu contexto histórico são definidos pelas informações da Wikipedia fornecidas abaixo: "${extract}". Responda como se você fosse essa pessoa, com total convicção e certeza de sua identidade. NÃO use saudações genéricas como "Olá!" ou "Como posso ajudar?". Inicie a conversa de forma autêntica como ${title} faria.`;

        const newDynamicAgent = createNewAgent({
          name: title,
          personality: newPersonality,
          bodyColor: AGENT_COLORS[Math.floor(Math.random() * AGENT_COLORS.length)],
          voice: selectedVoice,
          imageUrl: imageUrl,
        });

        addAgent(newDynamicAgent);
        setCurrent(newDynamicAgent.id);
        setShowPersonalitySelectionScreen(false);
      } else {
        // Handle Wikipedia fetch errors
        switch (wikipediaResult.status) {
          case WikipediaFetchStatus.NOT_FOUND:
            setError(
              `Personalidade "${wikipediaResult.searchTerm}" não encontrada na Wikipedia. Tente outra.`
            );
            break;
          case WikipediaFetchStatus.AMBIGUOUS:
            setError(
              `O termo "${wikipediaResult.searchTerm}" é ambíguo. Por favor, seja mais específico (ex: "${wikipediaResult.searchTerm}, o Grande" ou "${wikipediaResult.searchTerm} (cientista)").`
            );
            break;
          case WikipediaFetchStatus.INSUFFICIENT_CONTENT:
            setError(
              `A página da Wikipedia para "${wikipediaResult.searchTerm}" não contém informações suficientes. Tente outra.`
            );
            break;
          case WikipediaFetchStatus.API_ERROR:
          default:
            setError(
              'Ocorreu um erro ao buscar informações na Wikipedia. Verifique sua conexão ou tente novamente mais tarde.'
            );
            break;
        }
      }
    } catch (err) {
      console.error('Falha ao criar avatar:', err);
      setError('Ocorreu um erro inesperado ao criar o avatar. Tente novamente.');
    } finally {
      setIsLoading(false);
      setLoadingMessage(null);
    }
  };

  const handleUseExisting = () => {
    setShowPersonalitySelectionScreen(false);
  };

  return (
    <div className="personality-selection-screen" style={styles.screen}>
      <div style={styles.container}>
        <h1 style={styles.title}>Com quem você quer falar hoje?</h1>
        <p style={styles.subtitle}>
          Pode escolher qualquer pessoa da história: viva, morta, real ou
          fictícia.
        </p>
        <input
          type="text"
          value={personalityName}
          onChange={(e) => setPersonalityName(e.target.value)}
          placeholder="Digite o nome da personalidade"
          style={styles.input}
          aria-label="Nome da personalidade"
          disabled={isLoading}
        />
        {isLoading && loadingMessage && <p style={styles.loading}>{loadingMessage}</p>}
        {error && <p style={styles.error}>{error}</p>}
        <button
          onClick={handleCreateAvatar}
          disabled={isLoading || !personalityName.trim()}
          className="button primary"
          style={styles.button}
        >
          {isLoading ? 'Criando...' : 'Criar Avatar'}
        </button>
        <button
          onClick={handleUseExisting}
          className="button"
          style={{ ...styles.button, ...styles.secondaryButton }}
          disabled={isLoading}
        >
          Ou usar um avatar existente
        </button>
      </div>
    </div>
  );
}

const styles = {
  screen: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    width: '100vw',
    padding: '20px',
    background: 'var(--Neutral-10)', 
    color: 'var(--text)', 
    textAlign: 'center',
  } as React.CSSProperties,
  container: {
    maxWidth: '500px',
    width: '100%',
  } as React.CSSProperties,
  title: {
    fontSize: '2.5em',
    marginBottom: '20px',
    color: 'var(--accent-blue-headers)',
  } as React.CSSProperties,
  subtitle: {
    fontSize: '1.2em',
    marginBottom: '30px',
    color: 'var(--gray-200)',
  } as React.CSSProperties,
  input: {
    width: '100%',
    padding: '15px',
    fontSize: '1.1em',
    marginBottom: '20px',
    borderRadius: '8px',
    border: '1px solid var(--gray-700)',
    backgroundColor: 'var(--Neutral-00)',
    color: 'var(--text)',
  } as React.CSSProperties,
  button: {
    padding: '15px 30px',
    fontSize: '1.1em',
    margin: '10px 0',
    width: '100%',
    borderRadius: '8px',
    cursor: 'pointer',
  } as React.CSSProperties,
  secondaryButton: {
    backgroundColor: 'var(--Neutral-30)',
  } as React.CSSProperties,
  error: {
    color: 'var(--accent-red)',
    marginBottom: '15px',
    whiteSpace: 'pre-line',
  } as React.CSSProperties,
  loading: {
    color: 'var(--gray-200)',
    marginBottom: '15px',
  } as React.CSSProperties,
};