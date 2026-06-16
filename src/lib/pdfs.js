// ============================================================================
// pdfs.js — armazenamento dos PDFs dos "cards de resumo" no IndexedDB (Dexie).
// O localStorage (onde vivem os cards) é pequeno e não aguenta ficheiros; por
// isso o PDF (binário) fica aqui, e o card guarda só uma referência (id + nome).
// Sincronização cloud cifrada chega depois (Fase 3) — a forma mantém-se.
// ============================================================================
import Dexie from "dexie";

const db = new Dexie("medguia_biblioteca");
db.version(1).stores({ pdfs: "id" }); // { id, blob, nome, tamanho, criadoEm }

export function uidPdf() {
  return "pdf" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// Guarda um ficheiro (File/Blob) e devolve a referência leve para o card.
export async function guardarPdf(file) {
  const id = uidPdf();
  await db.pdfs.put({ id, blob: file, nome: file.name, tamanho: file.size, criadoEm: Date.now() });
  return { id, nome: file.name, tamanho: file.size };
}

export async function obterPdfUrl(id) {
  const reg = await db.pdfs.get(id);
  if (!reg) return null;
  return { url: URL.createObjectURL(reg.blob), nome: reg.nome, tamanho: reg.tamanho };
}

// devolve o blob cru (para renderizar com pdf.js — fiável em todos os browsers)
export async function obterPdfBlob(id) {
  const reg = await db.pdfs.get(id);
  return reg ? reg.blob : null;
}

export function apagarPdf(id) {
  return id ? db.pdfs.delete(id) : Promise.resolve();
}
