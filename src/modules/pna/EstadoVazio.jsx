import { Ico } from "@/components/icones";

// ============================================================================
// EstadoVazio — primeira visita ao módulo PNA (ainda sem respostas dadas).
// Fiel ao mockup "estado vazio", vestido com o design MedGuia. Componente de
// apresentação: recebe callbacks; não acede a dados nem à base de dados.
// ============================================================================

const MODOS = [
  { id: "exame", icone: "clock", nome: "Exame", desc: "Simulação cronometrada com matriz oficial. Sem feedback até ao fim." },
  { id: "treino", icone: "bulb", nome: "Treino", desc: "Feedback imediato, explicação detalhada e ligação aos fármacos." },
  { id: "revisao", icone: "refresh", nome: "Revisão", desc: "Disponível depois de responderes às primeiras perguntas.", off: true },
  { id: "construtor", icone: "sliders", nome: "Construtor", desc: "Monta um exame à medida com filtros por área, tópico, fármaco." },
];

const DIFERENCIADORES = [
  { icone: "brain", titulo: "Análise comportamental", texto: "Detetamos padrões como mudanças de resposta nos últimos segundos ou colapso de tempo em enunciados longos. Treinas a estratégia, não só o conteúdo." },
  { icone: "calendar", titulo: "Revisão espaçada inteligente", texto: "O algoritmo FSRS calcula quando estás prestes a esquecer cada conceito. Vês só o que precisas, no momento certo." },
  { icone: "link", titulo: "Integrado no AllinMed", texto: "Cada pergunta liga aos teus outros módulos. Pergunta sobre amiodarona? Um toque abre a ficha do fármaco com doses, ajustes e interações." },
  { icone: "trophy", titulo: "Posição histórica, sem competição social", texto: "Vês em que lugar terias ficado em cada ano oficial da PNA, com base nas distribuições publicadas pela ACSS. Sem rankings contra outros utilizadores." },
];

export default function EstadoVazio({ nPerguntas = 0, onModo, onIniciar }) {
  return (
    <>
      <div className="cartao pna-cta">
        <div className="pna-cta-icone"><Ico name="stethoscope" s={28} /></div>
        <p className="pna-cta-titulo">Prepara-te para a PNA</p>
        <p className="pna-cta-texto">
          Banco de perguntas portuguesas no estilo da prova, com análise comportamental
          e revisão espaçada inteligente. Funciona offline.
        </p>
        <button className="pna-btn" onClick={onIniciar}>
          <Ico name="alvo" s={16} /> Fazer diagnóstico inicial · 30 perguntas
        </button>
        <p className="pna-cta-nota">~15 min · descobre o teu nível por área</p>
      </div>

      <div className="pna-insight pna-insight--bom">
        <span className="i"><Ico name="bulb" s={16} /></span>
        <div>
          <b>Porquê começar pelo diagnóstico?</b> Em vez de responderes a perguntas ao
          acaso, identificamos as tuas áreas fortes e fracas — depois cada sessão é
          otimizada para o teu nível real. Podes saltar e explorar à vontade, mas
          começar bem poupa-te tempo.
        </div>
      </div>

      <p className="secao-label">Ou explora os modos disponíveis</p>
      <div className="pna-modos">
        {MODOS.map((m) => (
          <button
            key={m.id}
            className={"pna-modo" + (m.off ? " pna-modo--off" : "")}
            onClick={() => !m.off && onModo?.(m.id)}
            disabled={m.off}
          >
            <div className="pna-modo-cab">
              <span className="ic"><Ico name={m.icone} s={18} /></span>
              <p className="pna-modo-nome">{m.nome}</p>
            </div>
            <p className="pna-modo-desc">{m.desc}</p>
          </button>
        ))}
      </div>

      <p className="secao-label">O que torna este módulo diferente</p>
      <div className="cartao pna-difs">
        {DIFERENCIADORES.map((d) => (
          <div key={d.titulo} className="pna-dif">
            <span className="ic"><Ico name={d.icone} s={16} /></span>
            <div>
              <p className="pna-dif-titulo">{d.titulo}</p>
              <p className="pna-dif-texto">{d.texto}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="pna-rodape">
        <span>
          {nPerguntas > 0
            ? `${nPerguntas} perguntas disponíveis`
            : "Banco de perguntas por carregar"}
        </span>
        <span className="pna-link">Como funciona →</span>
      </div>
    </>
  );
}
