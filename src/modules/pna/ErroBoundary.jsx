import { Component } from "react";
import { Ico } from "@/components/icones";

// ============================================================================
// ErroBoundary — apanha erros de render de um ecrã do PNA e mostra uma mensagem
// amigável (em vez de ecrã branco). Os dados de treino vivem no IndexedDB, por
// isso não se perdem. Dar `key` que muda por ecrã faz o boundary recuperar ao
// navegar.
// ============================================================================
export default class ErroBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { erro: null };
  }

  static getDerivedStateFromError(erro) {
    return { erro };
  }

  componentDidCatch(erro, info) {
    console.error("[PNA] erro de render:", erro, info?.componentStack);
  }

  render() {
    if (this.state.erro) {
      return (
        <div className="cartao pna-cta">
          <div className="pna-cta-icone"><Ico name="alertCircle" s={26} /></div>
          <p className="pna-cta-titulo">Algo correu mal neste ecrã</p>
          <p className="pna-cta-texto">
            Ocorreu um erro inesperado. Os teus dados de treino estão guardados no
            dispositivo e não se perderam. Volta ao início e tenta de novo.
          </p>
          <button className="pna-btn" onClick={this.props.onReset}>Voltar ao início</button>
        </div>
      );
    }
    return this.props.children;
  }
}
