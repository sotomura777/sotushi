import { useState } from "react";
import fer from "@conteudo/saude-infantil/ferramentas.json";
import { Ico } from "@/components/icones";

// Banner de estudo partilhado pelas ferramentas deste ficheiro.
function BannerEstudo() {
  return (
    <div className="si-alerta" style={{ borderColor: "var(--borda-2)", background: "var(--superficie-2)", color: "var(--suave)", fontSize: 12.5, lineHeight: 1.45, marginBottom: 12 }}>
      <Ico name="library" s={18} style={{ flexShrink: 0, marginTop: 1, color: "var(--suave)" }} />
      <span><strong style={{ color: "var(--texto)" }}>Ferramenta de estudo / referência.</strong> Não substitui avaliação clínica nem se destina a decisões sobre doentes reais.</span>
    </div>
  );
}

// ---------------- Tensão Arterial ----------------
export function TensaoArterial({ accent }) {
  const [sexo, setSexo] = useState("M");
  const [idade, setIdade] = useState("");
  const [sis, setSis] = useState("");
  const [dia, setDia] = useState("");

  const i = parseInt(idade, 10), s = parseFloat(sis), d = parseFloat(dia);
  let r = null;
  if (!Number.isNaN(i) && !Number.isNaN(s) && !Number.isNaN(d)) {
    const ref = fer.ta[sexo][Math.max(1, Math.min(17, i))];
    if (ref) {
      const [p95s, p95d] = ref;
      const hta = s >= p95s || d >= p95d;
      r = { hta, p95s, p95d };
    }
  }

  return (
    <div>
      <BannerEstudo />
      <div className="an-sexo" style={{ marginBottom: 10 }}>
        <button className={sexo === "M" ? "on" : ""} onClick={() => setSexo("M")}><Ico name="male" s={14} style={{ marginRight: 5 }} />Masculino</button>
        <button className={sexo === "F" ? "on" : ""} onClick={() => setSexo("F")}><Ico name="female" s={14} style={{ marginRight: 5 }} />Feminino</button>
      </div>
      <div className="cr-inputs">
        <label>Idade (anos)<input type="number" className="campo" value={idade} onChange={(e) => setIdade(e.target.value)} placeholder="1–17" /></label>
        <label>TA sistólica<input type="number" className="campo" value={sis} onChange={(e) => setSis(e.target.value)} placeholder="mmHg" /></label>
        <label>TA diastólica<input type="number" className="campo" value={dia} onChange={(e) => setDia(e.target.value)} placeholder="mmHg" /></label>
      </div>

      {r && (
        <div className="cartao" style={{ padding: 14, marginTop: 12, borderLeft: `4px solid ${r.hta ? "#dc2626" : "#059669"}` }}>
          {!r.hta ? (
            <>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "#059669" }}>Tensão arterial normal</div>
              <div style={{ fontSize: 13, color: "var(--texto)", marginTop: 6 }}>TAS {s} mmHg (P95: {r.p95s}) — normal<br />TAD {d} mmHg (P95: {r.p95d}) — normal</div>
              <div style={{ fontSize: 12.5, color: "var(--suave)", marginTop: 6 }}>Continuar vigilância nas consultas de rotina.</div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "#dc2626" }}>Valores elevados — confirmar em mais 2 ocasiões</div>
              {s >= r.p95s && <div style={{ fontSize: 13, color: "#dc2626", marginTop: 6 }}>TAS {s} mmHg — acima do P95 ({r.p95s}) para {i} anos</div>}
              {d >= r.p95d && <div style={{ fontSize: 13, color: "#dc2626", marginTop: 2 }}>TAD {d} mmHg — acima do P95 ({r.p95d}) para {i} anos</div>}
              <div style={{ fontSize: 12.5, color: "var(--texto)", marginTop: 8 }}><strong>Conduta esperada (para estudo):</strong> confirmar em mais 2 ocasiões separadas. Se persistir: referenciação programada a Pediatria (investigação de HTA secundária).</div>
              <div style={{ fontSize: 12, color: "var(--suave)", marginTop: 4 }}>Verificar: manguito adequado (2/3 do braço), criança em repouso, membro ao nível do coração.</div>
            </>
          )}
        </div>
      )}
      {!r && <div style={{ textAlign: "center", color: "var(--tenue)", padding: 20, fontSize: 13 }}>Preenche idade, sexo e as tensões.</div>}
    </div>
  );
}

function Bloco({ titulo, children, cor }) {
  return (
    <div className="cartao" style={{ padding: 14, marginBottom: 10 }}>
      <div className="secao-label" style={cor ? { color: cor } : undefined}>{titulo}</div>
      {children}
    </div>
  );
}
function Linhas({ itens }) {
  return <div style={{ fontSize: 13, color: "var(--texto-2)", lineHeight: 1.7 }}>{itens.map((l, i) => <div key={i}>{l}</div>)}</div>;
}

// ---------------- Snellen ----------------
export function Snellen() {
  const s = fer.snellen;
  return (
    <div>
      <BannerEstudo />
      <Bloco titulo="Acuidade visual normal por idade">
        <div style={{ fontSize: 13 }}>
          {s.acuidade.map(([idade, v], i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}><span>{idade}</span><strong>{v}</strong></div>
          ))}
        </div>
      </Bloco>
      <Bloco titulo="Quando se referenciaria a Oftalmologia" cor="#dc2626"><Linhas itens={s.referenciar} /></Bloco>
      <Bloco titulo="Tabela E de Snellen — por faixa etária"><Linhas itens={s.metodo} /></Bloco>
    </div>
  );
}

// ---------------- Flúor ----------------
export function Fluor() {
  const f = fer.fluor;
  return (
    <div>
      <BannerEstudo />
      <Bloco titulo="Flúor tópico por idade"><Linhas itens={f.topico} /></Bloco>
      <Bloco titulo="Cheque-dentista PNPSO"><Linhas itens={f.cheques} /></Bloco>
      <Bloco titulo="Dentição — cronograma"><Linhas itens={f.denticao} /></Bloco>
      <Bloco titulo="Alto risco de cárie" cor="#dc2626"><Linhas itens={f.altoRisco} /></Bloco>
    </div>
  );
}

// ---------------- Quando referenciar ----------------
export function Referenciar() {
  return (
    <div>
      <BannerEstudo />
      {fer.referenciar.map((c, i) => (
        <div key={i} className="cartao" style={{ padding: 14, marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, fontWeight: 700, color: c.cor, fontSize: 13.5, marginBottom: 6 }}>
            <span style={{ width: 9, height: 9, borderRadius: "50%", background: c.cor }} />{c.esp}
          </div>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: "var(--texto-2)", lineHeight: 1.6 }}>
            {c.crit.map((t, j) => <li key={j}>{t}</li>)}
          </ul>
        </div>
      ))}
      <div className="rodape"><strong><Ico name="warn" s={13} style={{ marginRight: 4 }} />Aviso:</strong> {fer.disclaimer}</div>
    </div>
  );
}
