import { useState } from "react";
import cres from "@conteudo/saude-infantil/crescimento.json";
import { getLMS2, valToZ, zToP2, interpPercText, construirGraficoSVG } from "./crescimento";
import { I, Ico } from "@/components/icones";
import { useEstadoLocal } from "@/lib/persistencia";

const { LMS_W, LMS_H, LMS_HC } = cres;

export default function Crescimento({ accent }) {
  const [sexo, setSexo] = useState("M");
  const [idade, setIdade] = useState("");
  const [peso, setPeso] = useState("");
  const [alt, setAlt] = useState("");
  const [pc, setPc] = useState("");
  const [msg, setMsg] = useState("");
  const [entradas, setEntradas] = useEstadoLocal("medguia:crescimento:entradas", []);

  function adicionar() {
    const a = parseFloat(idade), p = parseFloat(peso), al = parseFloat(alt), c = parseFloat(pc);
    if (Number.isNaN(a) || a < 0 || a > 228) { setMsg("Idade inválida (0–228 meses)."); return; }
    if (Number.isNaN(p) && Number.isNaN(al) && Number.isNaN(c)) { setMsg("Preenche pelo menos um valor."); return; }
    setMsg("");
    setEntradas((prev) => {
      const filtrado = prev.filter((e) => Math.abs(e.age - a) > 0.5 || e.sexo !== sexo);
      const nova = { age: a, sexo, peso: Number.isNaN(p) ? 0 : p, alt: Number.isNaN(al) ? 0 : al, pc: Number.isNaN(c) ? 0 : c, label: a < 24 ? a + "M" : (a / 12).toFixed(1) + "A" };
      return [...filtrado, nova].sort((x, y) => x.age - y.age);
    });
    setIdade(""); setPeso(""); setAlt(""); setPc("");
  }
  const remover = (i) => setEntradas((prev) => prev.filter((_, idx) => idx !== i));

  const same = entradas.filter((e) => e.sexo === sexo);
  const maxAge = same.length ? Math.max(...same.map((e) => e.age)) : 24;
  const ageEnd = Math.min(228, Math.max(24, maxAge + 6));
  const wPts = same.filter((e) => e.peso > 0).map((e) => ({ x: e.age, y: e.peso }));
  const hPts = same.filter((e) => e.alt > 0).map((e) => ({ x: e.age, y: e.alt }));
  const hcPts = same.filter((e) => e.pc > 0 && e.age <= 60).map((e) => ({ x: e.age, y: e.pc }));
  const mostraPC = ageEnd <= 60 || hcPts.length > 0;

  return (
    <div>
      <div className="an-sexo" style={{ marginBottom: 10 }}>
        <button className={sexo === "M" ? "on" : ""} onClick={() => setSexo("M")}><Ico name="male" s={14} style={{ marginRight: 5 }} />Masculino</button>
        <button className={sexo === "F" ? "on" : ""} onClick={() => setSexo("F")}><Ico name="female" s={14} style={{ marginRight: 5 }} />Feminino</button>
      </div>

      <div className="cartao" style={{ padding: 14 }}>
        <div className="cr-inputs">
          <label>Idade (meses)<input type="number" className="campo" value={idade} onChange={(e) => setIdade(e.target.value)} placeholder="ex: 12" /></label>
          <label>Peso (kg)<input type="number" className="campo" value={peso} onChange={(e) => setPeso(e.target.value)} placeholder="—" /></label>
          <label>Comp./Altura (cm)<input type="number" className="campo" value={alt} onChange={(e) => setAlt(e.target.value)} placeholder="—" /></label>
          <label>Per. cefálico (cm)<input type="number" className="campo" value={pc} onChange={(e) => setPc(e.target.value)} placeholder="—" /></label>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 10 }}>
          <button className="filtro filtro--ativo" style={{ background: accent, padding: "9px 18px" }} onClick={adicionar}>Adicionar registo</button>
          {msg && <span style={{ fontSize: 12, color: "#dc2626" }}>{msg}</span>}
        </div>
      </div>

      {same.length > 0 && (
        <>
          <div className="cr-chart" dangerouslySetInnerHTML={{ __html: construirGraficoSVG(LMS_W, sexo, wPts, "Peso (kg)", 0, ageEnd, 340) }} />
          <div className="cr-chart" dangerouslySetInnerHTML={{ __html: construirGraficoSVG(LMS_H, sexo, hPts, "Comprimento / Altura (cm)", 0, ageEnd, 340) }} />
          {mostraPC && <div className="cr-chart" dangerouslySetInnerHTML={{ __html: construirGraficoSVG(LMS_HC, sexo, hcPts, "Perímetro cefálico (cm)", 0, Math.min(60, ageEnd), 340) }} />}

          <table className="cr-table">
            <thead><tr><th>Idade</th><th>Peso</th><th>Altura</th><th>PC</th><th></th></tr></thead>
            <tbody>
              {same.map((e, i) => {
                const cel = (val, table) => {
                  if (!val || val <= 0) return <td className="cr-td" style={{ color: "var(--tenue)" }}>—</td>;
                  const lms = getLMS2(table, e.sexo, e.age);
                  const p = zToP2(valToZ(lms.L, lms.M, lms.S, val));
                  const it = interpPercText("peso", p);
                  return <td className="cr-td">{val} <strong style={{ color: it.c }}>P{p}</strong><br /><span style={{ fontSize: 10, color: it.c }}>{it.t}</span></td>;
                };
                return (
                  <tr key={i}>
                    <td className="cr-td" style={{ fontWeight: 600 }}>{e.label}</td>
                    {cel(e.peso, LMS_W)}
                    {cel(e.alt, LMS_H)}
                    {e.pc > 0 && e.age <= 60 ? cel(e.pc, LMS_HC) : <td className="cr-td" style={{ color: "var(--tenue)" }}>—</td>}
                    <td className="cr-td"><button onClick={() => remover(i)} style={{ background: "none", border: "none", color: "var(--tenue)", cursor: "pointer", display: "inline-flex" }}>{I.close("currentColor", 14)}</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </>
      )}
      {same.length === 0 && <div style={{ textAlign: "center", color: "var(--tenue)", padding: 24, fontSize: 13 }}>Adiciona um registo para ver os percentis e as curvas.</div>}
    </div>
  );
}
