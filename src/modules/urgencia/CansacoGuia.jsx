import { useState, useMemo, useEffect } from "react";
import dados from "@conteudo/urgencia/cansaco.json";
import { useEstadoLocal } from "@/lib/persistencia";
import { useAtalhosNumericos } from "@/lib/atalhos";
import { normalizar } from "@/lib/texto";
import CansacoAnamnese from "./CansacoAnamnese.jsx";
import CansacoCards from "./CansacoCards.jsx";

// Ordem dos separadores como no original: Cards e Anamnese entre Escalas e Fontes.
const TABS = ["Guia Teórico", "Tratamento", "Escalas", "Cards", "Anamnese", "Fontes", "Glossário"];

// HTML do conteúdo com acordeões (.g-sec): o clique no cabeçalho alterna a secção.
function Html({ html, className }) {
  const onClick = (e) => {
    const h = e.target.closest(".g-sec-h");
    if (h && h.parentElement) h.parentElement.classList.toggle("open");
  };
  return <div className={className} onClick={onClick} dangerouslySetInnerHTML={{ __html: html }} />;
}

function Escala({ esc }) {
  const [resp, setResp] = useState(() => esc.itens.map(() => null));
  const respondidas = resp.filter((r) => r !== null).length;
  const completa = respondidas === esc.itens.length;
  const total = resp.reduce((s, r) => s + (r || 0), 0);
  const interp = completa ? esc.interp.find((b) => total <= b.ate) : null;

  return (
    <div className="ca-esc">
      <div className="ca-esc-head">
        <span className="ca-esc-fonte"><span className="ca-esc-int">Interativa</span>{esc.fonte}</span>
        <h3>{esc.nome}</h3>
        <p>{esc.desc}</p>
      </div>
      <div className="ca-esc-matriz">
        <div className="ca-esc-mrow head">
          <div className="ca-esc-cab">{esc.cabecalho}</div>
          {esc.opcoes.map((o, v) => <div key={v} className="ca-esc-col">{o}<span>({v})</span></div>)}
        </div>
        {esc.itens.map((item, i) => (
          <div key={i} className="ca-esc-mrow">
            <div className="ca-esc-q"><span className="ca-esc-num">{i + 1}.</span>{item}</div>
            {esc.opcoes.map((_, v) => (
              <div key={v} className="ca-esc-cel">
                <button className={"ca-esc-circ" + (resp[i] === v ? " on" : "")} title={esc.opcoes[v]}
                  onClick={() => setResp((r) => r.map((x, j) => (j === i ? v : x)))}>{v}</button>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="ca-esc-res">
        <div className="ca-esc-score">
          <span>{completa ? "Score total" : `${respondidas}/${esc.itens.length} respondidas`}</span>
          <strong>{total} / {esc.max}</strong>
        </div>
        {interp && <div className="ca-esc-interp">{interp.label}</div>}
        <div className="ca-esc-cutoffs"><b>Cut-offs:</b> {esc.cutoffs}</div>
        {esc.avisoQ9 && resp[8] > 0 && (
          <div className="g-alert g-alert-r"><b>⚠ Atenção — Pergunta 9 positiva.</b> {esc.avisoQ9}</div>
        )}
        {respondidas > 0 && (
          <button className="ca-esc-reset" onClick={() => setResp(esc.itens.map(() => null))}>Limpar respostas</button>
        )}
      </div>
    </div>
  );
}

export default function CansacoGuia({ accent = "#e85d4a", voltar, tabInicial }) {
  const [tab, setTab] = useEstadoLocal("medguia:cansaco:guia:tab", 0);
  const [gt, setGt] = useState(0);
  const [tx, setTx] = useState(0);
  const [esc, setEsc] = useState(0);
  const [glosQuery, setGlosQuery] = useState("");
  const mudarTab = (i) => { setTab(i); window.scrollTo({ top: 0 }); };
  useAtalhosNumericos(TABS.length, mudarTab);
  // os cartões do menu são atalhos para separadores respetivos
  useEffect(() => { if (tabInicial != null) mudarTab(tabInicial); }, [tabInicial]); // eslint-disable-line react-hooks/exhaustive-deps

  const termosFiltrados = useMemo(() => {
    const q = normalizar(glosQuery).trim();
    if (q.length < 2) return dados.glossario.termos;
    return dados.glossario.termos.filter((t) => normalizar(t.term + " " + t.full + " " + t.desc).includes(q));
  }, [glosQuery]);

  const escTabs = [...dados.escalas.interativas.map((e) => e.tab), "Outras escalas"];

  return (
    <div className="ca ob-page">
      <button className="ob-voltar" onClick={voltar}>‹ Menu Cansaço</button>
      <h1 className="ob-titulo">{dados.titulo}</h1>
      <p className="ca-hero-sub">{dados.guiaSub}</p>

      <div className="ob-tabs">
        {TABS.map((t, i) => (
          <button key={i} className={"ob-tab" + (tab === i ? " ativo" : "")} onClick={() => mudarTab(i)}>
            <span className="ob-tabnum">{i + 1}</span>{t}
          </button>
        ))}
      </div>

      {/* TAB 0 — Guia Teórico */}
      {tab === 0 && (
        <>
          <div className="ob-sub">
            {dados.guia.map((g, i) => (
              <button key={g.id} className={"ob-sub-btn" + (gt === i ? " ativo" : "")} onClick={() => setGt(i)}>{g.label}</button>
            ))}
          </div>
          <Html className="ca-guia" html={dados.guia[gt].html} />
        </>
      )}

      {/* TAB 1 — Tratamento */}
      {tab === 1 && (
        <>
          <Html className="ca-guia" html={dados.tratamento.introHtml} />
          <div className="ob-sub">
            {dados.tratamento.paineis.map((p, i) => (
              <button key={i} className={"ob-sub-btn" + (tx === i ? " ativo" : "")} onClick={() => setTx(i)}>{p.label}</button>
            ))}
          </div>
          <Html className="ca-guia" html={dados.tratamento.paineis[tx].html} />
        </>
      )}

      {/* TAB 2 — Escalas */}
      {tab === 2 && (
        <>
          <div className="ob-section-label">{dados.escalas.titulo}</div>
          <p className="ca-lead">{dados.escalas.sub}</p>
          <div className="ca-esc-tabs">
            {escTabs.map((t, i) => (
              <button key={i} className={"ca-esc-tab" + (esc === i ? " ativo" : "")} onClick={() => setEsc(i)}>{t}</button>
            ))}
          </div>
          {esc < dados.escalas.interativas.length
            ? <Escala key={dados.escalas.interativas[esc].id} esc={dados.escalas.interativas[esc]} />
            : (
              <>
                <div className="ob-aviso">{dados.escalas.outras.intro}</div>
                <div className="ca-fontes-grid">
                  {dados.escalas.outras.cards.map((c, i) => (
                    <a key={i} className="ca-fonte-card" href={c.url} target="_blank" rel="noopener noreferrer">
                      <span className="ca-fonte-badge condicional">{c.eyebrow}</span>
                      <span className="ca-fonte-titulo">{c.nome}</span>
                      <span className="ca-fonte-autores" dangerouslySetInnerHTML={{ __html: c.desc }} />
                      <span className="ca-esc-cutoffs"><b>Cut-offs:</b> {c.cutoffs}</span>
                    </a>
                  ))}
                </div>
              </>
            )}
        </>
      )}

      {/* TAB 3 — Cards (cards rápidos + flashcards) */}
      {tab === 3 && <CansacoCards accent={accent} embutido />}

      {/* TAB 4 — Treino de Anamnese */}
      {tab === 4 && <CansacoAnamnese accent={accent} embutido />}

      {/* TAB 5 — Fontes */}
      {tab === 5 && (
        <>
          <div className="ob-aviso" dangerouslySetInnerHTML={{ __html: dados.fontes.intro }} />
          <Html className="ca-guia" html={`<div class="g-alert g-alert-a">${dados.fontes.nota}</div>`} />
          {dados.fontes.grupos.map((g, gi) => (
            <div key={gi}>
              <div className="ob-section-label">{g.titulo}</div>
              <div className="ca-fontes-grid">
                {g.itens.map((f) => {
                  const Tag = f.url ? "a" : "div";
                  return (
                    <Tag key={f.num} className="ca-fonte-card" {...(f.url ? { href: f.url, target: "_blank", rel: "noopener noreferrer" } : {})}>
                      <span className={"ca-fonte-badge " + f.badgeTipo}>{f.badge}</span>
                      <span className="ca-fonte-titulo">{f.titulo}</span>
                      <span className="ca-fonte-autores">{f.autores}</span>
                      <span className="ca-fonte-revista">{f.fonte}</span>
                    </Tag>
                  );
                })}
              </div>
            </div>
          ))}
          <div className="ca-termos">{dados.fontes.termos}</div>
        </>
      )}

      {/* TAB 6 — Glossário */}
      {tab === 6 && (
        <>
          <div className="ob-section-label">{dados.glossario.titulo}</div>
          <p className="ca-lead">{dados.glossario.sub}</p>
          <input className="campo" style={{ width: "100%", marginBottom: 14 }} placeholder="Pesquisar termo…" value={glosQuery} onChange={(e) => setGlosQuery(e.target.value)} />
          {termosFiltrados.length === 0 && <div className="ob-faq-vazio">Nenhum termo encontrado.</div>}
          <div className="ca-glos-lista">
            {termosFiltrados.map((t, i) => (
              <div key={i} className="ca-glos-item">
                <div className="ca-glos-topo">
                  <span className="ca-glos-term">{t.term}</span>
                  <span className="ca-glos-cat">{t.cat}</span>
                </div>
                {t.full && t.full !== t.term && <div className="ca-glos-full">{t.full}</div>}
                <div className="ca-glos-desc" dangerouslySetInnerHTML={{ __html: t.desc }} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
