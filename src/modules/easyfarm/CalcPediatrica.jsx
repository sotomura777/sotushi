import { useState } from "react";
import { tabelaPediatrica } from "./logica";

// Calculadora pediátrica (aritmética simples: volume = peso × dose/concentração).
// Recria o "renderPedTable" do original com estado React. Parâmetros vêm do JSON.
export default function CalcPediatrica({ pedCalc }) {
  const [conc, setConc] = useState(pedCalc.concentracoes[0].val);
  const [dose, setDose] = useState(pedCalc.doses[0].val);

  const { formula, contexto, linhas } = tabelaPediatrica(pedCalc, conc, dose);

  return (
    <div className="easyf-pedcalc">
      <div className="ped-toggle-group">
        <div className="ped-toggle-label">Concentração da suspensão</div>
        <div className="ped-toggles">
          {pedCalc.concentracoes.map((c) => (
            <button key={c.val} className={"ped-toggle" + (c.val === conc ? " active" : "")} onClick={() => setConc(c.val)}>
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="ped-toggle-group">
        <div className="ped-toggle-label">Dose</div>
        <div className="ped-toggles">
          {pedCalc.doses.map((d) => (
            <button key={d.val} className={"ped-toggle" + (d.val === dose ? " active" : "")} onClick={() => setDose(d.val)}>
              {d.label}
            </button>
          ))}
        </div>
      </div>

      <div className="formula-badge">{formula}</div>

      <div className="alert alert-info">
        <span className="alert-icon">i</span>
        <div>{contexto}</div>
      </div>

      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr><th>Peso</th><th>Dose</th><th>Volume</th><th>Frequência</th><th>Máx. diário ({pedCalc.maxDiaMgKg} mg/kg)</th></tr>
          </thead>
          <tbody>
            {linhas.map((l) => (
              <tr key={l.peso}>
                <td><b>{l.peso} kg</b></td>
                <td>{l.dose}</td>
                <td>{l.volume}</td>
                <td>{l.freq}</td>
                <td>{l.maximo}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
