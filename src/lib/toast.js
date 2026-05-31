import { useEffect, useState } from "react";

// Mini sistema de notificações transitórias ("toast"), sem dependências.
// Qualquer componente chama toast("mensagem"); o <Toaster/> (montado uma vez
// no App) mostra-as no fundo do ecrã durante uns segundos.
let ouvintes = [];
let seq = 0;

export function toast(msg) {
  const item = { id: ++seq, msg };
  ouvintes.forEach((fn) => fn(item));
}

export function useToaster() {
  const [itens, setItens] = useState([]);
  useEffect(() => {
    const fn = (item) => {
      setItens((s) => [...s, item]);
      setTimeout(() => setItens((s) => s.filter((x) => x.id !== item.id)), 2600);
    };
    ouvintes.push(fn);
    return () => { ouvintes = ouvintes.filter((x) => x !== fn); };
  }, []);
  return itens;
}

// Fecha algo com a tecla Escape (usado nos modais).
export function useEscape(onClose) {
  useEffect(() => {
    if (!onClose) return undefined;
    const h = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
}
