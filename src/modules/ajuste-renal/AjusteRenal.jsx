import { useState, useMemo } from "react";
import meta from "@conteudo/ajuste-renal/meta.json";
import FARMACOS from "@conteudo/ajuste-renal/farmacos.json";
import { grupos as gruposDe, filtrar, contagens, agrupar } from "./logica";
import { Ico } from "@/components/icones";
import "./estilo.css";

// Cor + ícone de cada estado (apresentação pura; os rótulos vêm do meta.json).
// A cor "forte" é passada como --cor e o CSS deriva fundos translúcidos
// (funciona em tema claro e escuro sem pastéis fixos).
const ESTADO = {
  ok: { cor: "#16a34a", icone: "checkCircle" },
  adjust: { cor: "#ca8a04", icone: "alertCircle" },
  caution: { cor: "#ea580c", icone: "warn" },
  ci: { cor: "#dc2626", icone: "xCircle" },
};
const ROTULO = Object.fromEntries(meta.estados.map((e) => [e.key, e.label]));
const ORDEM_ESTADO = ["ok", "adjust", "caution", "ci"];
const GRUPOS = gruposDe(FARMACOS);

function Etiqueta({ s, mini }) {
  const e = ESTADO[s];
  return (
    <span className={"ar-tag" + (mini ? " mini" : "")} style={{ "--cor": e.cor }}>
      <Ico name={e.icone} s={mini ? 13 : 14} />{!mini && ROTULO[s]}
    </span>
  );
}

