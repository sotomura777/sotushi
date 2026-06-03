import { Ico } from "@/components/icones";

// Ferramenta de ESTUDO: ensina a ler percentis e remete para o Boletim de Saúde
// Infantil e Juvenil. Não reproduz os dados das curvas da OMS (uso comercial
// desses dados exige autorização da OMS) — as curvas oficiais estão no Boletim.
export default function Crescimento({ accent }) {
  const chips = [
    ["P3", "limite inferior"],
    ["P15", ""],
    ["P50", "mediana"],
    ["P85", ""],
    ["P97", "limite superior"],
  ];
  return (
    <div style={{ marginTop: 4 }}>
      <div className="si-alerta" style={{ borderColor: "var(--borda-2)", background: "var(--superficie-2)", color: "var(--suave)", fontSize: 12.5, lineHeight: 1.45, marginBottom: 14 }}>
        <Ico name="library" s={18} style={{ flexShrink: 0, marginTop: 1 }} />
        <span><strong style={{ color: "var(--texto)" }}>Como ler os percentis (estudo).</strong> As curvas de crescimento oficiais (OMS, adotadas em Portugal pela DGS) estão no <strong>Boletim de Saúde Infantil e Juvenil</strong> — é aí que se regista e marca cada criança.</span>
      </div>

      <a className="filtro" href="https://www.dgs.pt/pns-e-programas/programas-de-saude/saude-infantil-e-juvenil.aspx" target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 14, borderColor: accent, color: accent }}>
        <Ico name="search" s={13} /> Curvas oficiais — PNSIJ / DGS ↗
      </a>

      <div className="cartao" style={{ padding: 16, marginBottom: 12 }}>
        <div className="secao-label" style={{ color: accent }}>O que é um percentil</div>
        <p style={{ fontSize: 13, color: "var(--texto-2)", lineHeight: 1.6 }}>
          Um percentil compara a criança com 100 crianças saudáveis da mesma idade e sexo. Estar no <strong>P50</strong> é estar no meio; estar no <strong>P10</strong> significa que 90% são maiores e 10% menores. O que mais importa não é o número isolado, mas a <strong>tendência ao longo do tempo</strong>.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
          {chips.map(([p, t]) => (
            <span key={p} style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", padding: "5px 10px", borderRadius: 8, background: "var(--superficie-2)", border: "1px solid var(--borda)" }}>
              <strong style={{ fontSize: 13, color: "var(--texto)" }}>{p}</strong>
              {t && <span style={{ fontSize: 10, color: "var(--tenue)" }}>{t}</span>}
            </span>
          ))}
        </div>
      </div>

      <div className="cartao" style={{ padding: 16 }}>
        <div className="secao-label" style={{ color: "#dc2626" }}>Quando valorizar (para estudo)</div>
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "var(--texto-2)", lineHeight: 1.7 }}>
          <li>Valor <strong>abaixo do P3</strong> ou <strong>acima do P97</strong>.</li>
          <li><strong>Cruzamento de 2 ou mais linhas</strong> de percentil (descida ou subida) entre avaliações.</li>
          <li>Desproporção entre peso, comprimento/altura e perímetro cefálico.</li>
          <li>Perímetro cefálico fora do esperado (suspeita de macro ou microcefalia).</li>
        </ul>
      </div>

      <div className="rodape" style={{ marginTop: 12 }}>
        As curvas e os valores exatos consultam-se no <strong>Boletim de Saúde Infantil e Juvenil</strong> (curvas da OMS, adotadas pela DGS). Esta secção é de estudo e não substitui o registo no Boletim.
      </div>
    </div>
  );
}
