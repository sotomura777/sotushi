# CLAUDE.md — AllinMed

Regras específicas deste projeto. **Complementam** o CLAUDE.md global
(`~/.claude/CLAUDE.md`) e, onde indicado, **substituem-no** — em caso de conflito,
**este ficheiro manda**.
**Ler o `README.md` primeiro** — tem a arquitetura completa e o "como adicionar um módulo".

## Stack e convenções deste projeto (override ao global)

O CLAUDE.md global assume TypeScript + Next.js + Tailwind + shadcn + Vercel + pnpm.
**A AllinMed NÃO usa nada disso.** Aqui:

- **JavaScript** (não TypeScript) — ficheiros `.jsx`/`.js`.
- **React + Vite** (não Next.js) — PWA via `vite-plugin-pwa`.
- **CSS próprio** com variáveis em `src/styles.css` + `src/design/tokens.js`
  (**não** Tailwind nem shadcn — ver invariante "um só design").
- **Ícones próprios** (`src/components/icones*.jsx`, mosaico `.mg-ictile`) — não Lucide/Phosphor.
- **npm** (não pnpm). Estado local: `localStorage` + IndexedDB (Dexie).
- **Git**: repo solo, trabalha-se **direto em `main`**, mensagens em **português**,
  terminadas com o trailer `Co-Authored-By` habitual. (O global pede inglês/branches —
  não se aplica aqui.)

## Invariantes (não quebrar)

1. **Conteúdo clínico vive só em `/conteudo`** (ficheiros JSON). Nunca escrever doses,
   fármacos, scores ou texto clínico dentro de `/src`. Nunca alterar texto clínico por
   iniciativa própria — em caso de dúvida, **perguntar ao utilizador**.
2. **`/src` é lógica + UI + identidade visual.** A informação que mostra vem importada de
   `@conteudo/...`.
3. **Um só design.** Cores, tipografia, raios e sombras vêm de `src/styles.css` (variáveis
   CSS) e de `src/design/tokens.js`. Reutilizar as classes partilhadas (`.cartao`,
   `.lista`, `.lista-item`, `.campo`, `.filtro`, `.secao-label`, `.rodape`, `.hero`…).
   Estilos próprios de um módulo são permitidos num CSS do módulo (ex.:
   `modules/interacoes/estilo.css`) **desde que consumam as variáveis partilhadas** e
   não redefinam a paleta nem a tipografia. Não criar sistemas de estilo paralelos.
4. **Módulos ligam-se num só sítio:** `src/modules/registo.js`. Cada módulo segue o padrão
   do Ajuste Renal: conteúdo em `/conteudo/<modulo>/`, lógica **pura** em
   `src/modules/<modulo>/logica.js`, UI em `src/modules/<modulo>/<Modulo>.jsx` recebendo
   `accent`, `gradiente`, `onVoltar`.
5. **Lógica pura sem dados embutidos.** As funções em `logica.js` não contêm tabelas
   clínicas; recebem os dados como argumento ou são usadas sobre o conteúdo importado.

## Enquadramento de estudo (regra para módulos clínicos sensíveis)

Esta app é uma **ferramenta de estudo e treino**, não uma ferramenta de apoio à
decisão clínica. Esta distinção não é cosmética — define o que a app pode ou não
fazer, e tem de ser respeitada em todos os módulos que interpretem dados ou apoiem
diagnóstico.

### A linha que separa as duas coisas

- **Estudo/treino (PERMITIDO):** ensina a raciocinar. O utilizador trabalha um
  *caso*, arrisca o seu raciocínio, e a app explica/corrige. A app nunca decide
  pelo utilizador nem produz documentação para um doente real.
- **Apoio à decisão (A EVITAR):** o utilizador mete os dados do *seu doente* e a app
  devolve diagnóstico, conduta ou uma nota clínica pronta a usar. Isto é função de
  dispositivo médico (MDR, Regra 11, tipicamente Classe IIa) — fora do âmbito.

Mudar só o rótulo não chega: a **função** e o **enquadramento** têm de ser de estudo.

### Molde obrigatório para módulos de diagnóstico/interpretação

Qualquer módulo novo deste tipo nasce já assim:

