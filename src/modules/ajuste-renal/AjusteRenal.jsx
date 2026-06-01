import { useState, useMemo } from "react";
import meta from "@conteudo/ajuste-renal/meta.json";
import farmacos from "@conteudo/ajuste-renal/farmacos.json";
import { getAjuste, getGravidade, getEstadio, getCatCor } from "./logica";
import { GRAVIDADE } from "@/design/tokens";
import { Ico } from "@/components/icones";
import { limparEmojis } from "@/components/emoji";
import { normalizar } from "@/lib/texto";

const CATEGORIAS = [...new Set(farmacos.map((d) => d.cat))];

export default function AjusteRenal({ accent = "#0f766e", gradiente, onVoltar }) {
  const [tfg, setTfg] = useState("");
  const [pesquisa, setPesquisa] = useState("");
  const [categoria, setCategoria] = useState("Todos");
  const [soComAjuste, setSoComAjuste] = useState(false);

  const tfgNum = tfg === "" ? null : parseInt(tfg, 10);
  const estadio = useMemo(() => getEstadio(tfgNum, meta.estadios), [tfgNum]);

  const filtrados = useMemo(() => {
    let r = farmacos;
    if (categoria !== "Todos") r = r.filter((d) => d.cat === categoria);
    if (pesquisa) {
      const s = normalizar(pesquisa);
      r = r.filter(
        (d) =>
          normalizar(d.name).includes(s) ||
          normalizar(d.sub).includes(s) ||
          normalizar(d.cat).includes(s)
      );
    }
    if (soComAjuste && tfgNum !== null) {
      r = r.filter((d) => {
        const a = getAjuste(d, tfgNum);
        return !a.includes("Sem ajuste") && !a.includes("Sem necessidade");
      });
    }
    return r;
  }, [categoria, pesquisa, soComAjuste, tfgNum]);

  const agrupados = useMemo(() => {
    const g = {};
    filtrados.forEach((d) => {
      const k = `${d.cat} — ${d.sub}`;
      if (!g[k]) g[k] = { cat: d.cat, sub: d.sub, drugs: [] };
      g[k].drugs.push(d);
    });
    return Object.values(g);
  }, [filtrados]);

  return (
    <div style={{ "--acento": accent }}>
      <header className="hero" style={{ background: gradiente || accent }}>
        <div className="hero-conteudo">
          {onVoltar && (
            <button className="voltar" onClick={onVoltar}>
              ← Início
            </button>
          )}
          <div className="hero-titulo">{meta.nome}</div>
          <div className="hero-subtitulo">{meta.subtitulo}</div>
        </div>
      </header>

      <div className="modulo-corpo">
        {/* Input de TFG */}
        <div className="cartao" style={{ padding: 20, margin: "16px 0" }}>
          <label className="secao-label" style={{ marginBottom: 8, display: "block" }}>
            Taxa de Filtração Glomerular (TFG)
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <input
              type="number"
              min="0"
              max="200"
              value={tfg}
              onChange={(e) => setTfg(e.target.value)}
              placeholder="Ex: 45"
              className="campo"
              style={{
                fontSize: 32,
                fontWeight: 700,
                color: estadio ? estadio.cor : "var(--texto-2)",
                background: "#fafbfc",
              }}
            />
            <span style={{ fontSize: 14, color: "var(--tenue)", fontWeight: 500, whiteSpace: "nowrap" }}>
              mL/min/1.73m²
            </span>
          </div>

          {estadio && (
            <div
              style={{
                marginTop: 12,
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 14px",
                background: `${estadio.cor}10`,
                borderRadius: "var(--raio-md)",
                border: `1px solid ${estadio.cor}25`,
              }}
            >
              <span style={{ background: estadio.cor, color: "#fff", fontWeight: 700, fontSize: 13, padding: "3px 10px", borderRadius: 6 }}>
                {estadio.stage}
              </span>
              <span style={{ fontSize: 14, color: estadio.cor, fontWeight: 500 }}>{estadio.label}</span>
            </div>
          )}
        </div>

        {/* Pesquisa + filtro "apenas c/ ajuste" */}
        <div style={{ display: "flex", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
          <input
            type="text"
            value={pesquisa}
            onChange={(e) => setPesquisa(e.target.value)}
            placeholder="Pesquisar fármaco…"
            className="campo"
            style={{ flex: 1, minWidth: 200 }}
          />
          {tfgNum !== null && (
            <button
              onClick={() => setSoComAjuste((v) => !v)}
              className="filtro"
              style={
                soComAjuste
                  ? { background: "#f0fdfa", color: accent, border: `1px solid ${accent}`, padding: "10px 16px" }
                  : { padding: "10px 16px", border: "1px solid var(--borda)" }
              }
            >
              {soComAjuste && <Ico name="check" s={13} style={{ marginRight: 4 }} />}Apenas c/ ajuste
            </button>
          )}
        </div>

        {/* Pílulas de categoria */}
        <div className="filtros">
          {["Todos", ...CATEGORIAS].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoria(cat)}
              className={"filtro" + (categoria === cat ? " filtro--ativo" : "")}
              style={categoria === cat ? { background: cat === "Todos" ? accent : getCatCor(cat) } : undefined}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Contagem */}
        <div style={{ fontSize: 12, color: "var(--tenue)", margin: "4px 0 12px", fontWeight: 500 }}>
          {filtrados.length} fármaco{filtrados.length !== 1 ? "s" : ""} encontrado
          {filtrados.length !== 1 ? "s" : ""}
        </div>

        {/* Lista agrupada */}
        {agrupados.map((grupo, gi) => (
          <div key={gi} style={{ marginBottom: 16 }}>
            <div className="secao-label" style={{ color: getCatCor(grupo.cat) }}>
              {grupo.sub}
            </div>
            <div className="lista">
              {grupo.drugs.map((drug, di) => {
                const adj = tfgNum !== null ? getAjuste(drug, tfgNum) : null;
                const sev = adj ? getGravidade(adj) : null;
                const sc = sev ? GRAVIDADE[sev] : null;
                return (
                  <div key={di} className="lista-item">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 15, color: "var(--texto)", display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                          {drug.name}
                          {drug.updated && (
                            <span style={{ fontSize: 9, fontWeight: 700, background: "#dbeafe", color: "#1d4ed8", padding: "1px 5px", borderRadius: 4, letterSpacing: "0.3px" }}>
                              ATUALIZADO {drug.updated}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--tenue)", marginTop: 2 }}>{drug.range}</div>
                      </div>
                      {sev && (
                        <div className="badge" style={{ background: sc.fundo, color: sc.texto, border: `1px solid ${sc.borda}` }}>
                          {sc.etiqueta}
                        </div>
                      )}
                    </div>
                    {adj && (
                      <div
                        style={{
                          marginTop: 8,
                          padding: "8px 12px",
                          borderRadius: "var(--raio-sm)",
                          background: sc.fundo,
                          border: `1px solid ${sc.borda}`,
                          fontSize: 13,
                          color: sc.texto,
                          lineHeight: 1.5,
                          fontWeight: 500,
                        }}
                      >
                        {limparEmojis(adj)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {filtrados.length === 0 && (
          <div style={{ textAlign: "center", padding: 40, color: "var(--tenue)" }}>
            Nenhum fármaco encontrado.
          </div>
        )}

        {/* Nota / bibliografia (conteúdo, vindo do meta.json) */}
        <div className="rodape">
          <strong>Nota:</strong> {meta.nota}
          <br />
          Bibliografia: {meta.bibliografia}
          <br />
          Legenda: {meta.legenda}
        </div>
      </div>
    </div>
  );
}
