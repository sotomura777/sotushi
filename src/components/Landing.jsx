import { useState } from "react";
import { MODULOS } from "../modules/registo";
import IconeModulo from "./IconeModulo.jsx";
import LegalPagina from "./LegalPagina.jsx";
import "./landing.css";

// ============================================================================
// Landing / entrada — "porta" antes da app. Botão "Entrar" não está ligado a
// autenticação (modo de demonstração): só abre a app. A auth real (Supabase)
// entra na Fase 4. Inclui acesso a Política de Privacidade e Termos.
// ============================================================================

const DESTAQUES = ["sintomas", "easyfarm", "pna", "sinave", "interacoes", "ajuste-renal"];

export default function Landing({ dark, onEntrar }) {
  const [legal, setLegal] = useState(null); // null | 'privacidade' | 'termos'
  const destaques = DESTAQUES.map((id) => MODULOS.find((m) => m.id === id)).filter(Boolean);

  if (legal) return <LegalPagina tipo={legal} dark={dark} onVoltar={() => setLegal(null)} />;

  return (
    <div className={"lp" + (dark ? " dark" : "")}>
      <div className="lp-scroll">
        <main className="lp-card">
          <div className="lp-logo" aria-hidden="true">
            <svg viewBox="0 0 512 512">
              <rect x="214" y="118" width="84" height="276" rx="26" />
              <rect x="118" y="214" width="276" height="84" rx="26" />
            </svg>
          </div>
          <h1 className="lp-marca">AllinMed</h1>
          <p className="lp-tag">O teu guia de bolso de estudo clínico — sintomas, fármacos, scores e treino, num só sítio.</p>

          <button className="lp-entrar" onClick={onEntrar}>Entrar</button>
          <p className="lp-demo">Modo de demonstração · sem necessidade de conta</p>
          <p className="lp-mini">
            Ao entrar, aceitas os{" "}
            <button className="lp-link" onClick={() => setLegal("termos")}>Termos</button> e a{" "}
            <button className="lp-link" onClick={() => setLegal("privacidade")}>Política de Privacidade</button>.
          </p>
        </main>

        <section className="lp-features">
          <p className="lp-features-label">O que tens lá dentro</p>
          <div className="lp-grid">
            {destaques.map((m) => (
              <div key={m.id} className="lp-feat">
                <IconeModulo id={m.id} dark={dark} size="sm" />
                <span className="lp-feat-nome">{m.nome}</span>
              </div>
            ))}
          </div>
        </section>

        <p className="lp-disclaimer">
          Ferramenta de estudo e treino. Não é dispositivo médico e não substitui o julgamento clínico.
        </p>

        <footer className="lp-footer">
          <div className="lp-footer-links">
            <button className="lp-link" onClick={() => setLegal("privacidade")}>Política de Privacidade</button>
            <span className="lp-dot">·</span>
            <button className="lp-link" onClick={() => setLegal("termos")}>Termos de Utilização</button>
          </div>
          <div className="lp-copy">© 2026 AllinMed</div>
        </footer>
      </div>
    </div>
  );
}
