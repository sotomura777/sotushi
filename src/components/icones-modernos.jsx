// ============================================================================
// icones-modernos.jsx — conjunto de ícones redesenhado (estilo "moderno",
// duotone fill + traço). Módulo ES para Vite/React (JSX automático, sem
// precisar de importar React).
//
// Exporta:
//   ICONES_MODERNOS      mapa  nome -> (cor, tamanho) => <svg/>
//   ICONE_MODULO_MODERNO mapa  id-do-módulo -> glifo
//
// Categorias incluídas: módulos atuais + cardiologia, pneumologia, neurologia,
// oftalmologia, ORL, ortopedia, dentária, sangue, febre, infeções, genética,
// farmácia, dermatologia, nutrição, protocolos, favoritos, definições, perfil.
// ============================================================================

// ============================================================================
// MedGuia — conjunto de ícones "moderno" (duotone: preenchimento suave +
// traço). Cada ícone é fn(cor, tamanho). currentColor faz o duotone herdar a
// cor do contexto. Desenhados a 24×24, traço 1.7, cantos redondos.
// ============================================================================
const D = (c = "currentColor", s = 24, fill, stroke, extra) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    {fill && <path d={fill} fill={c} fillOpacity="0.16" stroke="none" />}
    {stroke}
    {extra}
  </svg>
);

