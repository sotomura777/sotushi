import { useState, useRef, useEffect } from "react";
import dados from "@conteudo/urgencia/obstipacao-algoritmo.json";
import { Ico } from "@/components/icones";
import { normalizar } from "@/lib/texto";
import { estadoInicial, eStep, mxS, isSU, pontuar, gerarNota, hasDrCls, getDrCls } from "./obstipacao-algoritmo";

const D0 = dados;
const has = (a, v) => a.indexOf(v) >= 0;

// ── Sub-componentes UI ──────────────────────────────────────────────────────
function Pill({ label, on, onClick, alarm }) {
  return <button className={"oba-pill" + (on ? (alarm ? " on alarm" : " on") : "")} onClick={onClick}>{label}</button>;
}

function Chk({ item, on, onClick, alarm }) {
  const [aberto, setAberto] = useState(false);
  return (
    <div className={"oba-chk" + (on ? (alarm ? " sel sel-r" : " sel") : "")} onClick={onClick}>
      <div className="oba-chk-main">
        <span className="oba-chk-box">{on ? "✓" : ""}</span>
        <div>
          <div className="oba-chk-t">{item.l}</div>
          {item.d && <div className="oba-chk-d">{item.d}</div>}
        </div>
      </div>
      {item.h && (
        <div className="oba-saber" onClick={(e) => { e.stopPropagation(); setAberto((v) => !v); }}>{aberto ? "Esconder" : "Saber mais"}</div>
      )}
      {aberto && item.h && <div className="oba-faq-a" onClick={(e) => e.stopPropagation()} dangerouslySetInnerHTML={{ __html: item.h }} />}
    </div>
  );
}

function Tog({ label, opts, val, onSet, hint }) {
  return (
    <div className="oba-field">
      <div className="oba-lbl">{label}</div>
      <div className="oba-wrap">
        {opts.map((o) => <Pill key={o.v} label={o.l} on={val === o.v} onClick={() => onSet(val === o.v ? null : o.v)} alarm={o.a} />)}
      </div>
      {hint && <div className={"oba-hint " + (hint.good ? "good" : "bad")}>{hint.text}</div>}
    </div>
  );
}

function Sec({ titulo, children, defaultOpen }) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div className="oba-sec">
      <div className="oba-sec-h" onClick={() => setOpen((v) => !v)}><span>{titulo}</span><span className="oba-sec-arr">{open ? "−" : "+"}</span></div>
      {open && <div className="oba-sec-body">{children}</div>}
    </div>
  );
}

