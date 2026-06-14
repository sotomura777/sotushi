import { useState } from "react";
import { Ico } from "@/components/icones";

// ============================================================================
// MapaNavegacao — grelha de todas as perguntas do exame com o estado de cada
// (respondida / em branco / marcada / atual). Permite saltar e submeter.
// Apresentação pura: recebe estado e callbacks do Exame.
// ============================================================================
export default function MapaNavegacao({ perguntas, idxAtual, respostas, marcadas, ritmoS, restanteFmt, onIr, onVoltar, onSubmeter }) {
  const [filtro, setFiltro] = useState("todas"); // todas | branco | marcadas

  const nRespondidas = perguntas.filter((p) => respostas[p.id] != null).length;
  const nBranco = perguntas.length - nRespondidas;
  const nMarcadas = marcadas.size;

  const visivel = (p) => {
    if (filtro === "branco") return respostas[p.id] == null;
    if (filtro === "marcadas") return marcadas.has(p.id);
    return true;
  };

  const FILTROS = [
    { v: "todas", t: `Todas (${perguntas.length})` },
    { v: "branco", t: `Só em branco (${nBranco})` },
    { v: "marcadas", t: `Só marcadas (${nMarcadas})` },
  ];

  return (
    <>
      <div className="pna-treino-topo">
        <button className="pna-link" onClick={onVoltar}>← Voltar à pergunta {idxAtual + 1}</button>
        <span className="pna-treino-prog">{restanteFmt}</span>
      </div>

      <div className="pna-metricas">
        <div className="pna-metrica pna-metrica--destaque">
          <p className="pna-metrica-label">Respondidas</p>
          <p className="pna-metrica-valor">{nRespondidas}</p>
        </div>
        <div className="pna-metrica">
          <p className="pna-metrica-label">Em branco</p>
          <p className="pna-metrica-valor">{nBranco}</p>
        </div>
        <div className="pna-metrica">
          <p className="pna-metrica-label">Marcadas</p>
          <p className="pna-metrica-valor">{nMarcadas}</p>
        </div>
        <div className="pna-metrica">
          <p className="pna-metrica-label">Ritmo</p>
          <p className="pna-metrica-valor">{ritmoS}<span className="u">s</span></p>
        </div>
      </div>

      <div className="pna-chips">
        {FILTROS.map((f) => (
          <button key={f.v} className={"pna-chip" + (filtro === f.v ? " ativo" : "")} onClick={() => setFiltro(f.v)}>{f.t}</button>
        ))}
      </div>

      <div className="cartao" style={{ padding: 14, marginBottom: 14 }}>
        <div className="pna-mapa-grade">
          {perguntas.map((p, i) => {
            if (!visivel(p)) return null;
            const respondida = respostas[p.id] != null;
            const atual = i === idxAtual;
            let cls = "pna-mapa-cel ";
            cls += atual ? "pna-mapa--atual" : respondida ? "pna-mapa--resp" : "pna-mapa--branco";
            return (
              <button key={p.id} className={cls} onClick={() => onIr(i)}>
                {i + 1}
                {marcadas.has(p.id) && <span className="pna-mapa-flag" />}
              </button>
            );
          })}
        </div>
        <div className="pna-mapa-legenda">
          <span><i className="pna-mapa--resp" />Respondida</span>
          <span><i className="pna-mapa--branco" />Em branco</span>
          <span><i className="pna-mapa--resp pna-mapa-flagged" />Marcada</span>
          <span><i className="pna-mapa--atual" />Atual</span>
        </div>
      </div>

      {nBranco > 0 && (
        <div className="pna-insight pna-insight--aviso" style={{ marginBottom: 14 }}>
          <span className="i"><Ico name="warn" s={16} /></span>
          <div><b>Tens {nBranco} pergunta{nBranco === 1 ? "" : "s"} em branco.</b> Na PNA real, em branco conta como zero. Recomendado responder a todas antes de submeter.</div>
        </div>
      )}

      <div className="pna-dois" style={{ marginBottom: 0 }}>
        <button className="pna-btn-sec" onClick={onVoltar}>← Voltar ao exame</button>
        <button className="pna-btn" onClick={onSubmeter}><Ico name="check" s={15} /> Submeter exame</button>
      </div>
    </>
  );
}
