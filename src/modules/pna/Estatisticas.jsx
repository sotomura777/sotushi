import { useEffect, useState } from "react";
import { Ico } from "@/components/icones";
import { obterRespostas, limparDados } from "./db";
import { gerarDadosExemplo } from "./logica-seed";
import {
  filtrarPorJanela, resumoComDelta, streak, evolucaoTemporal, heatmap,
  acertoPorGuideline,
} from "./logica-estatisticas";
import { mudancaResposta, tempoVsAcerto, fadiga, performancePorHora, detectarPadroes } from "./logica-comportamento";
import { melhorPosicao } from "./logica-posicao";
import { classeTaxa, ABREV_TIPO as ABREV } from "./ui";
import { exportarRespostas } from "./exportar";

const JANELAS = [{ v: 7, t: "7 dias" }, { v: 30, t: "30 dias" }, { v: 90, t: "90 dias" }, { v: "tudo", t: "Tudo" }];

const pct = (x) => (x == null ? "—" : Math.round(x * 100) + "%");
const delta = (v, suf = "", inverter = false) => {
  if (v == null || v === 0) return <p className="pna-metrica-delta pna-delta-neutro">{v === 0 ? "sem variação" : "—"}</p>;
  const bom = inverter ? v < 0 : v > 0;
  return <p className={"pna-metrica-delta " + (bom ? "pna-delta-pos" : "pna-delta-neg")}>{v > 0 ? "+" : ""}{v}{suf}</p>;
};

