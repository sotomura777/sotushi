import { useState, useMemo } from "react";
import dados from "@conteudo/urgencia/cansaco-anamnese.json";
import { normalizar } from "@/lib/texto";
import { estadoInicial, ageNum, pontuar, genNote, sonoInsuf } from "./cansaco-anamnese-logica.js";

const { ageBuckets: AGE_BUCKETS, symCats: SYM_CATS, syms: SYMS, alms: ALMS, drgcls: DRGCLS, ants: ANTS, ui } = dados;
const PASSOS = [0, 1, 1.5, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const has = (a, v) => a.indexOf(v) >= 0;
const tog = (a, v) => (has(a, v) ? a.filter((x) => x !== v) : [...a, v]);

const Html = ({ html, className, style }) => <div className={className} style={style} dangerouslySetInnerHTML={{ __html: html }} />;
const EoSec = ({ t, children }) => <div className="ca-an-eo-sec"><div className="ca-an-eo-t">{t}</div>{children}</div>;

function Pill({ on, alarm, children, onClick }) {
  return <button className={"ca-an-pill" + (on ? (alarm ? " alarm" : " on") : "")} onClick={onClick}>{children}</button>;
}

function Chk({ l, d, hint, on, alarm, onClick }) {
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
    </div>
  );
}

function Alerta({ tipo = "y", html }) {
  return <Html className={"ca-an-alert " + tipo} html={html} />;
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

const Lbl = ({ children }) => <div className="ca-an-lbl">{children}</div>;

export default function CansacoAnamnese({ accent = "#e85d4a", voltar, embutido = false }) {
  const [D, setDState] = useState(estadoInicial);
  const [notaAberta, setNotaAberta] = useState(false);
  const setD = (patch) => setDState((d) => ({ ...d, ...(typeof patch === "function" ? patch(d) : patch) }));

  const idx = PASSOS.indexOf(D.step);
  const irPara = (i) => { setD({ step: PASSOS[Math.max(0, Math.min(PASSOS.length - 1, i))] }); window.scrollTo({ top: 0 }); };
  const podeAvancar = D.step !== 0 || (D.sexo && D.idade);

  const disc = useMemo(() => (D.step === 8 ? pontuar(D) : null), [D]);
  const nota = useMemo(() => genNote(D, D.step), [D]);

  // ── passos ──
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
      <div className="ca-an-hint">{ui.intro.faixaHint}</div>
      <Lbl>Sexo</Lbl>
      <div className="ca-an-flex">
        <Pill on={D.sexo === "M"} onClick={() => setD({ sexo: "M" })}>Masculino</Pill>
        <Pill on={D.sexo === "F"} onClick={() => setD({ sexo: "F" })}>Feminino</Pill>
      </div>
    </Passo>
  );

  const passo1 = (
    <Passo titulo="Caracterização da fadiga" sub="Tipo, duração, padrão" num="2">
      <Lbl>Tipo de queixa (pode seleccionar mais que um)</Lbl>
      {ui.caract.tipos.map((x) => (
        <div key={x.v} className={"ca-an-opt" + (has(D.tipo, x.v) ? " sel" : "")}
          onClick={() => setD((d) => ({ tipo: tog(d.tipo, x.v), ...(x.v === "fraqueza" && has(d.tipo, "fraqueza") ? { fraqDist: "", fraqSim: "", fraqProg: "" } : {}) }))}>
          <div className="ca-an-opt-l">{x.l}</div><div className="ca-an-opt-d">{x.d}</div>
        </div>
      ))}
      {has(D.tipo, "fraqueza") && (
        <div className="ca-an-sub-bloco">
          <Lbl>Distribuição da fraqueza</Lbl>
          <div className="ca-an-flex">
            {[["prox", "Proximal"], ["dist", "Distal"], ["gen", "Generalizada"]].map(([v, l]) => (
              <Pill key={v} on={D.fraqDist === v} onClick={() => setD({ fraqDist: D.fraqDist === v ? "" : v })}>{l}</Pill>
            ))}
          </div>
          {D.fraqDist === "prox" && <Alerta html={ui.caract.fraqProx} />}
          {D.fraqDist === "dist" && <Alerta html={ui.caract.fraqDist} />}
          {D.fraqDist === "gen" && <Alerta html={ui.caract.fraqGen} />}
          <Lbl>Simetria</Lbl>
          <div className="ca-an-flex">
            <Pill on={D.fraqSim === "sim"} onClick={() => setD({ fraqSim: D.fraqSim === "sim" ? "" : "sim" })}>Simétrica</Pill>
            <Pill on={D.fraqSim === "assim"} onClick={() => setD({ fraqSim: D.fraqSim === "assim" ? "" : "assim" })}>Assimétrica</Pill>
          </div>
          {D.fraqSim === "assim" && <Alerta tipo="r" html={ui.caract.fraqAssim} />}
          {D.fraqSim === "sim" && <Alerta html={ui.caract.fraqSim} />}
          <Lbl>Progressão</Lbl>
          <div className="ca-an-flex">
            <Pill on={D.fraqProg === "est"} onClick={() => setD({ fraqProg: D.fraqProg === "est" ? "" : "est" })}>Estável</Pill>
            <Pill alarm on={D.fraqProg === "prog"} onClick={() => setD({ fraqProg: D.fraqProg === "prog" ? "" : "prog" })}>Progressiva</Pill>
          </div>
          {D.fraqProg === "prog" && <Alerta tipo="r" html={ui.caract.fraqProg} />}
          {D.fraqProg === "est" && <Alerta html={ui.caract.fraqEst} />}
        </div>
      )}
      <Lbl>Duração</Lbl>
      <div className="ca-an-flex" style={{ marginBottom: 10 }}>
        <div className={"ca-an-opt centro" + (D.dur === "aguda" ? " sel" : "")} onClick={() => setD({ dur: "aguda" })}>Aguda (&lt;4 sem)</div>
        <div className={"ca-an-opt centro" + (D.dur === "cronica" ? " sel" : "")} onClick={() => setD({ dur: "cronica" })}>Crónica (&gt;4 sem)</div>
      </div>
      {D.dur && <input className="campo ca-an-inp" value={D.durT} onChange={(e) => setD({ durT: e.target.value })} placeholder={D.dur === "aguda" ? "Semanas..." : "Meses..."} />}
      <Lbl>Gravidade (0-10)</Lbl>
      <input className="campo ca-an-inp" value={D.grav} onChange={(e) => setD({ grav: e.target.value })} placeholder="0=sem cansaço, 10=incapacitante" />
      <Lbl>Padrão temporal</Lbl>
      <div className="ca-an-flex">
        {[["manha", "Pior de manhã"], ["fimdia", "Pior final do dia"], ["constante", "Constante"], ["flutuante", "Flutuante"]].map(([v, l]) => (
          <Pill key={v} on={D.padrao === v} onClick={() => setD({ padrao: D.padrao === v ? null : v })}>{l}</Pill>
        ))}
      </div>
      {D.padrao === "manha" && <Alerta html={ui.caract.padraoManha} />}
      {D.padrao === "fimdia" && <Alerta html={ui.caract.padraoFimdia} />}
      <Lbl>Melhora com repouso?</Lbl>
      <div className="ca-an-flex">
        <Pill on={D.repouso === true} onClick={() => setD({ repouso: D.repouso === true ? null : true })}>Sim</Pill>
        <Pill alarm on={D.repouso === false} onClick={() => setD({ repouso: D.repouso === false ? null : false })}>Não</Pill>
      </div>
      {D.repouso === false && <Alerta tipo="r" html={ui.caract.repousoNao} />}
    </Passo>
  );

  const combinadosInf = [];
  if (D.step === 1.5 && D.infRec === "sim") {
    const age = ageNum(D);
    if (age >= 15 && age <= 25 && (D.infOque === "amig" || D.infOque === "outra") && D.infQuando !== "1-2sem") combinadosInf.push(ui.infRec.combinados[0]);
    if (D.infOque === "covid" && (D.infQuando === "1-3m" || D.infQuando === "3m")) combinadosInf.push(ui.infRec.combinados[1]);
    if (D.infAB === true && D.infOque === "amig" && D.infRash !== true && D.infAdeno !== true) combinadosInf.push(ui.infRec.combinados[2]);
  }
  const simNao = (campo, extra) => (
    <div className="ca-an-flex">
      <Pill on={D[campo] === true} onClick={() => setD({ [campo]: D[campo] === true ? null : true, ...(extra || {}) })}>Sim</Pill>
      <Pill on={D[campo] === false} onClick={() => setD({ [campo]: D[campo] === false ? null : false })}>Não</Pill>
    </div>
  );
  const passo15 = (
    <Passo titulo="Quadro infeccioso recente" sub="Raciocínio dirigido" cor="#ca8a04">
      <Alerta html={ui.infRec.aviso} />
      <Lbl>{ui.infRec.pergunta}</Lbl>
      <div className="ca-an-hint" style={{ marginTop: 0 }}>{ui.infRec.perguntaHint}</div>
      <div className="ca-an-flex">
        <Pill on={D.infRec === "sim"} onClick={() => setD({ infRec: "sim" })}>Sim</Pill>
        <Pill on={D.infRec === "nao"} onClick={() => setD({ infRec: "nao", infQuando: "", infOque: "", infAB: null, infRash: null, infAdeno: null, infIct: null, infExpo: null })}>Não</Pill>
      </div>
      {D.infRec === "nao" && <Alerta html={ui.infRec.semInf} />}
      {D.infRec === "sim" && (
        <>
          <Lbl>Há quanto tempo foi a infecção?</Lbl>
          <div className="ca-an-flex">{ui.infRec.quandoOpts.map((x) => <Pill key={x.v} on={D.infQuando === x.v} onClick={() => setD({ infQuando: x.v })}>{x.l}</Pill>)}</div>
          {D.infQuando === "3m" && <Alerta tipo="r" html={ui.infRec.alerta3m} />}
          <Lbl>O que teve?</Lbl>
          <div className="ca-an-flex">{ui.infRec.oqueOpts.map((x) => <Pill key={x.v} on={D.infOque === x.v} onClick={() => setD({ infOque: x.v })}>{x.l}</Pill>)}</div>
          <Lbl>Tomou antibiótico?</Lbl>
          {simNao("infAB", D.infAB === true ? {} : { infRash: null })}
          {D.infAB === true && (
            <>
              <Lbl>Teve rash cutâneo com o antibiótico (amoxicilina)?</Lbl>
              {simNao("infRash")}
              {D.infRash === true && <Alerta tipo="r" html={ui.infRec.alertaRash} />}
            </>
          )}
          <Lbl>Adenopatias cervicais palpáveis?</Lbl>
          {simNao("infAdeno")}
          {D.infAdeno === true && (D.infOque === "amig" || D.infOque === "outra") && <Alerta html={ui.infRec.alertaAdeno} />}
          <Lbl>Icterícia (olhos/pele amarelados)?</Lbl>
          {simNao("infIct")}
          {D.infIct === true && <Alerta tipo="r" html={ui.infRec.alertaIct} />}
          <Lbl>Exposição de risco? (sexual, drogas IV, viagens)</Lbl>
          {simNao("infExpo")}
          {D.infExpo === true && <Alerta tipo="r" html={ui.infRec.alertaExpo} />}
          {combinadosInf.map((t, i) => <Alerta key={i} html={t} />)}
        </>
      )}
    </Passo>
  );

  const pesoAnt = parseFloat((D._pesoAnt || "").replace(",", ".")), pesoAct = parseFloat((D._pesoAct || "").replace(",", "."));
  const pesoPct = !isNaN(pesoAnt) && !isNaN(pesoAct) && pesoAnt > 0 && pesoAct > 0 ? (((pesoAnt - pesoAct) / pesoAnt) * 100).toFixed(1) : null;
  const passo2 = (
    <Passo titulo="Sinais de alarme" sub="Pesquisar SEMPRE" num="3" cor="#dc2626">
      <Alerta tipo="r" html="Qualquer sinal de alarme → investigação prioritária." />
      <div className="ca-an-grid2">
        {ALMS.map((s) => <Chk key={s.id} l={s.l} d={s.d} hint={s.h} alarm on={has(D.alm, s.id)} onClick={() => setD((d) => ({ alm: tog(d.alm, s.id) }))} />)}
      </div>
      {has(D.alm, "ppe") && (
        <div className="ca-an-peso">
          <input className="campo ca-an-inp curto" value={D._pesoAnt} onChange={(e) => setD({ _pesoAnt: e.target.value })} placeholder="Antes (kg)" />
          <span>→</span>
          <input className="campo ca-an-inp curto" value={D._pesoAct} onChange={(e) => setD({ _pesoAct: e.target.value })} placeholder="Agora (kg)" />
          {pesoPct !== null && <strong style={{ color: pesoPct >= 5 ? "#dc2626" : "#059669" }}>{pesoPct}%{pesoPct >= 5 ? " ⚠" : ""}</strong>}
        </div>
      )}
    </Passo>
  );

  const [symFiltro, setSymFiltro] = [D._symFilter || "", (v) => setD({ _symFilter: v })];
  const passo3 = (
    <Passo titulo="Sintomas associados" sub="Seleccionar todos os presentes" num="4">
      <input className="campo ca-an-inp" value={symFiltro} onChange={(e) => setSymFiltro(e.target.value)} placeholder="Pesquisar sintoma..." />
      {SYM_CATS.map((cat) => {
        if (D.sexo === "M" && cat.id === "Gineco") return null;
        const sf = normalizar(symFiltro);
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

  const sonoV = parseFloat((D.sonoH || "").replace(",", "."));
  const togGrupo = (label, opts, campo, hint) => (
    <div style={{ marginBottom: 10 }}>
      <Lbl>{label}</Lbl>
      <div className="ca-an-flex">
        {opts.map(([v, l, alarm]) => <Pill key={v} alarm={alarm} on={D[campo] === v} onClick={() => setD({ [campo]: D[campo] === v ? null : v })}>{l}</Pill>)}
      </div>
      {hint && <Alerta tipo="r" html={hint} />}
    </div>
  );
  const passo4 = (
    <Passo titulo="Hábitos de vida" num="5">
      <Lbl>Horas de sono/noite</Lbl>
      <input className="campo ca-an-inp" value={D.sonoH} onChange={(e) => setD({ sonoH: e.target.value })} placeholder="Ex: 6, 7-8..." />
      {sonoInsuf(D) && <Alerta tipo="r" html={ui.hab.sonoInsuf} />}
      {!isNaN(sonoV) && sonoV > 9 && <Alerta html={ui.hab.sonoHiper} />}
      {togGrupo("Qualidade do sono", [["bom", "Reparador"], ["variavel", "Variável"], ["mau", "Não reparador", true]], "sonoQ", D.sonoQ === "mau" ? ui.hab.sonoMau : null)}
      <Lbl>Cafeína (cafés/dia)</Lbl>
      <input className="campo ca-an-inp" value={D.caf} onChange={(e) => setD({ caf: e.target.value })} placeholder="Ex: 2, 4..." />
      {togGrupo("Álcool", [["nao", "Não"], ["social", "Social"], ["regular", "Regular"], ["excessivo", "Excessivo", true]], "alc", D.alc === "excessivo" ? ui.hab.alcExc : null)}
      {togGrupo("Actividade física", [["sedentario", "Sedentário"], ["moderado", "Moderada"], ["regular", "Regular"], ["excessivo", "Excessivo"]], "exe", D.exe === "sedentario" ? ui.hab.sedentario : D.exe === "excessivo" ? ui.hab.overtraining : null)}
      {togGrupo("Dieta", [["equilibrada", "Equilibrada"], ["restritiva", "Restritiva"], ["veg_ns", "Veg. sem supl."], ["veg_s", "Veg. com supl."]], "dieta", D.dieta === "veg_ns" ? ui.hab.vegSemSupl : D.dieta === "restritiva" ? ui.hab.restritiva : null)}
    </Passo>
  );

  const drgFiltro = D._drgFilter || "";
  const passo5 = (
    <Passo titulo="Medicação" num="6">
      <Lbl>Medicação habitual (Enter adiciona)</Lbl>
      {D.dTg.length > 0 && (
        <div className="ca-an-tags">{D.dTg.map((t) => <span key={t} className="ca-an-tag" onClick={() => setD((d) => ({ dTg: d.dTg.filter((x) => x !== t) }))}>{t} ×</span>)}</div>
      )}
      <input className="campo ca-an-inp" placeholder="Ex: metformina..." onKeyDown={(e) => { if (e.key === "Enter" && e.target.value.trim()) { const v = e.target.value.trim(); setD((d) => (has(d.dTg, v) ? {} : { dTg: [...d.dTg, v] })); e.target.value = ""; e.preventDefault(); } }} />
      <div className="ca-an-divisor"><Lbl>Fármacos com perfil de fadiga</Lbl></div>
      <input className="campo ca-an-inp" value={drgFiltro} onChange={(e) => setD({ _drgFilter: e.target.value })} placeholder="Pesquisar fármaco..." />
      <Chk l="Nenhum relevante" on={D.nDr} onClick={() => setD({ nDr: true, cDr: [] })} />
      {DRGCLS.map((cls) => {
        const f = normalizar(drgFiltro);
        const vis = cls.drugs.filter((d) => !f || normalizar(d + " " + cls.cls + " " + (cls.mech || "")).includes(f));
        if (!vis.length) return null;
        const any = cls.drugs.some((d) => has(D.cDr, d));
        const mid = "mech_" + cls.cls.replace(/[^a-zA-Z]/g, "");
        const aberto = any || D[mid];
        return (
          <div key={cls.cls} style={{ marginBottom: 12 }}>
            <div className="ca-an-drg-h">
              <span className={"ca-an-drg-cls" + (any ? " on" : "")}>{cls.cls}</span>
              {cls.mech && !any && <button className="ca-an-link" onClick={() => setD({ [mid]: !D[mid] })}>{D[mid] ? "Esconder" : "Mecanismo"}</button>}
            </div>
            {cls.mech && aberto && <div className="ca-an-hint-box">{cls.mech}</div>}
            <div className="ca-an-flex">
              {vis.map((d) => <Pill key={d} on={has(D.cDr, d)} onClick={() => setD((dd) => ({ cDr: tog(dd.cDr, d), nDr: false }))}>{d}</Pill>)}
            </div>
          </div>
        );
      })}
    </Passo>
  );

  const antFiltro = D._antFilter || "";
  const passo6 = (
    <Passo titulo="Antecedentes" num="7">
      <Lbl>Pesquisar ou adicionar</Lbl>
      {D.aTg.length > 0 && (
        <div className="ca-an-tags">{D.aTg.map((t) => <span key={t} className="ca-an-tag" onClick={() => setD((d) => ({ aTg: d.aTg.filter((x) => x !== t) }))}>{t} ×</span>)}</div>
      )}
      <input className="campo ca-an-inp" value={antFiltro} onChange={(e) => setD({ _antFilter: e.target.value })} placeholder="Pesquisar antecedente..."
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
        {ANTS.filter((a) => !antFiltro || normalizar(a.l + " " + a.d + " " + a.id).includes(normalizar(antFiltro))).map((a) => (
          <div key={a.id}>
            <Chk l={a.l} d={a.d} on={has(D.ant, a.id)} onClick={() => setD((d) => ({ ant: tog(d.ant, a.id), nAn: false }))} />
            {a.sub && has(D.ant, a.id) && (
              <div className="ca-an-flex" style={{ margin: "4px 0 8px 4px" }}>
                {a.sub.map((sb) => (
                  <Pill key={sb.v} on={D._symSub[a.id] === sb.v} onClick={() => setD((d) => ({ _symSub: { ...d._symSub, [a.id]: d._symSub[a.id] === sb.v ? null : sb.v } }))}>{sb.l}</Pill>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="ca-an-divisor"><Lbl>Antecedentes familiares</Lbl></div>
      <div className="ca-an-flex">
        <Pill on={D.hxFam.tir} onClick={() => setD((d) => ({ hxFam: { ...d.hxFam, tir: !d.hxFam.tir } }))}>Doença tiroideia</Pill>
        <Pill on={D.hxFam.auto} onClick={() => setD((d) => ({ hxFam: { ...d.hxFam, auto: !d.hxFam.auto } }))}>Doença autoimune</Pill>
        <Pill alarm on={D.hxFam.neo} onClick={() => setD((d) => ({ hxFam: { ...d.hxFam, neo: !d.hxFam.neo } }))}>Neoplasia</Pill>
      </div>
      {(D.hxFam.tir || D.hxFam.auto || D.hxFam.neo) && (
        <input className="campo ca-an-inp" value={D.hxFam.det} onChange={(e) => setD((d) => ({ hxFam: { ...d.hxFam, det: e.target.value } }))} placeholder="Especificar..." />
      )}
    </Passo>
  );

  const togBin = (on, lOn, lOff, onClick) => <button className={"ca-an-togbtn" + (on ? "" : " off")} onClick={onClick}>{on ? lOn : lOff}</button>;
  const passo7 = (
    <Passo titulo="Exame Objectivo" sub="Se normal, não alterar" num="8">
      <EoSec t="Sinais vitais">
        <div className="ca-an-grid2">
          {[["pa", "PA (mmHg)", "120/80"], ["fc", "FC (bpm)", "72"], ["temp", "Temp (°C)", "36.5"], ["spo2", "SpO₂ (%)", "98"]].map(([k, l, ph]) => (
            <div key={k}><Lbl>{l}</Lbl><input className="campo ca-an-inp" value={D.sv[k]} onChange={(e) => setD((d) => ({ sv: { ...d.sv, [k]: e.target.value } }))} placeholder={ph} /></div>
          ))}
        </div>
      </EoSec>
      <EoSec t="Estado Geral">
        <div className="ca-an-flex">
          {[["v", "Vigil", "Não vigil"], ["o", "Orientado", "Desorientado"], ["c", "Consciente", "Alt. consciência"]].map(([k, on, off]) => (
            <span key={k}>{togBin(D.eg[k], on, off, () => setD((d) => ({ eg: { ...d.eg, [k]: !d.eg[k] } })))}</span>
          ))}
        </div>
      </EoSec>
      <EoSec t="Mucosas">
        <div className="ca-an-flex">
          {[["desc", "Descoradas", "Coradas"], ["desid", "Desidratadas", "Hidratadas"], ["cian", "Cianóticas", "Acianóticas"], ["ict", "Ictéricas", "Anictéricas"]].map(([id, on, off]) => (
            <span key={id}>{togBin(!has(D.muc, id), off, on, () => setD((d) => ({ muc: tog(d.muc, id) })))}</span>
          ))}
        </div>
        {has(D.muc, "desc") && <Alerta tipo="r" html={ui.eo.mucDesc} />}
        {has(D.muc, "ict") && <Alerta html={ui.eo.mucIct} />}
      </EoSec>
      <EoSec t="AC">
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
        <Lbl>Sopros</Lbl>
        <div className="ca-an-flex">
          <Pill on={D.acr.s === "nao"} onClick={() => setD((d) => ({ acr: { ...d.acr, s: d.acr.s === "nao" ? null : "nao" } }))}>Sem</Pill>
          <Pill alarm on={D.acr.s === "sim"} onClick={() => setD((d) => ({ acr: { ...d.acr, s: d.acr.s === "sim" ? null : "sim" } }))}>Com sopro</Pill>
        </div>
        {D.acr.r === "arr" && <Alerta html={ui.eo.acrArr} />}
        {D.acr.f === "taq" && <Alerta html={ui.eo.acrTaq} />}
        {D.acr.f === "bra" && <Alerta html={ui.eo.acrBra} />}
        {D.acr.s === "sim" && <Alerta html={ui.eo.acrSopro} />}
      </EoSec>
      <EoSec t="AP">
        <Lbl>MV</Lbl>
        <div className="ca-an-flex">
          <Pill on={D.apr.mv === "nl"} onClick={() => setD((d) => ({ apr: { ...d.apr, mv: d.apr.mv === "nl" ? null : "nl" } }))}>Global mantido</Pill>
          <Pill alarm on={D.apr.mv === "dim"} onClick={() => setD((d) => ({ apr: { ...d.apr, mv: d.apr.mv === "dim" ? null : "dim" } }))}>Diminuído</Pill>
        </div>
        <Lbl>Ruídos adventícios</Lbl>
        <div className="ca-an-flex">
          {["Crepitações", "Sibilos", "Roncos", "Fervores"].map((r) => (
            <Pill key={r} on={has(D.apr.ra, r)} onClick={() => setD((d) => ({ apr: { ...d.apr, ra: tog(d.apr.ra, r) } }))}>{r}</Pill>
          ))}
        </div>
        {has(D.apr.ra, "Crepitações") && <Alerta html={ui.eo.apCrep} />}
        {D.apr.mv === "dim" && <Alerta html={ui.eo.apMvDim} />}
      </EoSec>
      <EoSec t="Abdómen">
        <div className="ca-an-flex">
          {[["hepato", "Hepatomegália"], ["espleno", "Esplenomegália"], ["massa", "Massa palpável"], ["ascite", "Ascite"]].map(([id, l]) => (
            <Pill key={id} alarm on={has(D.abd, id)} onClick={() => setD((d) => ({ abd: tog(d.abd, id) }))}>{l}</Pill>
          ))}
        </div>
        {has(D.abd, "hepato") && <Alerta html={ui.eo.abdHepato} />}
        {has(D.abd, "espleno") && <Alerta html={ui.eo.abdEspleno} />}
        {has(D.abd, "massa") && <Alerta tipo="r" html={ui.eo.abdMassa} />}
        {has(D.abd, "ascite") && <Alerta html={ui.eo.abdAscite} />}
      </EoSec>
      <EoSec t="Tiróide">
        <div className="ca-an-flex">
          {[["tir_nl", "Normal"], ["tir_boc", "Bócio", true], ["tir_nod", "Nódulo", true]].map(([v, l, al]) => (
            <Pill key={v} alarm={al} on={D.tir === v} onClick={() => setD({ tir: D.tir === v ? null : v })}>{l}</Pill>
          ))}
        </div>
        {(D.tir === "tir_boc" || D.tir === "tir_nod") && <Alerta html={ui.eo.tirAlt} />}
      </EoSec>
      <EoSec t="Adenopatias">
        <div className="ca-an-flex">
          {["Cervicais", "Axilares", "Inguinais", "Supraclaviculares"].map((a) => (
            <Pill key={a} alarm={a === "Supraclaviculares"} on={has(D.adeno, a)} onClick={() => setD((d) => ({ adeno: tog(d.adeno, a) }))}>{a}</Pill>
          ))}
        </div>
        {has(D.adeno, "Supraclaviculares") ? <Alerta tipo="r" html={ui.eo.adenoSupra} />
          : has(D.adeno, "Cervicais") ? <Alerta html={ui.eo.adenoCerv} />
          : (has(D.adeno, "Axilares") || has(D.adeno, "Inguinais")) ? <Alerta html={ui.eo.adenoOutras} /> : null}
      </EoSec>
      <EoSec t="MIs">
        <div className="ca-an-flex">
          {togBin(!D.mi.ed, "Sem edema periférico", "Edema periférico +", () => setD((d) => ({ mi: { ...d.mi, ed: !d.mi.ed } })))}
          {togBin(!D.mi.tvp, "Sem sinais TVP", "Sinais TVP +", () => setD((d) => ({ mi: { ...d.mi, tvp: !d.mi.tvp } })))}
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
      <EoSec t="Pele">
        <div className="ca-an-flex">
          {["Palidez", "Icterícia", "Hiperpigmentação", "Lesões cutâneas", "Petéquias", "Xerose"].map((pp) => (
            <Pill key={pp} on={has(D.pele, pp)} onClick={() => setD((d) => ({ pele: tog(d.pele, pp) }))}>{pp}</Pill>
          ))}
        </div>
        {has(D.pele, "Hiperpigmentação") && <Alerta html={ui.eo.peleHiper} />}
        {has(D.pele, "Petéquias") && <Alerta tipo="r" html={ui.eo.pelePet} />}
        {has(D.pele, "Icterícia") && <Alerta html={ui.eo.peleIct} />}
        {has(D.pele, "Xerose") && <Alerta html={ui.eo.peleXer} />}
      </EoSec>
    </Passo>
  );

  const passo8 = disc && (
    <Passo titulo="Discussão de hipóteses" sub="Organiza o teu raciocínio">
      <Html className="ca-an-disclaimer" html={ui.disc.disclaimer} />
      {D.alm.length > 0 && (
        <div className="ca-an-alm-box">
          <button className="ca-an-alm-head" onClick={() => setD({ almOpen: !D.almOpen })}>
            <span>⚠ {D.alm.length === 1 ? "Sinal de alarme presente" : `Sinais de alarme presentes (${D.alm.length})`}</span>
            <span>{D.almOpen ? "▲" : "▼"}</span>
          </button>
          {D.almOpen && (
            <div className="ca-an-alm-body">
              <Html html={ui.disc.almIntro} />
              <div className="ca-an-alm-lista">
                {D.alm.map((a) => (
                  <div key={a} className="ca-an-alm-item">
                    <div className="ca-an-alm-nome">{ui.disc.almLabels[a] || a}</div>
                    <div>{ui.disc.almHints[a] || ""}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      {disc.ordered.length === 0
        ? <div className="ca-an-vazio">{ui.disc.semHipoteses}</div>
        : (
          <>
            <div className="ca-an-disc-header">{ui.disc.header}</div>
            {disc.ordered.map((d) => {
              const aberto = D.expCard === d.id;
              const info = ui.dxFull[d.id];
              return (
                <div key={d.id} className={"ca-an-dx" + (d.fail ? " fail" : "") + (aberto ? " aberto" : "")}>
                  <button className="ca-an-dx-head" onClick={() => setD({ expCard: aberto ? null : d.id })}>
                    <span className="ca-an-dx-nome">{d.l}</span>
                    <span className="ca-an-dx-ver">{aberto ? "fechar ▲" : "ver mais ▼"}</span>
                  </button>
                  {d.triade && !aberto && <div className="ca-an-triade">⚡ {d.triade}</div>}
                  {d.pos.length > 0 && <div className="ca-an-dx-pts"><span className="ca-ok">A favor:</span> {d.pos.join(", ")}.</div>}
                  {d.neg.length > 0 && <div className="ca-an-dx-pts"><span className="ca-err">Contra:</span> {d.neg.join(", ")}.</div>}
                  {d.failMsg && <div className="ca-an-failmsg">{d.failMsg}</div>}
                  {aberto && (
                    <div className="ca-an-dx-det">
                      {d.triade && <div className="ca-an-triade destaque">⚡ {d.triade}</div>}
                      {d.nota && <Html className="ca-an-nota-dx" html={d.nota} />}
                      {info ? (
                        <>
                          {info.desc && <div className="ca-an-dx-desc">{info.desc}</div>}
                          {info.sintomas?.length > 0 && (<><div className="ca-an-dx-sec">Sintomas e sinais a procurar</div><ul>{info.sintomas.map((s, i) => <li key={i}>{s}</li>)}</ul></>)}
                          {info.escalas?.length > 0 && (<><div className="ca-an-dx-sec">Escalas e instrumentos</div><ul>{info.escalas.map((s, i) => <li key={i}>{s}</li>)}</ul></>)}
                          {info.inv?.length > 0 && (<><div className="ca-an-dx-sec">Investigação dirigida</div><ul>{info.inv.map((s, i) => <li key={i}>{s}</li>)}</ul></>)}
                        </>
                      ) : <div className="ca-an-dx-desc">{ui.disc.dxDetailFallback}</div>}
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}
      {disc.factores.length > 0 && (
        <div className="ca-an-factores">
          <div className="ca-an-fact-t">{ui.disc.factoresTitulo}</div>
          <div className="ca-an-fact-sub">{ui.disc.factoresSub}</div>
          {disc.factores.map((f) => (
            <div key={f.id} className="ca-an-fact">
              <div className="ca-an-fact-nome">{f.name}</div>
              <div>{f.txt}</div>
            </div>
          ))}
          {disc.factores.some((f) => f.tipo === "hab") && (
            <div className="ca-an-q10">
              <div className="ca-an-fact-nome">{ui.disc.q10Titulo}</div>
              <Html html={ui.disc.q10Texto} />
            </div>
          )}
        </div>
      )}
    </Passo>
  );

  const passo9 = (
    <Passo titulo="Exemplo de nota clínica" sub="Estrutura pedagógica">
      <div className="ca-an-como"><Html html={ui.notaIntro} /></div>
      <div className="ca-an-nota-wrap">
        <div className="ca-an-nota-meta">Pré-visualização pedagógica — apenas leitura</div>
        <pre className="ca-an-nota">{genNote(D, 9)}</pre>
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

  const conteudo = { 0: passo0, 1: passo1, 1.5: passo15, 2: passo2, 3: passo3, 4: passo4, 5: passo5, 6: passo6, 7: passo7, 8: passo8, 9: passo9, 10: passo10 }[D.step];

  return (
    <div className={embutido ? undefined : "ca ob-page"}>
      {!embutido && <button className="ob-voltar" onClick={voltar}>‹ Menu Cansaço</button>}
      {!embutido && <h1 className="ob-titulo">Treino de Anamnese — Cansaço</h1>}
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
            {D.step === 8 ? "Ver exemplo de nota clínica →" : D.step === 9 ? "Ver bibliografia →" : "Continuar →"}
          </button>
        )}
      </div>
    </div>
  );
}
