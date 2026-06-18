import { useState, useMemo, useRef } from "react";
import "./estilo.css";
import { Ico } from "@/components/icones";
import { useEstadoLocal } from "@/lib/persistencia";
import { normalizar } from "@/lib/texto";
import { guardarPdf, apagarPdf } from "@/lib/pdfs";
import VisorPdf from "@/components/VisorPdf";

// paleta para tipos criados pelo utilizador
const CORES_NOVAS = ["#d97706", "#7c3aed", "#0d9488", "#be185d", "#2563eb", "#ca8a04"];
const LIXO_DIAS = 30;
const DIA_MS = 24 * 60 * 60 * 1000;
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// deck inicial: cópia dos cards do conteúdo (origemTitle preserva o vínculo ao original)
function deckInicial(defaults) {
  const base = JSON.parse(JSON.stringify(defaults));
  base.forEach((c) => { c.origemTitle = c.title; });
  return base;
}

// secções ⇄ texto editável ("Chave:\nlinha\nlinha", blocos separados por linha vazia)
const secsParaTexto = (secs) => (secs || []).map((s) => s.key + ":\n" + s.rows.join("\n")).join("\n\n");
function textoParaSecs(t) {
  const blocos = t.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  return blocos.map((b) => {
    const linhas = b.split("\n").map((l) => l.trim()).filter(Boolean);
    let key = "Pontos-chave";
    if (linhas[0] && linhas[0].endsWith(":")) key = linhas.shift().slice(0, -1);
    return { key, rows: linhas };
  }).filter((s) => s.rows.length);
}
const htmlParaTexto = (h) => (h || "").replace(/<br\s*\/?>/g, "\n").replace(/<\/p>\s*<p>/g, "\n\n").replace(/<\/?p>/g, "");
const textoParaHtml = (t) => "<p>" + t.trim().split(/\n\s*\n/).join("</p><p>").replace(/\n/g, "<br/>") + "</p>";