export default function AjusteRenal({ accent = "#0f766e", gradiente, onVoltar }) {
  const [escalao, setEscalao] = useState(0);
  const [query, setQuery] = useState("");
  const [gruposSel, setGruposSel] = useState([]);
  const [ocultarOk, setOcultarOk] = useState(false);
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);

  const range = meta.escaloes[escalao];
  const filtrados = useMemo(
    () => filtrar(FARMACOS, { query, gruposSel, ocultarOk, escalao }),
    [query, gruposSel, ocultarOk, escalao]
  );
  const cont = useMemo(() => contagens(FARMACOS, { query, gruposSel, escalao }), [query, gruposSel, escalao]);
  const blocos = useMemo(() => agrupar(filtrados), [filtrados]);

  const alternarGrupo = (g) => setGruposSel((s) => (s.includes(g) ? s.filter((x) => x !== g) : [...s, g]));
  const limpar = () => { setQuery(""); setGruposSel([]); setOcultarOk(false); };
  const temFiltros = query || gruposSel.length > 0 || ocultarOk;

  return (
    <div className="ar" style={{ "--acento": accent }}>
      <header className="hero" style={{ background: gradiente || accent }}>
        <div className="hero-conteudo">
          {onVoltar && <button className="voltar" onClick={onVoltar}>← Início</button>}
          <div className="secao-label" style={{ color: "var(--acento)", marginBottom: 2 }}>{meta.eyebrow}</div>
          <div className="hero-titulo">{meta.titulo}</div>
          <div className="hero-subtitulo">{meta.subtitulo}</div>
        </div>
      </header>

      <div className="modulo-corpo">
        {/* Seletor de TFG — 6 escalões */}
        <div className="ar-tfg cartao">
          <div className="ar-tfg-topo">
            <span className="secao-label" style={{ margin: 0 }}>Taxa de filtração glomerular</span>
            <span className="ar-tfg-unidade">mL/min/1,73m²</span>
          </div>
          <div className="ar-tfg-grid">
            {meta.escaloes.map((r, i) => (
              <button key={r.key} className={"ar-tfg-btn" + (i === escalao ? " ativo" : "")} onClick={() => setEscalao(i)}>
                <span className="ar-tfg-label">{r.label}</span>
                <span className="ar-tfg-stage">{r.description.match(/\(([^)]+)\)/)?.[1] || ""}</span>
              </button>
            ))}
          </div>
          <input className="ar-tfg-range" type="range" min={0} max={5} step={1} value={escalao}
            onChange={(e) => setEscalao(Number(e.target.value))} />
          <div className="ar-tfg-info">
            <div className="ar-tfg-info-full">{range.full}</div>
            <div className="ar-tfg-info-desc">{range.description}</div>
          </div>
        </div>

        {/* Contagens por estado */}
        <div className="ar-contagens">
          {ORDEM_ESTADO.map((k) => (
            <div key={k} className="ar-cont" style={{ "--cor": ESTADO[k].cor }}>
              <div className="ar-cont-topo"><Ico name={ESTADO[k].icone} s={16} /><span className="ar-cont-num">{cont[k]}</span></div>
              <div className="ar-cont-label">{ROTULO[k]}</div>
            </div>
          ))}
        </div>

        {/* Pesquisa + filtros */}
        <div className="ar-barra">
          <div className="ar-busca">
            <Ico name="search" s={16} c="var(--suave)" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Pesquisar fármaco ou classe..." />
          </div>
          <button className={"ar-btn-filtro" + (filtrosAbertos ? " ativo" : "")} onClick={() => setFiltrosAbertos((v) => !v)}>
            <Ico name="filtro" s={15} />Filtros{gruposSel.length > 0 && <span className="ar-filtro-badge">{gruposSel.length}</span>}
          </button>
          <label className="ar-check">
            <input type="checkbox" checked={ocultarOk} onChange={(e) => setOcultarOk(e.target.checked)} />
            Ocultar "sem ajuste"
          </label>
          {temFiltros && <button className="ar-btn-limpar" onClick={limpar}><Ico name="close" s={14} />Limpar</button>}
        </div>

        {filtrosAbertos && (
          <div className="ar-grupos cartao">
            <div className="secao-label" style={{ margin: "0 0 8px" }}>Classes terapêuticas</div>
            <div className="filtros">
              {GRUPOS.map((g) => (
                <button key={g} className={"filtro" + (gruposSel.includes(g) ? " filtro--ativo" : "")}
                  style={gruposSel.includes(g) ? { background: accent, borderColor: accent, color: "#fff" } : undefined}
                  onClick={() => alternarGrupo(g)}>{g}</button>
              ))}
            </div>
          </div>
        )}

        {/* Resultados */}
        {filtrados.length === 0 ? (
          <div className="ar-vazio">
            <div className="ar-vazio-titulo">Nenhum fármaco corresponde aos filtros</div>
            <div className="ar-vazio-sub">Tente outro nome, classe ou limpe os filtros.</div>
          </div>
        ) : (
          <div className="ar-blocos">
            {blocos.map((b, i) => (
              <div key={i} className="ar-bloco cartao">
                <div className="ar-bloco-cab">
                  <span className="ar-bloco-grupo">{b.group}</span>
                  <span className="ar-bloco-sep">·</span>
                  <span className="ar-bloco-classe">{b.class}</span>
                </div>
                {b.farmacos.map((f, fi) => {
                  const nivel = f.L[escalao];
                  return (
                    <div key={fi} className="ar-farmaco" style={{ "--cor": ESTADO[nivel.s].cor }}>
                      <div className="ar-farmaco-info">
                        <div className="ar-farmaco-linha1">
                          <span className="ar-farmaco-nome">{f.name}</span>
                          <span className="ar-farmaco-dose">{f.dose}</span>
                        </div>
                        <div className="ar-farmaco-nota">{nivel.t}</div>
                      </div>
                      <Etiqueta s={nivel.s} />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}

        <div className="ar-rodape">
          <div className="ar-rodape-aviso">
            <Ico name="info" s={14} />
            <div dangerouslySetInnerHTML={{ __html: meta.disclaimer.replace(/^Ferramenta de estudo\./, "<strong>Ferramenta de estudo.</strong>") }} />
          </div>
          <div className="ar-rodape-biblio"><strong>Bibliografia consultada:</strong> {meta.bibliografia}</div>
        </div>
      </div>
    </div>
  );
}
