# Auditoria de Conteúdo — Direitos de Autor (Triagem)

> **Natureza deste documento.** Isto é uma **triagem para revisão humana**, não um
> parecer jurídico nem uma afirmação de que existe violação. Tudo o que aqui se
> assinala é **"a verificar a origem / a confirmar a licença"**. Atribuir uma fonte
> (citá-la) **não é o mesmo** que ter autorização para reproduzir o seu conteúdo.
> Nenhum conteúdo foi alterado para produzir este relatório.
>
> Data da triagem: 2026-06-02 · Âmbito: `conteudo/**` + textos clínicos em `src/modules/**`.

---

## 1. Resumo executivo — risco ALTO a tratar primeiro

| # | Módulo / item | Porquê é prioritário |
|---|---|---|
| 1 | **Antibioterapia** (`antibioterapia/dados.json`, `meta.json`) e **Calculadoras** (`calculadoras/doses.json`) | Reproduzem de perto um **guia institucional publicado** — "Guia de Bolso de Antibioterapia em Ambulatório, Ed. 1.3, ARS LVT / PAPA". Estrutura, tabelas fármaco+dose, códigos ICPC e notas parecem decalcadas do documento original. Atribuição existe, mas **falta confirmar autorização de reprodução** com a ARS LVT/PAPA. |
| 2 | **M-CHAT-R/F** (`saude-infantil/mchat.json`) | As 20 perguntas são um **instrumento com direitos** (© Robins, Fein, Barton). Uso clínico costuma ser gratuito mas a **redistribuição/derivados têm termos próprios** — confirmar licença antes de incluir o questionário literal numa app. |
| 3 | **Critérios de Roma IV** (`urgencia/obstipacao.json`, FAQ/algoritmo) | Os critérios de Roma IV são **propriedade da Rome Foundation**. Reproduzir os critérios literais exige licença — confirmar. |
| 4 | **Farmacologia na Grávida** (`farmacos-gravidez/medicamentos.json`) | Resumos de risco de 122 fármacos potencialmente derivados de **Briggs (Drugs in Pregnancy & Lactation)** e **Drugs.com** — ambos **obras proprietárias com copyright**. Verificar se o texto é original ou paráfrase próxima. |
| 5 | **Ajuste Renal** (`ajuste-renal/farmacos.json`) | Fontes incluem **UpToDate®** (subscrição/proprietário). Se as notas de ajuste forem copiadas/parafraseadas de perto do UpToDate, há risco. Os limiares são factos, mas a compilação/fraseado pode não ser. |
| 6 | **Vacinação** (`vacinacao/view-*.html`) | Replica o **PNV 2025** e o **Livro Azul de Vacinas (DGS)** — conteúdo oficial do Estado. Bem atribuído (cita Normas), mas confirmar condições de reutilização de conteúdo DGS. |

> Os restantes módulos têm risco Médio/Baixo (detalhe por módulo abaixo).

---

## 2. Análise por módulo

### Antibioterapia (`conteudo/antibioterapia/`)
| Item | Tipo de risco | Nível | O que verificar / ação sugerida |
|---|---|---|---|
| `dados.json` — estrutura especialidade→patologia→linhas de ATB com dose | Texto/estrutura possivelmente decalcada de guia publicado | **Alto** | Confirmar com ARS LVT / PAPA se a reprodução do "Guia de Bolso" é autorizada; se não, reescrever em formato próprio ou obter licença. |
| Códigos **ICPC-2** (ex.: "ICPC 2 – R72") | Classificação licenciada (WONCA/WHO) | Médio | Confirmar termos de uso do ICPC-2. |
| Notas "viral_note", critérios de referência | Fraseado institucional | Médio | Verificar origem (parece de guideline/guia). |

### Calculadoras (`conteudo/calculadoras/doses.json`)
| Item | Tipo de risco | Nível | O que verificar / ação sugerida |
|---|---|---|---|
| Esquemas de dose pediátrica (mg/kg, tetos, durações) | Derivado do guia PAPA ARS LVT | **Médio-Alto** | Mesma verificação que Antibioterapia. Doses isoladas são factos, mas o conjunto/seleção segue o guia. Sem atribuição **inline** no JSON (só no rodapé do componente). |

