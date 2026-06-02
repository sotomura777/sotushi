import { useState } from "react";
import { interpretarTannerF, interpretarTannerM, PRI_INFO } from "./tanner";
import { Ico } from "@/components/icones";

const ESCALAS = {
  F: [["M", "Mama"], ["PF", "Pilosidade púbica"]],
  M: [["T", "Volume testicular"], ["PM", "Pilosidade púbica"]],
};

export default function Tanner({ accent }) {
  const [sexo, setSexo] = useState("F");
  const [idade, setIdade] = useState("");
  const [stadios, setStadios] = useState({ M: 0, PF: 0, T: 0, PM: 0 });

  const set = (tipo, val) => setStadios((p) => ({ ...p, [tipo]: val }));
  const trocarSexo = (s) => { setSexo(s); setStadios({ M: 0, PF: 0, T: 0, PM: 0 }); };

  const idadeN = parseFloat(idade);
  const resultado = !Number.isNaN(idadeN) ? (sexo === "F" ? interpretarTannerF(stadios, idadeN) : interpretarTannerM(stadios, idadeN)) : null;
  const pi = resultado ? PRI_INFO[resultado.pri] : null;

  return (
    <div>
      <div className="si-alerta" style={{ borderColor: `color-mix(in srgb, ${accent} 26%, transparent)`, background: `color-mix(in srgb, ${accent} 9%, transparent)`, color: "var(--suave)", fontSize: 12.5, lineHeight: 1.45 }}>
        <Ico name="library" s={18} style={{ flexShrink: 0, marginTop: 1, color: accent }} />
        <span><strong style={{ color: "var(--texto)" }}>Ferramenta de estudo / referência.</strong> Para aprender o estadiamento de Tanner e o raciocínio associado. Não substitui avaliação clínica.</span>
      </div>

      <div className="an-sexo" style={{ marginBottom: 10 }}>
        <button className={sexo === "F" ? "on" : ""} onClick={() => trocarSexo("F")}><Ico name="female" s={14} style={{ marginRight: 5 }} />Rapariga</button>
        <button className={sexo === "M" ? "on" : ""} onClick={() => trocarSexo("M")}><Ico name="male" s={14} style={{ marginRight: 5 }} />Rapaz</button>
      </div>

      <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "var(--texto-2)", marginBottom: 10 }}>
        Idade (anos)
        <input type="number" className="campo" style={{ width: 90, marginLeft: 8 }} value={idade} onChange={(e) => setIdade(e.target.value)} placeholder="ex: 11" />
      </label>

      {ESCALAS[sexo].map(([tipo, lbl]) => (
        <div key={tipo} style={{ marginBottom: 12 }}>
          <div className="secao-label">{lbl}</div>
          <div className="filtros">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} className={"filtro" + (stadios[tipo] === n ? " filtro--ativo" : "")} style={stadios[tipo] === n ? { background: accent } : undefined} onClick={() => set(tipo, n)}>
                {tipo === "T" ? "G" : tipo === "PF" || tipo === "PM" ? "P" : "M"}{n}
              </button>
            ))}
          </div>
        </div>
      ))}

      {resultado && pi && (
        <div className="cartao" style={{ padding: 0, overflow: "hidden", border: `1.5px solid ${pi.bd}`, background: pi.bg, marginTop: 8 }}>
          <div style={{ padding: "14px 16px", borderBottom: `1px solid ${pi.bd}` }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: pi.cor }}><Ico name="dot" c={pi.cor} s={9} style={{ marginRight: 5 }} />{pi.label}</div>
            <div style={{ fontFamily: "var(--fonte-display)", fontSize: 19, color: pi.cor, marginTop: 2 }}>{resultado.titulo}</div>
            <div style={{ fontSize: 12.5, color: "var(--suave)", marginTop: 2 }}>{resultado.sub}</div>
          </div>
          <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
            {resultado.interpretacao?.length > 0 && (
              <div>
                <div className="tn-h">Interpretação</div>
                {resultado.interpretacao.map((t, i) => <div key={i} style={{ fontSize: 12.5, color: "var(--texto)", lineHeight: 1.55, marginBottom: 4, paddingLeft: 10, borderLeft: `2px solid ${pi.bd}` }}>{t}</div>)}
              </div>
            )}
            {resultado.conduta?.length > 0 && (
              <div>
                <div className="tn-h">Conduta esperada (para estudo)</div>
                {resultado.conduta.map((t, i) => <div key={i} style={{ fontSize: 12.5, color: "var(--texto)", lineHeight: 1.55, marginBottom: 4, display: "flex", gap: 6 }}><span style={{ color: pi.cor }}>→</span>{t}</div>)}
              </div>
            )}
            {resultado.exames?.length > 0 && (
              <div>
                <div className="tn-h">Que exames se considerariam</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {resultado.exames.map((e, i) => <span key={i} style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 5, background: "var(--superficie-2)", border: "1px solid var(--borda)" }}>{e}</span>)}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {!resultado && <div style={{ textAlign: "center", color: "var(--tenue)", padding: 20, fontSize: 13 }}>Indica a idade e seleciona os estádios.</div>}
    </div>
  );
}
