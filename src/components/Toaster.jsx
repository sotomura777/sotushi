import { useToaster } from "@/lib/toast";

// Renderiza as notificações transitórias. Montar uma vez (no App).
export default function Toaster() {
  const itens = useToaster();
  if (!itens.length) return null;
  return (
    <div className="toaster">
      {itens.map((i) => <div key={i.id} className="toast-msg">{i.msg}</div>)}
    </div>
  );
}
