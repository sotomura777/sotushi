import { useEffect, useState, useMemo } from "react";
import { Ico } from "@/components/icones";
import { listarSessoes, obterRespostas } from "./db";
import { melhorPosicao, lugarNoAno, percentilNoAno } from "./logica-posicao";
import { exportarSessoes } from "./exportar";

// ============================================================================
// Historico — lista das simulações (sessões de exame) guardadas no IndexedDB.
// 4 métricas-resumo, gráfico de evolução do score e lista clicável; cada linha
// reabre os Resultados dessa sessão. Sem comparação entre utilizadores.
// ============================================================================
const fmtData = (ms) => new Date(ms).toLocaleDateString("pt-PT", { day: "numeric", month: "short" });
const fmtH = (ms) => { const h = ms / 3600000; return h >= 1 ? `${Math.round(h)}h` : `${Math.round(ms / 60000)}min`; };

export default function Historico({ perguntas, historico, onAbrir, onVoltar }) {
  const [sessoes, setSessoes] = useState(null);
  const [respostas, setRespostas] = useState([]);
  const [filtro, setFiltro] = useState("todas");

  useEffect(() => { listarSessoes().then(setSessoes); obterRespostas().then(setRespostas); }, []);
  const byId = useMemo(() => { const m = {}; perguntas.forEach((p) => (m[p.id] = p)); return m; }, [perguntas]);

  if (sessoes === null) return <div className="pna-vazio-mini">A carregar…</div>;

  const concluidas = sessoes.filter((s) => s.estado === "concluida").sort((a, b) => b.data_inicio - a.data_inicio);
  const agora = Date.now();
  const lista = filtro === "7d" ? concluidas.filter((s) => agora - s.data_inicio < 7 * 86400000) : concluidas;

  if (concluidas.length === 0) {
    return (
      <>
        <div className="pna-treino-topo"><button className="pna-link" onClick={onVoltar}>← Voltar</button></div>
        <div className="cartao pna-cta">
          <div className="pna-cta-icone"><Ico name="clock" s={26} /></div>
          <p className="pna-cta-titulo">Sem simulações ainda</p>
          <p className="pna-cta-texto">Faz um exame cronometrado para começar a construir o teu histórico.</p>
        </div>
      </>
    );
  }

  const taxa = (s) => (s.n_perguntas ? s.n_acertos / s.n_perguntas : 0);
  const melhorScore = Math.max(...concluidas.map(taxa));
  const tempoTotal = concluidas.reduce((a, s) => a + (s.duracao_ms || 0), 0);
  const posBest = melhorPosicao(melhorScore, historico);

  // evolução: por ordem cronológica
  const cron = [...concluidas].sort((a, b) => a.data_inicio - b.data_inicio);
  const W = 600, H = 110, x = (i) => 40 + (cron.length <= 1 ? 0 : (i / (cron.length - 1)) * (W - 50)), y = (t) => 95 - t * 70;
  const linha = cron.map((s, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(taxa(s)).toFixed(1)}`).join(" ");
  const dPP = cron.length >= 2 ? Math.round((taxa(cron[cron.length - 1]) - taxa(cron[0])) * 100) : null;

  const reconstruir = (s) => {
    const resp = respostas.filter((r) => r.sessao_id === s.id);
    return {
      respostas: resp,
      perguntas: resp.map((r) => byId[r.pergunta_id]).filter(Boolean),
      nTotal: s.n_perguntas, nAcertos: s.n_acertos, scoreTaxa: taxa(s),
      tempoTotalMs: s.duracao_ms, duracaoS: 0, marcadas: resp.filter((r) => r.marcou_revisao).map((r) => r.pergunta_id),
      anoSimulado: s.ano_simulado,
    };
  };

  return (
    <>
      <div className="pna-treino-topo">
        <button className="pna-link" onClick={onVoltar}>← Voltar</button>
        <button className="pna-link" onClick={() => exportarSessoes(concluidas)}>Exportar CSV ↓</button>
      </div>

      {/* métricas */}
      <div className="pna-metricas">
        <div className="pna-metrica pna-metrica--destaque">
          <p className="pna-metrica-label">Simulações</p>
          <p className="pna-metrica-valor">{concluidas.length}</p>
        </div>
        <div className="pna-metrica">
          <p className="pna-metrica-label">Melhor score</p>
          <p className="pna-metrica-valor">{Math.round(melhorScore * 100)}<span className="u">%</span></p>
        </div>
        <div className="pna-metrica">
          <p className="pna-metrica-label">Melhor posição</p>
          <p className="pna-metrica-valor">{posBest ? "~" + posBest.lugar?.toLocaleString("pt-PT") : "—"}</p>
        </div>
        <div className="pna-metrica">
          <p className="pna-metrica-label">Tempo total</p>
          <p className="pna-metrica-valor">{fmtH(tempoTotal)}</p>
        </div>
      </div>

      {/* evolução */}
      {cron.length >= 2 && (
        <>
          <p className="secao-label">Evolução · {cron.length} simulações</p>
          <div className="cartao" style={{ padding: 14, marginBottom: 14 }}>
            <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }} role="img" aria-label="Evolução do score">
              {[0.8, 0.6, 0.4].map((t) => (
                <g key={t}><line x1="40" y1={y(t)} x2={W - 10} y2={y(t)} stroke="var(--borda-2)" strokeWidth="0.5" strokeDasharray="2,3" />
                  <text x="36" y={y(t) + 3} textAnchor="end" fontSize="9" fill="var(--tenue)">{Math.round(t * 100)}%</text></g>
              ))}
              <path d={linha} fill="none" stroke="var(--acento)" strokeWidth="2" />
              {cron.map((s, i) => <circle key={s.id} cx={x(i)} cy={y(taxa(s))} r={i === cron.length - 1 ? 4 : 2.5} fill="var(--acento)" />)}
            </svg>
            {dPP != null && (
              <p className="pna-area-sub" style={{ marginTop: 8 }}>
                <b style={{ color: dPP >= 0 ? "var(--pna-h1)" : "var(--pna-h5)" }}>{dPP >= 0 ? "+" : ""}{dPP} pp</b> entre a primeira e a última simulação.
              </p>
            )}
          </div>
        </>
      )}

      {/* filtros */}
      <div className="pna-chips">
        <button className={"pna-chip" + (filtro === "todas" ? " ativo" : "")} onClick={() => setFiltro("todas")}>Todas ({concluidas.length})</button>
        <button className={"pna-chip" + (filtro === "7d" ? " ativo" : "")} onClick={() => setFiltro("7d")}>Últimos 7 dias</button>
      </div>

      {/* lista */}
      <div className="cartao" style={{ overflow: "hidden" }}>
        {lista.map((s, i) => {
          const t = taxa(s);
          const lugar = s.ano_simulado && historico?.anos?.[s.ano_simulado] ? lugarNoAno(t, historico.anos[s.ano_simulado]) : null;
          const perc = s.ano_simulado && historico?.anos?.[s.ano_simulado] ? percentilNoAno(t, historico.anos[s.ano_simulado]) : null;
          return (
            <button key={s.id} className="pna-hist-linha" onClick={() => onAbrir(reconstruir(s))} style={{ borderTop: i ? "0.5px solid var(--borda-2)" : "none" }}>
              <div className="pna-hist-data">
                <p className="pna-hist-d1">{fmtData(s.data_inicio)}</p>
                <p className="pna-area-sub">{new Date(s.data_inicio).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}</p>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p className="pna-area-nome">{s.ano_simulado ? `Simulação PNA ${s.ano_simulado}` : "Simulação"}</p>
                <p className="pna-area-sub">{s.n_perguntas} perguntas · {fmtH(s.duracao_ms || 0)}</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p className="pna-hist-score" style={{ color: t >= 0.7 ? "var(--pna-h1)" : "var(--texto)" }}>{Math.round(t * 100)}%</p>
                <p className="pna-area-sub">{s.n_acertos}/{s.n_perguntas}{lugar ? ` · ~${lugar}` : ""}{perc != null ? ` · P${Math.round(perc * 100)}` : ""}</p>
              </div>
              <Ico name="alvo" s={14} />
            </button>
          );
        })}
      </div>
    </>
  );
}
