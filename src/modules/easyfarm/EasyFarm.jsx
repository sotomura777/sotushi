import { useState, useMemo, useEffect } from "react";
import meta from "@conteudo/easyfarm/meta.json";
import { facetas, filtrarFarmacos } from "./logica";
import FichaFarmaco from "./FichaFarmaco";
import { Ico } from "@/components/icones";
import "./estilo.css";

// Fichas carregadas de /conteudo/easyfarm (uma por fármaco). meta.json é excluído.
const MODULOS = import.meta.glob("../../../conteudo/easyfarm/*.json", { eager: true });
const POR_SLUG = {};
for (const [caminho, mod] of Object.entries(MODULOS)) {
  const slug = caminho.split("/").pop().replace(".json", "");
  if (slug !== "meta") POR_SLUG[slug] = mod.default || mod;
}

const FARMACOS = meta.farmacos;
const FAC = facetas(FARMACOS);
const classCor = (k) => (meta.classStyle[k] || {}).color || "#888";
const classVar = (k) => (meta.classStyle[k] || {}).variant || "light";
const labelClasse = (k) => (FAC.classes.find((c) => c.key === k) || {}).label || k;

const Html = ({ className, html }) => <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;
const vazio = () => ({ sistema: new Set(), classe: new Set(), indicacao: new Set() });

