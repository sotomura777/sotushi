import { useState, useMemo } from "react";
import meta from "@conteudo/analises/meta.json";
import parametros from "@conteudo/analises/parametros.json";
import padroes from "@conteudo/analises/padroes.json";
import paramInfo from "@conteudo/analises/param_info.json";
import {
  getCorCat, ESTADO_INFO,
  construirMapaStatus, detetarAlterados, detetarPadroes, construirQueryPesquisa,
} from "./logica";
import ModalParametro from "./ModalParametro.jsx";
import AnalisesCompletas from "./AnalisesCompletas.jsx";
import Historico from "./Historico.jsx";
import Gsa from "./Gsa.jsx";
import { I, Ico } from "@/components/icones";
import { useEstadoLocal } from "@/lib/persistencia";
import "./estilo.css";

export default function Analises({ accent = "#8b5cf6", gradiente, onVoltar }) {
  const [modo, setModo] = useState("analises");
  const [sexo, setSexo] = useState("M");
  const [pesquisa, setPesquisa] = useState("");
  const [categoria, setCategoria] = useState("Todos");
  const [soFav, setSoFav] = useState(false);
  const [favoritos, setFavoritos] = useEstadoLocal("medguia:analises:favoritos", []);
  const [uRefs, setURefs] = useEstadoLocal("medguia:analises:urefs", {});
  const [historico, setHistorico] = useEstadoLocal("medguia:analises:historico", []);
  const [slots, setSlots] = useState({}); // { id: {val, status, force} } — sessão

  const MAX_ENTRADAS = 8;
  const novaEntradaHistorico = (params, vals, resumo) => {
    const d = new Date(), z = (n) => String(n).padStart(2, "0");
    const date = `${z(d.getDate())}/${z(d.getMonth() + 1)}/${d.getFullYear()} ${z(d.getHours())}:${z(d.getMinutes())}`;
    const set = { date, params: [...params], vals: JSON.parse(JSON.stringify(vals)), resumo };
    setHistorico((h) => { const n = [...h, { date, sets: [set] }]; return n.length > MAX_ENTRADAS ? n.slice(n.length - MAX_ENTRADAS) : n; });
  };
  const [modalId, setModalId] = useState(null);
  const [verPad, setVerPad] = useState(false);

  const toggleFav = (id) =>
    setFavoritos((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]));
  const guardarSlot = (id, slot) => setSlots((s) => ({ ...s, [id]: slot }));
  const removerSlot = (id) => setSlots((s) => { const n = { ...s }; delete n[id]; return n; });
  const limparSlots = () => { setSlots({}); setVerPad(false); };
  const guardarRef = (id, ref) => setURefs((u) => ({ ...u, [id]: ref }));
  const reporRef = (id) => setURefs((u) => { const n = { ...u }; delete n[id]; return n; });

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
      r = r.filter((p) =>
        p.nm.toLowerCase().includes(s) ||
        (p.ab || "").toLowerCase().includes(s) ||
        (p.tm || "").toLowerCase().includes(s));
    }
    return r;
  }, [categoria, soFav, pesquisa, favoritos]);

  const grupos = useMemo(() => {
    const g = {};
    filtrados.forEach((p) => { (g[p.cat] = g[p.cat] || []).push(p); });
    return Object.entries(g);
  }, [filtrados]);

  const slotIds = Object.keys(slots);
  const mapa = useMemo(() => construirMapaStatus(slots), [slots]);
  const alterados = useMemo(() => detetarAlterados(slotIds, slots, parametros), [slots]); // eslint-disable-line
  const padroesEncontrados = useMemo(() => detetarPadroes(slotIds, mapa, padroes), [slots, mapa]); // eslint-disable-line

  const paramModal = modalId ? parametros.find((p) => p.id === modalId) : null;

  return (
    <div style={{ "--acento": accent }}>
      <header className="hero" style={{ background: gradiente || accent }}>
        <div className="hero-conteudo">
          {onVoltar && <button className="voltar" onClick={onVoltar}>← Início</button>}
          <div className="hero-titulo">{meta.nome}</div>
          <div className="hero-subtitulo">{meta.subtitulo}</div>
        </div>
      </header>

      <div className="modulo-corpo">
        <div className="an-modo">
          <button className={modo === "analises" ? "on" : ""} onClick={() => setModo("analises")}>Parâmetros</button>
          <button className={modo === "completas" ? "on" : ""} onClick={() => setModo("completas")}>Completas</button>
          <button className={modo === "historico" ? "on" : ""} onClick={() => setModo("historico")}>Histórico</button>
          <button className={modo === "gsa" ? "on" : ""} onClick={() => setModo("gsa")}>GSA</button>
        </div>

        {modo === "completas" ? (
          <AnalisesCompletas sexo={sexo} setSexo={setSexo} uRefs={uRefs} accent={accent} onGuardarHistorico={novaEntradaHistorico} />
        ) : modo === "historico" ? (
          <Historico historico={historico} setHistorico={setHistorico} sexo={sexo} setSexo={setSexo} uRefs={uRefs} accent={accent} />
        ) : modo === "gsa" ? (
          <Gsa />
        ) : (
          <>
            <input
              className="campo" style={{ marginBottom: 10 }}
              placeholder="Pesquisar parâmetro…" value={pesquisa}
              onChange={(e) => setPesquisa(e.target.value)}
            />

            <div className="filtros">
              {["Todos", ...meta.categorias.map((c) => c.id)].map((cat) => (
                <button
                  key={cat} onClick={() => setCategoria(cat)}
                  className={"filtro" + (categoria === cat ? " filtro--ativo" : "")}
                  style={categoria === cat ? { background: cat === "Todos" ? accent : getCorCat(cat) } : undefined}
                >
                  {cat === "Todos" ? "Todos" : nomeCat[cat]}
                </button>
              ))}
              <button
                onClick={() => setSoFav((v) => !v)} className="filtro"
                style={soFav ? { background: "#e8a87c", color: "#fff", borderColor: "#e8a87c" } : undefined}
              >
                <Ico name="star" s={13} style={{ marginRight: 4 }} />Favoritos
              </button>
            </div>

            {/* Slots guardados + ver padrões */}
            {slotIds.length > 0 && (
              <div className="an-slots">
                <div className="an-slots-chips">
                  {slotIds.map((id) => {
                    const p = parametros.find((x) => x.id === id);
                    const st = slots[id].status;
                    const ei = ESTADO_INFO[st];
                    const seta = st === "high" ? "↑" : st === "low" ? "↓" : "";
                    return (
                      <span key={id} className="an-slot" style={ei ? { borderColor: ei.borda, color: ei.texto, background: ei.fundo } : undefined}>
                        <button className="an-slot-open" onClick={() => setModalId(id)}>{p?.ab} {slots[id].val}{seta}</button>
                        <button className="an-slot-x" onClick={() => removerSlot(id)} aria-label="Remover">{I.close("currentColor", 11)}</button>
                      </span>
                    );
                  })}
                </div>
                <div className="an-slots-acoes">
                  <button className="an-btn-pri" style={{ background: accent }} disabled={slotIds.length < 2} onClick={() => setVerPad((v) => !v)}>
                    {verPad ? "Ocultar padrões" : "Ver padrões"}
                  </button>
                  <button className="an-btn" onClick={limparSlots}>Limpar</button>
                </div>
              </div>
            )}

            {verPad && (
              <div className="an-pad">
                {alterados.length === 0 && padroesEncontrados.length === 0 && (
                  <div style={{ fontSize: 13, color: "var(--tenue)" }}>Sem padrões cruzados conhecidos para esta combinação.</div>
                )}
                {alterados.length > 0 && (
                  <>
                    <div className="an-pad-titulo">Valores alterados</div>
                    {alterados.map((a) => (
                      <div key={a.id} className="an-pad-card alt">
                        <div className="an-pad-card-nm">{a.etiqueta}</div>
                        <div className="an-pad-card-txt">{a.txt}</div>
                      </div>
                    ))}
                  </>
                )}
                {padroesEncontrados.length > 0 && (
                  <>
                    <div className="an-pad-titulo" style={{ color: accent, marginTop: alterados.length ? 12 : 0 }}>Padrões reconhecidos</div>
                    {padroesEncontrados.map((pad) => {
                      const url = construirQueryPesquisa(pad.nm, slotIds, slots, parametros, sexo, uRefs);
                      return (
                        <div key={pad.id} className="an-pad-card">
                          <div className="an-pad-card-top">
                            <div className="an-pad-card-nm">{pad.nm}</div>
                            <a className="an-pesquisar" href={url} target="_blank" rel="noopener">{I.search("currentColor", 12)} Pesquisar</a>
                          </div>
                          <div className="an-pad-card-txt">{pad.txt}</div>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            )}

            <div style={{ fontSize: 12, color: "var(--tenue)", margin: "10px 0 10px", fontWeight: 500 }}>
              {filtrados.length} parâmetro{filtrados.length !== 1 ? "s" : ""}{slotIds.length ? ` · ${slotIds.length} no quadro` : ""}
            </div>

            {grupos.map(([catId, lista]) => (
              <div key={catId} style={{ marginBottom: 16 }}>
                <div className="secao-label" style={{ color: getCorCat(catId) }}>{nomeCat[catId] || catId}</div>
                <div className="an-grid">
                  {lista.map((p) => {
                    const slot = slots[p.id];
                    const ei = slot ? ESTADO_INFO[slot.status] : null;
                    return (
                      <button key={p.id} className={"an-card" + (slot ? " on" : "")} onClick={() => setModalId(p.id)}
                        style={ei ? { borderColor: ei.borda } : undefined}>
                        <button
                          className={"an-estrela" + (favoritos.includes(p.id) ? " on" : "")}
                          onClick={(e) => { e.stopPropagation(); toggleFav(p.id); }}
                          aria-label="Favorito"
                        >
                          {favoritos.includes(p.id) ? I.starFill("currentColor", 14) : I.star("currentColor", 14)}
                        </button>
                        <div className="an-card-ab">{p.ab}</div>
                        <div className="an-card-nm">{p.nm}</div>
                        <div className="an-card-un">{p.un}</div>
                        {slot && (
                          <div className="an-card-val" style={ei ? { color: ei.texto } : undefined}>
                            {slot.val} {slot.status === "high" ? "↑" : slot.status === "low" ? "↓" : "·"}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {filtrados.length === 0 && (
              <div style={{ textAlign: "center", padding: 40, color: "var(--tenue)" }}>Nenhum parâmetro encontrado.</div>
            )}

            <div className="rodape"><strong>Nota:</strong> {meta.rodape}</div>
          </>
        )}
      </div>

      {paramModal && (
        <ModalParametro
          param={paramModal}
          subtitulo={nomeCat[paramModal.cat]}
          sexo={sexo} setSexo={setSexo}
          uRefs={uRefs}
          infoTexto={paramInfo[paramModal.id]}
          slotAtual={slots[paramModal.id]}
          onSaveRef={guardarRef} onResetRef={reporRef}
          onGuardar={guardarSlot} onClose={() => setModalId(null)}
          accent={accent}
        />
      )}
    </div>
  );
}