1. **Propósito no topo.** Banner visível: "Ferramenta de estudo. Não se destina a
   apoiar decisões sobre doentes reais." Subtítulo em registo de treino.
2. **Entrada = caso, não doente.** Rótulos "Dados do caso" (nunca "Contexto do
   doente"). Nos textos de input usa "o caso"/"neste caso". (Exceção: nas explicações
   didáticas, "o doente" descreve o quadro típico e mantém-se — ex.: "na cólica renal
   o doente não pára quieto".)
3. **Raciocínio primeiro.** Antes de revelar qualquer resposta, o utilizador
   compromete-se com uma hipótese. A app só depois mostra o resultado e dá feedback
   (sem censura, só estudo).
4. **Saída em discussão/condicional, não veredicto/ordem.** "Neste caso, a hipótese
   mais provável seria…", "o exame que ajudaria seria…". Nunca "Diagnóstico: X" como
   facto, nem "Pedir/Administrar/Fazer" como ordem.
5. **Sem nota clínica de documentação.** Se mostrares uma nota, é "Exemplo de
   nota-modelo" (gabarito de um caso), idealmente depois de o utilizador escrever a
   dele. Botões de copiar dizem "Copiar exemplo", não "Copiar nota".

### O que NÃO precisa deste molde

- **Referência pura** (textos, tabelas de valores, calendários, guias de fármacos):
  é informação, fica como está.
- **Calculadoras aritméticas simples** (poucas variáveis, verificáveis de cabeça,
  ex.: dose = peso × mg/kg com teto): não são dispositivo, ficam como estão. Não as
  "estudifiques" — só perdes utilidade sem ganho.
- **Notas Clínicas:** o risco aqui é de **dados (RGPD)**, não de dispositivo médico.
  Resolve-se com campo só-iniciais + cifra ponta-a-ponta, não com linguagem.

### Tabela rápida imperativo → ensino

| Em vez de… | Usar… |
|---|---|
| Pedir hemograma, ferritina | O estudo analítico incluiria… |
| Ferro oral em 1ª linha | Num caso assim, a 1ª linha seria… |
| Transfusão se Hb < 7 | Estaria indicada transfusão se Hb < 7 (manter o limiar) |
| EDA + colonoscopia obrigatórias | A investigação incluiria EDA e colonoscopia |
| Diagnóstico mais provável | Discussão do caso · a hipótese mais provável seria |
| Nota clínica | Exemplo de nota-modelo |
| Conduta / Exames a pedir | Conduta esperada (para estudo) / Que exames se considerariam |

**Regra de ouro ao reformular conteúdo clínico:** muda só a moldura verbal, **nunca o
sentido** — não toques em doses, limiares, fármacos ou indicações. Lista sempre as
frases alteradas para revisão clínica.

> **Aviso (não é aconselhamento jurídico):** este molde reduz o risco regulatório, não
> o elimina. Antes de comercializar publicamente na UE, a app deve ser validada por um
> consultor de dispositivos médicos / digital health, que confirma onde está a linha.

## Processo

- **Simplicidade primeiro**: o mínimo de código que resolve o problema. Nada especulativo.
- **Mudanças cirúrgicas**: tocar só no necessário; não refatorizar o que não está partido.
- **Verificar antes de concluir**: `npm run build` tem de passar sem erros.
- **Preservar a informação**: ao portar um módulo a partir dos ficheiros originais, manter
  o texto clínico fiel. Quando extrair dados de ficheiros grandes, preferir extração
  automática (script) a retranscrição manual, para não introduzir erros.

## Roadmap (resumo — detalhe no README e no BACKEND.md)

Fase 1 esqueleto ✅ · Fase 2 módulos portados ✅ (**14 módulos ativos**) · **Fase 3
(próximo): persistência das Notas** (teoria via cloud; doentes só-iniciais com cifra
ponta-a-ponta + chave de recuperação) · Fase 4 contas + subscrição (com tolerância
offline) · Fase 5 pagamentos. Já existe uma **landing + login (ainda não ligado)** como
gancho para a Fase 4.
**Ler o `BACKEND.md`** — tem o spec da tua parte (modelos de dados e o que cifrar).
