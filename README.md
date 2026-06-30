# AllinMed

Guia de bolso clínico para estudo — informação densa de medicina, organizada para
consulta rápida em PC e telemóvel, **com funcionamento offline**. Posicionada como
ferramenta de **estudo**.

> Este README é também o briefing para o Claude Code. As regras em **"Para o Claude
> Code"** (no fim) são invariantes do projeto e não devem ser quebradas.

---

## Estado atual

- Esqueleto da app (Vite + React + PWA) que **compila e corre offline**.
- Ecrã inicial com a grelha de módulos, identidade visual única (violeta + modo escuro).
- **Landing de entrada + login (ainda não ligado)** e páginas de Política de Privacidade / Termos.
- **14 módulos ativos** (`pronto: true` em `registo.js`):
  1. **Ajuste Renal** — fármacos × escalões de TFG, com pesquisa, filtros por classe e estado por escalão (sem ajuste / ajustar / precaução / contraindicado).
  2. **Análises & GSA** — interpretação de parâmetros + calculadora de gasometria (passo a passo).
  3. **Vacinação** — PNV, matriz por idade, viajante com mapa interativo.
  4. **Vig. Infantil** — PNSIJ, crescimento (percentis OMS), Tanner, M-CHAT, tensão arterial, Snellen, flúor + referenciação.
  5. **Notas Clínicas** — gestor de doentes **só com iniciais** + notas com templates (SOAP/admissão/alta). *Interface pronta; persistência por fazer (Fase 3).*
  6. **Fármacos na Gravidez** — contraindicações e precauções por trimestre.
  7. **Interações** — interações por classe e cuidados por população (172 fármacos).
  8. **InfetAccess** — antibioterapia em ambulatório (adulto).
  9. **InfetAccess Ped** — antibioterapia em ambulatório (pediatria).
  10. **Sintomas** — Abordagem por Sintoma: hub de 3 níveis (sistema → sintoma → 5 dimensões). Conteúdo das dimensões em construção.
  11. **Sinave** — Doenças de Notificação Obrigatória: 65 doenças pesquisáveis/filtráveis com critérios e classificação de caso.
  12. **EasyFarm** — guia de fármacos, fichas completas.
  13. **My EasyFarm** — biblioteca pessoal de doses e esquemas.
  14. **PNA — Prova Nacional de Acesso** — módulo de treino completo (app dentro da app):
     banco de perguntas no formato oficial, modos **Treino / Exame cronometrado /
     Construtor / Revisão (FSRS)**, **estatísticas** e **análise comportamental**,
     **histórico** de simulações e **posição** face às provas oficiais da ACSS.
     Estado pessoal em **IndexedDB** (Dexie); repetição espaçada com **ts-fsrs**.
     Conteúdo (perguntas, taxonomia, dados ACSS) em `/conteudo/pna/` — ver
     `conteudo/pna/LEIA-ME.md`. **Sem comparação entre utilizadores.**
- Separação total **conteúdo ↔ lógica** implementada e validada em todos (ver "Regra de ouro").

O que ainda **não** está feito (é a tua parte — ver Roadmap e **`BACKEND.md`**):
persistência segura das Notas (cifra E2E + sync), contas/login, subscrição e pagamentos.

---

## Stack e porquê

| Peça | Escolha | Porquê |
|---|---|---|
| Framework | **React + Vite** | Simples, rápido, um só código para PC e telemóvel. |
| Offline / instalável | **vite-plugin-pwa** | A app instala-se no telemóvel/PC e funciona sem rede. O conteúdo vai embutido no bundle, por isso está sempre disponível offline. |
| Conteúdo | **Ficheiros JSON** em `/conteudo` | A matéria clínica vive fora do código; atualiza-se sem mexer na app. |
| Backend (mais tarde) | **Supabase** (sugestão) | Login + sincronização de notas com o mínimo de infraestrutura. Ainda não usado. |

