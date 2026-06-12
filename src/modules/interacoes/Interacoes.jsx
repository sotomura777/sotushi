import { useState, useEffect, useMemo } from "react";
import meta from "@conteudo/interacoes/meta.json";
import base from "@conteudo/interacoes/farmacos.json";
import config from "@conteudo/interacoes/regras.json";
import { entradasPesquisa, sugerir, interacoesDoFarmaco, verificarSelecao } from "./logica";
import { Ico } from "@/components/icones";
import { normalizar } from "@/lib/texto";
import "./estilo.css";

const FARMACOS = base.farmacos;
const { regras, tagLabels, duplicacoes, populacoes, niveis, severidades } = config;
const POR_ID = Object.fromEntries(FARMACOS.map((d) => [d.id, d]));
const ENTRADAS = entradasPesquisa(FARMACOS);

const Html = ({ className, html }) => <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;

// Grelha "Cuidados por população" (6 populações, nível com cor semântica).
function Pops({ d }) {
  return (
    <div className="itx-pops">
      {populacoes.map((p) => {
        const v = d[p.k];
        const nv = niveis[v.l] || { l: v.l, c: "a" };
        return (
          <div key={p.k} className="itx-pop">
            <div className={"itx-pop-bar " + nv.c} />
            <div className="itx-pop-body">
              <div className="itx-pop-head">
                <span className="itx-pop-label">{p.l}</span>
                <span className={"itx-pop-badge " + nv.c}>{nv.l}</span>
              </div>
              <Html className="itx-pop-text" html={v.t} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Linha de interação (severidade + parceiro + mecanismo + recomendação).
function Inter({ sev, titulo, mec, mng }) {
  return (
    <div className={"itx-inter " + sev}>
      <div className="itx-inter-h">
        <span className={"itx-sev " + sev}>{severidades[sev].l}</span>
        <span className="itx-partner">{titulo}</span>
      </div>
      <div className="itx-inter-mec">{mec}</div>
      <div className="itx-inter-mng"><b>{meta.microcopy.recomendado}</b> {mng}</div>
    </div>
  );
}

function InterLista({ lista, vazio }) {
  if (!lista.length) return <div className="itx-empty">{vazio}</div>;
  return (
    <div className="itx-inters">
      {lista.map((it, i) => <Inter key={i} sev={it.sev} titulo={it.parceiro} mec={it.mec} mng={it.mng} />)}
    </div>
  );
}

// Linha expansível de um fármaco (consulta e detalhe da seleção).
function LinhaFarmaco({ d, aberto, onToggle, selecionado, onAdd }) {
  const inter = useMemo(() => interacoesDoFarmaco(d, regras, tagLabels, severidades), [d]);
  const marcas = (d.brands || []).join(", ");
  return (
    <div className={"itx-row" + (aberto ? " aberta" : "")}>
      <div className="itx-row-main" onClick={onToggle}>
        <div className="itx-row-info">
          <div className="itx-dci">{d.inn}</div>
          <div className="itx-cls">{d.cls}</div>
          {marcas && <div className="itx-brands">{marcas}</div>}
        </div>
        <div className="itx-row-actions">
          {onAdd && (
            <button
              className={"itx-addbtn" + (selecionado ? " done" : "")}
              onClick={(e) => { e.stopPropagation(); onAdd(); }}
            >
              {selecionado ? "Adicionado ✓" : "+ Verificação"}
            </button>
          )}
          <span className="itx-indicator">▾</span>
        </div>
      </div>
      {aberto && (
        <div className="itx-row-detail">
          <div className="secao-label">{meta.microcopy.cuidadosTitulo}</div>
          <Pops d={d} />
          <div className="secao-label">{meta.microcopy.interacoesTitulo}</div>
          <InterLista lista={inter} vazio={meta.microcopy.semInteracoesFarmaco} />
          <a className="itx-infomed" href={meta.infomed} target="_blank" rel="noopener noreferrer">
            {meta.microcopy.infomedLink} ↗
          </a>
          <div className="itx-infohint">{meta.microcopy.infomedHint} <b>{d.inn}</b></div>
        </div>
      )}
    </div>
  );
}

export default function Interacoes({ accent = "#0e6b6b", gradiente, onVoltar }) {
  const [aba, setAba] = useState("c");
  const [qc, setQc] = useState("");
  const [qi, setQi] = useState("");
  const [sugAberto, setSugAberto] = useState(false);
  const [sel, setSel] = useState([]);
  const [abertos, setAbertos] = useState({});

  useEffect(() => { window.scrollTo({ top: 0 }); }, []); // só ao entrar; mudar de aba não mexe na página

  const filtrados = useMemo(() => {
    const q = normalizar(qc).trim();
    if (!q) return FARMACOS;
    return FARMACOS.filter((d) => normalizar(d.inn + " " + (d.brands || []).join(", ") + " " + d.cls).includes(q));
  }, [qc]);

  const sugestoes = useMemo(() => sugerir(ENTRADAS, qi), [qi]);
  const selecionados = sel.map((id) => POR_ID[id]);
  const resultado = useMemo(
    () => (selecionados.length >= 2 ? verificarSelecao(selecionados, regras, duplicacoes, severidades) : null),
    [sel] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const toggleAberto = (chave) => setAbertos((a) => ({ ...a, [chave]: !a[chave] }));
  const adicionar = (id) => setSel((s) => (s.includes(id) ? s : [...s, id]));
  const remover = (id) => setSel((s) => s.filter((x) => x !== id));
  const escolherSugestao = (id) => { adicionar(id); setQi(""); setSugAberto(false); };

  return (
    <div className="itx" style={{ "--acento": accent }}>
      <header className="hero" style={{ background: gradiente || accent }}>
        <div className="hero-conteudo">
          {onVoltar && <button className="voltar" onClick={onVoltar}>← Início</button>}
          <div className="hero-titulo">{meta.titulo}</div>
          <div className="hero-subtitulo">{meta.subtitulo}</div>
          <div className="itx-stats">
            <div className="itx-stat"><div className="itx-stat-num">{FARMACOS.length}</div><div className="itx-stat-label">Fármacos</div></div>
            <div className="itx-stat"><div className="itx-stat-num">{regras.length}</div><div className="itx-stat-label">Regras de classe</div></div>
            <div className="itx-stat"><div className="itx-stat-num">{populacoes.length}</div><div className="itx-stat-label">Populações</div></div>
          </div>
        </div>
      </header>

      <div className="modulo-corpo">
        <div className="itx-disc">
          <Ico name="warn" s={16} style={{ flexShrink: 0, marginTop: 1 }} />
          <Html html={meta.disclaimer} />
        </div>

        <div className="itx-links">
          {meta.links.map((l) => (
            <a key={l.url + l.titulo} className="itx-lnk" href={l.url} target="_blank" rel="noopener noreferrer">
              {l.titulo} <span className="itx-arr">↗</span>
            </a>
          ))}
          <details className="itx-bib">
            <summary>Bibliografia</summary>
            <Html className="itx-bib-content" html={meta.bibliografia} />
          </details>
        </div>

        <div className="filtros" style={{ margin: "14px 0 8px" }}>
          <button className={"filtro" + (aba === "c" ? " filtro--ativo" : "")} onClick={() => setAba("c")}>Consultar fármaco</button>
          <button className={"filtro" + (aba === "i" ? " filtro--ativo" : "")} onClick={() => setAba("i")}>
            Verificar interações <span className="itx-cnt">{sel.length}</span>
          </button>
        </div>

        {aba === "c" && (
          <section>
            <div className="itx-searchwrap">
              <span className="itx-search-ico"><Ico name="search" s={16} /></span>
              <input className="campo itx-search" value={qc} onChange={(e) => setQc(e.target.value)}
                placeholder="Filtrar fármacos por nome comercial ou DCI…" autoComplete="off" />
            </div>
            {filtrados.length === 0 && <div className="itx-emptylist">Sem resultados para esta pesquisa.</div>}
            {filtrados.map((d) => (
              <LinhaFarmaco key={d.id} d={d} aberto={!!abertos["c" + d.id]} onToggle={() => toggleAberto("c" + d.id)}
                selecionado={sel.includes(d.id)} onAdd={() => adicionar(d.id)} />
            ))}
          </section>
        )}

        {aba === "i" && (
          <section>
            <div className="itx-searchwrap">
              <span className="itx-search-ico"><Ico name="plus" s={16} /></span>
              <input className="campo itx-search" value={qi} autoComplete="off"
                placeholder="Adicionar fármacos para verificar entre si…"
                onChange={(e) => { setQi(e.target.value); setSugAberto(true); }}
                onKeyDown={(e) => { if (e.key === "Enter" && sugestoes.length) escolherSugestao(sugestoes[0].id); }}
                onBlur={() => setTimeout(() => setSugAberto(false), 150)} />
              {sugAberto && sugestoes.length > 0 && (
                <div className="itx-sug">
                  {sugestoes.map((e2, i) => (
                    <div key={i} className="itx-sugit" onMouseDown={(ev) => { ev.preventDefault(); escolherSugestao(e2.id); }}>
                      <span className="itx-sug-nm">{e2.texto}</span>
                      {e2.tipo === "marca" && <span className="itx-sug-mt">{e2.inn}</span>}
                      <span className="itx-sug-pill">{e2.tipo === "marca" ? "marca" : "DCI"}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {sel.length > 0 && (
              <div className="itx-chips">
                {selecionados.map((d) => (
                  <span key={d.id} className="itx-chip">
                    {d.inn}
                    <button title="Remover" onClick={() => remover(d.id)}><Ico name="close" s={11} /></button>
                  </span>
                ))}
              </div>
            )}

            {selecionados.map((d) => (
              <LinhaFarmaco key={d.id} d={d} aberto={!!abertos["i" + d.id]} onToggle={() => toggleAberto("i" + d.id)} />
            ))}

            {!resultado && <div className="itx-hint">{meta.microcopy.hintMin2}</div>}
            {resultado && (
              <>
                <div className="itx-summary">
                  {selecionados.length} fármacos · {resultado.encontradas.length} interação(ões) assinalada(s)
                  {resultado.dups.length > 0 && <> · {resultado.dups.length} duplicação(ões)</>}
                </div>
                {resultado.dups.map((d, i) => (
                  <div key={i} className="itx-dup">
                    <div className="itx-inter-h">
                      <span className="itx-sev dup">{meta.microcopy.duplicacao}</span>
                      <span className="itx-partner">{d.label}</span>
                    </div>
                    <div className="itx-dup-nomes">{d.nomes.join(" + ")}</div>
                  </div>
                ))}
                {resultado.encontradas.length > 0 ? (
                  <div className="itx-inters">
                    {resultado.encontradas.map((f, i) => (
                      <Inter key={i} sev={f.sev} titulo={`${f.a} ↔ ${f.b}`} mec={f.mec} mng={f.mng} />
                    ))}
                  </div>
                ) : resultado.dups.length === 0 && (
                  <div className="itx-empty">{meta.microcopy.semInteracoesCombo}</div>
                )}
              </>
            )}
          </section>
        )}

        <div className="rodape">
          <div className="itx-rodape-aviso">{meta.rodape.aviso}</div>
          <Html className="itx-rodape-refs" html={meta.rodape.referencias} />
          <div>Base: {FARMACOS.length} fármacos {meta.rodape.base}</div>
        </div>
      </div>
    </div>
  );
}
