import { Ico } from "@/components/icones";
import { resumo, acertoPorArea } from "./logica-estatisticas";
import { mudancaResposta, fadiga } from "./logica-comportamento";
import { melhorPosicao, percentilNoAno, lugarNoAno } from "./logica-posicao";

// ============================================================================
// Resultados — ecrã pós-exame. Score, posição vs. PNAs OFICIAIS (estado vazio
// até haver dados ACSS; nunca compara com outros utilizadores), desempenho por
// área, análise comportamental da sessão e "ganho estimado se não mudasses as
// respostas". Apresentação: recebe o resultado já calculado pelo Exame.
// ============================================================================
function classeTaxa(t) {
  if (t == null) return "hc0";
  if (t >= 0.85) return "hc1"; if (t >= 0.70) return "hc2"; if (t >= 0.55) return "hc3"; if (t >= 0.40) return "hc4"; return "hc5";
}
const fmtMin = (ms) => { const m = Math.round(ms / 60000); return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}min` : `${m}min`; };

export default function Resultados({ resultado, historico, onVoltar, onNova, onRefazerErradas }) {
  const { respostas, perguntas, nTotal, nAcertos, scoreTaxa, tempoTotalMs, marcadas } = resultado;
  const score = Math.round(scoreTaxa * 100);

  const porArea = acertoPorArea(respostas).sort((a, b) => b.taxa - a.taxa);
  const mud = mudancaResposta(respostas);
  const fad = fadiga(respostas, Math.max(1, Math.ceil(nTotal / 3)));
  const tempoMedio = resumo(respostas).tempoMedioS;

  // ganho estimado se mantivesse a primeira intuição
  const hipoAcertos = respostas.filter((r) => r.primeira_opcao === r.correta_letra).length;
  const ganho = hipoAcertos - nAcertos; // perguntas extra que teria acertado
  const hipoTaxa = nTotal ? hipoAcertos / nTotal : 0;

  // marcadas: quantas certas/erradas
  const marcSet = new Set(marcadas);
  const marcRespondidas = respostas.filter((r) => marcSet.has(r.pergunta_id));
  const marcCertas = marcRespondidas.filter((r) => r.correta).length;

  // posição oficial
  const pos = melhorPosicao(scoreTaxa, historico);
  const anos = historico?.anos || {};
  const anosLista = Object.keys(anos).sort((a, b) => b - a);

  const erradas = perguntas.filter((p) => {
    const r = respostas.find((x) => x.pergunta_id === p.id);
    return r && !r.correta;
  });

  return (
    <>
      <div className="pna-treino-topo">
        <button className="pna-link" onClick={onVoltar}>← Dashboard</button>
        <span className="pna-treino-prog">{resultado.anoSimulado ? `Simulação PNA ${resultado.anoSimulado}` : "Simulação"}</span>
      </div>

      {/* hero score */}
      <div className="cartao pna-res-hero">
        <div className="pna-res-concluida"><Ico name="checkCircle" s={15} /> Simulação concluída</div>
        <div className="pna-res-score"><span className="n">{score}</span><span className="pc">%</span></div>
        <p className="pna-area-sub" style={{ textAlign: "center" }}>
          <b style={{ color: "var(--texto)" }}>{nAcertos} de {nTotal}</b> corretas · em {fmtMin(tempoTotalMs)}
        </p>

        <div className="pna-res-posbox">
          <p className="pna-metrica-label" style={{ textAlign: "center", marginBottom: 4 }}>Posição estimada vs. PNAs oficiais</p>
          {pos ? (
            <>
              <p className="pna-res-pos">~{pos.lugar?.toLocaleString("pt-PT")}<span className="de"> / {pos.candidatos?.toLocaleString("pt-PT")}</span></p>
              <p className="pna-area-sub" style={{ textAlign: "center" }}>PNA {pos.ano} · percentil {Math.round(pos.percentil * 100)} · dados oficiais da ACSS</p>
            </>
          ) : (
            <p className="pna-explicacao-texto" style={{ textAlign: "center" }}>
              Adiciona os dados oficiais da ACSS em <b>historico-oficial.json</b> para estimar o teu lugar. Nunca comparamos com outros utilizadores.
            </p>
          )}
        </div>
      </div>

      {/* outros anos */}
      {anosLista.length > 0 && (
        <>
          <p className="secao-label">Com este desempenho noutros anos</p>
          <div className="cartao pna-areas">
            {anosLista.map((ano) => {
              const lugar = lugarNoAno(scoreTaxa, anos[ano]);
              const p = percentilNoAno(scoreTaxa, anos[ano]);
              return (
                <div key={ano} className="pna-area">
                  <div><p className="pna-area-nome">PNA {ano}</p><p className="pna-area-sub">{anos[ano].candidatos?.toLocaleString("pt-PT")} candidatos</p></div>
                  <div style={{ textAlign: "right" }}>
                    <p className="pna-area-nome">~lugar {lugar?.toLocaleString("pt-PT") ?? "—"}</p>
                    <p className="pna-area-sub">percentil {p != null ? Math.round(p * 100) : "—"}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* desempenho por área */}
      {porArea.length > 0 && (
        <>
          <p className="secao-label">Desempenho por área</p>
          <div className="cartao pna-areas">
            {porArea.map((a) => (
              <div key={a.nome} className="pna-area">
                <div style={{ flex: 1 }}>
                  <p className="pna-area-nome">{a.nome}</p>
                  <div className="pna-barra" style={{ marginTop: 6 }}><i className={classeTaxa(a.taxa)} style={{ width: Math.round(a.taxa * 100) + "%" }} /></div>
                </div>
                <span className="pna-area-sub" style={{ minWidth: 64, textAlign: "right" }}>{Math.round(a.taxa * 100)}% · {a.acertos}/{a.total}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* análise comportamental da sessão */}
      <p className="secao-label">Análise comportamental desta sessão</p>
      <div className="pna-res-2x2">
        <div className="cartao pna-res-cel">
          <p className="pna-res-cel-lbl"><Ico name="refresh" s={13} /> Mudanças de resposta</p>
          <p className="pna-res-cel-n">{mud.mudou}</p>
          <p className="pna-area-sub"><b style={{ color: "var(--pna-h5)" }}>{mud.certoErrado}</b> certo→errado · <b style={{ color: "var(--pna-h1)" }}>{mud.erradoCerto}</b> errado→certo</p>
        </div>
        <div className="cartao pna-res-cel">
          <p className="pna-res-cel-lbl"><Ico name="clock" s={13} /> Tempo por pergunta</p>
          <p className="pna-res-cel-n">{tempoMedio}<span className="u">s</span></p>
          <p className="pna-area-sub">média da sessão</p>
        </div>
        <div className="cartao pna-res-cel">
          <p className="pna-res-cel-lbl"><Ico name="chart" s={13} /> Fadiga</p>
          {fad.length >= 2 && fad[0].taxa != null && fad[fad.length - 1].taxa != null ? (
            <>
              <p className="pna-res-cel-n">{Math.round((fad[0].taxa - fad[fad.length - 1].taxa) * 100)}<span className="u"> pp</span></p>
              <p className="pna-area-sub">do início ao fim</p>
            </>
          ) : <p className="pna-area-sub" style={{ marginTop: 8 }}>Dados insuficientes.</p>}
        </div>
        <div className="cartao pna-res-cel">
          <p className="pna-res-cel-lbl"><Ico name="star" s={13} /> Marcadas</p>
          <p className="pna-res-cel-n">{marcRespondidas.length}</p>
          <p className="pna-area-sub">acertaste <b style={{ color: "var(--pna-h1)" }}>{marcCertas}</b> · erraste <b style={{ color: "var(--pna-h5)" }}>{marcRespondidas.length - marcCertas}</b></p>
        </div>
      </div>

      {/* insight ganho estimado */}
      {ganho > 0 && (
        <div className="pna-insight pna-insight--mau" style={{ marginTop: 12 }}>
          <span className="i"><Ico name="bulb" s={16} /></span>
          <div>
            <b>Padrão crítico:</b> mudaste de uma resposta certa para errada {mud.certoErrado} vez{mud.certoErrado === 1 ? "" : "es"}.
            Se mantivesses a primeira intuição, terias <b>~{Math.round(hipoTaxa * 100)}%</b> em vez de {score}%. Confia mais na primeira leitura.
          </div>
        </div>
      )}

      {/* o que fazer agora */}
      <p className="secao-label" style={{ marginTop: 18 }}>O que fazer agora</p>
      <div className="pna-modos">
        <button className="pna-modo" onClick={() => erradas.length ? onRefazerErradas(erradas) : null} disabled={!erradas.length}>
          <div className="pna-modo-cab"><span className="ic"><Ico name="refresh" s={18} /></span><p className="pna-modo-nome">Refazer as {erradas.length} erradas</p></div>
          <p className="pna-modo-desc">Modo treino com explicação completa</p>
        </button>
        <button className="pna-modo" onClick={onNova}>
          <div className="pna-modo-cab"><span className="ic"><Ico name="alvo" s={18} /></span><p className="pna-modo-nome">Nova simulação</p></div>
          <p className="pna-modo-desc">Outro exame cronometrado</p>
        </button>
      </div>

      <div className="pna-dois" style={{ marginTop: 14, marginBottom: 0 }}>
        <button className="pna-btn-sec" onClick={onVoltar}><Ico name="home" s={14} /> Dashboard</button>
        <button className="pna-btn" onClick={onNova}>Nova simulação</button>
      </div>
    </>
  );
}
