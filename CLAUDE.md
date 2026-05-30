# CLAUDE.md — MedGuia

Regras específicas deste projeto (complementam as guidelines gerais de coding).
**Ler o `README.md` primeiro** — tem a arquitetura completa e o "como adicionar um módulo".

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
   `modules/antibioterapia/estilo.css`) **desde que consumam as variáveis partilhadas** e
   não redefinam a paleta nem a tipografia. Não criar sistemas de estilo paralelos.
4. **Módulos ligam-se num só sítio:** `src/modules/registo.js`. Cada módulo segue o padrão
   do Ajuste Renal: conteúdo em `/conteudo/<modulo>/`, lógica **pura** em
   `src/modules/<modulo>/logica.js`, UI em `src/modules/<modulo>/<Modulo>.jsx` recebendo
   `accent`, `gradiente`, `onVoltar`.
5. **Lógica pura sem dados embutidos.** As funções em `logica.js` não contêm tabelas
   clínicas; recebem os dados como argumento ou são usadas sobre o conteúdo importado.

## Processo

- **Simplicidade primeiro**: o mínimo de código que resolve o problema. Nada especulativo.
- **Mudanças cirúrgicas**: tocar só no necessário; não refatorizar o que não está partido.
- **Verificar antes de concluir**: `npm run build` tem de passar sem erros.
- **Preservar a informação**: ao portar um módulo a partir dos ficheiros originais, manter
  o texto clínico fiel. Quando extrair dados de ficheiros grandes, preferir extração
  automática (script) a retranscrição manual, para não introduzir erros.

## Roadmap (resumo — detalhe no README e no BACKEND.md)

Fase 1 esqueleto ✅ · Fase 2 os 8 módulos portados ✅ · **Fase 3 (próximo): persistência
das Notas** (teoria via cloud; doentes só-iniciais com cifra ponta-a-ponta + chave de
recuperação) · Fase 4 contas + subscrição (com tolerância offline) · Fase 5 pagamentos.
**Ler o `BACKEND.md`** — tem o spec da tua parte (modelos de dados e o que cifrar).
