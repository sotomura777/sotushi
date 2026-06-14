import { useState, useMemo } from "react";
import { contagens, splitCsv, PALETTE } from "./logica";
import { toast, useEscape } from "@/lib/toast";
import TagInput from "./TagInput";
import Swatches from "./Swatches";

// Modal de edição/criação de uma nota.
export default function EditorNota({ nota, notes, recentes, onPushRecent, onSave, onApagar, onClose }) {
  const [name, setName] = useState(nota?.name || "");
  const [brands, setBrands] = useState(nota?.brands || "");
  const [dose, setDose] = useState(nota?.dose || "");
  const [clinical, setClinical] = useState(nota?.clinical || "");
  const [inds, setInds] = useState(() => splitCsv(nota?.indication));
  const [cls, setCls] = useState(() => splitCsv(nota?.classes));
  const [tags, setTags] = useState(() => nota?.tags ? [...nota.tags] : []);
  const [color, setColor] = useState(() => nota?.color || PALETTE[Math.floor(Math.random() * PALETTE.length)]);

  useEscape(onClose);

  const sugInd = useMemo(() => contagens(notes, "indication"), [notes]);
  const sugCls = useMemo(() => contagens(notes, "classes"), [notes]);
  const sugTag = useMemo(() => contagens(notes, "tags", true), [notes]);

  const guardar = () => {
    const nome = name.trim();
    if (!nome) { toast("Falta o nome do fármaco"); return; }
    onSave({
      name: nome,
      brands: brands.trim(),
      classes: cls.join(", "),
      indication: inds.join(", "),
      dose: dose.trim(),
      clinical: clinical.trim(),
      tags: [...tags],
      color,
    });
  };

  return (
    <div className="myef-modal-backdrop" onClick={(e) => { if (e.target.classList.contains("myef-modal-backdrop")) onClose(); }}>
      <div className="myef-modal" role="dialog" aria-label={nota ? "Editar nota" : "Nova nota"}>
        <div className="myef-modal-header">
          <div className="myef-modal-title">{nota ? "Editar nota" : "Nova nota"}</div>
          <button className="myef-modal-close" onClick={onClose} aria-label="Fechar">×</button>
        </div>

        <div className="myef-modal-body">
          <div className="myef-field-row">
            <div className="field">
              <label className="field-label" htmlFor="myef-name">Fármaco (DCI)</label>
              <input id="myef-name" className="campo" value={name} onChange={(e) => setName(e.target.value)}
                placeholder="ex: Bisoprolol" autoFocus />
            </div>
            <TagInput label="Indicações" hint="Enter para adicionar" placeholder="ex: HTA, IC…"
              valores={inds} onChange={setInds} sugestoes={sugInd} />
          </div>

          <div className="field">
            <label className="field-label" htmlFor="myef-brands">Marcas <span className="field-label-hint">— separadas por vírgula</span></label>
            <input id="myef-brands" className="campo" value={brands} onChange={(e) => setBrands(e.target.value)}
              placeholder="ex: Concor, Cardicor, Bisocor" />
          </div>

          <TagInput label="Classes farmacológicas" hint="Enter para adicionar, opcional" placeholder="ex: β-bloqueador, ISRS…"
            valores={cls} onChange={setCls} sugestoes={sugCls} />

          <div className="field">
            <label className="field-label" htmlFor="myef-dose">Esquema posológico <span className="field-label-hint">— como costumas prescrever</span></label>
            <textarea id="myef-dose" className="campo myef-mono" value={dose} onChange={(e) => setDose(e.target.value)}
              placeholder="ex: 2,5mg id, titular q2sem até 10mg" rows={3} />
          </div>

          <div className="field">
            <label className="field-label" htmlFor="myef-clinical">Nota clínica <span className="field-label-hint">— observação, truque, alerta</span></label>
            <textarea id="myef-clinical" className="campo" value={clinical} onChange={(e) => setClinical(e.target.value)}
              placeholder="ex: Em idoso fragilizado começo a 1,25mg. Pausar se FC < 55." rows={3} />
          </div>

          <TagInput label="Tags" hint="Enter para adicionar" placeholder="ex: cardio, idoso, DRC…"
            valores={tags} onChange={setTags} sugestoes={sugTag} />

          <div className="field">
            <span className="field-label">Cor <span className="field-label-hint">— agrupar por sistema/especialidade</span></span>
            <Swatches value={color} onChange={setColor} recentes={recentes} onPushRecent={onPushRecent} />
          </div>
        </div>

        <div className="myef-modal-footer">
          {nota && <button className="myef-btn-danger" onClick={onApagar}>Apagar</button>}
          <div className="myef-btn-right">
            <button className="myef-btn-cancel" onClick={onClose}>Cancelar</button>
            <button className="myef-btn-primary" onClick={guardar}>Guardar</button>
          </div>
        </div>
      </div>
    </div>
  );
}
