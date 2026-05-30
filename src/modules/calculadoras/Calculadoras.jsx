import { useState, useMemo, useRef, useEffect } from "react";
import doses from "@conteudo/calculadoras/doses.json";
import { calc, r1 } from "./logica";
import { Ico } from "@/components/icones";
import "./estilo.css";

const ENTRIES = doses.esquemas;

function SearchSelect({ value, onChange, accent }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const filtered = useMemo(() => {
    if (!q.trim()) return ENTRIES;
    const l = q.toLowerCase();
    return ENTRIES.filter((e) => e.label.toLowerCase().includes(l) || e.sub.toLowerCase().includes(l) || e.grupo.toLowerCase().includes(l));
  }, [q]);
  const groups = useMemo(() => {
    const g = {}; filtered.forEach((e) => { (g[e.grupo] = g[e.grupo] || []).push(e); }); return g;
  }, [filtered]);
  const sel = ENTRIES.find((e) => e.id === value);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div className="ca-select" onClick={() => setOpen(!open)}>
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, color: sel ? "var(--texto)" : "var(--tenue)" }}>{sel ? sel.label : "Pesquisar antibiótico…"}</span>
        <span style={{ fontSize: 10, color: "var(--tenue)", marginLeft: 8 }}>▼</span>
      </div>
      {open && (
        <div className="ca-dropdown">
          <div style={{ padding: "8px 10px", borderBottom: "1px solid var(--borda-2)" }}>
            <input autoFocus className="campo" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Escrever para pesquisar…" style={{ width: "100%" }} />
          </div>
          <div style={{ overflowY: "auto", maxHeight: 260 }}>
            {Object.keys(groups).length === 0 && <div style={{ padding: 14, fontSize: 13, color: "var(--tenue)", textAlign: "center" }}>Sem resultados</div>}
            {Object.entries(groups).map(([g, items]) => (
              <div key={g}>
                <div className="ca-grupo" style={{ color: accent }}>{g}</div>
                {items.map((e) => (
                  <div key={e.id} className={"ca-opt" + (value === e.id ? " on" : "")} onClick={() => { onChange(e.id); setOpen(false); setQ(""); }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--texto)" }}>{e.label}</div>
                    <div style={{ fontSize: 11, color: "var(--suave)" }}>{e.sub}</div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Calculadoras({ accent = "#0a8f6a", gradiente, onVoltar }) {
  const [peso, setPeso] = useState("");
  const [entryId, setEntryId] = useState("");
  const [formMg, setFormMg] = useState("");
  const [formMl, setFormMl] = useState("");
  const prevEntryId = useRef("");

  const p = parseFloat(peso);
  const pOk = p > 0 && p <= 200;
  const entry = ENTRIES.find((e) => e.id === entryId);
  const resultado = pOk && entry ? calc(p, entry) : null;

  const fMg = parseFloat(formMg);
  const fMl = parseFloat(formMl);
  const formOk = fMg > 0 && fMl > 0;
  const isComp = entry && entry.defMl === 0;

  let volToma = null;
  if (resultado && formOk && !isComp) volToma = r1(resultado.porToma / (fMg / fMl));
  let nComp = null;
  if (resultado && isComp && fMg > 0) nComp = r1(resultado.porToma / fMg);

  useEffect(() => {
    if (entry && entry.id !== prevEntryId.current) {
      setFormMg(String(entry.defMg));
      setFormMl(entry.defMl > 0 ? String(entry.defMl) : "");
      prevEntryId.current = entry.id;
    }
  }, [entry]);

  return (
    <div style={{ "--acento": accent }}>
      <header className="hero" style={{ background: gradiente || accent }}>
        <div className="hero-conteudo">
          <button className="voltar" onClick={onVoltar}>← Início</button>
          <div className="hero-titulo">Doses Pediátricas</div>
          <div className="hero-subtitulo">Antibióticos · dose por peso corporal</div>
        </div>
      </header>

      <div className="modulo-corpo">
        <div style={{ marginBottom: 14 }}>
          <label className="ca-lbl">Peso da criança (kg)</label>
          <input type="number" min="0.5" max="200" step="0.1" className="campo" style={{ maxWidth: 150, fontSize: 16, fontWeight: 600 }} value={peso} onChange={(e) => setPeso(e.target.value)} placeholder="Ex: 20" />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label className="ca-lbl">Antibiótico</label>
          <SearchSelect value={entryId} onChange={(id) => { setEntryId(id); prevEntryId.current = ""; }} accent={accent} />
        </div>

        {entry && (
          <div style={{ marginBottom: 18 }}>
            <label className="ca-lbl">{isComp ? "Comprimido (mg)" : "Formulação da suspensão"}</label>
            {isComp ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input type="number" min="1" step="1" className="campo" style={{ width: 90, textAlign: "center" }} value={formMg} onChange={(e) => setFormMg(e.target.value)} />
                <span style={{ fontSize: 13, color: "var(--suave)", fontWeight: 600 }}>mg / comp</span>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input type="number" min="1" step="1" className="campo" style={{ width: 80, textAlign: "center" }} value={formMg} onChange={(e) => setFormMg(e.target.value)} />
                <span style={{ fontSize: 13, color: "var(--suave)", fontWeight: 600 }}>mg</span>
                <span style={{ fontSize: 16, color: "var(--tenue)" }}>/</span>
                <input type="number" min="0.1" step="0.1" className="campo" style={{ width: 70, textAlign: "center" }} value={formMl} onChange={(e) => setFormMl(e.target.value)} />
                <span style={{ fontSize: 13, color: "var(--suave)", fontWeight: 600 }}>mL</span>
              </div>
            )}
            <div style={{ fontSize: 11, color: "var(--tenue)", marginTop: 4 }}>
              {isComp ? "Altera conforme a dosagem do comprimido disponível." : "Pré-preenchido com a formulação mais comum. Altera conforme o frasco disponível."}
            </div>
          </div>
        )}

        {resultado && entry && (
          <div className="ca-res">
            <span className="ca-badge" style={{ background: "color-mix(in srgb, var(--acento) 14%, transparent)", color: accent }}>Resultado do cálculo</span>
            <div style={{ fontSize: 12, fontWeight: 700, color: accent, textTransform: "uppercase", letterSpacing: ".03em", margin: "10px 0 6px" }}>{entry.label}</div>

            <div className="ca-big">{resultado.porToma} mg <span className="ca-big-u">/ toma</span></div>

            {!isComp && volToma !== null && (
              <div className="ca-sub">
                <div className="ca-sub-lbl" style={{ color: accent }}>Volume de suspensão — {fMg} mg / {fMl} mL</div>
                <div className="ca-mid">{volToma} mL <span className="ca-big-u">/ toma</span></div>
                <div style={{ fontSize: 11, color: "var(--suave)", marginTop: 3 }}>Agitar o frasco antes de usar. Usar seringa oral ou copo medidor.</div>
              </div>
            )}
            {isComp && nComp !== null && (
              <div className="ca-sub">
                <div className="ca-sub-lbl" style={{ color: accent }}>Comprimidos — {fMg} mg</div>
                <div className="ca-mid">{nComp} comp <span className="ca-big-u">/ toma</span></div>
              </div>
            )}

            <div style={{ marginTop: 14, fontSize: 13, color: "var(--texto-2)", lineHeight: 1.7 }}>
              Dose diária total: <b>{resultado.doseDia} mg/dia</b><br />
              Frequência: <b>{resultado.intH}/{resultado.intH}h</b> — {resultado.nTomas} toma{resultado.nTomas > 1 ? "s" : ""}/dia<br />
              Duração: <b>{resultado.dias} dia{resultado.dias > 1 ? "s" : ""}</b>
            </div>

            {entry.sub && <div style={{ fontSize: 11, color: "var(--tenue)", marginTop: 8, fontStyle: "italic" }}>{entry.sub}</div>}

            {resultado.alerta && <div className="ca-alerta"><Ico name="warn" s={14} style={{ marginRight: 4 }} />Teto máximo aplicado: {entry.teto} mg/dia</div>}

            <div className="ca-chips">
              <span>Peso: <b>{p} kg</b></span>
              <span>Base: <b>{entry.fixaMg ? `${entry.fixaMg} mg (fixa)` : `${entry.dose} mg/kg/dia`}</b></span>
              <span>Máx: <b>{entry.teto} mg/dia</b></span>
            </div>
          </div>
        )}

        {entry && entry.nota && resultado && <div className="ca-nota"><Ico name="clipboard" s={14} style={{ marginRight: 5 }} />{entry.nota}</div>}

        <div className="rodape"><strong><Ico name="staff" s={13} style={{ marginRight: 4 }} />Não substitui o julgamento clínico.</strong> Confirmar sempre com o RCM. Doses do Guia PAPA ARS LVT, baseadas no peso corporal.</div>
      </div>
    </div>
  );
}
