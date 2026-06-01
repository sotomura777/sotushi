import { useState, useMemo } from "react";
import meta from "@conteudo/farmacos-gravidez/meta.json";
import MEDICAMENTOS from "@conteudo/farmacos-gravidez/medicamentos.json";
import { categorias, estatisticas, filtrar, temAlternativaMatch } from "./logica";
import { normalizar } from "@/lib/texto";
import "./estilo.css";

// ── Configuração de cores (presentation pura) ──────────────────────────────
const RISCO = {
  critical: { label: "Contraindicado", color: "#DC2626", bg: "#FEF2F2", border: "#FECACA" },
  high: { label: "Alto Risco", color: "#D97706", bg: "#FFFBEB", border: "#FDE68A" },
  moderate: { label: "Precaução", color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE" },
};
const FDA = {
  A: { bg: "#DCFCE7", text: "#166534" },
  B: { bg: "#DCFCE7", text: "#166534" },
  C: { bg: "#FEF9C3", text: "#854D0E" },
  D: { bg: "#FED7AA", text: "#9A3412" },
  X: { bg: "#FEE2E2", text: "#991B1B" },
  "—": { bg: "#F3F4F6", text: "#374151" },
};
const TRIMESTRE = {
  "Contraindicado": "#DC2626",
  "Contraindicado*": "#DC2626",
  "Alto risco": "#DC2626",
  "Precaução extrema": "#EA580C",
  "Evitar": "#D97706",
  "Precaução": "#EAB308",
  "Seguro": "#16A34A",
};

const CATEGORIAS = categorias(MEDICAMENTOS);

// ── Sub-componentes ────────────────────────────────────────────────────────
function BadgeFda({ cat }) {
  const c = FDA[cat] || FDA["—"];
  return (
    <span className="fg-badge-fda" style={{ background: c.bg, color: c.text }}>
      {cat === "—" ? "N/A" : `Cat. ${cat}`}
    </span>
  );
}

function BadgeRisco({ nivel }) {
  const c = RISCO[nivel] || RISCO.high;
  return (
    <span className="fg-badge-risco" style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}` }}>
      {c.label}
    </span>
  );
}

function BarraTrimestres({ riscos }) {
  return (
    <div className="fg-trim">
      {riscos.map((r, i) => (
        <div key={i} className="fg-trim-cel">
          <div className="fg-trim-cab">{i + 1}.º Trim.</div>
          <div className="fg-trim-val" style={{ background: TRIMESTRE[r] || "#9CA3AF" }}>{r}</div>
        </div>
      ))}
    </div>
  );
}

function CardMedicamento({ med, expandido, onToggle, pesquisa }) {
  const risco = RISCO[med.riskLevel] || RISCO.high;
  const q = normalizar(pesquisa);
  const matchAlternativa = temAlternativaMatch(med, q);
  const aberto = expandido || matchAlternativa;

  return (
    <div
      className={"fg-card" + (aberto ? " aberto" : "")}
      onClick={onToggle}
      style={{ borderColor: aberto ? (matchAlternativa && !expandido ? "#22C55E55" : risco.color + "55") : undefined }}
    >
      {matchAlternativa && !expandido && (
        <div className="fg-card-banner">Presente como alternativa segura neste medicamento</div>
      )}

      <div className="fg-card-cab">
        <div className="fg-card-info">
          <div className="fg-card-linha1">
            <span className="fg-card-nome">{med.name}</span>
            <BadgeFda cat={med.fdaCategory} />
          </div>
          <div className="fg-card-ativo">{med.activeIngredient}</div>
          <div className="fg-card-marcas">
            <strong>Nomes comerciais:</strong> {med.brandNames.join(", ")}
          </div>
          <div className="fg-card-meta">
            <BadgeRisco nivel={med.riskLevel} />
            <span className="fg-cat-tag">{med.category}</span>
          </div>
        </div>
        <span className="fg-chevron">▾</span>
      </div>

      {aberto && (
        <div className="fg-corpo">
          <div className="fg-risco-box" style={{ background: risco.bg, borderLeft: `4px solid ${risco.color}` }}>
            <div className="fg-risco-label" style={{ color: risco.color }}>Risco na Gravidez</div>
            <div className="fg-risco-texto">{med.reason}</div>
          </div>

          <BarraTrimestres riscos={med.trimesterRisk} />

          <div className="fg-alts">
            <div className="fg-alts-titulo">Alternativas mais seguras</div>
            {med.alternatives.map((alt, i) => {
              const match = q && (normalizar(alt.name).includes(q) || normalizar(alt.safetyNote).includes(q));
              return (
                <div key={i} className={"fg-alt" + (match ? " match" : "")}>
                  <div className="fg-alt-cab">
                    <span className="fg-alt-nome">{alt.name}</span>
                    <BadgeFda cat={alt.fdaCategory} />
                    {match && <span className="fg-alt-seguro">SEGURO</span>}
                  </div>
                  <div className="fg-alt-nota">{alt.safetyNote}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function Painel({ titulo, aberto, onToggle, children }) {
  return (
    <div className={"fg-painel" + (aberto ? " aberto" : "")} onClick={onToggle}>
      <div className="fg-painel-cab">
        <span className="fg-painel-titulo">{titulo}</span>
        <span className="fg-painel-chevron">▾</span>
      </div>
      {aberto && <div className="fg-painel-corpo" onClick={(e) => e.stopPropagation()}>{children}</div>}
    </div>
  );
}

// ── Componente principal ───────────────────────────────────────────────────
export default function FarmacosGravidez({ accent = "#8b5cf6", gradiente, onVoltar }) {
  const [pesquisa, setPesquisa] = useState("");
  const [categoria, setCategoria] = useState("all");
  const [risco, setRisco] = useState("all");
  const [expandidoId, setExpandidoId] = useState(null);
  const [mostraFda, setMostraFda] = useState(false);
  const [mostraRecursos, setMostraRecursos] = useState(false);

  const filtrados = useMemo(
    () => filtrar(MEDICAMENTOS, { query: pesquisa, categoria, risco }),
    [pesquisa, categoria, risco]
  );
  const stats = useMemo(() => estatisticas(MEDICAMENTOS), []);

  return (
    <div style={{ "--acento": accent }}>
      <header className="hero" style={{ background: gradiente || accent }}>
        <div className="hero-conteudo">
          {onVoltar && (
            <button className="voltar" onClick={onVoltar}>← Início</button>
          )}
          <div className="secao-label" style={{ color: "var(--acento)", marginBottom: 2 }}>{meta.eyebrow}</div>
          <div className="hero-titulo">{meta.nome}</div>
          <div className="hero-subtitulo">{meta.tag}</div>
          <div className="fg-stats">
            {[
              [stats.total, "Medicamentos"],
              [stats.critical, "Contraindicados"],
              [stats.high, "Alto Risco"],
            ].map(([valor, rotulo], i) => (
              <div key={i} className="fg-stat">
                <div className="fg-stat-num">{valor}</div>
                <div className="fg-stat-label">{rotulo}</div>
              </div>
            ))}
          </div>
        </div>
      </header>

      <div className="modulo-corpo">
        <div className="fg-aviso"><strong>Aviso:</strong> {meta.aviso}</div>

        <div className="fg-atalhos">
          {meta.atalhos.map((a, i) => (
            <a key={i} className={"fg-atalho " + a.cor} href={a.url} target="_blank" rel="noopener noreferrer">{a.nome}</a>
          ))}
        </div>

        <input
          className="campo"
          type="text"
          placeholder="Nome genérico, comercial ou princípio ativo..."
          value={pesquisa}
          onChange={(e) => setPesquisa(e.target.value)}
        />
        <div className="fg-selects">
          <select className="fg-select" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
            <option value="all">Todas as categorias</option>
            {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="fg-select" value={risco} onChange={(e) => setRisco(e.target.value)}>
            <option value="all">Todos os riscos</option>
            <option value="critical">Contraindicado</option>
            <option value="high">Alto Risco</option>
            <option value="moderate">Precaução</option>
          </select>
        </div>

        <div className="fg-contagem">
          {filtrados.length} medicamento{filtrados.length !== 1 ? "s" : ""} encontrado{filtrados.length !== 1 ? "s" : ""}
        </div>

        {filtrados.length === 0 ? (
          <div className="fg-vazio">
            <div className="fg-vazio-titulo">Nenhum resultado</div>
            <div className="fg-vazio-sub">Tente por nome comercial (Brufen, Xanax, Voltaren...)</div>
          </div>
        ) : (
          filtrados.map((med) => (
            <CardMedicamento
              key={med.id}
              med={med}
              expandido={expandidoId === med.id}
              onToggle={() => setExpandidoId(expandidoId === med.id ? null : med.id)}
              pesquisa={pesquisa}
            />
          ))
        )}

        <Painel titulo="Categorias FDA" aberto={mostraFda} onToggle={() => setMostraFda((v) => !v)}>
          {meta.fdaDescricoes.map(({ cat, desc }) => (
            <div key={cat} className="fg-fda-linha">
              <BadgeFda cat={cat} />
              <span className="fg-fda-desc">{desc}</span>
            </div>
          ))}
          <div className="fg-fda-nota"><strong>Nota:</strong> {meta.fdaNota}</div>
        </Painel>

        <Painel titulo="Fontes e Recursos" aberto={mostraRecursos} onToggle={() => setMostraRecursos((v) => !v)}>
          {meta.recursos.map((r, i) => (
            <a key={i} className="fg-recurso" href={r.url} target="_blank" rel="noopener noreferrer">
              <div className="fg-recurso-nome">{r.nome}</div>
              <div className="fg-recurso-desc">{r.desc}</div>
            </a>
          ))}
        </Painel>

        <div className="rodape">{meta.rodape}</div>
      </div>
    </div>
  );
}
