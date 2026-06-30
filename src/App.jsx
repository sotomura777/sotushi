import { useState } from "react";
import { MODULOS } from "./modules/registo";
import { I } from "./components/icones";
import IconeModulo from "./components/IconeModulo.jsx";
import { useEstadoLocal } from "./lib/persistencia";
import { normalizar } from "./lib/texto";
import Toaster from "./components/Toaster.jsx";
import Landing from "./components/Landing.jsx";
import Biblioteca from "./modules/cards/Biblioteca.jsx";
import CriarCard from "./modules/cards/CriarCard.jsx";
import CARDS_EXEMPLO from "@conteudo/cards/exemplos.json";

const ABAS = [
  { id: "inicio", label: "Início", icon: I.home },
  { id: "procurar", label: "Procurar", icon: I.search },
  { id: "biblioteca", label: "Biblioteca", icon: I.library },
  { id: "criar", label: "Criar", icon: I.plus },
];

export default function App() {
  const [entrou, setEntrou] = useEstadoLocal("medguia:entrou", false);
  const [aba, setAba] = useEstadoLocal("medguia:nav:aba", "inicio");
  const [dark, setDark] = useEstadoLocal("medguia:tema:dark", false);
  const [abertoId, setAbertoId] = useEstadoLocal("medguia:nav:aberto", null);
  const [recentes, setRecentes] = useEstadoLocal("medguia:recentes", []);
  const [procura, setProcura] = useState("");
  const [cards, setCards] = useEstadoLocal("medguia:cards", CARDS_EXEMPLO);
  const [editCardId, setEditCardId] = useState(null);

  // Porta de entrada (landing). Login ainda não está ligado — só abre a app.
  if (!entrou) return <Landing dark={dark} onEntrar={() => setEntrou(true)} />;

  // Cores literais (hex) para ícones SVG e estilos que dependem do tema.
  const tema = dark
    ? { tx: "#f0f2f5", tx2: "#8a92a6", sf2: "#222630", bd: "#2a2f3d", ac: "#a78bfa" }
    : { tx: "#1c1917", tx2: "#78716c", sf2: "#eeeee8", bd: "#e2e0db", ac: "#8b5cf6" };

  const moduloAberto = abertoId ? MODULOS.find((m) => m.id === abertoId && m.Componente) : null;

  const abrir = (m) => {
    if (!m || !m.pronto) return;
    setAbertoId(m.id);
    setRecentes((r) => [m.id, ...r.filter((x) => x !== m.id)].slice(0, 4));
  };
  const fechar = () => setAbertoId(null);

  // Cartão de ferramenta (home e procura)
  function cartaoFerramenta(m, mostrarDesc) {
    return (
      <button
        key={m.id}
        className={"ferramenta" + (m.pronto ? "" : " ferramenta--embreve")}
        style={{ background: dark ? tema.sf2 : m.bg, border: `1px solid ${dark ? tema.bd : m.accent + "22"}` }}
        onClick={() => abrir(m)}
        disabled={!m.pronto}
      >
        <IconeModulo id={m.id} dark={dark} />
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
            <div className="avatar">Ai</div>
            <h1 className="aba-titulo">Início</h1>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              onClick={() => setEntrou(false)}
              title="Sair"
              style={{ background: "none", border: "none", cursor: "pointer", color: tema.tx2, fontSize: 12.5, fontWeight: 700, fontFamily: "var(--fonte-corpo)", padding: "6px 4px" }}
            >
              Sair
            </button>
            <button className="toggle-tema" onClick={() => setDark((v) => !v)} aria-label="Alternar tema">
              {dark ? I.sun(tema.tx2, 16) : I.moon(tema.tx2, 16)}
            </button>
          </div>
        </div>

        <div className="ferramentas">{MODULOS.map((m) => cartaoFerramenta(m, false))}</div>

        <button className="sugestao" onClick={() => abrir(MODULOS.find((m) => m.id === "interacoes"))}>
          <div className="sugestao-eyebrow">SUGESTÃO</div>
          <div className="sugestao-titulo">Estudo de Interações</div>
          <div className="sugestao-desc">Interações por classe e cuidados por população — 172 fármacos.</div>
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
            return (
              <button key={id} className="recente" onClick={() => abrir(m)}>
                <IconeModulo id={m.id} dark={dark} size="sm" />
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
    const q = normalizar(procura).trim();
    const resultados = q
      ? MODULOS.filter((m) => normalizar(m.nome).includes(q) || normalizar(m.descricao).includes(q))
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
          <Biblioteca cards={cards} setCards={setCards} accent={tema.ac} onEditar={(id) => { setEditCardId(id); setAbertoId(null); setAba("criar"); }} />
        ) : (
          <CriarCard key={editCardId ?? "novo"} cards={cards} setCards={setCards} editId={editCardId} accent={tema.ac} onDone={() => { setEditCardId(null); setAba("biblioteca"); }} />
        )}
      </div>

      <nav className="nav-inferior">
        {ABAS.map((tb) => {
          const ativo = !moduloAberto && aba === tb.id;
          return (
            <button
              key={tb.id}
              className={"nav-btn" + (ativo ? " ativo" : "")}
              onClick={() => { setAbertoId(null); setAba(tb.id); setEditCardId(null); }}
            >
              {tb.icon(ativo ? tema.ac : tema.tx2, 21)}
              <span style={{ color: ativo ? tema.ac : tema.tx2 }}>{tb.label}</span>
            </button>
          );
        })}
      </nav>

      <Toaster />
    </div>
  );
}
