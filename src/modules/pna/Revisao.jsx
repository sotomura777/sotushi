import { useEffect, useState, useMemo } from "react";
import { Ico } from "@/components/icones";
import { obterFsrs, obterRespostas } from "./db";
import { gerarFeed, curvaRetencao, prever7Dias } from "./logica-fsrs";

// ============================================================================
// Revisao — feed inteligente (FSRS) + caderno de erros. Mostra quantas e porquê
// estão escolhidas para hoje, a curva de retenção (com vs. sem rever), a
// previsão de carga dos próximos 7 dias e a lista de erros.
// ============================================================================
const DIAS_SEM = ["hoje", "+1", "+2", "+3", "+4", "+5", "+6"];

export default function Revisao({ perguntas, onComecar, onVoltar }) {
  const [cards, setCards] = useState(null);
  const [respostas, setRespostas] = useState([]);
  useEffect(() => { obterFsrs().then(setCards); obterRespostas().then(setRespostas); }, []);

  const byId = useMemo(() => { const m = {}; perguntas.forEach((p) => (m[p.id] = p)); return m; }, [perguntas]);

  if (cards === null) return <div className="pna-vazio-mini">A carregar…</div>;

  const feed = gerarFeed(cards, perguntas);
  const ordemFeed = [...feed.criticas, ...feed.manutencao, ...feed.novas];
  const feedPerguntas = ordemFeed.map((id) => byId[id]).filter(Boolean);
  const total = ordemFeed.length;
  const curva = curvaRetencao(cards);
  const prev7 = prever7Dias(cards);

  // caderno de erros: agrupa respostas erradas por pergunta
  const errMap = {};
  for (const r of respostas) {
    if (r.correta) continue;
    const e = (errMap[r.pergunta_id] ||= { id: r.pergunta_id, n: 0, ultimo: 0, opcao: r.opcao_final, correta: r.correta_letra, area: r.especialidade });
    e.n += 1;
    if ((r.data || 0) > e.ultimo) { e.ultimo = r.data || 0; e.opcao = r.opcao_final; }
  }
  const caderno = Object.values(errMap).sort((a, b) => b.n - a.n || b.ultimo - a.ultimo);

  const reverFeed = () => { if (feedPerguntas.length) onComecar(feedPerguntas); };

  // geometria da curva
  const W = 600, H = 110, x = (d) => 40 + (d / 14) * (W - 50), y = (v) => 95 - v * 70;
  const linha = (key) => curva.map((p, i) => `${i === 0 ? "M" : "L"} ${x(p.d).toFixed(1)} ${y(p[key]).toFixed(1)}`).join(" ");
  const maxCarga = Math.max(1, ...prev7);

  return (
    <>
      <div className="pna-treino-topo">
        <button className="pna-link" onClick={onVoltar}>← Voltar</button>
        <span className="pna-treino-prog">Revisão · FSRS</span>
      </div>

      {/* hero do feed */}
      <div className="cartao" style={{ padding: 16, marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 8 }}>
          <span className="pna-pos-grande">{total}</span>
          <span className="pna-area-sub">perguntas escolhidas para ti agora</span>
        </div>
        {total > 0 && (
          <div className="pna-barra-emp" style={{ height: 8, marginBottom: 10 }}>
            {feed.criticas.length > 0 && <span className="hc5" style={{ width: feed.criticas.length / total * 100 + "%" }} />}
            {feed.manutencao.length > 0 && <span className="hc4" style={{ width: feed.manutencao.length / total * 100 + "%" }} />}
            {feed.novas.length > 0 && <span className="hc2" style={{ width: feed.novas.length / total * 100 + "%" }} />}
          </div>
        )}
        <div className="pna-rev-leg">
          <span><i className="hc5" /> {feed.criticas.length} críticas</span>
          <span><i className="hc4" /> {feed.manutencao.length} manutenção</span>
          <span><i className="hc2" /> {feed.novas.length} novas</span>
        </div>
        <button className="pna-btn" style={{ width: "100%", marginTop: 14 }} onClick={reverFeed} disabled={!total}>
          <Ico name="refresh" s={15} /> Começar revisão
        </button>
      </div>

      {/* curva de retenção */}
      {curva.length > 0 && (
        <>
          <p className="secao-label">Curva de retenção · 14 dias</p>
          <div className="cartao" style={{ padding: 14, marginBottom: 14 }}>
            <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }} role="img" aria-label="Retenção com e sem revisão">
              <line x1="40" y1={y(0.85)} x2={W - 10} y2={y(0.85)} stroke="var(--borda-2)" strokeWidth="0.5" strokeDasharray="2,3" />
              <text x="36" y={y(0.85) + 3} textAnchor="end" fontSize="9" fill="var(--tenue)">85%</text>
              <text x="36" y={y(0) + 3} textAnchor="end" fontSize="9" fill="var(--tenue)">0</text>
              <path d={linha("sem")} fill="none" stroke="var(--pna-h5)" strokeWidth="1.6" />
              <path d={linha("com")} fill="none" stroke="var(--acento)" strokeWidth="1.8" />
            </svg>
            <div className="pna-rev-leg" style={{ marginTop: 6 }}>
              <span><i className="hc1" /> com revisão de hoje</span>
              <span><i className="hc5" /> sem rever</span>
            </div>
          </div>
        </>
      )}

      {/* próximas do feed */}
      {feedPerguntas.length > 0 && (
        <>
          <p className="secao-label">Próximas · pré-visualização</p>
          <div className="cartao" style={{ overflow: "hidden", marginBottom: 14 }}>
            {feedPerguntas.slice(0, 4).map((p, i) => {
              const crit = feed.criticas.includes(p.id) ? "hc5" : feed.manutencao.includes(p.id) ? "hc4" : "hc2";
              const motivo = feed.criticas.includes(p.id) ? "Crítica" : feed.manutencao.includes(p.id) ? "Manutenção" : "Nova";
              return (
                <div key={p.id} className="pna-rev-item" style={{ borderTop: i ? "0.5px solid var(--borda-2)" : "none" }}>
                  <span className={"pna-rev-bar " + crit} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p className="pna-area-nome" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.taxonomia?.patologia || p.lead_in}</p>
                    <p className="pna-area-sub">{motivo} · {p.taxonomia?.especialidade}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* previsão 7 dias */}
      <p className="secao-label">Próximos 7 dias · carga</p>
      <div className="cartao" style={{ padding: 14, marginBottom: 14 }}>
        <div className="pna-barras" style={{ height: 92 }}>
          {prev7.map((n, i) => (
            <div key={i} className="pna-barras-col">
              <span className="pna-barras-val">{n || ""}</span>
              <div className={"pna-barras-bar " + (i === 0 ? "hc1" : "hc3")} style={{ height: (n / maxCarga) * 70 }} />
              <span className="pna-barras-lbl">{DIAS_SEM[i]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* caderno de erros */}
      <p className="secao-label">Caderno de erros</p>
      <div className="cartao pna-areas">
        {caderno.length === 0 ? (
          <p className="pna-explicacao-texto">Ainda sem erros registados. Os erros do treino e do exame aparecem aqui.</p>
        ) : (
          caderno.slice(0, 8).map((e) => (
            <div key={e.id} className="pna-area">
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 30 }}>
                <Ico name="xCircle" s={15} />
                <span className="pna-area-sub" style={{ fontSize: 9 }}>×{e.n}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p className="pna-area-nome" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{byId[e.id]?.taxonomia?.patologia || byId[e.id]?.lead_in || e.area || "Pergunta"}</p>
                <p className="pna-area-sub">{e.area || "—"} · respondeste {e.opcao}{e.correta ? ` (correta: ${e.correta})` : ""}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
