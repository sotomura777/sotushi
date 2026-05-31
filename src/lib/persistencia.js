import { useState, useEffect } from "react";

// useEstadoLocal — igual a useState, mas guarda o valor no armazenamento local
// do dispositivo (localStorage). Sobrevive a sair do módulo, refresh, fechar o
// browser e reiniciar o telemóvel. NÃO usa servidor nem conta — fica só neste
// dispositivo. Só desaparece se o utilizador limpar os "dados de sites" do
// browser (ou, no iOS, se o site não for usado ~7 dias sem estar no ecrã principal).
//
// A cloud com sincronização entre dispositivos chega na Fase 4 (precisa de contas).
export function useEstadoLocal(chave, inicial) {
  const [valor, setValor] = useState(() => {
    try {
      const guardado = localStorage.getItem(chave);
      return guardado != null ? JSON.parse(guardado) : inicial;
    } catch {
      return inicial;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(chave, JSON.stringify(valor));
    } catch {
      /* armazenamento indisponível/cheio — ignora silenciosamente */
    }
  }, [chave, valor]);

  return [valor, setValor];
}