---

## Estrutura de pastas

```
medguia/
├── conteudo/                 ← TODA a matéria clínica (a médica edita aqui)
│   ├── LEIA-ME.md            ← guia de edição de conteúdo (para não-programadores)
│   └── ajuste-renal/
│       ├── meta.json         ← títulos, escalões de TFG, estados, disclaimer, bibliografia
│       └── farmacos.json     ← os 178 fármacos × 6 escalões de TFG
│
├── src/                      ← TODA a lógica, UI e identidade visual
│   ├── main.jsx              ← arranque
│   ├── App.jsx               ← shell: ecrã inicial + navegação
│   ├── styles.css            ← design partilhado (variáveis CSS + classes reutilizáveis)
│   ├── design/tokens.js      ← cores semânticas usadas em JS (gravidade, etc.)
│   ├── components/           ← componentes genéricos reutilizáveis
│   ├── lib/                  ← utilitários partilhados
│   └── modules/
│       ├── registo.js        ← ÚNICO sítio onde se "liga" um módulo
│       └── ajuste-renal/
│           ├── AjusteRenal.jsx  ← UI do módulo
│           └── logica.js        ← funções puras (filtros, contagens, agrupamento)
│
├── public/icon.svg
├── index.html
├── vite.config.js
└── package.json
```

---

## ⭐ A regra de ouro: conteúdo ↔ lógica

**`/conteudo` = informação clínica. `/src` = tudo o resto.** Nunca se misturam.

- A médica trabalha **só** em `/conteudo` (texto e tabelas, em JSON). Não precisa de
  saber programar nem de tocar em `/src`.
- O Claude Code trabalha em `/src` (lógica, aspeto, novos módulos). Não inventa nem
  altera o texto clínico que está em `/conteudo`.
- Resultado: a matéria atualiza-se sem risco de partir a app, e a app evolui sem risco
  de estragar a matéria. **O git regista cada alteração — qualquer engano reverte-se.**

O que conta como conteúdo vs lógica:

| Conteúdo (`/conteudo`, JSON) | Lógica / apresentação (`/src`) |
|---|---|
| Doses, fármacos, regras de ajuste | A calculadora que escolhe a regra pela TFG |
| Texto: títulos, notas, bibliografia | Como o texto é mostrado no ecrã |
| Tabela de estadiamento DRC (G1–G5) | O cálculo do estádio a partir da TFG |
| Categorias dos fármacos | As cores e o layout |

---

## Como correr

```bash
npm install        # primeira vez
npm run dev        # servidor de desenvolvimento (abre em localhost)
npm run build      # versão de produção em /dist
npm run preview    # pré-visualizar a build de produção
```

---

## Como adicionar um módulo novo (usar o Ajuste Renal como molde)

Exemplo: adicionar um módulo `<novo>`.

1. **Conteúdo** — criar `conteudo/<novo>/` com:
   - `meta.json` (títulos, textos, e os dados de referência do módulo)
   - os ficheiros de dados que fizerem sentido (ex.: `dados.json`)
2. **Lógica** — criar `src/modules/<novo>/`:
   - `logica.js` — funções **puras**, sem dados clínicos lá dentro (importa-os de `/conteudo`)
   - `<Novo>.jsx` — a UI; reutiliza as classes de `styles.css`
     (`.cartao`, `.lista`, `.campo`, `.filtro`, `.secao-label`, `.rodape`…) e recebe
     as props `accent`, `gradiente`, `onVoltar`
3. **Ligar** — em `src/modules/registo.js`, importar o componente e adicionar a entrada
   com `pronto: true` e `Componente: <Novo>`. (Ver **Sintomas** e **Sinave** como exemplos recentes.)

Regra: o componente importa o seu conteúdo de `@conteudo/...` e nunca tem doses/textos
clínicos escritos no meio do código.

---

## Edição de conteúdo pela médica