// ── Componente principal ────────────────────────────────────────────────────
export default function ObstipacaoAlgoritmo({ accent }) {
  const [D, setD] = useState(estadoInicial);
  const rootRef = useRef(null);
  const montou = useRef(false);

  // Ao mudar de passo, sobe ao topo do algoritmo (não dispara ao escrever, só no step).
  useEffect(() => {
    if (!montou.current) { montou.current = true; return; }
    if (rootRef.current) {
      const y = rootRef.current.getBoundingClientRect().top + window.scrollY - 12;
      window.scrollTo({ top: Math.max(0, y), behavior: "auto" });
    }
  }, [D.step]);
  const up = (patch) => setD((d) => ({ ...d, ...patch }));
  const tog = (field, val) => setD((d) => { const a = d[field]; return { ...d, [field]: a.includes(val) ? a.filter((x) => x !== val) : [...a, val] }; });
  const upN = (field, key, val) => setD((d) => ({ ...d, [field]: { ...d[field], [key]: val } }));
  const togN = (field, key) => setD((d) => ({ ...d, [field]: { ...d[field], [key]: !d[field][key] } }));
  const togNArr = (field, key, val) => setD((d) => { const a = d[field][key]; return { ...d, [field]: { ...d[field], [key]: a.includes(val) ? a.filter((x) => x !== val) : [...a, val] } }; });

  const es = eStep(D);
  const mx = mxS(D);
  const su = isSU(D);

  const goNext = () => {
    if (D.step === 0 && (!D.sexo || !D.idade.trim() || !D.ctx)) return;
    up({ step: D.step + 1 });
  };
  const goBack = () => up({ step: Math.max(0, D.step - 1) });

  // Nota clínica = base automática (gerada de D, atualiza-se com as seleções) + acréscimo
  // manual escrito no fim. Editar no fim mantém a base viva; "Regenerar" remove só o acréscimo.
  // (Se editares dentro da parte automática, a nota "congela" e fica toda manual até regenerar.)
  const [notaManual, setNotaManual] = useState("");
  const [notaCongelada, setNotaCongelada] = useState(false);
  const [notaAberta, setNotaAberta] = useState(false);
  const notaAuto = gerarNota(D);
  const notaTexto = notaCongelada ? notaManual : notaAuto + notaManual;
  const editarNota = (v) => {
    if (!notaCongelada && v.startsWith(notaAuto)) setNotaManual(v.slice(notaAuto.length));
    else { setNotaCongelada(true); setNotaManual(v); }
  };
  const regenerarNota = () => { setNotaManual(""); setNotaCongelada(false); };
  const copiarNota = () => { if (typeof navigator !== "undefined" && navigator.clipboard) navigator.clipboard.writeText(notaTexto); };
  const novoCaso = () => { setD(estadoInicial()); setNotaManual(""); setNotaCongelada(false); setNotaAberta(false); };

  // ── Passos ────────────────────────────────────────────────────────────────
  const passos = {};

  passos[0] = (
    <Card titulo="Dados do caso">
      <div className="oba-row2">
        <div><div className="oba-lbl">Sexo</div><div className="oba-wrap">
          <Pill label="Masculino" on={D.sexo === "M"} onClick={() => up({ sexo: "M" })} />
          <Pill label="Feminino" on={D.sexo === "F"} onClick={() => up({ sexo: "F" })} />
        </div></div>
        <div><div className="oba-lbl">Idade</div>
          <input className="oba-inp" value={D.idade} onChange={(e) => up({ idade: e.target.value })} placeholder="Ex: 65" /></div>
      </div>
      <div className="oba-lbl">Setting</div>
      <div className={"oba-opt" + (D.ctx === "ambulatorio" ? " sel" : "")} onClick={() => up({ ctx: "ambulatorio" })}><div className="oba-opt-l">Ambulatório</div><div className="oba-opt-d">Consulta ou SU a caminhar</div></div>
      <div className={"oba-opt" + (D.ctx === "acamado" ? " sel" : "")} onClick={() => up({ ctx: "acamado" })}><div className="oba-opt-l">Acamado / Maca / Internado</div><div className="oba-opt-d">Caso no leito</div></div>
    </Card>
  );

  passos[1] = (
    <Card titulo="Estabilidade hemodinâmica" sub="Numa abordagem real, avalia-se primeiro o ABC" cor="#dc2626">
      <div className="oba-row2" style={{ marginBottom: 12 }}>
        <div className={"oba-opt center" + (D.unst === false ? " sel-g" : "")} onClick={() => up({ unst: false })}><div className="oba-opt-l">Estável</div></div>
        <div className={"oba-opt center" + (D.unst === true ? " sel-r" : "")} onClick={() => up({ unst: true })}><div className="oba-opt-l">Instável</div></div>
      </div>
      {D.unst === true && (
        <>
          <div className="oba-lbl" style={{ color: "#dc2626" }}>Sinais de instabilidade presentes:</div>
          {D0.sinaisInstabilidade.map((s) => <Chk key={s.id} item={s} on={has(D.uDet, s.id)} onClick={() => tog("uDet", s.id)} alarm />)}
          <div className="oba-abc"><div className="oba-abc-t">Protocolo de estabilização</div><div dangerouslySetInnerHTML={{ __html: D0.protocoloABC }} /></div>
          <div className="oba-lbl" style={{ marginTop: 12 }}>Acções realizadas:</div>
          <div className="oba-wrap">{D0.accoesEstabilizacao.map((a) => <Pill key={a} label={a} on={has(D.unstAct, a)} onClick={() => tog("unstAct", a)} />)}</div>
        </>
      )}
    </Card>
  );

  passos[2] = (
    <Card titulo="Caracterização" sub="Duração, frequência, consistência">
      <div className="oba-field">
        <div className="oba-lbl">Duração</div>
        <div className="oba-row2">
          <div className={"oba-opt center" + (D.dur === "aguda" ? " sel-r" : "")} onClick={() => up({ dur: "aguda" })}><div className="oba-opt-l">Aguda (&lt;4 sem)</div></div>
          <div className={"oba-opt center" + (D.dur === "cronica" ? " sel" : "")} onClick={() => up({ dur: "cronica" })}><div className="oba-opt-l">Crónica (&gt;3 meses)</div></div>
        </div>
        {D.dur && <input className="oba-inp" style={{ marginTop: 8 }} value={D.durT} onChange={(e) => up({ durT: e.target.value })} placeholder={D.dur === "aguda" ? "Semanas..." : "Meses..."} />}
      </div>
      <div className="oba-field">
        <div className="oba-lbl">Frequência evacuatória</div>
        <div className="oba-wrap">
          {D0.frequencias.map((f) => <Pill key={f} label={f} on={D.frq === f} onClick={() => up({ frq: f, frqDias: "" })} />)}
          <Pill label="Não evacua" on={D.frq.indexOf("Não evacua") === 0} onClick={() => up({ frq: "Não evacua" })} alarm />
        </div>
        {D.frq.indexOf("Não evacua") === 0
          ? <input className="oba-inp" style={{ marginTop: 8 }} value={D.frqDias} onChange={(e) => up({ frqDias: e.target.value, frq: "Não evacua há " + e.target.value + " dias" })} placeholder="Há quantos dias? (ex: 5, 7, 10...)" />
          : <input className="oba-inp" style={{ marginTop: 8 }} value={D.frq} onChange={(e) => up({ frq: e.target.value })} placeholder="Ou escrever (ex: 1-2x/semana)" />}
        <div className="oba-mini-hint">&lt;3/semana = critério de obstipação</div>
      </div>
      <div className="oba-field">
        <div className="oba-lbl">Emissão de gases</div>
        <div className="oba-wrap">
          <Pill label="Normal" on={D.gas === "normal"} onClick={() => up({ gas: D.gas === "normal" ? null : "normal" })} />
          <Pill label="Aumentados" on={D.gas === "aum"} onClick={() => up({ gas: D.gas === "aum" ? null : "aum" })} />
          <Pill label="Diminuídos" on={D.gas === "dim"} onClick={() => up({ gas: D.gas === "dim" ? null : "dim" })} />
          <Pill label="Ausentes" on={D.gas === "aus"} onClick={() => up({ gas: D.gas === "aus" ? null : "aus" })} alarm />
        </div>
        {D.gas === "aus" && <input className="oba-inp" style={{ margin: "8px 0 6px" }} value={D.gasDias} onChange={(e) => up({ gasDias: e.target.value })} placeholder="Há quantos dias sem gases?" />}
        {D.gas === "aus" && <div className="oba-alert r">Ausência de emissão de gases é sinal cardinal de obstrução intestinal. Avaliar urgentemente.</div>}
        {D.gas === "aum" && <div className="oba-alert y">Gases aumentados: pode indicar fermentação excessiva (dieta, SII, sobrecrescimento bacteriano), aerofagia, ou intolerância alimentar.</div>}
        {D.gas === "dim" && <div className="oba-alert y">Gases diminuídos: pode indicar trânsito lento ou obstrução parcial. Correlacionar com outros achados.</div>}
      </div>
      <div className="oba-field">
        <div className="oba-lbl">Escala de Bristol</div>
        {D0.bristol.map((b) => <div key={b.v} className={"oba-bristol" + (D.bri === b.v ? " sel" : "")} onClick={() => up({ bri: D.bri === b.v ? "" : b.v })}>{b.l} - {b.d}</div>)}
      </div>
    </Card>
  );

  passos[3] = (
    <Card titulo="Sinais de alarme" sub="O que se pesquisa sempre num caso destes" cor="#dc2626">
      <div className="oba-alert r">Qualquer sinal de alarme presente → investigação prioritária. Não adiar.</div>
      <div className="oba-grid2">{D0.alarmesCronicos.map((s) => <Chk key={s.id} item={s} on={has(D.alm, s.id)} onClick={() => tog("alm", s.id)} alarm />)}</div>
      {has(D.alm, "rec") && (
        <div className="oba-recbox">
          <div className="oba-lbl" style={{ color: "#dc2626" }}>Especificar tipo de rectorragia:</div>
          <div className="oba-wrap">
            <Pill label="Hematoquézias" on={D.recTipo === "hqz"} onClick={() => up({ recTipo: D.recTipo === "hqz" ? null : "hqz" })} alarm />
            <Pill label="Melenas" on={D.recTipo === "mel"} onClick={() => up({ recTipo: D.recTipo === "mel" ? null : "mel" })} alarm />
            <Pill label="Sangue oculto +" on={D.recTipo === "sof"} onClick={() => up({ recTipo: D.recTipo === "sof" ? null : "sof" })} alarm />
            <Pill label="Não especificado" on={D.recTipo === "ne"} onClick={() => up({ recTipo: D.recTipo === "ne" ? null : "ne" })} />
          </div>
          {D.recTipo && D0.rectorragiaTipos[D.recTipo] && <div className="oba-faq-a" dangerouslySetInnerHTML={{ __html: D0.rectorragiaTipos[D.recTipo] }} />}
        </div>
      )}
      {D.dur === "aguda" && (
        <div style={{ marginTop: 16 }}>
          <div className="oba-lbl" style={{ color: "#dc2626", fontSize: 14 }}>Sinais alarme agudo</div>
          <div className="oba-alert r">Na obstipação aguda, excluir emergência cirúrgica.</div>
          <div className="oba-grid2">{D0.alarmesAgudos.map((s) => <Chk key={s.id} item={s} on={has(D.acu, s.id)} onClick={() => tog("acu", s.id)} alarm />)}</div>
        </div>
      )}
    </Card>
  );

  passos[4] = (
    <Card titulo="Sintomas associados" sub="Seleccionar todos os presentes">
      <input
        className="oba-inp"
        style={{ marginBottom: 10 }}
        value={D._symFilter || ""}
        onChange={(e) => up({ _symFilter: e.target.value })}
        placeholder="Pesquisar sintoma · Enter selecciona..."
        onKeyDown={(e) => {
          if (e.key !== "Enter") return;
          e.preventDefault();
          const f = normalizar(D._symFilter).trim();
          if (!f) return;
          const m = D0.sintomas.find((s) => normalizar(s.l) === f) || D0.sintomas.find((s) => normalizar(s.l).includes(f) || normalizar(s.d).includes(f));
          if (m) up({ sym: has(D.sym, m.id) ? D.sym : [...D.sym, m.id], _symFilter: "" });
        }}
      />
      <div className="oba-grid2">
        {D0.sintomas.filter((s) => { const f = normalizar(D._symFilter); return !f || normalizar(s.l).includes(f) || normalizar(s.d).includes(f); }).map((s) => <Chk key={s.id} item={s} on={has(D.sym, s.id)} onClick={() => tog("sym", s.id)} />)}
      </div>
    </Card>
  );

  passos[5] = (
    <Card titulo="Hábitos de vida">
      <div className="oba-field">
        <div className="oba-lbl">Ingestão hídrica diária</div>
        <input className="oba-inp" value={D.agu} onChange={(e) => up({ agu: e.target.value })} placeholder="Ex: ~1L/dia, 1.5L..." />
      </div>
      <Tog label="Actividade física" opts={[{ v: "sedentario", l: "Sedentário" }, { v: "moderado", l: "Moderada" }, { v: "regular", l: "Regular (≥150min/sem)" }]} val={D.exe} onSet={(v) => up({ exe: v })} />
      <Tog label="Fibra na dieta (frutas, vegetais, cereais)" opts={[{ v: "sim", l: "Sim, adequada" }, { v: "nao", l: "Pobre em fibra" }]} val={D.fib} onSet={(v) => up({ fib: v })} />
      <Tog label="Tabagismo" opts={[{ v: "sim", l: "Sim (activo)" }, { v: "ex", l: "Ex-fumador" }, { v: "nao", l: "Não" }]} val={D.tab} onSet={(v) => up({ tab: v })} />
      <Tog label="Reprime urgência defecatória?" opts={[{ v: "sim", l: "Sim", a: true }, { v: "nao", l: "Não" }]} val={D.rep} onSet={(v) => up({ rep: v })} />
    </Card>
  );

  passos[6] = (
    <Card titulo="Medicação">
      <div className="oba-lbl">Medicação habitual</div>
      {D.dTg.length > 0 && <div className="oba-tags">{D.dTg.map((t) => <span key={t} className="oba-tag-rm" onClick={() => up({ dTg: D.dTg.filter((x) => x !== t) })}>{t} ✕</span>)}</div>}
      <input
        className="oba-inp"
        value={D._drgFilter || ""}
        onChange={(e) => up({ _drgFilter: e.target.value })}
        placeholder="Escrever e Enter para adicionar · pesquisa também os obstipantes..."
        onKeyDown={(e) => {
          if (e.key !== "Enter") return;
          e.preventDefault();
          const v = e.target.value.trim();
          if (!v) return;
          const f = normalizar(v);
          let match = null;
          for (const cls of D0.farmacosClasses) {
            const d = cls.drugs.find((dd) => normalizar(dd) === f) || cls.drugs.find((dd) => normalizar(dd).includes(f));
            if (d) { match = d; break; }
          }
          if (match) up({ cDr: has(D.cDr, match) ? D.cDr : [...D.cDr, match], nDr: false, _drgFilter: "" });
          else up({ dTg: has(D.dTg, v) ? D.dTg : [...D.dTg, v], _drgFilter: "" });
        }}
      />
      <div className="oba-mini-hint">Os fármacos com perfil obstipante aparecem em baixo — pesquisa-os ou selecciona-os.</div>
      <Chk item={{ id: "nDr", l: "Nenhum obstipante" }} on={D.nDr} onClick={() => up({ nDr: !D.nDr, cDr: !D.nDr ? [] : D.cDr })} />
      {D0.farmacosClasses.map((cls) => {
        const filter = normalizar(D._drgFilter);
        const visible = cls.drugs.filter((d) => !filter || normalizar(d).includes(filter) || normalizar(cls.cls).includes(filter));
        if (!visible.length) return null;
        const anySel = cls.drugs.some((d) => has(D.cDr, d));
        return (
          <div key={cls.cls} className="oba-drgcls">
            <div className="oba-drgcls-cab"><span className={"oba-drgcls-nome" + (anySel ? " sel" : "")}>{cls.cls}</span>{cls.mech && <ClsMech mech={cls.mech} />}</div>
            <div className="oba-wrap">{visible.map((d) => <Pill key={d} label={d} on={has(D.cDr, d)} onClick={() => { tog("cDr", d); up({ nDr: false }); }} />)}</div>
          </div>
        );
      })}
    </Card>
  );

  passos[7] = (
    <Card titulo="Antecedentes">
      <div className="oba-field">
        <div className="oba-lbl">Pesquisar ou adicionar antecedente</div>
        {D.aTg.length > 0 && <div className="oba-tags">{D.aTg.map((t) => <span key={t} className="oba-tag-rm" onClick={() => up({ aTg: D.aTg.filter((x) => x !== t) })}>{t} ✕</span>)}</div>}
        <input className="oba-inp" value={D._antFilter || ""} onChange={(e) => up({ _antFilter: e.target.value })} placeholder="Pesquisar antecedente..." onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); const v = e.target.value.trim(); const f = normalizar(v); const m = D0.antecedentes.filter((a) => normalizar(a.l).includes(f)); if (m.length) { tog("ant", m[0].id); up({ nAn: false }); } else if (v && !has(D.aTg, v)) up({ aTg: [...D.aTg, v] }); up({ _antFilter: "" }); e.target.value = ""; } }} />
      </div>
      <div className="oba-divider">
        <Chk item={{ id: "nAn", l: "Nenhum relevante" }} on={D.nAn} onClick={() => up({ nAn: !D.nAn, ant: !D.nAn ? [] : D.ant })} />
        <div className="oba-grid2">
          {D0.antecedentes.filter((a) => { const f = normalizar(D._antFilter); return !f || normalizar(a.l).includes(f) || normalizar(a.d).includes(f); }).map((a) => <Chk key={a.id} item={a} on={has(D.ant, a.id)} onClick={() => { tog("ant", a.id); up({ nAn: false }); }} />)}
        </div>
      </div>
      <div className="oba-divider">
        <div className="oba-lbl" style={{ fontSize: 14 }}>Antecedentes familiares</div>
        <div className="oba-wrap">
          <Pill label="Hx familiar CCR" on={D.hxFam.ccr} onClick={() => togN("hxFam", "ccr")} alarm />
          <Pill label="Hx familiar DII" on={D.hxFam.dii} onClick={() => togN("hxFam", "dii")} alarm />
        </div>
        {(D.hxFam.ccr || D.hxFam.dii) && <input className="oba-inp" style={{ marginTop: 10 }} value={D.hxFam.det} onChange={(e) => upN("hxFam", "det", e.target.value)} placeholder="Especificar (ex: pai com CCR aos 55 anos...)" />}
      </div>
    </Card>
  );

  passos[8] = <ExameObjetivo D={D} up={up} upN={upN} togN={togN} togNArr={togNArr} tog={tog} su={su} />;

  passos[9] = <Resultado D={D} up={up} upN={upN} tog={tog} />;

  return (
    <div className="oba" ref={rootRef} style={{ "--acento": accent }}>
      <div className="oba-shell">
        <div className="oba-main">
          <div className="oba-prog-cab">
            <span className="oba-prog-label">Passo {D.step + 1}/{mx}</span>
            <div className="oba-prog-bar"><div className="oba-prog-fill" style={{ width: Math.min(((D.step + 1) / mx) * 100, 100) + "%" }} /></div>
          </div>
          {passos[es]}
          {(D.step > 0 || es < 9) && (
            <div className="oba-nav">
              {D.step > 0 && <button className="oba-btn-out" style={es === 9 ? { flex: 1 } : undefined} onClick={goBack}>{es === 9 ? "← Voltar ao passo anterior" : "←"}</button>}
              {es < 9 && <button className="oba-btn" disabled={D.step === 0 && (!D.sexo || !D.idade.trim() || !D.ctx)} onClick={goNext}>Continuar</button>}
            </div>
          )}
        </div>
        <aside className="oba-aside">
          <NotaPanel texto={notaTexto} onEdit={editarNota} onRegen={regenerarNota} onCopy={copiarNota} onNovo={novoCaso} />
        </aside>
      </div>

      {!notaAberta && <button className="oba-nota-btn" onClick={() => setNotaAberta(true)}><Ico name="clipboard" s={16} /> Nota</button>}
      {notaAberta && <div className="oba-nota-backdrop" onClick={() => setNotaAberta(false)} />}
      <div className={"oba-nota-drawer" + (notaAberta ? " aberta" : "")}>
        <NotaPanel texto={notaTexto} onEdit={editarNota} onRegen={regenerarNota} onCopy={copiarNota} onNovo={novoCaso} onClose={() => setNotaAberta(false)} />
      </div>
    </div>
  );
}

