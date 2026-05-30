// ============================================================================
// TRADUÇÃO EMOJI → SVG (camada de visualização)
//
// O conteúdo clínico em /conteudo usa emojis (ícones de item, marcas de
// gravidade, símbolos das matrizes de vacinação). NÃO se altera o conteúdo —
// aqui converte-se, no momento de mostrar, cada emoji para um ícone SVG
// equivalente, para a UI não ter emojis da Apple. Conteúdo fica intacto.
//
//  • EmojiIco  — componente: mostra um emoji isolado (it[0], esp.icon…) como SVG.
//  • limparEmojis — tira emojis de uma string de texto (a cor/lógica continua a
//                   ler o original; aqui só se limpa o que se MOSTRA).
//  • htmlComSvg — troca emojis dentro de HTML (tabelas de vacinação) por SVG.
// ============================================================================

// Marcas SVG (conteúdo interno do <svg>, viewBox 0 0 24 24). Stroke por defeito.
const GLYPHS = {
  // sinais / dados
  check: '<polyline points="20 6 9 17 4 12"/>',
  x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
  warn: '<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
  info: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="11" x2="12" y2="16"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
  star: '<polygon points="12 2 15.1 8.3 22 9.3 17 14.1 18.2 21 12 17.8 5.8 21 7 14.1 2 9.3 8.9 8.3 12 2"/>',
  sparkle: '<path d="M12 3 13.5 9 19.5 10.5 13.5 12 12 18 10.5 12 4.5 10.5 10.5 9z"/>',
  // anatomia / clínica
  eye: '<circle cx="12" cy="12" r="3"/><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/>',
  ear: '<path d="M6 8.5a6.5 6.5 0 0 1 13 0c0 6-6 6-6 10a3.5 3.5 0 0 1-7 0"/><path d="M9 9.5a3 3 0 0 1 5 2.5"/>',
  tooth: '<path d="M8 3C6 3 5 4.5 5 7c0 2 .8 3 1.2 6C6.6 16 6.8 21 8 21s1.3-4 1.8-6c.3-1.2.7-2 2.2-2s1.9.8 2.2 2c.5 2 .6 6 1.8 6s1.4-5 1.8-8C20.2 10 21 9 21 7c0-2.5-1-4-3-4-1.6 0-2.4 1-4 1S9.6 3 8 3z"/>',
  brain: '<path d="M9.5 4A2.5 2.5 0 0 0 7 6.5 2.5 2.5 0 0 0 5 11a2.5 2.5 0 0 0 1 4.5A2.5 2.5 0 0 0 9.5 20 2.5 2.5 0 0 0 12 17.5V6.5A2.5 2.5 0 0 0 9.5 4z"/><path d="M14.5 4A2.5 2.5 0 0 1 17 6.5 2.5 2.5 0 0 1 19 11a2.5 2.5 0 0 1-1 4.5A2.5 2.5 0 0 1 14.5 20 2.5 2.5 0 0 1 12 17.5"/>',
  heart: '<path d="M20.8 5.6a5 5 0 0 0-7.1 0L12 7.3l-1.7-1.7a5 5 0 1 0-7.1 7.1L12 21l8.8-8.3a5 5 0 0 0 0-7.1z"/>',
  lungs: '<path d="M12 4v9"/><path d="M8 8c-1.5 1-2.5 3-2.5 6 0 3.5 0 5.5-1.5 6.5 0 0-1-2.5-1-6.5 0-3.5 2-6 5-6z"/><path d="M16 8c1.5 1 2.5 3 2.5 6 0 3.5 0 5.5 1.5 6.5 0 0 1-2.5 1-6.5 0-3.5-2-6-5-6z"/>',
  droplet: '<path d="M12 2.7s6 5.7 6 10.3a6 6 0 0 1-12 0c0-4.6 6-10.3 6-10.3z"/>',
  steth: '<path d="M5 3v6a4 4 0 0 0 8 0V3"/><path d="M9 17a6 6 0 0 0 6 6 5 5 0 0 0 5-5v-3"/><circle cx="20" cy="11" r="2"/>',
  bandage: '<rect x="2.5" y="8.5" width="19" height="7" rx="3.5" transform="rotate(45 12 12)"/><line x1="10" y1="10" x2="10.01" y2="10"/><line x1="14" y1="14" x2="14.01" y2="14"/><line x1="12" y1="12" x2="12.01" y2="12"/>',
  pill: '<path d="M10.5 2.5 3 10a5.66 5.66 0 0 0 8 8l7.5-7.5a5.66 5.66 0 0 0-8-8z"/><line x1="7" y1="11" x2="13" y2="17"/>',
  syringe: '<path d="m18 2 4 4"/><path d="m17 7 3-3"/><path d="M19 9 8.7 19.3a2.41 2.41 0 0 1-3.4 0l-.6-.6a2.41 2.41 0 0 1 0-3.4L15 5"/><path d="m9 11 4 4"/><path d="m13 7 4 4"/>',
  flask: '<path d="M9 3h6v5.1c0 .5.2 1 .6 1.4l4.8 4.8c1.6 1.6.5 4.2-1.6 4.2H5.2c-2 0-3.1-2.6-1.6-4.2l4.8-4.8c.4-.4.6-.9.6-1.4V3z"/>',
  micro: '<path d="M6 18h8"/><path d="M3 22h18"/><path d="M14 22a7 7 0 0 0 0-14h-1"/><path d="M9 14h2"/><path d="M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2"/><path d="M12 6V3a1 1 0 0 0-1-1H9"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  staff: '<circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>',
  bloodbag: '<path d="M8 3h8v6a4 4 0 0 1-4 4 4 4 0 0 1-4-4z"/><path d="M12 13v5a3 3 0 0 0 3 3"/>',
  // pessoas
  baby: '<circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/>',
  child: '<circle cx="12" cy="5" r="2.5"/><path d="M12 7.5V15"/><path d="M8.5 11h7"/><path d="m9 21 3-5 3 5"/>',
  person: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  male: '<circle cx="10" cy="14" r="6"/><line x1="14.5" y1="9.5" x2="20" y2="4"/><polyline points="15 4 20 4 20 9"/>',
  female: '<circle cx="12" cy="8" r="6"/><line x1="12" y1="14" x2="12" y2="22"/><line x1="9" y1="18" x2="15" y2="18"/>',
  hand: '<path d="M8 12V6a1.5 1.5 0 0 1 3 0v5m0-1V4.5a1.5 1.5 0 0 1 3 0V11m0-.5V6.5a1.5 1.5 0 0 1 3 0V14a6 6 0 0 1-6 6 6 6 0 0 1-5-3l-2-3.5a1.5 1.5 0 0 1 2.6-1.5L8 13"/>',
  handshake: '<path d="m11 17 2.5 2.5a1.4 1.4 0 0 0 2-2L13 14"/><path d="m3 11 4-4 4 3 2-1"/><path d="m21 13-4-4-3 1"/><path d="m13 8 3 3"/>',
  speech: '<path d="M21 11.5a8.5 8.5 0 0 1-12.5 7.5L3 21l1.5-5.5A8.5 8.5 0 1 1 21 11.5z"/>',
  face: '<circle cx="12" cy="12" r="9"/><path d="M8.5 14a4 4 0 0 0 7 0"/><line x1="9" y1="9.5" x2="9.01" y2="9.5"/><line x1="15" y1="9.5" x2="15.01" y2="9.5"/>',
  strength: '<path d="M6.5 7v10M17.5 7v10"/><path d="M4 9.5v5M20 9.5v5"/><path d="M6.5 12h11"/>',
  activity: '<circle cx="13" cy="4.5" r="1.8"/><path d="m9 9 3-1 2 3 3 1"/><path d="m7 21 3-6 2-2"/><path d="m12 13 1 4"/>',
  // objetos / contexto
  bowl: '<path d="M3 11h18a8 8 0 0 1-8 8h-2a8 8 0 0 1-8-8z"/><path d="M8.5 11c0-2 1-3 1-4M12.5 11c0-2 1-3 1-4"/>',
  bottle: '<path d="M9 3h6"/><path d="M10 3v2.5a3 3 0 0 1-1 2.2A3 3 0 0 0 8 10v9a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-9a3 3 0 0 0-1-2.3 3 3 0 0 1-1-2.2V3"/><path d="M8 12h8"/>',
  book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19a2 2 0 0 1 2-2h13"/>',
  pencil: '<path d="M17 3l4 4L7 21H3v-4z"/><path d="m14 6 4 4"/>',
  ruler: '<path d="M3 16 16 3l5 5L8 21z"/><path d="m7 12 2 2M10 9l2 2M13 6l2 2"/>',
  scale: '<path d="M12 3v18"/><path d="M9 21h6"/><path d="M6 6h12"/><path d="M6 6 3 13a4 4 0 0 0 6 0L6 6z"/><path d="m18 6-3 7a4 4 0 0 0 6 0l-3-7z"/>',
  car: '<path d="M5 11 6.5 6.6A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11"/><path d="M5 11h14a2 2 0 0 1 2 2v4h-3"/><path d="M5 17H3v-4a2 2 0 0 1 2-2"/><circle cx="7.5" cy="17" r="1.5"/><circle cx="16.5" cy="17" r="1.5"/><path d="M9 17h6"/>',
  phone: '<rect x="7" y="2" width="10" height="20" rx="2"/><line x1="11" y1="18" x2="13" y2="18"/>',
  toilet: '<path d="M6 3h2v6H6z"/><path d="M5 9h7a5 5 0 0 1-3 5l1 7H6l-1-7a5 5 0 0 1-0-5z"/>',
  school: '<path d="M3 21V9l9-5 9 5v12"/><path d="M3 21h18"/><rect x="9.5" y="13" width="5" height="8"/><path d="M12 4.5V7"/>',
  bath: '<path d="M4 12V6a2 2 0 0 1 4 0v.5"/><path d="M3 12h18v3a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4z"/><path d="m6 19-1 2M18 19l1 2"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5.6 5.6 4.2 4.2M19.8 19.8l-1.4-1.4M18.4 5.6l1.4-1.4M4.2 19.8l1.4-1.4"/>',
  moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/>',
  chair: '<path d="M6 3v8h12V3"/><path d="m6 11-1 8M18 11l1 8"/><path d="M5 14h14"/>',
  puzzle: '<path d="M10 4a2 2 0 1 1 4 0h3v3a2 2 0 1 1 0 4v3h-3a2 2 0 1 0-4 0H7v-3a2 2 0 1 1 0-4V4z"/>',
  tv: '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="m8 3 4 3 4-3"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18z"/>',
  mosquito: '<circle cx="12" cy="14" r="2"/><path d="M12 12V8M10.5 6 12 8l1.5-2"/><path d="m12 14-7-3M12 14l7-3M12 16l-6 4M12 16l6 4"/>',
  sprout: '<path d="M12 21v-8"/><path d="M12 13c0-3-2-5-5-5 0 3 2 5 5 5z"/><path d="M12 11c0-2.5 2-4.5 5-4.5 0 2.5-2 4.5-5 4.5z"/>',
  smoking: '<rect x="3" y="13" width="13" height="4" rx="1"/><path d="M16 8c2 0 2-3 0-3"/><path d="M19 17v-2a2 2 0 0 0-2-2"/>',
  clip: '<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/>',
  chart: '<path d="M3 3v18h18"/><rect x="7" y="11" width="3" height="6"/><rect x="12" y="7" width="3" height="10"/><rect x="17" y="13" width="3" height="4"/>',
  search: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
  bolt: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
  clock: '<circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/>',
  home: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
  dot: '<circle cx="12" cy="12" r="3.5"/>',
};

