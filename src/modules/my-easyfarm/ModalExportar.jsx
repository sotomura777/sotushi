import { useState, useMemo } from "react";
import { gerarWordHtml, gerarExcelHtml, descarregar } from "./logica";
import { toast, useEscape } from "@/lib/toast";

const hoje = () => new Date().toISOString().slice(0, 10);

// Modal de exportação: escolher notas, tipo (Word/Excel), detalhe (compacto/completo),
// gerar ficheiro Office, ou exportar JSON de backup.
export default function ModalExportar({ notes, onClose }) {
  const [sel, setSel] = useState(() => new Set(notes.map((n) => n.id)));
  const [modo, setModo] = useState("compact");
  const [tipo, setTipo] = useState("word");
  const [busca, setBusca] = useState("");

  useEscape(onClose);

  const q = busca.trim().toLowerCase();
  const visiveis = useMemo(
    () => notes.filter((n) => !q || [n.name, n.brands, n.indication].join(" ").toLowerCase().includes(q)),
    [notes, q]
  );

  const alternar = (id) => setSel((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const todosVisiveisSel = visiveis.length > 0 && visiveis.every((n) => sel.has(n.id));
  const selecionarTodos = () =>
    setSel((s) => {
      const n = new Set(s);
      if (todosVisiveisSel) visiveis.forEach((x) => n.delete(x.id));
      else visiveis.forEach((x) => n.add(x.id));
      return n;
    });

  const gerar = () => {
    const escolhidas = notes.filter((n) => sel.has(n.id));
    if (!escolhidas.length) { toast("Seleciona pelo menos um fármaco"); return; }
    const agora = Date.now();
    if (tipo === "excel") {
      descarregar(gerarExcelHtml(escolhidas, modo, agora), `apontamentos-${hoje()}.xls`, "application/vnd.ms-excel");
      toast("Excel gerado");
    } else {
      descarregar(gerarWordHtml(escolhidas, modo, agora), `apontamentos-${hoje()}.doc`, "application/msword");
      toast("Word gerado");
    }
    onClose();
  };

  const exportarJSON = () => {
    descarregar(JSON.stringify(notes, null, 2), `notas-clinicas-${hoje()}.json`, "application/json");
    toast("JSON exportado");
  };

  return (
    <div className="myef-modal-backdrop" onClick={(e) => { if (e.target.classList.contains("myef-modal-backdrop")) onClose(); }}>
      <div className="myef-modal" role="dialog" aria-label="Exportar">
        <div className="myef-modal-header">
          <div className="myef-modal-title">Exportar</div>
          <button className="myef-modal-close" onClick={onClose} aria-label="Fechar">×</button>
        </div>

        <div className="myef-modal-body myef-exp-body">
          <div className="myef-exp-section">
            <div className="myef-exp-section-title">
              Escolher fármacos {sel.size > 0 && <span className="myef-exp-badge">{sel.size} de {notes.length} selecionados</span>}
            </div>
            <div className="myef-exp-toolbar">
              <input className="campo" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Pesquisar pelo nome…" />
              <button className="myef-exp-selall" onClick={selecionarTodos}>{todosVisiveisSel ? "Desmarcar todos" : "Selecionar todos"}</button>
            </div>
            <div className="myef-exp-list">
              {visiveis.length === 0 ? (
                <div className="myef-exp-empty">Sem resultados para “{busca.trim()}”.</div>
              ) : (
                visiveis.map((n) => (
                  <div key={n.id} className={"myef-exp-item" + (sel.has(n.id) ? " checked" : "")} onClick={() => alternar(n.id)}>
                    <span className="myef-exp-color" style={{ background: n.color }} />
                    <span className="myef-fp-check" />
                    <div className="myef-exp-text">
                      <div className="myef-exp-name">{n.name}</div>
                      {n.indication && <div className="myef-exp-meta">{n.indication}</div>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="myef-exp-section">
            <div className="myef-exp-section-title">Tipo de ficheiro</div>
            <div className="myef-exp-modes">
              <button className={"myef-exp-mode" + (tipo === "word" ? " active" : "")} onClick={() => setTipo("word")}>
                <div className="myef-exp-mode-title">Word</div>
                <div className="myef-exp-mode-desc">Editável, fácil de partilhar e imprimir.</div>
              </button>
              <button className={"myef-exp-mode" + (tipo === "excel" ? " active" : "")} onClick={() => setTipo("excel")}>
                <div className="myef-exp-mode-title">Excel</div>
                <div className="myef-exp-mode-desc">Tabela ordenável, ideal para listas longas.</div>
              </button>
            </div>
          </div>

          <div className="myef-exp-section">
            <div className="myef-exp-section-title">Detalhe</div>
            <div className="myef-exp-modes">
              <button className={"myef-exp-mode" + (modo === "compact" ? " active" : "")} onClick={() => setModo("compact")}>
                <div className="myef-exp-mode-title">Compacto</div>
                <div className="myef-exp-mode-desc">Nome, indicações e dose.</div>
              </button>
              <button className={"myef-exp-mode" + (modo === "full" ? " active" : "")} onClick={() => setModo("full")}>
                <div className="myef-exp-mode-title">Completo</div>
                <div className="myef-exp-mode-desc">Inclui marcas, classes, notas e tags.</div>
              </button>
            </div>
          </div>
        </div>

        <div className="myef-modal-footer">
          <button className="myef-exp-json" onClick={exportarJSON}>Exportar JSON (backup)</button>
          <div className="myef-btn-right">
            <button className="myef-btn-cancel" onClick={onClose}>Cancelar</button>
            <button className="myef-btn-primary" onClick={gerar}>{tipo === "excel" ? "Gerar Excel" : "Gerar Word"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
