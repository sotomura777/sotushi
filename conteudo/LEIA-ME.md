# Como editar o conteúdo (guia simples)

Esta pasta (`conteudo/`) tem **toda a matéria clínica** da app. Podes editar aqui sem
mexer no resto. Os ficheiros estão em formato **JSON** — é basicamente texto com algumas
regras de pontuação. Não é preciso saber programar.

> **Atalho seguro:** em vez de editares à mão, podes pedir ao Claude Code em texto
> normal — *"adiciona a Dapagliflozina com estas doses…"* ou *"corrige a dose do
> Ramipril"* — e dar-lhe a informação. Ele edita o ficheiro sem o partir. É a forma menos
> arriscada, sobretudo no início.

---

## O que há em cada módulo

Cada módulo tem a sua pasta. Por exemplo, `ajuste-renal/`:

- **`meta.json`** — os textos do módulo: título, subtítulo, a tabela de estadiamento
  (G1–G5), a **nota** de rodapé, a **bibliografia** e a **legenda**.
- **`farmacos.json`** — a lista de fármacos e as regras de ajuste.

---

## Editar um fármaco (`farmacos.json`)

Cada fármaco é um bloco assim:

```json
{
  "cat": "Antibióticos",
  "sub": "Penicilinas",
  "name": "Amoxicilina",
  "range": "Até 4g/dia",
  "adjust": [
    { "min": 30, "max": 999, "note": "Sem ajuste" },
    { "min": 10, "max": 29, "note": "Máx 1000mg/dia" },
    { "min": 0, "max": 9, "note": "Máx 500mg/dia" }
  ]
}
```

- **`cat`** = categoria (ex.: "Antibióticos"). **`sub`** = subgrupo (ex.: "Penicilinas").
- **`range`** = intervalo de dose habitual (texto livre).
- **`adjust`** = as regras. Cada regra cobre um intervalo de TFG (`min` a `max`, inclusive)
  e a `note` é o que aparece ao utilizador. Usa `999` como "sem limite superior".
- Opcional: `"updated": "2025"` mostra uma etiqueta "ATUALIZADO 2025".

### A cor da nota é automática

A cor (verde/azul/laranja/vermelho) vem das **palavras** da nota:

| Se a nota tiver… | Fica… |
|---|---|
| `⛔` ou "Contraindicado" ou "Suspender" | 🔴 vermelho (CI) |
| `⚠️` ou "Não recomendado" ou "Evitar" ou "Não deve" | 🟠 laranja (Cuidado) |
| "Sem ajuste" ou "Sem necessidade" | 🟢 verde (OK) |
| qualquer outra coisa | 🔵 azul (Ajustar) |

Para marcar algo como contraindicado, escreve `⛔` ou a palavra "Contraindicado" na nota.

---

## Editar os textos (`meta.json`)

Mudar o título, a nota de rodapé ou a bibliografia é só editar o texto entre aspas.
A tabela de estadiamento (`estadios`) raramente muda — cada linha tem o limiar (`min`),
o nome do estádio e a cor.

---

## Regras de ouro do JSON (para não partir o ficheiro)

1. **Aspas** à volta de todo o texto: `"Sem ajuste"`, não `Sem ajuste`.
2. **Vírgula** entre itens, **mas não** depois do último de uma lista.
3. Chavetas `{ }` e parênteses retos `[ ]` têm de **fechar todos**.
4. Não trocar `"` por aspas "curvas" (“ ”) — só aspas direitas.

### Como confirmar que não partiste nada

Depois de guardar, no terminal dentro da pasta do projeto:

```bash
npm run build
```

Se aparecer um erro a apontar para o ficheiro, é porque falta uma vírgula ou uma aspa.
Se quiseres voltar atrás, o git guarda todas as versões — dá para reverter ao original.
