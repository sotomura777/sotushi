import { ICONE_MODULO_MODERNO } from "./icones-modernos";

// Cor por categoria (claro/glossy · escuro/neon) — tabela do icon-tiles.css.
const COR = {
  "ajuste-renal": ["#2E9E8F", "#2af5c0"],
  urgencia: ["#DB6A5B", "#ff5c7a"],
  cronicas: ["#0B6E7F", "#2ff0e0"],
  analises: ["#8674C9", "#b07cff"],
  calculadoras: ["#3FA178", "#3df59a"],
  vacinacao: ["#34A7A0", "#2ff0d8"],
  notas: ["#6A7689", "#9fb4ff"],
  "saude-infantil": ["#CE7BA0", "#ff84c4"],
  "farmacos-gravidez": ["#7C5BD0", "#b07cff"],
  interacoes: ["#1E8C84", "#2af0cf"],
  infetoacesso: ["#B45309", "#ffb454"],
  "infetoacesso-ped": ["#C4756B", "#ff9e90"],
  easyfarm: ["#1B5E8A", "#5db4f0"],
};

// Mosaico de ícone de módulo: glossy (claro) ou neon (escuro), conforme o tema.
export default function IconeModulo({ id, dark, size }) {
  const glifo = ICONE_MODULO_MODERNO[id];
  if (!glifo) return null;
  const [clara, neon] = COR[id] || ["#8b5cf6", "#b07cff"];
  const cls = "mg-ictile" + (size === "sm" ? " mg-ictile--sm" : "");
  const ac = dark ? neon : clara;
  return (
    <span className={cls} style={{ "--ac": ac }}>
      {glifo("currentColor", 22)}
    </span>
  );
}
