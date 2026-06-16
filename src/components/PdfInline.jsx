import { useEffect, useRef, useState } from "react";
import { obterPdfBlob } from "@/lib/pdfs";

// ============================================================================
// PdfInline — renderiza um PDF (guardado no IndexedDB) desenhando as páginas em
// <canvas> com o pdf.js. Funciona em TODOS os browsers (o Safari/iOS mostra PDFs
// embebidos em branco). O pdf.js é pesado, por isso é carregado SÓ quando se
// abre um PDF (dynamic import) — não pesa no arranque da app.
// ============================================================================
let pdfjsPromise;
function carregarPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = (async () => {
      const pdfjs = await import("pdfjs-dist");
      const workerUrl = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
      pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
      return pdfjs;
    })();
  }
  return pdfjsPromise;
}

export default function PdfInline({ pdfId, escala = 1.5 }) {
  const ref = useRef(null);
  const [estado, setEstado] = useState("carregar"); // carregar | ok | erro

  useEffect(() => {
    let cancelado = false;
    (async () => {
      const [pdfjs, blob] = await Promise.all([carregarPdfjs(), obterPdfBlob(pdfId)]);
      if (cancelado) return;
      if (!blob) { setEstado("erro"); return; }
      const data = await blob.arrayBuffer();
      if (cancelado) return;
      const pdf = await pdfjs.getDocument({ data }).promise;
      const cont = ref.current;
      if (!cont || cancelado) return;
      cont.innerHTML = "";
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const largura = cont.clientWidth || 600;
      for (let n = 1; n <= pdf.numPages; n++) {
        if (cancelado) return;
        const page = await pdf.getPage(n);
        const base = page.getViewport({ scale: 1 });
        const vp = page.getViewport({ scale: Math.min(escala, largura / base.width) * dpr });
        const canvas = document.createElement("canvas");
        canvas.width = vp.width;
        canvas.height = vp.height;
        canvas.style.cssText = "width:100%;height:auto;display:block;margin:0 auto 8px;border-radius:6px;box-shadow:0 1px 6px rgba(0,0,0,.12)";
        cont.appendChild(canvas);
        await page.render({ canvasContext: canvas.getContext("2d"), viewport: vp }).promise;
      }
      if (!cancelado) setEstado("ok");
    })().catch((e) => { console.warn("[PdfInline]", e?.message); if (!cancelado) setEstado("erro"); });

    return () => { cancelado = true; };
  }, [pdfId, escala]);

  return (
    <div className="pdfinline">
      {estado === "carregar" && <div className="pdfinline-msg">A abrir resumo…</div>}
      {estado === "erro" && <div className="pdfinline-msg">Não foi possível abrir este PDF.</div>}
      <div ref={ref} className="pdfinline-paginas" />
    </div>
  );
}
