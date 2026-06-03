import { useState } from "react";
import meta from "@conteudo/cards/meta.json";
import { parseTags, gerarTagColors, uid } from "./logica";
import "./estilo.css";

const TIPOS = meta.tipos;
const ESP = meta.especialidades;
const TIPO_KEYS = Object.keys(TIPOS);
const ESP_KEYS = Object.keys(ESP);

export default function CriarCard({ cards, setCards, editId, onDone, accent }) {
  const editing = editId != null ? cards.find((c) => c.id === editId) : null;
  const [f, setF] = useState(() => ({
    tipo: editing?.tipo || TIPO_KEYS[0],
    especialidade: editing?.especialidade || ESP_KEYS[0],
    titulo: editing?.titulo || "",
    subtitulo: editing?.subtitulo || "",
    tags: (editing?.tags || []).join(", "),
    dose: editing?.front?.dose || "",
    ea: editing?.front?.ea || "",
    label: editing?.back?.label || "",
    mecanismo: editing?.back?.mecanismo || "",
    dica: editing?.back?.dica || "",
    fonte: editing?.back?.fonte || "",
  }));
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const podeGuardar = f.titulo.trim().length > 0;

  const guardar = () => {
    if (!podeGuardar) return;
    const tags = parseTags(f.tags);
    const tagColors = gerarTagColors(tags, ESP[f.especialidade].cor, TIPOS[f.tipo].cor);
    const base = {
      tipo: f.tipo,
      especialidade: f.especialidade,
      titulo: f.titulo.trim(),
      subtitulo: f.subtitulo.trim(),
      tags,
      tagColors,
      front: { dose: f.dose.trim(), ea: f.ea.trim() },
      back: { label: f.label.trim(), mecanismo: f.mecanismo.trim(), dica: f.dica.trim(), fonte: f.fonte.trim() },
    };
    if (editing) setCards((cs) => cs.map((c) => (c.id === editing.id ? { ...c, ...base } : c)));
    else setCards((cs) => [{ id: uid(), favorito: false, criadoEm: new Date().toISOString(), ...base }, ...cs]);
    onDone();
  };
  const eliminar = () => { setCards((cs) => cs.filter((c) => c.id !== editing.id)); onDone(); };

  const inp = { width: "100%", padding: "9px 13px", borderRadius: 9, border: "1.5px solid var(--borda)", background: "var(--superficie-2)", fontSize: 13.5, color: "var(--texto)", fontFamily: "var(--fonte-corpo)", marginBottom: 10 };

  return (
    <div className="aba" style={{ "--acento": accent }}>
      <h1 className="aba-titulo" style={{ marginBottom: 14 }}>{editing ? "Editar card" : "Criar card"}</h1>

      <div className="cd-form-row">
        <div>
          <div className="secao-label">Tipo</div>
          <select style={inp} value={f.tipo} onChange={(e) => set("tipo", e.target.value)}>
            {TIPO_KEYS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <div className="secao-label">Especialidade</div>
          <select style={inp} value={f.especialidade} onChange={(e) => set("especialidade", e.target.value)}>
            {ESP_KEYS.map((k) => <option key={k} value={k}>{ESP[k].label}</option>)}
          </select>
        </div>
      </div>

      <div className="secao-label">Título</div>
      <input style={inp} value={f.titulo} onChange={(e) => set("titulo", e.target.value)} placeholder="Ex: Amoxicilina" />
      <div className="secao-label">Subtítulo</div>
      <input style={inp} value={f.subtitulo} onChange={(e) => set("subtitulo", e.target.value)} placeholder="Ex: Clamoxyl® · Generis®" />
      <div className="secao-label">Tags (separadas por vírgula)</div>
      <input style={inp} value={f.tags} onChange={(e) => set("tags", e.target.value)} placeholder="Ex: HTA, 1ª LINHA" />

      <div className="cd-form-row">
        <div><div className="secao-label">Linha principal</div><input style={inp} value={f.dose} onChange={(e) => set("dose", e.target.value)} placeholder="Dose / critérios / técnica…" /></div>
        <div><div className="secao-label">Nota</div><input style={inp} value={f.ea} onChange={(e) => set("ea", e.target.value)} placeholder="Efeitos / observação…" /></div>
      </div>

      <div className="secao-label">Label do verso</div>
      <input style={inp} value={f.label} onChange={(e) => set("label", e.target.value)} placeholder="Ex: MECANISMO DE AÇÃO" />
      <div className="secao-label">Verso (texto principal)</div>
      <textarea style={{ ...inp, minHeight: 72, resize: "vertical" }} value={f.mecanismo} onChange={(e) => set("mecanismo", e.target.value)} placeholder="Texto principal do verso…" />
      <div className="secao-label">Dica</div>
      <textarea style={{ ...inp, minHeight: 54, resize: "vertical" }} value={f.dica} onChange={(e) => set("dica", e.target.value)} placeholder="Dica clínica…" />
      <div className="secao-label">Fonte</div>
      <input style={inp} value={f.fonte} onChange={(e) => set("fonte", e.target.value)} placeholder="Ex: ESC 2023" />

      <button onClick={guardar} disabled={!podeGuardar} style={{ width: "100%", padding: 12, borderRadius: 9, border: "none", background: accent, color: "#fff", fontWeight: 700, fontSize: 14, cursor: podeGuardar ? "pointer" : "default", opacity: podeGuardar ? 1 : 0.5, fontFamily: "var(--fonte-corpo)", marginTop: 4 }}>
        {editing ? "Guardar alterações" : "Criar card"}
      </button>
      {editing && (
        <button onClick={eliminar} style={{ width: "100%", padding: 11, borderRadius: 9, marginTop: 8, background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA", fontWeight: 600, cursor: "pointer", fontFamily: "var(--fonte-corpo)" }}>
          Eliminar card
        </button>
      )}
      <button onClick={onDone} style={{ width: "100%", padding: 10, marginTop: 8, background: "none", border: "none", color: "var(--suave)", cursor: "pointer", fontFamily: "var(--fonte-corpo)", fontSize: 13 }}>
        Cancelar
      </button>
    </div>
  );
}
