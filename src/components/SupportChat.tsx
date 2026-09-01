import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ChatMessage = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Como crio minha conta?",
  "Como meu cliente acompanha o serviço?",
  "Quantas solicitações o plano Free inclui?",
  "Como adiciono um motorista?",
  "Como faço upgrade do meu plano?",
];

export function SupportChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || loading) return;

    const history: ChatMessage[] = [...messages, { role: "user", content }];
    setMessages(history);
    setInput("");
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/support-chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: history.slice(-20) }),
      });

      if (!response.ok || !response.body) {
        setError(await response.text().catch(() => "Erro ao falar com o assistente."));
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let answer = "";
      setMessages([...history, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        answer += decoder.decode(value, { stream: true });
        setMessages([...history, { role: "assistant", content: answer }]);
      }

      answer += decoder.decode();
      setMessages([...history, { role: "assistant", content: answer }]);
      if (!answer.trim()) {
        setMessages(history);
        setError("O assistente não respondeu. Tente novamente.");
      }
    } catch {
      setMessages(history);
      setError("Não foi possível conectar ao assistente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold text-foreground">Time AcompanhaAí</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Estamos aqui para te ajudar!<br />
          Pergunte o que precisar :)
        </p>
      </div>

      <div ref={listRef} className="max-h-80 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Olá! Conta pra gente como podemos te ajudar hoje. Você pode começar por uma sugestão:
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((suggestion) => (
                <Button
                  key={suggestion}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void send(suggestion)}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={message.role === "user" ? "flex justify-end" : "flex justify-start"}
            >
              <div
                className={
                  message.role === "user"
                    ? "max-w-[85%] rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground"
                    : "max-w-[85%] whitespace-pre-wrap rounded-lg bg-muted px-3 py-2 text-sm text-foreground"
                }
              >
                {message.content || "…"}
              </div>
            </div>
          ))
        )}
        {loading ? (
          <p className="text-xs text-muted-foreground">O Time AcompanhaAí está digitando…</p>
        ) : null}
      </div>

      <form
        className="flex items-center gap-2 border-t border-border px-4 py-3"
        onSubmit={(event) => {
          event.preventDefault();
          void send(input);
        }}
      >
        <Input
          value={input}
          onChange={(event) => setInput(event.target.value.slice(0, 500))}
          placeholder="Escreva sua dúvida aqui"
          aria-label="Escreva sua dúvida aqui"
          disabled={loading}
        />
        <Button type="submit" disabled={loading || !input.trim()}>
          Enviar
        </Button>
      </form>

      {error ? (
        <p className="px-4 pb-3 text-xs text-destructive" role="alert">
          {error} Não se preocupe, pode tentar de novo ou reformular sua pergunta.
        </p>
      ) : null}
    </div>
  );
}
