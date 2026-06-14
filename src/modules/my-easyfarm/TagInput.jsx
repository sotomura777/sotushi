import { useState, useRef, useMemo } from "react";

// Campo de chips com autocomplete (porte de setupAutocomplete do original).
// valores: string[] atuais · onChange(novoArray) · sugestoes: [valor,contagem][]
// (todos os valores existentes desse campo, com contagem).
export default function TagInput({ valores, onChange, sugestoes, placeholder, label, hint }) {
  const [texto, setTexto] = useState("");
  const [aberto, setAberto] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const inputRef = useRef(null);

  const jaTem = useMemo(() => new Set(valores.map((v) => v.toLowerCase())), [valores]);
  const tokenLow = texto.trim().toLowerCase();

  const itens = useMemo(() => {
    const matches = sugestoes
      .filter(([v]) => !jaTem.has(v.toLowerCase()) && (tokenLow === "" || v.toLowerCase().includes(tokenLow)))
      .slice(0, 8)
      .map(([v, c]) => ({ tipo: "existe", valor: v, count: c }));
    const exact = sugestoes.some(([v]) => v.toLowerCase() === tokenLow);
    if (texto.trim() && !exact && !jaTem.has(tokenLow)) matches.push({ tipo: "nova", valor: texto.trim() });
    return matches;
  }, [sugestoes, jaTem, tokenLow, texto]);

  const adicionar = (v) => {
    const val = (v || "").trim().replace(/,$/, "");
    if (val && !valores.some((x) => x.toLowerCase() === val.toLowerCase())) onChange([...valores, val]);
    setTexto("");
    setActiveIdx(-1);
  };
  const remover = (idx) => onChange(valores.filter((_, i) => i !== idx));

  const onKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (aberto && activeIdx >= 0 && itens[activeIdx]) adicionar(itens[activeIdx].valor);
      else if (texto.trim()) adicionar(texto);
    } else if (e.key === "Backspace" && !texto && valores.length) {
      onChange(valores.slice(0, -1));
    } else if (e.key === "ArrowDown" && aberto) {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, itens.length - 1));
    } else if (e.key === "ArrowUp" && aberto) {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Escape") {
      setAberto(false);
    }
  };

  const mostrarDd = aberto && itens.length > 0;

  return (
    <div className="field">
      {label && (
        <span className="field-label">{label}{hint && <span className="field-label-hint"> — {hint}</span>}</span>
      )}
      <div className="myef-taginput" onClick={(e) => { if (e.target.classList.contains("myef-taginput")) inputRef.current?.focus(); }}>
        {valores.map((v, i) => (
          <span key={v + i} className="myef-editor-tag">
            {v}
            <button type="button" aria-label="Remover" onClick={() => remover(i)}>×</button>
          </span>
        ))}
        <input
          ref={inputRef}
          className="myef-tag-typing"
          value={texto}
          placeholder={valores.length ? "" : placeholder}
          autoComplete="off"
          onChange={(e) => { setTexto(e.target.value); setAberto(true); setActiveIdx(-1); }}
          onFocus={() => setAberto(true)}
          onBlur={() => setTimeout(() => setAberto(false), 150)}
          onKeyDown={onKeyDown}
        />
        {mostrarDd && (
          <div className="myef-ac-dropdown">
            {itens.map((it, i) => (
              it.tipo === "nova" ? (
                <div key="__nova" className={"myef-ac-item myef-ac-new" + (i === activeIdx ? " active" : "")}
                  onMouseDown={(e) => { e.preventDefault(); adicionar(it.valor); }}
                  onMouseEnter={() => setActiveIdx(i)}>
                  <span>Criar nova: <strong>{it.valor}</strong></span>
                  <span className="myef-ac-new-icon">+</span>
                </div>
              ) : (
                <div key={it.valor} className={"myef-ac-item" + (i === activeIdx ? " active" : "")}
                  onMouseDown={(e) => { e.preventDefault(); adicionar(it.valor); }}
                  onMouseEnter={() => setActiveIdx(i)}>
                  <span>{it.valor}</span>
                  <span className="myef-ac-count">{it.count}</span>
                </div>
              )
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