const MI = {
  // Ajuste Renal — rim (feijão com hilo)
  kidney: (c, s) => D(c, s,
    "M14.6 4.1c2.4 1 4 3.5 3.9 6.2-.1 3.1-2.2 5.8-5 7.1-2 1-4.4.9-6.2-.3-2-1.3-3-3.7-2.5-6 .4-1.9 1.7-3.4 3.5-4.1 1-.4 2-.4 2.7-1.1.7-.7.9-1.8 1.8-2.2.6-.3 1.3-.2 1.8.4Z",
    <>
      <path d="M14.6 4.1c2.4 1 4 3.5 3.9 6.2-.1 3.1-2.2 5.8-5 7.1-2 1-4.4.9-6.2-.3-2-1.3-3-3.7-2.5-6 .4-1.9 1.7-3.4 3.5-4.1 1-.4 2-.4 2.7-1.1.7-.7.9-1.8 1.8-2.2.6-.3 1.3-.2 1.8.4Z" />
      <path d="M11.2 8.6c1 .3 1.6 1.1 1.7 2.2" stroke={c} fill="none" />
    </>),

  // Antibioterapia — cápsula
  pill: (c, s) => D(c, s,
    "M10.5 1.8 3.2 9.1a5.4 5.4 0 0 0 7.6 7.6l7.3-7.3a5.4 5.4 0 0 0-7.6-7.6Z",
    <>
      <path d="M10.5 1.8 3.2 9.1a5.4 5.4 0 0 0 7.6 7.6l7.3-7.3a5.4 5.4 0 0 0-7.6-7.6Z" />
      <path d="M7 11.3 12.7 17" />
    </>),

  // Urgência — raio
  bolt: (c, s) => D(c, s,
    "M13 2 4 13h6l-1 9 9-12h-6l1-8Z",
    <path d="M13 2 4 13h6l-1 9 9-12h-6l1-8Z" />),

  // P. Crónicas — coração + pulso
  heart: (c, s) => D(c, s,
    "M12 20.5 4.3 12.8a4.7 4.7 0 0 1 6.6-6.7l1.1 1 1.1-1a4.7 4.7 0 0 1 6.6 6.7Z",
    <>
      <path d="M12 20.5 4.3 12.8a4.7 4.7 0 0 1 6.6-6.7l1.1 1 1.1-1a4.7 4.7 0 0 1 6.6 6.7Z" />
      <path d="M3.5 13h4l1.5-3 2 5 1.5-2h3.5" stroke={c} fill="none" />
    </>),

  // Análises — balão / frasco de ensaio
  flask: (c, s) => D(c, s,
    "M9 3.5h6V8c0 .5.2 1 .6 1.4l4.4 4.4c1.5 1.5.4 4.2-1.7 4.2H5.7c-2.1 0-3.2-2.7-1.7-4.2L8.4 9.4C8.8 9 9 8.5 9 8V3.5Z",
    <>
      <path d="M9 3.5h6V8c0 .5.2 1 .6 1.4l4.4 4.4c1.5 1.5.4 4.2-1.7 4.2H5.7c-2.1 0-3.2-2.7-1.7-4.2L8.4 9.4C8.8 9 9 8.5 9 8V3.5Z" />
      <path d="M8 3.5h8" />
      <path d="M6.5 14.5h11" stroke={c} />
    </>),

  // Calculadoras — calculadora
  calc: (c, s) => D(c, s,
    "M6 2.5h12a1.5 1.5 0 0 1 1.5 1.5v16a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 20V4A1.5 1.5 0 0 1 6 2.5Z",
    <>
      <rect x="4.5" y="2.5" width="15" height="19" rx="2.4" />
      <rect x="7.5" y="5.5" width="9" height="3.2" rx="1" stroke={c} />
      <path d="M8 13h.01M12 13h.01M16 13h.01M8 17h.01M12 17h.01M16 17h.01" strokeWidth="2.2" />
    </>),

  // Vacinação — seringa
  syringe: (c, s) => D(c, s, null,
    <>
      <path d="m18 2 4 4" />
      <path d="m17.5 6.5 2-2" />
      <path d="M19 9 8.7 19.3a2.4 2.4 0 0 1-3.4 0l-.6-.6a2.4 2.4 0 0 1 0-3.4L15 5" />
      <path d="m9 11 4 4" />
      <path d="m13 7 4 4" />
      <path d="m5.5 18.5-2.5 2.5" />
    </>),

  // Vacinação (alternativa) — escudo + check
  shield: (c, s) => D(c, s,
    "M12 21.5c4.5-2 7.5-5.2 7.5-9.5V5.2L12 2.5 4.5 5.2V12c0 4.3 3 7.5 7.5 9.5Z",
    <>
      <path d="M12 21.5c4.5-2 7.5-5.2 7.5-9.5V5.2L12 2.5 4.5 5.2V12c0 4.3 3 7.5 7.5 9.5Z" />
      <path d="m8.8 12 2.2 2.2 4.2-4.4" stroke={c} strokeWidth="1.9" />
    </>),

  // Notas — prancheta
  clipboard: (c, s) => D(c, s,
    "M8 4.5h8a2 2 0 0 1 2 2V20a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6.5a2 2 0 0 1 2-2Z",
    <>
      <path d="M9 4.5h6V20a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6.5a2 2 0 0 1 2-2h1Z" fill="none" />
      <path d="M16 4.5a2 2 0 0 1 2 2V20a2 2 0 0 1-2 2" fill="none" />
      <rect x="9" y="2.5" width="6" height="4" rx="1.3" stroke={c} fill="none" />
      <path d="M9.5 12h5M9.5 16h3" stroke={c} />
    </>),

  // Vig. Infantil — bebé
  baby: (c, s) => D(c, s,
    "M12 3.2a4.6 4.6 0 1 0 0 9.2 4.6 4.6 0 0 0 0-9.2Z",
    <>
      <circle cx="12" cy="7.8" r="4.6" />
      <path d="M9.8 7h.01M14.2 7h.01" strokeWidth="2" />
      <path d="M10 9.6c.6.6 1.4.6 2 .6s1.4 0 2-.6" />
      <path d="M4.5 21a7.5 7.5 0 0 1 15 0" />
    </>),

  // Farmacologia na Grávida — silhueta de grávida
  pregnant: (c, s) => D(c, s,
    "M14.8 11.4c1.9.5 3.2 2 3.2 3.9 0 2.1-1.7 3.7-4.2 3.7H12V21",
    <>
      <circle cx="12.5" cy="4.4" r="2.2" />
      <path d="M12.5 7v4.2" />
      <path d="M12.5 11.2c2.6 0 4.4 1.6 4.4 3.9s-1.8 3.6-4.4 3.6" fill={c} fillOpacity="0.16" />
      <path d="M12.5 11.2v10" />
      <path d="M9.6 13.4c-.7 1.9-.6 3.8.5 5.6" stroke={c} fill="none" />
    </>),

  // ---- nav ----
  home: (c, s) => D(c, s,
    "M4 10.5 12 3l8 7.5V20a1.5 1.5 0 0 1-1.5 1.5H5.5A1.5 1.5 0 0 1 4 20Z",
    <>
      <path d="M3.5 11 12 3.2 20.5 11" />
      <path d="M5.5 9.8V20a1.2 1.2 0 0 0 1.2 1.2h10.6A1.2 1.2 0 0 0 18.5 20V9.8" />
      <path d="M9.5 21.2v-5.5a1.2 1.2 0 0 1 1.2-1.2h2.6a1.2 1.2 0 0 1 1.2 1.2v5.5" stroke={c} fill="none" />
    </>),

  search: (c, s) => D(c, s,
    "M11 3.5a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 0 0-15Z",
    <>
      <circle cx="11" cy="11" r="7.5" />
      <path d="m21 21-4.3-4.3" strokeWidth="2" />
    </>),

  library: (c, s) => D(c, s, null,
    <>
      <rect x="3.5" y="3.5" width="7" height="9" rx="1.6" fill={c} fillOpacity="0.16" />
      <rect x="13.5" y="3.5" width="7" height="5" rx="1.6" />
      <rect x="13.5" y="11.5" width="7" height="9" rx="1.6" fill={c} fillOpacity="0.16" />
      <rect x="3.5" y="15.5" width="7" height="5" rx="1.6" />
    </>),

  plus: (c, s) => D(c, s, null,
    <>
      <circle cx="12" cy="12" r="9" fill={c} fillOpacity="0.16" />
      <path d="M12 8v8M8 12h8" strokeWidth="2" />
    </>),

  // Interações — cápsula + comprimido
  interacoes: (c, s) => D(c, s,
    "M14 7 7.5 13.5a4.6 4.6 0 1 0 6.5 6.5l6.5-6.5A4.6 4.6 0 1 0 14 7Z",
    <>
      <path d="M14 7 7.5 13.5a4.6 4.6 0 1 0 6.5 6.5l6.5-6.5A4.6 4.6 0 1 0 14 7Z" />
      <path d="M10.75 10.25l6.5 6.5" />
    </>,
    <>
      <circle cx="6.3" cy="5.8" r="3.3" fill={c} fillOpacity="0.16" stroke="none" />
      <circle cx="6.3" cy="5.8" r="3.3" />
    </>),
};

