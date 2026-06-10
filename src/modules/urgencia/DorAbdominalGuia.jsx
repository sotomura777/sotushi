import { useState, useMemo, useEffect } from "react";
import dados from "@conteudo/urgencia/dor-abdominal.json";
import guia from "@conteudo/urgencia/dor-abdominal-guia.json";
import { useEstadoLocal } from "@/lib/persistencia";
import { useAtalhosNumericos } from "@/lib/atalhos";
import { normalizar } from "@/lib/texto";
import DorAbdominalAnamnese from "./DorAbdominalAnamnese.jsx";
import CardsDeck from "./sintoma/CardsDeck.jsx";

const TABS = ["Guia Teórico", "Diagnósticos", "Tratamento", "Escalas", "Cards", "Anamnese", "Fontes", "Glossário"];
const has = (a, v) => a.indexOf(v) >= 0;

// HTML do conteúdo: acordeões (.g-sec) e mapa de quadrantes (data-quad) por delegação.
function Html({ html, className }) {
  const onClick = (e) => {
    const h = e.target.closest(".g-sec-h");
    if (h && h.parentElement) { h.parentElement.classList.toggle("open"); return; }
    const q = e.target.closest("[data-quad]");
    if (q) {
      const raiz = e.currentTarget;
      const info = raiz.querySelector("#quadInfo");
      if (!info) return;
      const liga = !q.classList.contains("on");
      raiz.querySelectorAll("[data-quad]").forEach((c) => c.classList.remove("on"));
      if (!liga) { info.innerHTML = ""; return; }
      q.classList.add("on");
      const d = guia.quadData[q.getAttribute("data-quad")];
      if (d) info.innerHTML = `<div class="quad-info"><b>${d.title}</b><br><span style="font-size:12px;color:var(--suave);display:block;margin:6px 0 8px;">${d.causes}</span>${d.tip}</div>`;
    }
  };
  return <div className={"ca-guia da-guia " + (className || "")} onClick={onClick} dangerouslySetInnerHTML={{ __html: html }} />;
}

function EscalaChecklist({ esc, multi }) {
  const [resp, setResp] = useState({});
  const total = esc.itens.reduce((s, it, i) => s + (multi ? (it.scores[resp[i] ?? 0] || 0) : (resp[i] ? it.score : 0)), 0);
  const max = esc.itens.reduce((s, it) => s + (multi ? Math.max(...it.scores) : it.score), 0);
  const completo = multi ? esc.itens.every((_, i) => resp[i] !== undefined) : true;
  const interp = completo ? esc.interp.find((b) => total <= b.ate) : null;
  return (
    <div className="ca-esc">
      <div className="ca-esc-head">
        <span className="ca-esc-fonte"><span className="ca-esc-int">Interativa</span>{esc.fonte}</span>
        <h3>{esc.nome}</h3>
        <p>{esc.desc}</p>
      </div>
      <div className="ca-esc-matriz">
        {esc.itens.map((it, i) => (
          <div key={i} className="ca-esc-mrow" style={{ gridTemplateColumns: "1fr auto" }}>
            <div className="ca-esc-q"><span className="ca-esc-num">{i + 1}.</span>{it.q}</div>
            <div className="ca-an-flex" style={{ padding: "8px 12px" }}>
              {multi
                ? it.opts.map((o, v) => (
                  <button key={v} className={"ca-esc-opt-mini" + ((resp[i] ?? -1) === v ? " on" : "")} onClick={() => setResp((r) => ({ ...r, [i]: v }))}>{o} <b>{it.scores[v]}</b></button>
                ))
                : <button className={"ca-esc-circ" + (resp[i] ? " on" : "")} style={{ width: "auto", borderRadius: 8, padding: "0 12px" }} onClick={() => setResp((r) => ({ ...r, [i]: r[i] ? 0 : 1 }))}>{it.score}</button>}
            </div>
          </div>
        ))}
      </div>
      <div className="ca-esc-res">
        <div className="ca-esc-score"><span>{completo ? "Score total" : "Responde a todos os critérios"}</span><strong>{total} / {max}</strong></div>
        {interp && <div className="ca-esc-interp">{interp.label}</div>}
      </div>
    </div>
  );
}

