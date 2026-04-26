import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { BrainCircuit, Send, Trash2, Sparkles } from "lucide-react";
import { askAIAssistant, ChatMessage } from "@/lib/inventoryService";
import { Product, SaleRecord } from "@/types";

interface AIPageProps {
  products: Product[];
  sales: SaleRecord[];
  storeDescription?: string;
}

const SUGGESTED_PROMPTS = [
  "¿Cuáles son los productos con mayor riesgo de agotarse pronto?",
  "¿Qué estrategia me recomiendas para aumentar las ventas esta semana?",
  "Analiza el rendimiento de mi negocio en los últimos 30 días.",
  "¿Hay productos que debería dejar de vender por baja rotación?",
  "¿Cuánto debería pedir en mi próximo pedido de reposición?",
  "Dame un resumen ejecutivo del estado actual de mi tienda.",
];

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2">
      <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
        <BrainCircuit className="w-4 h-4 text-indigo-600" />
      </div>
      <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
        <div className="flex gap-1 items-center h-4">
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-indigo-400"
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.15 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function AIPage({ products, sales, storeDescription }: AIPageProps) {
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const bottomRef = React.useRef<HTMLDivElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const userMsg: ChatMessage = { role: "user", content: trimmed };
    setMessages(prev => [...prev, userMsg]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await askAIAssistant(trimmed, products, sales, storeDescription, messages);
      setMessages(prev => [...prev, { role: "model", content: response }]);
    } catch {
      setMessages(prev => [...prev, { role: "model", content: "Hubo un error al procesar tu mensaje. Intenta de nuevo." }]);
    } finally {
      setIsLoading(false);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputValue);
    }
  };

  return (
    <motion.div
      key="ai"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-100 p-2 rounded-full">
            <BrainCircuit className="text-indigo-600 w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Asistente de Negocios</h3>
            <p className="text-slate-500 text-sm">Pregúntame sobre inventario, ventas y estrategia.</p>
          </div>
        </div>
        {messages.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 gap-1.5"
            onClick={() => setMessages([])}
          >
            <Trash2 size={14} />
            Limpiar
          </Button>
        )}
      </div>

      {/* Chat card — height fills remaining viewport */}
      <Card
        className="border-slate-200 shadow-sm overflow-hidden flex flex-col bg-slate-50"
        style={{ height: "calc(100svh - 300px)", minHeight: "420px" }}
      >
        {/* Messages scroll area */}
        <div ref={scrollAreaRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && !isLoading ? (
            <div className="h-full flex flex-col items-center justify-center gap-6 py-6">
              <div className="text-center space-y-2">
                <div className="mx-auto w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center">
                  <Sparkles className="text-indigo-500 w-7 h-7" />
                </div>
                <p className="text-slate-600 font-medium">¿En qué puedo ayudarte hoy?</p>
                <p className="text-slate-400 text-sm">Tengo acceso a tu inventario y ventas en tiempo real.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-xl">
                {SUGGESTED_PROMPTS.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(prompt)}
                    className="text-left text-xs text-slate-600 bg-white border border-slate-200 rounded-xl px-3 py-2.5 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 transition-all shadow-sm"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex items-end gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                >
                  {msg.role === "model" && (
                    <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 mb-0.5">
                      <BrainCircuit className="w-4 h-4 text-indigo-600" />
                    </div>
                  )}
                  <div
                    className={`max-w-[78%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${
                      msg.role === "user"
                        ? "bg-indigo-600 text-white rounded-br-sm"
                        : "bg-white border border-slate-200 text-slate-800 rounded-bl-sm"
                    }`}
                  >
                    {msg.content}
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <motion.div key="typing" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                  <TypingIndicator />
                </motion.div>
              )}
            </AnimatePresence>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input bar — always pinned at the bottom */}
        <div className="border-t border-slate-200 bg-white p-3 flex gap-2 items-end">
          <Textarea
            ref={textareaRef}
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe tu pregunta… (Enter para enviar, Shift+Enter para nueva línea)"
            className="resize-none min-h-[42px] max-h-[120px] bg-slate-50 border-slate-200 text-sm focus-visible:ring-indigo-400 flex-1"
            rows={1}
            disabled={isLoading}
          />
          <Button
            onClick={() => sendMessage(inputValue)}
            disabled={!inputValue.trim() || isLoading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white h-[42px] w-[42px] p-0 flex-shrink-0 rounded-xl"
          >
            <Send size={16} />
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}
