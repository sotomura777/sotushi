import { useState, useMemo } from "react";
import DB from "@conteudo/saude-infantil/consultas.json";
import DETAIL from "@conteudo/saude-infantil/detalhes.json";
import mchat from "@conteudo/saude-infantil/mchat.json";
import { FASES, CORES_ITEM, ALERTA_INFO, corUrgencia, calcularMCHAT } from "./logica";
import Crescimento from "./Crescimento.jsx";
import Tanner from "./Tanner.jsx";
import { TensaoArterial, Snellen, Fluor, Referenciar } from "./FerramentasExtra";
import { I, Ico } from "@/components/icones";
import { EmojiIco, limparEmojis } from "@/components/emoji";
import "./estilo.css";

const TABS = [["avaliar", "Avaliar"], ["antecipar", "Antecipar"], ["alertas", "Alertas"], ["vacinas", "Vacinas"]];
const FERRAMENTAS = [
  ["consultas", "Consultas"], ["crescimento", "Crescimento"], ["tanner", "Tanner"],
  ["mchat", "M-CHAT"], ["ta", "T. Arterial"], ["snellen", "Snellen"], ["fluor", "Flúor"], ["referenciar", "Referenciar"],
];
const ICO_FASE = { bebe: "baby", crian: "child", jov: "youth" };
const ICO_ALERTA = { red: "siren", orange: "warn", green: "checkCircle" };

function LinhaDetalhe({ rotulo, children }) {
  return <div className="si-acc-row"><div className="si-acc-label">{rotulo}</div><div className="si-acc-text">{children}</div></div>;
}
function Tag({ cor, children }) {
  return <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 5, background: cor.fundo, color: cor.texto, border: `1px solid ${cor.borda}`, marginRight: 4 }}>{children}</span>;
}
function Detalhe({ det, tab }) {
  if (!det) return null;
  if (tab === "avaliar") return (<>
    {det.tecnica && <LinhaDetalhe rotulo="Como avaliar">{det.tecnica}</LinhaDetalhe>}
    {det.normal && <LinhaDetalhe rotulo="Normal"><Tag cor={ALERTA_INFO.green}>Normal</Tag>{det.normal}</LinhaDetalhe>}
    {det.alterado && <LinhaDetalhe rotulo="Alterado"><Tag cor={ALERTA_INFO.red}>Alterado</Tag>{det.alterado}</LinhaDetalhe>}
    {det.conduta && <LinhaDetalhe rotulo="Conduta">{det.conduta}</LinhaDetalhe>}
  </>);
  if (tab === "antecipar") return (<>
    {det.mensagem && <LinhaDetalhe rotulo="Mensagem"><strong>{det.mensagem}</strong></LinhaDetalhe>}
    {det.como_explicar && <LinhaDetalhe rotulo="Como explicar">{det.como_explicar}</LinhaDetalhe>}
    {det.recursos && <LinhaDetalhe rotulo="Nota">{det.recursos}</LinhaDetalhe>}
  </>);
  if (tab === "alertas") return (<>
    {det.criterio && <LinhaDetalhe rotulo="Detalhe clínico">{det.criterio}</LinhaDetalhe>}
    {det.urgencia && <LinhaDetalhe rotulo="Prioridade"><Tag cor={corUrgencia(det.urgencia)}>{limparEmojis(det.urgencia)}</Tag></LinhaDetalhe>}
    {det.conduta && det.conduta !== det.criterio && <LinhaDetalhe rotulo="Conduta">{det.conduta}</LinhaDetalhe>}
  </>);
  return (<>
    {det.dose_info && <LinhaDetalhe rotulo="Esquema">{det.dose_info}</LinhaDetalhe>}
    {det.via && <LinhaDetalhe rotulo="Via e local">{det.via}</LinhaDetalhe>}
    {det.reacoes && <LinhaDetalhe rotulo="Reações esperadas">{det.reacoes}</LinhaDetalhe>}
    {det.contra && <LinhaDetalhe rotulo="Contraindicações">{det.contra}</LinhaDetalhe>}
  </>);
}