Ver **`conteudo/LEIA-ME.md`** — explica como editar os ficheiros JSON em linguagem
simples, com exemplos. Em caso de dúvida, o mais seguro é pedir ao Claude Code:
*"adiciona este fármaco / corrige esta dose"* e dar-lhe a informação em texto normal —
ele edita o JSON sem o partir.

### Convenção de gravidade (importante)

No Ajuste Renal, cada fármaco tem `L` com 6 entradas (uma por escalão de TFG), e cada
entrada traz o estado **explícito** que define a cor e o ícone:

- `s: "ok"` → **verde** · Sem ajuste
- `s: "adjust"` → **amarelo** · Ajustar dose
- `s: "caution"` → **laranja** · Precaução
- `s: "ci"` → **vermelho** · Contraindicado

O campo `t` é a nota mostrada nesse escalão. Quem edita o conteúdo controla a cor pelo
valor de `s` (já não é inferida do texto).

---

## Roadmap

- **Fase 1 — Esqueleto + 1 módulo modelo** ✅
- **Fase 2 — Portar os restantes módulos** ✅ (14 módulos ativos; landing + login não-ligado já existem)
- **Fase 3 — Persistência das Notas** ⬅️ *próximo (ver `BACKEND.md`)*
  - A **interface** das Notas já existe (gestor de doentes só-iniciais + notas com templates),
    mas por agora vive **só na sessão** (não guarda nada). Falta ligar ao armazenamento.
  - Notas sobre a matéria/teoria → sincronizadas pela cloud (não sensíveis).
  - Notas de doentes → **só iniciais** (já garantido na UI) + **cifra ponta-a-ponta
    (zero-knowledge)** (o servidor só guarda texto cifrado) + **chave de recuperação**.
- **Fase 4 — Contas + subscrição**: login + indicador de acesso ("entitlement"), com
  **período de tolerância offline** (a app funciona sem rede e revalida ao voltar a ligação).
- **Fase 5 — Pagamentos**: integração (ex.: Stripe), separável do resto.

---

## Segurança e RGPD (notas)

- O conteúdo clínico é teórico e não sensível → vai embutido em claro (bom para offline).
- O esforço de cifra concentra-se nos **dados de doentes** (Fase 3): só iniciais, cifra
  ponta-a-ponta, servidor sem acesso ao conteúdo legível.
- Tudo sobre HTTPS. Sem dados sensíveis em URLs.
- Isto **não é aconselhamento jurídico**: por ser UE e área clínica, vale a pena uma
  validação RGPD antes do lançamento público.

---

## Para o Claude Code (invariantes — não quebrar)

1. **Conteúdo clínico só em `/conteudo`** (JSON). **Nunca** escrever doses, fármacos ou
   texto clínico dentro de `/src`. **Nunca** alterar o texto clínico por iniciativa
   própria; em caso de dúvida, **perguntar**.
2. **Um só design**: cores/tipografia/raios vêm de `src/styles.css` (variáveis CSS) e de
   `src/design/tokens.js`. Não inventar paletas novas por módulo; reutilizar as classes
   partilhadas. Estilos específicos de um módulo podem viver num CSS próprio (ex.:
   `src/modules/antibioterapia/estilo.css`) **desde que consumam as variáveis partilhadas**
   (`var(--acento)`, `var(--borda)`…) e não redefinam a paleta nem a tipografia.
3. **Módulos ligam-se em `src/modules/registo.js`** e seguem o padrão do Ajuste Renal
   (conteúdo importado de `@conteudo/...`, lógica pura em `logica.js`).
4. **Simplicidade e mudanças cirúrgicas**: o mínimo de código que resolve; tocar só no
   necessário; não refatorizar o que não está partido. (Ver também o `CLAUDE.md`.)
5. **Verificar**: `npm run build` tem de passar sem erros antes de dar uma tarefa por
   concluída.
```
