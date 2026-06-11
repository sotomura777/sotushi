import { useState } from "react";
import dados from "@conteudo/cronicas/asma-flashcards.json";
import { Ico } from "@/components/icones";
import { useEstadoLocal } from "@/lib/persistencia";

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function baralhar(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Flashcards da Asma — fiel ao original: dois baralhos (Crónica/Aguda), lista numerada,
// revisão (única ou aleatória) com flip, marcação certo/errado, toast e resultados.
// Sub-separador "Os meus": criação livre por baralho, guardada em localStorage.
export default function AsmaFlashcards({ voltar }) {
  const [deckId, setDeckId] = useEstadoLocal("medguia:asma:flash:deck", dados.decks[0].id);
  const [sub, setSub] = useState("estudo");
  const [meus, setMeus] = useEstadoLocal("medguia:asma:flash:meus", []);
  const [revisao, setRevisao] = useState(null); // {cards, idx, modo, scoreR, scoreW, respondidos, fim}
  const [virado, setVirado] = useState(false);
  const [explicaAberta, setExplicaAberta] = useState(false);
  const [flash, setFlash] = useState("");
  const [toast, setToast] = useState(null);
  const [formAberto, setFormAberto] = useState(false);
  const [q, setQ] = useState(""); const [a, setA] = useState(""); const [e, setE] = useState("");

  const deck = dados.decks.find((d) => d.id === deckId);
  const meusDoDeck = meus.map((c, i) => ({ ...c, _i: i })).filter((c) => c.cat === deckId);
  const cartas = sub === "estudo" ? deck.cards : meusDoDeck;

  const entrarRevisao = (cards, idx, modo) => {
    setRevisao({ cards, idx, modo, scoreR: 0, scoreW: 0, respondidos: {}, fim: false });
    setVirado(false); setExplicaAberta(false); setFlash("");
  };
  const sairRevisao = () => { setRevisao(null); setToast(null); };

  const ir = (d) => {
    if (!revisao) return;
    const novo = revisao.idx + d;
    if (novo < 0 || novo >= revisao.cards.length) return;
    setRevisao((r) => ({ ...r, idx: novo }));
    setVirado(false); setExplicaAberta(false); setFlash("");
  };

  const marcar = (tipo) => {
    if (!revisao || revisao.respondidos[revisao.idx]) return;
    const certo = tipo === "right";
    setRevisao((r) => ({
      ...r,
      scoreR: r.scoreR + (certo ? 1 : 0),
      scoreW: r.scoreW + (certo ? 0 : 1),
      respondidos: { ...r.respondidos, [r.idx]: tipo },
    }));
    setFlash(certo ? "flash-correct" : "flash-wrong");
    setToast({ tipo, texto: certo ? "Boa! Continua assim" : "Para a próxima consegues" });
    setTimeout(() => setToast(null), 1200);
    setTimeout(() => { setVirado(false); setFlash(""); }, 350);
    setTimeout(() => {
      setRevisao((r) => {
        if (!r) return r;
        if (r.modo === "single") return null;
        if (r.idx < r.cards.length - 1) { setExplicaAberta(false); return { ...r, idx: r.idx + 1 }; }
        return { ...r, fim: true };
      });
    }, 850);
  };

  const guardarMeu = () => {
    if (!q.trim() || !a.trim()) return;
    setMeus((l) => [...l, { q: esc(q.trim()), a: esc(a.trim()), e: e.trim() ? esc(e.trim()) : "", cat: deckId }]);
    setQ(""); setA(""); setE(""); setFormAberto(false);
  };
  const apagarMeu = (i) => {
    if (!confirm("Apagar este flashcard?")) return;
    setMeus((l) => l.filter((_, j) => j !== i));
  };

  // ── vista de revisão ──
  if (revisao) {
    const total = revisao.cards.length;
    const carta = revisao.cards[Math.min(revisao.idx, total - 1)];
    const respondidas = revisao.scoreR + revisao.scoreW;
    const pct = respondidas > 0 ? Math.round((revisao.scoreR / respondidas) * 100) : 0;

    return (
      <div className="ca asma ob-page asma-flash">
        <button className="ob-voltar" onClick={sairRevisao}>‹ Voltar à lista</button>
        <h1 className="ob-titulo">{dados.titulo}</h1>

        {revisao.fim ? (
          <div className="ca-resultados">
            <div className="ca-res-pct">{pct}%</div>
            <div className="ca-res-label">{revisao.scoreR} de {respondidas} acertadas</div>
            <div className="ca-res-break">
              <div><strong className="ca-ok">{revisao.scoreR}</strong><span>Certas</span></div>
              <div><strong className="ca-err">{revisao.scoreW}</strong><span>Erradas</span></div>
            </div>
            <div className="ca-flash-nav"><button className="ca-btn" onClick={sairRevisao}>Voltar à lista</button></div>
          </div>
        ) : (
          <>
            <div className="ca-flash-prog">
              <span>{revisao.idx + 1} / {total}</span>
              <div className="ca-flash-track"><div className="ca-flash-fill" style={{ width: `${((revisao.idx + 1) / total) * 100}%` }} /></div>
            </div>

            <div className={"ca-flash-scene" + (virado ? " flipped" : "") + (flash ? " " + flash : "")} onClick={() => setVirado((v) => !v)}>
              <div className="ca-flash-inner">
                <div className="ca-flash-face ca-flash-front">
                  <div className="ca-flash-label">Pergunta</div>
                  {carta.tag && <div className="asma-flash-tag">{carta.tag}</div>}
                  <div className="ca-flash-q" dangerouslySetInnerHTML={{ __html: carta.q }} />
                  <div className="ca-flash-hint">Toca para ver a resposta</div>
                </div>
                <div className="ca-flash-face ca-flash-back">
                  <div className="ca-flash-label">Resposta</div>
                  <div className="ca-flash-a" dangerouslySetInnerHTML={{ __html: carta.a }} />
                  {carta.e && (
                    <button className="ca-flash-explica-btn" onClick={(ev) => { ev.stopPropagation(); setExplicaAberta((x) => !x); }}>
                      {explicaAberta ? "Ocultar explicação" : "Explicar resposta"}
                    </button>
                  )}
                  {explicaAberta && <div className="ca-flash-explica" onClick={(ev) => ev.stopPropagation()} dangerouslySetInnerHTML={{ __html: carta.e }} />}
                  <div className="asma-flash-stats">
                    <span className="asma-stat ok"><Ico name="check" s={13} />{revisao.scoreR}</span>
                    <span className="asma-stat err"><Ico name="close" s={13} />{revisao.scoreW}</span>
                    <span className="asma-stat pct">{pct}%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="asma-flash-controls">
              <button className="asma-ctrl" title="Anterior" onClick={() => ir(-1)}>‹</button>
              <button className="asma-ctrl errado" title="Errei" onClick={() => marcar("wrong")}><Ico name="close" s={16} /></button>
              <div className="asma-score-pill"><span className="err">{revisao.scoreW}</span><span className="ok">{revisao.scoreR}</span></div>
              <button className="asma-ctrl certo" title="Acertei" onClick={() => marcar("right")}><Ico name="check" s={16} /></button>
              <button className="asma-ctrl" title="Próximo" onClick={() => ir(1)}>›</button>
            </div>

            {toast && <div className={"asma-toast " + (toast.tipo === "right" ? "ok" : "err")}>{toast.texto}</div>}
          </>
        )}
      </div>
    );
  }

  // ── vista de lista ──
  return (
    <div className="ca asma ob-page asma-flash">
      <button className="ob-voltar" onClick={voltar}>‹ Menu Asma</button>
      <h1 className="ob-titulo">{dados.titulo}</h1>
      <p className="ca-hero-sub">{deck.subtitle}</p>

      <div className="ob-sub">
        {dados.decks.map((d) => (
          <button key={d.id} className={"ob-sub-btn" + (deckId === d.id ? " ativo" : "")} onClick={() => { setDeckId(d.id); setFormAberto(false); }}>{d.label}</button>
        ))}
      </div>
      <div className="ob-sub asma-flash-subsub">
        <button className={"ob-sub-btn" + (sub === "estudo" ? " ativo" : "")} onClick={() => setSub("estudo")}>Estudo</button>
        <button className={"ob-sub-btn" + (sub === "meus" ? " ativo" : "")} onClick={() => setSub("meus")}>Os meus{meusDoDeck.length ? ` (${meusDoDeck.length})` : ""}</button>
      </div>

      {sub === "meus" && (
        <>
          <div className="ca-cards-barra" style={{ justifyContent: "center" }}>
            <button className="ca-btn-out ca-novo-card" onClick={() => setFormAberto((f) => !f)}>{formAberto ? "Fechar" : "+ Novo flashcard"}</button>
          </div>
          {formAberto && (
            <div className="ca-flash-form">
              <div className="ca-form-lbl">Pergunta</div>
              <input className="campo ca-an-inp" value={q} onChange={(ev) => setQ(ev.target.value)} placeholder="Ex.: Critérios de BD positiva?" />
              <div className="ca-form-lbl">Resposta</div>
              <textarea className="campo ca-an-inp ca-form-area" value={a} onChange={(ev) => setA(ev.target.value)} placeholder="A resposta…" />
              <div className="ca-form-lbl">Explicação (opcional)</div>
              <textarea className="campo ca-an-inp ca-form-area" value={e} onChange={(ev) => setE(ev.target.value)} placeholder="Detalhe ou mnemónica…" />
              <div className="ca-flash-nav" style={{ marginTop: 10 }}>
                <button className="ca-btn" disabled={!q.trim() || !a.trim()} onClick={guardarMeu}>Guardar flashcard</button>
              </div>
            </div>
          )}
        </>
      )}

      {cartas.length === 0 ? (
        !formAberto && <div className="ob-faq-vazio">Ainda não criaste flashcards de {deck.label}. Usa o botão acima para começar.</div>
      ) : (
        <>
          <button className="ca-btn asma-start-btn" onClick={() => entrarRevisao(baralhar(cartas), 0, "random")}>
            Iniciar revisão aleatória ({cartas.length} {cartas.length === 1 ? "card" : "cards"})
          </button>
          <div className="asma-fc-lista">
            {cartas.map((c, i) => (
              <div key={i} className="asma-fc-item" onClick={() => entrarRevisao(cartas, i, "single")}>
                <span className="asma-fc-num">{i + 1}</span>
                <span className="asma-fc-texto">{c.q}</span>
                {sub === "meus"
                  ? <button className="asma-fc-del" title="Apagar" onClick={(ev) => { ev.stopPropagation(); apagarMeu(c._i); }}>×</button>
                  : <span className="asma-fc-seta">›</span>}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