### Vacinação (`conteudo/vacinacao/*.html`, `viajante.json`)
| Item | Tipo de risco | Nível | O que verificar / ação sugerida |
|---|---|---|---|
| Esquema PNV 2025 (timeline crianças/adultos) | Conteúdo oficial DGS reproduzido | **Médio-Alto** | Confirmar reutilização de conteúdo DGS/PNV. Bem atribuído (Normas 013/2024, 005/2025, 006/2016). |
| "Livro Azul de Vacinas (DGS)" — matrizes de grupos de risco, pré-termo (Cap. 5) | Decalque de publicação oficial | **Médio-Alto** | Idem; confirmar condições do Livro Azul. |
| Consulta do viajante (`view-travel.html`, `viajante.json`) | Texto de referência | Médio | Verificar origem das recomendações por destino. |

### Saúde Infantil / Vigilância (`conteudo/saude-infantil/`)
| Item | Tipo de risco | Nível | O que verificar / ação sugerida |
|---|---|---|---|
| `mchat.json` — 20 perguntas M-CHAT-R/F | Instrumento com direitos | **Alto** | Confirmar licença M-CHAT-R/F (© Robins/Fein/Barton) para incluir as perguntas literais. |
| `crescimento.json` — dados de percentis (peso/altura/PC/IMC) | Dados de curvas **OMS** + PNSIJ | Médio | Confirmar termos de uso dos dados OMS; **sem atribuição inline** (acrescentar "OMS / DGS"). |
| `consultas.json` + `detalhes.json` — "Avaliar/Antecipar/Alertas" por idade | Estrutura próxima do **PNSIJ (DGS)** | **Médio-Alto** | Verificar quão próximo está do programa oficial; reescrever em linguagem própria onde for decalque. |
| `ferramentas.json` — acuidade visual por idade, TA por percentil, flúor | Tabelas de referência (OMS/DGS/PNPSO) | Médio | Confirmar origem das tabelas (TA pediátrica por percentil, cheque-dentista PNPSO). |
| Tanner (`tanner.js`, `ferramentas.json`) | Escala clínica | Médio | Conceito é de domínio público; confirmar origem das **descrições** dos estádios. |
| Snellen / "Mary Sheridan" (`ferramentas.json`, `detalhes.json`) | Instrumentos de avaliação | Médio | Snellen é público; **Mary Sheridan** (teste de desenvolvimento) pode ter direitos — confirmar. |
| EPDS / "Edinburgh Postnatal Depression Scale" (`detalhes.json`) | Instrumento referido | Médio-Alto | EPDS (© Cox et al./RCPsych) — uso livre com condições; confirmar. (Aqui é **mencionado**, não reproduzido — verificar se em algum sítio se reproduz o questionário.) |

### Crónicas / Défice de Ferro (`conteudo/cronicas/`)
| Item | Tipo de risco | Nível | O que verificar / ação sugerida |
|---|---|---|---|
| `defice-ferro.json` — guiaPrático (HTML), FAQ, algoritmo | Prosa que segue guidelines (BSG 2021, ESC, WGO, DGS) | Médio | Bem referenciado. Verificar se passagens longas são **paráfrase próxima** de guidelines (a verificar a origem). |
| Fórmula de Ganzoni (FAQ) | Fórmula clínica | Baixo | Domínio público; ok. |
| `doencas.json` — índice de patologias | Lista | Baixo | Sem atribuição (provavelmente original); confirmar. |

### Urgência / Obstipação (`conteudo/urgencia/`)
| Item | Tipo de risco | Nível | O que verificar / ação sugerida |
|---|---|---|---|
| **Critérios Roma IV** (`obstipacao.json`) | Critérios com direitos (Rome Foundation) | **Alto** | Confirmar licença para reproduzir os critérios. |
| **Escala de Bristol** (`obstipacao-algoritmo.json`) | Instrumento (Bristol Stool Chart) | Médio | Confirmar licença de uso/descrições. |
| guiaTeórico / Tratamento / FAQ | Prosa que segue WGO/AGA-ACG | Médio | Bem referenciado; verificar paráfrase próxima. |
| `indice.json` — sintomas/suspeitas por sistema | Lista estruturada | Baixo | Provavelmente original. |

### Análises & GSA (`conteudo/analises/`)
| Item | Tipo de risco | Nível | O que verificar / ação sugerida |
|---|---|---|---|
| `parametros.json` — intervalos de referência | Factos numéricos (variam com lab) | Baixo | Números não são, em geral, protegíveis; ok (rodapé já avisa que variam). |
| `parametros.json`/`param_info.json` — textos `lo`/`hi`/interpretação | Texto autorado, possível paráfrase de manuais | Médio | `biblio.json` cita Harrison's, Goldman-Cecil, Oxford Handbook — confirmar que a interpretação é **original**, não decalcada destes manuais (proprietários). |
| Scores citados (ISTH DIC, etc.) | Instrumentos | Médio | Confirmar licença de cada score usado. |

