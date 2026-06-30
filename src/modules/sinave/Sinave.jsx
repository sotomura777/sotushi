import { useState, useMemo } from "react";
import meta from "@conteudo/sinave/meta.json";
import doencas from "@conteudo/sinave/doencas.json";
import config from "@conteudo/sinave/config.json";
import { Ico } from "@/components/icones";
import { filtrar, naturezaDe, tagsDe, estatisticas } from "./logica";
import "./estilo.css";

// ============================================================================
// SINAVE — Doenças de Notificação Obrigatória (módulo de referência)
// ----------------------------------------------------------------------------
// Lista pesquisável/filtrável de 65 doenças; cada cartão expande com critérios
// (clínicos/laboratoriais/epidemiológicos) e classificação de caso. Informação
// pura (não interpreta dados de doente). Conteúdo em /conteudo/sinave/.
// ============================================================================

const { tagLabels, tagPriority, nature, filters, natureLetters, natureColors, critColor } = config;
const STATS = estatisticas(doencas);

const Html = ({ html, className }) => <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;

// Ícones dos blocos de critério (do mock; UI).
const CRIT_IC = {
  clin: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2v4" /><path d="M16 2v4" /><rect x="3" y="6" width="18" height="15" rx="2" /><path d="M12 11v6" /><path d="M9 14h6" /></svg>,
  lab: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3v6l-5 9a2 2 0 0 0 2 3h12a2 2 0 0 0 2-3l-5-9V3" /><path d="M8 3h8" /><path d="M7 14h10" /></svg>,
  epi: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M2 12h20" /><path d="M12 2a15 15 0 0 1 0 20" /><path d="M12 2a15 15 0 0 0 0 20" /></svg>,
  cls: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 12 2 2 4-4" /><circle cx="12" cy="12" r="10" /></svg>,
};

// Uma tag colorida conforme natureza / alto-risco / auxiliar.
function Tag({ k }) {
  const tipo = nature.includes(k) ? "nat" : k === "crit" ? "crit" : "aux";
  const cor = tipo === "nat" ? natureColors[k] : tipo === "crit" ? critColor : null;
  return (
    <span className={"snv-tag snv-tag--" + tipo} style={cor ? { "--tc": cor } : undefined}>
      {tagLabels[k]}
    </span>
  );
}

export default function Sinave({ accent = "#8c2f39", gradiente, onVoltar }) {
  const [q, setQ] = useState("");
  const [ativas, setAtivas] = useState([]);
  const [abertas, setAbertas] = useState(() => new Set());

  const lista = useMemo(() => filtrar(doencas, q, ativas), [q, ativas]);
  const aPesquisar = q.trim().length > 0;

  const toggleFiltro = (k) => setAtivas((a) => (a.includes(k) ? a.filter((x) => x !== k) : [...a, k]));
  const toggleAberta = (nome) =>
    setAbertas((s) => { const n = new Set(s); n.has(nome) ? n.delete(nome) : n.add(nome); return n; });

  return (
    <div className="snv" style={{ "--acento": accent }}>
      <header className="hero" style={{ background: gradiente || accent }}>
        <div className="hero-conteudo">
          {onVoltar && <button className="voltar" onClick={onVoltar}>← Início</button>}
          <div className="hero-titulo">{meta.titulo}</div>
          <div className="hero-subtitulo">{meta.subtitulo}</div>
        </div>
      </header>

      <div className="modulo-corpo">
        <div className="snv-aviso">{meta.enquadramento}</div>

        {/* pesquisa */}
        <div className="snv-busca">
          <span className="snv-busca-ic"><Ico name="search" s={18} /></span>
          <input
            className="campo snv-busca-input"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Pesquisar doença, agente, sintoma…"
            autoComplete="off"
          />
          {aPesquisar && <button className="snv-busca-x" onClick={() => setQ("")} aria-label="Limpar">×</button>}
        </div>

        {/* estatísticas (escondidas em pesquisa) */}
        {!aPesquisar && (
          <div className="snv-stats">
            {STATS.map((s) => (
              <div key={s.l} className="snv-stat">
                <div className="snv-stat-n">{s.n}</div>
                <div className="snv-stat-l">{s.l}</div>
              </div>
            ))}
          </div>
        )}

        {/* filtros (escondidos em pesquisa) */}
        {!aPesquisar && (
          <div className="snv-filtros">
            <span className="snv-filtros-label">Filtrar</span>
            {filters.map((f) => (
              <button
                key={f.k}
                className={"snv-chip" + (ativas.includes(f.k) ? " snv-chip--on" : "")}
                onClick={() => toggleFiltro(f.k)}
              >
                {f.l}
              </button>
            ))}
            {ativas.length > 0 && <button className="snv-chip-clear" onClick={() => setAtivas([])}>limpar</button>}
          </div>
        )}

        {/* meta resultados */}
        <div className="snv-res-cab">
          <p className="secao-label">
            {aPesquisar ? <>Resultados para <em>"{q.trim()}"</em></>
              : ativas.length ? <><em>{lista.length}</em> filtrada{lista.length === 1 ? "" : "s"}</>
              : <>Todas as doenças</>}
          </p>
          <span className="snv-res-conta">{lista.length} de {doencas.length}</span>
        </div>

        {/* lista */}
        {lista.length === 0 ? (
          <div className="cartao snv-vazio">Sem resultados. Ajusta os filtros ou tenta outra palavra-chave.</div>
        ) : (
          <div className="snv-lista">
            {lista.map((d) => (
              <CartaoDoenca key={d.name} d={d} aberta={abertas.has(d.name)} onToggle={() => toggleAberta(d.name)} />
            ))}
          </div>
        )}

        <Html className="snv-fonte rodape" html={meta.fonteHtml} />
      </div>
    </div>
  );
}