// Emoji (forma base, sem seletor de variação) → nome da marca SVG.
const MAP = {
  // gravidade / sinais (vacinação + outros)
  "✓": "check", "✔": "check", "✅": "check",
  "✗": "x", "✘": "x", "❌": "x", "✕": "x", "❎": "x",
  "⚠": "warn", "ℹ": "info",
  "★": "star", "☆": "star", "✦": "sparkle", "✨": "sparkle",
  // vigilância infantil
  "⚖": "scale", "👁": "eye", "👀": "eye", "🗣": "speech", "😴": "moon",
  "🏃": "activity", "🚶": "activity", "🤸": "activity", "🦷": "tooth",
  "😊": "face", "😢": "face", "🎭": "face", "🤝": "handshake", "💊": "pill",
  "💪": "strength", "🚬": "smoking", "❤": "heart", "💙": "heart", "💚": "heart",
  "🛡": "shield", "🌱": "sprout", "👂": "ear", "👶": "baby", "👦": "child", "👧": "child",
  "🥣": "bowl", "🥛": "bowl", "🍽": "bowl", "✏": "pencil", "🧠": "brain",
  "💉": "syringe", "🍼": "bottle", "🤱": "bottle", "🚗": "car", "🤲": "hand",
  "🤏": "hand", "👆": "hand", "👍": "hand", "📵": "phone", "📱": "phone",
  "🚽": "toilet", "📖": "book", "📚": "book", "📘": "book", "📗": "book",
  "🏫": "school", "🧬": "flask", "📏": "ruler", "📐": "ruler", "🛁": "bath",
  "☀": "sun", "🪑": "chair", "🧩": "puzzle", "📺": "tv",
  // antibioterapia / análises / vacinação
  "🫁": "lungs", "🫀": "heart", "💧": "droplet", "🩺": "steth", "🩹": "bandage",
  "🔬": "micro", "🧪": "flask", "🩸": "droplet", "⏱": "clock", "⏲": "clock",
  "🏠": "home", "🌍": "globe", "🌎": "globe", "🌏": "globe", "🦟": "mosquito",
  "📊": "chart", "📈": "chart", "📋": "clip", "🔍": "search", "⚡": "bolt",
  "⚕": "staff", "👤": "person", "🤰": "person", "♀": "female", "♂": "male",
};

