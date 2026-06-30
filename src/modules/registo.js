// ============================================================================
// REGISTO DE MÓDULOS
// Único sítio onde um módulo é "ligado" à app. A identidade visual (accent,
// gradiente, bg do cartão) vive aqui; o ícone vem de components/icones.jsx
// (mapa ICONE_MODULO por id). O conteúdo clínico vive em /conteudo.
// ============================================================================

import AjusteRenal from "./ajuste-renal/AjusteRenal";
import metaRenal from "@conteudo/ajuste-renal/meta.json";
import Analises from "./analises/Analises";
import metaAnalises from "@conteudo/analises/meta.json";
import Vacinacao from "./vacinacao/Vacinacao";
import SaudeInfantil from "./saude-infantil/SaudeInfantil";
import Notas from "./notas/Notas";
import FarmacosGravidez from "./farmacos-gravidez/FarmacosGravidez";
import metaGravidez from "@conteudo/farmacos-gravidez/meta.json";
import Interacoes from "./interacoes/Interacoes";
import metaInteracoes from "@conteudo/interacoes/meta.json";
import InfetoAcessoAdulto from "./infetoacesso/InfetoAcessoAdulto";
import InfetoAcessoPed from "./infetoacesso/InfetoAcessoPed";
import Sintomas from "./sintomas/Sintomas";
import metaSintomas from "@conteudo/sintomas/meta.json";
import Sinave from "./sinave/Sinave";
import EasyFarm from "./easyfarm/EasyFarm";
import MyEasyFarm from "./my-easyfarm/MyEasyFarm";
import PNA from "./pna/PNA";
import metaPNA from "@conteudo/pna/meta.json";

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
  {
    id: "infetoacesso",
    nome: "InfetAcess",
    descricao: "Antibioterapia em ambulatório (adulto)",
    accent: "#b45309",
    bg: "#fff8eb",
    gradiente: "linear-gradient(135deg,#c2762a 0%,#b45309 55%,#8a3f08 100%)",
    pronto: true,
    Componente: InfetoAcessoAdulto,
  },
  {
    id: "infetoacesso-ped",
    nome: "InfetAcess Ped",
    descricao: "Antibioterapia em ambulatório (pediatria)",
    accent: "#C4756B",
    bg: "#fbeeec",
    gradiente: "linear-gradient(135deg,#d18a80 0%,#C4756B 55%,#9c574e 100%)",
    pronto: true,
    Componente: InfetoAcessoPed,
  },
  {
    id: "sintomas",
    nome: metaSintomas.nome,
    descricao: "Abordagem por sintoma · 5 dimensões",
    accent: "#1e3a36",
    bg: "#eaf1ef",
    gradiente: "linear-gradient(135deg,#2d5552 0%,#1e3a36 55%,#13231f 100%)",
    pronto: true,
    Componente: Sintomas,
  },
  {
    id: "sinave",
    nome: "Sinave",
    descricao: "Doenças de notificação obrigatória",
    accent: "#8c2f39",
    bg: "#fbecec",
    gradiente: "linear-gradient(135deg,#a8434d 0%,#8c2f39 55%,#5e1d25 100%)",
    pronto: true,
    Componente: Sinave,
  },
  {
    id: "easyfarm",
    nome: "EasyFarm",
    descricao: "Guia de fármacos · fichas completas",
    accent: "#1B5E8A",
    bg: "#eef5fb",
    gradiente: "linear-gradient(135deg,#2E7CB5 0%,#1B5E8A 55%,#134866 100%)",
    pronto: true,
    Componente: EasyFarm,
  },
  {
    id: "my-easyfarm",
    nome: "My EasyFarm",
    descricao: "A tua biblioteca pessoal de doses e esquemas",
    accent: "#0F766E",
    bg: "#eafaf5",
    gradiente: "linear-gradient(135deg,#15998c 0%,#0F766E 55%,#0a544e 100%)",
    pronto: true,
    Componente: MyEasyFarm,
  },
  {
    id: "pna",
    nome: metaPNA.nome,
    descricao: metaPNA.descricao_curta,
    accent: "#639922",
    bg: "#eef6e3",
    gradiente: "linear-gradient(135deg,#7BB52E 0%,#639922 55%,#3B6D11 100%)",
    pronto: true,
    Componente: PNA,
  },
];
