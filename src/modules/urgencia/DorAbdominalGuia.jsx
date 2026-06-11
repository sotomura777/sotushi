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
    const cz = e.target.closest("[data-cz-tab]");
    if (cz) {
      const scope = e.currentTarget;
      const idx = cz.getAttribute("data-cz-tab");
      scope.querySelectorAll(".cz-stab").forEach((t) => t.classList.toggle("active", t === cz));
      scope.querySelectorAll(".cz-panel").forEach((pn) => pn.classList.toggle("active", pn.getAttribute("data-cz") === idx));
      return;
    }
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
  const onInput = (e) => {
    const inp = e.target.closest("[data-cz-search]");
    if (!inp) return;
    const q = (inp.value || "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    e.currentTarget.querySelectorAll("#czSysTable tbody tr").forEach((r) => {
      const t = r.textContent.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      r.style.display = !q || t.includes(q) ? "" : "none";
    });
  };
  return <div className={"ca-guia da-guia " + (className || "")} onClick={onClick} onInput={onInput} dangerouslySetInnerHTML={{ __html: html }} />;
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
  const [sel, setSel] = useState([]);
  const tipos = useMemo(() => guia.dx.lista.map((d, i) => ({
    id: "dx" + i, name: d.t, meta: d.s || "", cat: guia.dx.cats[d.t] || "freq",
    pattern: (guia.dx.patterns[d.t] && guia.dx.patterns[d.t].length) ? guia.dx.patterns[d.t]
      : [["Pistas (história)", d.pistas], ["Exame objectivo", d.exame], ["Investigação", d.invest]].filter((x) => x[1]),
  })), []);
  const togSel = (id) => setSel((s) => {
    if (has(s, id)) return s.filter((x) => x !== id);
    const n = s.length >= guia.dx.max ? s.slice(1) : s;
    return [...n, id];
  });
  const tsel = sel.map((id) => tipos.find((t) => t.id === id));
  const chaves = []; const visto = {};
  tsel.forEach((t) => t.pattern.forEach(([k]) => { if (!visto[k]) { visto[k] = 1; chaves.push(k); } }));
  const pares = [];
  for (let i = 0; i < tsel.length; i++)
    for (let j = i + 1; j < tsel.length; j++) {
      const d = guia.dx.distincoes.find((x) => (x.a === tsel[i].name && x.b === tsel[j].name) || (x.a === tsel[j].name && x.b === tsel[i].name));
      pares.push({ a: tsel[i].name, b: tsel[j].name, tip: d ? d.tip : "Compara as linhas abaixo, em especial <b>pistas (carácter, fatores precipitantes), achados ao exame e exames complementares</b>." });
    }
  return (
    <div className="ca-guia da-guia">
      <div className="g-card">
        <h2>{guia.dx.painel.titulo}</h2>
        <p className="ca-lead" dangerouslySetInnerHTML={{ __html: guia.dx.painel.sub }} />
        {sel.length > 0 && (
          <div className="ddx-zone show">
            <div className="ddx-zone-h"><span>{guia.dx.painel.zonaTitulo}</span><span className="ddx-count">{sel.length} / {guia.dx.max}</span></div>
            <div className="ddx-chips">
              {tsel.map((t) => (
                <div key={t.id} className="ddx-chip"><span>{t.name}</span><button className="ddx-chip-x" onClick={() => togSel(t.id)}>×</button></div>
              ))}
            </div>
            {sel.length < 2 && <div className="ddx-hint">{guia.dx.painel.hint}</div>}
          </div>
        )}
        <div className="ddx-grid">
          {tipos.map((t) => (
            <div key={t.id} className={"ddx-card-sel" + (has(sel, t.id) ? " on" : "")} onClick={() => togSel(t.id)}>
              <div className="ddx-card-name">{t.name}</div>
              <div className="ddx-card-meta" dangerouslySetInnerHTML={{ __html: t.meta }} />
            </div>
          ))}
        </div>
        {sel.length > 0 && (
          <div className="ddx-detail show">
            {sel.length >= 2 && (
              <div className="ddx-distinguish">
                <div className="ddx-distinguish-t">Como distinguir</div>
                {pares.map((p, i) => (
                  <div key={i} className="ddx-distinguish-pair">
                    <span className="ddx-pair-label">{p.a} <span style={{ opacity: .7 }}>vs</span> {p.b}</span>
                    <div dangerouslySetInnerHTML={{ __html: p.tip }} />
                  </div>
                ))}
              </div>
            )}
            <div className="ddx-detail-card">
              <div className="ddx-detail-head">
                {sel.length >= 2 && <div className="ddx-detail-eyebrow">Comparação · {sel.length} diagnósticos</div>}
                <div className="ddx-detail-title">{tsel.map((t) => t.name).join(" · ")}</div>
              </div>
              <div className="ddx-section">
                <div className="ddx-section-t">{sel.length === 1 ? "Padrão clínico" : "Padrões lado a lado"}</div>
                {sel.length >= 2 && <div style={{ fontSize: "11.5px", color: "var(--suave)", marginBottom: 10, fontStyle: "italic" }}>"não característico" = parâmetro não habitualmente presente nesse diagnóstico (não significa "não avaliado").</div>}
                <div style={{ overflowX: "auto" }}>
                  <table className={"ddx-table" + (sel.length >= 2 ? " ddx-table-compare" : "")}>
                    {sel.length >= 2 && <thead><tr><th>Parâmetro</th>{tsel.map((t) => <th key={t.id}>{t.name}</th>)}</tr></thead>}
                    <tbody>
                      {sel.length === 1
                        ? tsel[0].pattern.map(([k, v], i) => <tr key={i}><td>{k}</td><td dangerouslySetInnerHTML={{ __html: v }} /></tr>)
                        : chaves.map((k) => (
                          <tr key={k}><td>{k}</td>{tsel.map((t) => {
                            const row = t.pattern.find((p) => p[0] === k);
                            return <td key={t.id} dangerouslySetInnerHTML={{ __html: row ? row[1] : '<span style="color:var(--tenue);font-style:italic;font-size:11.5px">não característico</span>' }} />;
                          })}</tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
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