// Emojis de "bola colorida" → círculo cheio na cor.
const DOTS = {
  "🔵": "#3b82f6", "🟢": "#16a34a", "🟡": "#eab308", "🟠": "#f97316",
  "🔴": "#dc2626", "🟣": "#9333ea", "🟤": "#92400e", "⚫": "#334155", "⚪": "#cbd5e1",
};

// Cor própria de alguns sinais (resto herda a cor passada).
const COR_SINAL = { check: "#16a34a", x: "#dc2626", warn: "#d97706" };

// Apanha emojis (para limpar resíduos). NÃO apanha setas (←→) nem formas
// geométricas (▼▲◈) usadas como UI — só os intervalos pictográficos.
const EMOJI_RE = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{2300}-\u{23FF}\u{2122}\u{2139}\u{2640}\u{2642}\u{2695}-\u{2696}\u{26A0}-\u{26A1}\u{FE0F}\u{200D}\u{20E3}\u{1F3FB}-\u{1F3FF}]/gu;

const semVS = (s) => s.replace(/[️⃣]/g, "");

function svg(inner, c, s, fill) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 24 24" ` +
    `fill="${fill || "none"}" stroke="${fill ? "none" : c}" stroke-width="2" stroke-linecap="round" ` +
    `stroke-linejoin="round" style="display:inline-block;vertical-align:-0.15em">${inner}</svg>`;
}

