import { useState, useRef, useEffect, useMemo } from "react";
import viajante from "@conteudo/vacinacao/viajante.json";
import matrixHtml from "@conteudo/vacinacao/view-matrix.html?raw";
import childHtml from "@conteudo/vacinacao/view-child-pnv.html?raw";
import adultHtml from "@conteudo/vacinacao/view-adult-pnv.html?raw";
import extraHtml from "@conteudo/vacinacao/view-adult-extra.html?raw";
import specialHtml from "@conteudo/vacinacao/view-special-matrix.html?raw";
import travelHtml from "@conteudo/vacinacao/view-travel.html?raw";
import { htmlComSvg } from "@/components/emoji";
import { normalizar } from "@/lib/texto";
import "./estilo.css";

const VIEWS = [
  { id: "matrix", titulo: "Calendário — matriz", desc: "Visão geral por idade", html: matrixHtml },
  { id: "child", titulo: "PNV — Crianças", desc: "Do nascimento aos 13 anos", html: childHtml },
  { id: "adult", titulo: "PNV — Adultos", desc: "Reforços e esquemas de recurso", html: adultHtml },
  { id: "extra", titulo: "Situações especiais", desc: "Imunocomprometidos, grupos de risco", html: extraHtml },
  { id: "special", titulo: "Matriz — situações especiais", desc: "Tabela por condição clínica", html: specialHtml },
  { id: "travel", titulo: "Consulta do viajante", desc: "Vacinas e medidas por região", html: null },
];

const ORDEM_PRIO = { required: 0, essential: 1, recommended: 2, specific: 3 };
const ROTULO_PRIO = { required: "Obrigatória", essential: "Essencial", recommended: "Recomendada", specific: "Situações específicas" };

