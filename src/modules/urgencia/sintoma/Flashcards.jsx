import { useState } from "react";
import { useEstadoLocal } from "@/lib/persistencia";

// Flashcards de revisão — partilhado pelos módulos de sintomas.
// Duas abas como nos originais: exemplos prontos e "Os Meus Flashcards" (criação livre).
// dados: {exemplos: [{q, a, e?}]}; prefixo: chave localStorage para os criados.
// Renderiza só o conteúdo — o cabeçalho/voltar é do componente que o usa.
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function Revisao({ cards, onApagar }) {
  const [idx, setIdx] = useState(0);
  const [virado, setVirado] = useState(false);
  const [explica, setExplica] = useState(false);
  const i = Math.min(idx, cards.length - 1);
  const card = cards[i];
  const ir = (d) => { setIdx((cards.length + i + d) % cards.length); setVirado(false); setExplica(false); };

  return (
    <div className="ca-flash">
      <div className="ca-flash-prog">
        <span>{i + 1} / {cards.length}</span>
        <div className="ca-flash-track"><div className="ca-flash-fill" style={{ width: `${((i + 1) / cards.length) * 100}%` }} /></div>
      </div>
      <div className={"ca-flash-scene" + (virado ? " flipped" : "")} onClick={() => setVirado((v) => !v)}>
        <div className="ca-flash-inner">
          <div className="ca-flash-face ca-flash-front">
            <div className="ca-flash-label">Pergunta</div>
            <div className="ca-flash-q" dangerouslySetInnerHTML={{ __html: card.q }} />
            <div className="ca-flash-hint">Toca para ver a resposta</div>
          </div>
          <div className="ca-flash-face ca-flash-back">
            <div className="ca-flash-label">Resposta</div>
            <div className="ca-flash-a" dangerouslySetInnerHTML={{ __html: card.a }} />
            {card.e && (
              <button className="ca-flash-explica-btn" onClick={(e) => { e.stopPropagation(); setExplica((x) => !x); }}>
                {explica ? "Ocultar explicação" : "Explicar resposta"}
              </button>
            )}
            {explica && <div className="ca-flash-explica" onClick={(e) => e.stopPropagation()} dangerouslySetInnerHTML={{ __html: card.e }} />}
          </div>
        </div>
      </div>
      <div className="ca-flash-nav">
        <button className="ca-btn-out" onClick={() => ir(-1)}>‹ Anterior</button>
        {onApagar && <button className="ca-btn-out" onClick={() => { if (confirm("Apagar este flashcard?")) { onApagar(i); setIdx(0); setVirado(false); setExplica(false); } }}>Apagar</button>}
        <button className="ca-btn-out" onClick={() => ir(1)}>Próximo ›</button>
      </div>
    </div>
  );
}

export default function Flashcards({ dados, prefixo }) {
  const [aba, setAba] = useState("exemplo");
  const [meus, setMeus] = useEstadoLocal(prefixo + ":meus", []);
  const [criar, setCriar] = useState(false);
  const [q, setQ] = useState(""); const [a, setA] = useState(""); const [e, setE] = useState("");

  const guardar = () => {
    if (!q.trim() || !a.trim()) return;
    setMeus((l) => [...l, { q: esc(q.trim()), a: esc(a.trim()), e: e.trim() ? esc(e.trim()) : undefined }]);
    setQ(""); setA(""); setE(""); setCriar(false);
  };

  return (
    <div>
      <div className="ob-sub">
        <button className={"ob-sub-btn" + (aba === "exemplo" ? " ativo" : "")} onClick={() => setAba("exemplo")}>Flashcards Exemplo</button>
        <button className={"ob-sub-btn" + (aba === "meus" ? " ativo" : "")} onClick={() => setAba("meus")}>Os Meus Flashcards{meus.length ? ` (${meus.length})` : ""}</button>
      </div>

      {aba === "exemplo" && <Revisao cards={dados.exemplos} />}

      {aba === "meus" && (
        <>
          <div className="ca-cards-barra" style={{ justifyContent: "center" }}>
            <button className="ca-btn-out ca-novo-card" onClick={() => setCriar((c) => !c)}>{criar ? "Fechar" : "+ Novo flashcard"}</button>
          </div>
          {criar && (
            <div className="ca-flash-form">
              <div className="ca-form-lbl">Pergunta</div>
              <input className="campo ca-an-inp" value={q} onChange={(ev) => setQ(ev.target.value)} placeholder="Ex.: Tríade de Charcot?" />
              <div className="ca-form-lbl">Resposta</div>
              <textarea className="campo ca-an-inp ca-form-area" value={a} onChange={(ev) => setA(ev.target.value)} placeholder="A resposta…" />
              <div className="ca-form-lbl">Explicação (opcional)</div>
              <textarea className="campo ca-an-inp ca-form-area" value={e} onChange={(ev) => setE(ev.target.value)} placeholder="Detalhe ou mnemónica…" />
              <div className="ca-flash-nav" style={{ marginTop: 10 }}>
                <button className="ca-btn" disabled={!q.trim() || !a.trim()} onClick={guardar}>Guardar flashcard</button>
              </div>
            </div>
          )}
          {meus.length === 0 && !criar && <div className="ob-faq-vazio">Ainda não criaste flashcards. Carrega em "+ Novo flashcard".</div>}
          {meus.length > 0 && <Revisao cards={meus} onApagar={(i) => setMeus((l) => l.filter((_, j) => j !== i))} />}
        </>
      )}
    </div>
  );
}
