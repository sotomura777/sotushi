import { useState, Fragment } from "react";
import meta from "@conteudo/antibioterapia/meta.json";
import dados from "@conteudo/antibioterapia/dados.json";
import { corEspecialidade, estiloViralNote, etiquetasObs, getDicas } from "./logica";
import { I, Ico } from "@/components/icones";
import { EmojiIco, limparEmojis } from "@/components/emoji";
import "./estilo.css";

const PASSOS = ["Especialidade", "Patologia", "Tratamento"];
const ICO_TAG = { gravidez: "person", sinave: "megaphone", ref: "hospital", novo: "sparkle", alerta: "warn" };

export default function AntibioterapiaAmbulatorio({ accent = "#b45309", gradiente, onVoltar }) {
  const [especialidade, setEspecialidade] = useState(null);
  const [patologia, setPatologia] = useState(null);
  const [tab, setTab] = useState(0);
  const [dicasAbertas, setDicasAbertas] = useState(true);

  const passoAtual = !especialidade ? 0 : patologia === null ? 1 : 2;
  const esp = especialidade ? dados[especialidade] : null;
  const cor = corEspecialidade(esp);

  const abrirEspecialidade = (key) => { setEspecialidade(key); setPatologia(null); };
  const abrirPatologia = (i) => { setPatologia(i); setTab(0); setDicasAbertas(true); };
  const inicio = () => { setEspecialidade(null); setPatologia(null); };
  const voltarEspecialidade = () => setPatologia(null);

  function renderPassos() {
    return (
      <div className="atb-passos">
        {PASSOS.map((s, i) => (
          <Fragment key={i}>
            <span className={"atb-passo-dot" + (i < passoAtual ? " feito" : i === passoAtual ? " ativo" : "")} />
            {i < PASSOS.length - 1 && <span className="atb-passo-linha" />}
          </Fragment>
        ))}
        <span style={{ marginLeft: 8 }}>{PASSOS[passoAtual]}</span>
      </div>
    );
  }

  function renderBreadcrumb() {
    return (
      <div className="atb-breadcrumb">
        <span className="atb-crumb" onClick={inicio}>Especialidades</span>
        {esp && (
          <>
            <span className="atb-crumb-sep">›</span>
            {patologia !== null ? (
              <>
                <span className="atb-crumb" onClick={voltarEspecialidade}>
                  <EmojiIco e={esp.icon} c={cor} s={16} /> {esp.label}
                </span>
                <span className="atb-crumb-sep">›</span>
                <span className="atb-crumb ativo">{esp.paths[patologia].name}</span>
              </>
            ) : (
              <span className="atb-crumb ativo">
                <EmojiIco e={esp.icon} c={cor} s={16} /> {esp.label}
              </span>
            )}
          </>
        )}
      </div>
    );
  }

  const hero = (
    <header className="hero" style={{ background: gradiente || accent }}>
      <div className="hero-conteudo">
        {onVoltar && (
          <button className="voltar" onClick={onVoltar}>
            ← Início
          </button>
        )}
        <div className="hero-titulo">{meta.nome}</div>
        <div className="hero-subtitulo">{meta.tag}</div>
      </div>
    </header>
  );

  // ===== VISTA 1: especialidades =====
  if (!especialidade) {
    return (
      <div style={{ "--acento": accent }}>
        {hero}
        <div className="modulo-corpo">
          {renderPassos()}
          <div className="atb-pergunta">
            <p className="atb-pergunta-texto">Que tipo de infeção suspeitas?</p>
            <div className="atb-esp-grelha">
              {Object.entries(dados).map(([key, sp]) => (
                <button key={key} className="atb-esp-btn" style={{ "--c": corEspecialidade(sp) }} onClick={() => abrirEspecialidade(key)}>
                  <span className="atb-esp-icon"><EmojiIco e={sp.icon} c={corEspecialidade(sp)} s={22} /></span>
                  <span className="atb-esp-nome">{sp.full}</span>
                  <span className="atb-esp-desc">{sp.desc}</span>
                  <span className="atb-esp-tag">{sp.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="rodape">{meta.rodape}</div>
        </div>
      </div>
    );
  }

  // ===== VISTA 2: patologias =====
  if (patologia === null) {
    return (
      <div style={{ "--acento": accent }}>
        {hero}
        <div className="modulo-corpo">
          {renderPassos()}
          {renderBreadcrumb()}
          <div className="atb-pergunta" style={{ "--c": cor }}>
            <p className="atb-pergunta-texto">Qual a patologia específica?</p>
            <div className="atb-pat-grelha">
              {esp.paths.map((p, i) => (
                <button key={i} className="atb-pat-btn" style={{ "--c": cor }} onClick={() => abrirPatologia(i)}>
                  <span>
                    {p.name}
                    {p.icpc && <span className="atb-pat-icpc">{p.icpc}</span>}
                  </span>
                  <span className="atb-pat-seta">→</span>
                </button>
              ))}
            </div>
          </div>
          <div className="rodape">{meta.rodape}</div>
        </div>
      </div>
    );
  }

  // ===== VISTA 3: tratamento =====
  const path = esp.paths[patologia];
  const multiplasIdades = path.ages.length > 1;
  const idade = path.ages[Math.min(tab, path.ages.length - 1)];
  const dicas = getDicas(path);
  const temDicas = dicas.semMelhoria.length > 0 || dicas.mimics.length > 0;

  return (
    <div style={{ "--acento": accent }}>
      {hero}
      <div className="modulo-corpo">
        {renderPassos()}
        {renderBreadcrumb()}

        <div className="atb-trat" style={{ "--c": cor }}>
          <div className="atb-trat-cab">
            <div className="atb-trat-esp">
              <EmojiIco e={esp.icon} c={cor} s={18} /> {esp.full}
              {path.icpc ? ` · ${path.icpc}` : ""}
            </div>
            <div className="atb-trat-titulo">{path.name}</div>
          </div>

          {path.organisms && (
            <div className="atb-organismos">
              <span className="atb-organismos-label">Microrganismos:</span>
              {path.organisms.replace(/\n/g, " · ")}
            </div>
          )}

          {path.viral_note && (
            <div style={{ padding: "14px 20px 0" }}>
              <div className={"atb-alerta " + estiloViralNote(path.viral_note)} style={{ margin: 0 }}>
                {limparEmojis(path.viral_note)}
              </div>
            </div>
          )}

          {multiplasIdades && (
            <div className="atb-tabs">
              {path.ages.map((a, i) => (
                <button key={i} className={"atb-tab" + (i === tab ? " ativo" : "")} onClick={() => setTab(i)}>
                  {a.label}
                </button>
              ))}
            </div>
          )}

          <div className="atb-painel">
            {idade.note && <div className="atb-alerta info" style={{ margin: "12px 0" }}><Ico name="info" s={15} style={{ marginRight: 5 }} />{limparEmojis(idade.note)}</div>}
            {idade.danger && <div className="atb-alerta danger" style={{ margin: "12px 0" }}><Ico name="ban" s={15} style={{ marginRight: 5 }} />{limparEmojis(idade.danger)}</div>}
            {idade.lines.map((linha, li) => (
              <div key={li} className="atb-linha">
                <div className={"atb-linha-label " + (linha.type === "first" ? "first" : "alt")}>{linha.label}</div>
                {linha.items.map((item, ii) =>
                  item.or ? (
                    <div key={ii} className="atb-ou">— ou —</div>
                  ) : (
                    <div key={ii} className={"atb-item " + (linha.type === "first" ? "first" : "alt")}>
                      {item.condition && <div className="atb-item-condicao">{item.condition}</div>}
                      <div className="atb-item-farmaco">{item.drug}</div>
                      {item.dose && (
                        <div className="atb-item-dose">
                          {item.dose.split("\n").map((l, k) => (
                            <span key={k}>
                              {k > 0 && <br />}
                              {l}
                            </span>
                          ))}
                        </div>
                      )}
                      {item.warning && <div className="atb-item-aviso"><Ico name="warn" s={14} style={{ marginRight: 4 }} />{limparEmojis(item.warning)}</div>}
                    </div>
                  )
                )}
              </div>
            ))}
          </div>

          {path.obs && path.obs.length > 0 && (
            <div className="atb-obs">
              <div className="atb-obs-cab">
                <span className="atb-obs-cab-icon">{I.clipboard(accent, 20)}</span>
                <div>
                  <div className="atb-obs-cab-titulo">Observações</div>
                  <div className="atb-obs-cab-sub">Notas clínicas e alertas específicos</div>
                </div>
              </div>
              <div className="atb-obs-grelha">
                {path.obs.map((o, n) => (
                  <div key={n} className="atb-obs-item">
                    <span className="atb-obs-num">{n + 1}</span>
                    <span className="atb-obs-texto">
                      {limparEmojis(o)}
                      {etiquetasObs(o).map((tag, ti) => (
                        <span key={ti} className={"atb-tag " + tag.tipo}>
                          <Ico name={ICO_TAG[tag.tipo]} s={11} style={{ marginRight: 3 }} />{tag.rotulo}
                        </span>
                      ))}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {temDicas && (
          <div className={"atb-dicas" + (dicasAbertas ? " aberto" : "")}>
            <div className="atb-dicas-toggle" onClick={() => setDicasAbertas((v) => !v)}>
              <div className="atb-dicas-toggle-esq">
                <span className="atb-dicas-toggle-icon">{I.bulb(accent, 20)}</span>
                <div>
                  <div className="atb-dicas-toggle-label">Dicas Clínicas</div>
                  <div className="atb-dicas-toggle-sub">O que fazer se não melhorar · Diagnósticos diferenciais</div>
                </div>
              </div>
              <span className="atb-dicas-chevron">▾</span>
            </div>
            <div className="atb-dicas-corpo">
              <div className="atb-dicas-cols">
                {dicas.semMelhoria.length > 0 && (
                  <div>
                    <div className="atb-dica-col-cab">
                      <span className="atb-dica-col-dot melhoria" />
                      <span className="atb-dica-col-titulo melhoria">Se não houver melhoria…</span>
                    </div>
                    {dicas.semMelhoria.map((t, i) => (
                      <div key={i} className="atb-dica-item">
                        <span className="atb-dica-seta melhoria">→</span>
                        <span>{t}</span>
                      </div>
                    ))}
                  </div>
                )}
                {dicas.mimics.length > 0 && (
                  <div>
                    <div className="atb-dica-col-cab">
                      <span className="atb-dica-col-dot mimic" />
                      <span className="atb-dica-col-titulo mimic">Diagnósticos que podem mimetizar</span>
                    </div>
                    {dicas.mimics.map((t, i) => (
                      <div key={i} className="atb-dica-item">
                        <span className="atb-dica-seta mimic">◈</span>
                        <span>{t}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="rodape" style={{ marginTop: 16 }}>{meta.rodape}</div>
      </div>
    </div>
  );
}