// ── Painel da nota clínica (partilhado: sidebar desktop / drawer mobile) ─────
function NotaPanel({ texto, onEdit, onRegen, onCopy, onNovo, onClose }) {
  return (
    <div className="oba-nota-panel">
      <div className="oba-nota-head">
        <span className="oba-nota-titulo">Exemplo de nota-modelo</span>
        {onClose && <button className="oba-nota-x" onClick={onClose} aria-label="Fechar">✕</button>}
      </div>
      <div className="oba-nota-enquadra">Para um caso como este, uma nota poderia ser redigida assim:</div>
      <textarea className="oba-nota" value={texto} onChange={(e) => onEdit(e.target.value)} />
      <div className="oba-nota-acts">
        <button className="oba-btn-out" style={{ flex: 1 }} onClick={onRegen}>Regenerar</button>
        <button className="oba-btn" style={{ flex: 1 }} onClick={onCopy}>Copiar exemplo</button>
      </div>
      <button className="oba-btn-out oba-novo" onClick={onNovo}>Novo caso</button>
    </div>
  );
}

// ── Card wrapper ────────────────────────────────────────────────────────────
function Card({ titulo, sub, cor, children }) {
  return (
    <div className="oba-card" style={cor ? { borderTopColor: cor } : undefined}>
      <div className="oba-card-cab"><div className="oba-card-t">{titulo}</div>{sub && <div className="oba-card-s">{sub}</div>}</div>
      {children}
    </div>
  );
}

