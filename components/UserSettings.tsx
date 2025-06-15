/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import Modal from './Modal';
import { useUI, useUser } from '@/lib/state';

export default function UserSettings() {
  const { name, info, setName, setInfo } = useUser();
  const { setShowUserConfig } = useUI();

  function updateClient() {
    setShowUserConfig(false);
  }

  return (
    <Modal onClose={() => setShowUserConfig(false)}>
      <div className="userSettings">
        <p>
          Esta é uma ferramenta simples que permite projetar, testar e interagir
          com personagens de IA personalizados em tempo real.
        </p>

        <form
          onSubmit={e => {
            e.preventDefault();
            setShowUserConfig(false);
            updateClient();
          }}
        >
          <p>Adicionar estas informações opcionais torna a experiência mais divertida:</p>

          <div>
            <label htmlFor="user-name-input">Seu nome</label>
            <input
              id="user-name-input"
              type="text"
              name="name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Como você gostaria de ser chamado?"
            />
          </div>

          <div>
            <label htmlFor="user-info-textarea">Suas informações</label>
            <textarea
              id="user-info-textarea"
              rows={3}
              name="info"
              value={info}
              onChange={e => setInfo(e.target.value)}
              placeholder="Coisas que devemos saber sobre você... Gostos, desgostos, hobbies, interesses, filmes, livros, programas de TV, comidas favoritas, etc."
            />
          </div>

          <button className="button primary">Vamos lá!</button>
        </form>
      </div>
    </Modal>
  );
}