export default function EasyFarm({ accent = "#1B5E8A", gradiente, onVoltar }) {
  const [slug, setSlug] = useState(null);
  const [query, setQuery] = useState("");
  const [filtros, setFiltros] = useState(vazio);
  const [painel, setPainel] = useState(false);
  const [draft, setDraft] = useState(vazio);
  const [disc, setDisc] = useState(false);

  useEffect(() => { window.scrollTo({ top: 0 }); }, [slug]);

  const lista = useMemo(() => filtrarFarmacos(FARMACOS, { query, ...filtros }), [query, filtros]);
  const nAtivos = filtros.sistema.size + filtros.classe.size + filtros.indicacao.size;

  // alterna um valor num grupo dos filtros aplicados (a partir do cartão)
  const toggleFiltro = (grupo, valor) =>
    setFiltros((f) => {
      const n = { sistema: new Set(f.sistema), classe: new Set(f.classe), indicacao: new Set(f.indicacao) };
      n[grupo].has(valor) ? n[grupo].delete(valor) : n[grupo].add(valor);
      return n;
    });

  const chips = [
    ...[...filtros.sistema].map((v) => ({ cat: "Sistema", label: v, grupo: "sistema", valor: v })),
    ...[...filtros.classe].map((v) => ({ cat: "Classe", label: labelClasse(v), grupo: "classe", valor: v })),
    ...[...filtros.indicacao].map((v) => ({ cat: "Indicação", label: v, grupo: "indicacao", valor: v })),
  ];

  // painel: rascunho independente, aplicado no "Aplicar"
  const abrirPainel = () => { setDraft({ sistema: new Set(filtros.sistema), classe: new Set(filtros.classe), indicacao: new Set(filtros.indicacao) }); setPainel(true); };
  const toggleDraft = (grupo, valor) =>
    setDraft((d) => {
      const n = { sistema: new Set(d.sistema), classe: new Set(d.classe), indicacao: new Set(d.indicacao) };
      n[grupo].has(valor) ? n[grupo].delete(valor) : n[grupo].add(valor);
      return n;
    });
  const aplicarDraft = () => { setFiltros(draft); setPainel(false); };
  const nDraft = draft.sistema.size + draft.classe.size + draft.indicacao.size;

  // ── VISTA DE FICHA ──
  if (slug && POR_SLUG[slug]) {
    return (
      <div className="easyf" style={{ "--acento": accent }}>
        <FichaFarmaco ficha={POR_SLUG[slug]} cor={classCor(POR_SLUG[slug].classeKey)} onVoltar={() => setSlug(null)} />
      </div>
    );
  }

  // ── VISTA DE LISTA ──
  return (
    <div className="easyf" style={{ "--acento": accent }}>
      <header className="hero" style={{ background: gradiente || accent }}>
        <div className="hero-conteudo">
          {onVoltar && <button className="voltar" onClick={onVoltar}>← Início</button>}
          <div className="hero-titulo">{meta.titulo}</div>
          <div className="hero-subtitulo">{meta.subtitulo}</div>
        </div>
      </header>

      <div className="modulo-corpo">
        {/* DISCLAIMER expansível */}
        <button className="easyf-disc" onClick={() => setDisc((v) => !v)}>
          <span className="easyf-disc-ico">!</span>
          <span className="easyf-disc-txt">
            <b>Conteúdo educativo.</b> Não substitui o julgamento clínico nem o RCM em vigor. Verificar sempre o <b>Infomed</b> do INFARMED.
            <span className="easyf-disc-mais">{disc ? "Fechar" : "Saber mais"}</span>
          </span>
        </button>
        {disc && meta.disclaimerExpandedHtml && (
          <Html className="easyf-disc-exp" html={meta.disclaimerExpandedHtml} />
        )}

        {/* TOOLBAR */}
        <div className="easyf-toolbar">
          <div className="easyf-searchwrap">
            <span className="easyf-search-ico"><Ico name="search" s={16} /></span>
            <input className="campo easyf-search" value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="Pesquisar por DCI, marca, indicação…" autoComplete="off" />
          </div>
          <button className={"easyf-filtro-btn" + (nAtivos ? " ativo" : "")} onClick={abrirPainel}>
            <Ico name="filtro" s={15} /> Filtros
            {nAtivos > 0 && <span className="easyf-filtro-badge">{nAtivos}</span>}
          </button>
        </div>

        {/* CHIPS ATIVOS */}
        {chips.length > 0 && (
          <div className="easyf-chips">
            {chips.map((c) => (
              <span key={c.grupo + c.valor} className="easyf-chip">
                <span className="easyf-chip-cat">{c.cat}</span>{c.label}
                <button className="easyf-chip-x" onClick={() => toggleFiltro(c.grupo, c.valor)} aria-label="Remover">×</button>
              </span>
            ))}
            <button className="easyf-chips-limpar" onClick={() => setFiltros(vazio())}>Limpar todos</button>
          </div>
        )}

        <div className="easyf-meta">
          {lista.length === FARMACOS.length ? `${FARMACOS.length} fármacos` : `A mostrar ${lista.length} de ${FARMACOS.length}`}
        </div>

        {/* CARTÕES */}
        {lista.length === 0 ? (
          <div className="easyf-vazio">Sem resultados para os filtros aplicados.</div>
        ) : (
          <div className="easyf-grid">
            {lista.map((f) => (
              <article
                key={f.slug}
                className="drug-card"
                data-variant={classVar(f.classeKey)}
                style={{ "--cc": classCor(f.classeKey) }}
                onClick={() => POR_SLUG[f.slug] && setSlug(f.slug)}
                role="button" tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Enter" && POR_SLUG[f.slug]) setSlug(f.slug); }}
              >
                <div className="drug-card-head">
                  <div className="drug-name">{f.dci}</div>
                  <div
                    className={"drug-class" + (filtros.classe.has(f.classeKey) ? " active" : "")}
                    onClick={(e) => { e.stopPropagation(); toggleFiltro("classe", f.classeKey); }}
                  >
                    {f.classe}
                  </div>
                </div>
                <div className="drug-brands"><b>Marcas:</b> {f.marcas.join(" · ")}</div>
                <div className="drug-tags">
                  {f.indicacoes.map((ind) => (
                    <span
                      key={ind}
                      className={"drug-tag" + (filtros.indicacao.has(ind) ? " active" : "")}
                      onClick={(e) => { e.stopPropagation(); toggleFiltro("indicacao", ind); }}
                    >
                      {ind}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* PAINEL DE FILTROS (slide-over) */}
      <div className={"easyf-overlay" + (painel ? " open" : "")} onClick={() => setPainel(false)} />
      <aside className={"easyf-panel" + (painel ? " open" : "")} role="dialog" aria-label="Filtros">
        <div className="easyf-fp-head">
          <div className="easyf-fp-title">Filtros</div>
          <button className="easyf-fp-close" onClick={() => setPainel(false)} aria-label="Fechar">✕</button>
        </div>
        <div className="easyf-fp-body">
          <GrupoFiltro titulo="Sistema / Aparelho"
            entradas={[...FAC.sistemas].sort((a, b) => a.nome.localeCompare(b.nome)).map((s) => ({ key: s.nome, label: s.nome, count: s.count }))}
            sel={draft.sistema} onToggle={(k) => toggleDraft("sistema", k)} />
          <GrupoFiltro titulo="Classe farmacológica" swatch
            entradas={[...FAC.classes].sort((a, b) => a.label.localeCompare(b.label)).map((c) => ({ key: c.key, label: c.label, count: c.count, cor: classCor(c.key) }))}
            sel={draft.classe} onToggle={(k) => toggleDraft("classe", k)} />
          <GrupoFiltro titulo="Indicação"
            entradas={[...FAC.indicacoes].sort((a, b) => a.nome.localeCompare(b.nome)).map((i) => ({ key: i.nome, label: i.nome, count: i.count }))}
            sel={draft.indicacao} onToggle={(k) => toggleDraft("indicacao", k)} />
        </div>
        <div className="easyf-fp-foot">
          <button className="easyf-fp-btn sec" onClick={() => setDraft(vazio())}>Limpar tudo</button>
          <button className="easyf-fp-btn pri" onClick={aplicarDraft}>{nDraft > 0 ? `Aplicar (${nDraft})` : "Aplicar"}</button>
        </div>
      </aside>
    </div>
  );
}

function GrupoFiltro({ titulo, entradas, sel, onToggle, swatch }) {
  return (
    <div className="easyf-fp-group">
      <div className="easyf-fp-group-head">
        <div className="easyf-fp-group-title">{titulo}</div>
        {sel.size > 0 && <div className="easyf-fp-group-count">{sel.size} selecionado{sel.size === 1 ? "" : "s"}</div>}
      </div>
      <div className="easyf-fp-options">
        {entradas.map((e) => (
          <label key={e.key} className={"easyf-fp-option" + (sel.has(e.key) ? " checked" : "")} onClick={() => onToggle(e.key)}>
            <span className="easyf-fp-check" />
            <span className="easyf-fp-opt-label">
              {swatch && <span className="easyf-fp-swatch" style={{ background: e.cor }} />}
              {e.label}
            </span>
            <span className="easyf-fp-opt-count">{e.count}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
