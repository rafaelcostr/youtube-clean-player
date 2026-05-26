# YouTube Clean Player

Extensão experimental para Chrome/Chromium que reduz anúncios no YouTube — bloqueio de rede, filtros visuais e skip automático no player. Projeto de portfólio com arquitetura modular para manutenção.

**Uso pessoal.** Não afiliada ao Google/YouTube. Instalação manual (sem Chrome Web Store).

## Funcionalidades

- **Bloqueio de rede** — regras `declarativeNetRequest` para domínios e endpoints de anúncio
- **Filtro cosmético** — esconde banners, cards e overlays na página
- **Anúncio em vídeo** — avança o player e muta o áudio
- **Anúncio estático (imagem)** — clique real no botão **Pular** via `chrome.debugger`
- **Popup** — liga/desliga, contadores e última ação

## Stack

- Manifest V3
- JavaScript (ES modules, sem bundler)
- `declarativeNetRequest`, `chrome.debugger`, `chrome.storage`

## Arquitetura

```
src/
├── shared/             # Constantes e seletores compartilhados
├── background/         # Service worker (rede + clique confiável)
├── content/            # Content script (cosmético + ponte com a página)
├── page/               # Script injetado no contexto do YouTube
├── popup/              # Interface da extensão
└── styles/             # CSS cosmético
rules/
└── ads.json            # Regras de bloqueio de rede
```

Documentação detalhada: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

## Instalação

```bash
git clone https://github.com/rafaelcostr/youtube-clean-player.git
cd youtube-clean-player
```

1. Abra `chrome://extensions`
2. Ative **Modo do desenvolvedor**
3. **Carregar sem compactação** → selecione a pasta do projeto
4. Recarregue a extensão após alterações no código
5. Abra ou recarregue `youtube.com`

## Aviso do Chrome (debugger)

Em anúncios estáticos, o Chrome pode exibir:

> *"YouTube Clean Player começou a depurar este navegador"*

Isso ocorre porque a extensão usa `chrome.debugger` para simular um clique real no **Pular** (YouTube ignora cliques sintéticos de JavaScript). É esperado em uso pessoal.

## Manutenção rápida

| Tarefa | Onde |
|--------|------|
| Novas regras de rede | `rules/ads.json` |
| Seletores de UI / player | `src/shared/selectors.js` |
| Timings e constantes | `src/shared/constants.js` |
| Lógica de anúncio em vídeo | `src/page/ad-handlers.js` |
| Botão Pular / clique | `src/page/skip-button.js` + `src/background/trusted-click.js` |
| Esconder banners na página | `src/content/cosmetic.js` + `src/styles/cosmetic.css` |

## Limitações

- O YouTube altera seletores e URLs com frequência — manutenção eventual
- Não bloqueia 100% dos anúncios em todos os formatos
- Publicação na Chrome Web Store é difícil por políticas de anúncio

## Aviso legal

Ferramenta experimental para uso pessoal. Pular ou bloquear anúncios pode conflitar com os termos do YouTube. Use por sua conta e risco.

## Licença

MIT — veja [LICENSE](LICENSE).