function FormNovoCard({ cats, onGuardar, onFechar }) {
  const [cat, setCat] = useState(Object.keys(cats)[0]);
  const [titulo, setTitulo] = useState("");
  const [sub, setSub] = useState("");
  const [pontos, setPontos] = useState("");
  const [verso, setVerso] = useState("");
  const [pdf, setPdf] = useState(null);          // { id, nome, tamanho }
  const [aPdf, setAPdf] = useState(false);
  const fileRef = useRef(null);
  const fmtB = (n) => (n > 1048576 ? (n / 1048576).toFixed(1) + " MB" : Math.max(1, Math.round(n / 1024)) + " KB");

  const escolherPdf = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setAPdf(true);
    setPdf(await guardarPdf(file));
    setAPdf(false);
  };

  const guardar = () => {
    if (!titulo.trim()) return;
    const rows = pontos.split("\n").map((l) => l.trim()).filter(Boolean).map(esc);
    onGuardar({
      proprio: true, cat, fav: false,
      title: titulo.trim(), sub: sub.trim(),
      sections: rows.length ? [{ key: "Pontos-chave", rows }] : [],
      backTitle: verso.trim() ? "Verso" : undefined,
      backHtml: verso.trim() ? textoParaHtml(esc(verso)) : undefined,
      pdf: pdf || undefined,
    });
  };

  return (
    <div className="ca-modal-bg" onClick={(e) => { if (e.target === e.currentTarget) onFechar(); }}>
      <div className="ca-modal">
        <button className="ca-modal-close" onClick={onFechar}>×</button>
        <div className="ca-modal-eyebrow">Novo card</div>
        <h2 className="ca-modal-titulo">Criar card</h2>
        <div className="ca-form-lbl">Tipo</div>
        <div className="ca-an-flex" style={{ marginBottom: 10 }}>
          {Object.entries(cats).map(([k, c]) => (
            <button key={k} className={"ca-chip" + (cat === k ? " ativo" : "")} style={cat === k ? { background: c.color, borderColor: c.color, color: "#fff" } : undefined} onClick={() => setCat(k)}>
              <span className="ca-chip-dot" style={{ background: cat === k ? "#fff" : c.color }} />{c.label}
            </button>
          ))}
        </div>
        <div className="ca-form-lbl">Título</div>
        <input className="campo ca-an-inp" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex.: Quando pedir TSH?" />
        <div className="ca-form-lbl">Subtítulo (opcional)</div>
        <input className="campo ca-an-inp" value={sub} onChange={(e) => setSub(e.target.value)} placeholder="Uma linha de contexto" />
        <div className="ca-form-lbl">Pontos-chave (um por linha)</div>
        <textarea className="campo ca-an-inp ca-form-area" value={pontos} onChange={(e) => setPontos(e.target.value)} placeholder={"Primeiro ponto\nSegundo ponto"} />
        <div className="ca-form-lbl">Verso (opcional — aparece ao virar o card)</div>
        <textarea className="campo ca-an-inp ca-form-area" value={verso} onChange={(e) => setVerso(e.target.value)} placeholder="Detalhe, mnemónica, referência…" />
        <div className="ca-form-lbl">Resumo em PDF (opcional — abre dentro do card)</div>
        <input ref={fileRef} type="file" accept="application/pdf" style={{ display: "none" }} onChange={escolherPdf} />
        <button type="button" className="ca-btn-out" style={{ width: "100%", justifyContent: "flex-start" }} onClick={() => fileRef.current?.click()} disabled={aPdf}>
          <Ico name="documento" s={14} style={{ marginRight: 6 }} />
          {aPdf ? "A guardar…" : pdf ? `${pdf.nome} · ${fmtB(pdf.tamanho)}` : "Anexar PDF…"}
        </button>
        <div className="ca-flash-nav" style={{ marginTop: 14 }}>
          <button className="ca-btn" disabled={!titulo.trim()} onClick={guardar}>Guardar card</button>
          <button className="ca-btn-out" onClick={onFechar}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

function CardRapido({ card, cor, catLabel, sevLabel, edicao, onIniciarEdicao, onFav, onApagar, onAbrirResumo, sortMode, dragProps, onMover }) {
  const [viradoLocal, setVirado] = useState(false);
  const emEdicao = !!edicao;
  const virado = emEdicao ? edicao.verso : viradoLocal;
  const fileEditRef = useRef(null);

  return (
    <div className={"ob-drug-wrap" + (virado ? " flipped" : "") + (sortMode ? " ca-sorting" : "") + (emEdicao ? " ca-editando" : "")}
      onDoubleClick={() => !emEdicao && !sortMode && setVirado((v) => !v)} {...(dragProps || {})}>
      {!emEdicao && !sortMode && (
        <div className="ca-card-acoes">
          <button className="ca-card-act" title="Editar" onClick={(e) => { e.stopPropagation(); onIniciarEdicao(); }}><Ico name="lapis" s={13} /></button>
          <button className="ca-card-x" title="Apagar (vai para o Lixo)" onClick={(e) => { e.stopPropagation(); onApagar(); }}>×</button>
          <button className={"ob-pc-star" + (card.fav ? " saved" : "")} title="Favorito" onClick={(e) => { e.stopPropagation(); onFav(); }}>
            <Ico name={card.fav ? "starFill" : "star"} s={16} />
          </button>
        </div>
      )}
      {sortMode && (
        <div className="ca-drag-handle">
          <button className="ca-mover" title="Mover para trás" onClick={(e) => { e.stopPropagation(); onMover(-1); }}>←</button>
          <span>☰ Arrastar</span>
          <button className="ca-mover" title="Mover para a frente" onClick={(e) => { e.stopPropagation(); onMover(1); }}>→</button>
        </div>
      )}
      <div className="ob-drug-inner">
        <div className="ob-drug-front" style={{ borderTopColor: cor }}>
          {sevLabel && <span className={"ca-card-sev sev-" + card.sevBadge}>{sevLabel}</span>}
          <span className="ca-card-cat" style={{ color: cor, background: `color-mix(in srgb, ${cor} 12%, transparent)` }}>{catLabel}</span>
          {emEdicao && !edicao.verso ? (
            <div className="ca-edit" onDoubleClick={(e) => e.stopPropagation()}>
              <input className="campo ca-an-inp" value={edicao.draft.title} onChange={(e) => edicao.mudar("title", e.target.value)} placeholder="Título" />
              <input className="campo ca-an-inp" value={edicao.draft.sub} onChange={(e) => edicao.mudar("sub", e.target.value)} placeholder="Subtítulo" />
              <textarea className="campo ca-an-inp ca-form-area alta" value={edicao.draft.secsText} onChange={(e) => edicao.mudar("secsText", e.target.value)} placeholder={"Secção:\nponto\nponto\n\nOutra secção:\nponto"} />
              <div className="ca-edit-pdf">
                {edicao.pdf ? (
                  <>
                    <span className="ca-edit-pdf-nome"><Ico name="documento" s={13} /> {edicao.pdf.nome}</span>
                    <button type="button" onClick={() => fileEditRef.current?.click()}>Substituir</button>
                    <button type="button" className="rem" onClick={edicao.removerPdf}>Remover</button>
                  </>
                ) : (
                  <button type="button" onClick={() => fileEditRef.current?.click()}><Ico name="documento" s={13} /> Anexar PDF</button>
                )}
                <input ref={fileEditRef} type="file" accept="application/pdf" style={{ display: "none" }}
                  onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) edicao.anexarPdf(f); }} />
              </div>
            </div>
          ) : (
            <>
              <div className="ob-drug-nome">{card.title}</div>
              <div className="ob-drug-comercial">{card.sub}</div>
              {card.sections.map((s, i) => (
                <div key={i} className="ca-card-sec">
                  <div className="ca-card-sec-key">{s.key}</div>
                  <ul>{s.rows.map((r, j) => <li key={j} dangerouslySetInnerHTML={{ __html: r }} />)}</ul>
                </div>
              ))}
              {card.pdf && (
                <button className="ca-pdf-btn" onClick={(e) => { e.stopPropagation(); onAbrirResumo?.(); }}>
                  <Ico name="documento" s={13} /> Abrir PDF
                </button>
              )}
              {!emEdicao && <div className="ob-pc-hint">↻ ×2</div>}
            </>
          )}
          {emEdicao && !edicao.verso && (
            <div className="ca-edit-bar" onDoubleClick={(e) => e.stopPropagation()}>
              <button onClick={() => edicao.virar(true)}>↻ Verso</button>
              <span style={{ flex: 1 }} />
              <button onClick={edicao.repor}>↺ Repor</button>
              <button onClick={edicao.cancelar}>Cancelar</button>
              <button className="guardar" onClick={edicao.guardar}>Guardar</button>
            </div>
          )}
        </div>
        <div className="ob-drug-back">
          {emEdicao && edicao.verso ? (
            <div className="ca-edit" onDoubleClick={(e) => e.stopPropagation()}>
              <input className="campo ca-an-inp" value={edicao.draft.backTitle} onChange={(e) => edicao.mudar("backTitle", e.target.value)} placeholder="Título do verso" />
              <textarea className="campo ca-an-inp ca-form-area alta" value={edicao.draft.backText} onChange={(e) => edicao.mudar("backText", e.target.value)} placeholder="Texto do verso" />
              <div className="ca-edit-bar">
                <button onClick={() => edicao.virar(false)}>↻ Frente</button>
                <span style={{ flex: 1 }} />
                <button onClick={edicao.cancelar}>Cancelar</button>
                <button className="guardar" onClick={edicao.guardar}>Guardar</button>
              </div>
            </div>
          ) : (
            <>
              <div className="ob-pc-back-label">{card.backTitle || "Verso"}</div>
              <div className="ob-pc-back-texto" dangerouslySetInnerHTML={{ __html: card.backHtml || "<p>Sem verso.</p>" }} />
            </>
          )}
        </div>
      </div>

    </div>
  );
}

