import { useState, useMemo, useRef } from "react";
import meta from "@conteudo/analises/meta.json";
import parametros from "@conteudo/analises/parametros.json";
import padroes from "@conteudo/analises/padroes.json";
import modelosDefault from "@conteudo/analises/modelos.json";
import {
  getEstado, getCorCat, ESTADO_INFO,
  construirMapaStatus, detetarAlterados, detetarPadroes, construirQueryPesquisa,
  gerarResumoTexto, calcularFormulas,
} from "./logica";
import { I, Ico } from "@/components/icones";
import { useEstadoLocal } from "@/lib/persistencia";

const uid = () => "m" + Math.random().toString(36).slice(2, 9);
const hoje = () => { const d = new Date(); return String(d.getDate()).padStart(2, "0") + "/" + String(d.getMonth() + 1).padStart(2, "0"); };

export default function AnalisesCompletas({ sexo, setSexo, uRefs, accent }) {
  const [modelosCustom, setModelosCustom] = useEstadoLocal("medguia:analises:modelos", []);
  const [dSel, setDSel] = useState([]);
  const [dVals, setDVals] = useState({});
  const [idade, setIdade] = useState("");
  const [peso, setPeso] = useState("");
  const [vista, setVista] = useState("edit");
  const [modal, setModal] = useState(null); // 'sel' | 'criar' | 'preencher'
  const [pick, setPick] = useState([]);
  const [colaps, setColaps] = useState({});
  const [nomeModelo, setNomeModelo] = useState("");
  const [resumo, setResumo] = useState("");
  const [resumoBase, setResumoBase] = useState("");
  const [resultado, setResultado] = useState(null);
  const inputsRef = useRef([]);

  const nomeCat = useMemo(() => { const m = {}; meta.categorias.forEach((c) => (m[c.id] = c.nm)); return m; }, []);
  const porCat = useMemo(() => meta.categorias.map((c) => ({ ...c, ps: parametros.filter((p) => p.cat === c.id) })).filter((c) => c.ps.length), []);
  const modelos = [...modelosDefault, ...modelosCustom];

  // ── Preenchimento ──
  const abrirPreencher = (ids) => { setDSel(ids); setDVals({}); setModal("preencher"); };
  const abrirModelo = (m) => abrirPreencher(m.ps);
  const setValor = (id, val) => {
    const p = parametros.find((x) => x.id === id);
    const status = getEstado(p, val, sexo, uRefs);
    setDVals((v) => ({ ...v, [id]: { val, status } }));
  };

  // ── Picker (seleção / criar modelo) ──
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
  };
  const apagarModelo = (id) => setModelosCustom((m) => m.filter((x) => x.id !== id));

  // ── Gerar resumo ──
  const gerar = () => {
    if (!dSel.length) return;
    const data = hoje();
    const texto = gerarResumoTexto(dSel, dVals, parametros, data);
    const mapa = construirMapaStatus(dVals);
    const alterados = detetarAlterados(dSel, dVals, parametros);
    const pads = detetarPadroes(dSel, mapa, padroes);
    const formulas = calcularFormulas(dVals, parametros, {
      idade: idade ? Number(idade) : null, peso: peso ? Number(peso) : null, sexo,
    });
    setResumo(texto); setResumoBase(texto);
    setResultado({ alterados, padroes: pads, formulas });
    setVista("result"); setModal(null);
  };
  const copiar = () => navigator.clipboard?.writeText(resumo);

  const onKeyCampo = (e, i) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    if (i + 1 < dSel.length) inputsRef.current[i + 1]?.focus();
    else gerar();
  };

  // ════ Vista de resultado ════
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
        </div>

        {resultado.formulas.length > 0 && (
          <div className="an-pad">
            <div className="an-pad-titulo">Fórmulas</div>
            <div className="an-formulas">{resultado.formulas.map((f, i) => <span key={i} className="an-formula">{f}</span>)}</div>
          </div>
        )}

        {(resultado.alterados.length > 0 || resultado.padroes.length > 0) && (
          <div className="an-pad">
            {resultado.alterados.length > 0 && (
              <>
                <div className="an-pad-titulo">Valores alterados</div>
                {resultado.alterados.map((a) => (
                  <div key={a.id} className="an-pad-card alt"><div className="an-pad-card-nm">{a.etiqueta}</div><div className="an-pad-card-txt">{a.txt}</div></div>
                ))}
              </>
            )}
            {resultado.padroes.length > 0 && (
              <>
                <div className="an-pad-titulo" style={{ color: accent, marginTop: resultado.alterados.length ? 12 : 0 }}>Padrões reconhecidos</div>
                {resultado.padroes.map((pad) => (
                  <div key={pad.id} className="an-pad-card">
                    <div className="an-pad-card-top">
                      <div className="an-pad-card-nm">{pad.nm}</div>
                      <a className="an-pesquisar" href={construirQueryPesquisa(pad.nm, dSel, dVals, parametros, sexo, uRefs)} target="_blank" rel="noopener">{I.search("currentColor", 12)} Pesquisar</a>
                    </div>
                    <div className="an-pad-card-txt">{pad.txt}</div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    );
  }

  // ════ Vista de edição ════
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

      {/* ── Modal: preencher ── */}
      {modal === "preencher" && (
        <div className="an-modal" onClick={() => setModal(null)}>
          <div className="an-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="an-modal-head">
              <div className="an-modal-nome" style={{ fontSize: 16 }}>Preencher valores</div>
              <button className="an-modal-x" onClick={() => setModal(null)}>{I.close("currentColor", 18)}</button>
            </div>
            <div className="an-modal-body">
              <div className="an-ctx" style={{ flexWrap: "wrap" }}>
                <span className="an-ctx-l">Sexo</span>
                <div className="an-spill"><button className={sexo === "M" ? "on" : ""} onClick={() => setSexo("M")}>M</button><button className={sexo === "F" ? "on" : ""} onClick={() => setSexo("F")}>F</button></div>
                <span className="an-ctx-l">Idade</span><input className="campo an-mini" type="number" value={idade} onChange={(e) => setIdade(e.target.value)} placeholder="—" />
                <span className="an-ctx-l">Peso</span><input className="campo an-mini" type="number" value={peso} onChange={(e) => setPeso(e.target.value)} placeholder="kg" />
              </div>
              <div className="an-fill-grid">
                {dSel.map((id, i) => {
                  const p = parametros.find((x) => x.id === id);
                  const v = dVals[id];
                  const ei = v && v.status ? ESTADO_INFO[v.status] : null;
                  return (
                    <div key={id} className="an-fill-campo">
                      <label>{p.ab} <span style={{ color: "var(--tenue)", fontWeight: 500 }}>{p.un}</span></label>
                      <input
                        ref={(el) => (inputsRef.current[i] = el)}
                        type="number" step="any" value={v?.val ?? ""} placeholder="—"
                        onChange={(e) => setValor(id, e.target.value)}
                        onKeyDown={(e) => onKeyCampo(e, i)}
                        style={ei ? { color: ei.texto, borderColor: ei.borda } : undefined}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="an-modal-foot"><button className="an-btn-pri" style={{ background: accent, width: "100%" }} onClick={gerar}>Gerar resumo</button></div>
          </div>
        </div>
      )}

      {/* ── Modal: selecionar parâmetros / criar modelo ── */}
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
                          <button key={p.id} className={"an-pick-item" + (pick.includes(p.id) ? " on" : "")} onClick={() => togPick(p.id)}>
                            {p.ab}
                          </button>
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
