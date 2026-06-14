import { useEffect, useMemo, useState } from "react";
import { Ico } from "@/components/icones";
import { toast } from "@/lib/toast";
import { obterRespostas, listarPresets, guardarPreset, apagarPreset } from "./db";
import { filtrosVazios, filtrarPerguntas, montarSessao, contarPorDificuldade, gerarSugestao } from "./logica-filtros";

// ============================================================================
// Construtor — monta um exame/treino à medida com filtros granulares, contador
// e pré-visualização ao vivo, e guarda configurações como presets (IndexedDB).
// ============================================================================
const TEMPOS = { sem_limite: null, pna: 96, rapido: 60 };

function ChipGroup({ titulo, valores, set, onToggle }) {
  if (!valores.length) return null;
  return (
    <>
      <p className="pna-cons-lbl">{titulo}</p>
      <div className="pna-cons-chips">
        {valores.map((v) => (
          <button key={v} className={"pna-cons-chip" + (set.has(v) ? " ativo" : "")} onClick={() => onToggle(v)}>
            {v}{set.has(v) ? " ×" : ""}
          </button>
        ))}
      </div>
    </>
  );
}

export default function Construtor({ taxonomia, perguntas, presetsFabrica = [], onComecar, onVoltar }) {
  const [filtros, setFiltros] = useState(filtrosVazios);
  const [n, setN] = useState(20);
  const [modo, setModo] = useState("exame");
  const [tempo, setTempo] = useState("pna");
  const [ordem, setOrdem] = useState("aleatoria");
  const [respostas, setRespostas] = useState([]);
  const [presets, setPresets] = useState([]);

  const carregarPresets = () => listarPresets().then(setPresets);
  useEffect(() => { obterRespostas().then(setRespostas); carregarPresets(); }, []);

  // histórico pessoal para os filtros "nunca/erradas/marcadas"
  const hist = useMemo(() => {
    const vistas = new Set(), erradas = new Set(), marcadas = new Set(), errosPorId = {};
    for (const r of respostas) {
      vistas.add(r.pergunta_id);
      if (!r.correta) { erradas.add(r.pergunta_id); errosPorId[r.pergunta_id] = (errosPorId[r.pergunta_id] || 0) + 1; }
      if (r.marcou_revisao) marcadas.add(r.pergunta_id);
    }
    return { vistas, erradas, marcadas, errosPorId };
  }, [respostas]);

  const filtradas = useMemo(() => filtrarPerguntas(perguntas, filtros, hist), [perguntas, filtros, hist]);
  const dif = contarPorDificuldade(filtradas);
  const total = filtradas.length;
  const nFinal = Math.min(n, total);
  const sugestao = gerarSugestao(filtros, total);

  // subáreas e guidelines disponíveis
  const subareasDisp = useMemo(() => {
    const alvo = filtros.especialidades.size ? [...filtros.especialidades] : [];
    const s = new Set();
    alvo.forEach((e) => (taxonomia.subareas?.[e] || []).forEach((x) => s.add(x)));
    return [...s];
  }, [filtros.especialidades, taxonomia]);
  const guidelinesDisp = useMemo(() => {
    const s = new Set();
    perguntas.forEach((q) => (q.guidelines_fonte || []).forEach((g) => s.add(g)));
    return [...s];
  }, [perguntas]);

  const toggle = (grupo, v) => setFiltros((f) => {
    const n2 = { ...f, especialidades: new Set(f.especialidades), subareas: new Set(f.subareas), tipos: new Set(f.tipos), dificuldades: new Set(f.dificuldades), guidelines: new Set(f.guidelines) };
    n2[grupo].has(v) ? n2[grupo].delete(v) : n2[grupo].add(v);
    return n2;
  });
  const limpar = () => setFiltros(filtrosVazios());

  const comecar = () => {
    if (total === 0) { toast("Nenhuma pergunta corresponde"); return; }
    const set = montarSessao(perguntas, filtros, hist, ordem, nFinal);
    onComecar({ perguntas: set, modo, tempoS: TEMPOS[tempo] });
  };

  const serializarFiltros = (f) => ({
    especialidades: [...f.especialidades], subareas: [...f.subareas], tipos: [...f.tipos],
    dificuldades: [...f.dificuldades], guidelines: [...f.guidelines], historico: f.historico,
  });
  const guardar = async () => {
    const nome = window.prompt("Nome para esta configuração:");
    if (!nome) return;
    await guardarPreset({ nome, filtros: serializarFiltros(filtros), n: nFinal, modo, ordem, tempo });
    await carregarPresets();
    toast("Configuração guardada");
  };

  const aplicarPreset = (p) => {
    const f = filtrosVazios();
    const pf = p.filtros || {};
    f.especialidades = new Set(pf.especialidades || []);
    f.subareas = new Set(pf.subareas || []);
    f.tipos = new Set(pf.tipos || []);
    f.dificuldades = new Set(pf.dificuldades || []);
    f.guidelines = new Set(pf.guidelines || []);
    f.historico = pf.historico || "qualquer";
    setFiltros(f);
    if (p.n) setN(p.n);
    if (p.modo) setModo(p.modo);
    if (p.ordem) setOrdem(p.ordem);
    if (p.tempo) setTempo(p.tempo);
  };

  const HISTORICO = [
    { v: "qualquer", t: "Qualquer" }, { v: "nunca", t: "Nunca vistas" },
    { v: "erradas", t: "Só erradas" }, { v: "marcadas", t: "Marcadas" },
  ];

  return (
    <>
      <div className="pna-treino-topo">
        <button className="pna-link" onClick={onVoltar}>← Voltar</button>
        <span className="pna-treino-prog">Construtor</span>
      </div>

      {/* presets */}
      {(presetsFabrica.length > 0 || presets.length > 0) && (
        <>
          <p className="secao-label">Configurações</p>
          <div className="pna-cons-presets">
            {presetsFabrica.map((p) => (
              <button key={"f" + p.nome} className="pna-cons-preset" onClick={() => aplicarPreset(p)}>
                <Ico name="starFill" s={12} /> {p.nome} <span className="qt">· {p.n}</span>
              </button>
            ))}
            {presets.map((p) => (
              <button key={p.id} className="pna-cons-preset" onClick={() => aplicarPreset(p)}
                onContextMenu={(e) => { e.preventDefault(); if (window.confirm("Apagar preset?")) apagarPreset(p.id).then(carregarPresets); }}>
                <Ico name="star" s={12} /> {p.nome} <span className="qt">· {p.n}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {/* filtros */}
      <div className="pna-sec-cab">
        <p className="secao-label">Filtros</p>
        <button className="pna-link" onClick={limpar}>Limpar tudo</button>
      </div>
      <div className="cartao" style={{ padding: 14, marginBottom: 14 }}>
        <ChipGroup titulo="Especialidade" valores={taxonomia.especialidades} set={filtros.especialidades} onToggle={(v) => toggle("especialidades", v)} />
        {subareasDisp.length > 0 && <ChipGroup titulo="Subárea / patologia" valores={subareasDisp} set={filtros.subareas} onToggle={(v) => toggle("subareas", v)} />}
        <ChipGroup titulo="Tipo de raciocínio" valores={taxonomia.tipos_raciocinio} set={filtros.tipos} onToggle={(v) => toggle("tipos", v)} />
        <ChipGroup titulo="Dificuldade" valores={taxonomia.dificuldades} set={filtros.dificuldades} onToggle={(v) => toggle("dificuldades", v)} />
        {guidelinesDisp.length > 0 && <ChipGroup titulo="Normas DGS / guidelines" valores={guidelinesDisp} set={filtros.guidelines} onToggle={(v) => toggle("guidelines", v)} />}

        <p className="pna-cons-lbl">Histórico pessoal</p>
        <div className="pna-cons-chips">
          {HISTORICO.map((h) => (
            <button key={h.v} className={"pna-cons-chip" + (filtros.historico === h.v ? " ativo" : "")} onClick={() => setFiltros((f) => ({ ...f, historico: h.v }))}>{h.t}</button>
          ))}
        </div>
      </div>

      {/* contador + preview */}
      <div className="cartao" style={{ padding: 16, marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 10 }}>
          <span className="pna-pos-grande">{total}</span>
          <span className="pna-area-sub">perguntas correspondem aos filtros</span>
        </div>
        {total > 0 && (
          <div className="pna-barra-emp" style={{ marginBottom: 10 }}>
            {dif.fácil > 0 && <span className="hc2" style={{ width: (dif.fácil / total * 100) + "%" }}>{dif.fácil} fác.</span>}
            {dif.média > 0 && <span className="hc1" style={{ width: (dif.média / total * 100) + "%" }}>{dif.média} méd.</span>}
            {dif.difícil > 0 && <span className="hc4" style={{ width: (dif.difícil / total * 100) + "%" }}>{dif.difícil} dif.</span>}
          </div>
        )}
        {filtradas.slice(0, 4).map((q) => (
          <div key={q.id} className="pna-cons-prev">
            <span className="pna-cons-prev-dot" />
            <span>{q.taxonomia?.patologia || q.taxonomia?.subarea || q.taxonomia?.especialidade} · {q.lead_in}</span>
          </div>
        ))}
        {total > 4 && <p className="pna-area-sub" style={{ marginTop: 6 }}>+ {total - 4} perguntas</p>}
      </div>

      {/* configuração */}
      <div className="cartao" style={{ padding: 14, marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <p className="pna-cons-lbl" style={{ margin: 0 }}>Quantas perguntas?</p>
          <span className="pna-pos-grande" style={{ fontSize: 18 }}>{nFinal}</span>
        </div>
        <input type="range" className="pna-range" min={1} max={Math.max(1, total)} value={Math.min(n, Math.max(1, total))}
          onChange={(e) => setN(Number(e.target.value))} disabled={total === 0} />

        <p className="pna-cons-lbl" style={{ marginTop: 12 }}>Modo</p>
        <div className="pna-dois" style={{ marginBottom: 0 }}>
          <button className={"pna-modo" + (modo === "treino" ? " pna-modo--sel" : "")} onClick={() => setModo("treino")}>
            <div className="pna-modo-cab"><span className="ic"><Ico name="bulb" s={16} /></span><p className="pna-modo-nome">Treino</p></div>
            <p className="pna-modo-desc">Feedback imediato</p>
          </button>
          <button className={"pna-modo" + (modo === "exame" ? " pna-modo--sel" : "")} onClick={() => setModo("exame")}>
            <div className="pna-modo-cab"><span className="ic"><Ico name="clock" s={16} /></span><p className="pna-modo-nome">Exame</p></div>
            <p className="pna-modo-desc">Cronometrado</p>
          </button>
        </div>

        {modo === "exame" && (
          <>
            <p className="pna-cons-lbl" style={{ marginTop: 12 }}>Tempo por pergunta</p>
            <div className="pna-cons-chips">
              {[{ v: "sem_limite", t: "Sem limite" }, { v: "pna", t: "PNA real (96s)" }, { v: "rapido", t: "Rápido (60s)" }].map((o) => (
                <button key={o.v} className={"pna-cons-chip" + (tempo === o.v ? " ativo" : "")} onClick={() => setTempo(o.v)}>{o.t}</button>
              ))}
            </div>
          </>
        )}

        <p className="pna-cons-lbl" style={{ marginTop: 12 }}>Ordem</p>
        <div className="pna-cons-chips">
          {[{ v: "aleatoria", t: "Aleatória" }, { v: "antiga", t: "Nunca vistas primeiro" }, { v: "mais_errada", t: "Mais errada primeiro" }].map((o) => (
            <button key={o.v} className={"pna-cons-chip" + (ordem === o.v ? " ativo" : "")} onClick={() => setOrdem(o.v)}>{o.t}</button>
          ))}
        </div>
      </div>

      {sugestao && (
        <div className="pna-insight pna-insight--bom" style={{ marginBottom: 14 }}>
          <span className="i"><Ico name="bulb" s={16} /></span>
          <div><b>Sugestão:</b> {sugestao}</div>
        </div>
      )}

      <div className="pna-dois" style={{ marginBottom: 0 }}>
        <button className="pna-btn" onClick={comecar} disabled={total === 0}>
          <Ico name="alvo" s={15} /> Começar {modo === "exame" ? "exame" : "treino"} ({nFinal})
        </button>
        <button className="pna-btn-sec" onClick={guardar}><Ico name="star" s={14} /> Guardar</button>
      </div>
    </>
  );
}