// Biblioteca de cards do guia — partilhada pelos módulos de sintomas.
// Lixo 30 dias, edição inline com repor, pesquisa, ordenação, tipos próprios.
// sevLabels (opcional): {sevBadge: rótulo} — badge de severidade no card (cards de crise da Asma).
export default function CardsDeck({ titulo, sub, cats: catsConteudo, defaults, prefixo, sevLabels }) {
  const [filtro, setFiltro] = useState("todas");
  const [deck, setDeck] = useEstadoLocal(prefixo + ":deck", deckInicial(defaults));
  const [lixo, setLixo] = useEstadoLocal(prefixo + ":lixo", []);
  const [catsExtra, setCatsExtra] = useEstadoLocal(prefixo + ":cats-extra", []);
  const [formAberto, setFormAberto] = useState(false);
  const [novoTipo, setNovoTipo] = useState(null);
  const [lixoAberto, setLixoAberto] = useState(false);
  const [sortMode, setSortMode] = useState(false);
  const [pesquisaAberta, setPesquisaAberta] = useState(false);
  const [pesquisa, setPesquisa] = useState("");
  const [editI, setEditI] = useState(null);
  const [editVerso, setEditVerso] = useState(false);
  const [draft, setDraft] = useState(null);
  const [visorId, setVisorId] = useState(null);   // PDF aberto no visor (caixa)
  const dragDe = useRef(null);

  const cats = useMemo(() => ({
    ...catsConteudo,
    ...Object.fromEntries(catsExtra.map((c) => [c.key, { label: c.label, color: c.color }])),
  }), [catsExtra]);

  // limpa entradas do lixo com mais de 30 dias
  const lixoValido = useMemo(() => lixo.filter((t) => Date.now() - t.apagadoEm < LIXO_DIAS * DIA_MS), [lixo]);
  if (lixoValido.length !== lixo.length) setLixo(lixoValido);

  const contagem = (k) => deck.filter((c) => c.cat === k).length;
  const nFavs = deck.filter((c) => c.fav).length;

  const visiveis = useMemo(() => {
    let lista = deck.map((c, i) => ({ c, i }));
    const q = normalizar(pesquisa).trim();
    if (pesquisaAberta && q.length >= 3) {
      lista = lista.filter(({ c }) => normalizar(
        c.title + " " + (c.sub || "") + " " + (c.sections || []).map((s) => s.key + " " + s.rows.join(" ")).join(" ") + " " + (c.backHtml || "")
      ).includes(q));
    }
    if (filtro === "favoritos") return lista.filter(({ c }) => c.fav);
    if (filtro !== "todas") return lista.filter(({ c }) => c.cat === filtro);
    return lista;
  }, [deck, filtro, pesquisa, pesquisaAberta]);

  // ── ações ──
  const apagarCard = (i) => {
    const card = deck[i];
    setLixo((l) => [{ card, apagadoEm: Date.now() }, ...l]);
    setDeck((d) => d.filter((_, j) => j !== i));
  };
  const recuperar = (ti) => {
    const t = lixoValido[ti];
    if (!t) return;
    setDeck((d) => [...d, t.card]);
    setLixo((l) => l.filter((x) => x !== t));
  };
  const eliminarDefinitivo = (ti) => {
    const t = lixoValido[ti];
    if (t && confirm("Eliminar definitivamente este card?")) {
      if (t.card?.pdf) apagarPdf(t.card.pdf.id); // apaga o blob do PDF anexo
      setLixo((l) => l.filter((x) => x !== t));
    }
  };
  const toggleFav = (i) => setDeck((d) => d.map((c, j) => (j === i ? { ...c, fav: !c.fav } : c)));

  const iniciarEdicao = (i) => {
    const c = deck[i];
    setEditI(i); setEditVerso(false);
    setDraft({ title: c.title, sub: c.sub || "", secsText: secsParaTexto(c.sections), backTitle: c.backTitle || "", backText: htmlParaTexto(c.backHtml), pdf: c.pdf || null });
  };
  const guardarEdicao = () => {
    const antiga = deck[editI]?.pdf;
    setDeck((d) => d.map((c, j) => (j !== editI ? c : {
      ...c,
      title: draft.title.trim() || c.title,
      sub: draft.sub.trim(),
      sections: textoParaSecs(draft.secsText),
      backTitle: draft.backTitle.trim(),
      backHtml: draft.backText.trim() ? textoParaHtml(draft.backText) : "",
      pdf: draft.pdf || undefined,
    })));
    if (antiga && antiga.id !== draft.pdf?.id) apagarPdf(antiga.id); // limpa o blob antigo se mudou/removeu
    setEditI(null); setDraft(null);
  };
  // trocar/remover o PDF anexo durante a edição
  const anexarPdfEdicao = async (file) => { const ref = await guardarPdf(file); setDraft((dr) => ({ ...dr, pdf: ref })); };
  const removerPdfEdicao = () => setDraft((dr) => ({ ...dr, pdf: null }));
  const reporOriginal = () => {
    const atual = deck[editI];
    const original = defaults.find((x) => x.title === (atual.origemTitle || atual.title));
    if (!original) { alert("Este card não tem versão original (foi criado por ti)."); return; }
    const copia = JSON.parse(JSON.stringify(original));
    copia.origemTitle = copia.title;
    copia.fav = atual.fav;
    setDeck((d) => d.map((c, j) => (j === editI ? copia : c)));
    setEditI(null); setDraft(null);
  };

  const apagarTipo = (k) => {
    const doTipo = deck.filter((c) => c.cat === k);
    const msg = doTipo.length ? `Apagar o tipo "${cats[k].label}"? Os ${doTipo.length} cards desse tipo vão para o Lixo.` : `Apagar o tipo "${cats[k].label}"?`;
    if (!confirm(msg)) return;
    if (doTipo.length) setLixo((l) => [...doTipo.map((card) => ({ card, apagadoEm: Date.now() })), ...l]);
    setDeck((d) => d.filter((c) => c.cat !== k));
    setCatsExtra((l) => l.filter((c) => c.key !== k));
    if (filtro === k) setFiltro("todas");
  };
  const criarTipo = () => {
    const nome = (novoTipo || "").trim();
    if (!nome) { setNovoTipo(null); return; }
    const key = "u_" + nome.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "_");
    if (!cats[key]) setCatsExtra((l) => [...l, { key, label: nome, color: CORES_NOVAS[l.length % CORES_NOVAS.length] }]);
    setNovoTipo(null);
  };

  // ordenar por arrastar (e setas, para ecrã táctil)
  const mover = (de, para) => {
    if (de === para || de == null || para == null) return;
    setDeck((d) => { const n = [...d]; const [item] = n.splice(de, 1); n.splice(para, 0, item); return n; });
  };
  const dragProps = (i) => sortMode ? {
    draggable: true,
    onDragStart: () => { dragDe.current = i; },
    onDragOver: (e) => e.preventDefault(),
    onDrop: (e) => { e.preventDefault(); mover(dragDe.current, i); dragDe.current = null; },
  } : null;

  const edicaoDe = (i) => editI === i ? {
    verso: editVerso, draft,
    mudar: (k, v) => setDraft((dr) => ({ ...dr, [k]: v })),
    virar: setEditVerso,
    repor: reporOriginal,
    cancelar: () => { setEditI(null); setDraft(null); },
    guardar: guardarEdicao,
    pdf: draft?.pdf || null,
    anexarPdf: anexarPdfEdicao,
    removerPdf: removerPdfEdicao,
  } : null;

  return (
    <div>
      <div className="ob-section-label">{titulo}</div>
      <p className="ca-hero-sub">{sub}</p>
      {true && (
        <>
          <div className="ca-chips">
            <button className={"ca-chip" + (filtro === "todas" ? " ativo" : "")} style={filtro === "todas" ? { background: "var(--acento)", borderColor: "var(--acento)", color: "#fff" } : undefined} onClick={() => setFiltro("todas")}>
              Todas <span className="ca-chip-n">{deck.length}</span>
            </button>
            {Object.entries(cats).map(([k, c]) => (
              <button key={k} className={"ca-chip" + (filtro === k ? " ativo" : "")} style={filtro === k ? { background: c.color, borderColor: c.color, color: "#fff" } : { borderColor: `color-mix(in srgb, ${c.color} 40%, transparent)` }} onClick={() => setFiltro(k)}>
                <span className="ca-chip-dot" style={{ background: filtro === k ? "#fff" : c.color }} />
                {c.label} <span className="ca-chip-n">{contagem(k)}</span>
                {k.startsWith("u_") && (
                  <span className="ca-chip-x" title="Apagar tipo" onClick={(e) => { e.stopPropagation(); apagarTipo(k); }}>×</span>
                )}
              </button>
            ))}
            <button className={"ca-chip" + (filtro === "favoritos" ? " ativo" : "")} style={filtro === "favoritos" ? { background: "#d97706", borderColor: "#d97706", color: "#fff" } : undefined} onClick={() => setFiltro("favoritos")}>
              <Ico name="star" s={11} style={{ marginRight: 3 }} />Favoritos <span className="ca-chip-n">{nFavs}</span>
            </button>
            {novoTipo === null
              ? <button className="ca-chip tracejado" onClick={() => setNovoTipo("")}>+ Adicionar</button>
              : (
                <span className="ca-chip-form">
                  <input className="campo" autoFocus value={novoTipo} placeholder="Nome do tipo…"
                    onChange={(e) => setNovoTipo(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") criarTipo(); if (e.key === "Escape") setNovoTipo(null); }} />
                  <button className="ca-btn" onClick={criarTipo}>OK</button>
                </span>
              )}
          </div>

          <div className="ca-cards-barra">
            <button className={"ca-btn-out ca-lixo-btn" + (lixoValido.length ? " com-itens" : "")} onClick={() => setLixoAberto((a) => !a)}>
              <Ico name="trash" s={13} style={{ marginRight: 5 }} />Lixo{lixoValido.length ? ` (${lixoValido.length})` : ""}
            </button>
            <button className="ca-btn-out ca-novo-card" onClick={() => setFormAberto(true)}>+ Novo card</button>
            <button className={"ca-btn-out ca-sort-btn" + (sortMode ? " ativo" : "")} onClick={() => { setSortMode((m) => !m); setEditI(null); }}>
              {sortMode ? "✓ Concluir" : "⇅ Ordenar"}
            </button>
            <button className={"ca-btn-out ca-pesq-btn" + (pesquisaAberta ? " ativo" : "")} title="Pesquisar cards" onClick={() => { setPesquisaAberta((a) => !a); setPesquisa(""); }}>
              <Ico name="search" s={14} />
            </button>
          </div>

          {pesquisaAberta && (
            <input className="campo ca-an-inp" autoFocus value={pesquisa} onChange={(e) => setPesquisa(e.target.value)} placeholder="Pesquisar cards (mínimo 3 letras)…" />
          )}

          {lixoAberto && (
            <div className="ca-lixo-painel">
              <div className="ca-lixo-titulo"><Ico name="trash" s={16} style={{ marginRight: 6 }} />Lixo</div>
              <div className="ca-lixo-sub">Cards apagados nos últimos {LIXO_DIAS} dias.</div>
              {lixoValido.length === 0 && <div className="ca-lixo-vazio">Lixo vazio.</div>}
              {lixoValido.map((t, ti) => {
                const d = Math.floor((Date.now() - t.apagadoEm) / DIA_MS);
                const resta = LIXO_DIAS - d;
                return (
                  <div key={t.apagadoEm + t.card.title} className="ca-lixo-item">
                    <div className="ca-lixo-info">
                      <div className="ca-lixo-nome">{t.card.title}</div>
                      <div className="ca-lixo-meta">Apagado há {d} dia{d !== 1 ? "s" : ""} · expira em {resta} dia{resta !== 1 ? "s" : ""}</div>
                    </div>
                    <div className="ca-lixo-acoes">
                      <button className="recuperar" onClick={() => recuperar(ti)}>↩ Recuperar</button>
                      <button className="eliminar" onClick={() => eliminarDefinitivo(ti)}>Eliminar</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {sortMode && <div className="ca-sort-aviso">Arrasta os cards para a posição que quiseres. Carrega em "✓ Concluir" quando terminares.</div>}

          {formAberto && (
            <FormNovoCard cats={cats} onFechar={() => setFormAberto(false)}
              onGuardar={(c) => { setDeck((d) => [...d, c]); setFormAberto(false); setFiltro(c.cat); }} />
          )}

          {visiveis.length === 0 && <div className="ob-faq-vazio">Sem cards neste filtro.</div>}
          <div className="ob-drug-grid">
            {visiveis.map(({ c, i }) => (
              <CardRapido key={i + ":" + c.title} card={c} cor={cats[c.cat]?.color || "var(--acento)"} catLabel={cats[c.cat]?.label || c.cat}
                sevLabel={(sevLabels && c.sevBadge && sevLabels[c.sevBadge]) || null}
                edicao={edicaoDe(i)} onIniciarEdicao={() => iniciarEdicao(i)}
                onFav={() => toggleFav(i)} onApagar={() => apagarCard(i)}
                onAbrirResumo={() => setVisorId(c.pdf?.id)}
                sortMode={sortMode} dragProps={dragProps(i)}
                onMover={(d) => mover(i, Math.max(0, Math.min(deck.length - 1, i + d)))} />
            ))}
          </div>
        </>
      )}

      {visorId && <VisorPdf pdfId={visorId} onClose={() => setVisorId(null)} />}
    </div>
  );
}