export default function SaudeInfantil({ accent = "#ec4899", gradiente, onVoltar }) {
  const [ferramenta, setFerramenta] = useState("consultas");
  const idades = useMemo(() => Object.keys(DB), []);
  const [idade, setIdade] = useState(idades[0]);
  const [tab, setTab] = useState("avaliar");
  const [abertos, setAbertos] = useState({});

  const grupos = useMemo(() => {
    const g = {};
    idades.forEach((a) => { const f = DB[a].fase; (g[f] = g[f] || []).push(a); });
    return g;
  }, [idades]);
  const toggle = (k) => setAbertos((p) => ({ ...p, [k]: !p[k] }));
  const consulta = DB[idade];
  const itens = consulta[tab] || [];

  return (
    <div style={{ "--acento": accent }}>
      <header className="hero" style={{ background: gradiente || accent }}>
        <div className="hero-conteudo">
          <button className="voltar" onClick={onVoltar}>← Início</button>
          <div className="hero-titulo">Vigilância Infantil</div>
          <div className="hero-subtitulo">PNSIJ · consultas, desenvolvimento e rastreios</div>
        </div>
      </header>

      <div className="modulo-corpo">
        <div className="si-ferramentas">
          {FERRAMENTAS.map(([id, lbl]) => (
            <button key={id} className={"filtro" + (ferramenta === id ? " filtro--ativo" : "")} style={ferramenta === id ? { background: accent } : undefined} onClick={() => setFerramenta(id)}>{lbl}</button>
          ))}
        </div>

        {ferramenta === "crescimento" && <div style={{ marginTop: 12 }}><Crescimento accent={accent} /></div>}
        {ferramenta === "tanner" && <div style={{ marginTop: 12 }}><Tanner accent={accent} /></div>}
        {ferramenta === "ta" && <div style={{ marginTop: 12 }}><TensaoArterial accent={accent} /></div>}
        {ferramenta === "snellen" && <div style={{ marginTop: 12 }}><Snellen /></div>}
        {ferramenta === "fluor" && <div style={{ marginTop: 12 }}><Fluor /></div>}
        {ferramenta === "referenciar" && <div style={{ marginTop: 12 }}><Referenciar /></div>}
        {ferramenta === "mchat" && <MChatBody accent={accent} />}

        {ferramenta === "consultas" && (
          <>
            {["bebe", "crian", "jov"].map((f) =>
              grupos[f] ? (
                <div key={f} style={{ marginTop: 12 }}>
                  <div className="secao-label" style={{ color: FASES[f].cor }}><Ico name={ICO_FASE[f]} c={FASES[f].cor} s={14} style={{ marginRight: 5 }} />{FASES[f].label}</div>
                  <div className="filtros">
                    {grupos[f].map((a) => (
                      <button key={a} className={"filtro" + (idade === a ? " filtro--ativo" : "")} style={idade === a ? { background: accent } : undefined} onClick={() => { setIdade(a); setAbertos({}); }}>{a}</button>
                    ))}
                  </div>
                </div>
              ) : null
            )}

            <div className="si-tabs">
              {TABS.map(([k, lbl]) => (
                <button key={k} className={"si-tab" + (tab === k ? " on" : "")} onClick={() => { setTab(k); setAbertos({}); }}>
                  {lbl}<span className="si-tab-n">{(consulta[k] || []).length}</span>
                </button>
              ))}
            </div>

            <div style={{ marginTop: 12 }}>
              {(tab === "avaliar" || tab === "antecipar") && itens.map((it, i) => {
                const det = DETAIL[idade]?.[tab]?.[i]; const k = tab + i;
                return (
                  <div key={i} className="si-item" onClick={() => det && toggle(k)}>
                    <span className="si-ico" style={{ background: CORES_ITEM[it[1]] || "var(--superficie-2)" }}><EmojiIco e={it[0]} s={16} /></span>
                    <div style={{ flex: 1 }}>
                      <strong>{limparEmojis(it[2])}</strong><span className="si-sub">{limparEmojis(it[3])}</span>
                      {det && abertos[k] && <div className="si-acc"><Detalhe det={det} tab={tab} /></div>}
                    </div>
                    {det && <span className="si-arrow">{abertos[k] ? "▲" : "▼"}</span>}
                  </div>
                );
              })}

              {tab === "alertas" && (itens.length === 0 ? (
                <div className="si-alerta" style={{ background: ALERTA_INFO.green.fundo, borderColor: ALERTA_INFO.green.borda }}><Ico name="checkCircle" c={ALERTA_INFO.green.texto} s={16} /><div><strong>Sem alertas específicos</strong><div className="si-sub">Observação de rotina.</div></div></div>
              ) : itens.map((it, i) => {
                const info = ALERTA_INFO[it[0]] || ALERTA_INFO.green; const det = DETAIL[idade]?.alertas?.[i]; const k = "al" + i;
                return (
                  <div key={i} className="si-alerta" style={{ background: info.fundo, borderColor: info.borda, cursor: det ? "pointer" : "default" }} onClick={() => det && toggle(k)}>
                    <Ico name={ICO_ALERTA[it[0]] || "checkCircle"} c={info.texto} s={16} />
                    <div style={{ flex: 1 }}><strong style={{ color: info.texto }}>{it[1]}</strong><div className="si-sub">{it[2]}</div>{det && abertos[k] && <div className="si-acc"><Detalhe det={det} tab="alertas" /></div>}</div>
                    {det && <span className="si-arrow">{abertos[k] ? "▲" : "▼"}</span>}
                  </div>
                );
              }))}

              {tab === "vacinas" && (itens.length === 0 ? (
                <div className="si-alerta" style={{ background: ALERTA_INFO.green.fundo, borderColor: ALERTA_INFO.green.borda }}><Ico name="checkCircle" c={ALERTA_INFO.green.texto} s={16} /><div><strong>Sem vacinas programadas</strong><div className="si-sub">Verificar estado vacinal no BSIJ e atualizar conforme PNV 2025.</div></div></div>
              ) : (
                <>
                  <div className="si-alerta" style={{ background: "#eff6ff", borderColor: "#bfdbfe" }}><Ico name="info" c="#1e40af" s={16} /><div><strong style={{ color: "#1e40af" }}>Verificar BSIJ antes de administrar</strong><div className="si-sub">Confirmar esquema e atualizar vacinas em atraso.</div></div></div>
                  {itens.map((it, i) => {
                    const det = DETAIL[idade]?.vacinas?.[i]; const k = "vac" + i;
                    return (
                      <div key={i} className="si-item" onClick={() => det && toggle(k)}>
                        <span className="si-ico" style={{ background: "#fce7f3" }}>{I.syringe("#be185d", 16)}</span>
                        <div style={{ flex: 1 }}><strong>{it[0]}</strong><span className="si-sub">{it[1]} · PNV</span>{det && abertos[k] && <div className="si-acc"><Detalhe det={det} tab="vacinas" /></div>}</div>
                        {det && <span className="si-arrow">{abertos[k] ? "▲" : "▼"}</span>}
                      </div>
                    );
                  })}
                </>
              ))}
            </div>

            <div className="rodape"><strong>Nota:</strong> Apoio à consulta de vigilância (PNSIJ). Confirma sempre no Boletim de Saúde Infantil e Juvenil.</div>
          </>
        )}
      </div>
    </div>
  );
}

