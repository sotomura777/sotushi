# Conteúdo do módulo PNA

Esta pasta tem **tudo o que o módulo PNA mostra**. Editar aqui não mexe na app — só
no que ela apresenta. Em caso de dúvida, pede ao Claude Code em texto normal
(*"adiciona esta pergunta…"*, *"preenche a PNA 2023 com estes dados…"*).

## Ficheiros

| Ficheiro | O que é |
|---|---|
| `perguntas.jsonl` | **O banco de perguntas.** Uma pergunta por linha (formato JSONL). Normalmente vem do *pipeline* de geração; podes também acrescentar à mão. |
| `taxonomia.json` | Listas válidas (especialidades, subáreas, tipos de raciocínio, dificuldades). Uma pergunta com valores fora destas listas é **rejeitada** ao carregar. |
| `meta.json` | Títulos e textos do módulo. |
| `historico-oficial.json` | Distribuição das notas oficiais da ACSS por ano → usado para "em que lugar terias ficado". Começa vazio. |
| `matrizes-oficiais.json` | Distribuição de áreas por ano → simulações fiéis a um ano. Começa vazio. |
| `presets.json` | Configurações de exame "de fábrica". |

---

## Adicionar uma pergunta (`perguntas.jsonl`)

**Cada pergunta é UMA linha** com este formato (JSON). Os campos com ✱ são obrigatórios:

```json
{"id":"pna-0001","vinheta":"Homem de 68 anos…","lead_in":"Qual é a atitude mais adequada?","opcoes":[{"letra":"A","texto":"…","porque_errada":"…"},{"letra":"B","texto":"…","porque_errada":null},{"letra":"C","texto":"…","porque_errada":"…"},{"letra":"D","texto":"…","porque_errada":"…"},{"letra":"E","texto":"…","porque_errada":"…"}],"correta":"B","explicacao_global":"…","taxonomia":{"especialidade":"Cardiologia","subarea":"Arritmias","patologia":"Fibrilhação auricular","tipo_raciocinio":"Tratamento"},"tags":["fa","cardioversao"],"farmacos_referenciados":["amiodarona"],"scores_referenciados":["CHA2DS2-VASc"],"exames_referenciados":["ECG"],"dificuldade":"média","tempo_medio_esperado_s":90,"guidelines_fonte":["Norma 015/2019 · Fibrilhação auricular"],"ano_geracao":2026,"tem_imagem":false}
```

- ✱ **`id`** — único (não repetir).
- ✱ **`vinheta`** — o caso clínico. **`lead_in`** — a pergunta.
- ✱ **`opcoes`** — lista de 2 a 5 (normalmente 5: A–E). Cada opção tem `letra`, `texto`
  e `porque_errada` (texto da explicação; `null` na opção certa).
- ✱ **`correta`** — a letra certa (tem de existir nas opções).
- **`explicacao_global`** — explicação mostrada no fim (modo Treino).
- ✱ **`taxonomia.especialidade`** e **`tipo_raciocinio`** — **têm de existir na
  `taxonomia.json`** (senão a pergunta é rejeitada). `subarea`/`patologia` são livres
  mas a `subarea` é validada se a especialidade tiver subáreas declaradas.
- **`dificuldade`** — `"fácil"`, `"média"` ou `"difícil"`.
- **`tags`, `farmacos_referenciados`, `scores_referenciados`, `exames_referenciados`,
  `guidelines_fonte`** — listas (alimentam filtros e as estatísticas por norma/fármaco).
- **`tempo_medio_esperado_s`** — usado para o ritmo do exame. **`tem_imagem`** — `true/false`.

> As 3 perguntas que vêm de origem têm `"exemplo":true` — são descartáveis: o pipeline
> substitui o ficheiro inteiro, ou apagam-se essas linhas.

**Regras do JSONL:** uma linha = uma pergunta, sem vírgula no fim da linha; o texto entre
aspas direitas (`"`), não curvas. Para confirmar que não partiste nada: `npm run build`.

---

## Preencher os dados oficiais da ACSS

Enquanto estes ficheiros estiverem vazios (`"anos": {}`), o módulo mostra a posição como
"adicionar dados ACSS" — tudo o resto funciona. Quando tiveres os dados públicos:

**`historico-oficial.json`** — por ano:
```json
"anos": {
  "2023": { "candidatos": 2300, "media": 0.64, "desvio_padrao": 0.11,
            "percentis": { "p10": 0.48, "p25": 0.56, "p50": 0.66, "p75": 0.74, "p90": 0.82 } }
}
```
Se a ACSS não publicar os percentis, basta `media` + `desvio_padrao` (a app aproxima).

**`matrizes-oficiais.json`** — distribuição de áreas por ano (frações que somam ~1):
```json
"anos": {
  "2023": { "total_perguntas": 150, "duracao_minutos": 240,
            "distribuicao": { "Cardiologia": 0.12, "Medicina Geral e Familiar": 0.15 } }
}
```

---

## O que NUNCA muda aqui

- **Não há comparação entre utilizadores** — só posição face às provas oficiais da ACSS.
- O conteúdo clínico vive **só** nesta pasta; a app nunca o reescreve sozinha.
