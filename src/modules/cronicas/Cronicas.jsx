import { useState, useMemo } from "react";
import meta from "@conteudo/cronicas/meta.json";
import DOENCAS from "@conteudo/cronicas/doencas.json";
import { filtrarAgrupar, pesquisar } from "./logica";
import { I, Ico } from "@/components/icones";
import { useEstadoLocal } from "@/lib/persistencia";
import DeficeFerro from "./defice-ferro/DeficeFerro.jsx";
import "./estilo.css";

// Mapa de componentes por doença (chave = id da doença em doencas.json).
const COMPONENTES = {
  "defice-ferro": DeficeFerro,
};

export default function Cronicas({ accent = "#0b6e7f", gradiente, onVoltar }) {
  const [query, setQuery] = useState("");
  const [sistema, setSistema] = useState("all");
  const [foco, setFoco] = useState(false);
  const [favoritos, setFavoritos] = useEstadoLocal("medguia:cronicas:favoritos", []);
  const [aberta, setAberta] = useState(null);

  const corSis = (id) => (meta.sistemas.find((s) => s.id === id) || {}).cor || "var(--suave)";
  const labelSis = (id) => (meta.sistemas.find((s) => s.id === id) || {}).label || "";
  const toggleFav = (id) => setFavoritos((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]));
  const abrir = (d) => { if (d.disponivel) setAberta(d); };

  const { total, grupos } = useMemo(() => filtrarAgrupar(DOENCAS, meta.sistemas, { sistema }), [sistema]);
  const resultados = useMemo(() => pesquisar(DOENCAS, meta.sistemas, query), [query]);
  const favDoencas = favoritos.map((id) => DOENCAS.find((d) => d.id === id)).filter(Boolean);

  const hero = (
    <header className="hero" style={{ background: gradiente || accent }}>
      <div className="hero-conteudo">
        {onVoltar && <button className="voltar" onClick={onVoltar}>← Início</button>}
        <div className="secao-label" style={{ color: "var(--acento)", marginBottom: 2 }}>{meta.eyebrow}</div>
        <div className="hero-titulo">{meta.nome}</div>
        <div className="hero-subtitulo">{meta.tag}</div>
        <div className="dc-search-wrap">
          <div className="dc-search">
            <Ico name="search" s={18} c="var(--suave)" />
            <input
              placeholder="Pesquisar doença (ex: diabetes, HTA, asma...)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setFoco(true)}
              onBlur={() => setTimeout(() => setFoco(false), 180)}
            />
          </div>
          {foco && query.trim() && (
            <div className="dc-dropdown">
              {resultados.length === 0 ? (
                <div className="dc-sd-vazio">Nenhuma doença encontrada</div>
              ) : (
                resultados.map((d) => (
                  <div key={d.id} className={"dc-sd-item" + (d.disponivel ? "" : " off")} onMouseDown={() => abrir(d)}>
                    <span className="dc-dot" style={{ background: corSis(d.sistema) }} />
                    <div className="dc-info">
                      <div className="dc-nome">{d.nome}</div>
                      <div className="dc-sys" style={{ color: corSis(d.sistema) }}>{labelSis(d.sistema)}</div>
                    </div>
                    <span className={"dc-badge " + (d.disponivel ? "ready" : "soon")}>{d.disponivel ? "Disponível" : "Em breve"}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );

  const cartao = (d) => {
    const cor = corSis(d.sistema);
    const fav = favoritos.includes(d.id);
    return (
      <div key={d.id} className={"dc-card" + (d.disponivel ? "" : " dc-card--off")} onClick={() => abrir(d)} style={{ cursor: d.disponivel ? "pointer" : "default" }}>
        <span className="dc-dot" style={{ background: cor }} />
        <div className="dc-info">
          <div className="dc-nome">{d.nome}</div>
          <div className="dc-sys" style={{ color: cor }}>{labelSis(d.sistema)}</div>
        </div>
        <span className={"dc-badge " + (d.disponivel ? "ready" : "soon")}>{d.disponivel ? "Disponível" : "Em breve"}</span>
        <button className={"dc-star" + (fav ? " faved" : "")} onClick={(e) => { e.stopPropagation(); toggleFav(d.id); }}>
          {fav ? I.starFill("currentColor", 16) : I.star("currentColor", 16)}
        </button>
        {d.disponivel && <span className="dc-arrow">›</span>}
      </div>
    );
  };

  // ── Vista de detalhe (quando uma doença disponível é aberta) ──────────────
  if (aberta) {
    const Comp = COMPONENTES[aberta.id];
    return (
      <div style={{ "--acento": accent }}>
        {hero}
        <div className="modulo-corpo">
          <button className="voltar" style={{ marginBottom: 14 }} onClick={() => setAberta(null)}>← Patologias</button>
          {Comp ? <Comp accent={accent} /> : (
            <div className="dc-vazio">
              <div className="dc-vazio-titulo">{aberta.nome}</div>
              <div className="dc-vazio-sub">Guia em construção.</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ "--acento": accent }}>
      {hero}
      <div className="modulo-corpo">
        {favDoencas.length > 0 && (
          <div className="dc-fav-sec">
            <div className="dc-fav-label"><Ico name="starFill" s={13} style={{ marginRight: 5 }} />Favoritos</div>
            <div className="dc-grid">{favDoencas.map(cartao)}</div>
          </div>
        )}

        <div className="filtros">
          <button className={"filtro" + (sistema === "all" ? " filtro--ativo" : "")} style={sistema === "all" ? { background: accent } : undefined} onClick={() => setSistema("all")}>Todos</button>
          {meta.sistemas.map((s) => (
            <button key={s.id} className={"filtro" + (sistema === s.id ? " filtro--ativo" : "")} style={sistema === s.id ? { background: s.cor, borderColor: s.cor, color: "#fff" } : undefined} onClick={() => setSistema(s.id)}>
              <span className="dc-dot" style={{ background: s.cor, marginRight: 6 }} />{s.label}
            </button>
          ))}
        </div>

        <div className="dc-header-row">
          <span className="secao-label" style={{ margin: 0 }}>Patologias</span>
          <span className="dc-count">{total} {total !== 1 ? "patologias" : "patologia"}</span>
        </div>

        {grupos.map(([letra, lista]) => (
          <div key={letra} style={{ marginBottom: 6 }}>
            <div className="dc-letra">{letra}</div>
            <div className="dc-grid">{lista.map(cartao)}</div>
          </div>
        ))}

        <div className="rodape" style={{ marginTop: 28 }}>
          <strong>{meta.disclaimerTitulo}</strong><br />{meta.disclaimerTexto}
        </div>
      </div>
    </div>
  );
}
