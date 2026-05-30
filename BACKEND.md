# BACKEND.md — o que falta construir (briefing para o Claude Code)

> Lê primeiro o `README.md` (arquitetura + invariantes) e o `CLAUDE.md` (regras).
> Este ficheiro foca-se **só na tua parte**: a app já tem os 8 módulos clínicos
> portados e a funcionar offline. Falta a camada de dados/conta.

---

## 1. Onde está o projeto

- **8 módulos clínicos prontos** (`pronto: true` em `src/modules/registo.js`), a compilar
  (`npm run build` passa) e a funcionar **offline** — o conteúdo vai embutido no bundle.
- **Regra de ouro respeitada:** matéria clínica só em `/conteudo` (JSON), lógica/UI em `/src`.
- 7 dos 8 módulos são **referência/cálculo puros** — não precisam de backend nenhum.
- O único que precisa de ti é o **Notas Clínicas**, e há trabalho transversal de
  **conta + subscrição + pagamentos**.

---

## 2. O que cada módulo espera de ti

| Módulo | Precisa de backend? |
|---|---|
| Ajuste Renal, Antibioterapia, Análises+GSA, Vacinação, Vig. Infantil, Urgência, Calculadoras | **Não.** Funcionam offline, sem dados do utilizador. |
| **Notas Clínicas** | **Sim** — falta o armazenamento (ver §3). A interface está feita. |
| **App inteira** | **Sim** — gate de conta/subscrição à entrada (ver §4 e §5). |

---

## 3. Notas Clínicas — ligar o armazenamento (Fase 3)

### Estado atual da UI
- Ficheiros: `src/modules/notas/Notas.jsx` (estado), `logica.js` (`paraIniciais`, `uid`, `hojeISO`),
  `conteudo/notas/config.json` (especialidades, separadores+templates, cores, prioridades).
- Hoje os doentes/notas vivem em `useState` — **não persistem** (some tudo ao recarregar).
  Há um banner a dizer isso ao utilizador. A tua tarefa é meter um **store persistente** por
  baixo deste estado (idealmente sem reescrever a UI: trocar o `useState` por um hook que
  lê/escreve no store).

### Modelo de dados (o que a UI já produz)
```js
doente = {
  id: string,
  iniciais: string,        // JÁ só iniciais — ver regra crítica abaixo
  prioridade: "green"|"yellow"|"orange"|"red",
  especialidade: string,   // id de config.json (ex.: "medicina_interna")
  observado: boolean,      // false = ativo, true = "arquivado/observado"
  criadoEm: string,        // "YYYY-MM-DD"
  notas: {                 // por separador
    diario:    [ nota, ... ],
    admissao:  [ nota, ... ],
    alta:      [ nota, ... ],
  }
}
nota = { id: string, data: "YYYY-MM-DD", texto: string, feito: boolean }
```

### REGRA CRÍTICA (não quebrar)
- O campo de identificação do doente **é só iniciais** — `logica.js > paraIniciais()` converte
  o nome no momento de criar e **o nome completo nunca entra no estado**. Mantém isto.
- Mesmo sendo iniciais, **os dados de doente são sensíveis** → trata o objeto `doente`
  inteiro (iniciais + todas as notas) como conteúdo a **cifrar ponta-a-ponta**.

### O que construir
1. **Armazenamento local offline primeiro** (a app é PWA/offline-first): guardar os doentes
   em **IndexedDB** no dispositivo. (Nota: a app corre como Vite app real — IndexedDB/Web
   Crypto funcionam; só não usar `localStorage` dentro de artefactos do claude.ai.)
2. **Cifra ponta-a-ponta (zero-knowledge)** dos dados de doente antes de saírem do dispositivo:
   - Chave derivada da credencial do utilizador (ex.: Argon2/PBKDF2 sobre a password) **ou**
     chave aleatória por utilizador protegida por essa credencial.
   - Cifra no cliente (WebCrypto AES-GCM ou libsodium). O servidor guarda **só o blob cifrado**
     — nunca vê iniciais nem texto.
   - **Chave de recuperação** gerada no registo (mostrar uma vez, o utilizador guarda).
3. **Sincronização** entre dispositivos do blob cifrado (PC↔telemóvel). Estratégia simples
   no início (last-write-wins por doente, com `updatedAt`); evoluir se preciso.
4. **Notas de teoria/matéria** (separadas das de doente): estas **não são sensíveis** →
   sync normal pela cloud, associadas à conta (não exigem E2E). Hoje ainda não há um módulo
   de "notas de teoria" dedicado — se for preciso, segue o padrão dos outros módulos.

---

## 4. Contas + subscrição (Fase 4)

- **Login/conta**: sugestão **Supabase Auth** (mínimo de infraestrutura). Decisão tua — usa o
  que conseguires **testar**.
- **Entitlement** (tem/não tem acesso): um indicador por utilizador.
- **Tolerância offline**: a app tem de **funcionar sem rede**. Guardar localmente o estado de
  subscrição com uma validade (ex.: válido por X dias offline) e **revalidar** quando voltar a
  haver ligação. Nunca bloquear o uso offline legítimo por falta momentânea de rede.
- O gate de subscrição é **à entrada da app**, não dentro de cada módulo (mantém os módulos
  agnósticos a contas).

---

## 5. Pagamentos (Fase 5)

- Integração separável (ex.: **Stripe Checkout** + webhook → atualiza o entitlement).
- Manter desacoplado: o resto da app não deve depender do fornecedor de pagamentos.

---

## 6. Stack sugerida (não obrigatória)

- **Supabase** (Auth + Postgres + storage do blob cifrado) — login e sync com pouca infra.
- **WebCrypto** ou **libsodium-wrappers** — cifra E2E no cliente.
- **IndexedDB** (ex.: via `idb`) — cache offline-first no dispositivo.
- **Stripe** — pagamentos.

---

## 7. Invariantes a respeitar (recap — ver README e CLAUDE.md)

1. **Não tocar no conteúdo clínico** em `/conteudo`. Não inventar/alterar doses ou texto.
2. **Um só design**: reutilizar `src/styles.css` (variáveis CSS) e as classes partilhadas.
   Estilos de módulo só num CSS próprio que **consuma** as variáveis (não redefinir paleta).
3. **Módulos ligam-se em `src/modules/registo.js`**; lógica pura em `logica.js`.
4. **Offline-first**: nada do que acrescentares pode partir o funcionamento sem rede dos
   módulos clínicos.
5. **`npm run build` tem de passar** antes de dar qualquer tarefa por concluída.
6. **Mudanças cirúrgicas**: o mínimo que resolve; não refatorizar o que não está partido.

---

## 8. Segurança / RGPD (notas, não é aconselhamento jurídico)

- Conteúdo clínico = teórico, não sensível → claro/embutido (bom para offline).
- Dados de doente = sensíveis → **só iniciais + E2E zero-knowledge**; servidor sem acesso ao
  legível. Manter o aviso "não inserir doentes reais" enquanto fizer sentido.
- Tudo sobre HTTPS; sem dados sensíveis em URLs. Por ser UE + área clínica, vale uma
  validação RGPD antes do lançamento público.
