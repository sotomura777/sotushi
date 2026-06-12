import { useEffect, useRef } from "react";
import dados from "@conteudo/cronicas/anemia-padroes.json";
import { Ico } from "@/components/icones";
import { useEstadoLocal } from "@/lib/persistencia";

const chaveLimpa = (k) => k.replace(/<[^>]+>/g, "");
const chavePar = (a, b) => [a, b].sort().join("|");

// dica de distinção para um par de tipos: do conteúdo, ou fallback do original
function dicaPar(a, b) {
  const dica = dados.distincoes[chavePar(a.id, b.id)];
  if (dica) return dica;
  if (a.cat !== b.cat)
    return dados.fallbackDiffCat.replace("{a}", a.name).replace("{b}", b.name)
      .replace("{catA}", dados.catLabels[a.cat]).replace("{catB}", dados.catLabels[b.cat]);
  return dados.fallbackSameCat.replace("{cat}", dados.catLabels[a.cat]);
}

// Estuda por padrão — fiel ao original: grelha de 16 tipos, seleção até 5,
// detalhe único (padrão lab + mecanismo + caso) ou comparação lado a lado
// com dicas de distinção par a par. (Ícones SVG no lugar dos emojis do original.)
export default function AnemiaPadroes({ voltar, rotuloVoltar = "‹ Algoritmo" }) {
  const [selecionados, setSelecionados] = useEstadoLocal("medguia:anemia:padroes:selecao", []);
  const detalheRef = useRef(null);
  // o scroll ao detalhe só acontece quando pedido por uma ação do utilizador —
  // nunca na abertura com seleção persistida (a guarda "primeira execução" por
  // ref não sobrevive ao remount duplo do StrictMode e fazia a vista abrir a meio)
  const scrollPedido = useRef(false);

  useEffect(() => { window.scrollTo({ top: 0 }); }, []);
  useEffect(() => {
    if (!scrollPedido.current) return;
    scrollPedido.current = false;
    if (selecionados.length) detalheRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [selecionados]);

  const alternar = (id) => {
    scrollPedido.current = true;
    setSelecionados((s) => {
      if (s.includes(id)) return s.filter((x) => x !== id);
      const novo = s.length >= dados.maxSelect ? s.slice(1) : [...s]; // substitui o mais antigo
      return [...novo, id];
    });
  };
  const remover = (id) => {
    scrollPedido.current = true;
    setSelecionados((s) => s.filter((x) => x !== id));
  };

  const tipos = selecionados.map((id) => dados.tipos.find((t) => t.id === id)).filter(Boolean);

  // união das chaves de padrão, preservando a ordem de cada tipo (como no original)
  const chaves = [];
  const vistas = new Set();
  tipos.forEach((t) => t.pattern.forEach(([k]) => {
    const c = chaveLimpa(k);
    if (!vistas.has(c)) { vistas.add(c); chaves.push(k); }
  }));
  const pares = [];
  for (let i = 0; i < tipos.length; i++)
    for (let j = i + 1; j < tipos.length; j++)
      pares.push({ a: tipos[i], b: tipos[j], dica: dicaPar(tipos[i], tipos[j]) });

  return (
    <div className="ca anemia ob-page an-pad">
      <button className="ob-voltar" onClick={voltar}>{rotuloVoltar}</button>
      <h1 className="ob-titulo">{dados.titulo}</h1>
      <p className="ca-hero-sub" dangerouslySetInnerHTML={{ __html: dados.subtitulo }} />

      <div className={"selected-zone" + (tipos.length ? " show" : "")}>
        <div className="selected-zone-header">
          <span>{dados.zona.titulo}</span>
          <span className="selected-zone-count">{tipos.length} / {dados.maxSelect}</span>
        </div>
        <div className="selected-cards">
          {tipos.map((t) => (
            <div key={t.id} className="selected-chip">
              <span>{t.name}</span>
              <button className="selected-chip-x" title="Remover" onClick={() => remover(t.id)}>×</button>
            </div>
          ))}
        </div>
        <div className="compare-hint">
          {tipos.length === 1 ? dados.zona.hint1 : dados.zona.hintN.replace("{n}", tipos.length)}
        </div>
      </div>
      <div className={"type-grid" + (tipos.length ? " compact" : "")}>
        {dados.tipos.map((t) => (
          <button key={t.id} className={"type-card" + (selecionados.includes(t.id) ? " disabled" : "")} onClick={() => alternar(t.id)}>
            <div className="type-card-cat">{t.catLabel}</div>
            <div className="type-card-title">{t.name}</div>
            <div className="type-card-meta">{t.meta}</div>
          </button>
        ))}
      </div>

      <div className={"type-detail" + (tipos.length ? " show" : "")} ref={detalheRef}>
        {tipos.length === 1 && (
          <div className="detail-card">
            <div className="detail-head">
              <div className="detail-head-eyebrow">{tipos[0].catLabel}</div>
              <div className="detail-head-title">{tipos[0].name}</div>
            </div>
            <div className="detail-section">
              <div className="detail-section-title"><Ico name="flask" s={14} /> {dados.labels.padrao}</div>
              <div className="detail-section-body">
                <table className="pattern-table"><tbody>
                  {tipos[0].pattern.map(([k, v], i) => (
                    <tr key={i}><td dangerouslySetInnerHTML={{ __html: k }} /><td dangerouslySetInnerHTML={{ __html: v }} /></tr>
                  ))}
                </tbody></table>
              </div>
            </div>
            <div className="detail-section">
              <div className="detail-section-title"><Ico name="algoritmo" s={14} /> {dados.labels.mecanismo}</div>
              <div className="mechanism-box" dangerouslySetInnerHTML={{ __html: tipos[0].mechanism }} />
            </div>
            <div className="detail-section">
              <div className="detail-section-title"><Ico name="documento" s={14} /> {dados.labels.caso}</div>
              <div className="case-vignette" dangerouslySetInnerHTML={{ __html: tipos[0].case }} />
            </div>
          </div>
        )}

        {tipos.length > 1 && (
          <>
            <div className="compare-distinguish">
              <div className="compare-distinguish-title"><Ico name="search" s={14} /> {dados.labels.distinguir}</div>
              {pares.map((p, i) => (
                <div key={i} className="compare-distinguish-pair">
                  <span className="pair-label">{p.a.name} <span style={{ opacity: 0.7 }}>vs</span> {p.b.name}</span>
                  <div dangerouslySetInnerHTML={{ __html: p.dica }} />
                </div>
              ))}
            </div>
            <div className="detail-card">
              <div className="detail-head">
                <div className="detail-head-eyebrow">{dados.labels.comparacao.replace("{n}", tipos.length)}</div>
                <div className="detail-head-title">{tipos.map((t) => t.name).join(" · ")}</div>
              </div>
              <div className="detail-section">
                <div className="detail-section-title"><Ico name="chart" s={14} /> {dados.labels.ladoALado}</div>
                <div className="an-pad-nota">{dados.labels.notaNaoCarat}</div>
                <div className="detail-section-body" style={{ overflowX: "auto" }}>
                  <table className="pattern-table">
                    <thead>
                      <tr><th>{dados.labels.parametro}</th>{tipos.map((t) => <th key={t.id}>{t.name}</th>)}</tr>
                    </thead>
                    <tbody>
                      {chaves.map((k, i) => (
                        <tr key={i}>
                          <td dangerouslySetInnerHTML={{ __html: k }} />
                          {tipos.map((t) => {
                            const linha = t.pattern.find(([kk]) => chaveLimpa(kk) === chaveLimpa(k));
                            return linha
                              ? <td key={t.id} dangerouslySetInnerHTML={{ __html: linha[1] }} />
                              : <td key={t.id}><span className="an-pad-naocarat">{dados.labels.naoCarat}</span></td>;
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