function ClsMech({ mech }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <span className="oba-saber" onClick={() => setOpen((v) => !v)}>{open ? "Esconder" : "Mecanismo"}</span>
      {open && <div className="oba-faq-a" style={{ flexBasis: "100%" }}>{mech}</div>}
    </>
  );
}

// ── Passo 8: Exame objectivo ────────────────────────────────────────────────
function ExameObjetivo({ D, up, upN, togN, togNArr, tog, su }) {
  return (
    <Card titulo="Exame Objectivo" sub="No caso, assume-se normal salvo indicação">
      <div className="oba-eo"><div className="oba-eo-t">Sinais vitais</div>
        <div className="oba-grid2">
          {[["pa", "PA (mmHg)", "Ex: 120/80"], ["fc", "FC (bpm)", "Ex: 78"], ["temp", "Temp (°C)", "Ex: 36.5"], ["spo2", "SpO₂ (%)", "Ex: 98"]].map(([k, l, ph]) => (
            <div key={k}><div className="oba-lbl">{l}</div><input className="oba-inp" value={D.sv[k]} onChange={(e) => upN("sv", k, e.target.value)} placeholder={ph} /></div>
          ))}
        </div>
      </div>
      <div className="oba-eo"><div className="oba-eo-t">Estado geral</div><div className="oba-wrap">
        {[["v", "Vigil", "Não vigil"], ["o", "Orientado", "Desorientado"], ["c", "Consciente", "Alt. consciência"]].map(([k, on, off]) => (
          <button key={k} className={"oba-togbtn" + (D.eg[k] ? "" : " off")} onClick={() => togN("eg", k)}>{D.eg[k] ? on : off}</button>
        ))}
      </div></div>
      <div className="oba-eo"><div className="oba-eo-t">Mucosas</div><div className="oba-wrap">
        {[["desc", "Coradas", "Descoradas"], ["desid", "Hidratadas", "Desidratadas"], ["cian", "Acianóticas", "Cianóticas"], ["ict", "Anictéricas", "Ictéricas"]].map(([id, on, off]) => {
          const a = has(D.muc, id);
          return <button key={id} className={"oba-togbtn" + (a ? " off" : "")} onClick={() => tog("muc", id)}>{a ? off : on}</button>;
        })}
      </div></div>
      <div className="oba-eo"><div className="oba-eo-t">AC</div>
        <div className="oba-lbl">Ritmo</div><div className="oba-wrap" style={{ marginBottom: 10 }}>
          <Pill label="Rítmico" on={D.acr.r === "rit"} onClick={() => upN("acr", "r", D.acr.r === "rit" ? null : "rit")} />
          <Pill label="Arrítmico" on={D.acr.r === "arr"} onClick={() => upN("acr", "r", D.acr.r === "arr" ? null : "arr")} alarm />
        </div>
        <div className="oba-lbl">Frequência</div><div className="oba-wrap" style={{ marginBottom: 10 }}>
          <Pill label="Normal" on={D.acr.f === "nl"} onClick={() => upN("acr", "f", D.acr.f === "nl" ? null : "nl")} />
          <Pill label="Taquicárdico" on={D.acr.f === "taq"} onClick={() => upN("acr", "f", D.acr.f === "taq" ? null : "taq")} alarm />
          <Pill label="Bradicárdico" on={D.acr.f === "bra"} onClick={() => upN("acr", "f", D.acr.f === "bra" ? null : "bra")} alarm />
        </div>
        <div className="oba-lbl">Sopros</div><div className="oba-wrap">
          <Pill label="Sem sopros" on={D.acr.s === "nao"} onClick={() => upN("acr", "s", D.acr.s === "nao" ? null : "nao")} />
          <Pill label="Com sopro" on={D.acr.s === "sim"} onClick={() => upN("acr", "s", D.acr.s === "sim" ? null : "sim")} alarm />
        </div>
      </div>
      <div className="oba-eo"><div className="oba-eo-t">AP</div>
        <div className="oba-lbl">MV</div><div className="oba-wrap" style={{ marginBottom: 10 }}>
          <Pill label="Global mantido" on={D.apr.mv === "mant"} onClick={() => upN("apr", "mv", D.apr.mv === "mant" ? null : "mant")} />
          <Pill label="Diminuído" on={D.apr.mv === "dim"} onClick={() => upN("apr", "mv", D.apr.mv === "dim" ? null : "dim")} alarm />
        </div>
        <div className="oba-lbl">Ruídos adventícios</div><div className="oba-wrap">
          {["Crepitações", "Sibilos", "Roncos", "Fervores"].map((r) => <Pill key={r} label={r} on={has(D.apr.ra, r)} onClick={() => togNArr("apr", "ra", r)} />)}
        </div>
      </div>
      <div className="oba-eo"><div className="oba-eo-t">Abdómen</div><div className="oba-wrap" style={{ marginBottom: 10 }}>
        {D0.abdomenAchados.map((o) => <Pill key={o.id} label={o.l} on={has(D.abd, o.id)} onClick={() => tog("abd", o.id)} alarm={!!o.a} />)}
      </div>
        {has(D.abd, "dist") && (<><div className="oba-lbl">Grau de distensão</div><div className="oba-wrap" style={{ marginBottom: 8 }}>
          <Pill label="Ligeira" on={D.distGr === "ligeira"} onClick={() => up({ distGr: D.distGr === "ligeira" ? null : "ligeira" })} />
          <Pill label="Moderada" on={D.distGr === "moderada"} onClick={() => up({ distGr: D.distGr === "moderada" ? null : "moderada" })} />
          <Pill label="Marcada" on={D.distGr === "marcada"} onClick={() => up({ distGr: D.distGr === "marcada" ? null : "marcada" })} alarm />
        </div></>)}
        {(() => { const sel = D0.abdomenAchados.filter((x) => has(D.abd, x.id) && x.expl).map((x) => x.expl); return sel.length ? <div className="oba-alert y" dangerouslySetInnerHTML={{ __html: sel.join("<br><br>") }} /> : null; })()}
        {has(D.abd, "dor") && (
          <>
            <div className="oba-lbl">Tipo de dor</div><div className="oba-wrap" style={{ marginBottom: 10 }}>
              <Pill label="Dor difusa" on={D.abdQ === "difusa"} onClick={() => up({ abdQ: D.abdQ === "difusa" ? null : "difusa" })} />
              <Pill label="Dor localizada (seleccionar abaixo)" on={!!D.abdQ && D.abdQ !== "difusa"} onClick={() => up({ abdQ: null })} />
            </div>
            {D.abdQ !== "difusa" && (
              <>
                <div className="oba-lbl">Localização</div>
                <div className="oba-quad">{D0.quadrantes.map((q) => <div key={q.id} className={"oba-quad-cel" + (D.abdQ === q.id ? " sel" : "")} onClick={() => up({ abdQ: q.id })}>{q.l}</div>)}</div>
                {D.abdQ && D.abdQ !== "difusa" && (() => { const sq = D0.quadrantes.filter((q) => q.id === D.abdQ)[0]; return sq ? <div className="oba-alert y"><b>{sq.l}:</b> Pensar em: {sq.h}.</div> : null; })()}
              </>
            )}
            {D.abdQ === "difusa" && <div className="oba-alert y">Dor difusa: pensar em causa funcional (SII, obstipação), peritonite difusa, ou patologia sistémica.</div>}
          </>
        )}
        <div className="oba-lbl" style={{ marginTop: 10 }}>RHA</div><div className="oba-wrap">
          <Pill label="Presentes" on={has(D.rha, "pres")} onClick={() => tog("rha", "pres")} />
          <Pill label="Diminuídos" on={has(D.rha, "dim")} onClick={() => tog("rha", "dim")} alarm />
          <Pill label="Ausentes" on={has(D.rha, "aus")} onClick={() => tog("rha", "aus")} alarm />
          <Pill label="Aumentados" on={has(D.rha, "aum")} onClick={() => tog("rha", "aum")} />
          <Pill label="Metálicos" on={has(D.rha, "met")} onClick={() => tog("rha", "met")} alarm />
        </div>
      </div>
      <div className="oba-eo">
        <div className="oba-eo-tr"><span className="oba-eo-t" style={{ marginBottom: 0 }}>Toque rectal</span>
          <span className="oba-switch-wrap">Realizado?<span className={"oba-switch" + (D.trO ? " on" : "")} onClick={() => up({ trO: !D.trO })}><span className="oba-switch-knob" /></span></span>
        </div>
        {D.trO && (
          <>
            <div className="oba-wrap" style={{ margin: "8px 0" }}>{D0.toqueRectal.map((o) => <Pill key={o.id} label={o.l} on={has(D.trF, o.id)} onClick={() => tog("trF", o.id)} alarm={!!o.a} />)}</div>
            {(() => { const sel = D0.toqueRectal.filter((x) => has(D.trF, x.id) && x.expl).map((x) => x.expl); return sel.length ? <div className="oba-alert y" dangerouslySetInnerHTML={{ __html: sel.join("<br><br>") }} /> : null; })()}
          </>
        )}
      </div>
      <div className="oba-eo"><div className="oba-eo-t">MIs</div><div className="oba-wrap">
        {[["ed", "Edema periférico"], ["tvp", "Sinais TVP"]].map(([k, l]) => (
          <button key={k} className={"oba-togbtn" + (D.mi[k] ? " off" : "")} onClick={() => togN("mi", k)}>{D.mi[k] ? l + " +" : "Sem " + l.toLowerCase()}</button>
        ))}
      </div></div>
    </Card>
  );
}

