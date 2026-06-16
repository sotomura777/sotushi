import { useEffect, useState } from "react";
import { obterPdfUrl } from "@/lib/pdfs";
import PdfInline from "@/components/PdfInline";

// ============================================================================
// VisorPdf — overlay ("caixa à frente") para consultar um PDF guardado no
// IndexedDB. O conteúdo é desenhado pelo pdf.js (PdfInline), fiável em todos os
// browsers (o Safari mostra PDFs embebidos em branco). Os botões Abrir/Descarregar
// usam um URL do blob. Self-contido (estilos inline com variáveis do tema).
// ============================================================================
export default function VisorPdf({ pdfId, onClose }) {
  const [info, setInfo] = useState(null); // { url, nome }
  useEffect(() => {
    let url;
    obterPdfUrl(pdfId).then((r) => { if (r) { url = r.url; setInfo(r); } });
    return () => { if (url) URL.revokeObjectURL(url); };
  }, [pdfId]);

  const ov = { position: "fixed", inset: 0, zIndex: 400, background: "rgba(10,14,20,.72)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, backdropFilter: "blur(4px)" };
  const box = { width: "100%", maxWidth: 860, height: "90vh", background: "var(--superficie)", border: "1px solid var(--borda)", borderRadius: 14, overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "var(--sombra-md)" };
  const bar = { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "10px 12px", borderBottom: "1px solid var(--borda-2)" };
  const nome = { fontSize: 12.5, fontWeight: 600, color: "var(--texto)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" };
  const btn = { fontSize: 12, fontWeight: 600, padding: "6px 11px", borderRadius: 8, border: "1px solid var(--borda)", background: "var(--superficie-2)", color: "var(--texto-2)", cursor: "pointer", textDecoration: "none", fontFamily: "var(--fonte-corpo)" };
  const conteudo = { flex: 1, overflow: "auto", padding: 14, background: "var(--superficie-2)" };

  return (
    <div style={ov} onClick={onClose}>
      <div style={box} onClick={(e) => e.stopPropagation()}>
        <div style={bar}>
          <span style={nome}>{info?.nome || "A abrir…"}</span>
          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
            {info && <a style={btn} href={info.url} target="_blank" rel="noreferrer">Abrir noutra aba</a>}
            {info && <a style={btn} href={info.url} download={info.nome}>Descarregar</a>}
            <button style={btn} onClick={onClose}>Fechar</button>
          </div>
        </div>
        <div style={conteudo}>
          <PdfInline pdfId={pdfId} />
        </div>
      </div>
    </div>
  );
}
