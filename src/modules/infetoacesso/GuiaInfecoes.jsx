import { useState, useEffect, useRef, useMemo } from "react";
import { filtrarDoencas, recomendacaoCentor } from "./logica";
import "./estilo.css";

const Html = ({ className, html, ...rest }) => (
  <div className={className} dangerouslySetInnerHTML={{ __html: html }} {...rest} />
);

// Delegação do Centor/McIsaac sobre o HTML cru do painel: lê o estado dos botões
// selecionados no DOM, recalcula o score (0–5) e reescreve o nó .calc-result.
function onClickCentor(e) {
  const btn = e.target.closest(".calc-toggle [data-q]");
  if (!btn) return;
  const calc = btn.closest(".calc-box");
  if (!calc) return;
  btn.parentElement.querySelectorAll("button").forEach((b) => b.classList.remove("selected"));
  btn.classList.add("selected");
  let score = 0;
  calc.querySelectorAll(".calc-toggle").forEach((g) => {
    const sel = g.querySelector("button.selected");
    if (sel) score += parseInt(sel.dataset.v, 10) || 0;
  });
  const res = calc.querySelector(".calc-result");
  if (!res) return;
  const { cls, rec } = recomendacaoCentor(score);
  res.className = "calc-result " + cls;
  res.innerHTML = `<span class="calc-score">${score}</span><span class="calc-rec">${rec}</span>`;
}

const seta = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="6 9 12 15 18 9" /></svg>
);

function CartaoDoenca({ d, sistemaId, aberta, onToggle, abaAtiva, setAba, registarRef }) {
  return (
    <div className={"card s-" + sistemaId + (aberta ? " open" : "")} ref={(el) => registarRef(d.id, el)}>
      <div className="card-header" onClick={onToggle}>
        <div className="card-icon">{d.icon}</div>
        <div className="card-title-group"><div className="card-title">{d.title}</div></div>
        <div className="card-chevron">{seta}</div>
      </div>
      {aberta && (
        <div className="card-body">
          <div className="tabs">
            {d.tabs.map((t) => (
              <button key={t.id} className={"tab-btn" + (t.id === abaAtiva ? " active" : "")} onClick={() => setAba(d.id, t.id)}>
                {t.label}
              </button>
            ))}
          </div>
          {d.tabs.map((t) => (
            t.id === abaAtiva && <Html key={t.id} className="tab-panel active" html={t.html} onClick={onClickCentor} />
          ))}
        </div>
      )}
    </div>
  );
}

// Ícone da calculadora (FAB pediátrico), recriado do original.
const iconeCalc = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" /><line x1="8" y1="6" x2="16" y2="6" /><circle cx="9" cy="11" r="0.8" fill="currentColor" /><circle cx="12" cy="11" r="0.8" fill="currentColor" /><circle cx="15" cy="11" r="0.8" fill="currentColor" /><circle cx="9" cy="15" r="0.8" fill="currentColor" /><circle cx="12" cy="15" r="0.8" fill="currentColor" /><line x1="14.5" y1="15" x2="16" y2="15" /><line x1="9" y1="18.5" x2="12" y2="18.5" /><line x1="14.5" y1="18.5" x2="16" y2="18.5" /></svg>
);