// ── Passo 9: Resultado ──────────────────────────────────────────────────────
function Resultado({ D, up, upN, tog }) {
  const dx = pontuar(D);
  const top = dx[0];
  const age50 = parseInt(D.idade) >= 50;
  const hasFec = has(D.trF, "fec");
  const hasMassa = has(D.alm, "mas") || has(D.abd, "massa") || has(D.trF, "mre");

  // Toggle de acção: reconstrói o plano (plN) a partir das acções rápidas seleccionadas,
  // que por sua vez alimenta a nota clínica (porte do togAct original).
  const togAct = (a) => {
    const act = D.act.includes(a) ? D.act.filter((x) => x !== a) : [...D.act, a];
    const planItems = act.filter((x) => D0.accoesRapidas.includes(x));
    up(planItems.length ? { act, plN: planItems.join(". ") + "." } : { act });
  };

  const setRxR = (v) => tog("rxR", v);
  const investRx = (
    <div style={{ marginTop: 12 }}>
      <div className="oba-exame-lead">Num caso assim, o exame que ajudaria a esclarecer seria:</div>
      <div className="oba-lbl">Rx abdómen</div>
      <div className="oba-wrap" style={{ marginBottom: 8 }}>{D0.imgRx.map((r) => <Pill key={r[0]} label={r[1]} on={has(D.rxR, r[0])} onClick={() => setRxR(r[0])} />)}</div>
      {D.rxR.map((rv) => { const rx = D0.imgRx.filter((x) => x[0] === rv)[0]; return rx && rx[2] ? <div key={rv} className="oba-alert y">{rx[2]}</div> : null; })}
    </div>
  );

  return (
    <div>
      {/* Diagnóstico principal */}
      <div className="oba-dxcard" style={{ borderLeftColor: top.cor }}>
        <div className="oba-dxcard-titulo">Discussão do caso</div>
        <div className="oba-dxcard-lead">Neste caso, a hipótese mais provável seria:</div>
        <div className="oba-dxcard-cab"><div className="oba-dxcard-n" style={{ background: top.cor + "22", color: top.cor }}>Dx</div><div><div className="oba-dxcard-t">{top.l}</div></div></div>
        <Sec titulo="O que significa este diagnóstico?"><div className="oba-dxinfo">{top.info}</div></Sec>
        <div className="oba-lbl">Baseado em:</div>
        <div className="oba-wrap" style={{ marginBottom: 12 }}>{top.r.map((r, i) => <span key={i} className="oba-rtag" style={{ background: top.cor + "1f", color: top.cor }}>{r}</span>)}</div>
        <div className="oba-plano" dangerouslySetInnerHTML={{ __html: top.plano }} />
        {(top.id === "obstr" || top.id === "emerg" || top.id === "ileus") && investRx}
        {top.id === "fecal" && !hasFec && investRx}
        {(top.id === "obstr" || top.id === "emerg") && (has(D.rxR, "niv") || has(D.rxR, "dil")) && (
          <div style={{ marginTop: 8 }}><div className="oba-exame-lead">Num caso assim, o exame que ajudaria a esclarecer seria:</div><div className="oba-lbl">TC abdominal</div><div className="oba-wrap" style={{ marginBottom: 8 }}>{D0.imgTc.map((r) => <Pill key={r[0]} label={r[1]} on={D.tcR === r[0]} onClick={() => up({ tcR: D.tcR === r[0] ? null : r[0] })} />)}</div>
            {D.tcR && (() => { const tc = D0.imgTc.filter((x) => x[0] === D.tcR)[0]; return tc && tc[2] ? <div className="oba-alert y">{tc[2]}</div> : null; })()}</div>
        )}
        {top.id === "divert" && (
          <div style={{ marginTop: 12 }}><div className="oba-exame-lead">Num caso assim, o exame que ajudaria a esclarecer seria:</div><div className="oba-lbl">TC abdominal</div><div className="oba-wrap" style={{ marginBottom: 8 }}>{D0.imgTc.map((r) => <Pill key={r[0]} label={r[1]} on={D.tcR === r[0]} onClick={() => up({ tcR: D.tcR === r[0] ? null : r[0] })} />)}</div>
            {D.tcR && (() => { const tc = D0.imgTc.filter((x) => x[0] === D.tcR)[0]; return tc && tc[2] ? <div className="oba-alert y">{tc[2]}</div> : null; })()}</div>
        )}
        {top.id === "neo" && (
          <div style={{ marginTop: 12 }}><div className="oba-exame-lead">Num caso assim, o exame que ajudaria a esclarecer seria:</div><div className="oba-lbl">{D.recTipo === "mel" ? "EDA (1.º) → se normal: colonoscopia" : "Colonoscopia"}</div><div className="oba-wrap" style={{ marginBottom: 8 }}>{D0.colRes.map((r) => <Pill key={r[0]} label={r[1]} on={D.colR === r[0]} onClick={() => up({ colR: D.colR === r[0] ? null : r[0] })} />)}</div>
            {D.colR && (() => { const cr = D0.colRes.filter((x) => x[0] === D.colR)[0]; return cr && cr[2] ? <div className="oba-alert y">{cr[2]}</div> : null; })()}</div>
        )}
      </div>

      {/* Outros diagnósticos */}
      {dx.length > 1 && (
        <Sec titulo="Outros diagnósticos a considerar">
          {dx.slice(1).map((d, i) => (
            <div key={i} className="oba-dx2"><b style={{ color: d.cor }}>{d.l}</b><div className="oba-wrap" style={{ marginTop: 4 }}>{d.r.map((r, j) => <span key={j} className="oba-dx2-r">{r}</span>)}</div><div className="oba-dx2-info">{d.info}</div></div>
          ))}
        </Sec>
      )}

      {/* Factores contribuintes */}
      <FactoresContribuintes D={D} />

      {/* Rastreio >50 */}
      {age50 && !isSU(D) && !hasMassa && !has(D.alm, "rec") && !has(D.alm, "afe") && !has(D.alm, "ppe") && (
        <div className="oba-alert y" style={{ marginTop: 12 }}>Caso com {D.idade} anos: a considerar se o rastreio de colonoscopia estaria actualizado.</div>
      )}

      {/* Analítica */}
      <Sec titulo="Analítica"><Analitica D={D} up={up} upN={upN} tog={tog} /></Sec>

      {/* Medidas gerais */}
      <Sec titulo="Medidas gerais">
        <div className="oba-medidas">{D0.medidasGerais.map(([t, d], i) => <div key={i} className="oba-medida"><b>{t}:</b> {d}</div>)}</div>
      </Sec>

      {/* Tratamento farmacológico */}
      <Sec titulo="Tratamento farmacológico">
        <div className="oba-lbl">Já tentou tratamento?</div>
        <div className="oba-wrap" style={{ marginBottom: 12 }}>{D0.tratamentoPrevio.map((o) => <Pill key={o.v} label={o.l} on={D.pvT === o.v} onClick={() => up({ pvT: D.pvT === o.v ? null : o.v })} />)}</div>
        {(() => { const t = D0.tratamentoTextos[D.pvT || "n"]; return <div className={"oba-bar " + t.cls} dangerouslySetInnerHTML={{ __html: t.html }} />; })()}
      </Sec>

      {/* Acções SU */}
      {isSU(D) && (
        <div className="oba-field"><div className="oba-lbl">Acções realizadas</div><div className="oba-wrap">{D0.accoesSU.map((a) => <Pill key={a} label={a} on={has(D.act, a)} onClick={() => togAct(a)} />)}</div></div>
      )}

      {/* Acções rápidas + plano */}
      <div className="oba-field"><div className="oba-lbl">Acções rápidas para o plano:</div><div className="oba-wrap" style={{ marginBottom: 10 }}>{D0.accoesRapidas.map((a) => <Pill key={a} label={a} on={has(D.act, a)} onClick={() => togAct(a)} />)}</div></div>
      <div className="oba-field"><div className="oba-lbl">Plano / Notas finais</div><textarea className="oba-textarea" value={D.plN} onChange={(e) => up({ plN: e.target.value })} placeholder="Ex: Alta com macrogol 1 saq 2x/dia. Reavaliação MF 1 semana." /></div>

      <div className="oba-nota-hint">O exemplo de nota-modelo está no painel <b>Nota</b> (ao lado, ou no botão em baixo) — atualiza-se com as tuas seleções.</div>
    </div>
  );
}

