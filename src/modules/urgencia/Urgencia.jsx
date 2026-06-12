import { useState, useMemo, useEffect } from "react";
import indice from "@conteudo/urgencia/indice.json";
import { filtrarItens } from "./logica";
import Obstipacao from "./Obstipacao.jsx";
import Cansaco from "./Cansaco.jsx";
import DorAbdominal from "./DorAbdominal.jsx";
import ColicaRenal from "./ColicaRenal.jsx";
import { I, Ico } from "@/components/icones";
import { useEstadoLocal } from "@/lib/persistencia";
import "./estilo.css";

const { sistemas, sintomas, suspeitas } = indice;
const ITENS = [...sintomas, ...suspeitas];

export default function Urgencia({ accent = "#e85d4a", gradiente, onVoltar }) {
  const [filtro, setFiltro] = useState("todas");
  const [favoritos, setFavoritos] = useEstadoLocal("medguia:urgencia:favoritos", []);
  const [query, setQuery] = useState("");
  const [aberto, setAberto] = useEstadoLocal("medguia:urgencia:aberto", null);

  // abrir/fechar um submódulo repõe sempre o scroll no topo
  useEffect(() => { window.scrollTo({ top: 0 }); }, [aberto]);

  const toggleFav = (id) => setFavoritos((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]));
  const { total, grupos } = useMemo(() => filtrarItens(ITENS, sistemas, { filtro, favoritos, query }), [filtro, favoritos, query]);

  const sistemaKeys = Object.keys(sistemas);

  const hero = (
    <header className="hero" style={{ background: gradiente || accent }}>
      <div className="hero-conteudo">
        <button className="voltar" onClick={onVoltar}>← Início</button>
        <div className="hero-titulo">Sintomas</div>
        <div className="hero-subtitulo">Treino de raciocínio diagnóstico · casos de estudo</div>
      </div>
    </header>
  );

  const SUBMODULOS = { obstipacao: Obstipacao, cansaco: Cansaco, dor_abdominal: DorAbdominal, colica_renal: ColicaRenal };
  const Sub = SUBMODULOS[aberto];
  if (Sub) {
    return (
      <div style={{ "--acento": accent }}>
        {hero}
        <div className="modulo-corpo"><Sub accent={accent} voltar={() => setAberto(null)} /></div>
      </div>
    );
  }

  return (
    <div style={{ "--acento": accent }}>
      {hero}

      <div className="modulo-corpo">
        <div className="ug-banner-estudo">
          <Ico name="library" s={18} />
          <span><strong>Ferramenta de estudo.</strong> Trabalha um caso clínico para treinar o raciocínio diagnóstico. Não se destina a apoiar decisões sobre doentes reais.</span>
        </div>

        <input className="campo" style={{ width: "100%", marginBottom: 10 }} placeholder="Pesquisar sintoma, suspeita ou palavra-chave…" value={query} onChange={(e) => setQuery(e.target.value)} />

        <div className="filtros">
          <button className={"filtro" + (filtro === "todas" ? " filtro--ativo" : "")} style={filtro === "todas" ? { background: accent } : undefined} onClick={() => setFiltro("todas")}>Todas</button>
          <button className={"filtro" + (filtro === "favoritos" ? " filtro--ativo" : "")} style={filtro === "favoritos" ? { background: "#d97706", borderColor: "#d97706", color: "#fff" } : undefined} onClick={() => setFiltro("favoritos")}><Ico name="star" s={13} style={{ marginRight: 4 }} />Favoritos</button>
          {sistemaKeys.map((k) => (
            <button key={k} className={"filtro" + (filtro === k ? " filtro--ativo" : "")} style={filtro === k ? { background: sistemas[k].cor, borderColor: sistemas[k].cor, color: "#fff" } : undefined} onClick={() => setFiltro(k)}>{sistemas[k].label}</button>
          ))}
        </div>

        <div style={{ fontSize: 12, color: "var(--tenue)", margin: "8px 0 12px", fontWeight: 500 }}>
          {total} {total !== 1 ? "resultados" : "resultado"}
        </div>

        {grupos.map(([letra, lista]) => (
          <div key={letra} style={{ marginBottom: 14 }}>
            <div className="ug-letra">{letra}</div>
            <div className="ug-grid">
              {lista.map((s) => {
                const sys = sistemas[s.sys] || { label: "", cor: "var(--suave)" };
                const ativo = !!s.active;
                const fav = favoritos.includes(s.id);
                return (
                  <div key={s.id} className={"ug-card" + (ativo ? "" : " ug-card--off")} onClick={() => ativo && setAberto(s.id)} style={{ cursor: ativo ? "pointer" : "default" }}>
                    <span className="ug-dot" style={{ background: sys.cor }} />
                    <div className="ug-info">
                      <div className="ug-nome">{s.name}</div>
                      <div className="ug-sys" style={{ color: sys.cor }}>{sys.label.toUpperCase()}</div>
                      {s.type === "suspeita" && s.tags && (
                        <div className="ug-tags">{s.tags.map((t, i) => <span key={i} className="ug-tag">{t}</span>)}</div>
                      )}
                    </div>
                    {!ativo && <span className="ug-badge">Em breve</span>}
                    <button className={"ug-fav" + (fav ? " on" : "")} onClick={(e) => { e.stopPropagation(); toggleFav(s.id); }}>{fav ? I.starFill("currentColor", 16) : I.star("currentColor", 16)}</button>
                    {ativo && <span className="ug-arrow">›</span>}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {total === 0 && <div style={{ textAlign: "center", padding: 40, color: "var(--tenue)" }}>Nenhum resultado encontrado.</div>}

        <div className="rodape">
          <strong>Nota:</strong> Índice de apoio ao raciocínio clínico em ambulatório/urgência, para estudo. Não substitui a avaliação clínica. <em>(As abordagens detalhadas de cada sintoma vão sendo adicionadas.)</em>
        </div>
      </div>
    </div>
  );
}