### Ajuste Renal (`conteudo/ajuste-renal/`)
| Item | Tipo de risco | Nível | O que verificar / ação sugerida |
|---|---|---|---|
| `farmacos.json` — regras de ajuste por TFG | Compilação possivelmente derivada de **UpToDate®/Drugs.com/Medscape** | **Médio-Alto** | Limiares são factos; confirmar que as **notas/fraseado** não são copiados de fontes proprietárias (sobretudo UpToDate®). |
| Estadiamento DRC G1–G5 | KDIGO 2024 | Baixo-Médio | Conceito amplamente usado; atribuído. |

### Farmacologia na Grávida (`conteudo/farmacos-gravidez/`)
| Item | Tipo de risco | Nível | O que verificar / ação sugerida |
|---|---|---|---|
| `medicamentos.json` — risco/razão/alternativas (122 fármacos) | Possível derivação de **Briggs** e **Drugs.com** (proprietários) | **Médio-Alto** | Verificar se `reason`/`safetyNote` são originais ou paráfrase próxima. |
| Categorias FDA A/B/C/D/X | Sistema público (FDA), **retirado em 2015** | Baixo | Sem risco de direitos; nota: meta já assinala a substituição pelo PLLR. |

### Notas Clínicas (`conteudo/notas/config.json`)
| Item | Tipo de risco | Nível | O que verificar / ação sugerida |
|---|---|---|---|
| Separadores e templates | Estrutura criada pelo utilizador | Baixo | Sem texto clínico de terceiros. |

---

## 3. Escalas, questionários e instrumentos (lista completa) — licença a confirmar

> **Nenhum** destes deve ser assumido como "livre". Cada um exige verificação individual.

| Instrumento | Onde é usado | Nota de licença |
|---|---|---|
| **M-CHAT-R/F** | `saude-infantil/mchat.json`, `SaudeInfantil.jsx` | © Robins/Fein/Barton — **licença a confirmar** (uso clínico vs. redistribuição em app). |
| **Estádios de Tanner** | `saude-infantil/tanner.js`, `Tanner.jsx`, `ferramentas.json` | Conceito público; **descrições — origem a confirmar**. |
| **Curvas/percentis OMS** (peso, altura, PC, IMC) | `saude-infantil/crescimento.json`, `crescimento.js` | Dados OMS — **termos de uso a confirmar**. |
| **TA pediátrica por percentil** (sexo/idade/altura) | `saude-infantil/ferramentas.json`, `FerramentasExtra.jsx` | Tabelas (origem provável: norma/guideline) — **a confirmar**. |
| **Snellen** (acuidade visual) | `saude-infantil/ferramentas.json` (Snellen) | Conceito público; tabela por idade — **a confirmar**. |
| **Mary Sheridan** (desenvolvimento) | `saude-infantil/ferramentas.json`/`detalhes.json` | **Licença a confirmar**. |
| **EPDS** (Edinburgh) | `saude-infantil/detalhes.json` (mencionado) | **Licença a confirmar** (e verificar se é reproduzido). |
| **Critérios Roma IV** | `urgencia/obstipacao.json` | Rome Foundation — **licença a confirmar**. |
| **Escala de Bristol** | `urgencia/obstipacao-algoritmo.json` | **Licença a confirmar**. |
| **Centor / McIsaac** | `antibioterapia/dados.json` | Score público; **a confirmar** fonte das descrições. |
| **Fórmula de Ganzoni** | `cronicas/defice-ferro.json` (FAQ) | Domínio público — provavelmente livre. |
| **NYHA** | `cronicas/defice-ferro.json` | Público. |
| **Score ISTH (CID)** e outros scores | `analises/biblio.json` / interpretações | **A confirmar** caso a caso. |
| **Categorias FDA gravidez (A–X)** | `farmacos-gravidez/*` | Sistema público (retirado 2015). |
| **ICPC-2** (códigos) | `antibioterapia/dados.json` | Classificação licenciada — **a confirmar**. |
| **Estadiamento DRC KDIGO (G1–G5)** | `ajuste-renal/meta.json` | Amplamente usado; atribuído. |

---

## 4. Atribuição de fontes — módulos que beneficiariam de a ter (ou reforçar)

