# YouTube Clean Player

Extensão experimental para Chrome/Chromium que reduz anúncios no YouTube — bloqueio de rede, filtros visuais e pulo automático no player. Projeto de portfólio com arquitetura modular para manutenção.

**Uso pessoal.** Não afiliada ao Google ou ao YouTube. Instalação manual (sem Chrome Web Store).

## Funcionalidades

- **Bloqueio de rede** — regras `declarativeNetRequest` para domínios e endpoints de anúncio
- **Filtro cosmético** — esconde banners, cards e overlays na página
- **Anti-bloqueador** — oculta o aviso “Bloqueadores de anúncios são proibidos” e tenta retomar o vídeo
- **Anúncio em vídeo** — avança o player e muta o áudio
- **Anúncio estático (imagem)** — clique real no botão **Pular** via `chrome.debugger`
- **Popup** — liga/desliga, contadores e última ação

## Stack

- Manifest V3
- JavaScript (ES modules no código-fonte, build com esbuild)
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
npm install
npm run build
```

1. Abra `chrome://extensions`
2. Ative **Modo do desenvolvedor**
3. **Carregar sem compactação** → selecione a pasta do projeto (a raiz, não `src/`)
4. Recarregue a extensão após alterações (`npm run build` + botão Recarregar)
5. Abra ou recarregue `youtube.com`

> Se a pasta `dist/` já existir no clone, pode pular o build na primeira vez. Ao editar `src/`, rode `npm run build` antes de recarregar.

## Aviso do Chrome (debugger)

Em anúncios estáticos, o Chrome pode exibir:

> *"YouTube Clean Player começou a depurar este navegador"*

Isso ocorre porque a extensão usa `chrome.debugger` para simular um clique real no **Pular** (YouTube ignora cliques sintéticos de JavaScript). É esperado em uso pessoal.

## Scripts

| Comando | Ação |
|---------|------|
| `npm install` | Instala dependências de build |
| `npm run build` | Gera `dist/` a partir de `src/` |

## Manutenção rápida

| Tarefa | Onde |
|--------|------|
| Novas regras de rede | `rules/ads.json` |
| Seletores de UI / player | `src/shared/selectors.js` |
| Timings e constantes | `src/shared/constants.js` |
| Lógica de anúncio em vídeo | `src/page/ad-handlers.js` |
| Botão Pular / clique | `src/page/skip-button.js` + `src/background/trusted-click.js` |
| Esconder banners na página | `src/content/cosmetic.js` + `src/styles/cosmetic.css` |
| Aviso de bloqueador do YouTube | `src/content/cosmetic.js` + `src/styles/cosmetic.css` |

## Limitações

- O YouTube altera seletores e URLs com frequência — manutenção eventual
- Não bloqueia 100% dos anúncios em todos os formatos
- Publicação na Chrome Web Store é difícil por políticas de anúncio

## Aviso legal

Ferramenta experimental para uso pessoal. Pular ou bloquear anúncios pode conflitar com os termos do YouTube. Use por sua conta e risco.

## Licença

MIT — veja [LICENSE](LICENSE).
