# Julio Neves - Treinos · PWA

App web (PWA) com 300 treinos do método Blacksheep (1-20 são os originais da
planilha; 21-300 gerados pela mesma metodologia). Pensado para iPhone, com tema
escuro, filtro por grupamento, busca, checkboxes, controle de cargas com
memória, vídeos de execução embutidos (curados: canal oficial CrossFit
prioritário, nunca acima de 30s), timer de AMRAP/EMOM/Intervalos e histórico.

## Pipeline de dados (novo)

A pasta `../tools/` é a fonte da expansão:

- `catalog.py` — catálogo canônico de exercícios (nome pt, termo de busca en,
  equipamento, grupamento). O nome canônico é a chave da memória de cargas.
- `curate_videos.py` — busca vídeos no YouTube (canal @CrossFit primeiro,
  global depois), corta em 30s, salva `videos.json`. `fix_videos.py` faz a
  segunda passada com termos dirigidos + overrides manuais.
- `gen_workouts.py` — gera `app/data/workouts.json` (300, preservando 1-20 de
  `workouts.original20.json`) e `fitpimpa/data/workouts.json` (300).
  RNG com seed fixa: rodar de novo reproduz os mesmos treinos.

Para regenerar tudo: `python3 tools/gen_workouts.py` (na raiz Blacksheep).

## Estrutura de arquivos

```
app/
├─ index.html
├─ styles.css
├─ app.js
├─ manifest.webmanifest
├─ sw.js
├─ data/
│  └─ workouts.json        (gerado a partir da planilha)
├─ icons/
│  ├─ icon.svg
│  ├─ icon-192.png
│  ├─ icon-512.png
│  └─ icon-maskable.png
└─ scripts/
   └─ build_data.py        (converte a planilha em workouts.json)
```

## Atualizando os treinos

A planilha continua sendo a fonte única de verdade. Sempre que quiser
adicionar ou ajustar treinos:

1. Edite o arquivo `20 Treinos - Método BlackSheep Crossfit Gym Training.xlsx`
   (preserve as colunas `Treino`, `Foco`, `Estrutura`, `Exercícios`, `Metabólico`).
2. Rode:
   ```bash
   cd app
   python3 scripts/build_data.py
   ```
3. O arquivo `app/data/workouts.json` é regenerado.
4. Se você já publicou (GitHub Pages, Netlify, etc.), faça o deploy novamente.
   No iPhone, basta abrir o app que ele baixa a versão nova automaticamente
   (o service worker está em "network-first" para o JSON).

Formatação esperada de cada célula:

- **Exercícios** — separados por `;`, com séries/reps entre parênteses:
  `Push Press (1x6, 2x5, 2x4); Supino Halteres (4x10); Mobilidade`
- **Metabólico** — texto livre. O parser reconhece:
  - `AMRAP 10'` → countdown de 10 min
  - `EMOM 10'` → countdown de 10 min com bip a cada minuto
  - `6 Rounds (10" ON / 30" OFF)` → timer de intervalos
  - `5 Rounds` → count-up "for time"
  - Qualquer outro → count-up genérico

## Rodando localmente (para testar no computador)

Service worker exige servidor HTTP (não funciona em `file://`):

```bash
cd app
python3 -m http.server 8000
# abra http://localhost:8000
```

## Instalando no iPhone (duas opções)

### Opção A — Hospedar na internet (recomendado)

1. Publique a pasta `app/` em qualquer host estático:
   - **GitHub Pages**: crie um repositório, envie os arquivos, ative Pages.
   - **Netlify Drop**: arraste a pasta em https://app.netlify.com/drop
   - **Cloudflare Pages**: conecte o repositório.
2. No iPhone, abra a URL no **Safari**.
3. Toque no botão de compartilhamento → **Adicionar à Tela de Início**.
4. O ícone passa a se comportar como app (standalone, offline, dark mode).

### Opção B — Arquivo local no iCloud Drive (sem deploy)

Funciona, porém sem "instalação" como app e sem service worker:

1. Copie a pasta `app/` para o iCloud Drive.
2. Abra `index.html` pelo app Arquivos no iPhone.
3. Use "Compartilhar → Abrir no Safari" se desejar salvar como favorito.

## Recursos do app

- **Filtro por grupamento**: chips no topo (Todos, Empurre, Tração, Inferiores, Híbrido).
- **Lista de treinos**: cartão por treino com número, foco e estrutura.
- **Tela de detalhe**:
  - checkboxes por exercício (estado persiste entre sessões);
  - link "Ver execução" que abre busca no YouTube pelo nome do exercício;
  - cartão do metabólico com o texto original e tipo detectado.
- **Timer**: countdown/intervalos com bip nas transições. Pausa e reset.
- **Histórico**: registra data/hora ao tocar "Concluir treino".

## Notas sobre vídeos

Geração de vídeos por IA por exercício não é viável no momento e pode ser
imprecisa (risco de lesão). A abordagem atual é o botão "Ver execução" abrir
uma busca no YouTube para o exercício específico. Se desejar curar vídeos
fixos, basta acrescentar um campo `video_url` em cada exercício dentro de
`data/workouts.json` e ajustar o método `youtubeSearchUrl` em `app.js`.

## Personalização rápida

- Tema (cores/fontes) em `styles.css` (variáveis CSS no topo).
- Texto do cabeçalho em `index.html`.
- Nome do app (tela de início do iPhone) em `manifest.webmanifest`
  (`name`, `short_name`).