function CartaoDoenca({ d, aberta, onToggle }) {
  const nat = naturezaDe(d, nature);
  const cor = natureColors[nat];
  const { visiveis, extra } = tagsDe(d, tagPriority, 4);
  const classif = [
    { k: "possivel", l: "Possível" },
    { k: "provavel", l: "Provável" },
    { k: "confirmado", l: "Confirmado" },
  ];
  return (
    <div className={"cartao snv-card" + (aberta ? " snv-card--on" : "")} style={{ "--nat": cor }}>
      <button className="snv-card-head" onClick={onToggle} aria-expanded={aberta}>
        <span className="mg-ictile snv-card-ic" style={{ "--ac": cor }}>{natureLetters[nat]}</span>
        <span className="snv-card-meta">
          <span className="snv-card-nome">{d.name}</span>
          <span className="snv-card-agente">{d.agent}</span>
        </span>
        <span className="snv-card-dir">
          <span className="snv-card-tags">
            {visiveis.map((k) => <Tag key={k} k={k} />)}
            {extra > 0 && <span className="snv-tag snv-tag--aux">+{extra}</span>}
          </span>
          <span className="snv-chev">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
          </span>
        </span>
      </button>

      {aberta && (
        <div className="snv-card-body">
          <div className="snv-crit-grid">
            <Bloco ic={CRIT_IC.clin} titulo="Critérios clínicos" html={d.crit.clin} />
            <Bloco ic={CRIT_IC.lab} titulo="Laboratoriais" html={d.crit.lab} />
            <Bloco ic={CRIT_IC.epi} titulo="Epidemiológicos" html={d.crit.epi} />
          </div>
          <div className="snv-classif">
            <div className="snv-classif-titulo">{CRIT_IC.cls} Classificação de caso</div>
            <div className="snv-classif-grid">
              {classif.map(({ k, l }) => (
                <div key={k} className={"snv-classif-item snv-classif--" + k}>
                  <div className="snv-classif-label">{l}</div>
                  {d.classif[k]
                    ? <Html className="snv-classif-body" html={d.classif[k]} />
                    : <div className="snv-classif-body snv-classif-na">Não aplicável</div>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Bloco({ ic, titulo, html }) {
  return (
    <div className="snv-crit-bloco">
      <div className="snv-crit-eyebrow">{ic} {titulo}</div>
      <Html className="snv-crit-texto" html={html} />
    </div>
  );
}
