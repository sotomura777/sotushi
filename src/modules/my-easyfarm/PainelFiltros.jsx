import { useState, useEffect, useMemo } from "react";
import { contagens } from "./logica";

const clonar = (f) => ({ indicacoes: new Set(f.indicacoes), classes: new Set(f.classes), tags: new Set(f.tags) });

// Slide-over de filtros (porte de renderFilterPanel): 3 grupos com contagens,
// pesquisa de tag, rascunho independente aplicado no "Aplicar".
export default function PainelFiltros({ notes, aberto, filtros, onAplicar, onClose }) {
  const [draft, setDraft] = useState(() => clonar(filtros));
  const [busca, setBusca] = useState("");

  useEffect(() => {
    if (aberto) { setDraft(clonar(filtros)); setBusca(""); }
  }, [aberto]); // eslint-disable-line react-hooks/exhaustive-deps

  const grupos = useMemo(() => [
    { key: "indicacoes", title: "Indicações", items: contagens(notes, "indication") },
    { key: "classes", title: "Classes farmacológicas", items: contagens(notes, "classes") },
    { key: "tags", title: "Tags", items: contagens(notes, "tags", true) },
  ], [notes]);

  const q = busca.trim().toLowerCase();
  const filtrados = grupos.map((g) => ({ ...g, items: q ? g.items.filter(([v]) => v.toLowerCase().includes(q)) : g.items }));
  const totalItems = grupos.reduce((s, g) => s + g.items.length, 0);
  const algum = filtrados.some((g) => g.items.length > 0);

  const alternar = (key, val) =>
    setDraft((d) => {
      const n = clonar(d);
      n[key].has(val) ? n[key].delete(val) : n[key].add(val);
      return n;
    });
  const limpar = () => setDraft({ indicacoes: new Set(), classes: new Set(), tags: new Set() });

  return (
    <>
      <div className={"myef-overlay" + (aberto ? " open" : "")} onClick={onClose} />
      <aside className={"myef-panel" + (aberto ? " open" : "")} role="dialog" aria-label="Filtros">
        <div className="myef-fp-head">
          <div className="myef-fp-title">Filtros</div>
          <button className="myef-fp-close" onClick={onClose} aria-label="Fechar">×</button>
        </div>
        <div className="myef-fp-searchwrap">
          <input className="campo" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Pesquisar tag…" />
        </div>
        <div className="myef-fp-body">
          {!totalItems ? (
            <div className="myef-fp-empty">Ainda não tens nada para filtrar. Adiciona indicações, classes ou tags às tuas notas.</div>
          ) : !algum ? (
            <div className="myef-fp-empty">Sem resultados para “{busca.trim()}”.</div>
          ) : (
            filtrados.map((g) => g.items.length > 0 && (
              <div key={g.key} className="myef-fp-group">
                <div className="myef-fp-group-head">
                  <div className="myef-fp-group-title">{g.title}</div>
                  {draft[g.key].size > 0 && <div className="myef-fp-group-count">{draft[g.key].size} selec.</div>}
                </div>
                <div className="myef-fp-options">
                  {g.items.map(([v, c]) => (
                    <div key={v} className={"myef-fp-option" + (draft[g.key].has(v) ? " checked" : "")} onClick={() => alternar(g.key, v)}>
                      <span className="myef-fp-check" />
                      <span className="myef-fp-opt-label">{v}</span>
                      <span className="myef-fp-opt-count">{c}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
        <div className="myef-fp-foot">
          <button className="myef-fp-btn sec" onClick={limpar}>Limpar</button>
          <button className="myef-fp-btn pri" onClick={() => onAplicar(draft)}>Aplicar</button>
        </div>
      </aside>
    </>
  );
}
