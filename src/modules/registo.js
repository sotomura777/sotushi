// ============================================================================
// REGISTO DE MÓDULOS
// Único sítio onde um módulo é "ligado" à app. A identidade visual (accent,
// gradiente, bg do cartão) vive aqui; o ícone vem de components/icones.jsx
// (mapa ICONE_MODULO por id). O conteúdo clínico vive em /conteudo.
// ============================================================================

import AjusteRenal from "./ajuste-renal/AjusteRenal";
import metaRenal from "@conteudo/ajuste-renal/meta.json";
import AntibioterapiaAmbulatorio from "./antibioterapia/AntibioterapiaAmbulatorio";
import metaAtb from "@conteudo/antibioterapia/meta.json";
import Analises from "./analises/Analises";
import metaAnalises from "@conteudo/analises/meta.json";
import Vacinacao from "./vacinacao/Vacinacao";
import SaudeInfantil from "./saude-infantil/SaudeInfantil";
import Urgencia from "./urgencia/Urgencia";
import Cronicas from "./cronicas/Cronicas";
import Notas from "./notas/Notas";
import Calculadoras from "./calculadoras/Calculadoras";
import FarmacosGravidez from "./farmacos-gravidez/FarmacosGravidez";
import metaGravidez from "@conteudo/farmacos-gravidez/meta.json";
import Interacoes from "./interacoes/Interacoes";
import metaInteracoes from "@conteudo/interacoes/meta.json";

export const MODULOS = [
  {
    id: "ajuste-renal",
    nome: metaRenal.nome,
    descricao: "Ajuste farmacológico na IR",
    accent: "#0f766e",
    bg: "#eefbf8",
    gradiente: "linear-gradient(135deg,#0f766e 0%,#115e59 50%,#134e4a 100%)",
    pronto: true,
    Componente: AjusteRenal,
  },
  {
    id: "atb-ambulatorio",
    nome: metaAtb.nome,
    descricao: "Antibioterapia empírica",
    accent: "#b45309",
    bg: "#fff8eb",
    gradiente: "linear-gradient(135deg,#b45309 0%,#92400e 60%,#7c2d12 100%)",
    pronto: true,
    Componente: AntibioterapiaAmbulatorio,
  },

  // ── Próximos módulos a portar (mesmo padrão) ─────────────────────────────
  {
    id: "urgencia",
    nome: "Urgência",
    descricao: "Sintomas e suspeitas por sistema",
    accent: "#e85d4a",
    bg: "#fff0ee",
    gradiente: "linear-gradient(135deg,#f08070 0%,#e85d4a 55%,#c2410c 100%)",
    pronto: true,
    Componente: Urgencia,
  },
  {
    id: "cronicas",
    nome: "Patologias",
    descricao: "Guias de estudo por patologia",
    accent: "#0b6e7f",
    bg: "#eef8fa",
    gradiente: "linear-gradient(135deg,#3DB5B5 0%,#0B6E7F 55%,#0A4D6B 100%)",
    pronto: true,
    Componente: Cronicas,
  },
  {
    id: "analises",
    nome: metaAnalises.nome,
    descricao: "Interpretação analítica",
    accent: "#8b5cf6",
    bg: "#f3eeff",
    gradiente: "linear-gradient(135deg,#8b5cf6 0%,#7c3aed 55%,#5b21b6 100%)",
    pronto: true,
    Componente: Analises,
  },
  {
    id: "calculadoras",
    nome: "Calculadoras",
    descricao: "Doses pediátricas de antibióticos",
    accent: "#0a8f6a",
    bg: "#e3f0ea",
    gradiente: "linear-gradient(135deg,#34b88a 0%,#0a8f6a 55%,#0a5e45 100%)",
    pronto: true,
    Componente: Calculadoras,
  },
  {
    id: "vacinacao",
    nome: "Vacinação",
    descricao: "PNV 2025 e viajante",
    accent: "#3DA89C",
    bg: "#ebf8f6",
    gradiente: "linear-gradient(135deg,#5BC4B8 0%,#3DA89C 55%,#2a8a7e 100%)",
    pronto: true,
    Componente: Vacinacao,
  },
  {
    id: "notas",
    nome: "Notas Clínicas",
    descricao: "Casos (só iniciais), notas e templates",
    accent: "#475569",
    bg: "#f1f5f9",
    gradiente: "linear-gradient(135deg,#64748b 0%,#475569 55%,#334155 100%)",
    pronto: true,
    Componente: Notas,
  },
  {
    id: "saude-infantil",
    nome: "Vig. Infantil",
    descricao: "PNSIJ, desenvolvimento e M-CHAT",
    accent: "#ec4899",
    bg: "#fff0f7",
    gradiente: "linear-gradient(135deg,#f472b6 0%,#ec4899 55%,#be185d 100%)",
    pronto: true,
    Componente: SaudeInfantil,
  },
  {
    id: "farmacos-gravidez",
    nome: metaGravidez.nome,
    descricao: "Fármacos contraindicados na gravidez",
    accent: "#7c3aed",
    bg: "#f3eeff",
    gradiente: "linear-gradient(135deg,#8b5cf6 0%,#7c3aed 55%,#4c1d95 100%)",
    pronto: true,
    Componente: FarmacosGravidez,
  },
  {
    id: "interacoes",
    nome: metaInteracoes.nome,
    descricao: "Interações e cuidados por população",
    accent: "#0e6b6b",
    bg: "#e9f4f3",
    gradiente: "linear-gradient(135deg,#149a92 0%,#0e6b6b 55%,#0a5151 100%)",
    pronto: true,
    Componente: Interacoes,
  },
];