// Componente React: um emoji isolado → SVG (com fallback neutro, nunca emoji).
export function EmojiIco({ e, c = "#475569", s = 16 }) {
  if (!e) return null;
  const base = semVS(e);
  if (DOTS[base]) return <span style={{ display: "inline-flex", verticalAlign: "-0.15em" }} dangerouslySetInnerHTML={{ __html: svg(GLYPHS.dot, DOTS[base], s, DOTS[base]) }} />;
  const name = MAP[base] || "dot";
  const cor = COR_SINAL[name] || c;
  const fill = name === "dot" ? cor : undefined;
  return <span style={{ display: "inline-flex", verticalAlign: "-0.15em" }} dangerouslySetInnerHTML={{ __html: svg(GLYPHS[name], cor, s, fill) }} />;
}

// Tira emojis de uma string de TEXTO (mantém o resto e o espaçamento à frente).
export function limparEmojis(texto) {
  if (typeof texto !== "string") return texto;
  return texto.replace(EMOJI_RE, "").replace(/^\s+/, "").replace(/\s{2,}/g, " ");
}

// Troca emojis dentro de HTML (tabelas de vacinação) por SVG; limpa resíduos.
// Processa SÓ o texto fora das tags — nunca toca em atributos (ex.: data-info),
// para não corromper o HTML.
export function htmlComSvg(html) {
  if (typeof html !== "string") return html;
  return html
    .split(/(<[^>]*>)/)
    .map((seg) => {
      if (!seg || seg[0] === "<") return seg; // é uma tag/atributos — não tocar
      let out = seg;
      for (const [emo, cor] of Object.entries(DOTS)) if (out.includes(emo)) out = out.split(emo).join(svg(GLYPHS.dot, cor, 14, cor));
      for (const [emo, name] of Object.entries(MAP)) if (out.includes(emo)) out = out.split(emo).join(svg(GLYPHS[name], COR_SINAL[name] || "#475569", 15));
      return out.replace(EMOJI_RE, "");
    })
    .join("");
}
