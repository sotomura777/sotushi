import { useEffect, useState } from "react";
import dados from "@conteudo/cronicas/anemia-casos-padroes.json";
import { useEstadoLocal } from "@/lib/persistencia";

const LETRAS = ["A", "B", "C", "D"];

function baralhar(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// 3 distratores: primeiro os da mesma categoria morfológica, depois os restantes (como no original).
function distratores(correto) {
  const outros = dados.tipos.filter((t) => t.id !== correto.id);
  const mesmaCat = baralhar(outros.filter((t) => t.cat === correto.cat));
  const restantes = baralhar(outros.filter((t) => t.cat !== correto.cat));
  return [...mesmaCat, ...restantes].slice(0, 3);
}

// Sessão: 15 padrões + 5 extra, ordenados pelo historial (nunca feitos → errados → certos),
// com as opções pré-baralhadas por pergunta para não mudarem entre renders.
function novaSessao(historico) {
  const perguntas = [
    ...dados.tipos.map((t) => ({ qid: t.id, labs: t.quizCaseLabs, correto: t })),
    ...dados.extraQuiz.map((eq, i) => ({ qid: eq.typeId + "-x" + i, labs: eq.findings, correto: dados.tipos.find((t) => t.id === eq.typeId) })),
  ];
  const nunca = [], errados = [], certos = [];
  perguntas.forEach((q) => {
    const st = historico[q.qid];
    if (st === "correct") certos.push(q);
    else if (st === "wrong") errados.push(q);
    else nunca.push(q);
  });
  const ordem = nunca.length === 0 && errados.length === 0
    ? baralhar(certos)
    : [...baralhar(nunca), ...baralhar(errados), ...baralhar(certos)];
  return ordem.map((q) => ({ ...q, opcoes: baralhar([q.correto, ...distratores(q.correto)]) }));
}

// Casos por padrões da Anemia — quiz fiel ao original: só o padrão laboratorial,
// 4 opções, correção com mecanismo, score em tempo real e historial inteligente.
// Painel flutuante de valores de referência (FAB) como no original.
export default function AnemiaCasosPadroes({ voltar, rotuloVoltar = "‹ Voltar" }) {
  const [historico, setHistorico] = useEstadoLocal("medguia:anemia:casos-padroes:historico", {});
  const [perguntas, setPerguntas] = useState(() => novaSessao(historico));
  const [idx, setIdx] = useState(0);
  const [certas, setCertas] = useState(0);
  const [erradas, setErradas] = useState(0);
  const [escolha, setEscolha] = useState(null);
  const [refAberto, setRefAberto] = useState(false);

  useEffect(() => { window.scrollTo({ top: 0 }); }, [idx]);

  const recomecar = () => { setPerguntas(novaSessao(historico)); setIdx(0); setCertas(0); setErradas(0); setEscolha(null); };
  const apagarHistorico = () => {
    if (!confirm("Apagar histórico?")) return;
    setHistorico({});
    setPerguntas(novaSessao({})); setIdx(0); setCertas(0); setErradas(0); setEscolha(null);
  };

  const total = perguntas.length;
  const fim = idx >= total;
  const q = fim ? null : perguntas[idx];
  const respondido = escolha !== null;
  const respondidas = certas + erradas;
  const pct = respondidas === 0 ? null : Math.round((certas / respondidas) * 100);

  const responder = (id) => {
    if (respondido) return;
    setEscolha(id);
    const acertou = id === q.correto.id;
    if (acertou) setCertas((c) => c + 1); else setErradas((e) => e + 1);
    setHistorico((h) => ({ ...h, [q.qid]: acertou ? "correct" : "wrong" }));
  };
  const proxima = () => { setEscolha(null); setIdx((i) => i + 1); };

  const msgFinal = pct >= 90 ? "Excelente." : pct >= 70 ? "Bom — continua a treinar." : pct >= 50 ? "Razoável — revê os padrões." : "Treina mais — revê os padrões.";

  return (
    <div className="ca anemia ob-page an-cpq">
      <button className="ob-voltar" onClick={voltar}>{rotuloVoltar}</button>
      <h1 className="ob-titulo">{dados.titulo}</h1>
      <p className="ca-hero-sub">{dados.subtitulo}</p>

      <div className="score-bar">
        <div className="score-item"><span className="score-label">Pergunta</span><span className="score-value">{Math.min(idx + 1, total)}</span></div>
        <div className="score-item"><span className="score-label">Certas</span><span className="score-value ok">{certas}</span></div>
        <div className="score-item"><span className="score-label">Erradas</span><span className="score-value no">{erradas}</span></div>
        <div className="score-item"><span className="score-label">Precisão</span><span className="score-value">{pct === null ? "—" : pct + "%"}</span></div>
        <div className="progress-bar"><div className="progress-fill" style={{ width: `${(fim ? total : idx) / total * 100}%` }} /></div>
        <button className="quiz-exit-btn" onClick={recomecar}>↻ Recomeçar</button>
      </div>

      {fim ? (
        <div className="final-card">
          <div className="final-card-title">Treino concluído</div>
          <div className="final-card-msg">{msgFinal}</div>
          <div className="final-card-stat">
            <div><div className="final-stat-num">{certas}/{respondidas}</div><div className="final-stat-label">Acertos</div></div>
            <div><div className="final-stat-num">{pct ?? 0}%</div><div className="final-stat-label">Precisão</div></div>
          </div>
          <button className="final-restart" onClick={recomecar}>↻ Recomeçar</button>{" "}
          <button className="final-restart outline" onClick={apagarHistorico}>Apagar histórico</button>
        </div>
      ) : (
        <div className="quiz-card">
          <div className="quiz-num">— Caso {idx + 1}</div>
          <div className="quiz-findings">{q.labs}</div>
          <div className="quiz-question">{dados.pergunta}</div>
          <div className="q-opts">
            {q.opcoes.map((o, i) => {
              let cls = "q-opt";
              if (respondido) {
                cls += " locked";
                if (o.id === q.correto.id) cls += " correct";
                else if (o.id === escolha) cls += " wrong";
                else cls += " faded";
              }
              return (
                <button key={o.id} className={cls} onClick={() => responder(o.id)}>
                  <div className="q-opt-letter">{LETRAS[i]}</div>
                  <div>{o.name}</div>
                </button>
              );
            })}
          </div>
          {respondido && (
            <div className="q-explanation show">
              <span className={"q-explanation-tag " + (escolha === q.correto.id ? "ok" : "no")}>
                {escolha === q.correto.id ? "✓ Correto" : "✗ Incorreto"}
              </span>
              <b>{q.correto.name}</b> — {q.correto.meta}
              <div className="q-explanation-mech"><b>Mecanismo:</b> <span dangerouslySetInnerHTML={{ __html: q.correto.mechanism }} /></div>
              <button className="q-next-btn" onClick={proxima}>{idx + 1 < total ? "Próximo →" : "Ver resultado →"}</button>
            </div>
          )}
        </div>
      )}

      <button className="ref-fab" title={dados.ref.titulo} onClick={() => setRefAberto((a) => !a)}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="9" y1="13" x2="15" y2="13" /><line x1="9" y1="17" x2="15" y2="17" /></svg>
      </button>
      <div className={"ref-panel" + (refAberto ? " open" : "")}>
        <div className="ref-panel-head">
          <span className="ref-panel-title">{dados.ref.titulo}</span>
          <button className="ref-panel-close" onClick={() => setRefAberto(false)}>×</button>
        </div>
        <div dangerouslySetInnerHTML={{ __html: dados.ref.html }} />
      </div>
    </div>
  );
}
