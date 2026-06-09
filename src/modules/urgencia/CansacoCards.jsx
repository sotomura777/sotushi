import { useState, useMemo } from "react";
import dados from "@conteudo/urgencia/cansaco.json";
import { Ico } from "@/components/icones";
import { useEstadoLocal } from "@/lib/persistencia";

function CardRapido({ card, cor, fav, onFav }) {
  const [virado, setVirado] = useState(false);
  return (
    <div className={"ob-drug-wrap" + (virado ? " flipped" : "")} onDoubleClick={() => setVirado((v) => !v)}>
      <button className={"ob-pc-star" + (fav ? " saved" : "")} title="Favorito" onClick={(e) => { e.stopPropagation(); onFav(); }}>
        <Ico name={fav ? "starFill" : "star"} s={16} />
      </button>
      <div className="ob-drug-inner">
        <div className="ob-drug-front" style={{ borderTopColor: cor }}>
          <span className="ca-card-cat" style={{ color: cor, background: `color-mix(in srgb, ${cor} 12%, transparent)` }}>
            {dados.cards.cats[card.cat]?.label || card.cat}
          </span>
          <div className="ob-drug-nome">{card.title}</div>
          <div className="ob-drug-comercial">{card.sub}</div>
          {card.sections.map((s, i) => (
            <div key={i} className="ca-card-sec">
              <div className="ca-card-sec-key">{s.key}</div>
              <ul>{s.rows.map((r, j) => <li key={j} dangerouslySetInnerHTML={{ __html: r }} />)}</ul>
            </div>
          ))}
          <div className="ob-pc-hint">↻ ×2</div>
        </div>
        <div className="ob-drug-back">
          <div className="ob-pc-back-label">{card.backTitle}</div>
          <div className="ob-pc-back-texto" dangerouslySetInnerHTML={{ __html: card.backHtml }} />
        </div>
      </div>
    </div>
  );
}

function Flashcards() {
  const exemplos = dados.flashcards.exemplos;
  const [idx, setIdx] = useState(0);
  const [virado, setVirado] = useState(false);
  const [explica, setExplica] = useState(false);
  const card = exemplos[idx];

  const ir = (d) => {
    setIdx((i) => (i + d + exemplos.length) % exemplos.length);
    setVirado(false); setExplica(false);
  };

  return (
    <div className="ca-flash">
      <div className="ca-flash-prog">
        <span>{idx + 1} / {exemplos.length}</span>
        <div className="ca-flash-track"><div className="ca-flash-fill" style={{ width: `${((idx + 1) / exemplos.length) * 100}%` }} /></div>
      </div>
      <div className={"ca-flash-scene" + (virado ? " flipped" : "")} onClick={() => setVirado((v) => !v)}>
        <div className="ca-flash-inner">
          <div className="ca-flash-face ca-flash-front">
            <div className="ca-flash-label">Pergunta</div>
            <div className="ca-flash-q">{card.q}</div>
            <div className="ca-flash-hint">Toca para ver a resposta</div>
          </div>
          <div className="ca-flash-face ca-flash-back">
            <div className="ca-flash-label">Resposta</div>
            <div className="ca-flash-a">{card.a}</div>
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
        <button className="ca-btn-out" onClick={() => ir(1)}>Próximo ›</button>
      </div>
    </div>
  );
}

export default function CansacoCards({ accent = "#e85d4a", voltar }) {
  const [aba, setAba] = useState(0);
  const [filtro, setFiltro] = useState("todas");
  const [favs, setFavs] = useEstadoLocal("medguia:cansaco:cards:favs", []);

  const catKeys = Object.keys(dados.cards.cats);
  const cards = useMemo(() => {
    let lista = dados.cards.defaults;
    if (filtro === "favoritos") lista = lista.filter((c) => favs.includes(c.title));
    else if (filtro !== "todas") lista = lista.filter((c) => c.cat === filtro);
    return lista;
  }, [filtro, favs]);

  const toggleFav = (title) => setFavs((f) => (f.includes(title) ? f.filter((x) => x !== title) : [...f, title]));

  return (
    <div className="ca ob-page" style={{ "--acento": accent }}>
      <button className="ob-voltar" onClick={voltar}>‹ Menu Cansaço</button>
      <h1 className="ob-titulo">{aba === 0 ? dados.cards.titulo : dados.flashcards.titulo}</h1>
      <p className="ca-hero-sub">{aba === 0 ? dados.cards.sub : dados.flashcards.eyebrow}</p>

      <div className="ob-sub">
        <button className={"ob-sub-btn" + (aba === 0 ? " ativo" : "")} onClick={() => setAba(0)}>Cards rápidos</button>
        <button className={"ob-sub-btn" + (aba === 1 ? " ativo" : "")} onClick={() => setAba(1)}>Flashcards</button>
      </div>

      {aba === 0 && (
        <>
          <div className="filtros" style={{ marginBottom: 14 }}>
            <button className={"filtro" + (filtro === "todas" ? " filtro--ativo" : "")} style={filtro === "todas" ? { background: "var(--acento)" } : undefined} onClick={() => setFiltro("todas")}>Todas</button>
            <button className={"filtro" + (filtro === "favoritos" ? " filtro--ativo" : "")} style={filtro === "favoritos" ? { background: "#d97706", borderColor: "#d97706", color: "#fff" } : undefined} onClick={() => setFiltro("favoritos")}>Favoritos</button>
            {catKeys.map((k) => (
              <button key={k} className={"filtro" + (filtro === k ? " filtro--ativo" : "")} style={filtro === k ? { background: dados.cards.cats[k].color, borderColor: dados.cards.cats[k].color, color: "#fff" } : undefined} onClick={() => setFiltro(k)}>{dados.cards.cats[k].label}</button>
            ))}
          </div>
          {cards.length === 0 && <div className="ob-faq-vazio">Sem cards neste filtro.</div>}
          <div className="ob-drug-grid">
            {cards.map((c) => (
              <CardRapido key={c.title} card={c} cor={dados.cards.cats[c.cat]?.color || "var(--acento)"} fav={favs.includes(c.title)} onFav={() => toggleFav(c.title)} />
            ))}
          </div>
        </>
      )}

      {aba === 1 && <Flashcards />}
    </div>
  );
}
