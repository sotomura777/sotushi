import { useEffect, useState } from "react";
import { obterRespostas } from "./db";
import { acertoPorArea } from "./logica-estatisticas";
import { classeTaxa } from "./ui";

// ============================================================================
// TreinoAreas — escolher QUALQUER área e treinar só perguntas dela. Lista as
// especialidades com perguntas no banco, com a contagem e a tua taxa de acerto.
// ============================================================================
export default function TreinoAreas({ perguntas, onTreinar, onVoltar }) {
  const [resp, setResp] = useState([]);
  useEffect(() => { obterRespostas().then(setResp); }, []);

  // contagem de perguntas por área no banco
  const cont = {};
  for (const p of perguntas) { const a = p.taxonomia?.especialidade; if (a) cont[a] = (cont[a] || 0) + 1; }
  const acc = Object.fromEntries(acertoPorArea(resp).map((a) => [a.nome, a]));
  const areas = Object.keys(cont).sort((a, b) => a.localeCompare(b, "pt")).map((nome) => ({ nome, n: cont[nome], acc: acc[nome] }));

  return (
    <>
      <div className="pna-treino-topo">
        <button className="pna-link" onClick={onVoltar}>← Voltar</button>
        <span className="pna-treino-prog">Treinar por área</span>
      </div>

      {areas.length === 0 ? (
        <div className="cartao" style={{ padding: 20, textAlign: "center" }}>
          <p className="pna-explicacao-texto">Ainda não há perguntas no banco.</p>
        </div>
      ) : (
        <div className="cartao pna-areas">
          {areas.map((a) => (
            <button key={a.nome} className="pna-area pna-area-btn" onClick={() => onTreinar(a.nome)}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p className="pna-area-nome">{a.nome}</p>
                <p className="pna-area-sub">
                  {a.n} pergunta{a.n === 1 ? "" : "s"}
                  {a.acc ? ` · ${Math.round(a.acc.taxa * 100)}% de acerto` : " · ainda não treinada"}
                </p>
              </div>
              {a.acc && (
                <div className="pna-barra" style={{ width: 64, flexShrink: 0 }}>
                  <i className={classeTaxa(a.acc.taxa)} style={{ width: Math.round(a.acc.taxa * 100) + "%" }} />
                </div>
              )}
              <span className="pna-link" style={{ flexShrink: 0 }}>Treinar →</span>
            </button>
          ))}
        </div>
      )}
    </>
  );
}
