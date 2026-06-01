import { useState, useMemo } from "react";
import dados from "@conteudo/urgencia/obstipacao.json";
import { Ico } from "@/components/icones";
import { useEstadoLocal } from "@/lib/persistencia";
import { useAtalhosNumericos } from "@/lib/atalhos";
import { normalizar } from "@/lib/texto";
import ObstipacaoAlgoritmo from "./ObstipacaoAlgoritmo.jsx";

const TABS = ["Algoritmo", "Guia Teórico", "Tratamento", "FAQ", "Fontes"];
const TX_TABS = [
  { id: "nf", label: "Não farmacológico" },
  { id: "l1", label: "1ª Linha" },
  { id: "l2", label: "2ª Linha" },
  { id: "l3", label: "3ª Linha" },
  { id: "esp", label: "Especial" },
  { id: "ev", label: "Evidência" },
  { id: "fu", label: "Follow-up" },
];

function Html({ html, className }) {
  return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

function CardFarmaco({ card, guardado, onGuardar }) {
  const [virado, setVirado] = useState(false);
  return (
    <div className={"ob-drug-wrap" + (virado ? " flipped" : "")} onDoubleClick={() => setVirado((v) => !v)}>
      <button className={"ob-pc-star" + (guardado ? " saved" : "")} title="Guardar nos meus cards"
        onClick={(e) => { e.stopPropagation(); onGuardar(); }}>
        {guardado ? <Ico name="starFill" s={16} /> : <Ico name="star" s={16} />}
      </button>
      <div className="ob-drug-inner">
        <div className="ob-drug-front">
          <div className="ob-drug-badges">
            {card.badges.map((b, i) => (
              <span key={i} className={"ob-drug-badge" + (i === 0 ? " strong" : " cond")}>{b}</span>
            ))}
          </div>
          <div className="ob-drug-nome">{card.nome}{card.destaque && <span className="ob-drug-aster"> *</span>}</div>
          {card.comercial && <div className="ob-drug-comercial">{card.comercial}</div>}
          {card.dose && (
            <div className="ob-drug-row"><span className="ob-drug-label">Dose</span><span className="ob-drug-val">{card.dose}</span></div>
          )}
          {card.ea && <div className="ob-drug-ea">{card.ea}</div>}
          {card.dica && (
            <div className="ob-drug-dica">
              <div className="ob-drug-dica-label">{card.dicaLabel || "Dica prática"}</div>{card.dica}
            </div>
          )}
          <div className="ob-pc-hint">↻ ×2</div>
        </div>
        <div className="ob-drug-back">
          <div className="ob-pc-back-label">{card.mecLabel || "Mecanismo de ação"}</div>
          <div className="ob-pc-back-titulo">{card.mecTitulo}</div>
          <div className="ob-pc-back-texto">{card.mecTexto}</div>
          {card.ref && <div className="ob-pc-back-ref">{card.ref}</div>}
        </div>
      </div>
    </div>
  );
}

export default function Obstipacao({ accent = "#e85d4a", voltar }) {
  const [tab, setTab] = useEstadoLocal("medguia:obstipacao:tab", 0);
  const [gt, setGt] = useState(0);
  const [tx, setTx] = useState(0);
  const [faqQuery, setFaqQuery] = useState("");
  const [faqAberto, setFaqAberto] = useState(null);
  const [guardados, setGuardados] = useEstadoLocal("medguia:obstipacao:cards", []);
  useAtalhosNumericos(TABS.length, setTab);

  const toggleGuardar = (nome) =>
    setGuardados((g) => (g.includes(nome) ? g.filter((x) => x !== nome) : [...g, nome]));

  const faqFiltrada = useMemo(() => {
    const q = normalizar(faqQuery).trim();
    if (q.length < 3) return dados.faq;
    return dados.faq.filter((f) => normalizar(f.q + " " + f.tags).includes(q));
  }, [faqQuery]);

  const linha = TX_TABS[tx];
  const grupoLinha = dados.tratamento.linhas.find((l) => l.id === linha.id);

  return (
    <div className="ob-page" style={{ "--acento": accent }}>
      <button className="ob-voltar" onClick={voltar}>‹ Voltar</button>

      <h1 className="ob-titulo">{dados.titulo}</h1>
      <div className="ob-tags">
        {dados.tags.map((t, i) => <span key={i} className="ob-tag">{t}</span>)}
      </div>

      <div className="ob-tabs">
        {TABS.map((t, i) => (
          <button key={i} className={"ob-tab" + (tab === i ? " ativo" : "")} onClick={() => setTab(i)}>
            <span className="ob-tabnum">{i + 1}</span>{t}
          </button>
        ))}
      </div>

      {/* TAB 0 — Algoritmo interativo */}
      {tab === 0 && <ObstipacaoAlgoritmo accent={accent} />}

      {/* TAB 1 — Guia Teórico */}
      {tab === 1 && (
        <>
          <div className="ob-sub">
            {dados.guia.map((g, i) => (
              <button key={g.id} className={"ob-sub-btn" + (gt === i ? " ativo" : "")} onClick={() => setGt(i)}>{g.label}</button>
            ))}
          </div>
          <Html className="ob-guia" html={dados.guia[gt].html} />
        </>
      )}

      {/* TAB 2 — Tratamento */}
      {tab === 2 && (
        <>
          <div className="ob-aviso">
            {dados.tratamento.aviso}{" "}
            <a href={dados.tratamento.avisoLink.url} target="_blank" rel="noopener noreferrer">{dados.tratamento.avisoLink.texto}</a>
          </div>
          <div className="ob-sub">
            {TX_TABS.map((t, i) => (
              <button key={t.id} className={"ob-sub-btn" + (tx === i ? " ativo" : "")} onClick={() => setTx(i)}>{t.label}</button>
            ))}
          </div>

          {linha.id === "nf" && (
            <div className="ob-nf-grid">
              {dados.tratamento.naoFarmacologico.map((c, i) => (
                <div key={i} className="ob-nf-card">
                  <div className="ob-nf-titulo">{c.titulo}</div>
                  <div className="ob-nf-desc">{c.desc}</div>
                  {c.nota && <div className="ob-nf-nota">{c.nota}</div>}
                </div>
              ))}
            </div>
          )}

          {grupoLinha && grupoLinha.grupos.map((grp, gi) => (
            <div key={gi}>
              <div className="ob-drug-group">
                <span className="ob-drug-group-badge">{grp.badge}</span>
                <span className="ob-drug-group-text">{grp.texto}</span>
              </div>
              <div className="ob-drug-grid">
                {grp.cards.map((card, ci) => (
                  <CardFarmaco key={ci} card={card} guardado={guardados.includes(card.nome)} onGuardar={() => toggleGuardar(card.nome)} />
                ))}
              </div>
            </div>
          ))}

          {linha.id === "ev" && (
            <>
              <div className="ob-ev-intro">{dados.tratamento.evidenciaIntro}</div>
              {dados.tratamento.evidencia.map((d, i) => (
                <div key={i} className="ob-ev-drug">
                  <div className="ob-ev-header">
                    <span className="ob-ev-nome">{d.nome}</span>
                    <span className={"ob-ev-badge" + (d.badgeForte ? " forte" : "")}>{d.badge}</span>
                  </div>
                  {d.estudos.map((e, j) => (
                    <div key={j} className="ob-ev-study">
                      <div className="ob-ev-study-titulo">{e.titulo}</div>
                      <div className="ob-ev-study-desc">{e.desc}</div>
                      <div className="ob-ev-study-ref">{e.ref}</div>
                    </div>
                  ))}
                </div>
              ))}
              <div className="ob-ev-metodologia">{dados.tratamento.evidenciaMetodologia}</div>
            </>
          )}

          {linha.id === "fu" && (
            <div className="ob-fu">
              <div className="ob-fu-titulo">{dados.tratamento.followup.titulo}</div>
              <div className="ob-fu-timeline">
                {dados.tratamento.followup.marcos.map((m, i) => (
                  <div key={i} className="ob-fu-marco">
                    <span className="ob-fu-dot" />
                    <div>
                      <div className="ob-fu-tempo">{m.tempo}</div>
                      <div className="ob-fu-desc">{m.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="ob-fu-falha">
                <div className="ob-fu-falha-titulo">{dados.tratamento.followup.falhaTitulo}</div>
                {dados.tratamento.followup.falhaPassos.map((p, i) => (
                  <div key={i} className="ob-fu-falha-passo"><span className="ob-fu-falha-num">{i + 1}.</span>{p}</div>
                ))}
              </div>
              <div className="ob-fu-rodape">{dados.tratamento.followup.rodape}</div>
            </div>
          )}
        </>
      )}

      {/* TAB 3 — FAQ */}
      {tab === 3 && (
        <>
          <div className="ob-section-label">Perguntas frequentes</div>
          <input className="ob-faq-search" placeholder="Pesquisar nas FAQs (mínimo 3 letras)..." value={faqQuery} onChange={(e) => setFaqQuery(e.target.value)} />
          {faqFiltrada.length === 0 && <div className="ob-faq-vazio">Nenhum resultado encontrado.</div>}
          <div className="ob-faq-lista">
            {faqFiltrada.map((f, i) => (
              <div key={i} className={"ob-faq-item" + (faqAberto === f.q ? " aberto" : "")}>
                <button className="ob-faq-q" onClick={() => setFaqAberto(faqAberto === f.q ? null : f.q)}>
                  {f.q}<span className="ob-faq-chevron">▾</span>
                </button>
                {faqAberto === f.q && <Html className="ob-faq-a" html={f.a} />}
              </div>
            ))}
          </div>
        </>
      )}

      {/* TAB 4 — Fontes */}
      {tab === 4 && (
        <>
          <div className="ob-aviso">{dados.fontesIntro}</div>
          <div className="ob-fontes">
            {dados.fontes.map((f) => (
              <a key={f.num} className="ob-fonte" href={f.url} target="_blank" rel="noopener noreferrer">
                <span className="ob-fonte-num">{f.num}</span>
                <span className="ob-fonte-info">
                  <span className="ob-fonte-autores">{f.autores}</span>
                  <span className="ob-fonte-titulo">{f.titulo}</span>
                  <span className="ob-fonte-revista">{f.revista} <span className={"ob-fonte-badge " + f.badgeTipo}>{f.badge}</span></span>
                </span>
              </a>
            ))}
          </div>
          <div className="ob-fu-rodape">Conteúdo educacional. Não substitui o julgamento clínico.</div>
        </>
      )}
    </div>
  );
}