// ======================= M-CHAT (corpo) =======================
function MChatBody({ accent }) {
  const [respostas, setRespostas] = useState({});
  const [resultado, setResultado] = useState(null);
  const responder = (i, v) => { setRespostas((p) => ({ ...p, [i]: v })); setResultado(null); };
  const calcular = () => setResultado(calcularMCHAT(respostas, mchat.risco_nao, mchat.risco_sim));

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ fontSize: 12.5, color: "var(--suave)", marginBottom: 10 }}>Questionário M-CHAT-R (16–30 meses). Responde às 20 perguntas.</div>
      {mchat.perguntas.map((q, i) => (
        <div key={i} className="cartao" style={{ padding: "12px 14px", marginBottom: 8 }}>
          <div style={{ fontSize: 13, color: "var(--texto)", marginBottom: 8, lineHeight: 1.5 }}><span style={{ fontWeight: 700, color: "var(--suave)" }}>{i + 1}. </span>{q}</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="si-mq" style={respostas[i] === true ? { background: "#10b981", color: "#fff", borderColor: "#10b981" } : undefined} onClick={() => responder(i, true)}>Sim</button>
            <button className="si-mq" style={respostas[i] === false ? { background: "#fca5a5", color: "#7f1d1d", borderColor: "#fca5a5" } : undefined} onClick={() => responder(i, false)}>Não</button>
          </div>
        </div>
      ))}
      <button className="filtro filtro--ativo" style={{ background: accent, padding: "10px 20px", marginTop: 4 }} onClick={calcular}>Calcular score</button>

      {resultado?.faltam && (
        <div className="si-alerta" style={{ background: "#fffbeb", borderColor: "#fde68a", marginTop: 12 }}><Ico name="warn" c="#92400e" s={16} /><div><strong style={{ color: "#92400e" }}>Faltam respostas</strong><div className="si-sub">Em falta: {resultado.faltam.join(", ")}</div></div></div>
      )}
      {resultado && !resultado.faltam && (
        <div className="cartao" style={{ padding: 16, marginTop: 12, borderLeft: `4px solid ${resultado.cor}` }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: resultado.cor }}>{resultado.etiqueta}</div>
          <div style={{ fontFamily: "var(--fonte-display)", fontSize: 24, color: resultado.cor, margin: "4px 0 8px" }}>Score: {resultado.score} / 20</div>
          <div style={{ fontSize: 13, color: "var(--texto)", marginBottom: 8 }}>{resultado.interpretacao}</div>
          <div style={{ fontSize: 13, color: "var(--texto-2)" }}><strong>Conduta: </strong>{resultado.conduta}</div>
          {resultado.aPedir && <div style={{ fontSize: 12.5, color: "var(--suave)", marginTop: 6 }}><strong>A pedir: </strong>{resultado.aPedir}</div>}
        </div>
      )}
    </div>
  );
}