export default function Vacinacao({ accent = "#3DA89C", gradiente, onVoltar }) {
  const [vista, setVista] = useState(null); // null = home | id de vista | "travel"
  const [regiao, setRegiao] = useState(null);
  const [query, setQuery] = useState("");
  const [pop, setPop] = useState(null);
  const ref = useRef(null);
  const mapRef = useRef(null);
  const ativaIdade = useRef(null);

  const viewAtual = VIEWS.find((v) => v.id === vista);
  const htmlAtual = useMemo(() => htmlComSvg(viewAtual?.html), [viewAtual]);
  const travelHtmlSvg = useMemo(() => htmlComSvg(travelHtml), []);

  // Interatividade sobre o conteúdo renderizado (matriz por idade + tooltips)
  useEffect(() => {
    const c = ref.current;
    if (!c || !viewAtual || vista === "travel") return;

    // --- Tooltips [data-info] ---
    const aoClicar = (e) => {
      const alvo = e.target.closest("[data-info]");
      if (alvo && c.contains(alvo)) {
        const r = alvo.getBoundingClientRect();
        setPop({ texto: alvo.getAttribute("data-info"), x: r.left, y: r.bottom + 6 });
      } else {
        setPop(null);
      }
    };
    c.addEventListener("click", aoClicar);

    // --- Matriz: filtro por coluna de idade ---
    const table = c.querySelector("#matrix-table");
    const limpar = () => {
      if (!table) return;
      ativaIdade.current = null;
      table.classList.remove("filter-active");
      table.querySelectorAll("thead th[data-age]").forEach((th) => th.classList.remove("age-active"));
      table.querySelectorAll("tbody tr").forEach((tr) => {
        tr.classList.remove("not-relevant");
        tr.querySelectorAll("td.cell").forEach((td) => td.classList.remove("age-match"));
      });
      const info = c.querySelector("#matrix-filter-info");
      if (info) info.classList.remove("show");
    };
    const alternar = (age, th) => {
      if (!table) return;
      if (ativaIdade.current === age) { limpar(); return; }
      ativaIdade.current = age;
      table.querySelectorAll("thead th[data-age]").forEach((h) => h.classList.toggle("age-active", h.dataset.age === age));
      table.classList.add("filter-active");
      table.querySelectorAll("tbody tr").forEach((tr) => {
        let tem = false;
        tr.querySelectorAll(`td.cell[data-age="${age}"]`).forEach((cl) => { if (cl.querySelector(".v-pill")) tem = true; });
        if (!tem && ["25a", "45a", "65a", "10/10"].includes(age) && tr.querySelector(".v-tdpa")) tem = true;
        tr.classList.toggle("not-relevant", !tem);
        tr.querySelectorAll("td.cell").forEach((td) => td.classList.toggle("age-match", td.dataset.age === age));
      });
      const info = c.querySelector("#matrix-filter-info");
      const txt = c.querySelector("#matrix-filter-text");
      if (txt) txt.innerHTML = `A mostrar apenas vacinas administradas aos <strong>${th.textContent.trim().replace(/\s+/g, " ")}</strong>`;
      if (info) info.classList.add("show");
    };
    const headers = table ? table.querySelectorAll("thead th[data-age]") : [];
    const handlers = [];
    headers.forEach((th) => {
      const h = () => alternar(th.dataset.age, th);
      th.addEventListener("click", h);
      th.style.cursor = "pointer";
      handlers.push([th, h]);
    });

    return () => {
      c.removeEventListener("click", aoClicar);
      handlers.forEach(([th, h]) => th.removeEventListener("click", h));
    };
  }, [vista, viewAtual]);

  // Pesquisa simples: esconde blocos que não contêm o termo
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const q = normalizar(query).trim();
    const blocos = c.querySelectorAll(".tl-item, .vacc-card, tbody tr, .notes-block, .leg");
    blocos.forEach((b) => {
      b.style.display = !q || normalizar(b.textContent).includes(q) ? "" : "none";
    });
  }, [query, vista]);

  // Mapa do viajante: ligar cliques nas regiões (SVG) e na legenda
  useEffect(() => {
    if (vista !== "travel" || regiao) return;
    const c = mapRef.current;
    if (!c) return;
    const handlers = [];
    c.querySelectorAll("[data-region]").forEach((el) => {
      const id = el.dataset.region;
      if (!id || !viajante[id]) return;
      const h = (e) => { e.stopPropagation(); setRegiao(id); };
      el.addEventListener("click", h);
      el.style.cursor = "pointer";
      handlers.push([el, h]);
    });
    return () => handlers.forEach(([el, h]) => el.removeEventListener("click", h));
  }, [vista, regiao]);

  function abrir(id) {
    setVista(id);
    setRegiao(null);
    setQuery("");
    setPop(null);
  }
  function home() {
    setVista(null);
    setRegiao(null);
    setQuery("");
    setPop(null);
  }

  // ---------- HERO ----------
  const hero = (
    <header className="hero" style={{ background: gradiente || accent }}>
      <div className="hero-conteudo">
        <button className="voltar" onClick={vista ? home : onVoltar}>← {vista ? "Vacinação" : "Início"}</button>
        <div className="hero-titulo">{viewAtual ? viewAtual.titulo : "Consultor de Vacinação"}</div>
        <div className="hero-subtitulo">{viewAtual ? viewAtual.desc : "PNV 2025 · Programa Nacional de Vacinação"}</div>
      </div>
    </header>
  );

  const rodapeFonte = (
    <div className="rodape">
      <strong>Fonte:</strong> Programa Nacional de Vacinação e Livro Azul de Vacinas (DGS). Aplicação independente, sem ligação nem endosso da DGS. Ferramenta de estudo — confirma sempre no Boletim de Vacinas / Livro Azul. <a href="https://www.dgs.pt/publicacoes/livro-azul-de-vacinas-programa-nacional-de-vacinacao-e-outras-estrategias-de-imunizacao.aspx" target="_blank" rel="noopener noreferrer" style={{ color: "var(--acento)" }}>Livro Azul (DGS) ↗</a>
    </div>
  );

  // ---------- HOME ----------
  if (!vista) {
    return (
      <div style={{ "--acento": accent }}>
        {hero}
        <div className="modulo-corpo">
          <div className="vac-menu">
            {VIEWS.map((v) => (
              <button key={v.id} className="cartao vac-menu-item" onClick={() => abrir(v.id)}>
                <div>
                  <div className="vac-menu-titulo">{v.titulo}</div>
                  <div className="vac-menu-desc">{v.desc}</div>
                </div>
                <span className="vac-menu-seta" style={{ color: accent }}>›</span>
              </button>
            ))}
          </div>
          {rodapeFonte}
        </div>
      </div>
    );
  }

  // ---------- VIAJANTE ----------
  if (vista === "travel") {
    if (regiao && viajante[regiao]) {
      const d = viajante[regiao];
      const sorted = [...d.vaccines].sort((a, b) => (ORDEM_PRIO[a.priority] ?? 99) - (ORDEM_PRIO[b.priority] ?? 99));
      return (
        <div style={{ "--acento": accent }} className="vac">
          {hero}
          <div className="modulo-corpo">
            <button className="voltar" style={{ color: "var(--acento)", marginBottom: 12 }} onClick={() => setRegiao(null)}>← Regiões</button>
            <div className="region-detail-hero" style={{ background: `linear-gradient(135deg, ${d.color}cc 0%, ${d.color}88 100%)`, borderRadius: 14, padding: "16px 18px", color: "#1a2027", marginBottom: 14 }}>
              <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".06em", opacity: 0.8 }}>Consulta do viajante</div>
              <h2 style={{ margin: "2px 0 4px" }}>{d.name}</h2>
              <p style={{ margin: 0, fontSize: 13 }}>{d.sub}</p>
            </div>
            {sorted.map((v, i) => (
              <div key={i} className={"vacc-card " + v.priority} style={{ border: "1px solid var(--borda)", borderRadius: 12, padding: "12px 14px", marginBottom: 8, background: "var(--superficie)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "start" }}>
                  <div>
                    <div style={{ fontWeight: 700, color: "var(--texto)" }}>{v.name}</div>
                    {v.brand && <div style={{ fontSize: 12, color: "var(--suave)" }}>{v.brand}</div>}
                  </div>
                  <span className={"vacc-priority " + v.priority} style={{ fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>{ROTULO_PRIO[v.priority] || "Recomendada"}</span>
                </div>
                <div style={{ fontSize: 13, color: "var(--texto-2)", marginTop: 6, lineHeight: 1.5 }}>{v.info}</div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return (
      <div style={{ "--acento": accent }}>
        {hero}
        <div className="modulo-corpo">
          <div className="vac" ref={mapRef} dangerouslySetInnerHTML={{ __html: travelHtmlSvg }} />
        </div>
      </div>
    );
  }

  // ---------- VISTA DE CONTEÚDO ----------
  return (
    <div style={{ "--acento": accent }}>
      {hero}
      <div className="modulo-corpo">
        <input className="campo" style={{ width: "100%", marginBottom: 12 }} placeholder="Pesquisar por vacina, idade ou doença (ex.: hexavalente, sarampo)…" value={query} onChange={(e) => setQuery(e.target.value)} />
        <div className="vac" ref={ref} dangerouslySetInnerHTML={{ __html: htmlAtual }} />
        {rodapeFonte}
      </div>

      {pop && (
        <>
          <div onClick={() => setPop(null)} style={{ position: "fixed", inset: 0, zIndex: 40 }} />
          <div style={{ position: "fixed", left: Math.min(pop.x, window.innerWidth - 300), top: pop.y, zIndex: 41, maxWidth: 290, background: "var(--texto)", color: "var(--fundo)", padding: "10px 12px", borderRadius: 10, fontSize: 12.5, lineHeight: 1.5, boxShadow: "0 8px 30px rgba(0,0,0,.25)" }}>
            {pop.texto}
          </div>
        </>
      )}
    </div>
  );
}
