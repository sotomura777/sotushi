import { useState, useMemo } from "react";
import meta from "@conteudo/sintomas/meta.json";
import sistemasRaw from "@conteudo/sintomas/sistemas.json";
import sintomasPorSistema from "@conteudo/sintomas/sintomas.json";
import { ICONES_SISTEMA, ICONES_DIMENSAO } from "./icones-sistemas";
import { Ico } from "@/components/icones";
import { listarSistemas, pesquisar } from "./logica";
import "./estilo.css";

// ============================================================================
// Sintomas — Abordagem por Sintoma (módulo de estudo)
// ----------------------------------------------------------------------------
// Estrutura em 3 níveis (porta do mock All-inMed, vestida com o design MedGuia):
//   hub (sistemas + pesquisa) → sintoma (5 dimensões) → dimensão (separadores)
// O conteúdo de cada dimensão ainda não existe — cada uma mostra "em construção".
// Conteúdo (sistemas/sintomas/intros) vive em /conteudo/sintomas/.
// ============================================================================

// Mosaico glossy colorido (reutiliza .mg-ictile da app); a cor do sistema entra em --ac.
const Tile = ({ cor, html, size }) => (
  <span
    className={"mg-ictile" + (size === "lg" ? " mg-ictile--lg" : size === "sm" ? " mg-ictile--sm" : "")}
    style={{ "--ac": cor }}
    dangerouslySetInnerHTML={{ __html: html }}
  />
);
const Html = ({ html, className }) => <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;
const pad = (n) => (n < 10 ? "0" + n : "" + n);

export default function Sintomas({ accent = "#1e3a36", gradiente, onVoltar }) {
  const sistemas = useMemo(() => listarSistemas(sistemasRaw, sintomasPorSistema), []);
  const [query, setQuery] = useState("");
  const [sel, setSel] = useState(null);   // { sistema, sintoma }
  const [modId, setModId] = useState(null);

  const resultados = useMemo(() => pesquisar(query, sistemasRaw, sintomasPorSistema), [query]);

  const abrirSintoma = (sistema, sintoma, dimensao = null) => {
    if (sintoma.estado !== "ativo") return;
    setSel({ sistema, sintoma });
    setModId(dimensao);
    window.scrollTo({ top: 0, behavior: "instant" });
  };
  const irHub = () => { setSel(null); setModId(null); window.scrollTo({ top: 0 }); };
  const irSintoma = () => { setModId(null); window.scrollTo({ top: 0 }); };

  const vista = modId ? "modulo" : sel ? "sintoma" : "hub";

  return (
    <div className="stm" style={{ "--acento": accent }}>
      <header className="hero" style={{ background: gradiente || accent }}>
        <div className="hero-conteudo">
          {onVoltar && <button className="voltar" onClick={onVoltar}>← Início</button>}
          <div className="hero-titulo">{meta.titulo}</div>
          <div className="hero-subtitulo">{meta.subtitulo}</div>
        </div>
      </header>

      <div className="modulo-corpo">
        <div className="stm-aviso">{meta.enquadramento}</div>

        {vista === "hub" && (
          <Hub
            sistemas={sistemas}
            query={query}
            setQuery={setQuery}
            resultados={resultados}
            onSistema={(s) => setQuery(s.nome)}
            onSintoma={abrirSintoma}
          />
        )}

        {vista === "sintoma" && (
          <VistaSintoma sel={sel} onVoltar={irHub} onModulo={(id) => setModId(id)} />
        )}

        {vista === "modulo" && (
          <VistaModulo sel={sel} modId={modId} onVoltar={irSintoma} onModulo={(id) => setModId(id)} />
        )}
      </div>
    </div>
  );
}

