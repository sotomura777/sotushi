import { useState } from "react";
import config from "@conteudo/notas/config.json";
import { paraIniciais, uid, hojeISO } from "./logica";
import { Ico } from "@/components/icones";
import "./estilo.css";

const TABS = config.separadores_padrao;
const PRIORIDADES = config.prioridades;
const ESPECIALIDADES = config.especialidades;

export default function Notas({ accent = "#475569", gradiente, onVoltar }) {
  const [doentes, setDoentes] = useState([]);
  const [selId, setSelId] = useState(null);
  const [verObservados, setVerObservados] = useState(false);

  // form novo doente
  const [nome, setNome] = useState("");
  const [prio, setPrio] = useState("green");
  const [esp, setEsp] = useState(ESPECIALIDADES[0].id);

  const [tab, setTab] = useState(TABS[0].id);

  const iniciaisPrevia = paraIniciais(nome);

  function adicionar() {
    if (!iniciaisPrevia) return;
    const novo = {
      id: uid(),
      iniciais: iniciaisPrevia, // SÓ iniciais — o nome completo é descartado aqui
      prioridade: prio,
      especialidade: esp,
      observado: false,
      criadoEm: hojeISO(),
      notas: {},
    };
    setDoentes((d) => [novo, ...d]);
    setNome(""); setPrio("green");
  }

  const sel = doentes.find((d) => d.id === selId);

  function novaNota(tabId) {
    const tpl = TABS.find((t) => t.id === tabId)?.template || "";
    const nota = { id: uid(), data: hojeISO(), texto: tpl, feito: false };
    setDoentes((ds) => ds.map((d) => d.id !== selId ? d : { ...d, notas: { ...d.notas, [tabId]: [nota, ...(d.notas[tabId] || [])] } }));
  }
  function editarNota(tabId, notaId, texto) {
    setDoentes((ds) => ds.map((d) => d.id !== selId ? d : { ...d, notas: { ...d.notas, [tabId]: d.notas[tabId].map((n) => n.id === notaId ? { ...n, texto } : n) } }));
  }
  function apagarNota(tabId, notaId) {
    setDoentes((ds) => ds.map((d) => d.id !== selId ? d : { ...d, notas: { ...d.notas, [tabId]: d.notas[tabId].filter((n) => n.id !== notaId) } }));
  }
  function toggleObservado(id) {
    setDoentes((ds) => ds.map((d) => d.id === id ? { ...d, observado: !d.observado } : d));
    setSelId(null);
  }
  function apagarDoente(id) {
    setDoentes((ds) => ds.filter((d) => d.id !== id));
    setSelId(null);
  }

  const prioInfo = (id) => PRIORIDADES.find((p) => p.id === id) || PRIORIDADES[0];
  const espInfo = (id) => ESPECIALIDADES.find((e) => e.id === id) || { label: "", color: "var(--suave)", bg: "var(--superficie-2)" };

  const hero = (
    <header className="hero" style={{ background: gradiente || accent }}>
      <div className="hero-conteudo">
        <button className="voltar" onClick={sel ? () => setSelId(null) : onVoltar}>← {sel ? "Doentes" : "Início"}</button>
        <div className="hero-titulo">Notas Clínicas</div>
        <div className="hero-subtitulo">{sel ? "Notas por separador" : "Lista de doentes · só iniciais"}</div>
      </div>
    </header>
  );

  const aviso = (
    <div className="nt-aviso">
      <Ico name="lock" s={14} /> <strong>Pré-visualização.</strong> Nada é guardado ainda — o armazenamento encriptado e a sincronização chegam com o backend. Insere <strong>apenas iniciais</strong>: o nome que escreveres é convertido automaticamente e o nome completo nunca é guardado. Não inserir dados reais de doentes.
    </div>
  );

  // ---------------- DETALHE DO DOENTE ----------------
  if (sel) {
    const pi = prioInfo(sel.prioridade);
    const ei = espInfo(sel.especialidade);
    const notasTab = sel.notas[tab] || [];
    return (
      <div style={{ "--acento": accent }}>
        {hero}
        <div className="modulo-corpo">
          <div className="cartao" style={{ padding: 14, marginBottom: 12, display: "flex", alignItems: "center", gap: 12 }}>
            <span className="nt-iniciais" style={{ background: pi.bg, color: pi.color }}>{sel.iniciais}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: "var(--texto)" }}>{sel.iniciais}</div>
              <span className="nt-esp" style={{ background: ei.bg, color: ei.color }}>{ei.label}</span>
            </div>
            <button className="nt-btn" onClick={() => toggleObservado(sel.id)}>{sel.observado ? "Reativar" : "Marcar observado"}</button>
            <button className="nt-btn nt-btn--danger" onClick={() => apagarDoente(sel.id)}>Apagar</button>
          </div>

          <div className="nt-tabs">
            {TABS.map((t) => (
              <button key={t.id} className={"nt-tab" + (tab === t.id ? " on" : "")} style={tab === t.id ? { color: t.color, borderColor: t.color } : undefined} onClick={() => setTab(t.id)}>{t.label}</button>
            ))}
          </div>

          <button className="nt-nova" style={{ background: accent }} onClick={() => novaNota(tab)}>+ Nova nota ({TABS.find((t) => t.id === tab)?.label})</button>

          {notasTab.length === 0 && <div style={{ textAlign: "center", color: "var(--tenue)", padding: 24, fontSize: 13 }}>Sem notas neste separador.</div>}
          {notasTab.map((n) => (
            <div key={n.id} className="cartao" style={{ padding: 12, marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: "var(--tenue)", fontWeight: 600 }}>{n.data}</span>
                <button className="nt-btn nt-btn--danger" onClick={() => apagarNota(tab, n.id)}>Apagar</button>
              </div>
              <textarea className="nt-textarea" value={n.texto} onChange={(e) => editarNota(tab, n.id, e.target.value)} rows={Math.max(4, n.texto.split("\n").length)} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ---------------- LISTA DE DOENTES ----------------
  const ativos = doentes.filter((d) => !d.observado);
  const observados = doentes.filter((d) => d.observado);
  const lista = verObservados ? observados : ativos;

  return (
    <div style={{ "--acento": accent }}>
      {hero}
      <div className="modulo-corpo">
        {aviso}

        <div className="cartao" style={{ padding: 14, marginBottom: 14 }}>
          <div className="secao-label">Novo doente</div>
          <input className="campo" style={{ width: "100%", marginBottom: 8 }} placeholder="Nome (será convertido em iniciais)" value={nome} onChange={(e) => setNome(e.target.value)} />
          {nome && <div style={{ fontSize: 12, color: "var(--suave)", marginBottom: 8 }}>Guardado como: <strong style={{ color: accent }}>{iniciaisPrevia || "—"}</strong></div>}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
            {PRIORIDADES.map((p) => (
              <button key={p.id} className={"nt-prio" + (prio === p.id ? " on" : "")} style={prio === p.id ? { background: p.bg, color: p.color, borderColor: p.color } : undefined} onClick={() => setPrio(p.id)}>{p.label}</button>
            ))}
          </div>
          <select className="campo" style={{ width: "100%", marginBottom: 10 }} value={esp} onChange={(e) => setEsp(e.target.value)}>
            {ESPECIALIDADES.map((e) => <option key={e.id} value={e.id}>{e.label}</option>)}
          </select>
          <button className="nt-nova" style={{ background: accent }} onClick={adicionar} disabled={!iniciaisPrevia}>+ Adicionar doente</button>
        </div>

        <div className="filtros" style={{ marginBottom: 10 }}>
          <button className={"filtro" + (!verObservados ? " filtro--ativo" : "")} style={!verObservados ? { background: accent } : undefined} onClick={() => setVerObservados(false)}>Ativos ({ativos.length})</button>
          <button className={"filtro" + (verObservados ? " filtro--ativo" : "")} style={verObservados ? { background: accent } : undefined} onClick={() => setVerObservados(true)}>Observados ({observados.length})</button>
        </div>

        {lista.length === 0 && <div style={{ textAlign: "center", color: "var(--tenue)", padding: 24, fontSize: 13 }}>{verObservados ? "Nenhum doente observado." : "Sem doentes na lista. Adiciona acima."}</div>}
        <div className="lista">
          {lista.map((d) => {
            const pi = prioInfo(d.prioridade); const ei = espInfo(d.especialidade);
            const totalNotas = Object.values(d.notas).reduce((s, arr) => s + arr.length, 0);
            return (
              <button key={d.id} className="lista-item" onClick={() => { setSelId(d.id); setTab(TABS[0].id); }} style={{ width: "100%", textAlign: "left", border: "none", background: "var(--superficie)", cursor: "pointer" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 11 }}>
                  <span className="nt-iniciais" style={{ background: pi.bg, color: pi.color }}>{d.iniciais}</span>
                  <span>
                    <span style={{ fontWeight: 700, color: "var(--texto)", display: "block" }}>{d.iniciais}</span>
                    <span className="nt-esp" style={{ background: ei.bg, color: ei.color }}>{ei.label}</span>
                  </span>
                </span>
                <span style={{ fontSize: 12, color: "var(--tenue)" }}>{totalNotas} nota{totalNotas !== 1 ? "s" : ""} ›</span>
              </button>
            );
          })}
        </div>

        <div className="rodape">
          <strong>Nota:</strong> Os templates (Diário SOAP, Admissão, Alta) e as especialidades vêm do teu ficheiro. A persistência segura (cifra ponta-a-ponta, sincronização, chave de recuperação) é adicionada pelo backend.
        </div>
      </div>
    </div>
  );
}
