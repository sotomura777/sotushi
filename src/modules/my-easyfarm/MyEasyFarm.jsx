import { useState, useMemo } from "react";
import EXEMPLOS from "@conteudo/my-easyfarm/exemplos.json";
import { filtrarNotas, novoId, splitCsv, PALETTE } from "./logica";
import { useEstadoLocal } from "@/lib/persistencia";
import { Ico } from "@/components/icones";
import EditorNota from "./EditorNota";
import PainelFiltros from "./PainelFiltros";
import ModalExportar from "./ModalExportar";
import "./estilo.css";

const filtrosVazios = () => ({ indicacoes: new Set(), classes: new Set(), tags: new Set() });

export default function MyEasyFarm({ accent = "#0F766E", gradiente, onVoltar }) {
  const [notes, setNotes] = useEstadoLocal("medguia:my-easyfarm:notas", EXEMPLOS);
  const [recentes, setRecentes] = useEstadoLocal("medguia:my-easyfarm:recentes", []);
  const [query, setQuery] = useState("");
  const [filtros, setFiltros] = useState(filtrosVazios);
  const [editor, setEditor] = useState(null); // null=fechado · {nota} (nota=null → nova)
  const [painel, setPainel] = useState(false);
  const [exportar, setExportar] = useState(false);

  const lista = useMemo(() => filtrarNotas(notes, { query, ...filtros }), [notes, query, filtros]);
  const nFiltros = filtros.indicacoes.size + filtros.classes.size + filtros.tags.size;

  // alterna um valor de filtro (a partir dos chips do cartão / chips ativos)
  const alternarFiltro = (grupo, valor) =>
    setFiltros((f) => {
      const n = { indicacoes: new Set(f.indicacoes), classes: new Set(f.classes), tags: new Set(f.tags) };
      n[grupo].has(valor) ? n[grupo].delete(valor) : n[grupo].add(valor);
      return n;
    });

  const chips = [
    ...[...filtros.indicacoes].map((v) => ({ grupo: "indicacoes", valor: v })),
    ...[...filtros.classes].map((v) => ({ grupo: "classes", valor: v })),
    ...[...filtros.tags].map((v) => ({ grupo: "tags", valor: v })),
  ];

  const guardarNota = (data) => {
    if (editor?.nota) {
      setNotes(notes.map((n) => (n.id === editor.nota.id ? { ...n, ...data, updated: Date.now() } : n)));
    } else {
      setNotes([{ id: novoId(), ...data, updated: Date.now() }, ...notes]);
    }
    setEditor(null);
  };
  const apagarNota = () => {
    if (!editor?.nota) return;
    if (!window.confirm("Apagar esta nota?")) return;
    setNotes(notes.filter((n) => n.id !== editor.nota.id));
    setEditor(null);
  };
  const pushRecent = (c) => {
    if (!c || PALETTE.includes(c)) return;
    setRecentes([c, ...recentes.filter((x) => x !== c)].slice(0, 8));
  };

  return (
    <div className="myef" style={{ "--acento": accent }}>
      <header className="hero" style={{ background: gradiente || accent }}>
        <div className="hero-conteudo">
          {onVoltar && <button className="voltar" onClick={onVoltar}>← Início</button>}
          <div className="hero-titulo">My EasyFarm</div>
          <div className="hero-subtitulo">A tua biblioteca pessoal de doses, esquemas e observações da prática.</div>
        </div>
      </header>

      <div className="modulo-corpo">
        <div className="myef-toolbar">
          <div className="myef-searchwrap">
            <span className="myef-search-ico"><Ico name="search" s={16} /></span>
            <input className="campo myef-search" value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="Procurar fármaco, indicação, dose, nota, tag…" autoComplete="off" />
          </div>
          <button className={"myef-tbtn" + (nFiltros ? " ativo" : "")} onClick={() => setPainel(true)}>
            <Ico name="filtro" s={15} /> Filtrar
            {nFiltros > 0 && <span className="myef-badge">{nFiltros}</span>}
          </button>
          <button className="myef-tbtn" onClick={() => setExportar(true)}>Exportar</button>
          <button className="myef-tbtn myef-add" onClick={() => setEditor({ nota: null })}>
            <span className="myef-add-plus">+</span> Nova nota
          </button>
        </div>

        {chips.length > 0 && (
          <div className="myef-chips">
            {chips.map((c) => (
              <span key={c.grupo + c.valor} className="myef-chip">
                {c.valor}
                <button className="myef-chip-x" onClick={() => alternarFiltro(c.grupo, c.valor)} aria-label="Remover">×</button>
              </span>
            ))}
            <button className="myef-chips-limpar" onClick={() => setFiltros(filtrosVazios())}>Limpar tudo</button>
          </div>
        )}

        <div className="myef-meta">{lista.length} {lista.length === 1 ? "nota" : "notas"}</div>

        {lista.length === 0 ? (
          <div className="myef-empty">
            <Ico name="clipboard" s={40} style={{ opacity: 0.5 }} />
            <div className="myef-empty-title">{notes.length === 0 ? "Sem notas ainda" : "Sem resultados"}</div>
            <div className="myef-empty-sub">{notes.length === 0 ? "Cria a primeira nota com o esquema que mais usas." : "Tenta outra pesquisa ou limpa os filtros."}</div>
          </div>
        ) : (
          <div className="myef-list">
            {lista.map((n) => {
              const inds = splitCsv(n.indication);
              const cls = splitCsv(n.classes);
              return (
                <div key={n.id} className="myef-card" style={{ "--cc": n.color }}
                  onClick={(e) => { if (!e.target.closest(".myef-chip-tog")) setEditor({ nota: n }); }}>
                  <div className="myef-card-head">
                    <div>
                      <div className="myef-card-name">{n.name}</div>
                      {n.brands && <div className="myef-card-brands">{n.brands}</div>}
                    </div>
                    {inds.length > 0 && (
                      <div className="myef-card-inds">
                        {inds.map((i) => (
                          <span key={i} className={"myef-chip-tog myef-ind" + (filtros.indicacoes.has(i) ? " active" : "")}
                            onClick={() => alternarFiltro("indicacoes", i)}>{i}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  {cls.length > 0 && (
                    <div className="myef-card-cls">
                      {cls.map((c) => (
                        <span key={c} className={"myef-chip-tog myef-cls" + (filtros.classes.has(c) ? " active" : "")}
                          onClick={() => alternarFiltro("classes", c)}>{c}</span>
                      ))}
                    </div>
                  )}
                  {n.dose && <div className="myef-card-dose">{n.dose}</div>}
                  {n.clinical && <div className="myef-card-clinical">{n.clinical}</div>}
                  {n.tags && n.tags.length > 0 && (
                    <div className="myef-card-tags">
                      {n.tags.map((t) => (
                        <span key={t} className={"myef-chip-tog myef-tag" + (filtros.tags.has(t) ? " active" : "")}
                          onClick={() => alternarFiltro("tags", t)}>{t}</span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <PainelFiltros notes={notes} aberto={painel} filtros={filtros}
        onAplicar={(f) => { setFiltros(f); setPainel(false); }} onClose={() => setPainel(false)} />

      {editor && (
        <EditorNota nota={editor.nota} notes={notes} recentes={recentes} onPushRecent={pushRecent}
          onSave={guardarNota} onApagar={apagarNota} onClose={() => setEditor(null)} />
      )}

      {exportar && <ModalExportar notes={notes} onClose={() => setExportar(false)} />}
    </div>
  );
}