function FactoresContribuintes({ D }) {
  const factors = [];
  D.cDr.forEach((d) => { const cls = getDrCls(d); const c = D0.farmacosClasses.filter((x) => x.cls === cls)[0]; if (c && c.mech) factors.push({ t: d + " (" + cls + ")", m: c.mech, a: "Considerar substituição ou associar laxante profilático." }); });
  D.ant.forEach((a) => { const x = D0.antecedentes.filter((xx) => xx.id === a)[0]; if (x && x.h) factors.push({ t: x.l, m: x.h, a: "" }); });
  if (D.exe === "sedentario") factors.push({ t: "Sedentarismo", m: "A inactividade física reduz a motilidade intestinal e o peristaltismo. Estar sentado ou deitado por longos períodos agrava a estase fecal.", a: "Recomendar ≥150min/semana de exercício moderado (caminhada, natação)." });
  if (D.fib === "nao") factors.push({ t: "Dieta pobre em fibra", m: "Fibra insuficiente reduz o volume fecal, diminui a retenção de água nas fezes e reduz a estimulação mecânica do peristaltismo.", a: "Aumentar gradualmente para 25-30g/dia: frutas, vegetais, cereais integrais, leguminosas." });
  if (D.agu && parseFloat(D.agu.replace(",", ".")) < 1.5) factors.push({ t: "Hidratação insuficiente", m: "A desidratação aumenta a absorção de água no cólon, endurecendo as fezes e dificultando a evacuação.", a: "Recomendar 1,5-2L/dia de água e líquidos sem cafeína." });
  if (D.tab === "sim") factors.push({ t: "Tabagismo activo", m: "Factor de risco vascular major. Aumenta risco de isquemia mesentérica, doença arterial periférica e aterosclerose.", a: "Cessação tabágica é prioritária. Encaminhar para consulta de cessação." });
  if (D.rep === "sim") factors.push({ t: "Reprime urgência defecatória", m: "Adiar repetidamente a defecação enfraquece progressivamente o reflexo defecatório. O recto adapta-se e perde sensibilidade.", a: "Aconselhar a responder sempre à urgência, especialmente após refeições (reflexo gastrocólico)." });
  if (!factors.length) return null;
  return (
    <Sec titulo={"Factores contribuintes (" + factors.length + ")"}>
      {factors.map((f, i) => (
        <div key={i} className="oba-factor"><div className="oba-factor-t">{f.t}</div><div className="oba-factor-m">{f.m}</div>{f.a && <div className="oba-factor-a">→ {f.a}</div>}</div>
      ))}
    </Sec>
  );
}

