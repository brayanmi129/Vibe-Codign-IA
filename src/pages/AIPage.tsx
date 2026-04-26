import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { BrainCircuit, Send, Trash2, Sparkles, Zap } from "lucide-react";
import { askAIAssistant, ChatMessage } from "@/lib/inventoryService";
import { Product, SaleRecord } from "@/types";

interface AIPageProps {
  products: Product[];
  sales: SaleRecord[];
  storeDescription?: string;
  storeName?: string;
}

function buildWelcomeMessage(products: Product[], sales: SaleRecord[], storeName?: string): string {
  const lowStock = products.filter(p => p.quantity > 0 && p.quantity <= p.minStockLevel);
  const outOfStock = products.filter(p => p.quantity === 0);
  const today = new Date().toISOString().split('T')[0];
  const todaySales = sales.filter(s => s.date.startsWith(today));
  const todayRevenue = todaySales.reduce((acc, s) => acc + s.totalAmount, 0);
  const last7 = new Date(); last7.setDate(last7.getDate() - 7);
  const weekRevenue = sales.filter(s => new Date(s.date) >= last7).reduce((acc, s) => acc + s.totalAmount, 0);

  const name = storeName ? `**${storeName}**` : 'tu negocio';
  let msg = `¡Hola! Soy **ARIA**, tu asistente de negocios con IA. Estoy monitoreando ${name} en tiempo real.\n\n`;

  if (products.length === 0) {
    msg += "Aún no tienes productos en el inventario. Cuando los agregues, podré darte análisis detallados y recomendaciones estratégicas. ¿Tienes alguna duda sobre cómo empezar?";
    return msg;
  }

  msg += `📦 **${products.length} productos** en inventario`;
  if (outOfStock.length > 0) msg += ` · 🔴 **${outOfStock.length} agotados**`;
  if (lowStock.length > 0) msg += ` · ⚠️ **${lowStock.length} con stock bajo**`;
  msg += "\n";

  if (todayRevenue > 0) {
    msg += `💰 Hoy: **$${todayRevenue.toLocaleString('es-CO')} COP** en ${todaySales.length} venta${todaySales.length !== 1 ? 's' : ''}\n`;
  } else {
    msg += `📊 Esta semana: **$${weekRevenue.toLocaleString('es-CO')} COP** · Hoy sin ventas aún\n`;
  }

  if (outOfStock.length > 0 || lowStock.length > 0) {
    msg += `\n⚡ **Atención urgente:** ${outOfStock.length > 0 ? `${outOfStock.length} producto${outOfStock.length > 1 ? 's agotados' : ' agotado'}` : ''}${outOfStock.length > 0 && lowStock.length > 0 ? ' y ' : ''}${lowStock.length > 0 ? `${lowStock.length} con stock crítico` : ''}. ¿Quieres que analice qué reponer primero?`;
  } else {
    msg += `\nTodo el inventario en buen estado. ¿En qué te puedo ayudar hoy?`;
  }

  return msg;
}

