import { useState, useMemo } from "react";
import dados from "@conteudo/urgencia/colica-renal-anamnese.json";
import { normalizar } from "@/lib/texto";
import { estadoInicial, fertil, genNote, quadLabel, PASSOS } from "./colica-renal-anamnese-logica.js";

const { ageBuckets: AGE_BUCKETS, quadrantes: QUADRANTES, symCats: SYM_CATS, syms: SYMS, alms: ALMS,
  drgcls: DRGCLS, ants: ANTS, stoneInfo: STONE_INFO, excCards: EXC_CARDS, ui } = dados;
const has = (a, v) => a.indexOf(v) >= 0;
const tog = (a, v) => (has(a, v) ? a.filter((x) => x !== v) : [...a, v]);

const Html = ({ html, className, style }) => <div className={className} style={style} dangerouslySetInnerHTML={{ __html: html }} />;
const EoSec = ({ t, children }) => <div className="ca-an-eo-sec"><div className="ca-an-eo-t">{t}</div>{children}</div>;
const Lbl = ({ children }) => <div className="ca-an-lbl">{children}</div>;
const Alerta = ({ tipo = "y", html }) => <Html className={"ca-an-alert " + tipo} html={html} />;

function Pill({ on, alarm, children, onClick }) {
  return <button className={"ca-an-pill" + (on ? (alarm ? " alarm" : " on") : "")} onClick={onClick}>{children}</button>;
}
function Chk({ l, d, hint, on, alarm, onClick, children }) {
  return (
    <div className={"ca-an-chk" + (on ? (alarm ? " alarm" : " on") : "")} onClick={onClick}>
      <div className="ca-an-chk-row">
        <span className="ca-an-chk-box">{on ? "✓" : ""}</span>
        <span className="ca-an-chk-info">
          <span className="ca-an-chk-l">{l}</span>
          {d && <span className="ca-an-chk-d">{d}</span>}
        </span>
        {alarm && <span className="ca-an-chk-warn">⚠</span>}
      </div>
      {hint && on && <Html className="ca-an-hint-box" html={hint} />}
      {children}
    </div>
  );
}
function Passo({ titulo, sub, num, cor, children }) {
  return (
    <div className="ca-an-card">
      <div className="ca-an-card-h">
        {num && <span className="ca-an-card-n" style={cor ? { color: cor, background: `color-mix(in srgb, ${cor} 12%, transparent)` } : undefined}>{num}</span>}
        <div>
          <div className="ca-an-card-t">{titulo}</div>
          {sub && <div className="ca-an-card-st">{sub}</div>}
        </div>
      </div>
      {children}
    </div>
  );
}

// estado "on" de um balão dos cartões de armadilha (sincronizado com sym/alm/irrad)
function balOn(D, b) {
  if (b.kind === "sym") return b.sub ? (has(D.sym, b.id) && D._symSub[b.id] === b.sub) : has(D.sym, b.id);
  if (b.kind === "alm") return has(D.alm, b.id);
  if (b.kind === "irrad") return has(D.irrad, b.id);
  return false;
}
function balLabel(b) {
  if (b.label) return b.label;
  if (b.kind === "sym") { const it = SYMS.find((x) => x.id === b.id); return it ? it.l : b.id; }
  if (b.kind === "alm") { const ia = ALMS.find((x) => x.id === b.id); return ia ? ia.l : b.id; }
  return b.id;
}

