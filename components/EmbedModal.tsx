/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useMemo } from 'react';
import Modal from './Modal';

interface EmbedModalProps {
  agentId: string;
  apiKey: string;
  onClose: () => void;
}

export default function EmbedModal({ agentId, apiKey, onClose }: EmbedModalProps) {
  const [copied, setCopied] = useState(false);

  const embedCode = useMemo(() => {
    let currentHref = window.location.href;
    const currentHostname = window.location.hostname;
    const problematicSuffix = ".usercontent.googhttps";
    const correctSuffix = ".usercontent.goog";

    // Check if the hostname from window.location is malformed
    if (currentHostname.endsWith(problematicSuffix)) {
      // Attempt to correct the href by replacing the malformed part in the hostname
      // This is a targeted fix for the specific environment issue reported.
      const correctHostnameInHref = currentHostname.substring(0, currentHostname.length - "https".length);
      // Ensure we replace it safely within the href context
      if (currentHref.includes(currentHostname)) {
         currentHref = currentHref.replace(currentHostname, correctHostnameInHref);
      } else {
        // Fallback or more complex replacement if needed, for now, log a warning if this happens
        console.warn("Could not reliably correct malformed hostname in href for embed URL.");
      }
    }

    // Use new URL() for robust path resolution to index.html relative to the (potentially corrected) current URL.
    // This will correctly find index.html if it's in the same directory as the current page.
    const indexHtmlAbsoluteUrl = new URL('index.html', currentHref).href;

    const srcUrl = `${indexHtmlAbsoluteUrl}?apiKey=${encodeURIComponent(apiKey)}&agentId=${encodeURIComponent(agentId)}`;

    return `<div style="width: 500px; height: 700px; border: 1px solid #ccc; position: relative; overflow: hidden; border-radius: 8px;">
  <iframe
    src="${srcUrl}"
    style="width: 100%; height: 100%; border: none;"
    allow="microphone"
    title="Avatar Interativo">
  </iframe>
</div>
<!--
  NOTAS IMPORTANTES SOBRE O EMBED:

  1.  Verifique se a 'src' do iframe aponta para a URL correta do seu aplicativo hospedado.
      O link gerado é: ${srcUrl}
      Se estiver testando localmente, pode ser algo como 'http://localhost:PORTA/index.html'.

  2.  AVISO DE SEGURANÇA: O código acima inclui sua chave de API Gemini diretamente na URL do iframe.
      Expor sua chave de API desta forma é INSEGURO para ambientes de produção e só deve
      ser usado para desenvolvimento ou em cenários internos onde a URL não será publicamente acessível.
      Considere métodos mais seguros de gerenciamento de chaves em produção.

  3.  O ID do agente ('${agentId}') já está incluído.

  4.  O atributo 'allow="microphone"' é crucial para permitir que o iframe acesse o microfone.

  5.  Ajuste 'width' e 'height' no 'div' container e no 'iframe' conforme necessário
      para o layout da sua página. O 'div' container ajuda a definir as dimensões e o estilo.
-->`;
  }, [agentId, apiKey]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500); // Reset after 2.5 seconds
    } catch (err) {
      console.error('Falha ao copiar código de incorporação:', err);
      alert('Falha ao copiar o código. Verifique o console para mais detalhes e tente copiar manualmente.');
    }
  };

  return (
    <Modal onClose={onClose}>
      <div className="embed-modal-content">
        <h2>Código de Incorporação do Avatar</h2>
        <p className="embed-modal-instruction">
          Copie e cole este código HTML em sua página para incorporar o avatar.
        </p>
        <textarea
          readOnly
          value={embedCode}
          rows={15}
          className="embed-modal-textarea"
          aria-label="Código de incorporação do avatar"
          onClick={(e) => (e.target as HTMLTextAreaElement).select()}
        />
        <div className="embed-modal-actions">
          {copied && <span className="embed-modal-copied-feedback">Copiado!</span>}
          <button onClick={handleCopy} className="button primary embed-modal-copy-button">
            Copiar Código
          </button>
        </div>
        <div className="embed-modal-security-warning">
          <h4><span className="icon" aria-hidden="true">warning</span> Aviso de Segurança Importante</h4>
          <p>
            O código de incorporação gerado inclui sua chave de API Gemini diretamente na URL do iframe.
            <strong>Esta prática é INSEGURA para ambientes de produção públicos</strong>, pois expõe sua chave.
          </p>
          <p>
            Use esta funcionalidade com extrema cautela, idealmente apenas para desenvolvimento, demonstrações internas
            ou em cenários onde o acesso à página que contém o iframe é estritamente controlado.
          </p>
          <p>
            Para produção, considere implementar um backend que possa intermediar as chamadas para a API Gemini
            ou explore outras opções de gerenciamento seguro de chaves fornecidas pela plataforma.
          </p>
        </div>
      </div>
    </Modal>
  );
}
