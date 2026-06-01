import { useState, useRef } from "react";
import meta from "@conteudo/analises/meta.json";
import flashcards from "@conteudo/analises/flashcards.json";
import { getCorCat } from "./logica";
import { I, Ico } from "@/components/icones";
import { useEstadoLocal } from "@/lib/persistencia";
import { toast, useEscape } from "@/lib/toast";

const NOME_CAT = {};
meta.categorias.forEach((c) => (NOME_CAT[c.id] = c.nm));
const DEFAULTS = flashcards.map((c, i) => ({ ...c, id: "fc" + i }));
const uid = () => "c" + Math.random().toString(36).slice(2, 9);
const vazio = () => ({ cat: meta.categorias[0].id, front: "", desc: "", back_title: "Notas", back: "" });

export default function Cards({ accent }) {
  const [cards, setCards] = useEstadoLocal("medguia:analises:cards", DEFAULTS);
  const [soFav, setSoFav] = useState(false);
  const [cat, setCat] = useState("all");
  const [flipped, setFlipped] = useState({});
  const [edit, setEdit] = useState(null); // { id?, cat, front, desc, back_title, back }
  useEscape(edit ? () => setEdit(null) : null);

  const usadas = [...new Set(cards.map((c) => c.cat))];
  const filtrados = cards.filter((c) => (!soFav || c.fav) && (cat === "all" || c.cat === cat));

  const flip = (id) => setFlipped((f) => ({ ...f, [id]: !f[id] }));
  // Duplo toque (rato ou touch): só vira com dois toques rápidos (<350ms).
  const ultimoToque = useRef({});
  const tocar = (id) => {
    const agora = Date.now();
    if (agora - (ultimoToque.current[id] || 0) < 350) { flip(id); ultimoToque.current[id] = 0; }
    else ultimoToque.current[id] = agora;
  };
  const togFav = (id) => {
    const c = cards.find((x) => x.id === id);
    setCards((cs) => cs.map((x) => (x.id === id ? { ...x, fav: !x.fav } : x)));
    toast(c && c.fav ? "Removido dos favoritos" : "Adicionado aos favoritos ★");
  };
  const apagar = (id) => { setCards((cs) => cs.filter((c) => c.id !== id)); toast("Card apagado"); };
  const guardar = () => {
    if (!edit.front.trim()) return;
    if (edit.id) setCards((cs) => cs.map((c) => (c.id === edit.id ? { ...c, ...edit } : c)));
    else setCards((cs) => [{ ...edit, id: uid(), fav: false }, ...cs]);
    setEdit(null);
    toast("Card guardado");
  };

  return (
    <div>
      <div className="filtros" style={{ marginBottom: 8 }}>
        <button className="filtro filtro--ativo" style={{ background: accent }} onClick={() => setEdit(vazio())}>
          <Ico name="plus" s={12} style={{ marginRight: 3 }} />Novo card
        </button>
        <button className="filtro" style={soFav ? { background: "#e8a87c", color: "#fff", borderColor: "#e8a87c" } : undefined} onClick={() => setSoFav((v) => !v)}>
          <Ico name="star" s={12} style={{ marginRight: 3 }} />Favoritos
        </button>
        <button className={"filtro" + (cat === "all" ? " filtro--ativo" : "")} style={cat === "all" ? { background: accent } : undefined} onClick={() => setCat("all")}>Todos</button>
        {meta.categorias.filter((c) => usadas.includes(c.id)).map((c) => (
          <button key={c.id} className={"filtro" + (cat === c.id ? " filtro--ativo" : "")} style={cat === c.id ? { background: getCorCat(c.id) } : undefined} onClick={() => setCat(c.id)}>
            {c.nm}
          </button>
        ))}
      </div>

      {filtrados.length === 0 && <div style={{ textAlign: "center", padding: 36, color: "var(--tenue)" }}>Sem cards. Cria um com “Novo card”.</div>}

      <div className="an-cards-grid">
        {filtrados.map((c) => (
          <div key={c.id} className="an-card3d" onClick={() => tocar(c.id)}>
            <div className={"an-card3d-in" + (flipped[c.id] ? " flip" : "")}>
              <div className="an-card3d-face">
                <div className="an-card3d-head">
                  <span className="an-card3d-cat"><span className="an-pick-dot" style={{ background: getCorCat(c.cat) }} />{NOME_CAT[c.cat]}</span>
                  <span className="an-card3d-acts" onClick={(e) => e.stopPropagation()}>
                    <button className={"an-estrela" + (c.fav ? " on" : "")} onClick={() => togFav(c.id)} aria-label="Favorito">{c.fav ? I.starFill("currentColor", 14) : I.star("currentColor", 14)}</button>
                    <button className="an-card3d-act" onClick={() => setEdit({ ...c })} aria-label="Editar">{I.clipboard("currentColor", 13)}</button>
                    <button className="an-card3d-act" onClick={() => apagar(c.id)} aria-label="Apagar">{I.close("currentColor", 14)}</button>
                  </span>
                </div>
                <div className="an-card3d-titulo">{c.front}</div>
                <div className="an-card3d-desc">{c.desc}</div>
                <div className="an-card3d-foot">↻ duplo toque p/ virar</div>
              </div>
              <div className="an-card3d-face back">
                <div className="an-card3d-bt">{c.back_title}</div>
                <div className="an-card3d-desc">{c.back}</div>
                <div className="an-card3d-foot">↻ duplo toque p/ virar</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {edit && (
        <div className="an-modal" onClick={() => setEdit(null)}>
          <div className="an-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="an-modal-head">
              <div className="an-modal-nome" style={{ fontSize: 16 }}>{edit.id ? "Editar card" : "Novo card"}</div>
              <button className="an-modal-x" onClick={() => setEdit(null)}>{I.close("currentColor", 18)}</button>
            </div>
            <div className="an-modal-body">
              <div className="secao-label">Categoria</div>
              <select className="campo" style={{ marginBottom: 10 }} value={edit.cat} onChange={(e) => setEdit({ ...edit, cat: e.target.value })}>
                {meta.categorias.map((c) => <option key={c.id} value={c.id}>{c.nm}</option>)}
              </select>
              <div className="secao-label">Frente — título</div>
              <input className="campo" style={{ marginBottom: 10 }} value={edit.front} onChange={(e) => setEdit({ ...edit, front: e.target.value })} placeholder="Ex.: Anemia — como classificar" />
              <div className="secao-label">Frente — descrição</div>
              <textarea className="an-resumo-txt" style={{ marginBottom: 10, minHeight: 70 }} value={edit.desc} onChange={(e) => setEdit({ ...edit, desc: e.target.value })} />
              <div className="secao-label">Verso — título</div>
              <input className="campo" style={{ marginBottom: 10 }} value={edit.back_title} onChange={(e) => setEdit({ ...edit, back_title: e.target.value })} />
              <div className="secao-label">Verso — conteúdo</div>
              <textarea className="an-resumo-txt" style={{ minHeight: 70 }} value={edit.back} onChange={(e) => setEdit({ ...edit, back: e.target.value })} />
            </div>
            <div className="an-modal-foot"><button className="an-btn-pri" style={{ background: accent, width: "100%" }} disabled={!edit.front.trim()} onClick={guardar}>Guardar card</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