export default function ColicaRenalAnamnese({ voltar, embutido = false }) {
  const [D, setDState] = useState(estadoInicial);
  const [notaAberta, setNotaAberta] = useState(false);
  const setD = (patch) => setDState((d) => ({ ...d, ...(typeof patch === "function" ? patch(d) : patch) }));

  const idx = PASSOS.indexOf(D.step);
  const irPara = (i) => { setD({ step: PASSOS[Math.max(0, Math.min(PASSOS.length - 1, i))] }); window.scrollTo({ top: 0 }); };
  const podeAvancar = D.step !== 0 || (D.sexo && D.idade);
  const nota = useMemo(() => genNote(D), [D]);

  // toggle de um balão de armadilha — replica togBal do original
  const togBal = (b) => setD((d) => {
    if (b.kind === "sym") {
      if (b.sub) {
        if (has(d.sym, b.id) && d._symSub[b.id] === b.sub) {
          const sub = { ...d._symSub }; delete sub[b.id];
          return { sym: d.sym.filter((x) => x !== b.id), _symSub: sub };
        }
        const sym = has(d.sym, b.id) ? d.sym : [...d.sym, b.id];
        return { sym, _symSub: { ...d._symSub, [b.id]: b.sub } };
      }
      const sym = tog(d.sym, b.id);
      const sub = { ...d._symSub }; if (!has(sym, b.id)) delete sub[b.id];
      return { sym, _symSub: sub };
    }
    if (b.kind === "alm") return { alm: tog(d.alm, b.id) };
    if (b.kind === "irrad") return { irrad: tog(d.irrad, b.id) };
    return {};
  });

  const passo0 = (
    <Passo titulo="Construir o caso clínico" sub="Define um perfil fictício para treinares" num="1">
      <div className="ca-an-como">
        <div className="ca-an-como-t">{ui.intro.comoTitulo}</div>
        <Html html={ui.intro.comoTexto} />
      </div>
      <Html className="ca-termos" style={{ marginTop: 0 }} html={ui.intro.aviso} />
      <Lbl>Faixa etária do caso</Lbl>
      <div className="ca-an-flex">
        {AGE_BUCKETS.map((b) => <Pill key={b.k} on={D.idade === b.k} onClick={() => setD({ idade: b.k })}>{b.l} · {b.r}</Pill>)}
      </div>
      <Lbl>Sexo</Lbl>
      <div className="ca-an-flex">
        <Pill on={D.sexo === "M"} onClick={() => setD({ sexo: "M" })}>Masculino</Pill>
        <Pill on={D.sexo === "F"} onClick={() => setD({ sexo: "F" })}>Feminino</Pill>
      </div>
      <Lbl>Estabilidade hemodinâmica</Lbl>
      <div className="ca-an-flex">
        <Pill on={D.hemodin === "estavel"} onClick={() => setD({ hemodin: "estavel" })}>Estável</Pill>
        <Pill alarm on={D.hemodin === "instavel"} onClick={() => setD({ hemodin: "instavel" })}>Instável</Pill>
      </div>
    </Passo>
  );

  const grupoPills = (label, opts, campo, alerts, multi) => (
    <div style={{ marginBottom: 16 }}>
      <Lbl>{label}</Lbl>
      <div className="ca-an-flex">
        {opts.map(([v, l, alarm]) => (
          <Pill key={v} alarm={alarm}
            on={multi ? has(D[campo], v) : D[campo] === v}
            onClick={() => setD((d) => (multi ? { [campo]: tog(d[campo], v) } : { [campo]: d[campo] === v ? "" : v }))}>{l}</Pill>
        ))}
      </div>
      {alerts}
    </div>
  );

  const passo1 = (
    <Passo titulo="Caracterização da dor" sub="SOCRATES aplicado à dor no flanco/lombar (suspeita de cólica renal)" num="2">
      <Html className="ca-an-alert y" style={{ marginBottom: 18 }} html={ui.caract.socrates} />
      {grupoPills("Modo de início", [["subito", "Súbito (segundos a horas)", true], ["gradual", "Gradual (dias a semanas/meses)"]], "inicio", (
        <>
          {D.inicio === "subito" && <Alerta tipo="r" html={ui.caract.inicioSubito} />}
          {D.inicio === "gradual" && <Alerta html={ui.caract.inicioGradual} />}
        </>
      ))}
      <Lbl>Duração</Lbl>
      <div className="ca-an-flex" style={{ marginBottom: 8 }}>
        {[["aguda", "Aguda", "< 7 dias"], ["subaguda", "Subaguda", "7 dias – 3 sem"], ["cronica", "Crónica", "> 3 semanas"]].map(([v, l, d]) => (
          <div key={v} className={"ca-an-opt centro" + (D.dur === v ? " sel" : "")} onClick={() => setD({ dur: v })}>
            <div>{l}</div><div className="ca-an-opt-d">{d}</div>
          </div>
        ))}
      </div>
      {D.dur === "aguda" && <Alerta tipo="r" html={ui.caract.durAguda} />}
      {D.dur === "subaguda" && <Alerta html={ui.caract.durSubaguda} />}
      {D.dur === "cronica" && <Alerta html={ui.caract.durCronica} />}
      {D.dur && <input className="campo ca-an-inp" value={D.durT} onChange={(e) => setD({ durT: e.target.value })}
        placeholder={D.dur === "aguda" ? "Há quantas horas/dias..." : D.dur === "subaguda" ? "Há quantos dias..." : "Há quantas semanas/meses..."} />}
      <Lbl>Intensidade (1–10)</Lbl>
      <div className="da-intens">
        {Array.from({ length: 10 }, (_, k) => k + 1).map((n) => {
          const on = D.intens && parseInt(D.intens) === n;
          return <button key={n} className={"da-intens-dot" + (on ? (n >= 7 ? " on alta" : n >= 4 ? " on media" : " on") : "")} onClick={() => setD({ intens: String(n) })}>{n}</button>;
        })}
      </div>
      {D.intens && parseInt(D.intens) >= 7 && <Alerta tipo="r" html={ui.caract.intens7} />}
      {grupoPills("Tipo de dor (pode seleccionar mais que um)",
        [["colica", "Cólica"], ["continua", "Contínua"], ["queimor", "Queimor"], ["facada", "Facada"], ["opressiva", "Opressiva"], ["surda", "Surda / vaga"]], "tipo", (
          <>{["colica", "continua", "queimor", "facada", "opressiva", "surda"].map((t) =>
            has(D.tipo, t) ? <Alerta key={t} tipo={t === "facada" || t === "opressiva" ? "r" : "y"} html={ui.caract.tipos[t]} /> : null)}</>
        ), true)}
      <Lbl>Localização (toca no quadrante doloroso)</Lbl>
      <div className="da-quad-layout">
        <div>
          <div className="da-qgrid">
            {QUADRANTES.map((q) => (
              <button key={q.id} className={"da-qcell" + (has(D.loc, q.id) ? " on" : "")} onClick={() => setD((d) => ({ loc: has(d.loc, q.id) ? [] : [q.id], difusa: false }))}>
                {q.l}<span className="da-qf">{q.full}</span>
              </button>
            ))}
          </div>
          <div style={{ marginTop: 8 }}>
            <Pill on={D.difusa} onClick={() => setD((d) => ({ difusa: !d.difusa, loc: !d.difusa ? [] : d.loc }))}>Dor difusa / mal localizada</Pill>
          </div>
        </div>
        <div className="da-quad-info">
          {QUADRANTES.map((q) => has(D.loc, q.id) && ui.caract.quadrantes[q.id] ? <Alerta key={q.id} html={ui.caract.quadrantes[q.id]} /> : null)}
          {D.difusa && <Alerta tipo="r" html={ui.caract.difusa} />}
          {!D.loc.length && !D.difusa && <div className="ca-an-hint">Selecciona um quadrante para ver as pistas clínicas.</div>}
        </div>
      </div>
      <div style={{ marginBottom: 16 }}>
        <Lbl>Irradiação</Lbl>
        <div className="ca-an-flex">
          {[["dorso", "Dorso"], ["ombrod", "Ombro/escápula dta"], ["ombroe", "Ombro/escápula esq"], ["virilha", "Virilha / genitais"], ["retro", "Retroesternal"], ["flancos", "Flancos / cintura"]].map(([v, l]) => (
            <Pill key={v} on={has(D.irrad, v)} onClick={() => setD((d) => ({ irrad: has(d.irrad, v) ? [] : [v] }))}>{l}</Pill>
          ))}
        </div>
        {["dorso", "virilha", "ombrod", "ombroe", "retro", "flancos"].map((t) =>
          has(D.irrad, t) ? <Alerta key={t} tipo={t === "ombroe" ? "r" : "y"} html={ui.caract.irrad[t]} /> : null)}
      </div>
      {grupoPills("Padrão temporal",
        [["constante", "Constante"], ["intermit", "Intermitente"], ["crescendo", "Em crescendo"], ["resolucao", "Em resolução"]], "padrao", (
          <>{["constante", "intermit", "crescendo", "resolucao"].map((t) =>
            D.padrao === t ? <Alerta key={t} html={ui.caract.padrao[t]} /> : null)}</>
        ))}
      <Lbl>Modulação (o que alivia ou agrava)</Lbl>
      {[["alim", "Com a alimentação"], ["jejum", "Com o jejum"], ["defec", "Com a defecação"], ["mov", "Com o movimento / tosse"], ["pos", "Com a posição (curvar-se)"]].map(([k, l]) => (
        <div key={k} className="da-mod-row">
          <span>{l}</span>
          <div className="ca-an-flex">
            <Pill on={D.mod[k] === "alivia"} onClick={() => setD((d) => ({ mod: { ...d.mod, [k]: d.mod[k] === "alivia" ? null : "alivia" } }))}>Alivia</Pill>
            <Pill on={D.mod[k] === "agrava"} onClick={() => setD((d) => ({ mod: { ...d.mod, [k]: d.mod[k] === "agrava" ? null : "agrava" } }))}>Agrava</Pill>
          </div>
        </div>
      ))}
      {D.mod.alim === "alivia" && <Alerta html={ui.caract.mod.alimAlivia} />}
      {D.mod.alim === "agrava" && <Alerta html={ui.caract.mod.alimAgrava} />}
      {D.mod.jejum === "alivia" && <Alerta html={ui.caract.mod.jejumAlivia} />}
      {D.mod.jejum === "agrava" && <Alerta html={ui.caract.mod.jejumAgrava} />}
      {D.mod.defec === "alivia" && <Alerta html={ui.caract.mod.defecAlivia} />}
      {D.mod.defec === "agrava" && <Alerta html={ui.caract.mod.defecAgrava} />}
      {D.mod.mov === "agrava" && <Alerta tipo="r" html={ui.caract.mod.movAgrava} />}
      {D.mod.pos === "alivia" && <Alerta html={ui.caract.mod.posAlivia} />}
      {D.mod.pos === "agrava" && <Alerta html={ui.caract.mod.posAgrava} />}
    </Passo>
  );

  const passo15 = (
    <Passo titulo="Contexto desencadeante" sub="Elementos do contexto que orientam o raciocínio clínico" cor="#ca8a04">
      <Alerta html={ui.contexto.aviso} />
      <Lbl>{ui.contexto.pergunta}</Lbl>
      <div className="ca-an-hint" style={{ marginTop: 0 }}>{ui.contexto.perguntaHint}</div>
      <div className="ca-an-flex">
        <Pill on={D.desRec === "sim"} onClick={() => setD({ desRec: "sim" })}>Sim</Pill>
        <Pill on={D.desRec === "nao"} onClick={() => setD({ desRec: "nao", relRef: "", ainesRec: null, movDes: null, menstr: "" })}>Não / não aplicável</Pill>
      </div>
      {D.desRec === "nao" && <Alerta html={ui.contexto.semCtx} />}
      {D.desRec === "sim" && (
        <>
          <Lbl>Fator desencadeante recente</Lbl>
          <div className="ca-an-flex">
            {[["desidratacao", "Desidratação / calor intenso"], ["esforco", "Exercício físico intenso"], ["imobil", "Imobilização prolongada"], ["sem", "Sem relação clara"]].map(([v, l]) => (
              <Pill key={v} on={D.relRef === v} onClick={() => setD({ relRef: D.relRef === v ? "" : v })}>{l}</Pill>
            ))}
          </div>
          {D.relRef === "desidratacao" && <Alerta html={ui.contexto.relDesidratacao} />}
          {D.relRef === "esforco" && <Alerta html={ui.contexto.relEsforco} />}
          {D.relRef === "imobil" && <Alerta html={ui.contexto.relImobil} />}
          <Lbl>Uso recente de AINEs?</Lbl>
          <div className="ca-an-flex">
            <Pill on={D.ainesRec === true} onClick={() => setD({ ainesRec: D.ainesRec === true ? null : true })}>Sim</Pill>
            <Pill on={D.ainesRec === false} onClick={() => setD({ ainesRec: D.ainesRec === false ? null : false })}>Não</Pill>
          </div>
          {D.ainesRec === true && <Alerta html={ui.contexto.aines} />}
          <Lbl>Comportamento durante a dor</Lbl>
          <div className="ca-an-flex">
            <Pill on={D.movDes === "agita"} onClick={() => setD({ movDes: D.movDes === "agita" ? null : "agita" })}>Não consegue parar quieto (agitação)</Pill>
            <Pill alarm on={D.movDes === "imobiliza"} onClick={() => setD({ movDes: D.movDes === "imobiliza" ? null : "imobiliza" })}>Fica imóvel (qualquer movimento dói)</Pill>
          </div>
          {D.movDes === "agita" && <Alerta html={ui.contexto.movAgita} />}
          {D.movDes === "imobiliza" && <Alerta tipo="r" html={ui.contexto.movImobiliza} />}
          {fertil(D) && (
            <>
              <Lbl>Relação com o ciclo menstrual</Lbl>
              <div className="ca-an-flex">
                {[["peri", "Peri-menstrual"], ["meio", "A meio do ciclo"], ["sem", "Sem relação"]].map(([v, l]) => (
                  <Pill key={v} on={D.menstr === v} onClick={() => setD({ menstr: D.menstr === v ? "" : v })}>{l}</Pill>
                ))}
              </div>
              {D.menstr === "peri" && <Alerta html={ui.contexto.menstrPeri} />}
              {D.menstr === "meio" && <Alerta html={ui.contexto.menstrMeio} />}
            </>
          )}
        </>
      )}
    </Passo>
  );

  // Passo 2 — quatro armadilhas a excluir (cartões com balões), fiel ao original
  const passo2 = (
    <Passo titulo="Sinais de alarme" sub="Quatro entidades a excluir activamente perante uma suspeita de cólica renal (treino de raciocínio)" num="3" cor="#dc2626">
      <Html className="ca-an-exc-intro" html={ui.alm.intro} />
      <div className="ca-an-exc-grid">
        {EXC_CARDS.map((c) => (c.onlyFertil && !fertil(D)) ? null : (
          <div key={c.id} className={"ca-an-exc-card" + (D._excExp[c.id] ? " expanded" : "")}>
            <div className="ca-an-exc-title">{c.title}</div>
            <div className="ca-an-exc-sub">{c.sub}</div>
            <div className="ca-an-exc-hint">Sintomas que reforçam a hipótese</div>
            <div className="ca-an-flex">
              {c.balloons.map((b, bi) => (
                <button key={bi} className={"ca-an-exc-bal" + (balOn(D, b) ? " on" : "")} onClick={() => togBal(b)}>{balLabel(b)}</button>
              ))}
            </div>
            <button className="ca-an-exc-toggle" onClick={() => setD((d) => ({ _excExp: { ...d._excExp, [c.id]: !d._excExp[c.id] } }))}>
              <span>{D._excExp[c.id] ? "Recolher explicação" : "Ver explicação"}</span><span className="ca-an-exc-chev">▾</span>
            </button>
            {D._excExp[c.id] && <Html className="ca-an-exc-explain" html={c.back} />}
          </div>
        ))}
      </div>
      <Alerta html={ui.alm.nota} />
    </Passo>
  );

  const condAge = (cond) => (cond === "young" && D.idade === "jovem") ||
    (cond === "old" && (D.idade === "meia" || D.idade === "idoso"));
  const passo3 = (
    <Passo titulo="Sintomas associados" sub="Seleccionar todos os presentes" num="4">
      <Html className="ca-an-exc-intro" html={ui.sym.intro} />
      <input className="campo ca-an-inp" value={D._symFilter} onChange={(e) => setD({ _symFilter: e.target.value })} placeholder="Pesquisar sintoma..." />
      {SYM_CATS.map((cat) => {
        if (D.sexo === "M" && cat.id === "Gineco") return null;
        const sf = normalizar(D._symFilter);
        const fl = SYMS.filter((s) => s.cat === cat.id && (!sf || normalizar(s.l + " " + s.d + " " + (s.h || "")).includes(sf)));
        if (!fl.length) return null;
        return (
          <div key={cat.id} style={{ marginBottom: 12 }}>
            <div className="ca-an-cat">{cat.label}</div>
            <div className="ca-an-grid2">
              {fl.map((s) => (
                <div key={s.id}>
                  <Chk l={s.l} d={s.d} hint={s.h} on={has(D.sym, s.id)}
                    onClick={() => setD((d) => { const sym = tog(d.sym, s.id); const sub = { ...d._symSub }; if (!has(sym, s.id)) delete sub[s.id]; return { sym, _symSub: sub }; })} />
                  {s.h_age && has(D.sym, s.id) && s.h_age.map((ha, i) => condAge(ha.cond) ? <Alerta key={i} html={ha.txt} /> : null)}
                  {s.sub && has(D.sym, s.id) && (
                    <div className="ca-an-flex" style={{ margin: "6px 0 8px 4px" }}>
                      {s.sub.map((sb) => (
                        <Pill key={sb.v} on={D._symSub[s.id] === sb.v} onClick={() => setD((d) => ({ _symSub: { ...d._symSub, [s.id]: d._symSub[s.id] === sb.v ? null : sb.v } }))}>{sb.l}</Pill>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </Passo>
  );

  const togGrupo = (label, opts, campo, hint) => (
    <div style={{ marginBottom: 10 }}>
      <Lbl>{label}</Lbl>
      <div className="ca-an-flex">
        {opts.map(([v, l, alarm]) => <Pill key={v} alarm={alarm} on={D[campo] === v} onClick={() => setD({ [campo]: D[campo] === v ? null : v })}>{l}</Pill>)}
      </div>
      {hint && <Html className="ca-an-hint-box danger" html={hint} />}
    </div>
  );
  const passo4 = (
    <Passo titulo="Hábitos de vida" sub="Hábitos com impacto no risco litiásico e na interpretação do quadro" num="5">
      <p className="ca-an-intro">{ui.hab.intro}</p>
      {togGrupo("Álcool", [["nao", "Não"], ["social", "Social"], ["regular", "Regular"], ["excessivo", "Excessivo", true]], "alc", D.alc === "excessivo" ? ui.hab.alcExc : null)}
      {togGrupo("Tabaco", [["nao", "Não fumador"], ["ex", "Ex-fumador"], ["sim", "Fumador", true]], "tabac", D.tabac === "sim" ? ui.hab.tabaco : null)}
      {togGrupo("Dieta", [["equilibrada", "Equilibrada / boa hidratação"], ["gordura", "Rica em sal e proteína animal"], ["pobrefibra", "Rica em oxalato"], ["restritiva", "Baixa ingestão de líquidos"]], "dieta",
        D.dieta === "gordura" ? ui.hab.dietaGordura : D.dieta === "pobrefibra" ? ui.hab.dietaOxalato : D.dieta === "restritiva" ? ui.hab.dietaLiquidos : null)}
      {togGrupo("Actividade física", [["sedentario", "Sedentário"], ["moderado", "Moderada"], ["regular", "Regular"]], "exerc", null)}
    </Passo>
  );

  const passo5 = (
    <Passo titulo="Medicação" sub="Medicação habitual, incluindo fármacos litogénicos e relevantes para a analgesia" num="6">
      <p className="ca-an-intro">{ui.med.intro}</p>
      <Lbl>Pesquisar ou adicionar (Enter adiciona)</Lbl>
      {D.dTg.length > 0 && (
        <div className="ca-an-tags">{D.dTg.map((t) => <span key={t} className="ca-an-tag" onClick={() => setD((d) => ({ dTg: d.dTg.filter((x) => x !== t) }))}>{t} ×</span>)}</div>
      )}
      <input className="campo ca-an-inp" value={D._drgFilter} onChange={(e) => setD({ _drgFilter: e.target.value })} placeholder="Pesquisar fármaco..."
        onKeyDown={(e) => {
          if (e.key !== "Enter" || !e.target.value.trim()) return;
          e.preventDefault();
          const v = e.target.value.trim();
          const f = normalizar(v);
          const hit = DRGCLS.flatMap((c) => c.drugs).find((dr) => normalizar(dr).includes(f));
          if (hit) setD((d) => ({ cDr: tog(d.cDr, hit), nDr: false, _drgFilter: "" }));
          else setD((d) => (has(d.dTg, v) ? { _drgFilter: "" } : { dTg: [...d.dTg, v], _drgFilter: "" }));
        }} />
      <Chk l="Nenhum relevante" on={D.nDr} onClick={() => setD({ nDr: true, cDr: [] })} />
      {DRGCLS.map((cls) => {
        const f = normalizar(D._drgFilter);
        const vis = cls.drugs.filter((d) => !f || normalizar(d + " " + cls.cls + " " + (cls.mech || "")).includes(f));
        if (!vis.length) return null;
        const any = cls.drugs.some((d) => has(D.cDr, d));
        const mid = "mech_" + cls.cls.replace(/[^a-zA-Z]/g, "");
        return (
          <div key={cls.cls} style={{ marginBottom: 12 }}>
            <div className="ca-an-drg-h">
              <span className={"ca-an-drg-cls" + (any ? " on" : "")}>{cls.cls}</span>
              {cls.mech && !any && <button className="ca-an-link" onClick={() => setD((d) => ({ hn: { ...d.hn, [mid]: !d.hn[mid] } }))}>{D.hn[mid] ? "Esconder" : "Mecanismo"}</button>}
            </div>
            {cls.mech && (any || D.hn[mid]) && <Html className="ca-an-hint-box" html={cls.mech} />}
            <div className="ca-an-flex">
              {vis.map((d) => <Pill key={d} on={has(D.cDr, d)} onClick={() => setD((dd) => ({ cDr: tog(dd.cDr, d), nDr: false }))}>{d}</Pill>)}
            </div>
          </div>
        );
      })}
    </Passo>
  );

  const passo6 = (
    <Passo titulo="Antecedentes" sub="Antecedentes pessoais e familiares com relevância para a litíase" num="7">
      <p className="ca-an-intro">{ui.ant.intro}</p>
      <Lbl>Pesquisar ou adicionar</Lbl>
      {D.aTg.length > 0 && (
        <div className="ca-an-tags">{D.aTg.map((t) => <span key={t} className="ca-an-tag" onClick={() => setD((d) => ({ aTg: d.aTg.filter((x) => x !== t) }))}>{t} ×</span>)}</div>
      )}
      <input className="campo ca-an-inp" value={D._antFilter} onChange={(e) => setD({ _antFilter: e.target.value })} placeholder="Pesquisar antecedente..."
        onKeyDown={(e) => {
          if (e.key !== "Enter" || !e.target.value.trim()) return;
          e.preventDefault();
          const v = e.target.value.trim();
          const m = ANTS.filter((a) => normalizar(a.l).includes(normalizar(v)));
          if (m.length) setD((d) => ({ ant: tog(d.ant, m[0].id), nAn: false, _antFilter: "" }));
          else setD((d) => (has(d.aTg, v) ? { _antFilter: "" } : { aTg: [...d.aTg, v], _antFilter: "" }));
        }} />
      <Chk l="Nenhum relevante" on={D.nAn} onClick={() => setD({ nAn: true, ant: [] })} />
      <div className="ca-an-grid2">
        {ANTS.filter((a) => !D._antFilter || normalizar(a.l + " " + a.d + " " + a.id).includes(normalizar(D._antFilter))).map((a) => (
          <div key={a.id}>
            <Chk l={a.l} d={a.d} on={has(D.ant, a.id)} onClick={() => setD((d) => ({ ant: tog(d.ant, a.id), nAn: false }))} />
            {a.sub && has(D.ant, a.id) && (
              <>
                <div className="ca-an-flex" style={{ margin: "4px 0 8px 4px" }}>
                  {a.sub.map((sb) => (
                    <Pill key={sb.v} on={D._symSub[a.id] === sb.v} onClick={() => setD((d) => ({ _symSub: { ...d._symSub, [a.id]: d._symSub[a.id] === sb.v ? null : sb.v } }))}>{sb.l}</Pill>
                  ))}
                </div>
                {a.id === "litr" && D._symSub["litr"] && STONE_INFO[D._symSub["litr"]] && <Alerta html={STONE_INFO[D._symSub["litr"]]} />}
              </>
            )}
          </div>
        ))}
      </div>
      <div className="ca-an-divisor"><Lbl>Antecedentes familiares</Lbl></div>
      <div className="ca-an-flex">
        <Pill on={D.hxFam.litfam} onClick={() => setD((d) => ({ hxFam: { ...d.hxFam, litfam: !d.hxFam.litfam } }))}>Litíase renal familiar</Pill>
        <Pill on={D.hxFam.renalfam} onClick={() => setD((d) => ({ hxFam: { ...d.hxFam, renalfam: !d.hxFam.renalfam } }))}>Doença renal hereditária</Pill>
        <Pill on={D.hxFam.gotafam} onClick={() => setD((d) => ({ hxFam: { ...d.hxFam, gotafam: !d.hxFam.gotafam } }))}>Gota / hiperuricemia</Pill>
      </div>
      {(D.hxFam.litfam || D.hxFam.renalfam || D.hxFam.gotafam) && (
        <input className="campo ca-an-inp" value={D.hxFam.det} onChange={(e) => setD((d) => ({ hxFam: { ...d.hxFam, det: e.target.value } }))} placeholder="Especificar (ex.: rim poliquístico, cistinúria)..." />
      )}
    </Passo>
  );

  const togBin = (on, lOn, lOff, onClick) => <button className={"ca-an-togbtn" + (on ? "" : " off")} onClick={onClick}>{on ? lOn : lOff}</button>;
  const passo7 = (
    <Passo titulo="Exame objectivo" sub="Achados do exame físico dirigido à cólica renal (deixe sem alterar se normal)" num="8">
      <p className="ca-an-intro">{ui.eo.intro}</p>
      <EoSec t="Sinais vitais">
        <div className="ca-an-grid2">
          {[["pa", "PA (mmHg)", "120/80"], ["fc", "FC (bpm)", "80"], ["temp", "Temp (°C)", "36.7"], ["fr", "FR (cpm)", "16"], ["spo2", "SpO₂ (%)", "98"]].map(([k, l, ph]) => (
            <div key={k}><Lbl>{l}</Lbl><input className="campo ca-an-inp" value={D.sv[k]} onChange={(e) => setD((d) => ({ sv: { ...d.sv, [k]: e.target.value } }))} placeholder={ph} /></div>
          ))}
        </div>
        <div className="ca-an-hint">{ui.eo.svHint}</div>
      </EoSec>
      <EoSec t="Estado geral">
        <div className="ca-an-flex">
          {[["v", "Vigil", "Prostrado"], ["o", "Orientado", "Confuso"], ["c", "Bom estado geral", "Mau estado geral"]].map(([k, on, off]) => (
            <span key={k}>{togBin(D.eg[k], on, off, () => setD((d) => ({ eg: { ...d.eg, [k]: !d.eg[k] } })))}</span>
          ))}
        </div>
      </EoSec>
      <EoSec t="Mucosas / hidratação">
        <div className="ca-an-flex">
          {[["desc", "Descoradas", "Coradas"], ["desid", "Desidratadas", "Hidratadas"], ["ict", "Ictéricas", "Anictéricas"]].map(([id, on, off]) => (
            <span key={id}>{togBin(!has(D.muc, id), off, on, () => setD((d) => ({ muc: tog(d.muc, id) })))}</span>
          ))}
        </div>
        {has(D.muc, "desc") && <Alerta tipo="r" html={ui.eo.mucDesc} />}
        {has(D.muc, "desid") && <Alerta html={ui.eo.mucDesid} />}
        {has(D.muc, "ict") && <Alerta html={ui.eo.mucIct} />}
      </EoSec>
      <EoSec t="Auscultação cardíaca">
        <Lbl>Ritmo</Lbl>
        <div className="ca-an-flex">
          <Pill on={D.acr.r === "rit"} onClick={() => setD((d) => ({ acr: { ...d.acr, r: d.acr.r === "rit" ? null : "rit" } }))}>Rítmico</Pill>
          <Pill alarm on={D.acr.r === "arr"} onClick={() => setD((d) => ({ acr: { ...d.acr, r: d.acr.r === "arr" ? null : "arr" } }))}>Arrítmico</Pill>
        </div>
        <Lbl>Frequência</Lbl>
        <div className="ca-an-flex">
          {[["nl", "Normal"], ["taq", "Taquicárdico", true], ["bra", "Bradicárdico"]].map(([v, l, al]) => (
            <Pill key={v} alarm={al} on={D.acr.f === v} onClick={() => setD((d) => ({ acr: { ...d.acr, f: d.acr.f === v ? null : v } }))}>{l}</Pill>
          ))}
        </div>
        {D.acr.r === "arr" && <Alerta tipo="r" html={ui.eo.acrArr} />}
        {D.acr.f === "taq" && <Alerta html={ui.eo.acrTaq} />}
        {D.acr.f === "bra" && <Alerta html={ui.eo.acrBra} />}
      </EoSec>
      <EoSec t="Auscultação pulmonar">
        <Lbl>Murmúrio vesicular</Lbl>
        <div className="ca-an-flex">
          <Pill on={D.apr.mv === "nl"} onClick={() => setD((d) => ({ apr: { ...d.apr, mv: d.apr.mv === "nl" ? null : "nl" } }))}>Global mantido</Pill>
          <Pill alarm on={D.apr.mv === "dim"} onClick={() => setD((d) => ({ apr: { ...d.apr, mv: d.apr.mv === "dim" ? null : "dim" } }))}>Diminuído na base</Pill>
        </div>
        <Lbl>Ruídos adventícios</Lbl>
        <div className="ca-an-flex">
          {["Crepitações", "Sibilos"].map((r) => (
            <Pill key={r} on={has(D.apr.ra, r)} onClick={() => setD((d) => ({ apr: { ...d.apr, ra: tog(d.apr.ra, r) } }))}>{r}</Pill>
          ))}
        </div>
        {D.apr.mv === "dim" && <Alerta html={ui.eo.apMvDim} />}
        {has(D.apr.ra, "Crepitações") && <Alerta html={ui.eo.apCrep} />}
      </EoSec>
      <EoSec t="Abdómen: quadrantes dolorosos à palpação">
        <div className="da-qgrid">
          {QUADRANTES.map((q) => (
            <button key={q.id} className={"da-qcell" + (has(D.eoQuad, q.id) ? " on" : "")} onClick={() => setD((d) => ({ eoQuad: tog(d.eoQuad, q.id) }))}>
              {q.l}<span className="da-qf">{q.full}</span>
            </button>
          ))}
        </div>
        {D.eoQuad.length > 0 && <Alerta html={"Doloroso em: " + D.eoQuad.map((q) => quadLabel(q).toLowerCase()).join(", ") + ui.eo.eoQuadSufixo} />}
        <Lbl>Defesa / irritação peritoneal</Lbl>
        <div className="ca-an-flex">
          {[["sem", "Sem defesa"], ["localizada", "Defesa localizada", true], ["generalizada", "Peritonismo generalizado", true], ["tabua", "Abdómen em tábua", true]].map(([v, l, al]) => (
            <Pill key={v} alarm={al} on={D.defesa === v} onClick={() => setD({ defesa: D.defesa === v ? null : v })}>{l}</Pill>
          ))}
        </div>
        {D.defesa === "sem" && <Alerta html={ui.eo.defesaSem} />}
        {D.defesa === "localizada" && <Alerta html={ui.eo.defesaLocalizada} />}
        {D.defesa === "generalizada" && <Alerta tipo="r" html={ui.eo.defesaGeneralizada} />}
        {D.defesa === "tabua" && <Alerta tipo="r" html={ui.eo.defesaTabua} />}
        <Lbl>Ruídos hidroaéreos</Lbl>
        <div className="ca-an-flex">
          {[["nl", "Normais"], ["aum", "Aumentados", true], ["dim", "Diminuídos", true], ["aus", "Ausentes", true], ["met", "Metálicos / de luta", true]].map(([v, l, al]) => (
            <Pill key={v} alarm={al} on={D.rha === v} onClick={() => setD({ rha: D.rha === v ? null : v })}>{l}</Pill>
          ))}
        </div>
        {(D.rha === "aum" || D.rha === "met") && <Alerta html={ui.eo.rhaAlta} />}
        {(D.rha === "dim" || D.rha === "aus") && <Alerta html={ui.eo.rhaBaixa} />}
        <Lbl>Massa / organomegália</Lbl>
        <div className="ca-an-flex">
          {[["Massa pulsátil", true], ["Rim palpável / hidronefrose", true], ["Globo vesical"], ["Massa palpável", true]].map(([l, al]) => (
            <Pill key={l} alarm={al} on={has(D.massa, l)} onClick={() => setD((d) => ({ massa: tog(d.massa, l) }))}>{l}</Pill>
          ))}
        </div>
        {has(D.massa, "Massa pulsátil") && <Alerta tipo="r" html={ui.eo.massaPulsatil} />}
        {has(D.massa, "Rim palpável / hidronefrose") && <Alerta html={ui.eo.massaRim} />}
        {has(D.massa, "Globo vesical") && <Alerta html={ui.eo.massaGlobo} />}
        {has(D.massa, "Massa palpável") && <Alerta html={ui.eo.massaPalpavel} />}
      </EoSec>
      <EoSec t="Sinais especiais">
        <div className="ca-an-hint" style={{ marginTop: 0, marginBottom: 8 }} dangerouslySetInnerHTML={{ __html: ui.eo.sinaisNota }} />
        {ui.eo.sinaisInfo.map((s) => {
          const v = D.sinaisEsp[s.id];
          const aberto = D.sinaisHow[s.id];
          return (
            <div key={s.id} className="da-sinal">
              <div className="da-sinal-row">
                <span className="da-sinal-nome">{s.l}</span>
                <button className="ca-an-link" onClick={() => setD((d) => ({ sinaisHow: { ...d.sinaisHow, [s.id]: !d.sinaisHow[s.id] } }))}>{aberto ? "esconder" : "como se faz"}</button>
                <span style={{ flex: 1 }} />
                <Pill on={v === "neg"} onClick={() => setD((d) => ({ sinaisEsp: { ...d.sinaisEsp, [s.id]: d.sinaisEsp[s.id] === "neg" ? null : "neg" } }))}>Negativo</Pill>
                <Pill alarm on={v === "pos"} onClick={() => setD((d) => ({ sinaisEsp: { ...d.sinaisEsp, [s.id]: d.sinaisEsp[s.id] === "pos" ? null : "pos" } }))}>Positivo</Pill>
              </div>
              {aberto && <Html className="ca-an-hint-box" html={s.how} />}
            </div>
          );
        })}
      </EoSec>
      <EoSec t="Genitália / região inguinal">
        <div className="ca-an-hint" style={{ marginTop: 0, marginBottom: 8 }}>{ui.eo.genIntro}</div>
        <div className="ca-an-flex">
          {[["normal", "Sem alterações"], ["hernia", "Hérnia inguinal/femoral", true], ["escroto", "Dor / edema escrotal", true]].map(([v, l, al]) => (
            <Pill key={v} alarm={al} on={has(D.gen, v)} onClick={() => setD((d) => {
              if (v === "normal") return { gen: has(d.gen, "normal") ? [] : ["normal"] };
              const gen = tog(d.gen, v).filter((x) => x !== "normal");
              return { gen };
            })}>{l}</Pill>
          ))}
        </div>
        {has(D.gen, "hernia") && <Alerta html={ui.eo.genHernia} />}
        {has(D.gen, "escroto") && <Alerta tipo="r" html={ui.eo.genEscroto} />}
      </EoSec>
      <EoSec t="Membros inferiores">
        <div className="ca-an-flex">
          {togBin(!D.mi.ed, "Sem edema", "Edema +", () => setD((d) => ({ mi: { ...d.mi, ed: !d.mi.ed } })))}
          {togBin(!D.mi.tvp, "Sem sinais de TVP", "Sinais de TVP +", () => setD((d) => ({ mi: { ...d.mi, tvp: !d.mi.tvp } })))}
        </div>
        {D.mi.ed && <Alerta html={ui.eo.miEd} />}
        {D.mi.tvp && <Alerta tipo="r" html={ui.eo.miTvp} />}
      </EoSec>
      <EoSec t="Hábito corporal">
        <div className="ca-an-flex">
          {[["nl", "Peso normal"], ["exc", "Excesso peso"], ["ob", "Obesidade", true]].map(([v, l, al]) => (
            <Pill key={v} alarm={al} on={D.obeso === v} onClick={() => setD({ obeso: D.obeso === v ? null : v })}>{l}</Pill>
          ))}
        </div>
        {D.obeso === "ob" && <Alerta html={ui.eo.obesoOb} />}
      </EoSec>
      <EoSec t="Sinais cutâneos">
        <div className="ca-an-flex">
          {[["greyturner", "Sinal de Grey-Turner", true], ["cullen", "Sinal de Cullen", true], ["eritema", "Eritema / celulite parede"]].map(([v, l, al]) => (
            <Pill key={v} alarm={al} on={has(D.pele, v)} onClick={() => setD((d) => ({ pele: tog(d.pele, v) }))}>{l}</Pill>
          ))}
        </div>
        {(has(D.pele, "greyturner") || has(D.pele, "cullen")) && <Alerta tipo="r" html={ui.eo.peleEquimoses} />}
      </EoSec>
    </Passo>
  );

  const passo9 = (
    <Passo titulo="Exemplo de nota clínica" sub="Estrutura pedagógica">
      <div className="ca-an-como"><Html html={ui.notaIntro} /></div>
      <div className="ca-an-nota-wrap">
        <div className="ca-an-nota-meta">Pré-visualização pedagógica — apenas leitura</div>
        <pre className="ca-an-nota">{genNote(D)}</pre>
      </div>
    </Passo>
  );

  const passo10 = (
    <Passo titulo="Bibliografia e termos de uso" sub="Fontes utilizadas e enquadramento legal">
      {dados.biblio.grupos.map((g, gi) => (
        <div key={gi}>
          <div className="ca-an-cat" style={{ margin: "16px 0 8px" }}>{g.titulo}</div>
          {g.itens.map((f) => (
            <div key={f.num} className="ca-an-ref">
              <div className="ca-an-ref-info">
                <div className="ca-an-ref-tipo">{f.num} · {f.tipo}</div>
                <div className="ca-an-ref-titulo">{f.titulo}</div>
                <div className="ca-an-ref-autor">{f.autor}</div>
                <div className="ca-an-ref-fonte">{f.fonte}</div>
              </div>
              <a className="ca-an-link destaque" href={"https://www.google.com/search?q=" + encodeURIComponent(f.titulo + " " + f.autor)} target="_blank" rel="noopener noreferrer">Pesquisar ↗</a>
            </div>
          ))}
        </div>
      ))}
      <Html className="ca-an-disclaimer" html={"<b>Nota.</b> " + dados.biblio.nota} />
      <Html className="ca-termos" html={"<b>Termos de uso.</b> " + dados.biblio.termos} />
      <button className="ca-btn-out" style={{ width: "100%", marginTop: 16 }} onClick={() => { setDState(estadoInicial()); window.scrollTo({ top: 0 }); }}>Voltar ao início — novo caso fictício</button>
    </Passo>
  );

  const conteudo = { 0: passo0, 1: passo1, 1.5: passo15, 2: passo2, 3: passo3, 4: passo4, 5: passo5, 6: passo6, 7: passo7, 9: passo9, 10: passo10 }[D.step];

  return (
    <div className={embutido ? undefined : "ca cr ob-page"}>
      {!embutido && <button className="ob-voltar" onClick={voltar}>‹ Menu Cólica Renal</button>}
      {!embutido && <h1 className="ob-titulo">Treino de Anamnese — Cólica Renal</h1>}
      <p className="ca-hero-sub">Constrói um caso fictício passo a passo e treina o raciocínio diferencial. Ferramenta de estudo — não usar com dados de doentes reais.</p>

      <div className="ca-an-topo">
        <span className="ca-an-passo-lbl">Passo {idx + 1}/{PASSOS.length}</span>
        <div className="ca-flash-track"><div className="ca-flash-fill" style={{ width: `${((idx + 1) / PASSOS.length) * 100}%` }} /></div>
        <button className="ca-an-link" onClick={() => setNotaAberta((n) => !n)}>{notaAberta ? "Ocultar nota" : "Ver nota"}</button>
      </div>

      {notaAberta && D.step < 9 && (
        <div className="ca-an-nota-wrap flutuante">
          <div className="ca-an-nota-meta">Exemplo de nota clínica · pré-visualização pedagógica — apenas leitura</div>
          <pre className="ca-an-nota">{nota}</pre>
        </div>
      )}

      {conteudo}

      <div className="ca-an-nav">
        {idx > 0 && <button className="ca-btn-out" onClick={() => irPara(idx - 1)}>← Anterior</button>}
        {idx < PASSOS.length - 1 && (
          <button className="ca-btn" style={{ flex: 1 }} disabled={!podeAvancar} onClick={() => podeAvancar && irPara(idx + 1)}>
            {D.step === 7 ? "Ver exemplo de nota clínica →" : D.step === 9 ? "Ver bibliografia →" : "Continuar →"}
          </button>
        )}
      </div>
    </div>
  );
}
