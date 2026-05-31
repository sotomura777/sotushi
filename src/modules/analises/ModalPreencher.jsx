import { useState, useRef } from "react";
import parametros from "@conteudo/analises/parametros.json";
import { getEstado, ESTADO_INFO } from "./logica";
import { I } from "@/components/icones";

// Modal reutilizável para preencher valores de um conjunto de parâmetros.
// Gere os seus próprios valores; ao submeter devolve (valores, { idade, peso }).
export default function ModalPreencher({
  titulo = "Preencher valores", ids, sexo, setSexo, uRefs,
  valoresIniciais = {}, idadePeso = true, submitLabel = "Gerar resumo",
  onSubmit, onClose, accent,
}) {
  const [vals, setVals] = useState(valoresIniciais);
  const [idade, setIdade] = useState("");
  const [peso, setPeso] = useState("");
  const inputs = useRef([]);

  const setValor = (id, val) => {
    const p = parametros.find((x) => x.id === id);
    const status = getEstado(p, val, sexo, uRefs);
    setVals((v) => ({ ...v, [id]: { val, status } }));
  };
  const submeter = () => onSubmit(vals, { idade: idade ? Number(idade) : null, peso: peso ? Number(peso) : null });
  const onKey = (e, i) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    if (i + 1 < ids.length) inputs.current[i + 1]?.focus();
    else submeter();
  };

  return (
    <div className="an-modal" onClick={onClose}>
      <div className="an-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="an-modal-head">
          <div className="an-modal-nome" style={{ fontSize: 16 }}>{titulo}</div>
          <button className="an-modal-x" onClick={onClose}>{I.close("currentColor", 18)}</button>
        </div>
        <div className="an-modal-body">
          <div className="an-ctx" style={{ flexWrap: "wrap" }}>
            <span className="an-ctx-l">Sexo</span>
            <div className="an-spill">
              <button className={sexo === "M" ? "on" : ""} onClick={() => setSexo("M")}>M</button>
              <button className={sexo === "F" ? "on" : ""} onClick={() => setSexo("F")}>F</button>
            </div>
            {idadePeso && (
              <>
                <span className="an-ctx-l">Idade</span><input className="campo an-mini" type="number" value={idade} onChange={(e) => setIdade(e.target.value)} placeholder="—" />
                <span className="an-ctx-l">Peso</span><input className="campo an-mini" type="number" value={peso} onChange={(e) => setPeso(e.target.value)} placeholder="kg" />
              </>
            )}
          </div>
          <div className="an-fill-grid">
            {ids.map((id, i) => {
              const p = parametros.find((x) => x.id === id);
              if (!p) return null;
              const v = vals[id];
              const ei = v && v.status ? ESTADO_INFO[v.status] : null;
              return (
                <div key={id} className="an-fill-campo">
                  <label>{p.ab} <span style={{ color: "var(--tenue)", fontWeight: 500 }}>{p.un}</span></label>
                  <input
                    ref={(el) => (inputs.current[i] = el)}
                    type="number" step="any" value={v?.val ?? ""} placeholder="—"
                    onChange={(e) => setValor(id, e.target.value)}
                    onKeyDown={(e) => onKey(e, i)}
                    style={ei ? { color: ei.texto, borderColor: ei.borda } : undefined}
                  />
                </div>
              );
            })}
          </div>
        </div>
        <div className="an-modal-foot">
          <button className="an-btn-pri" style={{ background: accent, width: "100%" }} onClick={submeter}>{submitLabel}</button>
        </div>
      </div>
    </div>
  );
}
