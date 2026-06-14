import { useState } from "react";
import { I } from "@/components/icones";
import meta from "@conteudo/cards/meta.json";
import { filtrar, agrupar, especialidadesComCards } from "./logica";
import { obterPdfUrl } from "./pdfs";
import "./estilo.css";

const TIPOS = meta.tipos;
const ESP = meta.especialidades;
const fmtBytes = (n) => (n > 1048576 ? (n / 1048576).toFixed(1) + " MB" : Math.max(1, Math.round(n / 1024)) + " KB");

export default function Biblioteca({ cards, setCards, onEditar, accent }) {
  const [fTipo, setFTipo] = useState("Todos");
  const [fEsp, setFEsp] = useState("Todas");
  const [fav, setFav] = useState(false);
  const [flip, setFlip] = useState({});
  const [visor, setVisor] = useState(null); // { url, nome } do PDF aberto

  const abrirResumo = async (c) => {
    const r = await obterPdfUrl(c.pdf?.id);
    if (r) setVisor(r);
  };
  const fecharVisor = () => { if (visor?.url) URL.revokeObjectURL(visor.url); setVisor(null); };

  const toggleFlip = (id) => setFlip((f) => ({ ...f, [id]: !f[id] }));
  const toggleFav = (id) => setCards((cs) => cs.map((c) => (c.id === id ? { ...c, favorito: !c.favorito } : c)));

  const filtrados = filtrar(cards, { filtroTipo: fTipo, filtroEsp: fEsp, favOnly: fav });
  const grupos = agrupar(filtrados, fEsp === "Todas", ESP, TIPOS);
  const espComCards = especialidadesComCards(cards, { filtroTipo: fTipo, favOnly: fav });
  const totalFav = cards.filter((c) => c.favorito).length;

  const ativo = (cond, cor) => (cond ? { background: cor, borderColor: cor, color: "#fff" } : undefined);

  return (
    <div className="aba" style={{ "--acento": accent }}>
      <div className="cd-top">
        <div>
          <h1 className="aba-titulo">Biblioteca</h1>
          <div className="cd-count">{cards.length} cards · {totalFav} favoritos</div>
        </div>
        <button className="cd-novo" style={{ background: accent }} onClick={() => onEditar(null)}>+ Novo</button>
      </div>

      <div className="cd-flabel-row">Tipo</div>
      <div className="cd-pills">
        <button className="cd-pill" style={fTipo === "Todos" ? { background: "var(--texto)", borderColor: "var(--texto)", color: "var(--superficie)" } : undefined} onClick={() => setFTipo("Todos")}>Todos</button>
        {Object.keys(TIPOS).map((t) => {
          const on = fTipo === t;
          return (
            <button key={t} className="cd-pill" style={ativo(on, TIPOS[t].cor)} onClick={() => setFTipo(on ? "Todos" : t)}>
              <span className="cd-pill-dot" style={{ background: on ? "#fff" : TIPOS[t].cor }} />{t}
            </button>
          );
        })}
        <button className="cd-pill" style={fav ? { background: "#E8A87C", borderColor: "#E8A87C", color: "#fff" } : undefined} onClick={() => setFav((v) => !v)}>
          {I.starFill(fav ? "#fff" : "#E8A87C", 12)} Favs
        </button>
      </div>

      <div className="cd-flabel-row">Especialidade</div>
      <div className="cd-pills">
        <button className="cd-pill" style={fEsp === "Todas" ? { background: "var(--texto)", borderColor: "var(--texto)", color: "var(--superficie)" } : undefined} onClick={() => setFEsp("Todas")}>Todas</button>
        {Object.keys(ESP).filter((k) => espComCards.has(k)).map((k) => {
          const on = fEsp === k;
          return (
            <button key={k} className="cd-pill" style={ativo(on, ESP[k].cor)} onClick={() => setFEsp(on ? "Todas" : k)}>
              <span className="cd-pill-dot" style={{ background: on ? "#fff" : ESP[k].cor }} />{ESP[k].label}
            </button>
          );
        })}
      </div>

      {fav && <div className="cd-favbanner">{I.starFill("#E8A87C", 15)} Vista de Favoritos · {filtrados.length}</div>}

      {filtrados.length === 0 && (
        <div className="cd-empty">{fav ? "Sem favoritos com estes filtros." : "Sem cards. Cria o primeiro em “Criar”."}</div>
      )}

      {grupos.map((g) => (
        <div key={g.chave}>
          <div className="cd-grupo-h"><span className="cd-grupo-dot" style={{ background: g.cor }} />{g.label} · {g.cards.length}</div>
          <div className="cd-grid">
            {g.cards.map((c) => {
              const esp = ESP[c.especialidade] || { cor: "#475569" };
              const tipoLabel = (TIPOS[c.tipo] || {}).label || "INFO";
              const fl = !!flip[c.id];

              // ── card de resumo (PDF) ──
              if (c.kind === "resumo") {
                return (
                  <div key={c.id} className="cd-resumo" style={{ borderLeft: `3.5px solid ${esp.cor}` }} onClick={() => abrirResumo(c)}>
                    <div className="cd-resumo-top">
                      <span className="cd-resumo-ic" style={{ color: esp.cor }}>{I.documento(esp.cor, 20)}</span>
                      <div className="cd-badges" style={{ flex: 1 }}>
                        {c.tags.map((t, i) => (
                          <span key={i} className="cd-badge" style={{ background: (c.tagColors[i] || "#475569") + "22", color: c.tagColors[i] || "#475569" }}>{t}</span>
                        ))}
                      </div>
                      <button className="cd-star" onClick={(e) => { e.stopPropagation(); toggleFav(c.id); }} aria-label="Favorito">
                        {c.favorito ? I.starFill("#E8A87C", 16) : I.star("#CBD5E1", 16)}
                      </button>
                    </div>
                    <div className="cd-titulo" style={{ marginTop: 6 }}>{c.titulo}</div>
                    {c.pdf && <div className="cd-resumo-file">{c.pdf.nome} · {fmtBytes(c.pdf.tamanho)}</div>}
                    <div className="cd-resumo-acao">Abrir resumo →</div>
                    <button className="cd-edit" onClick={(e) => { e.stopPropagation(); onEditar(c.id); }} aria-label="Editar">···</button>
                  </div>
                );
              }

              return (
                <div key={c.id} className="cd-container">
                  <div className={"cd-inner" + (fl ? " flipped" : "")} onDoubleClick={() => toggleFlip(c.id)}>
                    <div className="cd-face cd-front" style={{ borderLeft: `3.5px solid ${esp.cor}` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 6 }}>
                        <div className="cd-badges">
                          {c.tags.map((t, i) => (
                            <span key={i} className="cd-badge" style={{ background: (c.tagColors[i] || "#475569") + "22", color: c.tagColors[i] || "#475569" }}>{t}</span>
                          ))}
                        </div>
                        <button className="cd-star" onClick={(e) => { e.stopPropagation(); toggleFav(c.id); }} aria-label="Favorito">
                          {c.favorito ? I.starFill("#E8A87C", 16) : I.star("#CBD5E1", 16)}
                        </button>
                      </div>
                      <div className="cd-titulo" style={{ marginTop: 6 }}>{c.titulo}</div>
                      {c.subtitulo && <div className="cd-sub">{c.subtitulo}</div>}
                      {c.front?.dose && <div style={{ marginTop: 8 }}><div className="cd-flabel">{tipoLabel}</div><div className="cd-fval">{c.front.dose}</div></div>}
                      {c.front?.ea && <div className="cd-fea" style={{ marginTop: 6 }}>{c.front.ea}</div>}
                      <button className="cd-edit" onClick={(e) => { e.stopPropagation(); onEditar(c.id); }} aria-label="Editar">···</button>
                    </div>
                    <div className="cd-face cd-back">
                      <div className="cd-back-label">{c.back?.label}</div>
                      <div className="cd-back-sub">{c.titulo}</div>
                      <div className="cd-back-body">{c.back?.mecanismo}</div>
                      {c.back?.dica && <div className="cd-back-dica"><div className="cd-back-dica-t">Dica</div><div className="cd-back-dica-x">{c.back.dica}</div></div>}
                      {c.back?.fonte && <div className="cd-back-fonte">{c.back.fonte}</div>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {visor && (
        <div className="cd-visor" onClick={fecharVisor}>
          <div className="cd-visor-box" onClick={(e) => e.stopPropagation()}>
            <div className="cd-visor-bar">
              <span className="cd-visor-nome">{visor.nome}</span>
              <div className="cd-visor-acoes">
                <a className="cd-visor-btn" href={visor.url} target="_blank" rel="noreferrer">Abrir</a>
                <a className="cd-visor-btn" href={visor.url} download={visor.nome}>Descarregar</a>
                <button className="cd-visor-btn" onClick={fecharVisor}>Fechar</button>
              </div>
            </div>
            <iframe className="cd-visor-frame" title={visor.nome} src={visor.url} />
          </div>
        </div>
      )}
    </div>
  );
}
