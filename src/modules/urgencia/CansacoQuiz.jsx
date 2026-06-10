import dados from "@conteudo/urgencia/cansaco-quiz.json";
import QuizPNA from "./sintoma/QuizPNA.jsx";

export default function CansacoQuiz({ accent, voltar }) {
  return <QuizPNA dados={dados} prefixo="medguia:cansaco:quiz" rotuloVoltar="‹ Menu Cansaço" voltar={voltar} />;
}