function Diagnosticos() {
  const [aberto, setAberto] = useState(null);
  const [sel, setSel] = useState([]);
  const tipos = useMemo(() => guia.dx.lista.map((d, i) => ({
    id: "dx" + i, ...d, cat: guia.dx.cats[d.t] || "freq",
    pattern: (guia.dx.patterns[d.t] && guia.dx.patterns[d.t].length) ? guia.dx.patterns[d.t]
      : [["Pistas (história)", d.pistas], ["Exame objectivo", d.exame], ["Investigação", d.invest]].filter((x) => x[1]),
  })), []);
  const porNome = (n) => tipos.find((t) => t.t === n);
  const togSel = (id) => setSel((s) => (has(s, id) ? s.filter((x) => x !== id) : s.length >= guia.dx.max ? s : [...s, id]));
  const selecionados = sel.map((id) => tipos.find((t) => t.id === id));
  const dicasPares = [];
  for (let i = 0; i < selecionados.length; i++)
    for (let j = i + 1; j < selecionados.length; j++) {
      const d = guia.dx.distincoes.find((x) => (x.a === selecionados[i].t && x.b === selecionados[j].t) || (x.a === selecionados[j].t && x.b === selecionados[i].t));
      if (d) dicasPares.push(d);
    }
  return (
    <div className="ca-guia da-guia">
      <div className="g-card">
        <h2>{guia.dx.painel.titulo}</h2>
        <p className="ca-lead" dangerouslySetInnerHTML={{ __html: guia.dx.painel.sub }} />
        <div className="da-ddx-zona">
          <div className="da-ddx-zona-h"><span>{guia.dx.painel.zonaTitulo}</span><span>{sel.length} / {guia.dx.max}</span></div>
          {sel.length === 0 && <div className="ca-an-hint">{guia.dx.painel.hint}</div>}
          <div className="ca-an-flex">
            {selecionados.map((t) => (
              <button key={t.id} className="ca-chip ativo" style={{ background: guia.dx.catColor[t.cat], borderColor: guia.dx.catColor[t.cat], color: "#fff" }} onClick={() => togSel(t.id)}>{t.t} ×</button>
            ))}
          </div>
        </div>
        {["killer", "grave", "freq"].map((cat) => (
          <div key={cat} style={{ marginBottom: 10 }}>
            <div className="ca-an-cat" style={{ color: guia.dx.catColor[cat] }}>{guia.dx.catLabel[cat]}</div>
            <div className="ca-an-flex">
              {tipos.filter((t) => t.cat === cat).map((t) => (
                <button key={t.id} className={"ca-chip" + (has(sel, t.id) ? " ativo" : "")}
                  style={has(sel, t.id) ? { background: guia.dx.catColor[cat], borderColor: guia.dx.catColor[cat], color: "#fff" } : { borderColor: `color-mix(in srgb, ${guia.dx.catColor[cat]} 45%, transparent)` }}
                  onClick={() => togSel(t.id)}>{t.t}</button>
              ))}
            </div>
          </div>
        ))}
        {selecionados.length >= 2 && (
          <div className="da-ddx-comp">
            {selecionados.map((t) => (
              <div key={t.id} className="da-ddx-col">
                <div className="da-ddx-col-h" style={{ borderTopColor: guia.dx.catColor[t.cat] }}>
                  <span className="ca-card-cat" style={{ color: guia.dx.catColor[t.cat], background: `color-mix(in srgb, ${guia.dx.catColor[t.cat]} 12%, transparent)` }}>{guia.dx.catLabel[t.cat]}</span>
                  <div className="ca-fonte-titulo">{t.t}</div>
                  <div className="ca-fonte-revista" dangerouslySetInnerHTML={{ __html: t.s || "" }} />
                </div>
                {t.pattern.map(([k, v], i) => (
                  <div key={i} className="da-ddx-row"><div className="ca-card-sec-key">{k}</div><div dangerouslySetInnerHTML={{ __html: v }} /></div>
                ))}
              </div>
            ))}
          </div>
        )}
        {dicasPares.map((d, i) => (
          <div key={i} className="ca-keyconcept" style={{ marginTop: 10 }}>
            <div className="ca-keyconcept-titulo">Como distinguir: {d.a} vs {d.b}</div>
            <div dangerouslySetInnerHTML={{ __html: d.tip }} />
          </div>
        ))}
      </div>
      <div className="ob-section-label">Detalhe por diagnóstico</div>
      {tipos.map((t) => (
        <div key={t.id} className={"ca-an-dx" + (aberto === t.id ? " aberto" : "")}>
          <button className="ca-an-dx-head" onClick={() => setAberto(aberto === t.id ? null : t.id)}>
            <span className="ca-an-dx-nome" style={{ color: guia.dx.catColor[t.cat] }}>{t.t}</span>
            <span className="ca-an-dx-ver">{aberto === t.id ? "fechar ▲" : "ver mais ▼"}</span>
          </button>
          <div className="ca-fonte-revista" dangerouslySetInnerHTML={{ __html: t.s || "" }} />
          {aberto === t.id && (
            <div className="ca-an-dx-det">
              {t.pistas && (<><div className="ca-an-dx-sec">Pistas</div><p dangerouslySetInnerHTML={{ __html: t.pistas }} /></>)}
              {t.exame && (<><div className="ca-an-dx-sec">Exame</div><p dangerouslySetInnerHTML={{ __html: t.exame }} /></>)}
              {t.invest && (<><div className="ca-an-dx-sec">Investigação</div><p dangerouslySetInnerHTML={{ __html: t.invest }} /></>)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function DorAbdominalGuia({ voltar, tabInicial }) {
  const [tab, setTab] = useEstadoLocal("medguia:dor-abdominal:guia:tab", 0);
  const [gt, setGt] = useState(0);
  const [tx, setTx] = useState(0);
  const [esc, setEsc] = useState(0);
  const [glosQuery, setGlosQuery] = useState("");
  const mudarTab = (i) => { setTab(i); window.scrollTo({ top: 0 }); };
  useAtalhosNumericos(TABS.length, mudarTab);
  useEffect(() => { if (tabInicial != null) mudarTab(tabInicial); }, [tabInicial]); // eslint-disable-line react-hooks/exhaustive-deps

  const termos = useMemo(() => {
    const q = normalizar(glosQuery).trim();
    if (q.length < 2) return guia.glossario.termos;
    return guia.glossario.termos.filter((t) => normalizar(t.term + " " + t.full + " " + t.desc).includes(q));
  }, [glosQuery]);

  return (
    <div className="ca da ob-page">
      <button className="ob-voltar" onClick={voltar}>‹ Menu Dor Abdominal</button>
      <h1 className="ob-titulo">{dados.titulo}</h1>
      <p className="ca-hero-sub">{guia.guiaSub}</p>

      <div className="ob-tabs">
        {TABS.map((t, i) => (
          <button key={i} className={"ob-tab" + (tab === i ? " ativo" : "")} onClick={() => mudarTab(i)}>
            <span className="ob-tabnum">{i + 1}</span>{t}
          </button>
        ))}
      </div>

      {tab === 0 && (
        <>
          <div className="ob-sub">
            {guia.gt.map((g, i) => (
              <button key={i} className={"ob-sub-btn" + (gt === i ? " ativo" : "")} onClick={() => setGt(i)}>{g.label}</button>
            ))}
          </div>
          <Html html={guia.gt[gt].html} />
        </>
      )}

      {tab === 1 && <Diagnosticos />}

      {tab === 2 && (
        <>
          <div className="ob-sub">
            {guia.tratamento.labels.map((l, i) => (
              <button key={i} className={"ob-sub-btn" + (tx === i ? " ativo" : "")} onClick={() => setTx(i)}>{l}</button>
            ))}
          </div>
          <Html html={guia.tratamento.paineis[tx].html} />
        </>
      )}

      {tab === 3 && (
        <>
          <div className="ca-esc-tabs">
            {["Alvarado", "AIR", "Outras escalas"].map((t, i) => (
              <button key={i} className={"ca-esc-tab" + (esc === i ? " ativo" : "")} onClick={() => setEsc(i)}>{t}</button>
            ))}
          </div>
          {esc === 0 && <EscalaChecklist esc={guia.escalas.alvarado} />}
          {esc === 1 && <EscalaChecklist esc={guia.escalas.air} multi />}
          {esc === 2 && <Html html={guia.escalas.outrasHtml} />}
        </>
      )}

      {tab === 4 && <CardsDeck titulo={guia.cards.titulo} sub={guia.cards.sub} cats={guia.cards.cats} defaults={guia.cards.defaults} prefixo="medguia:dor-abdominal:cards" />}

      {tab === 5 && <DorAbdominalAnamnese embutido />}

      {tab === 6 && (
        <>
          <div className="ob-aviso" dangerouslySetInnerHTML={{ __html: guia.fontes.intro }} />
          {guia.fontes.grupos.map((g, gi) => (
            <div key={gi}>
              <div className="ob-section-label">{g.titulo}</div>
              <div className="ca-fontes-grid">
                {g.itens.map((f) => (
                  <a key={f.num} className="ca-fonte-card" href={f.url || "https://www.google.com/search?q=" + encodeURIComponent(f.titulo + " " + f.autores)} target="_blank" rel="noopener noreferrer">
                    <span className={"ca-fonte-badge " + f.badgeTipo}>{f.badge}</span>
                    <span className="ca-fonte-titulo">{f.titulo}</span>
                    <span className="ca-fonte-autores">{f.autores}</span>
                    <span className="ca-fonte-revista">{f.fonte}</span>
                  </a>
                ))}
              </div>
            </div>
          ))}
          {guia.fontes.termos && <div className="ca-termos">{guia.fontes.termos}</div>}
        </>
      )}

      {tab === 7 && (
        <>
          <div className="ob-section-label">{guia.glossario.titulo}</div>
          <p className="ca-lead">{guia.glossario.sub}</p>
          <input className="campo" style={{ width: "100%", marginBottom: 14 }} placeholder="Pesquisar termo…" value={glosQuery} onChange={(e) => setGlosQuery(e.target.value)} />
          {termos.length === 0 && <div className="ob-faq-vazio">Nenhum termo encontrado.</div>}
          <div className="ca-glos-lista">
            {termos.map((t, i) => (
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
