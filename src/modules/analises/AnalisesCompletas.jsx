import { useState, useMemo } from "react";
import meta from "@conteudo/analises/meta.json";
import parametros from "@conteudo/analises/parametros.json";
import padroes from "@conteudo/analises/padroes.json";
import modelosDefault from "@conteudo/analises/modelos.json";
import {
  getCorCat,
  construirMapaStatus, detetarAlterados, detetarPadroes, construirQueryPesquisa,
  gerarResumoTexto, calcularFormulas,
} from "./logica";
import ModalPreencher from "./ModalPreencher.jsx";
import { I, Ico } from "@/components/icones";
import { useEstadoLocal } from "@/lib/persistencia";
import { toast, useEscape } from "@/lib/toast";

const uid = () => "m" + Math.random().toString(36).slice(2, 9);
const hojeDDMM = () => { const d = new Date(); const p = (n) => String(n).padStart(2, "0"); return `${p(d.getDate())}/${p(d.getMonth() + 1)}`; };

export default function AnalisesCompletas({ sexo, setSexo, uRefs, accent, onGuardarHistorico }) {
  const [modelosCustom, setModelosCustom] = useEstadoLocal("medguia:analises:modelos", []);
  const [dSel, setDSel] = useState([]);
  const [dVals, setDVals] = useState({});
  const [vista, setVista] = useState("edit");
  const [modal, setModal] = useState(null); // 'sel' | 'criar' | 'preencher'
  const [pick, setPick] = useState([]);
  const [colaps, setColaps] = useState({});
  const [nomeModelo, setNomeModelo] = useState("");
  const [resumo, setResumo] = useState("");
  const [resumoBase, setResumoBase] = useState("");
  const [resultado, setResultado] = useState(null);
  useEscape(modal ? () => setModal(null) : null);

  const nomeCat = useMemo(() => { const m = {}; meta.categorias.forEach((c) => (m[c.id] = c.nm)); return m; }, []);
  const porCat = useMemo(() => meta.categorias.map((c) => ({ ...c, ps: parametros.filter((p) => p.cat === c.id) })).filter((c) => c.ps.length), []);
  const modelos = [...modelosDefault, ...modelosCustom];

  const abrirPreencher = (ids) => { setDSel(ids); setModal("preencher"); };
  const abrirModelo = (m) => abrirPreencher(m.ps);

  const abrirSelecionar = () => { setPick([]); setColaps({}); setModal("sel"); };
  const abrirCriar = () => { setPick([]); setNomeModelo(""); setColaps({}); setModal("criar"); };
  const togPick = (id) => setPick((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const togCat = (cid) => setColaps((c) => ({ ...c, [cid]: !c[cid] }));
  const todosCat = (cps) => {
    const ids = cps.map((p) => p.id);
    const todos = ids.every((id) => pick.includes(id));
    setPick((p) => (todos ? p.filter((x) => !ids.includes(x)) : [...new Set([...p, ...ids])]));
  };
  const confirmarSelecao = () => { if (pick.length) abrirPreencher(pick); };
  const guardarModelo = () => {
    if (!nomeModelo.trim() || !pick.length) return;
    setModelosCustom((m) => [...m, { id: uid(), nm: nomeModelo.trim(), ps: pick }]);
    setModal(null);
    toast("Modelo guardado");
  };
  const apagarModelo = (id) => { setModelosCustom((m) => m.filter((x) => x.id !== id)); toast("Modelo apagado"); };

  // Gerar resumo a partir dos valores submetidos no ModalPreencher
  const gerar = (vals, ctx) => {
    if (!dSel.length) return;
    const data = hojeDDMM();
    const texto = gerarResumoTexto(dSel, vals, parametros, data);
    const mapa = construirMapaStatus(vals);
    const alterados = detetarAlterados(dSel, vals, parametros);
    const pads = detetarPadroes(dSel, mapa, padroes);
    const formulas = calcularFormulas(vals, parametros, { idade: ctx.idade, peso: ctx.peso, sexo });
    setDVals(vals);
    setResumo(texto); setResumoBase(texto);
    setResultado({ alterados, padroes: pads, formulas });
    onGuardarHistorico?.(dSel, vals, texto);
    setVista("result"); setModal(null);
    toast("Resumo gerado e guardado no Histórico");
  };
  const copiar = () => { navigator.clipboard?.writeText(resumo); toast("Copiado!"); };

  // ════ Resultado ════
  if (vista === "result" && resultado) {
    return (
      <div>
        <button className="an-btn" style={{ marginBottom: 12 }} onClick={() => setVista("edit")}>← Voltar</button>
        <div className="an-resumo-box">
          <div className="an-resumo-head"><span className="an-ctx-l">Resumo</span>
            <div style={{ display: "flex", gap: 6 }}>
              <button className="an-btn" onClick={copiar}>Copiar</button>
              <button className="an-btn" onClick={() => setResumo(resumoBase)}>Repor</button>
            </div>
          </div>
          <textarea className="an-resumo-txt" value={resumo} onChange={(e) => setResumo(e.target.value)} rows={Math.max(2, Math.ceil(resumo.length / 60))} />
          <div style={{ fontSize: 11, color: "var(--tenue)", marginTop: 6 }}>Guardado no Histórico.</div>
        </div>

        {resultado.formulas.length > 0 && (
          <div className="an-pad"><div className="an-pad-titulo">Fórmulas</div>
            <div className="an-formulas">{resultado.formulas.map((f, i) => <span key={i} className="an-formula">{f}</span>)}</div>
          </div>
        )}

        {(resultado.alterados.length > 0 || resultado.padroes.length > 0) && (
          <div className="an-pad">
            {resultado.alterados.length > 0 && (<>
              <div className="an-pad-titulo">Valores alterados</div>
              {resultado.alterados.map((a) => (<div key={a.id} className="an-pad-card alt"><div className="an-pad-card-nm">{a.etiqueta}</div><div className="an-pad-card-txt">{a.txt}</div></div>))}
            </>)}
            {resultado.padroes.length > 0 && (<>
              <div className="an-pad-titulo" style={{ color: accent, marginTop: resultado.alterados.length ? 12 : 0 }}>Padrões reconhecidos</div>
              {resultado.padroes.map((pad) => (
                <div key={pad.id} className="an-pad-card">
                  <div className="an-pad-card-top"><div className="an-pad-card-nm">{pad.nm}</div>
                    <a className="an-pesquisar" href={construirQueryPesquisa(pad.nm, dSel, dVals, parametros, sexo, uRefs)} target="_blank" rel="noopener">{I.search("currentColor", 12)} Pesquisar</a>
                  </div>
                  <div className="an-pad-card-txt">{pad.txt}</div>
                </div>
              ))}
            </>)}
          </div>
        )}
      </div>
    );
  }

  // ════ Edição ════
  return (
    <div>
      <div className="secao-label">Modelos</div>
      <div className="an-modelos">
        {modelos.map((m) => (
          <div key={m.id} className="an-modelo" onClick={() => abrirModelo(m)}>
            {!modelosDefault.includes(m) && (
              <button className="an-modelo-x" onClick={(e) => { e.stopPropagation(); apagarModelo(m.id); }} aria-label="Apagar">{I.close("currentColor", 12)}</button>
            )}
            <div className="an-modelo-nm">{m.nm}</div>
            <div className="an-modelo-n">{m.ps.length} parâmetros</div>
          </div>
        ))}
        <button className="an-modelo an-modelo-novo" onClick={abrirCriar}><Ico name="plus" s={16} /> Novo modelo</button>
      </div>

      <button className="an-btn-pri" style={{ background: accent, marginTop: 14, width: "100%", padding: "11px" }} onClick={abrirSelecionar}>
        + Adicionar parâmetros
      </button>

      {modal === "preencher" && (
        <ModalPreencher
          titulo="Preencher valores" ids={dSel} sexo={sexo} setSexo={setSexo} uRefs={uRefs}
          submitLabel="Gerar resumo" onSubmit={gerar} onClose={() => setModal(null)} accent={accent}
        />
      )}

      {(modal === "sel" || modal === "criar") && (
        <div className="an-modal" onClick={() => setModal(null)}>
          <div className="an-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="an-modal-head">
              <div className="an-modal-nome" style={{ fontSize: 16 }}>{modal === "criar" ? "Novo modelo" : "Selecionar parâmetros"}</div>
              <button className="an-modal-x" onClick={() => setModal(null)}>{I.close("currentColor", 18)}</button>
            </div>
            <div className="an-modal-body">
              {modal === "criar" && (
                <input className="campo" style={{ marginBottom: 12 }} placeholder="Nome do modelo" value={nomeModelo} onChange={(e) => setNomeModelo(e.target.value)} />
              )}
              {porCat.map((c) => {
                const sel = c.ps.filter((p) => pick.includes(p.id)).length;
                const aberto = !colaps[c.id];
                return (
                  <div key={c.id} className="an-pick-cat">
                    <div className="an-pick-head" onClick={() => togCat(c.id)}>
                      <span className="an-pick-dot" style={{ background: getCorCat(c.id) }} />
                      <span className="an-pick-nm">{c.nm}</span>
                      <span className="an-pick-cnt">{sel} de {c.ps.length}</span>
                      <button className="an-pick-todos" onClick={(e) => { e.stopPropagation(); todosCat(c.ps); }}>Todos</button>
                      <span className="an-pick-chev">{aberto ? "▴" : "▾"}</span>
                    </div>
                    {aberto && (
                      <div className="an-pick-grid">
                        {c.ps.map((p) => (
                          <button key={p.id} className={"an-pick-item" + (pick.includes(p.id) ? " on" : "")} onClick={() => togPick(p.id)}>{p.ab}</button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="an-modal-foot" style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "var(--tenue)", fontWeight: 600 }}>{pick.length} selecionados</span>
              <span style={{ flex: 1 }} />
              {modal === "criar"
                ? <button className="an-btn-pri" style={{ background: accent }} disabled={!nomeModelo.trim() || !pick.length} onClick={guardarModelo}>Guardar modelo</button>
                : <button className="an-btn-pri" style={{ background: accent }} disabled={!pick.length} onClick={confirmarSelecao}>Confirmar ({pick.length})</button>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