| Módulo | Situação atual | Sugestão |
|---|---|---|
| Antibioterapia | Atribuído (ARS LVT / PAPA, Ed. 1.3) | Manter; **falta autorização**, não atribuição. |
| Calculadoras | Fonte só no rodapé do componente, **não no JSON** | Acrescentar fonte inline (PAPA) e nota de licença. |
| Saúde Infantil — `crescimento.json` | **Sem atribuição inline** | Acrescentar "Dados OMS / DGS PNSIJ" + termos. |
| Saúde Infantil — `consultas.json`/`detalhes.json` | Atribuição parcial (PNSIJ no rodapé) | Reforçar fonte e versão do PNSIJ. |
| Análises | `biblio.json` lista manuais | Bom; confirmar que interpretação é original. |
| Crónicas — `doencas.json` | Sem atribuição | Confirmar origem (provável original). |
| Urgência — `indice.json` | Sem atribuição | Provável original; confirmar. |
| Ajuste Renal | Atribuído (RCM, UpToDate®, Drugs.com, KDIGO) | Verificar dependência de fontes **proprietárias**. |
| Farmacologia na Grávida | Atribuído (Briggs, Drugs.com, INFARMED, FDA, EMA) | Verificar derivação de fontes **proprietárias**. |
| Vacinação | Bem atribuído (DGS/PNV/Livro Azul + Normas) | Confirmar reutilização de conteúdo DGS. |

---

## 5. Figuras, imagens e tabelas

- **Não foram encontradas imagens rasterizadas embutidas** (sem `<img>`, `.png`, `.jpg`, `.svg` externos no conteúdo). Os ícones são SVG próprios da app. *(Nota: "figura humana" em `consultas.json`/`detalhes.json` refere-se ao marco de desenvolvimento "desenhar a figura humana", não a uma imagem.)*
- **Tabelas/dados a verificar** (a IP está nos **dados**, não numa imagem):
  - Percentis OMS (`crescimento.json`) — tabelas de dados de referência.
  - Esquema PNV (timelines em `vacinacao/*.html`) — tabela oficial DGS.
  - Tabelas fármaco+dose (`antibioterapia/dados.json`, `calculadoras/doses.json`) — do guia PAPA.
  - Matrizes de grupos de risco (`view-special-matrix.html`) — do Livro Azul.
  - Tabela de acuidade Snellen e TA por percentil (`ferramentas.json`).

---

## 6. Checklist — o que precisa de confirmação humana

**Licenças de instrumentos/escalas:**
- [ ] M-CHAT-R/F — autorização para incluir as 20 perguntas literais numa app.
- [ ] Critérios Roma IV (Rome Foundation).
- [ ] Escala de Bristol.
- [ ] EPDS (Edinburgh) — e verificar se é reproduzido algalgures.
- [ ] Mary Sheridan (desenvolvimento).
- [ ] Dados de percentis OMS (peso/altura/PC/IMC) e TA pediátrica por percentil.
- [ ] Estádios de Tanner — origem das descrições.
- [ ] ICPC-2 (códigos) — termos de uso.

**Autorização de reprodução de documentos/fontes:**
- [ ] Guia de Bolso PAPA / ARS LVT (Antibioterapia + Calculadoras).
- [ ] PNV 2025 e Livro Azul de Vacinas (DGS) — condições de reutilização.
- [ ] PNSIJ (DGS) — estrutura "Avaliar/Antecipar/Alertas" em Saúde Infantil.
- [ ] UpToDate® — confirmar que `ajuste-renal/farmacos.json` não copia texto proprietário.
- [ ] Briggs / Drugs.com — confirmar que `farmacos-gravidez/medicamentos.json` é original/paráfrase suficiente.

**Origem de texto (a verificar a origem, sem afirmar cópia):**
- [ ] Prosa longa em `defice-ferro.json` (guiaPrático/FAQ) vs. guidelines BSG/ESC/WGO.
- [ ] guiaTeórico/FAQ de obstipação vs. WGO/AGA-ACG.
- [ ] Interpretações em `analises/parametros.json`/`param_info.json` vs. manuais citados.

**Atribuição a acrescentar:**
- [ ] Fonte inline em `calculadoras/doses.json` e `crescimento.json`.
- [ ] Reforçar versão/fonte do PNSIJ em Saúde Infantil.

---

*Fim da triagem. Recomenda-se validação por revisor humano e, antes de comercialização,
por consultor jurídico em propriedade intelectual / saúde digital.*
