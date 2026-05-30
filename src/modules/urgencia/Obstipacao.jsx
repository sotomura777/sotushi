import { useState } from "react";
import obst from "@conteudo/urgencia/obstipacao.json";
import { gerarResultado } from "./obstipacao";
import { I, Ico } from "@/components/icones";

const STEPS = obst.steps;
const ANTECEDENTES = obst.antecedentes;
const MEDS = obst.meds;

export default function Obstipacao({ accent = "#d97706", voltar }) {
  const [OStep, setOStep] = useState(0);
  const [OA, setOA] = useState({});
  const [OPath, setOPath] = useState("aguda");
  const [sel, setSel] = useState({}); // multi/meds: {val: 'plain'|'flag'} ou {medString:true}
  const [confirmBloq, setConfirmBloq] = useState(false);
  const [antQ, setAntQ] = useState("");
  const [copiado, setCopiado] = useState(false);

  const reiniciar = () => { setOStep(0); setOA({}); setOPath("aguda"); setSel({}); setConfirmBloq(false); setAntQ(""); };
  const avancar = () => { setSel({}); setAntQ(""); setOStep((s) => s + 1); };

  const fim = OStep >= STEPS.length;
  const step = fim ? null : STEPS[OStep];

  // ---- single ----
  function responderSingle(id, opt, oi) {
    if (id === "confirm" && opt.val === "nao") { setConfirmBloq(true); return; }
    setOA((p) => ({ ...p, [id]: [{ val: opt.val, label: opt.t }] }));
    if (id === "tipo") setOPath(opt.val === "cronica" ? "cronica" : "aguda");
    avancar();
  }

  // ---- multi ----
  function optsMulti(s) {
    if (s.id === "alarme") return OPath === "cronica" ? s.opts_cronica : s.opts_aguda;
    return s.opts;
  }
  function toggleMulti(o) {
    setSel((prev) => {
      const n = { ...prev };
      if (o.none) return n[o.val] ? {} : { [o.val]: "plain" };
      // limpar opção "nenhum"
      Object.keys(n).forEach((k) => { const op = optsMulti(step).find((x) => x.val === k); if (op?.none) delete n[k]; });
      if (o.flagged) { if (n[o.val] === "flag") delete n[o.val]; else n[o.val] = "flag"; }
      else { if (n[o.val] === "plain") delete n[o.val]; else n[o.val] = "plain"; }
      return n;
    });
  }
  function continuarMulti(s) {
    const opts = optsMulti(s);
    const vals = Object.keys(sel);
    const arr = vals.map((val) => { const o = opts.find((x) => x.val === val); return { val, label: o ? o.t : val, flagged: sel[val] === "flag" }; });
    setOA((p) => ({ ...p, [s.id]: arr.length ? arr : [{ val: "nenhum", label: "Nenhum", flagged: false }] }));
    avancar();
  }

  // ---- meds ----
  function toggleMed(m, idx) {
    setSel((prev) => {
      const ultimo = idx === MEDS.length - 1;
      if (ultimo) return prev[m] ? {} : { [m]: true };
      const n = { ...prev };
      delete n[MEDS[MEDS.length - 1]]; // limpar "nenhuma"
      if (n[m]) delete n[m]; else n[m] = true;
      return n;
    });
  }
  function continuarMeds() {
    const escolhidas = Object.keys(sel);
    const ultimo = MEDS[MEDS.length - 1];
    let meds;
    if (escolhidas.length === 0 || (escolhidas.length === 1 && escolhidas[0] === ultimo)) meds = ["nenhuma"];
    else meds = escolhidas.filter((m) => m !== ultimo);
    setOA((p) => ({ ...p, meds }));
    avancar();
  }

  // ---- outros_ap ----
  const outrosAp = OA.outros_ap || [];
  const addAnt = (a) => { if (!outrosAp.includes(a)) setOA((p) => ({ ...p, outros_ap: [...(p.outros_ap || []), a] })); setAntQ(""); };
  const remAnt = (a) => setOA((p) => ({ ...p, outros_ap: (p.outros_ap || []).filter((x) => x !== a) }));
  const sugestoes = antQ.trim().length >= 2 ? ANTECEDENTES.filter((a) => a.toLowerCase().includes(antQ.toLowerCase())).slice(0, 8) : [];

  const progresso = STEPS.map((s) => s.label).concat(["Resultado"]);

  return (
    <div style={{ "--acento": accent }}>
      <button className="voltar" style={{ color: accent, marginBottom: 12 }} onClick={voltar}>‹ Sintomas</button>

      {/* Progresso */}
      <div className="ob-prog">
        {progresso.map((lbl, i) => {
          const done = i < OStep, active = i === OStep || (i === progresso.length - 1 && fim);
          return (
            <div key={i} className={"ob-prog-step" + (done ? " done" : active ? " active" : "")}>
              <span className="ob-prog-dot" style={done || active ? { borderColor: accent, color: accent } : undefined}>{done ? <Ico name="check" s={13} /> : i + 1}</span>
              <span className="ob-prog-lbl">{lbl}</span>
            </div>
          );
        })}
      </div>

      {/* Ecrã "confirmar primeiro" */}
      {confirmBloq && (
        <div style={{ textAlign: "center", padding: "32px 16px" }}>
          <div style={{ marginBottom: 12, color: "var(--suave)", display: "flex", justifyContent: "center" }}>{I.clipboard("currentColor", 32)}</div>
          <div style={{ fontFamily: "var(--fonte-display)", fontSize: 20, color: "var(--texto)", marginBottom: 10 }}>Confirmar obstipação primeiro</div>
          <div style={{ fontSize: 13, color: "var(--suave)", lineHeight: 1.7, maxWidth: 400, margin: "0 auto 18px" }}>Menos de 3 dejeções espontâneas por semana, ou 2+ critérios Roma IV. Intervalo normal: 3 vezes/dia a 3 vezes/semana.</div>
          <button className="ob-cont" style={{ background: accent, maxWidth: 300, margin: "0 auto" }} onClick={() => setConfirmBloq(false)}>Voltar e confirmar</button>
        </div>
      )}

      {/* Passo atual */}
      {!fim && !confirmBloq && (
        <div>
          <div className="ob-step-label">Passo {OStep + 1} de {STEPS.length}</div>
          <div className="ob-step-title">{step.title}</div>
          <div className="ob-step-sub">{step.sub}</div>

          {step.extra_roma && (
            <details className="ob-roma">
              <summary>Ver critérios Roma IV</summary>
              <div style={{ padding: "0 14px 12px", fontSize: 12, color: "var(--texto-2)", lineHeight: 1.6 }}>
                Requer <strong>2 ou mais</strong> nos últimos 3 meses (início há ≥6 meses): esforço evacuatório, fezes duras (Bristol 1-2), sensação de evacuação incompleta, sensação de obstrução anorretal ou manobras manuais em &gt;25% das dejeções; ou &lt;3 dejeções espontâneas/semana.
              </div>
            </details>
          )}

          {/* SINGLE */}
          {step.type === "single" && (
            <div className="ob-opts">
              {step.opts.map((o, oi) => (
                <button key={o.val} className="ob-opt" onClick={() => responderSingle(step.id, o, oi)}>
                  <div className="ob-opt-t">{o.t}</div>
                  <div className="ob-opt-d">{o.d}</div>
                </button>
              ))}
            </div>
          )}

          {/* MULTI */}
          {step.type === "multi" && (
            <>
              <div className="ob-hint">Podes selecionar vários. Clica Continuar quando terminares.</div>
              <div className="ob-checks">
                {optsMulti(step).map((o) => {
                  const st = sel[o.val];
                  return (
                    <div key={o.val} className={"ob-chk" + (st === "flag" ? " sel-r" : st ? " sel" : "")} onClick={() => toggleMulti(o)}>
                      <span className="ob-chk-box">{I.check("currentColor", 13)}</span>
                      <div style={{ flex: 1 }}>
                        <div className="ob-chk-t">{o.t}</div>
                        {o.d && <div className="ob-chk-d">{o.d}</div>}
                        {o.flagged && <div className="ob-chk-flag">Sinal de alarme</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
              <button className="ob-cont" style={{ background: accent }} onClick={() => continuarMulti(step)}>Continuar →</button>
            </>
          )}

          {/* MEDS */}
          {step.type_special === "meds_search" && (
            <>
              <div className="ob-checks">
                {MEDS.map((m, idx) => (
                  <div key={idx} className={"ob-chk" + (sel[m] ? " sel" : "")} onClick={() => toggleMed(m, idx)}>
                    <span className="ob-chk-box">{I.check("currentColor", 13)}</span>
                    <div style={{ flex: 1 }}><div className="ob-chk-t">{m}</div></div>
                  </div>
                ))}
              </div>
              <button className="ob-cont" style={{ background: accent }} onClick={continuarMeds}>Continuar →</button>
            </>
          )}

          {/* OUTROS AP (pesquisa) */}
          {step.type === "special_ant" && (
            <>
              <div style={{ position: "relative", marginBottom: 8 }}>
                <input className="campo" style={{ width: "100%" }} placeholder="Pesquisar antecedente… (ex: HTA, DM2, cirurgia)" value={antQ} onChange={(e) => setAntQ(e.target.value)} />
                {sugestoes.length > 0 && (
                  <div className="ob-dropdown">
                    {sugestoes.map((r) => <div key={r} className="ob-dd-item" onClick={() => addAnt(r)}>{r}</div>)}
                  </div>
                )}
              </div>
              <div className="ob-tags">
                {outrosAp.length ? outrosAp.map((a) => <span key={a} className="ob-tag" onClick={() => remAnt(a)}>{a} ×</span>) : <span style={{ fontSize: 12, color: "var(--tenue)" }}>Nenhum adicionado</span>}
              </div>
              <button className="ob-cont" style={{ background: accent, marginTop: 14 }} onClick={avancar}>Continuar →</button>
            </>
          )}
        </div>
      )}

      {/* RESULTADO */}
      {fim && <Resultado OA={OA} accent={accent} reiniciar={reiniciar} copiado={copiado} setCopiado={setCopiado} />}
    </div>
  );
}

function Resultado({ OA, accent, reiniciar, copiado, setCopiado }) {
  const { note, excluir, dx, tx } = gerarResultado(OA, STEPS);
  const copiar = () => {
    const txt = note.replace(/<[^>]+>/g, "");
    navigator.clipboard?.writeText(txt).then(() => { setCopiado(true); setTimeout(() => setCopiado(false), 1500); });
  };
  return (
    <div>
      <div className="ob-disc">Ferramenta educativa · não substitui a avaliação clínica presencial.</div>

      <div className="ob-sec">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div className="ob-sec-label">Nota clínica</div>
          <button className="ob-copy" onClick={copiar}>{copiado ? <><Ico name="check" s={12} style={{ marginRight: 3 }} />Copiado</> : "Copiar nota"}</button>
        </div>
        <div className="ob-note" dangerouslySetInnerHTML={{ __html: note }} />
      </div>

      {excluir.length > 0 && (
        <div className="ob-sec">
          <div className="ob-sec-label" style={{ color: "#dc2626" }}>1. Excluir primeiro</div>
          <div style={{ fontSize: 11.5, color: "var(--suave)", marginBottom: 10 }}>Do mais urgente para o menos urgente.</div>
          {excluir.map((e, i) => (
            <div key={i} className={"ob-excl ob-excl--" + e.u}>
              <span className="ob-excl-badge" style={{ background: e.u === "red" ? "#dc2626" : "#d97706" }}>{e.u === "red" ? "Urgente · excluir" : "Avaliar"}</span>
              <div className="ob-excl-name">{e.name}</div>
              {e.sinais && <div className="ob-excl-sinais">{e.sinais}</div>}
              <div className="ob-excl-action">→ {e.action}</div>
            </div>
          ))}
        </div>
      )}

      {dx.length > 0 && (
        <div className="ob-sec">
          <div className="ob-sec-label">2. Diagnósticos prováveis</div>
          {dx.map((d, i) => (
            <div key={i} className="cartao" style={{ padding: "13px 15px", marginBottom: 8 }}>
              <div className="ob-sec-label" style={{ marginBottom: 4 }}>Diagnóstico {i + 1}</div>
              <div style={{ fontWeight: 700, fontSize: 14, color: "var(--texto)" }}>{d.name}</div>
              <div style={{ fontSize: 12, color: "var(--suave)", margin: "3px 0 10px", lineHeight: 1.5 }}>{d.prob}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <div style={{ background: "var(--superficie-2)", borderRadius: 6, padding: "8px 10px", border: "1px solid var(--borda)" }}>
                  <div className="ob-mini">Exames</div><div style={{ fontSize: 12, color: "var(--texto)" }}>{d.exames}</div>
                </div>
                <div style={{ background: "rgba(217,119,6,.06)", borderRadius: 6, padding: "8px 10px", border: "1px solid rgba(217,119,6,.18)" }}>
                  <div className="ob-mini" style={{ color: "#d97706" }}>O que fazer</div><div style={{ fontSize: 12, color: "var(--texto)" }}>{d.fazer}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="ob-sec">
        <div className="ob-sec-label">3. Orientação terapêutica</div>
        {tx.map((t, i) => (
          <div key={i} className="cartao" style={{ padding: "12px 14px", marginBottom: 8 }}>
            <div className="ob-mini">{t.cat}</div>
            <ul style={{ margin: "6px 0 0", padding: 0, listStyle: "none" }}>
              {t.items.map((x, j) => <li key={j} style={{ fontSize: 12, padding: "4px 0", borderBottom: "1px solid var(--borda-2)", display: "flex", gap: 7, lineHeight: 1.5, color: "var(--texto)" }}><span style={{ color: "#d97706" }}>→</span><span>{x}</span></li>)}
            </ul>
          </div>
        ))}
      </div>

      <button className="ob-cont" style={{ background: accent, maxWidth: 260 }} onClick={reiniciar}>Recomeçar algoritmo</button>
    </div>
  );
}
