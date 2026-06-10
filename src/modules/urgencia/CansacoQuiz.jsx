import { useState, useMemo } from "react";
import dados from "@conteudo/urgencia/cansaco-quiz.json";
import { Ico } from "@/components/icones";
import { useEstadoLocal } from "@/lib/persistencia";

const LETRAS = "ABCDE";

function baralhar(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Ordem inteligente: nunca feitos → errados → certos (baralhados dentro de cada grupo).
function ordemInteligente(historico) {
  const nunca = [], errados = [], certos = [];
  dados.casos.forEach((c, i) => {
    const st = historico[c.id];
    if (st === "correct") certos.push(i);
    else if (st === "wrong") errados.push(i);
    else nunca.push(i);
  });
  if (nunca.length === 0 && errados.length === 0) return baralhar(certos);
  return [...baralhar(nunca), ...baralhar(errados), ...baralhar(certos)];
}

function novaSessao(historico) {
  const ordem = ordemInteligente(historico);
  return { ordem, opts: ordem.map((ci) => baralhar(dados.casos[ci].options.map((_, i) => i))) };
}

export default function CansacoQuiz({ accent = "#e85d4a", voltar }) {
  const [historico, setHistorico] = useEstadoLocal("medguia:cansaco:quiz:historico", {});
  const [onboardVisto, setOnboardVisto] = useEstadoLocal("medguia:cansaco:quiz:onboard", false);
  const [modoPna, setModoPna] = useEstadoLocal("medguia:cansaco:quiz:pna", false);
  const [sabidas, setSabidas] = useEstadoLocal("medguia:cansaco:quiz:dicas-sabidas", []);
  const [dicasAbertas, setDicasAbertas] = useState(false);
  const [sessao, setSessao] = useState(() => novaSessao(historico));
  const [atual, setAtual] = useState(0);
  const [respostas, setRespostas] = useState({});
  const [vista, setVista] = useState("pergunta");
  const [dicaCat, setDicaCat] = useState(Object.keys(dados.dicas)[0]);

  const score = useMemo(() => {
    let certas = 0, erradas = 0;
    for (const [di, oi] of Object.entries(respostas)) {
      if (dados.casos[sessao.ordem[di]].options[oi].correct) certas++; else erradas++;
    }
    return { certas, erradas };
  }, [respostas, sessao]);

  const recomecar = () => { setSessao(novaSessao(historico)); setAtual(0); setRespostas({}); setVista("pergunta"); };

  const responder = (origIdx) => {
    if (respostas[atual] !== undefined) return;
    const caso = dados.casos[sessao.ordem[atual]];
    setRespostas((r) => ({ ...r, [atual]: origIdx }));
    setHistorico((h) => ({ ...h, [caso.id]: caso.options[origIdx].correct ? "correct" : "wrong" }));
  };

  const caso = dados.casos[sessao.ordem[atual]];
  const respondidoIdx = respostas[atual];
  const respondido = respondidoIdx !== undefined;
  const acertou = respondido && caso.options[respondidoIdx].correct === true;
  const total = sessao.ordem.length;

  return (
    <div className="ca ob-page">
      {!onboardVisto && (
        <div className="ca-onboard-bg">
          <div className="ca-onboard">
            <div className="ca-menu-eyebrow">{dados.onboarding.eyebrow}</div>
            <div className="ca-onboard-titulo">{dados.onboarding.titulo}</div>
            <p className="ca-onboard-contexto" dangerouslySetInnerHTML={{ __html: dados.onboarding.contexto }} />
            {dados.onboarding.passos.map((p, i) => (
              <div key={i} className="ca-onboard-passo"><span className="ca-onboard-num">{i + 1}</span><span dangerouslySetInnerHTML={{ __html: p }} /></div>
            ))}
            <button className="ca-btn" onClick={() => setOnboardVisto(true)}>{dados.onboarding.cta}</button>
          </div>
        </div>
      )}

      <button className="ob-voltar" onClick={voltar}>‹ Menu Cansaço</button>
      <h1 className="ob-titulo">{dados.titulo}</h1>
      <p className="ca-hero-sub">{dados.sub}</p>
      <div className="ob-aviso" dangerouslySetInnerHTML={{ __html: dados.disclaimer }} />

      <div className="ca-pna-wrap">
        <button className={"ca-pna-btn" + (modoPna ? " on" : "")} onClick={() => setModoPna((m) => !m)} title="Activa para ver dicas de memorização para o exame">
          <span className="ca-pna-dot" />Modo PNA
        </button>
      </div>

      {modoPna && (
        <div className={"ca-tips" + (dicasAbertas ? " open" : "")}>
          <button className="ca-tips-toggle" onClick={() => setDicasAbertas((a) => !a)}>
            <Ico name="bulb" s={18} />
            <span className="ca-tips-label">Dicas</span>
            <span className="ca-tips-arrow">▼</span>
          </button>
          {dicasAbertas && (
            <>
              <div className="ca-tips-tabs">
                {Object.keys(dados.dicas).map((c) => (
                  <button key={c} className={"ca-tips-tab" + (dicaCat === c ? " ativo" : "")} onClick={() => setDicaCat(c)}>
                    {c}<span className="ca-tips-count">{dados.dicas[c].length}</span>
                  </button>
                ))}
              </div>
              <div className="ca-tips-content">
                {dados.dicas[dicaCat].map((d, i) => {
                  const id = dicaCat + "::" + i;
                  const sabe = sabidas.includes(id);
                  return (
                    <div key={i} className={"ca-tips-item" + (sabe ? " sabida" : "")}>
                      <button className="ca-tips-check" title={sabe ? "Desmarcar" : "Marcar como sabida"}
                        onClick={() => setSabidas((s) => (sabe ? s.filter((x) => x !== id) : [...s, id]))}>{sabe ? "✓" : ""}</button>
                      <div className="ca-tips-texto" dangerouslySetInnerHTML={{ __html: d }} />
                    </div>
                  );
                })}
              </div>
              <div className="ca-tips-footer">
                <span className="ca-tips-progress">{sabidas.length} {sabidas.length === 1 ? "sabida" : "sabidas"}</span>
                <button className="ca-tips-reset" onClick={() => setSabidas([])}>Repor dicas iniciais</button>
              </div>
            </>
          )}
        </div>
      )}

      {vista === "resultados" && (
        <div className="ca-resultados">
          <div className="ca-res-pct">{total ? Math.round((score.certas / total) * 100) : 0}%</div>
          <div className="ca-res-label">{score.certas} de {total} corretas</div>
          <div className="ca-res-break">
            <div><strong className="ca-ok">{score.certas}</strong><span>Corretas</span></div>
            <div><strong className="ca-err">{score.erradas}</strong><span>Erradas</span></div>
          </div>
          <div className="ca-res-lista">
            {sessao.ordem.map((ci, di) => {
              const oi = respostas[di];
              const ok = oi !== undefined && dados.casos[ci].options[oi].correct === true;
              return (
                <button key={di} className="ca-res-item" onClick={() => { setAtual(di); setVista("pergunta"); }}>
                  <span className={"ca-res-dot " + (ok ? "ok" : "err")} />
                  <span style={{ flex: 1 }}>Caso {di + 1} — {ok ? "Correta" : "Errada"}</span>
                  <span className="ca-res-rever">Rever ›</span>
                </button>
              );
            })}
          </div>
          <div className="ca-flash-nav">
            <button className="ca-btn" onClick={recomecar}>Recomeçar com novos casos</button>
            <button className="ca-btn-out" onClick={() => { if (confirm("Apagar todo o histórico de respostas? Os casos voltam ao estado inicial.")) { setHistorico({}); setSessao(novaSessao({})); setAtual(0); setRespostas({}); setVista("pergunta"); } }}>Apagar histórico</button>
          </div>
        </div>
      )}

      {vista === "pergunta" && (
        <>
          <div className="ca-qcard">
            <div className="ca-qnum">Caso clínico {atual + 1} de {total}</div>
            <div className="ca-vignette">{caso.vignette}</div>
            <div className="ca-stem">{caso.stem}</div>
            <div className="ca-opts">
              {sessao.opts[atual].map((origIdx, di) => {
                const opt = caso.options[origIdx];
                let cls = "ca-opt";
                let tag = null;
                if (respondido) {
                  cls += " answered";
                  if (origIdx === respondidoIdx && acertou) { cls += " correta"; tag = "✓ A tua escolha — correcta"; }
                  else if (origIdx === respondidoIdx) { cls += " errada"; tag = "✗ A tua escolha — incorrecta"; }
                  else if (opt.correct) { cls += " revelada"; tag = "Resposta correcta"; }
                  else { cls += " dimmed"; tag = "Distrator"; }
                }
                return (
                  <div key={origIdx} className={cls} onClick={() => responder(origIdx)}>
                    <div className="ca-opt-row"><span className="ca-opt-letra">{LETRAS[di]}</span><span>{opt.text}</span></div>
                    {respondido && (
                      <div className="ca-opt-explica">
                        <span className="ca-opt-tag">{tag}</span>
                        <div dangerouslySetInnerHTML={{ __html: opt.why || "" }} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {respondido && (
              <>
                <div className={"ca-res-header " + (acertou ? "ok" : "err")}>
                  {acertou ? "✓ Resposta correcta" : "✗ Resposta incorrecta — vê a explicação por baixo de cada alínea acima"}
                </div>
                {caso.keyConcept && (
                  <div className="ca-keyconcept">
                    <div className="ca-keyconcept-titulo">Conceito-chave</div>
                    <div dangerouslySetInnerHTML={{ __html: caso.keyConcept }} />
                  </div>
                )}
                {modoPna && caso.quickTip && (
                  <div className="ca-quicktip">
                    <div className="ca-keyconcept-titulo">Dica para memorizar</div>
                    <div dangerouslySetInnerHTML={{ __html: caso.quickTip }} />
                  </div>
                )}
                <div className="ca-flash-nav">
                  {atual < total - 1
                    ? <button className="ca-btn" onClick={() => setAtual((a) => a + 1)}>Próximo caso →</button>
                    : <button className="ca-btn" onClick={() => setVista("resultados")}>Ver resultados</button>}
                  {Object.keys(respostas).length > 0 && <button className="ca-btn-out" onClick={() => setVista("resultados")}>Resultados</button>}
                </div>
              </>
            )}
          </div>

          <div className="ca-q-stats">
            <div><strong className="roxo">{Math.min(atual + 1, total)}</strong><span>Pergunta</span></div>
            <div><strong className="ok">{score.certas}</strong><span>Corretas</span></div>
            <div><strong className="err">{score.erradas}</strong><span>Erradas</span></div>
            <div><strong>{score.certas + score.erradas > 0 ? Math.round((score.certas / (score.certas + score.erradas)) * 100) : 0}%</strong><span>Acerto</span></div>
          </div>
        </>
      )}
    </div>
  );
}
