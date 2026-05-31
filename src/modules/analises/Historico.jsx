import { useState } from "react";
import meta from "@conteudo/analises/meta.json";
import parametros from "@conteudo/analises/parametros.json";
import padroes from "@conteudo/analises/padroes.json";

const NOME_CAT = {};
meta.categorias.forEach((c) => (NOME_CAT[c.id] = c.nm));
import {
  ESTADO_INFO, getCorCat,
  construirMapaStatus, detetarAlterados, detetarPadroes, construirQueryPesquisa,
  gerarResumoTexto, gerarComparacao,
} from "./logica";
import ModalPreencher from "./ModalPreencher.jsx";
import { I } from "@/components/icones";

const MAX_SETS = 3;
const ddmm = (s) => (s || "").split(" ")[0].split("/").slice(0, 2).join("/");
const agora = () => { const d = new Date(); const p = (n) => String(n).padStart(2, "0"); return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`; };
const seta = (st) => (st === "high" ? "↑" : st === "low" ? "↓" : "");

export default function Historico({ historico, setHistorico, sexo, setSexo, uRefs, accent }) {
  const [idx, setIdx] = useState(null);
  const [iSet, setISet] = useState(0);
  const [modo, setModo] = useState(null); // 'resumo' | 'cmp'
  const [cmpSel, setCmpSel] = useState([]);
  const [addOpen, setAddOpen] = useState(false);
  const [copiado, setCopiado] = useState("");

  const abrir = (i) => { setIdx(i); setISet(historico[i].sets.length - 1); setModo(null); setCmpSel([]); };
  const voltar = () => { setIdx(null); setModo(null); };
  const apagar = (i, e) => { e.stopPropagation(); setHistorico((h) => h.filter((_, j) => j !== i)); if (idx === i) voltar(); };
  const copiar = (txt) => { navigator.clipboard?.writeText(txt); setCopiado(txt); setTimeout(() => setCopiado(""), 1200); };

  const addSet = (vals) => {
    const date = agora();
    const params = historico[idx].sets[0].params;
    const resumo = gerarResumoTexto(params, vals, parametros, ddmm(date));
    setHistorico((h) => h.map((entry, j) => (j === idx
      ? { ...entry, sets: [...entry.sets, { date, params: [...params], vals: JSON.parse(JSON.stringify(vals)), resumo }] }
      : entry)));
    setAddOpen(false);
    setISet((historico[idx].sets.length)); // novo set fica selecionado
    setModo(null);
  };

  // ════ Lista ════
  if (idx == null) {
    if (!historico.length) {
      return <div style={{ textAlign: "center", padding: 40, color: "var(--tenue)" }}>Nenhuma análise guardada ainda. Gera um resumo nas <strong>Completas</strong> e aparece aqui.</div>;
    }
    return (
      <div className="an-hist-grid">
        {historico.map((entry, i) => {
          const nParams = entry.sets[0]?.params?.length || 0;
          return (
            <div key={i} className="an-hist-card" onClick={() => abrir(i)}>
              <button className="an-modelo-x" onClick={(e) => apagar(i, e)} aria-label="Apagar">{I.close("currentColor", 12)}</button>
              <div className="an-hist-data">{ddmm(entry.date)}</div>
              <div className="an-hist-meta">{nParams} parâmetros · {entry.sets.length}/{MAX_SETS} análises</div>
            </div>
          );
        })}
      </div>
    );
  }

  // ════ Detalhe ════
  const entry = historico[idx];
  const sets = entry.sets;
  const set = sets[iSet] || sets[0];

  // valores do set por categoria
  const porCat = {};
  (set.params || []).forEach((id) => {
    const p = parametros.find((x) => x.id === id);
    if (!p) return;
    (porCat[p.cat] = porCat[p.cat] || []).push({ p, v: set.vals[id] });
  });

  const entrarCmp = () => {
    const last = sets[sets.length - 1];
    const comValor = (last.params || []).filter((id) => { const v = last.vals[id]; return v && v.val != null && v.val !== ""; });
    setCmpSel(comValor);
    setModo("cmp");
  };

  // resumo individual
  const resTxt = gerarResumoTexto(set.params, set.vals, parametros, ddmm(set.date));
  const alterados = detetarAlterados(set.params, set.vals, parametros);
  const pads = detetarPadroes(set.params, construirMapaStatus(set.vals), padroes);
  // comparação
  const cmp = modo === "cmp" ? gerarComparacao(sets, cmpSel, parametros) : null;
  const lastSet = sets[sets.length - 1];

  return (
    <div>
      <div className="an-hist-head">
        <button className="an-btn" onClick={voltar}>← Voltar</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, color: "var(--texto)" }}>{ddmm(entry.date)}</div>
          <div style={{ fontSize: 11, color: "var(--tenue)" }}>{sets.length}/{MAX_SETS} análises</div>
        </div>
        {sets.length < MAX_SETS && <button className="an-btn-pri" style={{ background: accent }} onClick={() => setAddOpen(true)}>+ Nova análise</button>}
      </div>

      <div className="an-set-tabs">
        {sets.map((s, i) => (
          <button key={i} className={"an-set-tab" + (i === iSet ? " on" : "")} onClick={() => { setISet(i); setModo(null); }}>
            Análise {i + 1} · {s.date}
          </button>
        ))}
      </div>

      {/* valores do set por categoria */}
      <div className="an-set-vals">
        {Object.entries(porCat).map(([cat, lista]) => (
          <div key={cat} style={{ marginBottom: 10 }}>
            <div className="secao-label" style={{ color: getCorCat(cat) }}>{NOME_CAT[cat] || cat}</div>
            <div className="an-set-row-wrap">
              {lista.map(({ p, v }) => {
                const ei = v && v.status ? ESTADO_INFO[v.status] : null;
                return (
                  <span key={p.id} className="an-set-val" style={ei ? { borderColor: ei.borda, color: ei.texto, background: ei.fundo } : undefined}>
                    {p.ab} {v?.val}{seta(v?.status)} <span style={{ opacity: .7 }}>{p.un}</span>
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, margin: "4px 0 12px" }}>
        <button className={"an-btn" + (modo === "resumo" ? "-pri" : "")} style={modo === "resumo" ? { background: accent } : undefined} onClick={() => setModo("resumo")}>Ver resumo</button>
        {sets.length >= 2 && <button className={"an-btn" + (modo === "cmp" ? "-pri" : "")} style={modo === "cmp" ? { background: accent } : undefined} onClick={entrarCmp}>Gerar comparação</button>}
      </div>

      {/* Resumo individual */}
      {modo === "resumo" && (
        <>
          <div className="an-resumo-box">
            <div className="an-resumo-head"><span className="an-ctx-l">Resumo</span>
              <button className="an-btn" onClick={() => copiar(resTxt)}>{copiado === resTxt ? "Copiado!" : "Copiar"}</button>
            </div>
            <div className="an-resumo-txt" style={{ whiteSpace: "pre-wrap" }}>{resTxt}</div>
          </div>
          {(alterados.length > 0 || pads.length > 0) && (
            <div className="an-pad">
              {alterados.length > 0 && (<>
                <div className="an-pad-titulo">Valores alterados</div>
                {alterados.map((a) => (<div key={a.id} className="an-pad-card alt"><div className="an-pad-card-nm">{a.etiqueta}</div><div className="an-pad-card-txt">{a.txt}</div></div>))}
              </>)}
              {pads.length > 0 && (<>
                <div className="an-pad-titulo" style={{ color: accent, marginTop: alterados.length ? 12 : 0 }}>Padrões reconhecidos</div>
                {pads.map((pad) => (
                  <div key={pad.id} className="an-pad-card">
                    <div className="an-pad-card-top"><div className="an-pad-card-nm">{pad.nm}</div>
                      <a className="an-pesquisar" href={construirQueryPesquisa(pad.nm, set.params, set.vals, parametros, sexo, uRefs)} target="_blank" rel="noopener">{I.search("currentColor", 12)} Pesquisar</a>
                    </div>
                    <div className="an-pad-card-txt">{pad.txt}</div>
                  </div>
                ))}
              </>)}
            </div>
          )}
        </>
      )}

      {/* Comparação */}
      {modo === "cmp" && cmp && (
        <>
          <div className="an-cmp-chips">
            {(lastSet.params || []).filter((id) => { const v = lastSet.vals[id]; return v && v.val != null && v.val !== ""; }).map((id) => {
              const p = parametros.find((x) => x.id === id);
              const on = cmpSel.includes(id);
              return <button key={id} className={"an-pick-item" + (on ? " on" : "")} onClick={() => setCmpSel((s) => (on ? s.filter((x) => x !== id) : [...s, id]))}>{p?.ab}</button>;
            })}
          </div>
          <div className="an-resumo-box">
            <div className="an-resumo-head"><span className="an-ctx-l">Comparação</span>
              <button className="an-btn" onClick={() => copiar(cmp.texto)}>{copiado === cmp.texto ? "Copiado!" : "Copiar"}</button>
            </div>
            <div className="an-resumo-txt" style={{ whiteSpace: "pre-wrap" }}>{cmp.texto}</div>
          </div>
          {cmp.notas.length > 0 && (
            <div className="an-pad">
              <div className="an-pad-titulo">Notas da evolução</div>
              {cmp.notas.map((n, i) => <div key={i} className="an-pad-card-txt" style={{ marginBottom: 4 }}>• {n}</div>)}
            </div>
          )}
        </>
      )}

      {addOpen && (
        <ModalPreencher
          titulo="Nova análise" ids={entry.sets[0].params} sexo={sexo} setSexo={setSexo} uRefs={uRefs}
          idadePeso={false} submitLabel="Guardar análise" onSubmit={addSet} onClose={() => setAddOpen(false)} accent={accent}
        />
      )}
    </div>
  );
}