// ── mini gráfico de barras (tempo×acerto, fadiga, hora) ──────────────────────
function Barras({ dados, alturaMax = 90 }) {
  return (
    <div className="pna-barras" style={{ height: alturaMax + 22 }}>
      {dados.map((d) => (
        <div key={d.label} className="pna-barras-col">
          <span className="pna-barras-val">{d.taxa == null ? "" : Math.round(d.taxa * 100)}</span>
          <div className={"pna-barras-bar " + classeTaxa(d.taxa)} style={{ height: (d.taxa || 0) * alturaMax }} />
          <span className="pna-barras-lbl">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function Estatisticas({ taxonomia, historico, onVoltar }) {
  const [todas, setTodas] = useState(null);
  const [janela, setJanela] = useState(30);
  const [aGerar, setAGerar] = useState(false);

  const carregar = () => obterRespostas().then(setTodas);
  useEffect(() => { carregar(); }, []);

  if (todas === null) return <div className="pna-vazio-mini">A carregar…</div>;

  const respostas = filtrarPorJanela(todas, janela);
  const r = resumoComDelta(todas, janela);
  const stk = streak(todas);
  const evo = evolucaoTemporal(respostas, janela);
  const hm = heatmap(respostas, taxonomia.especialidades, taxonomia.tipos_raciocinio);
  const mud = mudancaResposta(respostas);
  const tva = tempoVsAcerto(respostas);
  const fad = fadiga(respostas);
  const horas = performancePorHora(respostas);
  const normas = acertoPorGuideline(respostas);
  const padroes = detectarPadroes(respostas);
  const pos = melhorPosicao(r.taxa, historico);

  const gerar = async () => { setAGerar(true); await gerarDadosExemplo(); await carregar(); setAGerar(false); };
  const limpar = async () => {
    if (!window.confirm("Apagar todos os dados de treino deste dispositivo?")) return;
    await limparDados(); await carregar();
  };

  // ── estado totalmente vazio ────────────────────────────────────────────────
  if (todas.length === 0) {
    return (
      <>
        <div className="pna-treino-topo"><button className="pna-link" onClick={onVoltar}>← Voltar</button></div>
        <div className="cartao pna-cta">
          <div className="pna-cta-icone"><Ico name="chart" s={26} /></div>
          <p className="pna-cta-titulo">Ainda sem dados</p>
          <p className="pna-cta-texto">Responde a perguntas no Treino para veres as tuas estatísticas — ou gera dados de exemplo para experimentar o ecrã.</p>
          <button className="pna-btn" onClick={gerar} disabled={aGerar}>{aGerar ? "A gerar…" : "Gerar dados de exemplo"}</button>
        </div>
      </>
    );
  }

  // geometria do gráfico de evolução
  const W = 600, H = 170, padL = 34, padB = 26, padT = 12;
  const n = evo.length;
  const x = (i) => padL + (n <= 1 ? 0 : (i / (n - 1)) * (W - padL - 8));
  const y = (t) => padT + (1 - t) * (H - padT - padB);
  const maxVol = Math.max(1, ...evo.map((d) => d.volume));
  const pontos = evo.map((d, i) => ({ i, d })).filter((p) => p.d.taxa != null);
  const linha = pontos.map((p, k) => `${k === 0 ? "M" : "L"} ${x(p.i).toFixed(1)} ${y(p.d.taxa).toFixed(1)}`).join(" ");

  return (
    <>
      <div className="pna-treino-topo">
        <button className="pna-link" onClick={onVoltar}>← Voltar</button>
        <button className="pna-link" onClick={() => exportarRespostas(respostas)} disabled={!respostas.length}>Exportar CSV ↓</button>
      </div>

      {/* filtro temporal */}
      <div className="pna-chips">
        {JANELAS.map((j) => (
          <button key={j.v} className={"pna-chip" + (janela === j.v ? " ativo" : "")} onClick={() => setJanela(j.v)}>{j.t}</button>
        ))}
      </div>

      {/* métricas */}
      <div className="pna-metricas">
        <div className="pna-metrica">
          <p className="pna-metrica-label">Perguntas</p>
          <p className="pna-metrica-valor">{r.total}</p>
          {delta(r.dTotal)}
        </div>
        <div className="pna-metrica pna-metrica--destaque">
          <p className="pna-metrica-label">Acerto</p>
          <p className="pna-metrica-valor">{pct(r.taxa)}</p>
          {delta(r.dTaxa, " pp")}
        </div>
        <div className="pna-metrica">
          <p className="pna-metrica-label">Tempo médio</p>
          <p className="pna-metrica-valor">{r.tempoMedioS}<span className="u">s</span></p>
          {delta(r.dTempo, "s", true)}
        </div>
        <div className="pna-metrica">
          <p className="pna-metrica-label">Streak</p>
          <p className="pna-metrica-valor">{stk.atual}<span className="u"> d</span></p>
          <p className="pna-metrica-delta pna-delta-neutro">recorde: {stk.recorde}</p>
        </div>
      </div>

      {/* posição vs PNAs oficiais */}
      <p className="secao-label">Posição vs. PNAs oficiais</p>
      <div className="cartao" style={{ padding: 16, marginBottom: 18 }}>
        {pos ? (
          <>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
              <span className="pna-pos-grande">~{pos.lugar?.toLocaleString("pt-PT")}</span>
              <span className="pna-area-sub">de {pos.candidatos?.toLocaleString("pt-PT")} candidatos · PNA {pos.ano}</span>
            </div>
            <p className="pna-area-sub">Percentil {Math.round(pos.percentil * 100)} face a esse ano oficial.</p>
          </>
        ) : (
          <p className="pna-explicacao-texto">
            Para estimar o teu lugar, adiciona os dados oficiais da ACSS em
            <b> conteudo/pna/historico-oficial.json</b>. Até lá, não há comparação — e
            <b> nunca</b> comparamos com outros utilizadores da app.
          </p>
        )}
      </div>

      {/* evolução temporal */}
      <p className="secao-label">Evolução ({janela === "tudo" ? "tudo" : janela + " dias"})</p>
      <div className="cartao" style={{ padding: 14, marginBottom: 18 }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }} role="img" aria-label="Evolução da taxa de acerto e volume diário">
          {[0.9, 0.7, 0.5].map((t) => (
            <g key={t}>
              <line x1={padL} y1={y(t)} x2={W - 8} y2={y(t)} stroke="var(--borda-2)" strokeWidth="0.5" strokeDasharray="2,3" />
              <text x={padL - 4} y={y(t) + 3} textAnchor="end" fontSize="9" fill="var(--tenue)">{Math.round(t * 100)}%</text>
            </g>
          ))}
          {evo.map((d, i) => d.volume > 0 && (
            <rect key={i} x={x(i) - 4} y={y(0) - (d.volume / maxVol) * 34} width="8" height={(d.volume / maxVol) * 34}
              fill="var(--pna-h3)" opacity="0.6" rx="1" />
          ))}
          {linha && <path d={linha} fill="none" stroke="var(--acento)" strokeWidth="1.9" />}
          {pontos.map((p) => <circle key={p.i} cx={x(p.i)} cy={y(p.d.taxa)} r="2" fill="var(--acento)" />)}
        </svg>
      </div>

      {/* heatmap área × tipo */}
      <p className="secao-label">Mapa de desempenho · área × tipo de raciocínio</p>
      <div className="cartao pna-heat" style={{ overflowX: "auto" }}>
        {hm.areas.length === 0 ? (
          <p className="pna-explicacao-texto">Sem dados neste período.</p>
        ) : (
          <div className="pna-heat-grade" style={{ gridTemplateColumns: `82px repeat(${hm.tipos.length}, 1fr) 34px` }}>
            <div />
            {hm.tipos.map((t) => <div key={t} className="pna-heat-cab">{ABREV[t] || t}</div>)}
            <div className="pna-heat-cab" style={{ textAlign: "right" }}>%</div>
            {hm.areas.map((a) => (
              <PartialRow key={a.nome} a={a} />
            ))}
          </div>
        )}
        <div className="pna-heat-legenda">
          <span><i className="hc1" />≥85%</span><span><i className="hc2" />70–84%</span>
          <span><i className="hc3" />55–69%</span><span><i className="hc4" />40–54%</span><span><i className="hc5" />&lt;40%</span>
        </div>
      </div>

      {/* análise comportamental */}
      <div className="pna-sec-cab">
        <p className="secao-label">Análise comportamental</p>
        <span className="pna-tag-dif">o teu diferencial</span>
      </div>

      <div className="cartao" style={{ padding: 14, marginBottom: 12 }}>
        <p className="pna-dif-titulo">Mudança de resposta</p>
        <p className="pna-area-sub" style={{ marginBottom: 12 }}>Quantas vezes mudas a resposta inicial — e com que resultado.</p>
        {mud.mudou === 0 ? (
          <p className="pna-explicacao-texto">Sem mudanças de resposta registadas neste período.</p>
        ) : (
          <>
            <div className="pna-barra-emp">
              {mud.certoErrado > 0 && <span className="hc5" style={{ width: pct(mud.pctCertoErrado) }}>{Math.round(mud.pctCertoErrado * 100)}% certo→errado</span>}
              {mud.erradoCerto > 0 && <span className="hc2" style={{ width: pct(mud.pctErradoCerto) }}>{Math.round(mud.pctErradoCerto * 100)}% errado→certo</span>}
              {mud.igual > 0 && <span className="hc0" style={{ width: pct(mud.igual / mud.mudou) }}>=</span>}
            </div>
            <p className="pna-area-sub" style={{ marginTop: 8 }}>{mud.mudou} mudanças · {Math.round(mud.pctMudou * 100)}% das perguntas.</p>
          </>
        )}
      </div>

      <div className="cartao" style={{ padding: 14, marginBottom: 12 }}>
        <p className="pna-dif-titulo">Tempo vs. acerto</p>
        <p className="pna-area-sub" style={{ marginBottom: 10 }}>Probabilidade de acertares por tempo gasto.</p>
        <Barras dados={tva} />
      </div>

      <div className="pna-dois">
        <div className="cartao" style={{ padding: 14 }}>
          <p className="pna-dif-titulo">Fadiga na sessão</p>
          <p className="pna-area-sub" style={{ marginBottom: 10 }}>Acerto por posição.</p>
          {fad.length ? <Barras dados={fad} alturaMax={70} /> : <p className="pna-explicacao-texto">Sem dados.</p>}
        </div>
        <div className="cartao" style={{ padding: 14 }}>
          <p className="pna-dif-titulo">Hora do dia</p>
          <p className="pna-area-sub" style={{ marginBottom: 10 }}>Quando rendes melhor.</p>
          <Barras dados={horas} alturaMax={70} />
        </div>
      </div>

      {/* insights */}
      {padroes.map((p, i) => (
        <div key={i} className={"pna-insight pna-insight--" + p.tipo} style={{ marginTop: 12 }}>
          <span className="i"><Ico name={p.tipo === "bom" ? "bulb" : "alertCircle"} s={16} /></span>
          <div><b>{p.titulo}</b> {p.texto}</div>
        </div>
      ))}

      {/* por norma DGS */}
      {normas.length > 0 && (
        <>
          <p className="secao-label" style={{ marginTop: 6 }}>Por norma DGS</p>
          <div className="cartao pna-areas">
            {normas.map((g) => (
              <div key={g.nome} className="pna-area">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p className="pna-area-nome" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{g.nome}</p>
                  <div className="pna-barra" style={{ marginTop: 6 }}><i className={classeTaxa(g.taxa)} style={{ width: pct(g.taxa) }} /></div>
                </div>
                <span className="pna-area-sub" style={{ minWidth: 64, textAlign: "right" }}>{pct(g.taxa)} · {g.acertos}/{g.total}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ações de dados */}
      <div className="pna-rodape" style={{ marginTop: 18 }}>
        <button className="pna-link" onClick={gerar} disabled={aGerar}>{aGerar ? "A gerar…" : "+ Gerar dados de exemplo"}</button>
        <button className="pna-link" onClick={limpar}>Limpar dados de treino</button>
      </div>
    </>
  );
}

// linha do heatmap (área + células + %)
function PartialRow({ a }) {
  return (
    <>
      <div className="pna-heat-area">{a.nome}</div>
      {a.celulas.map((c) => (
        <div key={c.tipo} className={"pna-heat-cell " + classeTaxa(c.taxa)} title={`${a.nome} · ${c.tipo}: ${pct(c.taxa)} (${c.total})`}>
          {c.taxa != null && <span>{Math.round(c.taxa * 100)}</span>}
        </div>
      ))}
      <div className="pna-heat-pct">{pct(a.taxa)}</div>
    </>
  );
}