function buildDynamicPrompts(products: Product[], sales: SaleRecord[]): string[] {
  const prompts: string[] = [];
  const lowStock = products.filter(p => p.quantity > 0 && p.quantity <= p.minStockLevel);
  const outOfStock = products.filter(p => p.quantity === 0);
  const last7 = new Date(); last7.setDate(last7.getDate() - 7);
  const deadProducts = products.filter(p =>
    !sales.some(s => new Date(s.date) >= last7 && s.items.some(i => i.productId === p.id)) && p.quantity > 0
  );
  const today = new Date().toISOString().split('T')[0];
  const todaySales = sales.filter(s => s.date.startsWith(today));

  if (outOfStock.length > 0)
    prompts.push(`🚨 Tengo ${outOfStock.length} productos agotados. ¿Cuándo y cuánto repongo?`);
  if (lowStock.length > 0)
    prompts.push(`⚠️ ${lowStock.length} productos con stock bajo. Ayúdame a priorizar.`);
  if (deadProducts.length > 0)
    prompts.push(`📦 ${deadProducts.length} productos sin ventas esta semana. ¿Los descontinuamos?`);
  if (todaySales.length === 0)
    prompts.push("Hoy no hay ventas aún. ¿Qué estrategia puedo aplicar?");

  prompts.push("Dame un análisis completo de mi negocio.");
  prompts.push("¿Qué producto debería promocionar esta semana?");
  prompts.push("¿Cómo puedo aumentar el ticket promedio por venta?");
  prompts.push("Analiza mis precios y dime si debo ajustarlos.");
  prompts.push("¿Cuáles son mis productos más rentables?");
  prompts.push("Dame un plan de acción para mejorar mis ventas.");

  return prompts.slice(0, 6);
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2">
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0 shadow-sm">
        <Sparkles className="w-3.5 h-3.5 text-white" />
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

function MessageContent({ content }: { content: string }) {
  // Render **bold** markdown
  const parts = content.split(/(\*\*[^*]+\*\*)/g);
  return (
    <span className="whitespace-pre-wrap">
      {parts.map((part, i) =>
        part.startsWith('**') && part.endsWith('**')
          ? <strong key={i}>{part.slice(2, -2)}</strong>
          : part
      )}
    </span>
  );
}

export function AIPage({ products, sales, storeDescription, storeName }: AIPageProps) {
  const welcomeText = React.useMemo(
    () => buildWelcomeMessage(products, sales, storeName),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  const [messages, setMessages] = React.useState<ChatMessage[]>([
    { role: 'model', content: welcomeText },
  ]);
  const [inputValue, setInputValue] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const bottomRef = React.useRef<HTMLDivElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const dynamicPrompts = React.useMemo(() => buildDynamicPrompts(products, sales), [products, sales]);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;
    const userMsg: ChatMessage = { role: "user", content: trimmed };
    const historyWithoutWelcome = messages.slice(1); // exclude welcome message from history
    setMessages(prev => [...prev, userMsg]);
    setInputValue("");
    setIsLoading(true);
    try {
      const response = await askAIAssistant(trimmed, products, sales, storeDescription, historyWithoutWelcome);
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

  const handleClear = () => {
    setMessages([{ role: 'model', content: buildWelcomeMessage(products, sales, storeName) }]);
  };

  const showSuggestions = messages.length === 1; // only show after welcome message

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
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-200">
            <Sparkles className="text-white w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold">ARIA</h3>
              <span className="flex items-center gap-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                En línea
              </span>
            </div>
            <p className="text-slate-500 text-sm">Asistente de negocios con IA · Datos en tiempo real</p>
          </div>
        </div>
        {messages.length > 1 && (
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 gap-1.5"
            onClick={handleClear}
          >
            <Trash2 size={14} />
            Nueva conversación
          </Button>
        )}
      </div>

      {/* Chat card */}
      <Card
        className="border-slate-200 shadow-sm overflow-hidden flex flex-col bg-slate-50"
        style={{ height: "calc(100svh - 300px)", minHeight: "420px" }}
      >
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0 mb-0.5 shadow-sm">
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                    msg.role === "user"
                      ? "bg-indigo-600 text-white rounded-br-sm"
                      : "bg-white border border-slate-200 text-slate-800 rounded-bl-sm"
                  }`}
                >
                  <MessageContent content={msg.content} />
                </div>
              </motion.div>
            ))}

            {/* Dynamic suggestions after welcome */}
            {showSuggestions && (
              <motion.div
                key="suggestions"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="ml-9"
              >
                <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide mb-2">Preguntas sugeridas</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {dynamicPrompts.map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(prompt)}
                      className="text-left text-xs text-slate-600 bg-white border border-slate-200 rounded-xl px-3 py-2.5 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 transition-all shadow-sm"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {isLoading && (
              <motion.div key="typing" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <TypingIndicator />
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={bottomRef} />
        </div>

        {/* Input bar */}
        <div className="border-t border-slate-200 bg-white p-3 flex gap-2 items-end">
          <Textarea
            ref={textareaRef}
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pregúntale a ARIA... (Enter para enviar)"
            className="resize-none min-h-[42px] max-h-[120px] bg-slate-50 border-slate-200 text-sm focus-visible:ring-indigo-400 flex-1"
            rows={1}
            disabled={isLoading}
          />
          <Button
            onClick={() => sendMessage(inputValue)}
            disabled={!inputValue.trim() || isLoading}
            className="bg-gradient-to-br from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white h-[42px] w-[42px] p-0 flex-shrink-0 rounded-xl shadow-md shadow-indigo-200 disabled:opacity-50 disabled:shadow-none"
          >
            <Send size={16} />
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}
