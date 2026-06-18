import { useState, useEffect, useMemo } from "react";
import meta from "@conteudo/pna/meta.json";
import taxonomia from "@conteudo/pna/taxonomia.json";
import perguntasRaw from "@conteudo/pna/perguntas.jsonl?raw";
import historico from "@conteudo/pna/historico-oficial.json";
import presetsCfg from "@conteudo/pna/presets.json";
import { toast } from "@/lib/toast";
import { carregarPerguntas } from "./logica-carregar";
import { contarRespostas } from "./db";
import EstadoVazio from "./EstadoVazio";
import Dashboard from "./Dashboard";
import Treino from "./Treino";
import Exame from "./Exame";
import Resultados from "./Resultados";
import Estatisticas from "./Estatisticas";
import Construtor from "./Construtor";
import Revisao from "./Revisao";
import Historico from "./Historico";
import TreinoAreas from "./TreinoAreas";
import ErroBoundary from "./ErroBoundary";
import "./estilo.css";

// ============================================================================
// PNA — Prova Nacional de Acesso (módulo de treino)
// ----------------------------------------------------------------------------
// Carrega e valida o banco (perguntas.jsonl) contra a taxonomia, inicializa a
// contagem de respostas (IndexedDB) e roteia internamente:
//   inicio (Dashboard/EstadoVazio) → treino · exame → resultados · estatisticas
// Conteúdo clínico vive em /conteudo/pna/.
// ============================================================================
export default function PNA({ accent = "#639922", gradiente, onVoltar }) {
  const { perguntas, erros } = useMemo(() => carregarPerguntas(perguntasRaw, taxonomia), []);

  const [ecra, setEcra] = useState("inicio"); // inicio | treino | exame | resultados | estatisticas | construtor
  const [nResp, setNResp] = useState(null);
  const [treinoSet, setTreinoSet] = useState(perguntas); // subconjunto para o Treino
  const [exameSet, setExameSet] = useState(perguntas);   // subconjunto para o Exame
  const [exameTempo, setExameTempo] = useState(null);    // s por pergunta (null = estimado)
  const [resultado, setResultado] = useState(null);
  const [resultadoVoltar, setResultadoVoltar] = useState("inicio"); // ecrã de regresso dos Resultados

  useEffect(() => {
    if (erros.length) console.warn(`[PNA] ${erros.length} pergunta(s) rejeitada(s):`, erros);
  }, [erros]);

  const recarregarContagem = () => contarRespostas().then(setNResp).catch(() => setNResp(0));
  useEffect(() => { recarregarContagem(); }, []);

  const semBanco = perguntas.length === 0;
  const iniciarTreino = (set) => {
    if (semBanco) { toast("Banco de perguntas vazio"); return; }
    setTreinoSet(set && set.length ? set : perguntas);
    setEcra("treino");
  };
  const iniciarTreinoArea = (area) => {
    const set = perguntas.filter((p) => p.taxonomia?.especialidade === area);
    if (!set.length) { toast(`Sem perguntas de ${area}`); return; }
    iniciarTreino(set);
  };
  const iniciarExame = (set, tempoS) => {
    if (semBanco) { toast("Banco de perguntas vazio"); return; }
    setExameSet(set && set.length ? set : perguntas);
    setExameTempo(tempoS ?? null);
    setEcra("exame");
  };
  const aoEscolherModo = (id) => {
    if (id === "treino") iniciarTreino();
    else if (id === "exame") iniciarExame();
    else if (id === "construtor") setEcra("construtor");
    else if (id === "revisao") setEcra("revisao");
    else toast("Em breve — próxima iteração");
  };

  return (
    <div className="pna" style={{ "--acento": accent }}>
      <header className="hero" style={{ background: gradiente || accent }}>
        <div className="hero-conteudo">
          {onVoltar && <button className="voltar" onClick={onVoltar}>← Início</button>}
          <div className="hero-titulo">{meta.titulo}</div>
          <div className="hero-subtitulo">{meta.subtitulo}</div>
        </div>
      </header>

      <div className="modulo-corpo">
       <ErroBoundary key={ecra} onReset={() => setEcra("inicio")}>
        {ecra === "inicio" && nResp !== null && (
          <>
            <div className="pna-aviso">{meta.enquadramento}</div>
            {nResp > 0 ? (
              <Dashboard
                taxonomia={taxonomia}
                nPerguntas={perguntas.length}
                onEstatisticas={() => setEcra("estatisticas")}
                onHistorico={() => setEcra("historico")}
                onModo={aoEscolherModo}
                onTreinarArea={iniciarTreinoArea}
                onAreas={() => setEcra("areas")}
              />
            ) : (
              <>
                <EstadoVazio nPerguntas={perguntas.length} onIniciar={iniciarTreino} onModo={aoEscolherModo} />
                <div style={{ marginTop: 14 }}>
                  <button className="pna-btn-sec" onClick={() => setEcra("estatisticas")}>Ver estatísticas</button>
                </div>
              </>
            )}
          </>
        )}

        {ecra === "treino" && (
          <Treino perguntas={treinoSet} onFim={() => { recarregarContagem(); setEcra("inicio"); }} />
        )}

        {ecra === "exame" && (
          <Exame
            perguntas={exameSet}
            tempoPorPerguntaS={exameTempo}
            onSair={() => setEcra("inicio")}
            onFim={(res) => { setResultado(res); setResultadoVoltar("inicio"); recarregarContagem(); setEcra("resultados"); }}
          />
        )}

        {ecra === "construtor" && (
          <Construtor
            taxonomia={taxonomia}
            perguntas={perguntas}
            presetsFabrica={presetsCfg.presets || []}
            onVoltar={() => setEcra("inicio")}
            onComecar={({ perguntas: set, modo, tempoS }) => (modo === "exame" ? iniciarExame(set, tempoS) : iniciarTreino(set))}
          />
        )}

        {ecra === "revisao" && (
          <Revisao
            perguntas={perguntas}
            onVoltar={() => setEcra("inicio")}
            onComecar={(set) => iniciarTreino(set)}
          />
        )}

        {ecra === "resultados" && resultado && (
          <Resultados
            resultado={resultado}
            historico={historico}
            onVoltar={() => setEcra(resultadoVoltar)}
            onNova={iniciarExame}
            onRefazerErradas={(erradas) => iniciarTreino(erradas)}
          />
        )}

        {ecra === "historico" && (
          <Historico
            perguntas={perguntas}
            historico={historico}
            onVoltar={() => setEcra("inicio")}
            onAbrir={(res) => { setResultado(res); setResultadoVoltar("historico"); setEcra("resultados"); }}
          />
        )}

        {ecra === "areas" && (
          <TreinoAreas perguntas={perguntas} onTreinar={iniciarTreinoArea} onVoltar={() => setEcra("inicio")} />
        )}

        {ecra === "estatisticas" && (
          <Estatisticas
            taxonomia={taxonomia}
            historico={historico}
            onVoltar={() => { recarregarContagem(); setEcra("inicio"); }}
          />
        )}
       </ErroBoundary>
      </div>
    </div>
  );
}
