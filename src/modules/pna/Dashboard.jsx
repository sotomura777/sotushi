import { useEffect, useState } from "react";
import { Ico } from "@/components/icones";
import { obterRespostas } from "./db";
import { resumo, resumoComDelta, streak, heatmap, areasAMelhorar } from "./logica-estatisticas";
import { classeTaxa, ABREV_TIPO as ABREV } from "./ui";

// ============================================================================
// Dashboard — menu inicial do PNA quando já há respostas. Fiel ao mockup "menu
// inicial", vestido com o design MedGuia. Lê o estado pessoal do IndexedDB.
// ============================================================================

export default function Dashboard({ taxonomia, nPerguntas, onModo, onEstatisticas, onHistorico, onTreinarArea, onAreas }) {
  const [resp, setResp] = useState(null);
  useEffect(() => { obterRespostas().then(setResp); }, []);
  if (resp === null) return <div className="pna-vazio-mini">A carregar…</div>;

  const r30 = resumoComDelta(resp, 30);
  const total = resumo(resp).total;
  const stk = streak(resp);
  const hm = heatmap(resp, taxonomia.especialidades, taxonomia.tipos_raciocinio);
  const areasHm = hm.areas.slice(0, 5);
  const piores = areasAMelhorar(resp, 1, 3);

  const modos = [
    { id: "exame", icone: "clock", nome: "Exame", desc: "Simulação cronometrada, sem feedback" },
    { id: "treino", icone: "bulb", nome: "Treino", desc: "Feedback imediato e explicação" },
    { id: "revisao", icone: "refresh", nome: "Revisão", desc: "Repetição espaçada (FSRS)" },
    { id: "construtor", icone: "sliders", nome: "Construtor", desc: "Exame à medida com filtros" },
  ];

  return (
    <>
      {/* métricas */}
      <div className="pna-metricas">
        <div className="pna-metrica pna-metrica--destaque">
          <p className="pna-metrica-label">Streak</p>
          <p className="pna-metrica-valor">{stk.atual}<span className="u"> dias</span></p>
        </div>
        <div className="pna-metrica">
          <p className="pna-metrica-label">Acerto 30d</p>
          <p className="pna-metrica-valor">{r30.total ? Math.round(r30.taxa * 100) : "—"}<span className="u">%</span></p>
        </div>
        <div className="pna-metrica">
          <p className="pna-metrica-label">Perguntas</p>
          <p className="pna-metrica-valor">{total}</p>
        </div>
        <div className="pna-metrica">
          <p className="pna-metrica-label">Tempo médio</p>
          <p className="pna-metrica-valor">{r30.tempoMedioS}<span className="u">s</span></p>
        </div>
      </div>

      {/* modos */}
      <p className="secao-label">Modos de estudo</p>
      <div className="pna-modos">
        {modos.map((m) => (
          <button key={m.id} className="pna-modo" onClick={() => onModo?.(m.id)}>
            <div className="pna-modo-cab">
              <span className="ic"><Ico name={m.icone} s={18} /></span>
              <p className="pna-modo-nome">{m.nome}</p>
            </div>
            <p className="pna-modo-desc">{m.desc}</p>
          </button>
        ))}
      </div>

      {/* mini-heatmap */}
      <div className="pna-sec-cab">
        <p className="secao-label">Mapa de desempenho</p>
        <button className="pna-link" onClick={onEstatisticas}>Estatísticas completas →</button>
      </div>
      <div className="cartao pna-heat" style={{ overflowX: "auto" }}>
        {areasHm.length === 0 ? (
          <p className="pna-explicacao-texto">Sem dados suficientes ainda.</p>
        ) : (
          <div className="pna-heat-grade" style={{ gridTemplateColumns: `78px repeat(${hm.tipos.length}, 1fr) 32px` }}>
            <div />
            {hm.tipos.map((t) => <div key={t} className="pna-heat-cab">{ABREV[t] || t}</div>)}
            <div className="pna-heat-cab" style={{ textAlign: "right" }}>%</div>
            {areasHm.map((a) => (
              <Linha key={a.nome} a={a} />
            ))}
          </div>
        )}
      </div>

      {/* áreas a trabalhar + treinar por qualquer área */}
      <div className="pna-sec-cab">
        <p className="secao-label">Áreas a trabalhar</p>
        <button className="pna-link" onClick={onAreas}>Treinar por área →</button>
      </div>
      <div className="cartao pna-areas">
        {piores.length > 0 ? (
          piores.map((a) => (
            <div key={a.nome} className="pna-area">
              <div style={{ flex: 1 }}>
                <p className="pna-area-nome">{a.nome}</p>
                <p className="pna-area-sub">{Math.round(a.taxa * 100)}% de acerto · {a.total} respondidas</p>
              </div>
              <button className="pna-link" onClick={() => onTreinarArea?.(a.nome)}>Treinar →</button>
            </div>
          ))
        ) : (
          <p className="pna-explicacao-texto">Sem dados suficientes para sugerir áreas fracas. Escolhe qualquer uma em <b>Treinar por área</b>.</p>
        )}
      </div>

      {/* rodapé */}
      <div className="pna-rodape">
        <button className="pna-link" onClick={onHistorico}>Ver histórico →</button>
        <span>{nPerguntas} pergunta{nPerguntas === 1 ? "" : "s"} no banco</span>
      </div>
    </>
  );
}

function Linha({ a }) {
  return (
    <>
      <div className="pna-heat-area">{a.nome}</div>
      {a.celulas.map((c) => (
        <div key={c.tipo} className={"pna-heat-cell " + classeTaxa(c.taxa)} title={`${a.nome} · ${c.tipo}`}>
          {c.taxa != null && <span>{Math.round(c.taxa * 100)}</span>}
        </div>
      ))}
      <div className="pna-heat-pct">{a.taxa == null ? "—" : Math.round(a.taxa * 100) + "%"}</div>
    </>
  );
}
