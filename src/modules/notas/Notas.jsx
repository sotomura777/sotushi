import { useState, useMemo, useEffect } from "react";
import config from "@conteudo/notas/config.json";
import {
  paraIniciais, uid, hojeISO, fmtData, fmtRelativo,
  temSequenciaNumerica, criarNota, ordenarNotas, agruparPorData,
} from "./logica";
import { I, Ico } from "@/components/icones";
import "./estilo.css";

const TABS_DEFAULT = config.separadores_padrao;
const CORES = config.cores;
const ESPECIALIDADES = config.especialidades;
const PRIORIDADES = config.prioridades;

const espInfo = (id) => ESPECIALIDADES.find((e) => e.id === id) || { label: "—", color: "var(--suave)", bg: "var(--superficie-2)" };
const prioInfo = (id) => PRIORIDADES.find((p) => p.id === id);

const KIND = {
  rosa: { cor: "#E8735A", label: "Nota" },
  antigo: { cor: "#BA7517", label: "Diário anterior" },
};
const VERDE = "#16a34a";
const agora = () => new Date().toISOString();

// ───────────────────────── Cartão de nota ─────────────────────────
function NotaCard({ nota, tab, onUpdate, onApagar, onCopiar }) {
  const rosa = nota.kind === "rosa";
  const antigo = nota.kind === "antigo";
  const cor = rosa ? KIND.rosa.cor : antigo ? KIND.antigo.cor : tab?.color || "#0F6E56";
  const label = rosa ? KIND.rosa.label : antigo ? KIND.antigo.label : tab?.label || "Diário";
  const aviso = temSequenciaNumerica(nota.texto);
  const editado = nota.atualizadoEm && nota.atualizadoEm !== nota.criadoEm;
  return (
    <div className="nt-nota" style={{ borderLeft: `3px solid ${cor}` }}>
      <div className="nt-nota-cab" style={{ background: `${cor}14` }}>
        <span className="nt-nota-kind" style={{ color: cor }}>{label}</span>
        {!rosa && !antigo && (
          <button
            className="nt-feito"
            title={nota.feito ? "Marcar como não feito" : "Marcar como feito"}
            style={{ borderColor: nota.feito ? VERDE : "var(--tenue)", background: nota.feito ? VERDE : "var(--superficie)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
            onClick={() => onUpdate({ ...nota, feito: !nota.feito, atualizadoEm: agora() })}
          >
            {nota.feito && I.check("#fff", 10)}
          </button>
        )}
        {antigo ? (
          <input type="date" value={nota.data} onChange={(e) => onUpdate({ ...nota, data: e.target.value })} className="campo" style={{ width: "auto", padding: "2px 6px", fontSize: 11, background: "transparent" }} />
        ) : (
          <span className="nt-nota-data" style={{ color: cor }}>{fmtData(nota.data)}</span>
        )}
        <span style={{ flex: 1 }} />
        {editado && <span className="nt-nota-edit">editado {fmtRelativo(nota.atualizadoEm)}</span>}
        {!rosa && !antigo && onCopiar && <button className="nt-nota-acao" onClick={onCopiar}>Copiar</button>}
        <button className="nt-nota-acao" onClick={onApagar} aria-label="Apagar nota">{I.close("currentColor", 13)}</button>
      </div>
      {aviso && <div className="nt-aviso-num"><Ico name="warn" s={12} /> Sequência numérica detetada — não inserir identificadores de doente.</div>}
      <textarea
        className="nt-textarea"
        value={nota.texto}
        placeholder="Escrever…"
        onChange={(e) => onUpdate({ ...nota, texto: e.target.value, atualizadoEm: agora() })}
        rows={Math.max(5, (nota.texto || "").split("\n").length + 1)}
      />
    </div>
  );
}

// ───────────────────────── Painel de tarefas ─────────────────────────
function PainelTarefas({ itens = [], onChange, accent }) {
  const [aberto, setAberto] = useState(false);
  const [txt, setTxt] = useState("");
  const feitas = itens.filter((i) => i.feito).length;
  const add = () => { const t = txt.trim(); if (!t) return; onChange([...itens, { id: uid(), texto: t, feito: false }]); setTxt(""); };
  return (
    <div className="cartao nt-todo" style={{ padding: 0, overflow: "hidden", marginBottom: 12 }}>
      <button className="nt-todo-cab" onClick={() => setAberto((v) => !v)}>
        <Ico name="checkCircle" c={VERDE} s={16} />
        <span style={{ fontWeight: 700, color: accent }}>Lista de tarefas</span>
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: 12, color: "var(--tenue)" }}>{feitas}/{itens.length}</span>
        <span style={{ color: "var(--suave)", fontSize: 12 }}>{aberto ? "▴" : "▾"}</span>
      </button>
      {aberto && (
        <div style={{ padding: "0 14px 12px" }}>
          {itens.length === 0 && <div style={{ fontSize: 12.5, color: "var(--tenue)", paddingBottom: 8 }}>Sem tarefas neste separador.</div>}
          {itens.map((i) => (
            <div key={i.id} className="nt-todo-item">
              <button className="nt-todo-check" style={{ borderColor: i.feito ? VERDE : "var(--tenue)", background: i.feito ? VERDE : "var(--superficie)", display: "inline-flex", alignItems: "center", justifyContent: "center" }} onClick={() => onChange(itens.map((x) => (x.id === i.id ? { ...x, feito: !x.feito } : x)))}>
                {i.feito && I.check("#fff", 11)}
              </button>
              <span className={"nt-todo-txt" + (i.feito ? " feito" : "")}>{i.texto}</span>
              <button className="nt-nota-acao" onClick={() => onChange(itens.filter((x) => x.id !== i.id))} aria-label="Apagar tarefa">{I.close("currentColor", 12)}</button>
            </div>
          ))}
          <div className="nt-todo-add">
            <input className="campo" placeholder="Nova tarefa…" value={txt} onChange={(e) => setTxt(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} />
            <button className="nt-acao" style={{ borderColor: accent, color: accent }} onClick={add}>+ Tarefa</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ───────────────────────── Cartão de doente (lista — ecrã estreito) ───────────
function CartaoDoente({ p, onSelect, onVisto, onAlta, onEditar }) {
  const ei = espInfo(p.especialidade);
  const pi = p.especialidade === "urgencia" && p.prioridade ? prioInfo(p.prioridade) : null;
  const ultima = Object.values(p.notas || {}).flat().reduce((acc, n) => { const t = n.atualizadoEm || n.criadoEm || ""; return t > acc ? t : acc; }, "");
  return (
    <div className={"nt-card" + (p.observado ? " nt-card--obs" : "")} onClick={onSelect}>
      <div className="nt-card-bar" style={{ background: ei.color }} />
      <div className="nt-card-corpo">
        <div className="nt-card-info">
          <div className="nt-card-linha1">
            <button className="nt-editar" onClick={(e) => { e.stopPropagation(); onEditar(p); }}>Editar</button>
            {pi && <span className="nt-prio-dot" style={{ background: pi.color }} title={pi.label} />}
            <span className="nt-card-iniciais" style={p.observado === "alta" ? { color: "#993C1D" } : undefined}>{p.iniciais}</span>
          </div>
          <div className="nt-card-tags">
            <span className="nt-esp" style={{ background: ei.bg, color: ei.color }}>{ei.label}</span>
            <span className="nt-meta">Int. {fmtData(p.criadoEm)}</span>
          </div>
          {ultima && <div className="nt-meta" style={{ marginTop: 3 }}>Última edição {fmtRelativo(ultima)}</div>}
          {p.apoio && <div className="nt-linha-mini" style={{ color: "#7C3AED" }}><span className="nt-mini-dot" style={{ background: "#7C3AED" }} />{p.apoio}</div>}
          {p.alergias && <div className="nt-linha-mini" style={{ color: "#E8735A" }}><span className="nt-mini-dot" style={{ background: "#E8735A" }} />Alergias: {p.alergias}</div>}
        </div>
        <div className="nt-card-acoes" onClick={(e) => e.stopPropagation()}>
          <button className="nt-chip" style={p.observado === true ? { background: "#E1F5EE", color: "#0F6E56" } : undefined} onClick={() => onVisto(p.id)}><Ico name="check" s={11} /> Visto</button>
          <button className="nt-chip" style={p.observado === "alta" ? { background: "#FAECE7", color: "#993C1D" } : undefined} onClick={() => onAlta(p.id)}>Alta</button>
        </div>
      </div>
    </div>
  );
}

// ───────────────────────── Linha de doente (barra lateral — ecrã largo) ──────
function PatientRow({ p, ativo, onSelect }) {
  const ei = espInfo(p.especialidade);
  const pi = p.especialidade === "urgencia" && p.prioridade ? prioInfo(p.prioridade) : null;
  return (
    <div className={"nt-row" + (ativo ? " on" : "") + (p.observado ? " nt-row--obs" : "")} onClick={onSelect}>
      <span className="nt-row-dot" style={{ background: ei.color }} />
      <span className="nt-row-ini" style={p.observado === "alta" ? { color: "#993C1D" } : undefined}>{p.iniciais}</span>
      {pi && <span className="nt-prio-dot" style={{ background: pi.color, width: 10, height: 10 }} title={pi.label} />}
      <span style={{ flex: 1 }} />
      <span className="nt-row-esp" style={{ color: ei.color }}>{ei.label}</span>
    </div>
  );
}

// ───────────────────────── Formulário de doente ─────────────────────────
function FormDoente({ inicial, onGuardar, onCancelar, accent }) {
  const editar = !!inicial;
  const [nome, setNome] = useState("");
  const [esp, setEsp] = useState(inicial?.especialidade || ESPECIALIDADES[0].id);
  const [prio, setPrio] = useState(inicial?.prioridade || "green");
  const [alergias, setAlergias] = useState(inicial?.alergias || "");
  const [apoio, setApoio] = useState(inicial?.apoio || "");
  const iniciaisPrev = paraIniciais(nome) || (editar ? inicial.iniciais : "");
  const podeGuardar = editar || !!paraIniciais(nome);
  const guardar = () => {
    if (!podeGuardar) return;
    onGuardar({
      iniciais: paraIniciais(nome) || inicial.iniciais,
      especialidade: esp,
      prioridade: esp === "urgencia" ? prio : null,
      alergias: alergias.trim(),
      apoio: apoio.trim(),
    });
  };
  return (
    <div className="cartao" style={{ padding: 14, marginBottom: 14 }}>
      <div className="secao-label">{editar ? "Editar doente" : "Novo doente"}</div>
      <input className="campo" style={{ marginBottom: 8 }} placeholder={editar ? `Novo nome (atual: ${inicial.iniciais})` : "Nome (será convertido em iniciais)"} value={nome} onChange={(e) => setNome(e.target.value)} />
      {(nome || editar) && <div style={{ fontSize: 12, color: "var(--suave)", marginBottom: 8 }}>Guardado como: <strong style={{ color: accent }}>{iniciaisPrev || "—"}</strong></div>}
      <select className="campo" style={{ marginBottom: 8 }} value={esp} onChange={(e) => setEsp(e.target.value)}>
        {ESPECIALIDADES.map((e) => <option key={e.id} value={e.id}>{e.label}</option>)}
      </select>
      {esp === "urgencia" && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
          {PRIORIDADES.map((pr) => (
            <button key={pr.id} className={"nt-prio" + (prio === pr.id ? " on" : "")} style={prio === pr.id ? { background: pr.bg, color: pr.color, borderColor: pr.color } : undefined} onClick={() => setPrio(pr.id)}>{pr.label}</button>
          ))}
        </div>
      )}
      <input className="campo" style={{ marginBottom: 8 }} placeholder="Alergias (opcional)" value={alergias} onChange={(e) => setAlergias(e.target.value)} />
      <input className="campo" style={{ marginBottom: 10 }} placeholder="Nota de apoio (opcional)" value={apoio} onChange={(e) => setApoio(e.target.value)} />
      <div style={{ display: "flex", gap: 8 }}>
        <button className="nt-nova" style={{ background: accent, flex: 1 }} onClick={guardar} disabled={!podeGuardar}>{editar ? "Guardar alterações" : "+ Adicionar doente"}</button>
        <button className="nt-acao" onClick={onCancelar}>Cancelar</button>
      </div>
    </div>
  );
}

// ───────────────────────── Modal genérico ─────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div className="nt-modal" onClick={onClose}>
      <div className="nt-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="nt-modal-head">
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--texto)" }}>{title}</h3>
          <button className="nt-modal-x" onClick={onClose} aria-label="Fechar">{I.close("currentColor", 18)}</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ───────────────────────── Gestor de separadores ─────────────────────────
function GestorSeparadores({ tabs, onFechar, onGuardar, accent }) {
  const [lista, setLista] = useState(tabs.map((t) => ({ ...t })));
  const [edit, setEdit] = useState(null);
  const [novo, setNovo] = useState(null);
  const mover = (i, d) => setLista((l) => { const a = [...l]; const j = i + d; if (j < 0 || j >= a.length) return a; [a[i], a[j]] = [a[j], a[i]]; return a; });
  const Swatches = ({ sel, onPick }) => (
    <div className="nt-swatches">
      {CORES.map((c) => (
        <button key={c.color} className="nt-swatch" style={{ background: c.color, outline: sel === c.color ? "3px solid rgba(0,0,0,.35)" : "none" }} onClick={() => onPick(c.color, c.bg)} aria-label="Escolher cor" />
      ))}
    </div>
  );

  if (edit !== null) {
    const t = lista[edit];
    const set = (k, v) => setLista((l) => l.map((x, j) => (j === edit ? { ...x, [k]: v } : x)));
    return (
      <Modal title="Editar separador" onClose={() => setEdit(null)}>
        <div className="secao-label">Nome</div>
        <input className="campo" style={{ marginBottom: 12 }} value={t.label} onChange={(e) => set("label", e.target.value)} />
        <div className="secao-label">Cor</div>
        <Swatches sel={t.color} onPick={(color, bg) => setLista((l) => l.map((x, j) => (j === edit ? { ...x, color, bg } : x)))} />
        <div className="secao-label" style={{ marginTop: 12 }}>Template <span style={{ fontWeight: 400, textTransform: "none", color: "var(--tenue)" }}>(usa [DATA] para a data)</span></div>
        <textarea className="nt-textarea" style={{ border: "1px solid var(--borda)", borderRadius: 8, minHeight: 200, marginBottom: 12 }} value={t.template || ""} onChange={(e) => set("template", e.target.value)} />
        <button className="nt-nova" style={{ background: accent }} onClick={() => setEdit(null)}>OK</button>
      </Modal>
    );
  }
  if (novo) {
    return (
      <Modal title="Novo separador" onClose={() => setNovo(null)}>
        <div className="secao-label">Nome</div>
        <input className="campo" style={{ marginBottom: 12 }} placeholder="Ex.: Evolução" value={novo.label} onChange={(e) => setNovo({ ...novo, label: e.target.value })} />
        <div className="secao-label">Cor</div>
        <Swatches sel={novo.color} onPick={(color, bg) => setNovo({ ...novo, color, bg })} />
        <div className="secao-label" style={{ marginTop: 12 }}>Template (opcional)</div>
        <textarea className="nt-textarea" style={{ border: "1px solid var(--borda)", borderRadius: 8, minHeight: 140, marginBottom: 12 }} value={novo.template} onChange={(e) => setNovo({ ...novo, template: e.target.value })} />
        <div style={{ display: "flex", gap: 8 }}>
          <button className="nt-acao" onClick={() => setNovo(null)}>Cancelar</button>
          <button className="nt-nova" style={{ background: accent, flex: 1 }} disabled={!novo.label.trim()} onClick={() => { setLista((l) => [...l, { id: uid(), label: novo.label.trim(), color: novo.color, bg: novo.bg, template: novo.template, isDefault: false }]); setNovo(null); }}>Adicionar</button>
        </div>
      </Modal>
    );
  }
  return (
    <Modal title="Separadores e templates" onClose={onFechar}>
      <p style={{ fontSize: 12, color: "var(--suave)", marginBottom: 12 }}>Cada separador tem o seu template. Usa <b>[DATA]</b> para a data automática.</p>
      {lista.map((t, i) => (
        <div key={t.id} className="nt-tab-row" style={{ borderColor: t.color + "55" }}>
          <span className="nt-mini-dot" style={{ background: t.color, width: 10, height: 10 }} />
          <span style={{ flex: 1, fontWeight: 600, color: "var(--texto)" }}>{t.label}</span>
          <button className="nt-nota-acao" onClick={() => mover(i, -1)} disabled={i === 0}>↑</button>
          <button className="nt-nota-acao" onClick={() => mover(i, 1)} disabled={i === lista.length - 1}>↓</button>
          <button className="nt-nota-acao" onClick={() => setEdit(i)}>Editar</button>
          {!t.isDefault && <button className="nt-nota-acao" style={{ color: "#b91c1c" }} onClick={() => setLista((l) => l.filter((_, j) => j !== i))}>Apagar</button>}
        </div>
      ))}
      <button className="nt-acao" style={{ marginTop: 10, borderColor: accent, color: accent }} onClick={() => setNovo({ label: "", color: CORES[3].color, bg: CORES[3].bg, template: "" })}>+ Novo separador</button>
      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <button className="nt-acao" onClick={onFechar}>Cancelar</button>
        <button className="nt-nova" style={{ background: accent, flex: 1 }} onClick={() => onGuardar(lista)}>Guardar</button>
      </div>
    </Modal>
  );
}

// ════════════════════════════ Módulo ════════════════════════════
export default function Notas({ accent = "#475569", gradiente, onVoltar }) {
  const [doentes, setDoentes] = useState([]);
  const [view, setView] = useState("list"); // usado só em ecrã estreito
  const [selId, setSelId] = useState(null);
  const [sidebarView, setSidebarView] = useState("doentes");
  const [aba, setAba] = useState("diario");
  const [tabs, setTabs] = useState(TABS_DEFAULT);
  const [busca, setBusca] = useState("");
  const [query, setQuery] = useState("");
  const [fixadaId, setFixadaId] = useState(null);
  const [adicionar, setAdicionar] = useState(false);
  const [editId, setEditId] = useState(null);
  const [gerir, setGerir] = useState(false);
  const [largo, setLargo] = useState(typeof window !== "undefined" && window.innerWidth >= 800);

  useEffect(() => {
    const h = () => setLargo(window.innerWidth >= 800);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  const sel = doentes.find((d) => d.id === selId);
  const tab = tabs.find((t) => t.id === aba) || tabs[0];

  const patch = (id, fn) => setDoentes((ds) => ds.map((d) => (d.id === id ? fn(d) : d)));
  const patchNotas = (id, t, fn) => patch(id, (d) => ({ ...d, notas: { ...d.notas, [t]: fn(d.notas[t] || []) } }));

  function criarDoente(dados) {
    setDoentes((ds) => [{ id: uid(), ...dados, observado: false, criadoEm: hojeISO(), notas: {}, tarefas: {} }, ...ds]);
    setAdicionar(false);
  }
  const guardarEdicao = (dados) => { patch(editId, (d) => ({ ...d, ...dados })); setEditId(null); };
  const setVisto = (id) => patch(id, (d) => ({ ...d, observado: d.observado === true ? false : true }));
  const setAlta = (id) => patch(id, (d) => ({ ...d, observado: d.observado === "alta" ? false : "alta" }));
  const setPrioridade = (id, pid) => patch(id, (d) => ({ ...d, prioridade: pid }));
  const apagarDoente = (id) => { setDoentes((ds) => ds.filter((d) => d.id !== id)); setView("list"); setSelId(null); };

  const abrir = (p) => { setSelId(p.id); setAba(tabs[0]?.id || "diario"); setQuery(""); setFixadaId(null); setEditId(null); setAdicionar(false); setView("patient"); };

  const notasTab = sel ? sel.notas[aba] || [] : [];
  const ordenadas = useMemo(() => ordenarNotas(notasTab, fixadaId, query), [notasTab, fixadaId, query]);
  const grupos = useMemo(() => agruparPorData(ordenadas), [ordenadas]);

  const addComTemplate = () => { const tpl = (tab.template || "").replace(/\[DATA\]/g, fmtData(hojeISO())); patchNotas(selId, aba, (arr) => [criarNota("normal", tpl), ...arr]); };
  const copiarAnterior = () => { const prev = ordenarNotas(sel.notas[aba] || [], null, "")[0]; patchNotas(selId, aba, (arr) => [criarNota("normal", prev ? prev.texto : ""), ...arr]); };
  const addRosa = () => { const n = criarNota("rosa", ""); patchNotas(selId, aba, (arr) => [n, ...arr]); setFixadaId(n.id); };
  const addAntigo = () => patchNotas(selId, aba, (arr) => [criarNota("antigo", ""), ...arr]);
  const updateNota = (n) => patchNotas(selId, aba, (arr) => arr.map((x) => (x.id === n.id ? n : x)));
  const apagarNota = (nid) => patchNotas(selId, aba, (arr) => arr.filter((x) => x.id !== nid));
  const setTarefas = (itens) => patch(selId, (d) => ({ ...d, tarefas: { ...d.tarefas, [aba]: itens } }));
  const saveTabs = (nova) => { setTabs(nova); if (!nova.find((t) => t.id === aba)) setAba(nova[0]?.id || "diario"); setGerir(false); };

  // Listas derivadas
  const filtrados = doentes.filter((d) => !busca.trim() || d.iniciais.toLowerCase().includes(busca.toLowerCase()));
  const ativos = filtrados.filter((d) => d.observado === false);
  const urgencia = ativos.filter((d) => d.especialidade === "urgencia");
  const internados = ativos.filter((d) => d.especialidade !== "urgencia");
  const fora = filtrados.filter((d) => d.observado !== false);
  const porEspecialidade = ESPECIALIDADES.map((e) => ({ ...e, pts: ativos.filter((d) => d.especialidade === e.id) })).filter((s) => s.pts.length > 0);

  const grupoCards = (label, lista, cor) => lista.length > 0 && (
    <div className="nt-grupo" key={label}>
      <div className="nt-grupo-label" style={cor ? { color: cor } : undefined}>{label} · {lista.length}</div>
      <div className="nt-grid">
        {lista.map((p) => <CartaoDoente key={p.id} p={p} onSelect={() => abrir(p)} onVisto={setVisto} onAlta={setAlta} onEditar={(pat) => { setAdicionar(false); setEditId(pat.id); }} />)}
      </div>
    </div>
  );
  const grupoRows = (label, lista, cor) => lista.length > 0 && (
    <div className="nt-grupo" key={label}>
      <div className="nt-grupo-label" style={cor ? { color: cor } : undefined}>{label} · {lista.length}</div>
      {lista.map((p) => <PatientRow key={p.id} p={p} ativo={p.id === selId} onSelect={() => abrir(p)} />)}
    </div>
  );
  const grupos2 = (G) => (
    sidebarView === "doentes"
      ? <>{G("Urgência", urgencia, "#8B1A3A")}{G("Internados", internados)}{G("Vistos / Altas", fora)}</>
      : porEspecialidade.map((s) => G(s.label, s.pts, s.color))
  );

  const segToggle = (
    <div className="nt-seg">
      {[["doentes", "Doentes"], ["especialidade", "Especialidade"]].map(([v, l]) => (
        <button key={v} className={"nt-seg-btn" + (sidebarView === v ? " on" : "")} onClick={() => setSidebarView(v)}>{l}</button>
      ))}
    </div>
  );

  const formAtual = adicionar
    ? <FormDoente accent={accent} onGuardar={criarDoente} onCancelar={() => setAdicionar(false)} />
    : editId && doentes.find((d) => d.id === editId)
    ? <FormDoente inicial={doentes.find((d) => d.id === editId)} accent={accent} onGuardar={guardarEdicao} onCancelar={() => setEditId(null)} />
    : null;

  const aviso = (
    <div className="nt-aviso">
      <Ico name="lock" s={13} /> <strong>Pré-visualização.</strong> Nada é guardado ainda. Insere <strong>apenas iniciais</strong>; o nome é convertido automaticamente e nunca é guardado. Não inserir dados reais de doentes.
    </div>
  );

  const heroBack = !largo && view === "patient" ? () => setView("list") : onVoltar;
  const hero = (
    <header className="hero" style={{ background: gradiente || accent }}>
      <div className="hero-conteudo">
        <button className="voltar" onClick={heroBack}>← {!largo && view === "patient" ? "Doentes" : "Início"}</button>
        <div className="hero-titulo">Notas Clínicas</div>
        <div className="hero-subtitulo">{largo ? "Lista + notas · só iniciais" : view === "patient" ? "Notas por separador · só iniciais" : "Lista de doentes · só iniciais"}</div>
      </div>
    </header>
  );

  // ── Detalhe do doente (cabeçalho + separadores + notas + tarefas) ──
  const isDiario = aba === "diario";
  const detalhe = sel && (() => {
    const ei = espInfo(sel.especialidade);
    const pi = sel.especialidade === "urgencia" && sel.prioridade ? prioInfo(sel.prioridade) : null;
    return (
      <>
        <div className="cartao" style={{ padding: 14, marginBottom: 12, display: "flex", alignItems: "center", gap: 12 }}>
          <span className="nt-iniciais" style={{ background: ei.bg, color: ei.color }}>{sel.iniciais}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {sel.especialidade === "urgencia" && (
                <span style={{ display: "inline-flex", gap: 5 }}>
                  {PRIORIDADES.map((pr) => (
                    <button key={pr.id} title={pr.label} onClick={() => setPrioridade(sel.id, pr.id)} style={{ width: 15, height: 15, borderRadius: "50%", cursor: "pointer", padding: 0, background: sel.prioridade === pr.id ? pr.color : "transparent", border: `2px solid ${pr.color}` }} />
                  ))}
                </span>
              )}
              <span style={{ fontWeight: 800, color: "var(--texto)" }}>{sel.iniciais}</span>
            </div>
            <span className="nt-esp" style={{ background: ei.bg, color: ei.color, marginTop: 3, display: "inline-block" }}>{ei.label}</span>
            {sel.alergias && <div className="nt-linha-mini" style={{ color: "#E8735A" }}><span className="nt-mini-dot" style={{ background: "#E8735A" }} />Alergias: {sel.alergias}</div>}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <button className="nt-btn" onClick={() => { setAdicionar(false); setEditId(sel.id); }}>Editar</button>
            <button className="nt-btn" onClick={() => setVisto(sel.id)}>{sel.observado === true ? "Reativar" : "Visto"}</button>
            <button className="nt-btn" onClick={() => setAlta(sel.id)}>{sel.observado === "alta" ? "Reativar" : "Alta"}</button>
            <button className="nt-btn nt-btn--danger" onClick={() => apagarDoente(sel.id)}>Apagar</button>
          </div>
        </div>

        <div className="nt-tabs">
          {tabs.map((t) => (
            <button key={t.id} className={"nt-tab" + (aba === t.id ? " on" : "")} style={aba === t.id ? { color: t.color, borderColor: t.color } : undefined} onClick={() => { setAba(t.id); setFixadaId(null); }}>{t.label}</button>
          ))}
        </div>

        {notasTab.length > 3 && (
          <input className="campo" style={{ marginBottom: 10 }} placeholder="Pesquisar nestas notas…" value={query} onChange={(e) => setQuery(e.target.value)} />
        )}

        <PainelTarefas itens={sel.tarefas[aba] || []} onChange={setTarefas} accent={accent} />

        {ordenadas.length === 0 && <div className="nt-vazio">Sem notas neste separador. Usa os botões abaixo.</div>}
        {grupos.map((g) => (
          <div key={g.data}>
            <div className="nt-sep"><span className="nt-sep-data">{fmtData(g.data)}</span><span className="nt-sep-linha" /></div>
            {g.notas.map((n) => (
              <NotaCard key={n.id} nota={n} tab={tab} onUpdate={updateNota} onApagar={() => apagarNota(n.id)} onCopiar={isDiario && n.kind !== "rosa" && n.kind !== "antigo" ? copiarAnterior : null} />
            ))}
          </div>
        ))}

        <div className="nt-acoes">
          {isDiario ? (
            <>
              <button className="nt-acao" style={{ borderColor: "#0F6E56", color: "#0F6E56" }} onClick={addComTemplate}>+ Diário</button>
              <button className="nt-acao" style={{ borderColor: "#BA7517", color: "#BA7517" }} onClick={addAntigo}>+ Diário antigo</button>
              <button className="nt-acao" style={{ borderColor: "#E8735A", color: "#E8735A" }} onClick={addRosa}>+ Nota</button>
            </>
          ) : (
            <button className="nt-acao" style={{ borderColor: accent, color: accent }} onClick={addComTemplate}>+ Nova nota</button>
          )}
          <span style={{ fontSize: 11, color: "var(--tenue)", marginLeft: "auto" }}>{notasTab.length} nota{notasTab.length !== 1 ? "s" : ""}</span>
        </div>
      </>
    );
  })();

  // ── Barra lateral (lista compacta) — ecrã largo ──
  const sidebar = (
    <>
      <div className="nt-topo" style={{ marginBottom: 10 }}>
        <div><div className="nt-h1" style={{ fontSize: 17 }}>Doentes</div><div className="nt-count">{ativos.length} ativo{ativos.length !== 1 ? "s" : ""}</div></div>
      </div>
      {segToggle}
      {sidebarView === "doentes" && <input className="campo" style={{ marginBottom: 10 }} placeholder="Iniciais…" value={busca} onChange={(e) => setBusca(e.target.value)} />}
      {doentes.length === 0 && <div className="nt-vazio" style={{ padding: 16 }}>Sem doentes.</div>}
      {grupos2(grupoRows)}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
        <button className="nt-nova" style={{ background: accent }} onClick={() => { setEditId(null); setSelId(null); setAdicionar(true); }}>+ Adicionar doente</button>
        <button className="nt-btn" style={{ textAlign: "center" }} onClick={() => setGerir(true)}>Tabs e templates</button>
      </div>
    </>
  );

  // ════════ Ecrã largo: 2 painéis ════════
  if (largo) {
    return (
      <div style={{ "--acento": accent }}>
        {hero}
        <div className="modulo-corpo">
          {aviso}
          {gerir && <GestorSeparadores tabs={tabs} accent={accent} onFechar={() => setGerir(false)} onGuardar={saveTabs} />}
          <div className="nt-2col">
            <aside className="nt-side">{sidebar}</aside>
            <main className="nt-main">
              {formAtual ? formAtual : detalhe ? detalhe : <div className="nt-placeholder">Seleciona um doente à esquerda, ou adiciona um novo.</div>}
            </main>
          </div>
        </div>
      </div>
    );
  }

  // ════════ Ecrã estreito: lista → detalhe ════════
  if (view === "patient" && sel) {
    return (
      <div style={{ "--acento": accent }}>
        {hero}
        <div className="modulo-corpo">{editId === sel.id ? formAtual : detalhe}</div>
      </div>
    );
  }
  return (
    <div style={{ "--acento": accent }}>
      {hero}
      <div className="modulo-corpo">
        {aviso}
        <div className="nt-topo">
          <div><div className="nt-h1">Doentes</div><div className="nt-count">{ativos.length} ativo{ativos.length !== 1 ? "s" : ""}</div></div>
          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
            <button className="nt-btn" onClick={() => setGerir(true)}>Separadores</button>
            <button className="nt-nova" style={{ background: accent, width: "auto", padding: "9px 16px" }} onClick={() => { setEditId(null); setAdicionar((v) => !v); }}>+ Adicionar</button>
          </div>
        </div>
        {segToggle}
        {sidebarView === "doentes" && <input className="campo" style={{ marginBottom: 12 }} placeholder="Pesquisar por iniciais…" value={busca} onChange={(e) => setBusca(e.target.value)} />}
        {gerir && <GestorSeparadores tabs={tabs} accent={accent} onFechar={() => setGerir(false)} onGuardar={saveTabs} />}
        {formAtual}
        {doentes.length === 0 && !adicionar && <div className="nt-vazio">Sem doentes. Clica em “+ Adicionar”.</div>}
        {grupos2(grupoCards)}
        <div className="rodape">
          <strong>Nota:</strong> Separadores e templates vêm do teu ficheiro de conteúdo. Gestor de separadores personalizados e sincronização chegam a seguir.
        </div>
      </div>
    </div>
  );
}
