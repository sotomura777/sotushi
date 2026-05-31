import { useState } from "react";
import { MODULOS } from "./modules/registo";
import { I, ICONE_MODULO } from "./components/icones";
import { useEstadoLocal } from "./lib/persistencia";

const ABAS = [
  { id: "inicio", label: "Início", icon: I.home },
  { id: "procurar", label: "Procurar", icon: I.search },
  { id: "biblioteca", label: "Biblioteca", icon: I.library },
  { id: "criar", label: "Criar", icon: I.plus },
];

export default function App() {
  const [aba, setAba] = useState("inicio");
  const [dark, setDark] = useEstadoLocal("medguia:tema:dark", false);
  const [abertoId, setAbertoId] = useState(null);
  const [recentes, setRecentes] = useEstadoLocal("medguia:recentes", []);
  const [procura, setProcura] = useState("");

  // Cores literais (hex) para ícones SVG e estilos que dependem do tema.
  const tema = dark
    ? { tx: "#f0f2f5", tx2: "#8a92a6", sf2: "#222630", bd: "#2a2f3d", ac: "#2d8a4e" }
    : { tx: "#1c1917", tx2: "#78716c", sf2: "#eeeee8", bd: "#e2e0db", ac: "#2d8a4e" };

  const moduloAberto = abertoId ? MODULOS.find((m) => m.id === abertoId) : null;

  const abrir = (m) => {
    if (!m || !m.pronto) return;
    setAbertoId(m.id);
    setRecentes((r) => [m.id, ...r.filter((x) => x !== m.id)].slice(0, 4));
  };
  const fechar = () => setAbertoId(null);

  // Cartão de ferramenta (home e procura)
  function cartaoFerramenta(m, mostrarDesc) {
    const icone = ICONE_MODULO[m.id];
    return (
      <button
        key={m.id}
        className={"ferramenta" + (m.pronto ? "" : " ferramenta--embreve")}
        style={{ background: dark ? tema.sf2 : m.bg, border: `1px solid ${dark ? tema.bd : m.accent + "22"}` }}
        onClick={() => abrir(m)}
        disabled={!m.pronto}
      >
        {icone && icone(dark ? tema.tx : m.accent, 18)}
        <div>
          <div className="ferramenta-nome" style={{ color: dark ? tema.tx : m.accent }}>
            {m.nome}
          </div>
          {mostrarDesc && <div className="ferramenta-desc">{m.descricao}</div>}
          {!m.pronto && !mostrarDesc && <div className="embreve-tag">Em breve</div>}
        </div>
      </button>
    );
  }

  // ── INÍCIO ──
  function renderInicio() {
    return (
      <div className="aba">
        <div className="aba-cabecalho">
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div className="avatar">MG</div>
            <h1 className="aba-titulo">Início</h1>
          </div>
          <button className="toggle-tema" onClick={() => setDark((v) => !v)} aria-label="Alternar tema">
            {dark ? I.sun(tema.tx2, 16) : I.moon(tema.tx2, 16)}
          </button>
        </div>

        <div className="ferramentas">{MODULOS.map((m) => cartaoFerramenta(m, false))}</div>

        <button className="sugestao" onClick={() => abrir(MODULOS.find((m) => m.id === "atb-ambulatorio"))}>
          <div className="sugestao-eyebrow">SUGESTÃO</div>
          <div className="sugestao-titulo">Antibioterapia em Ambulatório</div>
          <div className="sugestao-desc">Prescrição empírica por especialidade e patologia — Ed. 1.3.</div>
        </button>

        <div className="secao-cabecalho">
          <h2 className="secao-titulo">Abertos recentemente</h2>
        </div>
        {recentes.length === 0 ? (
          <div className="vazio">Ainda não abriste nenhuma ferramenta.</div>
        ) : (
          recentes.map((id) => {
            const m = MODULOS.find((x) => x.id === id);
            if (!m) return null;
            const icone = ICONE_MODULO[m.id];
            return (
              <button key={id} className="recente" onClick={() => abrir(m)}>
                <div className="recente-icone" style={{ background: dark ? tema.sf2 : m.bg }}>
                  {icone && icone(dark ? tema.tx : m.accent, 16)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="recente-nome">{m.nome}</div>
                  <div className="recente-sub">{m.descricao}</div>
                </div>
                {I.clock(tema.tx2, 13)}
              </button>
            );
          })
        )}
      </div>
    );
  }

  // ── PROCURAR ──
  function renderProcurar() {
    const q = procura.toLowerCase().trim();
    const resultados = q
      ? MODULOS.filter((m) => m.nome.toLowerCase().includes(q) || m.descricao.toLowerCase().includes(q))
      : MODULOS;
    return (
      <div className="aba">
        <h1 className="aba-titulo" style={{ marginBottom: 12 }}>Procurar</h1>
        <div
          style={{
            display: "flex", alignItems: "center", gap: 7, padding: "0 12px", height: 42,
            borderRadius: "var(--raio-md)", background: "var(--superficie-2)", border: "1px solid var(--borda)", marginBottom: 14,
          }}
        >
          {I.search(tema.tx2, 17)}
          <input
            value={procura}
            onChange={(e) => setProcura(e.target.value)}
            placeholder="Pesquisar ferramentas, temas…"
            style={{ flex: 1, border: "none", outline: "none", background: "none", color: "var(--texto)", fontSize: 13.5, fontFamily: "var(--fonte-corpo)" }}
          />
        </div>
        <p className="secao-label">Ferramentas · {resultados.length}</p>
        <div className="ferramentas">{resultados.map((m) => cartaoFerramenta(m, true))}</div>
      </div>
    );
  }

  // ── BIBLIOTECA / CRIAR (Fase 3 — em breve) ──
  function renderEmBreve(titulo, msg) {
    return (
      <div className="aba">
        <h1 className="aba-titulo" style={{ marginBottom: 16 }}>{titulo}</h1>
        <div className="vazio" style={{ paddingTop: 48 }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>{I.construction(tema.tx2, 36)}</div>
          {msg}
        </div>
      </div>
    );
  }

  return (
    <div className={"app" + (dark ? " dark" : "")}>
      <div className="app-conteudo">
        {moduloAberto ? (
          <moduloAberto.Componente accent={moduloAberto.accent} gradiente={moduloAberto.gradiente} onVoltar={fechar} />
        ) : aba === "inicio" ? (
          renderInicio()
        ) : aba === "procurar" ? (
          renderProcurar()
        ) : aba === "biblioteca" ? (
          renderEmBreve("Biblioteca", "As tuas notas e cards de estudo chegam aqui em breve.")
        ) : (
          renderEmBreve("Criar", "Criar notas e cards de estudo chega em breve.")
        )}
      </div>

      <nav className="nav-inferior">
        {ABAS.map((tb) => {
          const ativo = !moduloAberto && aba === tb.id;
          return (
            <button
              key={tb.id}
              className={"nav-btn" + (ativo ? " ativo" : "")}
              onClick={() => { setAbertoId(null); setAba(tb.id); }}
            >
              {tb.icon(ativo ? tema.ac : tema.tx2, 21)}
              <span style={{ color: ativo ? tema.ac : tema.tx2 }}>{tb.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
