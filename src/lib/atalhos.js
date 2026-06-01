import { useEffect, useRef } from "react";

// Atalhos numéricos (1..9) para saltar entre separadores de topo.
// aoEscolher(i) recebe o índice 0-based do separador. Não dispara quando se
// está a escrever num campo (input/textarea/select/contentEditable) nem com
// modificadores (Ctrl/Cmd/Alt), para não colidir com a digitação.
export function useAtalhosNumericos(total, aoEscolher, ativo = true) {
  const cb = useRef(aoEscolher);
  cb.current = aoEscolher;
  useEffect(() => {
    if (!ativo) return;
    const handler = (e) => {
      const t = e.target;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const k = e.key;
      if (k.length === 1 && k >= "1" && k <= "9") {
        const i = k.charCodeAt(0) - 49; // "1" → 0
        if (i < total) { e.preventDefault(); cb.current(i); }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [total, ativo]);
}
