import { ICONE_MODULO_MODERNO } from "./icones-modernos";

// Cor por categoria (claro/glossy · escuro/neon) — tabela do icon-tiles.css.
// Uma cor distinta por módulo — espalhadas pelo espectro para os ícones do menu
// não se parecerem entre si. Par [clara/glossy (claro) · neon (escuro)].
const COR = {
  "ajuste-renal": ["#5566C4", "#8b9bff"],      // índigo
  analises: ["#8674C9", "#b07cff"],            // violeta-azulado
  vacinacao: ["#1AA0B5", "#2fe6f5"],           // ciano
  notas: ["#6A7689", "#9fb4ff"],               // ardósia
  "saude-infantil": ["#CE7BA0", "#ff84c4"],    // rosa
  "farmacos-gravidez": ["#A24FB8", "#d07cff"], // ameixa/magenta
  interacoes: ["#1E8C84", "#2af0cf"],          // teal
  infetoacesso: ["#B45309", "#ffb454"],        // âmbar
  "infetoacesso-ped": ["#C4756B", "#ff9e90"],  // terracota
  easyfarm: ["#1B5E8A", "#5db4f0"],            // azul
  "my-easyfarm": ["#2E9E55", "#3df58a"],       // verde-esmeralda
  pna: ["#639922", "#a3e635"],                 // verde-relva (PNA)
  sintomas: ["#2d5552", "#5fd6c4"],            // teal-profundo (Abordagem por Sintoma)
  sinave: ["#a8434d", "#ff7a88"],              // bordeaux (Notificação Obrigatória)
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
