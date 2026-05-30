import { useState, useMemo } from "react";
import meta from "@conteudo/analises/meta.json";
import parametros from "@conteudo/analises/parametros.json";
import { getIntervalo, getEstado, interpretacao, ESTADO_INFO, getCorCat } from "./logica";
import Gsa from "./Gsa.jsx";
import { I, Ico } from "@/components/icones";
import "./estilo.css";

export default function Analises({ accent = "#8b5cf6", gradiente, onVoltar }) {
  const [modo, setModo] = useState("analises");
  const [sexo, setSexo] = useState("M");
  const [pesquisa, setPesquisa] = useState("");
  const [categoria, setCategoria] = useState("Todos");
  const [soFav, setSoFav] = useState(false);
  const [valores, setValores] = useState({});
  const [favoritos, setFavoritos] = useState([]);

  const setValor = (id, v) => setValores((prev) => ({ ...prev, [id]: v }));
  const toggleFav = (id) =>
    setFavoritos((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]));

  const nomeCat = useMemo(() => {
    const m = {};
    meta.categorias.forEach((c) => (m[c.id] = c.nm));
    return m;
  }, []);

  const filtrados = useMemo(() => {
    let r = parametros;
    if (categoria !== "Todos") r = r.filter((p) => p.cat === categoria);
    if (soFav) r = r.filter((p) => favoritos.includes(p.id));
    if (pesquisa) {
      const s = pesquisa.toLowerCase();
      r = r.filter(
        (p) =>
          p.nm.toLowerCase().includes(s) ||
          (p.ab || "").toLowerCase().includes(s) ||
          (p.tm || "").toLowerCase().includes(s)
      );
    }
    return r;
  }, [categoria, soFav, pesquisa, favoritos]);

  const grupos = useMemo(() => {
    const g = {};
    filtrados.forEach((p) => {
      if (!g[p.cat]) g[p.cat] = [];
      g[p.cat].push(p);
    });
    return Object.entries(g);
  }, [filtrados]);

  return (
    <div style={{ "--acento": accent }}>
      <header className="hero" style={{ background: gradiente || accent }}>
        <div className="hero-conteudo">
          {onVoltar && (
            <button className="voltar" onClick={onVoltar}>
              ← Início
            </button>
          )}
          <div className="hero-titulo">{meta.nome}</div>
          <div className="hero-subtitulo">{meta.subtitulo}</div>
        </div>
      </header>

      <div className="modulo-corpo">
        <div className="an-modo">
          <button className={modo === "analises" ? "on" : ""} onClick={() => setModo("analises")}>Análises</button>
          <button className={modo === "gsa" ? "on" : ""} onClick={() => setModo("gsa")}>GSA (gasimetria)</button>
        </div>

        {modo === "gsa" ? (
          <Gsa />
        ) : (
        <>
        <div className="an-controlo">
          <div className="an-sexo">
            <button className={sexo === "M" ? "on" : ""} onClick={() => setSexo("M")}>
              <Ico name="male" s={14} style={{ marginRight: 5 }} />Masculino
            </button>
            <button className={sexo === "F" ? "on" : ""} onClick={() => setSexo("F")}>
              <Ico name="female" s={14} style={{ marginRight: 5 }} />Feminino
            </button>
          </div>
          <input
            className="campo"
            style={{ flex: 1, minWidth: 160 }}
            placeholder="Pesquisar análise…"
            value={pesquisa}
            onChange={(e) => setPesquisa(e.target.value)}
          />
        </div>

        <div className="filtros">
          {["Todos", ...meta.categorias.map((c) => c.id)].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoria(cat)}
              className={"filtro" + (categoria === cat ? " filtro--ativo" : "")}
              style={categoria === cat ? { background: cat === "Todos" ? accent : getCorCat(cat) } : undefined}
            >
              {cat === "Todos" ? "Todos" : nomeCat[cat]}
            </button>
          ))}
          <button
            onClick={() => setSoFav((v) => !v)}
            className="filtro"
            style={soFav ? { background: "#e8a87c", color: "#fff", borderColor: "#e8a87c" } : undefined}
          >
            <Ico name="star" s={13} style={{ marginRight: 4 }} />Favoritos
          </button>
        </div>

        <div style={{ fontSize: 12, color: "var(--tenue)", margin: "4px 0 12px", fontWeight: 500 }}>
          {filtrados.length} análise{filtrados.length !== 1 ? "s" : ""}
        </div>

        {grupos.map(([catId, lista]) => (
          <div key={catId} style={{ marginBottom: 16 }}>
            <div className="secao-label" style={{ color: getCorCat(catId) }}>
              {nomeCat[catId] || catId}
            </div>
            <div className="lista">
              {lista.map((p) => {
                const intervalo = getIntervalo(p, sexo);
                const valor = valores[p.id] ?? "";
                const estado = getEstado(p, valor, sexo);
                const ei = estado ? ESTADO_INFO[estado] : null;
                const texto = estado ? interpretacao(p, estado) : null;
                return (
                  <div key={p.id} className="an-param">
                    <div className="an-param-topo">
                      <button
                        className={"an-estrela" + (favoritos.includes(p.id) ? " on" : "")}
                        onClick={() => toggleFav(p.id)}
                        aria-label="Favorito"
                      >
                        {favoritos.includes(p.id) ? I.starFill("currentColor", 16) : I.star("currentColor", 16)}
                      </button>
                      <div className="an-param-info">
                        <div className="an-param-nome">
                          {p.nm}
                          {p.ab && p.ab !== p.nm && <span style={{ color: "var(--tenue)", fontWeight: 500 }}>· {p.ab}</span>}
                        </div>
                        <div className="an-param-ref">
                          Ref: {intervalo.min}–{intervalo.max} {p.un}
                        </div>
                      </div>
                      <input
                        type="number"
                        className="campo an-param-input"
                        placeholder="valor"
                        value={valor}
                        onChange={(e) => setValor(p.id, e.target.value)}
                        style={ei ? { color: ei.texto, borderColor: ei.borda } : undefined}
                      />
                      {ei && (
                        <span className="badge" style={{ background: ei.fundo, color: ei.texto, border: `1px solid ${ei.borda}` }}>
                          {ei.etiqueta}
                        </span>
                      )}
                    </div>

                    {ei && texto && (
                      <div className="an-interp" style={{ background: ei.fundo, borderColor: ei.borda, color: ei.texto }}>
                        {texto}
                      </div>
                    )}

                    {ei && p.tk && p.tk.length > 0 && (
                      <div className="an-tk">
                        <span className="an-tk-label">A pedir:</span>
                        {p.tk.map((t, i) => (
                          <span key={i} className="an-tk-chip">{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {filtrados.length === 0 && (
          <div style={{ textAlign: "center", padding: 40, color: "var(--tenue)" }}>Nenhuma análise encontrada.</div>
        )}

        <div className="rodape">
          <strong>Nota:</strong> {meta.rodape}
        </div>
        </>
        )}
      </div>
    </div>
  );
}