function Analitica({ D, up, upN, tog }) {
  return (
    <>
      <div className="oba-ana-guia">
        <div className="oba-step"><b>Rotina (pedir sempre):</b> Hemograma, Ionograma (Na, K, Ca), Creatinina, Glicose, TSH, PCR</div>
        <div className="oba-step"><b>Se alarmes presentes:</b> Ferro/Ferritina, SOF, Função hepática (AST, ALT, FA), CEA se suspeita neoplasia</div>
        <div className="oba-step"><b>Se agudo/urgente:</b> Lactato, Gasimetria, Coagulação, Amilase/Lipase se dor</div>
      </div>
      <div className="oba-lbl">Seleccionar análises pedidas:</div>
      {D0.analitica.map((grp) => (
        <div key={grp.grp} style={{ marginBottom: 8 }}><div className="oba-ana-grp">{grp.grp}</div><div className="oba-wrap">{grp.items.map((a) => <Pill key={a.k} label={a.k + " (" + a.u + ")"} on={has(D.anSel, a.k)} onClick={() => tog("anSel", a.k)} />)}</div></div>
      ))}
      <div className="oba-wrap" style={{ marginBottom: 12 }}><Pill label="SOF" on={has(D.anSel, "SOF")} onClick={() => tog("anSel", "SOF")} /></div>
      {D.anSel.length > 0 && (
        <div className="oba-divider">
          <div className="oba-lbl">Resultados:</div>
          <div className="oba-grid2">
            {D0.analitica.flatMap((grp) => grp.items).filter((a) => has(D.anSel, a.k)).map((a) => {
              const val = D.anV[a.k] || ""; const num = parseFloat(val.replace(",", "."));
              let status = "", cor = "", tip = "";
              if (val && !isNaN(num)) { if (num < a.lo) { status = " (baixo)"; cor = "#dc2626"; tip = a.tipLo; } else if (num > a.hi) { status = " (elevado)"; cor = "#dc2626"; tip = a.tipHi; } else { status = " (normal)"; cor = "#059669"; } }
              return (
                <div key={a.k} style={{ marginBottom: 8 }}>
                  <div className="oba-ana-lbl"><span>{a.k}</span><span className="oba-ana-u">{a.u}</span>{status && <span style={{ color: cor, fontSize: 10, fontWeight: 600 }}>{status}</span>}</div>
                  <input className="oba-inp oba-inp-sm" value={val} onChange={(e) => upN("anV", a.k, e.target.value)} placeholder={a.lo + "-" + a.hi} />
                  {tip && <div className="oba-ana-tip">{tip}</div>}
                </div>
              );
            })}
            {has(D.anSel, "SOF") && (
              <div style={{ marginBottom: 8 }}><div className="oba-ana-lbl"><span>SOF</span></div><div className="oba-wrap">
                <Pill label="Negativo" on={D.anR.SOF === "ng"} onClick={() => upN("anR", "SOF", D.anR.SOF === "ng" ? null : "ng")} />
                <Pill label="Positivo" on={D.anR.SOF === "ps"} onClick={() => upN("anR", "SOF", D.anR.SOF === "ps" ? null : "ps")} alarm />
              </div>{D.anR.SOF === "ps" && <div className="oba-ana-tip">Colonoscopia obrigatória.</div>}</div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