export default function GuiaInfecoes({ dados, variante, onVoltar }) {
  const { meta, sistemas } = dados;
  const ehPed = variante === "ped";

  const [sistemaId, setSistemaId] = useState(null); // null = home
  const [vistaDoses, setVistaDoses] = useState(false); // pediatria
  const [aberta, setAberta] = useState(null); // doença aberta
  const [abas, setAbas] = useState({}); // {doencaId: abaId}
  const [query, setQuery] = useState("");
  const [popover, setPopover] = useState(false); // FAB pediátrico

  const cardRefs = useRef({});
  const scrollPendente = useRef(null);

  const sistema = sistemas.find((s) => s.id === sistemaId);
  const filtradas = useMemo(() => (sistema ? filtrarDoencas(sistema.diseases, query) : []), [sistema, query]);

  // scroll ao topo só ao trocar de VISTA (não ao trocar de aba)
  useEffect(() => { window.scrollTo({ top: 0 }); }, [sistemaId, vistaDoses]);

  // deep-link (bubble): depois de abrir o sistema, leva ao cartão da doença
  useEffect(() => {
    if (!scrollPendente.current) return;
    const el = cardRefs.current[scrollPendente.current];
    scrollPendente.current = null;
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [sistemaId]);

  const abrirSistema = (id, doencaId) => {
    setVistaDoses(false); setPopover(false); setQuery("");
    setSistemaId(id);
    setAberta(doencaId || null);
    if (doencaId) scrollPendente.current = doencaId;
  };
  const irHome = () => { setSistemaId(null); setVistaDoses(false); setPopover(false); };
  const abrirDoses = () => { setSistemaId(null); setVistaDoses(true); setPopover(false); };
  const toggleDoenca = (id) => setAberta((a) => (a === id ? null : id));
  const setAba = (doencaId, abaId) => setAbas((a) => ({ ...a, [doencaId]: abaId })); // sem scroll
  const abaDe = (d) => abas[d.id] || (d.tabs.find((t) => t.active)?.id) || d.tabs[0]?.id;

  // delegação para o botão "voltar" dentro do HTML cru da vista de doses
  const onClickDoses = (e) => { if (e.target.closest(".back-btn")) irHome(); };
  // delegação para o "fechar" dentro do popover
  const onClickPopover = (e) => { if (e.target.closest(".dose-calc-popover-close")) setPopover(false); };

  const voltarApp = <button className="voltar infet-voltar" onClick={onVoltar}>← Início</button>;

  return (
    <div className="infet">
      {/* ── HOME (grelha de sistemas) ── */}
      {!sistema && !vistaDoses && (
        <>
          {voltarApp}
          <header className="page-header">
            <h1>{meta.titulo}</h1>
            <p>{meta.subtitulo}</p>
          </header>
          <div className="section-label"><h2>{meta.sectionLabel}</h2></div>
          <div className="systems-grid">
            {sistemas.map((s) => (
              <button key={s.id} className={"sys-card s-" + s.id} onClick={() => abrirSistema(s.id)}>
                <div className="sys-card-inner">
                  <div className="sys-icon">{s.icon}</div>
                  <div className="sys-card-title">{s.nome}</div>
                  <div className="sys-card-label">{s.label}</div>
                  <div className="disease-bubbles">
                    {s.bubbles.map((b) => (
                      <span key={b.doencaId} className="dbubble"
                        onClick={(e) => { e.stopPropagation(); abrirSistema(s.id, b.doencaId); }}>{b.label}</span>
                    ))}
                  </div>
                </div>
              </button>
            ))}
            {ehPed && (
              <button className="sys-card doses-rainbow" onClick={abrirDoses}>
                <div className="sys-card-inner">
                  <div className="sys-icon">DOSE</div>
                  <div className="sys-card-title">Cálculo de Doses Pediátricas</div>
                  <div className="sys-card-label">Doses</div>
                </div>
              </button>
            )}
          </div>
          <Html className="page-footer" html={meta.footerHtml} />
        </>
      )}

      {/* ── VISTA DE SISTEMA ── */}
      {sistema && (
        <div className={"s-" + sistema.id}>
          {voltarApp}
          <div className="detail-header">
            <button className="back-btn" onClick={irHome}>‹ Sistemas</button>
            <div className="detail-color" />
            <span className="detail-title">{sistema.detailTitle}</span>
          </div>
          <div className="search-bar">
            <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            <input type="text" value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="Pesquisar patologia, fármaco ou microrganismo..." />
          </div>
          {filtradas.length === 0
            ? <div className="dose-help">Sem resultados para esta pesquisa.</div>
            : filtradas.map((d) => (
              <CartaoDoenca key={d.id} d={d} sistemaId={sistema.id}
                aberta={aberta === d.id} onToggle={() => toggleDoenca(d.id)}
                abaAtiva={abaDe(d)} setAba={setAba}
                registarRef={(id, el) => { cardRefs.current[id] = el; }} />
            ))}
        </div>
      )}

      {/* ── VISTA DE DOSES (pediatria) ── */}
      {vistaDoses && ehPed && (
        <div className="s-outras">
          {voltarApp}
          <Html html={dados.doses.html} onClick={onClickDoses} />
        </div>
      )}

      {/* ── FAB + popover de cálculo (pediatria) ── */}
      {ehPed && (
        <>
          <button className="dose-calc-fab s-gi" onClick={() => setPopover((v) => !v)} aria-label="Aprende a calcular a dose">
            {iconeCalc}
          </button>
          {popover && (
            <Html className="dose-calc-popover s-gi" html={dados.doseCalcPopover} onClick={onClickPopover} />
          )}
        </>
      )}
    </div>
  );
}
