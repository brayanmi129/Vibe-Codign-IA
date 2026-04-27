import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, X, Send, RefreshCw, MessageSquare } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Textarea } from "./ui/textarea";
import { askAIAssistant, ChatMessage } from "@/lib/inventoryService";
import { Product, SaleRecord, Expense } from "@/types";

interface FloatingAIProps {
  products: Product[];
  sales: SaleRecord[];
  expenses?: Expense[];
  storeDescription?: string;
  storeName?: string;
}

export function FloatingAI({ products, sales, expenses = [], storeDescription, storeName }: FloatingAIProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const bottomRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        role: 'model',
        content: `¡Hola! Soy **ARIA**. ¿Necesitas ayuda con el inventario o las ventas de **${storeName || "tu tienda"}**? Pregúntame lo que quieras.`
      }]);
    }
  }, [isOpen, messages.length, storeName]);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const sendMessage = async () => {
    const text = inputValue.trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = { role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await askAIAssistant(text, products, sales, storeDescription, messages.slice(1), expenses);
      setMessages(prev => [...prev, { role: "model", content: response }]);
    } catch {
      setMessages(prev => [...prev, { role: "model", content: "Lo siento, tuve un error. Intenta de nuevo." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="mb-4"
          >
            <Card className="w-[380px] sm:w-[420px] h-[500px] shadow-2xl border-slate-200 overflow-hidden flex flex-col bg-white rounded-3xl">
              <CardHeader className="bg-gradient-to-br from-indigo-600 to-violet-700 text-white py-4 px-5 flex flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-2">
                  <Sparkles size={18} className="text-emerald-400" />
                  <CardTitle className="text-base font-bold">ARIA Assistant</CardTitle>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsOpen(false)}
                  className="text-white hover:bg-white/20 h-8 w-8 rounded-full"
                >
                  <X size={18} />
                </Button>
              </CardHeader>
              
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
                {messages.map((msg, i) => (
                  <div 
                    key={i} 
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                        msg.role === 'user' 
                          ? 'bg-indigo-600 text-white rounded-br-none' 
                          : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'
                      }`}
                    >
                      {msg.content.split(/(\*\*[^*]+\*\*)/g).map((part, idx) => 
                        part.startsWith('**') && part.endsWith('**') 
                          ? <strong key={idx}>{part.slice(2, -2)}</strong> 
                          : part
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-none px-4 py-2 shadow-sm">
                      <RefreshCw size={14} className="animate-spin text-indigo-600" />
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </CardContent>

              <div className="p-3 bg-white border-t border-slate-100 flex gap-2">
                <Textarea 
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Formula tu pregunta..."
                  className="min-h-[44px] max-h-[120px] resize-none text-sm bg-slate-50 border-slate-200 rounded-2xl focus-visible:ring-indigo-500"
                  rows={1}
                />
                <Button 
                  onClick={sendMessage}
                  disabled={!inputValue.trim() || isLoading}
                  className="h-11 w-11 rounded-2xl bg-indigo-600 hover:bg-indigo-700 flex-shrink-0 p-0"
                >
                  <Send size={18} />
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={`h-14 w-14 rounded-full shadow-2xl transition-all duration-300 ${
          isOpen ? 'bg-slate-900 rotate-90' : 'bg-indigo-600 hover:scale-110 active:scale-95'
        }`}
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-5 w-5 bg-emerald-500 items-center justify-center">
              <Sparkles size={10} className="text-white" />
            </span>
          </span>
        )}
      </Button>
    </div>
  );
}
