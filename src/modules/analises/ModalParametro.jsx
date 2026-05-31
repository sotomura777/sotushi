import { useState } from "react";
import { getIntervalo, getEstado, interpretacao, ESTADO_INFO } from "./logica";
import { I, Ico } from "@/components/icones";

// Modal de um parâmetro: Saber mais, sexo, referência (+ editar), valor →
// interpretação, forçar ↓/↑, e guardar no slot do Explorar.
export default function ModalParametro({
  param, subtitulo, sexo, setSexo, uRefs, infoTexto, slotAtual,
  onSaveRef, onResetRef, onGuardar, onClose, accent,
}) {
  const [val, setVal] = useState(slotAtual?.val ?? "");
  const [force, setForce] = useState(slotAtual?.force ?? null);
  const [editandoRef, setEditandoRef] = useState(false);
  const [mostrarInfo, setMostrarInfo] = useState(false);
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");

  const ref = getIntervalo(param, sexo, uRefs);
  const status = getEstado(param, val, sexo, uRefs, force);
  const ei = status ? ESTADO_INFO[status] : null;
  const interp = status === "low" || status === "high" ? interpretacao(param, status) : null;
  const temRefCustom = !!(uRefs && uRefs[param.id]);

  // Barra visual: domínio alargado em torno da referência.
  const span = Math.max(ref.max - ref.min, Math.abs(ref.max) * 0.2 || 1);
  const dMin = ref.min - span * 0.6;
  const dMax = ref.max + span * 0.6;
  const pct = (x) => Math.max(0, Math.min(100, ((x - dMin) / (dMax - dMin)) * 100));
  const temVal = val !== "" && !Number.isNaN(Number(val)) && force == null;

  const abrirEdicao = () => { setMin(String(ref.min)); setMax(String(ref.max)); setEditandoRef(true); };
  const salvarRef = () => {
    const mn = parseFloat(min), mx = parseFloat(max);
    if (Number.isNaN(mn) || Number.isNaN(mx)) return;
    onSaveRef(param.id, { min: mn, max: mx });
    setEditandoRef(false);
  };
  const reporRef = () => { onResetRef(param.id); setEditandoRef(false); };
  const guardar = () => {
    if (!status) { onClose(); return; }
    onGuardar(param.id, { val, status, force });
    onClose();
  };

  return (
    <div className="an-modal" onClick={onClose}>
      <div className="an-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="an-modal-head">
          <div style={{ minWidth: 0 }}>
            <div className="an-modal-nome">{param.nm}</div>
            <div className="an-modal-sub">{param.ab}{subtitulo ? ` · ${subtitulo}` : ""}</div>
          </div>
          <div className="an-modal-acts">
            {infoTexto && (
              <button className="an-saber" onClick={() => setMostrarInfo((v) => !v)}>
                <Ico name="bulb" s={13} /> Saber mais
              </button>
            )}
            <button className="an-modal-x" onClick={onClose} aria-label="Fechar">{I.close("currentColor", 18)}</button>
          </div>
        </div>

        {mostrarInfo && infoTexto && <div className="an-info">{infoTexto}</div>}

        <div className="an-modal-body">
          <div className="an-ctx">
            <span className="an-ctx-l">Sexo</span>
            <div className="an-spill">
              <button className={sexo === "M" ? "on" : ""} onClick={() => setSexo("M")}>M</button>
              <button className={sexo === "F" ? "on" : ""} onClick={() => setSexo("F")}>F</button>
            </div>
          </div>

          <div className="an-rbox">
            <div className="an-rrow">
              <span className="an-ctx-l">Referência</span>
              <strong style={{ fontSize: 13, color: "var(--texto)" }}>
                {ref.min}–{ref.max} {param.un}{temRefCustom && <span style={{ color: accent, fontWeight: 600 }}> · personalizada</span>}
              </strong>
            </div>
            <div className="an-bar">
              <div className="an-bar-ok" style={{ left: `${pct(ref.min)}%`, width: `${pct(ref.max) - pct(ref.min)}%` }} />
              {temVal && <div className="an-bar-mark" style={{ left: `${pct(Number(val))}%`, background: ei ? ei.texto : accent }} />}
            </div>
            <button className="an-link" onClick={editandoRef ? () => setEditandoRef(false) : abrirEdicao}>
              {editandoRef ? "Fechar" : "Editar referências"}
            </button>
          </div>

          {editandoRef && (
            <div className="an-redit">
              <div className="an-redit-hint">Personalizar (guardado neste dispositivo):</div>
              <div className="an-redit-r"><span>Mínimo</span><input type="number" step="any" className="campo" value={min} onChange={(e) => setMin(e.target.value)} /></div>
              <div className="an-redit-r"><span>Máximo</span><input type="number" step="any" className="campo" value={max} onChange={(e) => setMax(e.target.value)} /></div>
              <div className="an-redit-btns">
                <button className="an-btn-pri" style={{ background: accent }} onClick={salvarRef}>Guardar</button>
                <button className="an-btn" onClick={reporRef}>Repor</button>
              </div>
            </div>
          )}

          <div className="an-vrow">
            <div className="an-vi" style={ei ? { borderColor: ei.borda } : undefined}>
              <input
                type="number" step="any" autoFocus value={val} placeholder="—"
                onChange={(e) => { setVal(e.target.value); setForce(null); }}
                onKeyDown={(e) => { if (e.key === "Enter") guardar(); if (e.key === "Escape") onClose(); }}
                style={ei ? { color: ei.texto } : undefined}
              />
              <span className="an-vu">{param.un}</span>
            </div>
            <div className="an-fbtns">
              <button className={"an-fb dn" + (force === "low" ? " on" : "")} title="Forçar baixo" onClick={() => setForce((f) => (f === "low" ? null : "low"))}>↓</button>
              <button className={"an-fb up" + (force === "high" ? " on" : "")} title="Forçar alto" onClick={() => setForce((f) => (f === "high" ? null : "high"))}>↑</button>
            </div>
            {ei && <span className="badge" style={{ background: ei.fundo, color: ei.texto, border: `1px solid ${ei.borda}` }}>{ei.etiqueta}</span>}
          </div>

          {interp && (
            <div className="an-interp" style={{ background: ei.fundo, borderColor: ei.borda, color: ei.texto }}>{interp}</div>
          )}

          {ei && param.tk && param.tk.length > 0 && (
            <div className="an-tk">
              <span className="an-tk-label">A pedir:</span>
              {param.tk.map((t, i) => <span key={i} className="an-tk-chip">{t}</span>)}
            </div>
          )}
        </div>

        <div className="an-modal-foot">
          <button className="an-btn-pri" style={{ background: accent, width: "100%" }} onClick={guardar}>
            {status ? "Guardar" : "Fechar"}
          </button>
        </div>
      </div>
    </div>
  );
}
