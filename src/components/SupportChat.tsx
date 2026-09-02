import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ChatMessage = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Como crio minha conta?",
  "Como acompanho uma solicitação?",
  "Como funciona o rastreamento?",
  "Como adiciono um motorista?",
  "Como faço upgrade do meu plano?",
  "Esqueci minha senha. O que faço?",
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
        body: JSON.stringify({ messages: history }),
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
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-border bg-card">
      <div className="border-b border-border px-4 py-4">
        <h2 className="text-sm font-semibold text-foreground">Assistente do AcompanhaAí</h2>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Olá! Como posso ajudar? Escolha uma dúvida ou escreva sua pergunta.
        </p>
      </div>

      <div
        ref={listRef}
        aria-live="polite"
        className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-5"
      >
        {messages.length === 0 ? (
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((suggestion) => (
              <Button
                key={suggestion}
                type="button"
                variant="outline"
                size="sm"
                className="h-auto min-h-8 whitespace-normal py-2 text-left"
                onClick={() => void send(suggestion)}
                disabled={loading}
              >
                {suggestion}
              </Button>
            ))}
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
                    ? "max-w-[88%] break-words rounded-lg bg-primary px-3 py-2 text-sm leading-6 text-primary-foreground"
                    : "max-w-[92%] break-words rounded-lg bg-muted px-3 py-3 text-sm leading-6 text-foreground [&_a]:text-primary [&_a]:underline [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5"
                }
              >
                {message.content ? (
                  message.role === "assistant" ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                  ) : (
                    message.content
                  )
                ) : (
                  "…"
                )}
              </div>
            </div>
          ))
        )}
        {loading ? (
          <p className="text-xs text-muted-foreground">O assistente está preparando uma resposta…</p>
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
          placeholder="Escreva sua dúvida"
          aria-label="Escreva sua dúvida"
          disabled={loading}
        />
        <Button type="submit" disabled={loading || !input.trim()}>
          Enviar
        </Button>
      </form>

      {error ? (
        <p className="px-4 pb-3 text-xs leading-5 text-destructive" role="alert">
          {error} Você pode tentar novamente ou reformular sua pergunta.
        </p>
      ) : null}
    </div>
  );
}
