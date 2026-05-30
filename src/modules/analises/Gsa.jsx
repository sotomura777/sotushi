import { useState } from "react";
import gsaConteudo from "@conteudo/analises/gsa.json";
import { interpretarGSA } from "./gsa";
import { Ico } from "@/components/icones";

const NIVEL_COR = { danger: "#dc2626", warning: "#f59e0b", ok: "#16a34a" };

export default function Gsa() {
  const [tab, setTab] = useState("rap");
  const [suporte, setSuporte] = useState("aa");
  const [idade, setIdade] = useState("");
  const [o2l, setO2l] = useState("1");
  const [fio2pct, setFio2pct] = useState("");
  const [valores, setValores] = useState({});
  const [resultado, setResultado] = useState(null);
  const [copiado, setCopiado] = useState(false);

  const { campos, referencias, textos } = gsaConteudo;
  const fields = tab === "comp" ? campos.rapida.concat(campos.extra) : campos.rapida;

  const setVal = (id, v) => setValores((p) => ({ ...p, [id]: v }));

  function interpretar() {
    const v = {};
    fields.forEach((f) => {
      const raw = valores[f.id];
      const n = raw === "" || raw == null ? null : parseFloat(raw);
      if (n != null && !Number.isNaN(n)) v[f.var] = n;
    });
    const opts = { idade: parseInt(idade, 10) || 50, suporte, o2l, fio2pct };
    setResultado(interpretarGSA(v, opts, referencias, textos));
    setCopiado(false);
  }

  function limpar() {
    setValores({});
    setResultado(null);
    setCopiado(false);
  }

  function copiar() {
    const partes = [];
    fields.forEach((f) => {
      const raw = valores[f.id];
      if (raw !== "" && raw != null) partes.push(f.nm + " " + raw + (f.un ? " " + f.un : ""));
    });
    if (!partes.length) return;
    const sup = resultado?.supLabel || "AA";
    const d = new Date();
    const dd = String(d.getDate()).padStart(2, "0"), mm = String(d.getMonth() + 1).padStart(2, "0");
    const txt = "GSA " + sup + " (" + dd + "/" + mm + "): " + partes.join(", ");
    navigator.clipboard?.writeText(txt).then(() => { setCopiado(true); setTimeout(() => setCopiado(false), 1500); });
  }

  const valido = resultado && !resultado.erro;

  return (
    <div>
      {/* Tabs rápida / completa */}
      <div className="filtros" style={{ marginBottom: 12 }}>
        <button className={"filtro" + (tab === "rap" ? " filtro--ativo" : "")} style={tab === "rap" ? { background: "var(--acento)" } : undefined} onClick={() => setTab("rap")}>GSA rápida</button>
        <button className={"filtro" + (tab === "comp" ? " filtro--ativo" : "")} style={tab === "comp" ? { background: "var(--acento)" } : undefined} onClick={() => setTab("comp")}>GSA completa</button>
      </div>

      {/* Contexto: idade + suporte */}
      <div className="gsa-ctx">
        <span className="gsa-ctx-l">Idade</span>
        <input type="number" className="campo" style={{ width: 64, textAlign: "center" }} value={idade} onChange={(e) => setIdade(e.target.value)} placeholder="—" />
        <span className="gsa-ctx-l">Suporte</span>
        <div className="gsa-sup">
          {[["aa", "Nenhum"], ["o2", "O₂"], ["vm", "Ventilação"]].map(([id, lbl]) => (
            <button key={id} className={suporte === id ? "on" : ""} onClick={() => setSuporte(id)}>{lbl}</button>
          ))}
        </div>
        {suporte === "o2" && (
          <span><input type="number" className="campo" style={{ width: 64 }} value={o2l} onChange={(e) => setO2l(e.target.value)} placeholder="L/min" /> <span className="gsa-ctx-l">L/min</span></span>
        )}
        {suporte === "vm" && (
          <span><input type="number" className="campo" style={{ width: 64 }} value={fio2pct} onChange={(e) => setFio2pct(e.target.value)} placeholder="FiO₂%" /> <span className="gsa-ctx-l">FiO₂%</span></span>
        )}
      </div>

      {/* Campos */}
      <div className="cartao" style={{ padding: 14, marginTop: 12 }}>
        <div className="gsa-grelha">
          {fields.map((f) => (
            <div key={f.id} className="gsa-campo">
              <label>{f.nm}{f.un ? <span style={{ color: "var(--tenue)", fontWeight: 400 }}> ({f.un})</span> : null}</label>
              <input type="number" step={f.step} className="campo" value={valores[f.id] ?? ""} onChange={(e) => setVal(f.id, e.target.value)} placeholder="—" />
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button className="filtro filtro--ativo" style={{ background: "var(--acento)", padding: "9px 18px" }} onClick={interpretar}>Interpretar</button>
          <button className="filtro" style={{ padding: "9px 18px" }} onClick={limpar}>Limpar</button>
        </div>
        <div style={{ fontSize: 11, color: "var(--tenue)", marginTop: 8 }}>Mínimo: pH, pCO₂ e HCO₃⁻.</div>
      </div>

      {/* Resultado */}
      {resultado && resultado.erro && (
        <div className="an-interp" style={{ background: "#fffbeb", borderColor: "#fde68a", color: "#92400e", marginTop: 12 }}>{resultado.erro}</div>
      )}

      {valido && (
        <div style={{ marginTop: 14 }}>
          <div className="cartao" style={{ padding: "14px 16px", marginBottom: 10 }}>
            <div className="secao-label" style={{ marginBottom: 4 }}>Estes dados apontam para</div>
            <div style={{ fontFamily: "var(--fonte-display)", fontSize: 22, color: "var(--texto)", lineHeight: 1.1 }}>{resultado.dx}</div>
            <div style={{ fontSize: 12, color: "var(--suave)", marginTop: 4 }}>
              pH {resultado.resumo.ph.toFixed(2)} · pCO₂ {resultado.resumo.pco2.toFixed(1)} · HCO₃⁻ {resultado.resumo.hco3.toFixed(1)}
              {resultado.resumo.lact != null ? " · Lac " + resultado.resumo.lact.toFixed(2) : ""}
              {resultado.resumo.po2 != null ? " · pO₂ " + resultado.resumo.po2.toFixed(1) : ""} · {resultado.supLabel}
            </div>
          </div>

          {resultado.passos.map((p, i) => (
            <div key={i} className="cartao" style={{ padding: "12px 14px", marginBottom: 8 }}>
              <div style={{ fontWeight: 700, fontSize: 13.5, color: "var(--texto)", display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: NIVEL_COR[p.nivel] }} />{p.titulo}
              </div>
              <div style={{ fontSize: 13.5, lineHeight: 1.55, color: "var(--texto-2)" }}>{p.corpo}</div>
            </div>
          ))}

          <button className="filtro" style={{ padding: "9px 16px", marginTop: 2 }} onClick={copiar}>{copiado ? <><Ico name="check" s={12} style={{ marginRight: 3 }} />Copiado</> : "Copiar texto"}</button>

          <details style={{ marginTop: 14 }}>
            <summary style={{ fontSize: 13, color: "var(--acento)", cursor: "pointer", fontWeight: 600 }}>Ainda com dúvidas? Como ler uma gasimetria</summary>
            <div className="cartao" style={{ padding: "12px 14px", marginTop: 8 }}>
              {textos.comoLer.map((c, i) => (
                <div key={i} style={{ marginBottom: 8, fontSize: 13, lineHeight: 1.55, color: "var(--texto-2)" }}>
                  <b style={{ color: "var(--texto)" }}>{c.t}</b> — {c.d}
                </div>
              ))}
            </div>
          </details>
        </div>
      )}
    </div>
  );
}