// Mapa por id de módulo (para a app)
const MI_MODULO = {
  "ajuste-renal": MI.kidney,
  "atb-ambulatorio": MI.pill,
  urgencia: MI.bolt,
  cronicas: MI.heart,
  analises: MI.flask,
  calculadoras: MI.calc,
  vacinacao: MI.syringe,
  notas: MI.clipboard,
  "saude-infantil": MI.baby,
  "farmacos-gravidez": MI.pregnant,
  interacoes: MI.interacoes,
};

// ============================================================================
// MedGuia — glifos EXTRA (mais categorias médicas). Estende window.MI.
// Mesmo estilo duotone (fill suave + traço), 24×24, traço 1.7, redondo.
// ============================================================================
const DX = (c, s, fill, inner) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    {fill && <path d={fill} fill={c} fillOpacity="0.16" stroke="none" />}
    {inner}
  </svg>
);

const EXTRA = {
  // Cardiologia — coração + ECG
  cardio: (c, s) => DX(c, s,
    "M12 20.5 4.3 12.8a4.7 4.7 0 0 1 6.6-6.7l1.1 1 1.1-1a4.7 4.7 0 0 1 6.6 6.7Z",
    <>
      <path d="M12 20.5 4.3 12.8a4.7 4.7 0 0 1 6.6-6.7l1.1 1 1.1-1a4.7 4.7 0 0 1 6.6 6.7Z" />
      <path d="M3.6 13h4l1.5-3 2 5 1.5-2h3.5" stroke={c} fill="none" />
    </>),

  // Pneumologia — pulmões
  lungs: (c, s) => DX(c, s,
    "M11 9.6V20c0 .9-1 1.4-1.8 1-1.7-.8-4.2-2.7-4.2-7 0-2.6 1.2-4 2.5-4.7.9-.5 2-.5 2.9-.3.4.1.6.5.6.9Zm2 0V20c0 .9 1 1.4 1.8 1 1.7-.8 4.2-2.7 4.2-7 0-2.6-1.2-4-2.5-4.7-.9-.5-2-.5-2.9-.3-.4.1-.6.5-.6.9Z",
    <>
      <path d="M11 9.6V20c0 .9-1 1.4-1.8 1-1.7-.8-4.2-2.7-4.2-7 0-2.6 1.2-4 2.5-4.7.9-.5 2-.5 2.9-.3.4.1.6.5.6.9Z" />
      <path d="M13 9.6V20c0 .9 1 1.4 1.8 1 1.7-.8 4.2-2.7 4.2-7 0-2.6-1.2-4-2.5-4.7-.9-.5-2-.5-2.9-.3-.4.1-.6.5-.6.9Z" />
      <path d="M12 9.6V5M9.5 5h5" stroke={c} fill="none" />
    </>),

  // Neurologia / Saúde mental — cérebro
  brain: (c, s) => DX(c, s,
    "M12 4c-2.2 0-4 1.4-4.3 3.4C6 7.7 5 8.9 5 10.4c0 1 .4 1.9 1.1 2.5C5.8 14.5 6.8 16 8.4 16c.5 1.2 1.9 2 3.6 2s3.1-.8 3.6-2c1.6 0 2.6-1.5 2.3-3.1.7-.6 1.1-1.5 1.1-2.5 0-1.5-1-2.7-2.7-3C16 5.4 14.2 4 12 4Z",
    <>
      <path d="M12 4c-2.2 0-4 1.4-4.3 3.4C6 7.7 5 8.9 5 10.4c0 1 .4 1.9 1.1 2.5C5.8 14.5 6.8 16 8.4 16c.5 1.2 1.9 2 3.6 2s3.1-.8 3.6-2c1.6 0 2.6-1.5 2.3-3.1.7-.6 1.1-1.5 1.1-2.5 0-1.5-1-2.7-2.7-3C16 5.4 14.2 4 12 4Z" />
      <path d="M12 4.5V18M9 8c1 .4 1 1.6 0 2M15 8c-1 .4-1 1.6 0 2" stroke={c} fill="none" />
    </>),

  // Oftalmologia — olho
  eye: (c, s) => DX(c, s,
    "M2.5 12C4.6 8.3 8 6.3 12 6.3s7.4 2 9.5 5.7c-2.1 3.7-5.5 5.7-9.5 5.7S4.6 15.7 2.5 12Z",
    <>
      <path d="M2.5 12C4.6 8.3 8 6.3 12 6.3s7.4 2 9.5 5.7c-2.1 3.7-5.5 5.7-9.5 5.7S4.6 15.7 2.5 12Z" />
      <circle cx="12" cy="12" r="3" stroke={c} fill="none" />
    </>),

  // ORL — ouvido
  ear: (c, s) => DX(c, s,
    "M9.5 21c-1.9 0-3-1.4-3-3.3 0-2.8.5-3.8-1-5.2C4 11.3 4 9.8 4.6 8.4 5.6 5.6 8.2 4 11.2 4.6c2.9.5 4.8 3 4.4 5.9-.3 1.9-1.8 2.6-3 3.2-1 .5-1.4 1.1-1.4 2 0 1.3-.8 2.3-1.9 2.3Z",
    <>
      <path d="M9.5 21c-1.9 0-3-1.4-3-3.3 0-2.8.5-3.8-1-5.2C4 11.3 4 9.8 4.6 8.4 5.6 5.6 8.2 4 11.2 4.6c2.9.5 4.8 3 4.4 5.9-.3 1.9-1.8 2.6-3 3.2-1 .5-1.4 1.1-1.4 2" />
      <path d="M11.5 8c1.2 0 2 1 1.8 2.2-.2 1-1 1.3-1.6 1.7" stroke={c} fill="none" />
    </>),

  // Ortopedia — osso
  bone: (c, s) => DX(c, s,
    "M7.5 6.2a2.1 2.1 0 1 1 3.4 2.4l3.5 3.5a2.1 2.1 0 1 1 2.4 3.4 2.1 2.1 0 1 1-2.4 3.4 2.1 2.1 0 1 1-3.4-2.4l-3.5-3.5A2.1 2.1 0 1 1 4.1 9.6a2.1 2.1 0 1 1 3.4-3.4Z",
    <path d="M7.5 6.2a2.1 2.1 0 1 1 3.4 2.4l3.5 3.5a2.1 2.1 0 1 1 2.4 3.4 2.1 2.1 0 1 1-2.4 3.4 2.1 2.1 0 1 1-3.4-2.4l-3.5-3.5A2.1 2.1 0 1 1 4.1 9.6a2.1 2.1 0 1 1 3.4-3.4Z" />),

  // Dentária — dente
  tooth: (c, s) => DX(c, s,
    "M8 3.2c-2 0-3.6 1.6-3.6 3.9 0 1.4.3 2.2.7 3.6.4 1.6.4 2.4.6 4.4.2 1.7.4 3.6 1.5 4.3.9.5 1.6-.5 1.8-1.7.2-1.2.3-2.5 1-2.5s.8 1.3 1 2.5c.2 1.2.9 2.2 1.8 1.7 1.1-.7 1.3-2.6 1.5-4.3.2-2 .2-2.8.6-4.4.4-1.4.7-2.2.7-3.6 0-2.3-1.6-3.9-3.6-3.9-1.1 0-1.6.6-2.5.6s-1.4-.6-2.5-.6Z",
    <path d="M8 3.2c-2 0-3.6 1.6-3.6 3.9 0 1.4.3 2.2.7 3.6.4 1.6.4 2.4.6 4.4.2 1.7.4 3.6 1.5 4.3.9.5 1.6-.5 1.8-1.7.2-1.2.3-2.5 1-2.5s.8 1.3 1 2.5c.2 1.2.9 2.2 1.8 1.7 1.1-.7 1.3-2.6 1.5-4.3.2-2 .2-2.8.6-4.4.4-1.4.7-2.2.7-3.6 0-2.3-1.6-3.9-3.6-3.9-1.1 0-1.6.6-2.5.6s-1.4-.6-2.5-.6Z" />),

  // Análises de sangue / Diabetes — gota
  droplet: (c, s) => DX(c, s,
    "M12 3.4c3 4 6 6.8 6 10.3A6 6 0 1 1 6 13.7c0-3.5 3-6.3 6-10.3Z",
    <>
      <path d="M12 3.4c3 4 6 6.8 6 10.3A6 6 0 1 1 6 13.7c0-3.5 3-6.3 6-10.3Z" />
      <path d="M9 14.5a3 3 0 0 0 2.2 2.8" stroke={c} fill="none" />
    </>),

  // Sintomas / Febre — termómetro
  thermo: (c, s) => DX(c, s,
    "M14 4.5a2 2 0 0 0-4 0v9.2a3.5 3.5 0 1 0 4 0Z",
    <>
      <path d="M14 4.5a2 2 0 0 0-4 0v9.2a3.5 3.5 0 1 0 4 0Z" />
      <path d="M12 8v8" stroke={c} fill="none" />
      <circle cx="12" cy="17" r="1.6" fill={c} stroke="none" />
    </>),

  // Infeções — vírus
  virus: (c, s) => DX(c, s,
    "M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10Z",
    <>
      <circle cx="12" cy="12" r="4.6" />
      <path d="M12 7.4V4M12 16.6V20M7.4 12H4M16.6 12H20M8.8 8.8 6.6 6.6M17.4 17.4l-2.2-2.2M8.8 15.2l-2.2 2.2M17.4 6.6l-2.2 2.2" stroke={c} fill="none" />
    </>),

  // Genética — DNA
  dna: (c, s) => DX(c, s, null,
    <>
      <path d="M8 3c0 5 8 4 8 9s-8 4-8 9" />
      <path d="M16 3c0 5-8 4-8 9s8 4 8 9" />
      <path d="M9.5 6h5M9.5 18h5M10.5 9h3M10.5 15h3" stroke={c} strokeWidth="1.4" />
    </>),

  // Farmácia — comprimidos
  pills: (c, s) => DX(c, s,
    "M4.2 9.6 9.6 4.2a3.3 3.3 0 0 1 4.7 4.7L8.9 14.3a3.3 3.3 0 0 1-4.7-4.7Z",
    <>
      <path d="M4.2 9.6 9.6 4.2a3.3 3.3 0 0 1 4.7 4.7L8.9 14.3a3.3 3.3 0 0 1-4.7-4.7Z" />
      <path d="M6.8 6.8 12 12" stroke={c} fill="none" />
      <circle cx="16.5" cy="16.5" r="4.3" />
      <path d="M13.5 16.5h6" stroke={c} fill="none" />
    </>),

  // Dermatologia / Feridas — penso
  bandage: (c, s) => DX(c, s,
    "M9.5 3.8 3.8 9.5a3.7 3.7 0 0 0 0 5.2l5.5 5.5a3.7 3.7 0 0 0 5.2 0l5.7-5.7a3.7 3.7 0 0 0 0-5.2l-5.5-5.5a3.7 3.7 0 0 0-5.2 0Z",
    <>
      <path d="M9.5 3.8 3.8 9.5a3.7 3.7 0 0 0 0 5.2l5.5 5.5a3.7 3.7 0 0 0 5.2 0l5.7-5.7a3.7 3.7 0 0 0 0-5.2l-5.5-5.5a3.7 3.7 0 0 0-5.2 0Z" />
      <path d="M9 9l6 6" stroke="none" />
      <path d="M10 12h.01M12 10h.01M12 14h.01M14 12h.01M12 12h.01" stroke={c} strokeWidth="2" />
    </>),

  // Nutrição / IMC — balança
  scale: (c, s) => DX(c, s,
    "M5.5 3.5h13a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2v-13a2 2 0 0 1 2-2Z",
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="3" />
      <path d="M8.5 8a5 5 0 0 1 7 0" stroke={c} fill="none" />
      <path d="M12 8.5 13.7 11" stroke={c} fill="none" />
    </>),

  // Protocolos / Guia — livro
  book: (c, s) => DX(c, s,
    "M6.5 3.5H17A1.5 1.5 0 0 1 18.5 5v14A1.5 1.5 0 0 1 17 20.5H6.5A1.5 1.5 0 0 1 5 19V5A1.5 1.5 0 0 1 6.5 3.5Z",
    <>
      <path d="M6.5 3.5H17A1.5 1.5 0 0 1 18.5 5v14A1.5 1.5 0 0 1 17 20.5H6.5A1.5 1.5 0 0 1 5 19V5A1.5 1.5 0 0 1 6.5 3.5Z" />
      <path d="M8.5 3.5V20.5M11 8h4.5" stroke={c} fill="none" />
    </>),

  // Favoritos — estrela
  star: (c, s) => DX(c, s,
    "M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9Z",
    <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9Z" />),

  // Definições — engrenagem
  gear: (c, s) => DX(c, s,
    "M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z",
    <>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 2.8v2.4M12 18.8v2.4M4.5 7.5l2 1.2M17.5 15.3l2 1.2M4.5 16.5l2-1.2M17.5 8.7l2-1.2" stroke={c} fill="none" />
    </>),

  // Perfil — pessoa
  user: (c, s) => DX(c, s,
    "M12 3.5a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z",
    <>
      <circle cx="12" cy="7.5" r="4" />
      <path d="M5 20.5a7 7 0 0 1 14 0" stroke={c} fill="none" />
    </>),
};

// glifos base (MI) + extra (EXTRA), num único mapa
export const ICONES_MODERNOS = Object.assign({}, MI, EXTRA);
export const ICONE_MODULO_MODERNO = MI_MODULO;
