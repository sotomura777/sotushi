// ============================================================================
// CalculadoraPopup.jsx
// Botão-ícone fixo (Liquid Glass) que acompanha o módulo e abre uma janela
// com a calculadora de doses pediátricas.
//
// Reutiliza o teu componente <Calculadoras/> que JÁ EXISTE — não duplica
// lógica nem dados. Esconde o hero dele por CSS (.cp-embed .hero).
//
// COLOCAÇÃO: guarda este ficheiro em src/modules/antibioterapia/
// (fica ao lado de AntibioterapiaAmbulatorio.jsx). Ver INTEGRAR-CALCULADORA.md
// ============================================================================
import { useState } from "react";
import Calculadoras from "../calculadoras/Calculadoras.jsx";
import { I } from "@/components/icones";
import "./calculadora-popup.css";

export default function CalculadoraPopup() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className="calc-fab" onClick={() => setOpen(true)} aria-label="Calculadora de doses pediátricas">
        <span className="ic">{I.calc("#fff", 24)}</span>
        <span className="tx">
          <b>Doses</b>
          <small>pediátricas</small>
        </span>
      </button>

      <div className={"cp-back" + (open ? " open" : "")} onClick={() => setOpen(false)}>
        <div className="cp" onClick={(e) => e.stopPropagation()}>
          <div className="cp-head">
            <div style={{ display: "flex", gap: 11 }}>
              <span className="cp-ic">{I.calc("#fff", 22)}</span>
              <div>
                <div className="cp-eyebrow">Calculadora</div>
                <div className="cp-title">Doses Pediátricas</div>
              </div>
            </div>
            <button className="cp-x" onClick={() => setOpen(false)} aria-label="Fechar">×</button>
          </div>

          {/* embute o componente real; só montado quando aberto */}
          {open && (
            <div className="cp-embed">
              <Calculadoras accent="#8b5cf6" onVoltar={() => setOpen(false)} />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
