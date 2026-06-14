import { PALETTE } from "./logica";

// Seletor de cor: paleta fixa + cores recentes + cor personalizada.
// value: cor atual · onChange(cor) · recentes: string[] · onPushRecent(cor)
export default function Swatches({ value, onChange, recentes = [], onPushRecent }) {
  const botao = (c) => (
    <button
      key={c}
      type="button"
      className={"myef-swatch" + (c === value ? " active" : "")}
      style={{ background: c }}
      title={c}
      onClick={() => onChange(c)}
    />
  );

  return (
    <div className="myef-swatches">
      {PALETTE.map(botao)}
      {recentes.length > 0 && (
        <>
          <div className="myef-swatch-divider" />
          <span className="myef-swatch-label">Recentes</span>
          {recentes.map(botao)}
        </>
      )}
      <div className="myef-swatch-divider" />
      <label className="myef-swatch myef-swatch-custom" title="Cor personalizada">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={(e) => onPushRecent && onPushRecent(e.target.value)}
        />
      </label>
    </div>
  );
}
