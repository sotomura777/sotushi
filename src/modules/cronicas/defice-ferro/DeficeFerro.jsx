import { useState, useMemo } from "react";
import dados from "@conteudo/cronicas/defice-ferro.json";
import { useAtalhosNumericos } from "@/lib/atalhos";
import { normalizar } from "@/lib/texto";
import { Ico } from "@/components/icones";
import "./estilo.css";

const ALG = dados.algoritmo;
const TX = dados.tratamento;
const SEV = { red: "#B44330", orange: "#A8851E", yellow: "#B8960F", blue: "#2E6BC4" };
const TABS = [["algoritmo", "Algoritmo"], ["guia", "Guia Prático"], ["tratamento", "Tratamento"], ["faq", "FAQ"], ["fontes", "Fontes"]];
const TX_SUBS = [["form", "Formulações"], ["horario", "Horário"], ["iv", "Ferro IV"], ["alim", "Alimentação"], ["evid", "Evidência"], ["fu", "Follow-up"]];

// ── Cartão de fármaco (flip) ────────────────────────────────────────────────
function FlipCard({ med }) {
  const [virado, setVirado] = useState(false);
  const b = med.back;
  return (
    <div className={"df-flip" + (virado ? " on" : "")} onClick={() => setVirado((v) => !v)} style={{ "--c": med.color }}>
      <div className="df-flip-inner">
        <div className="df-flip-front">
          <div className="df-flip-head">
            <span className="df-flip-nome">{med.name}</span>
            <span className={"df-badge " + (med.rx ? "rx" : "otc")}>{med.rx ? "Receita médica" : "Venda livre"}</span>
          </div>
          <div className="df-flip-sub">{med.sub}</div>
          <div className="df-flip-form">{med.form}</div>
          {med.brands && <div className="df-flip-brands">{med.brands}</div>}
          <div className="df-flip-fe">{med.fe}</div>
          <div className="df-flip-hint">↻ Toque para ver prescrição</div>
        </div>
        {b && (
          <div className="df-flip-back">
            <div className="df-flip-back-nome">{med.name}</div>
            {b.posologia && <div className="df-flip-bloco"><div className="df-flip-lbl">Posologia</div><div className="df-flip-val" style={{ whiteSpace: "pre-line" }}>{b.posologia}</div></div>}
            {b.horario && <div className="df-flip-bloco"><div className="df-flip-lbl">Como tomar</div><div className="df-flip-val">{b.horario}</div></div>}
            {b.duracao && <div className="df-flip-bloco"><div className="df-flip-lbl">Duração</div><div className="df-flip-val">{b.duracao}</div></div>}
            {b.aviso && <div className="df-flip-aviso">{b.aviso}</div>}
            <div className="df-flip-hint">↻ Toque para voltar</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Separador Algoritmo (árvore de decisão) ─────────────────────────────────
function Algoritmo({ irPara }) {
  const [historia, setHistoria] = useState(["start"]);
  const node = ALG[historia[historia.length - 1]];
  const goTo = (id) => setHistoria((h) => [...h, id]);
  const goBack = () => setHistoria((h) => (h.length > 1 ? h.slice(0, -1) : h));
  const restart = () => setHistoria(["start"]);
  const crumbs = historia.map((id) => ALG[id]);

  const alsoLink = node.alsoLink && (
    <button className="df-also" onClick={() => irPara("tratamento")}>{node.alsoLink.label}</button>
  );

  return (
    <div>
      <div className="df-crumbs">
        {crumbs.map((c, i) => (
          <span key={i} className="df-crumb-wrap">
            <button className={"df-crumb" + (i === crumbs.length - 1 ? " on" : "")} onClick={() => setHistoria(historia.slice(0, i + 1))}>
              {c.title.length > 18 ? c.title.slice(0, 18) + "…" : c.title}
            </button>
            {i < crumbs.length - 1 && <span className="df-crumb-sep">›</span>}
          </span>
        ))}
      </div>
      {historia.length > 1 && (
        <div className="df-nav">
          <button className="df-btn-out" onClick={goBack}>← Voltar</button>
          <button className="df-btn-out" onClick={restart}>Recomeçar</button>
        </div>
      )}

      <div className="df-card" style={{ borderLeft: "4px solid #9E6B3A" }}>
        <div className="df-card-head">
          <h2 className="df-card-titulo">{node.title}</h2>
          <span className="df-badge tipo">{node.type === "question" ? "Decisão" : node.type === "diagnosis" ? "Diagnóstico" : node.type === "alert" ? "Alerta" : node.type === "food" ? "Alimentação" : "Informação"}</span>
        </div>

        {node.type === "question" && (
          <>
            <p className="df-q-texto">{node.text}</p>
            {node.hint && <p className="df-q-hint">{node.hint}</p>}
            <div className="df-opts">
              {node.options.map((opt, i) => (
                <button key={i} className="df-opt" style={{ "--c": opt.color }} onClick={() => goTo(opt.next)}>
                  <span className="df-opt-letra">{String.fromCharCode(65 + i)}</span>{opt.label}<span className="df-opt-seta">→</span>
                </button>
              ))}
            </div>
          </>
        )}

        {node.type === "diagnosis" && (
          <>
            <div className="df-bloco" style={{ "--c": SEV[node.severity] || "#9E6B3A" }}>
              <div className="df-bloco-lbl">Critérios diagnósticos</div>
              {node.criteria.map((c, i) => <div key={i} className="df-li"><span className="df-li-dot" style={{ color: SEV[node.severity] }}>•</span>{c}</div>)}
            </div>
            <div className="df-conduta">
              <div className="df-bloco-lbl">Conduta</div>
              <p>{node.action}</p>
            </div>
            {node.next && <button className="df-btn" onClick={() => goTo(node.next)}>{node.nextLabel}</button>}
            {alsoLink}
          </>
        )}

        {node.type === "info" && (
          <>
            <div className="df-info-grid">
              {node.items.map((it, i) => <div key={i} className="df-info-item"><span className="df-li-dot">•</span>{it}</div>)}
            </div>
            {node.alert && <div className="df-alerta-vermelho">{node.alert}</div>}
            {node.next && <button className="df-btn" onClick={() => goTo(node.next)}>{node.nextLabel}</button>}
            {alsoLink}
          </>
        )}

        {node.type === "alert" && (
          <>
            <div className="df-flags">
              {node.flags.map((f, i) => <div key={i} className="df-flag"><span className="df-flag-x">!</span>{f}</div>)}
            </div>
            {node.next && <button className="df-btn" onClick={() => goTo(node.next)}>{node.nextLabel}</button>}
          </>
        )}

        {node.type === "food" && (
          <>
            {node.veg_sources && (
              <div className="df-sub-sec">
                <div className="df-sub-lbl iron">Melhores fontes vegetais de ferro (por 100g)</div>
                <div className="df-vegsrc-grid">
                  {node.veg_sources.map((v, i) => <div key={i} className="df-vegsrc"><span>{v.food}</span><span className="df-vegsrc-mg">{v.mg} mg</span></div>)}
                </div>
              </div>
            )}
            {node.veg_tips && (
              <div className="df-sub-sec">
                <div className="df-sub-lbl green">Estratégias essenciais para vegetarianos</div>
                {node.veg_tips.map((t, i) => <div key={i} className="df-li green"><span className="df-li-plus">+</span>{t}</div>)}
              </div>
            )}
            <div className="df-sub-lbl green">Combinações inteligentes (ferro + vit. C)</div>
            <div className="df-combos">
              {node.combos.map((c, i) => <div key={i} className="df-combo"><div className="df-combo-meal">{c.meal}</div><div className="df-combo-why">{c.why}</div></div>)}
            </div>
            <div className="df-food-2col">
              <div className="df-food-box yellow">
                <div className="df-food-box-t">Ter atenção (reduz absorção)</div>
                {node.caution && node.caution.map((a, i) => <div key={i} className="df-food-cau"><div className="df-food-cau-item">{a.item}</div><div className="df-food-cau-tip">{a.tip}</div></div>)}
              </div>
              <div className="df-food-box blue">
                <div className="df-food-box-t">Estilo de vida</div>
                {node.lifestyle && node.lifestyle.map((l, i) => <div key={i} className="df-food-life">+ {l}</div>)}
              </div>
            </div>
            {alsoLink}
          </>
        )}

        {node.type === "result" && <p className="df-result">{node.text}</p>}

        {node.final && <div className="df-final"><button className="df-btn-out grande" onClick={restart}>Novo caso – Recomeçar</button></div>}
      </div>
    </div>
  );
}

// ── Separador Tratamento ────────────────────────────────────────────────────
function Tratamento() {
  const [sub, setSub] = useState("form");
  return (
    <div>
      <div className="df-subtabs">
        {TX_SUBS.map(([id, l]) => <button key={id} className={"df-subtab" + (sub === id ? " on" : "")} onClick={() => setSub(id)}>{l}</button>)}
      </div>

      {sub === "form" && (
        <>
          <div className="df-aviso azul"><strong>Toque num card para virar</strong> — na frente o princípio activo e marcas disponíveis, no verso a prescrição.</div>
          <h3 className="df-h3 iron">Ferro Oral</h3>
          <div className="df-meds">{TX.oral.map((m, i) => <FlipCard key={i} med={m} />)}</div>
          <h3 className="df-h3 accent">Ferro Intravenoso</h3>
          <div className="df-meds">{TX.ivFormulacoes.map((m, i) => <FlipCard key={i} med={m} />)}</div>
          <div className="df-box accent">
            <div className="df-box-lbl">Quando ferro IV em vez de oral?</div>
            {TX.quandoIV.map((t, i) => <div key={i} className="df-box-li">• {t}</div>)}
          </div>
          <div className="df-box yellow">
            <div className="df-box-t">Qual formulação escolher?</div>
            {TX.qualFormulacao.map((r, i) => <div key={i} className="df-qf"><strong>{r.label}:</strong> {r.text}</div>)}
          </div>
        </>
      )}

      {sub === "horario" && (
        <>
          <h3 className="df-h3 blue">Melhor Horário para Tomar Ferro</h3>
          <div className="df-hor-grid">
            {TX.horario.map((h, i) => <div key={i} className="df-hor" style={{ "--c": h.color }}><div className="df-hor-t">{h.title}</div><p>{h.text}</p></div>)}
          </div>
          <div className="df-box iron">
            <div className="df-box-lbl">Regra de ouro: Dias alternados</div>
            <p>{TX.diasAlternados}</p>
          </div>
        </>
      )}

      {sub === "iv" && (
        <>
          <h3 className="df-h3 accent">Ferro Intravenoso</h3>
          <div className="df-meds">{TX.iv.map((m, i) => <FlipCard key={i} med={m} />)}</div>
          <div className="df-box accent">
            <div className="df-box-lbl">Quando ferro IV em vez de oral?</div>
            {TX.quandoIV.map((t, i) => <div key={i} className="df-box-li">• {t}</div>)}
          </div>
        </>
      )}

      {sub === "alim" && <Alimentacao a={TX.alimentacao} />}

      {sub === "evid" && (
        <>
          <div className="df-aviso iron">Resumo da evidência principal para cada princípio activo. Referências verificadas em PubMed.</div>
          {TX.evidencia.map((d, i) => (
            <div key={i} className="df-card" style={{ borderLeft: "4px solid " + d.color, marginBottom: 12 }}>
              <div className="df-evid-head"><span className="df-evid-drug" style={{ color: d.color }}>{d.drug}</span><span className="df-badge" style={{ "--c": d.color }}>{d.level}</span></div>
              {d.studies.map((s, j) => (
                <div key={j} className="df-evid-study"><div className="df-evid-ref">{s.ref}</div><div className="df-evid-res">{s.result}</div><div className="df-evid-src">{s.source}</div></div>
              ))}
            </div>
          ))}
        </>
      )}

      {sub === "fu" && (
        <>
          <div className="df-card" style={{ marginBottom: 14 }}>
            <div className="df-h3 iron" style={{ marginBottom: 14 }}>Monitorização</div>
            <div className="df-timeline">
              {TX.followup.marcos.map((s, i) => (
                <div key={i} className="df-tl-item"><span className="df-tl-dot" />{i < TX.followup.marcos.length - 1 && <span className="df-tl-linha" />}<div className="df-tl-body"><div className="df-tl-t">{s.t}</div><div className="df-tl-a">{s.a}</div></div></div>
              ))}
            </div>
          </div>
          <div className="df-box accent">
            <div className="df-box-t accent">Se falha terapêutica…</div>
            {TX.followup.falha.map((f, i) => <div key={i} className="df-falha"><span className="df-falha-n">{i + 1}.</span>{f}</div>)}
          </div>
        </>
      )}
    </div>
  );
}

function Alimentacao({ a }) {
  return (
    <div>
      <div className="df-heme-row">
        <div className="df-heme green"><span className="df-heme-t">Ferro Heme</span><p>{a.heme}</p></div>
        <div className="df-heme yellow"><span className="df-heme-t">Ferro Não-Heme</span><p>{a.naoHeme}</p></div>
      </div>
      <div className="df-card df-tabela-wrap">
        <table className="df-tabela">
          <thead><tr><th>Alimento</th><th>Fe (mg)</th><th>Tipo</th></tr></thead>
          <tbody>{a.foods.map((f, i) => (
            <tr key={i}><td>{f.n}</td><td className="df-mono">{f.fe.toFixed(1)}</td><td><span className={"df-badge " + (f.t === "h" ? "otc" : "yel")}>{f.t === "h" ? "Heme" : "Não-heme"}</span></td></tr>
          ))}</tbody>
        </table>
      </div>
      <div className="df-food-2col" style={{ marginTop: 14 }}>
        <div className="df-card df-fac"><h4 className="df-h4 green">Facilitam</h4>{a.facilitam.map((t, i) => <div key={i} className="df-food-life">+ {t}</div>)}</div>
        <div className="df-card df-inib"><h4 className="df-h4 accent">Inibem</h4>{a.inibem.map((t, i) => <div key={i} className="df-food-life">− {t}</div>)}</div>
      </div>
      <div className="df-card df-vegguia">
        <div className="df-h3 green" style={{ marginBottom: 4 }}>Guia para Vegetarianos e Veganos</div>
        <p className="df-vegguia-intro">{a.vegGuia.intro}</p>
        <div className="df-sub-lbl green">Melhores fontes vegetais de ferro</div>
        <div className="df-vegfontes">
          {a.vegGuia.fontes.map((f, i) => <div key={i} className="df-vegfonte"><div className="df-vegfonte-top"><span>{f.name}</span><span className="df-vegsrc-mg">{f.fe}</span></div><span className="df-vegfonte-tip">{f.tip}</span></div>)}
        </div>
        <div className="df-sub-lbl green">Estratégias para maximizar absorção</div>
        <div className="df-vegestr">
          {a.vegGuia.estrategias.map((s, i) => <div key={i} className="df-vegestr-item"><span className="df-li-plus">+</span><div><div className="df-vegestr-t">{s.tip}</div><div className="df-vegestr-d">{s.detail}</div></div></div>)}
        </div>
        <div className="df-sub-lbl green">Exemplo de dia alimentar vegetariano rico em ferro</div>
        <div className="df-vegdia">
          {a.vegGuia.exemploDia.map((m, i) => <div key={i} className="df-vegdia-item"><span className="df-vegdia-meal">{m.meal}</span><div>{m.food}</div></div>)}
        </div>
        <div className="df-box yellow" style={{ marginTop: 4 }}>
          <div className="df-box-t">Quando suplementar?</div>
          <p>{a.vegGuia.quandoSuplementar}</p>
        </div>
      </div>
    </div>
  );
}

// ── Separador Guia Prático (capítulos) ──────────────────────────────────────
function GuiaPratico() {
  const [cap, setCap] = useState(0);
  const caps = dados.guiaPratico;
  return (
    <div>
      {dados.guiaPraticoNota && <div className="df-aviso iron">{dados.guiaPraticoNota}</div>}
      <div className="df-gp-nav">
        {caps.map((c, i) => <button key={c.id} className={"df-gp-nb" + (cap === i ? " on" : "")} onClick={() => setCap(i)}>{c.titulo}</button>)}
      </div>
      <div className="df-gp" dangerouslySetInnerHTML={{ __html: caps[cap].html }} />
    </div>
  );
}

// ── Separador FAQ ───────────────────────────────────────────────────────────
function Faq() {
  const [catAberta, setCatAberta] = useState(-1);
  const [qAberta, setQAberta] = useState(-1);
  const [query, setQuery] = useState("");
  const term = normalizar(query);

  const filtrado = useMemo(() => {
    if (term.length < 2) return dados.faq;
    return dados.faq.map((cat) => {
      const qs = cat.qs.filter((f) => normalizar(f.q).includes(term) || normalizar(f.a).includes(term));
      return qs.length ? { ...cat, qs } : null;
    }).filter(Boolean);
  }, [term]);
  const total = filtrado.reduce((acc, c) => acc + c.qs.length, 0);

  const highlight = (texto) => {
    if (term.length < 2) return texto;
    const partes = texto.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"));
    return partes.map((p, i) => (normalizar(p).includes(term) && p ? <mark key={i} className="df-mark">{p}</mark> : p));
  };

  return (
    <div>
      <div className="df-aviso iron">Perguntas clínicas frequentes sobre a abordagem ao défice de ferro e anemia ferropénica — diagnóstico, investigação, prescrição e situações especiais.</div>
      <div className="df-faq-search-wrap">
        <input className="df-faq-search" value={query} placeholder="Pesquisar nas perguntas e respostas..."
          onChange={(e) => { setQuery(e.target.value); if (e.target.value.length >= 2) { setCatAberta(0); setQAberta(0); } else { setCatAberta(-1); setQAberta(-1); } }} />
        {query && <button className="df-faq-x" onClick={() => { setQuery(""); setCatAberta(-1); setQAberta(-1); }}>✕</button>}
      </div>
      {term.length >= 2 && <div className="df-faq-count">{total} resultado{total !== 1 ? "s" : ""}</div>}

      {filtrado.map((cat, ci) => (
        <div key={ci} className="df-faq-cat">
          <button className={"df-faq-cat-h" + (catAberta === ci ? " on" : "")} onClick={() => { setCatAberta(catAberta === ci ? -1 : ci); setQAberta(-1); }}>
            <span className="df-faq-cat-nome">{cat.cat}</span>
            <span className="df-badge">{cat.qs.length} perguntas</span>
            <span className="df-faq-chev">▾</span>
          </button>
          {catAberta === ci && (
            <div className="df-faq-qs">
              {cat.qs.map((f, qi) => (
                <div key={qi}>
                  <button className={"df-faq-q" + (qAberta === qi ? " on" : "")} onClick={() => setQAberta(qAberta === qi ? -1 : qi)}>
                    <span className="df-faq-q-n">Q</span><span className="df-faq-q-txt">{highlight(f.q)}</span><span className="df-faq-q-mais">+</span>
                  </button>
                  {qAberta === qi && <div className="df-faq-a">{highlight(f.a)}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Separador Fontes ────────────────────────────────────────────────────────
function Fontes() {
  const corTipo = { "Revisão": "#2E6BC4", "Guideline": "#2B7A4B", "Consenso": "#A8851E", "RCT": "#9E6B3A", "Norma PT": "#B44330", "Base dados": "#9A9DA8" };
  return (
    <div>
      <div className="df-aviso azul">Algoritmo baseado em guidelines internacionais, revisões de referência e normas portuguesas. Ferramenta de estudo: não se destina a apoiar decisões clínicas reais.</div>
      <div className="df-refs">
        {dados.referencias.map((r) => {
          const url = r.url || "https://www.google.com/search?q=" + encodeURIComponent(r.t + " " + r.j);
          return (
            <a key={r.id} className="df-ref" href={url} target="_blank" rel="noopener noreferrer">
              <span className="df-ref-num">{r.id}</span>
              <div>
                <div className="df-ref-a">{r.a}</div>
                <div className="df-ref-t">{r.t}</div>
                <div className="df-ref-j"><span>{r.j}</span> <span className="df-badge" style={{ "--c": corTipo[r.type] || "#9A9DA8" }}>{r.type}</span></div>
              </div>
              <span className="df-ref-link">↗</span>
            </a>
          );
        })}
      </div>
    </div>
  );
}

// ── Componente principal ────────────────────────────────────────────────────
export default function DeficeFerro() {
  const [tab, setTab] = useState("algoritmo");
  useAtalhosNumericos(TABS.length, (i) => setTab(TABS[i][0]));
  return (
    <div className="df" style={{ "--acento": "#B44330" }}>
      <div className="df-cab">
        <div className="df-cab-logo">Fe</div>
        <div>
          <h1 className="df-cab-titulo">{dados.meta.nome}</h1>
          <div className="df-cab-sub">{dados.meta.subtitulo} · treino de raciocínio</div>
        </div>
      </div>
      <div className="df-aviso iron df-aviso-estudo">
        <Ico name="library" s={16} />
        <span><strong>Ferramenta de estudo.</strong> Percorre o algoritmo como treino de raciocínio diagnóstico sobre um caso. Não se destina a apoiar decisões sobre doentes reais.</span>
      </div>
      <div className="df-tabs">
        {TABS.map(([id, l]) => <button key={id} className={"df-tab" + (tab === id ? " on" : "")} onClick={() => setTab(id)}>{l}</button>)}
      </div>
      {tab === "algoritmo" && <Algoritmo irPara={setTab} />}
      {tab === "guia" && <GuiaPratico />}
      {tab === "tratamento" && <Tratamento />}
      {tab === "faq" && <Faq />}
      {tab === "fontes" && <Fontes />}
      <div className="df-rodape">{dados.meta.disclaimer}</div>
    </div>
  );
}
