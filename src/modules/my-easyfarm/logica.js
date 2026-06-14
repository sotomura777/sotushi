// Lógica pura do My EasyFarm — sem dados embutidos. Recebe as notas (geridas pela
// UI via useEstadoLocal) como argumento. Porte das funções do HTML original
// (filtered, countsFor, buildExportData, generateWord/Excel).
import { normalizar } from "@/lib/texto";

// Paleta de cores das notas (config visual, não conteúdo clínico).
export const PALETTE = [
  "#1B5E8A", "#0F766E", "#65A30D", "#CA8A04", "#EA580C",
  "#DC2626", "#BE185D", "#7C3AED", "#0891B2", "#475569",
];

export const novoId = () => Math.random().toString(36).slice(2, 10);
export const splitCsv = (s) => (s || "").split(",").map((x) => x.trim()).filter(Boolean);

// Contagens de um campo, ordenadas por frequência (desc) e depois alfabética.
// campo csv (indication/classes) → isArray=false; campo array (tags) → isArray=true.
export function contagens(notes, campo, isArray = false) {
  const m = new Map();
  for (const n of notes) {
    const vals = isArray ? n[campo] || [] : splitCsv(n[campo]);
    for (const v of vals) m.set(v, (m.get(v) || 0) + 1);
  }
  return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

// Filtra por pesquisa livre + filtros (Sets) por indicação/classe/tag (AND em cada
// grupo). Devolve ordenado por 'updated' desc (mais recente primeiro).
export function filtrarNotas(notes, { query = "", indicacoes, classes, tags } = {}) {
  const q = normalizar(query).trim();
  const temInd = indicacoes && indicacoes.size;
  const temCls = classes && classes.size;
  const temTag = tags && tags.size;
  return notes
    .filter((n) => {
      if (temInd) { const s = new Set(splitCsv(n.indication)); for (const v of indicacoes) if (!s.has(v)) return false; }
      if (temCls) { const s = new Set(splitCsv(n.classes)); for (const v of classes) if (!s.has(v)) return false; }
      if (temTag) { const s = new Set(n.tags || []); for (const v of tags) if (!s.has(v)) return false; }
      if (!q) return true;
      const alvo = normalizar([n.name, n.brands, n.indication, n.classes, n.dose, n.clinical, ...(n.tags || [])].join(" "));
      return alvo.includes(q);
    })
    .sort((a, b) => b.updated - a.updated);
}

// ── EXPORTAÇÃO ───────────────────────────────────────────────────────────────
const escapeHtml = (s) =>
  (s || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// Estrutura tabular (cabeçalhos + linhas) consoante o detalhe (compact/full).
export function buildExportData(selecionadas, modo) {
  if (modo === "compact") {
    return {
      headers: ["Fármaco", "Indicações", "Esquema posológico"],
      rows: selecionadas.map((n) => [
        { v: n.name, color: n.color, bold: true },
        { v: n.indication || "—" },
        { v: n.dose || "—" },
      ]),
    };
  }
  return {
    headers: ["Fármaco", "Marcas", "Indicações", "Classes", "Esquema", "Nota clínica", "Tags"],
    rows: selecionadas.map((n) => [
      { v: n.name, color: n.color, bold: true },
      { v: n.brands || "—" },
      { v: n.indication || "—" },
      { v: n.classes || "—" },
      { v: n.dose || "—" },
      { v: n.clinical || "—" },
      { v: (n.tags || []).join(", ") || "—" },
    ]),
  };
}

const dataPt = (ms) =>
  new Date(ms).toLocaleDateString("pt-PT", { day: "2-digit", month: "long", year: "numeric" });

// HTML que o Word abre (namespaces Office) — guardado como .doc.
export function gerarWordHtml(selecionadas, modo, agoraMs) {
  const { headers, rows } = buildExportData(selecionadas, modo);
  const orient = modo === "full" ? "landscape" : "portrait";
  const cell = (c) =>
    `<td style="border:0.5pt solid #DDD; padding:6pt 8pt; vertical-align:top; font-size:10pt;${c.color ? ` color:${c.color};` : ""}${c.bold ? " font-weight:bold;" : ""}">${escapeHtml(c.v).replace(/\n/g, "<br>")}</td>`;
  const rowsHTML = rows.map((r, i) => `<tr style="background:${i % 2 ? "#F7F6F2" : "#FFFFFF"};">${r.map(cell).join("")}</tr>`).join("");
  const headerRow = headers.map((h) => `<th style="background:#1B5E8A; color:white; padding:7pt 8pt; border:0.5pt solid #1B5E8A; font-size:10pt; text-align:left;">${escapeHtml(h)}</th>`).join("");
  return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><title>My EasyFarm</title>
<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom><w:DoNotOptimizeForBrowser/></w:WordDocument></xml><![endif]-->
<style>
@page { size: A4 ${orient}; margin: 1.5cm; }
body { font-family: 'Calibri', sans-serif; color: #1a1a1a; font-size: 11pt; }
h1 { font-size: 18pt; margin: 0 0 4pt 0; color: #1B5E8A; }
.meta { font-size: 9pt; color: #888; margin-bottom: 14pt; }
table { border-collapse: collapse; width: 100%; }
</style></head>
<body>
  <h1>My EasyFarm</h1>
  <div class="meta">${selecionadas.length} ${selecionadas.length === 1 ? "fármaco" : "fármacos"} · ${dataPt(agoraMs)}</div>
  <table><thead><tr>${headerRow}</tr></thead><tbody>${rowsHTML}</tbody></table>
</body></html>`;
}

// HTML que o Excel abre (namespaces Office/Excel) — guardado como .xls.
export function gerarExcelHtml(selecionadas, modo, agoraMs) {
  const { headers, rows } = buildExportData(selecionadas, modo);
  const cell = (c) =>
    `<td style="border:0.5pt solid #DDD; padding:4pt 6pt; vertical-align:top; mso-number-format:'\\@';${c.color ? ` color:${c.color};` : ""}${c.bold ? " font-weight:bold;" : ""}">${escapeHtml(c.v).replace(/\n/g, '<br style="mso-data-placement:same-cell;">')}</td>`;
  const rowsHTML = rows.map((r, i) => `<tr style="background:${i % 2 ? "#F7F6F2" : "#FFFFFF"};">${r.map(cell).join("")}</tr>`).join("");
  const headerRow = headers.map((h) => `<th style="background:#1B5E8A; color:white; padding:6pt 8pt; border:0.5pt solid #1B5E8A; font-weight:bold; text-align:left;">${escapeHtml(h)}</th>`).join("");
  return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8">
<!--[if gte mso 9]><xml>
<x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>
<x:Name>Apontamentos</x:Name>
<x:WorksheetOptions><x:DisplayGridlines/><x:FreezePanes/><x:FrozenNoSplit/><x:SplitHorizontal>1</x:SplitHorizontal><x:TopRowBottomPane>1</x:TopRowBottomPane><x:ActivePane>2</x:ActivePane></x:WorksheetOptions>
</x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook>
</xml><![endif]-->
<style>
body { font-family: 'Calibri', sans-serif; font-size: 11pt; }
h1 { font-size: 16pt; color: #1B5E8A; margin: 0 0 4pt 0; }
.meta { font-size: 10pt; color: #888; margin-bottom: 10pt; }
table { border-collapse: collapse; }
td, th { mso-number-format:"\\@"; }
</style></head>
<body>
  <h1>My EasyFarm</h1>
  <div class="meta">${selecionadas.length} ${selecionadas.length === 1 ? "fármaco" : "fármacos"} · ${dataPt(agoraMs)}</div>
  <table><thead><tr>${headerRow}</tr></thead><tbody>${rowsHTML}</tbody></table>
</body></html>`;
}

// Descarrega um conteúdo como ficheiro (efeito — usado pela UI).
export function descarregar(content, filename, mime) {
  const blob = new Blob(["﻿", content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