// ───────────────────────────── HUB ─────────────────────────────
function Hub({ sistemas, query, setQuery, resultados, onSistema, onSintoma }) {
  const aPesquisar = query.trim().length > 0;
  return (
    <>
      <div className="stm-busca">
        <span className="stm-busca-ic"><Ico name="search" s={18} /></span>
        <input
          className="campo stm-busca-input"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Procurar um sintoma… (ex: dor torácica, dispneia, cefaleia)"
          autoComplete="off"
        />
        {aPesquisar && (
          <button className="stm-busca-x" onClick={() => setQuery("")} aria-label="Limpar">×</button>
        )}
      </div>

      {!aPesquisar ? (
        <>
          <p className="secao-label">Sistemas</p>
          <div className="stm-sistemas">
            {sistemas.map((s) => (
              <button
                key={s.id}
                className="cartao stm-sys"
                style={{ "--sys": s.cor }}
                onClick={() => onSistema(s)}
              >
                <Tile cor={s.cor} html={ICONES_SISTEMA[s.id]} size="lg" />
                <div className="stm-sys-nome">{s.nome}</div>
                <div className="stm-sys-desc">{s.desc}</div>
                <div className="stm-sys-foot">
                  {s.total > 0 ? (
                    <>
                      <span><b>{pad(s.total)}</b> {s.total === 1 ? "sintoma" : "sintomas"}
                        {s.ativos > 0 && <span className="stm-sys-ativos"> · {s.ativos} ativo{s.ativos === 1 ? "" : "s"}</span>}
                      </span>
                      <span className="stm-sys-arr">↗</span>
                    </>
                  ) : <span>em breve</span>}
                </div>
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="stm-voltar-bar">
            <button className="stm-voltar" onClick={() => setQuery("")}>← Sistemas</button>
          </div>
          <div className="stm-res-cab">
            <p className="secao-label">Resultados para <em>"{query}"</em></p>
            <span className="stm-res-conta">{resultados.length} resultado{resultados.length === 1 ? "" : "s"}</span>
          </div>
          {resultados.length === 0 ? (
            <div className="cartao stm-vazio">Sem resultados. Outros sintomas estão em desenvolvimento.</div>
          ) : (
            <div className="stm-res-lista">
              {resultados.map(({ sintoma, sistema }, i) => (
                <ResultadoLinha key={sistema.id + "-" + sintoma.nome + i} sintoma={sintoma} sistema={sistema} onSintoma={onSintoma} />
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}

function ResultadoLinha({ sintoma, sistema, onSintoma }) {
  const ativo = sintoma.estado === "ativo";
  const tags = ativo
    ? (sintoma.modulos || []).map((m) => ({ label: m.title, id: m.id }))
    : ["Guia teórico", "Algoritmos", "Diagnósticos", "Anamnese", "Treino"].map((l) => ({ label: l, id: null }));
  return (
    <div
      className={"cartao stm-res" + (ativo ? " stm-res--ativo" : "")}
      style={{ "--sys": sistema.cor }}
      onClick={ativo ? () => onSintoma(sistema, sintoma) : undefined}
      role={ativo ? "button" : undefined}
    >
      <div className="stm-res-top">
        <Tile cor={sistema.cor} html={ICONES_SISTEMA[sistema.id]} />
        <div className="stm-res-meta">
          <div className="stm-res-nome">{sintoma.nome}</div>
          <div className="stm-res-sys">{sistema.nome}</div>
        </div>
        {!ativo && <span className="stm-badge">Em breve</span>}
      </div>
      <div className="stm-res-tags">
        {tags.map((t, i) => (
          <span
            key={i}
            className={"stm-tag" + (ativo && i === 0 ? " stm-tag--p" : "") + (ativo ? "" : " stm-tag--off")}
            onClick={ativo && t.id ? (e) => { e.stopPropagation(); onSintoma(sistema, sintoma, t.id); } : undefined}
          >
            {t.label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────── VISTA SINTOMA ───────────────────────────
function VistaSintoma({ sel, onVoltar, onModulo }) {
  const { sistema, sintoma } = sel;
  return (
    <div className="stm-detalhe" style={{ "--sys": sistema.cor }}>
      <Migalhas sistema={sistema} sintoma={sintoma} onVoltar={onVoltar} />

      <div className="stm-sym-cab">
        <Tile cor={sistema.cor} html={ICONES_SISTEMA[sistema.id]} size="lg" />
        <div>
          <div className="stm-sym-sys">{sistema.nome}</div>
          <h2 className="stm-sym-titulo">{sintoma.nome}</h2>
        </div>
      </div>
      {sintoma.intro && <Html className="stm-sym-intro" html={sintoma.intro} />}

      <div className="stm-sec-cab">
        <p className="secao-label">Escolhe por onde queres estudar</p>
        <span className="stm-sec-hint">{(sintoma.modulos || []).length} caminhos</span>
      </div>
      <div className="stm-dims">
        {(sintoma.modulos || []).map((m, i) => (
          <button key={m.id} className="cartao stm-dim" onClick={() => onModulo(m.id)}>
            <div className="stm-dim-num">{pad(i + 1)}</div>
            <Tile cor={sistema.cor} html={ICONES_DIMENSAO[m.icon]} />
            <Html className="stm-dim-titulo" html={m.titleHtml} />
            <div className="stm-dim-desc">{m.shortDesc}</div>
            <div className="stm-dim-foot"><span>{m.action}</span><span className="stm-arr">↗</span></div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────── VISTA DIMENSÃO ───────────────────────────
function VistaModulo({ sel, modId, onVoltar, onModulo }) {
  const { sistema, sintoma } = sel;
  const mod = (sintoma.modulos || []).find((m) => m.id === modId);
  if (!mod) return null;
  return (
    <div className="stm-detalhe" style={{ "--sys": sistema.cor }}>
      <div className="stm-voltar-bar">
        <button className="stm-voltar" onClick={onVoltar}>← {sintoma.nome}</button>
      </div>

      <div className="stm-tabs">
        {(sintoma.modulos || []).map((m) => (
          <button
            key={m.id}
            className={"stm-tab" + (m.id === modId ? " stm-tab--on" : "")}
            onClick={() => onModulo(m.id)}
          >
            <span className="stm-tab-t">{m.title}</span>
            <span className="stm-tab-s">{m.sub}</span>
          </button>
        ))}
      </div>

      <div className="stm-pill">{mod.pill}</div>
      <Html className="stm-mod-titulo" html={mod.titleHtml} />
      <p className="stm-mod-lead">{mod.lead}</p>

      <div className="cartao stm-construcao">
        <span className="mg-ictile mg-ictile--lg" style={{ "--ac": sistema.cor }}><Ico name="construction" s={26} /></span>
        <div className="stm-construcao-label">Em construção</div>
        <p className="stm-construcao-titulo">Conteúdo em preparação</p>
        <p className="stm-construcao-desc">Esta secção está a ser preparada. O conteúdo será adicionado em breve, mantendo a estrutura editorial do projeto.</p>
      </div>
    </div>
  );
}

function Migalhas({ sistema, sintoma, onVoltar }) {
  return (
    <div className="stm-voltar-bar">
      <button className="stm-voltar" onClick={onVoltar}>← Voltar</button>
      <nav className="stm-migalhas">
        <a onClick={onVoltar}>Todos</a>
        <span className="stm-sep">/</span>
        <a onClick={onVoltar}>{sistema.nome}</a>
        <span className="stm-sep">/</span>
        <span className="stm-atual">{sintoma.nome}</span>
      </nav>
    </div>
  );
}
