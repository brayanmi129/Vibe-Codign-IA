import { GoogleGenAI } from "@google/genai";
import { Product, SaleRecord, AIInsight, Expense, TaxCategory, TAX_CATEGORY_RATES } from "../types";
import {
  groqGenerateText, groqGenerateVision, isGroqConfigured,
  GroqTextMessage,
} from "./groqClient";

// ────────────────────────────────────────────────────────────────────
// PROVEEDORES — Groq primario, Gemini como fallback opcional.
//
// Estrategia: si GROQ_API_KEY está configurada, todo pasa por Groq.
// Si Groq falla (red, 429, etc.) y GEMINI_API_KEY también está configurada,
// se reintenta con Gemini. Si los dos fallan, devolvemos null/mensaje.
//
// Esto te quita la dependencia exclusiva de Google y resuelve el limit:0
// que viene cuando un proyecto Google está bloqueado en free tier.
// ────────────────────────────────────────────────────────────────────

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const isGeminiConfigured = (): boolean => Boolean(GEMINI_API_KEY);
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

export const isAIConfigured = (): boolean => isGroqConfigured() || isGeminiConfigured();

// ── Wrapper texto: Groq → fallback Gemini ──────────────────────────
interface AITextOptions {
  systemPrompt?: string;
  userPrompt: string;
  history?: GroqTextMessage[];
  jsonMode?: boolean;
  maxTokens?: number;
  temperature?: number;
}

async function aiText(opts: AITextOptions): Promise<string | null> {
  // 1) Intento Groq
  if (isGroqConfigured()) {
    try {
      return await groqGenerateText(opts);
    } catch (err) {
      console.warn("[AI] Groq failed, trying Gemini fallback:", err);
    }
  }
  // 2) Fallback Gemini
  if (isGeminiConfigured()) {
    try {
      // Gemini soporta history como `contents` con role+parts.
      const contents = [
        ...(opts.history || []).map(m => ({
          role: m.role === 'assistant' ? 'model' : m.role,
          parts: [{ text: m.content }],
        })),
        { role: 'user' as const, parts: [{ text: opts.userPrompt }] },
      ];
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents,
        config: {
          systemInstruction: opts.systemPrompt,
          maxOutputTokens: opts.maxTokens ?? 600,
          ...(opts.jsonMode ? { responseMimeType: "application/json" } : {}),
        },
      });
      return response.text || "";
    } catch (err) {
      console.error("[AI] Gemini also failed:", err);
    }
  }
  return null;
}

// ── Wrapper visión: Groq Llama Scout → fallback Gemini ────────────
interface AIVisionOptions {
  prompt: string;
  imageBase64: string;
  mimeType?: string;
  jsonMode?: boolean;
  maxTokens?: number;
}

async function aiVision(opts: AIVisionOptions): Promise<string | null> {
  if (isGroqConfigured()) {
    try {
      return await groqGenerateVision(opts);
    } catch (err) {
      console.warn("[AI Vision] Groq failed, trying Gemini fallback:", err);
    }
  }
  if (isGeminiConfigured()) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: [
          { text: opts.prompt },
          { inlineData: { mimeType: opts.mimeType || "image/jpeg", data: opts.imageBase64 } },
        ],
        config: opts.jsonMode ? { responseMimeType: "application/json" } : {},
      });
      return response.text || "";
    } catch (err) {
      console.error("[AI Vision] Gemini also failed:", err);
    }
  }
  return null;
}

// Helper: extrae JSON aunque venga envuelto en ```json ... ```
const extractJson = (text: string): string => {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  return text.trim();
};

// ────────────────────────────────────────────────────────────────────
// AI Brand Color Suggestion
// ────────────────────────────────────────────────────────────────────

export interface BrandColorSuggestion {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  textSecondaryColor: string;
  textAccentColor: string;
  fontFamily: string;
}

export async function suggestBrandColors(description: string, businessType: string): Promise<BrandColorSuggestion | null> {
  if (!isAIConfigured()) return null;

  const prompt = `Eres un experto en branding y diseño UI para apps de negocios latinoamericanos.
Sugiere una paleta de colores y una tipografía adecuada para este negocio. Devuelve SOLO JSON con exactamente estos campos:
{
  "primaryColor": "#xxxxxx",
  "secondaryColor": "#xxxxxx",
  "backgroundColor": "#xxxxxx",
  "textColor": "#xxxxxx",
  "textSecondaryColor": "#xxxxxx",
  "textAccentColor": "#xxxxxx",
  "fontFamily": "Nombre de la fuente, sans-serif"
}

Categorías de fuentes recomendadas (elige una que encaje):
- 'Inter, sans-serif' (General, Neutra)
- 'Outfit, sans-serif' (Moderna, Amigable)
- 'Space Grotesk, sans-serif' (Tecnológica, Futurista)
- 'Playfair Display, serif' (Elegante, Lujo)
- 'JetBrains Mono, monospace' (Técnica, Detallista)
- 'Montserrat, sans-serif' (Corpórea, Sólida)
- 'Fraunces, serif' (Vintage, Artesanal)
- 'Syne, sans-serif' (Artística, Vanguardista)
- 'Lexend, sans-serif' (Educativa, Legible)
- 'Bricolage Grotesque, sans-serif' (Audaz, Moderna)

Tipo de negocio: ${businessType || "tienda general"}
Descripción: ${description || "negocio de retail en Colombia"}

Reglas de color:
- primaryColor: color vibrante de marca
- secondaryColor: tono complementario o análogo al principal
- backgroundColor: muy claro, ideal para fondo de app (mínimo #f0f0f0)
- textColor: oscuro para máxima legibilidad como texto principal (máximo #2a2a2a)
- textSecondaryColor: gris medio para textos secundarios (#555 - #777)
- textAccentColor: color destacado para links o labels, basado en la marca
- fontFamily: Una de las opciones mencionadas arriba que mejor represente al negocio.`;

  try {
    const text = await aiText({ userPrompt: prompt, jsonMode: true, maxTokens: 250 });
    if (!text) return null;
    const result = JSON.parse(extractJson(text));
    if (result.primaryColor && result.secondaryColor && result.backgroundColor) {
      return result as BrandColorSuggestion;
    }
    return null;
  } catch {
    return null;
  }
}

// ────────────────────────────────────────────────────────────────────
// AI Tax Category Suggestion (DIAN Colombia)
// ────────────────────────────────────────────────────────────────────

export interface TaxSuggestion {
  taxCategory: TaxCategory;
  taxRate: number;
  reasoning: string;
  confidence: 'alta' | 'media' | 'baja';
}

export async function suggestProductTax(
  productName: string,
  category?: string,
  description?: string
): Promise<TaxSuggestion | null> {
  if (!isAIConfigured()) return null;
  if (!productName?.trim()) return null;

  const prompt = `Eres un experto contable colombiano especializado en IVA según el Estatuto Tributario DIAN.
Clasifica este producto en UNA de estas 4 categorías:

1. "excluido" — NO causa IVA. Ejemplos: medicamentos, servicios médicos, libros, cuadernos escolares,
   transporte público, energía eléctrica residencial, agua potable, internet residencial estratos 1-3.

2. "exento" — Gravado al 0% (tarifa cero, da derecho a devolución de IVA).
   Ejemplos: leche, huevos, carne fresca de res/cerdo/pollo, pescado fresco, queso fresco,
   fórmulas lácteas para bebés, exportaciones.

3. "reducido" — Tarifa especial del 5%. Ejemplos: café tostado o molido, chocolate de mesa,
   azúcar, sal, pastas alimenticias, harina de trigo, aceites comestibles, sardinas/atún enlatado,
   bicicletas hasta cierto valor, productos para discapacitados.

4. "general" — Tarifa estándar del 19%. La GRAN MAYORÍA de productos: bebidas azucaradas,
   gaseosas, snacks empacados, ropa, electrónica, electrodomésticos, perfumería, licor,
   repuestos, herramientas, juguetes, restaurantes, etc.

REGLAS:
- Si tienes duda, prefiere "general" (es lo más común y seguro fiscalmente).
- Productos procesados/empacados rara vez son exentos o excluidos.
- Bebidas con azúcar añadida son "general" 19%.
- "Confidence: baja" si el nombre es ambiguo o genérico (ej: "Producto X").

Producto a clasificar:
- Nombre: ${productName}
- Categoría comercial: ${category || 'sin especificar'}
- Descripción: ${description || 'sin especificar'}

Responde SOLO con JSON válido en este formato exacto:
{
  "taxCategory": "excluido" | "exento" | "reducido" | "general",
  "reasoning": "1-2 frases citando la regla DIAN aplicable",
  "confidence": "alta" | "media" | "baja"
}`;

  try {
    const text = await aiText({ userPrompt: prompt, jsonMode: true, maxTokens: 250 });
    if (!text) return null;
    const result = JSON.parse(extractJson(text));
    const cat = result.taxCategory as TaxCategory;
    if (!cat || !(cat in TAX_CATEGORY_RATES)) return null;
    return {
      taxCategory: cat,
      taxRate: TAX_CATEGORY_RATES[cat],
      reasoning: typeof result.reasoning === 'string' ? result.reasoning : '',
      confidence: (result.confidence === 'alta' || result.confidence === 'baja')
        ? result.confidence
        : 'media',
    };
  } catch (error) {
    console.error("Tax suggestion error:", error);
    return null;
  }
}

// ────────────────────────────────────────────────────────────────────
// Chat Assistant (ARIA)
// ────────────────────────────────────────────────────────────────────

function prepareBusinessContext(products: Product[], sales: SaleRecord[], expenses: Expense[] = [], storeDescription?: string): string {
  const now = new Date();
  const last7 = new Date(now); last7.setDate(now.getDate() - 7);
  const last30 = new Date(now); last30.setDate(now.getDate() - 30);
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
  const todayStr = now.toISOString().split('T')[0];
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const todaySales = sales.filter(s => s.date.startsWith(todayStr));
  const yesterdaySales = sales.filter(s => s.date.startsWith(yesterdayStr));
  const recentSales = sales.filter(s => new Date(s.date) >= last7);
  const monthlySales = sales.filter(s => new Date(s.date) >= last30);

  const revenue7d = recentSales.reduce((acc, s) => acc + s.totalAmount, 0);
  const revenue30d = monthlySales.reduce((acc, s) => acc + s.totalAmount, 0);
  const revenueToday = todaySales.reduce((acc, s) => acc + s.totalAmount, 0);
  const revenueYesterday = yesterdaySales.reduce((acc, s) => acc + s.totalAmount, 0);

  const expensesToday = expenses.filter(e => e.date.startsWith(todayStr)).reduce((acc, e) => acc + e.amount, 0);

  const totalCostOfProductsSold = sales.reduce((acc, sale) => {
    return acc + sale.items.reduce((itemAcc, item) => {
      const p = products.find(prod => prod.id === item.productId);
      return itemAcc + (item.quantity * (p?.costPrice || 0));
    }, 0);
  }, 0);
  const netProfitTotal = sales.reduce((acc, s) => acc + s.totalAmount, 0) - totalCostOfProductsSold - expenses.reduce((acc, e) => acc + e.amount, 0);

  const lowStock = products.filter(p => p.quantity > 0 && p.quantity <= p.minStockLevel);
  const outOfStock = products.filter(p => p.quantity === 0);
  const totalInventoryValue = products.reduce((acc, p) => acc + (p.price * p.quantity), 0);

  const productVolume: Record<string, { qty: number; revenue: number; name: string }> = {};
  sales.forEach(s => {
    s.items.forEach(item => {
      if (!productVolume[item.productId]) productVolume[item.productId] = { qty: 0, revenue: 0, name: item.productName };
      productVolume[item.productId].qty += item.quantity;
      productVolume[item.productId].revenue += item.totalPrice;
    });
  });
  const topProducts = Object.values(productVolume)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)
    .map(p => `${p.name} (${p.qty} uds · $${p.revenue.toLocaleString('es-CO')} COP)`);

  const deadProducts = products.filter(p =>
    !sales.some(s => new Date(s.date) >= last7 && s.items.some(i => i.productId === p.id)) && p.quantity > 0
  ).map(p => p.name).slice(0, 5);

  const avgSaleValue = sales.length > 0 ? (sales.reduce((acc, s) => acc + s.totalAmount, 0) / sales.length) : 0;

  const dayRevenue: Record<string, number> = {};
  sales.forEach(s => {
    const day = new Date(s.date).toLocaleDateString('es-CO', { weekday: 'long' });
    dayRevenue[day] = (dayRevenue[day] || 0) + s.totalAmount;
  });
  const busiestDay = Object.entries(dayRevenue).sort((a, b) => b[1] - a[1])[0]?.[0] || 'sin datos';

  return `
=== DATOS DEL NEGOCIO EN TIEMPO REAL ===
Descripción: ${storeDescription || "Tienda general"}
Fecha/hora: ${now.toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}

📦 INVENTARIO:
- Productos activos: ${products.length} (valor total PVP: $${totalInventoryValue.toLocaleString('es-CO')} COP)
- Stock bajo (≤ mínimo): ${lowStock.length} → ${lowStock.map(p => `${p.name} (${p.quantity} restantes, mín: ${p.minStockLevel})`).join(', ') || 'ninguno'}
- Agotados: ${outOfStock.length} → ${outOfStock.map(p => p.name).join(', ') || 'ninguno'}
- Sin ventas esta semana: ${deadProducts.join(', ') || 'ninguno'}

💰 VENTAS Y FINANZAS:
- Hoy (Ingresos): $${revenueToday.toLocaleString('es-CO')} COP (${todaySales.length} transacciones)
- Hoy (Gastos): $${expensesToday.toLocaleString('es-CO')} COP
- Ayer (Ingresos): $${revenueYesterday.toLocaleString('es-CO')} COP
- Últimos 7 días: $${revenue7d.toLocaleString('es-CO')} COP
- Últimos 30 días: $${revenue30d.toLocaleString('es-CO')} COP
- Utilidad Neta Total: $${netProfitTotal.toLocaleString('es-CO')} COP
- Ticket promedio: $${Math.round(avgSaleValue).toLocaleString('es-CO')} COP
- Día más activo: ${busiestDay}
- Top 5 por ingresos: ${topProducts.join(' | ') || 'sin ventas'}
- Total histórico: ${sales.length} ventas
=========================================`;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export async function askAIAssistant(
  userMessage: string,
  products: Product[],
  sales: SaleRecord[],
  storeDescription?: string,
  history: ChatMessage[] = [],
  expenses: Expense[] = []
): Promise<string> {
  if (!isAIConfigured()) {
    return "⚠️ La IA no está configurada. Agrega GROQ_API_KEY (recomendado) o GEMINI_API_KEY en tu archivo .env";
  }

  const systemInstruction = `Eres ARIA — Asistente de Retail con Inteligencia Artificial, especializada en negocios colombianos y latinoamericanos.

PERSONALIDAD:
- Eres directa, analítica y orientada a resultados, pero con un tono cálido y motivador.
- No das consejos genéricos. SIEMPRE usas los datos reales del negocio.
- Si ves un problema urgente (stock crítico, caída de ventas, producto estancado), lo dices claramente y propones una acción concreta.
- Eres creativa: sugiere estrategias de promoción, precios psicológicos, combos, épocas del año relevantes para Colombia.
- Cuando calculas algo, muestra el número exacto. Nada de "probablemente" si tienes los datos.
- Usas emojis con moderación para hacer la respuesta más legible (máx 2-3 por respuesta).

FORMATO:
- Respuestas concisas: máximo 4 párrafos O una lista corta con acción clara.
- Dinero siempre en COP con formato local (ej: $1.250.000 COP).
- Si hay múltiples problemas, los priorizas por impacto en el negocio.
- Termina con UNA pregunta de seguimiento relevante cuando aplique.

${prepareBusinessContext(products, sales, expenses, storeDescription)}`;

  // Convertir historia al formato del wrapper (role assistant para el modelo)
  const groqHistory: GroqTextMessage[] = history.map(m => ({
    role: m.role === 'model' ? 'assistant' : 'user',
    content: m.content,
  }));

  const text = await aiText({
    systemPrompt: systemInstruction,
    userPrompt: userMessage,
    history: groqHistory,
    maxTokens: 600,
    temperature: 0.7,
  });

  if (!text) {
    return "Hubo un error al contactar la IA. Verifica tu API key (GROQ_API_KEY o GEMINI_API_KEY) en .env";
  }
  return text.trim();
}

// ────────────────────────────────────────────────────────────────────
// Vision: analizar imagen de producto
// ────────────────────────────────────────────────────────────────────

export async function analyzeProductImage(imageBase64: string): Promise<Partial<Product> | null> {
  if (!isAIConfigured()) return null;

  const prompt = `Analiza esta imagen de un producto para un sistema de inventario en Colombia.
Extrae la siguiente información y devuélvela SOLO en formato JSON:
{
  "name": "Nombre sugerido del producto",
  "brand": "Marca (si es visible)",
  "category": "Categoría (ej: Bebidas, Snacks, Electrónica, Ropa, etc.)",
  "price": 0,
  "minStockLevel": 5,
  "taxCategory": "excluido" | "exento" | "reducido" | "general",
  "description": "Breve descripción de lo que ves"
}

Para taxCategory usa estas reglas DIAN Colombia:
- "excluido": medicamentos, libros, transporte público, agua, energía residencial.
- "exento": leche, huevos, carne/pescado fresco, fórmula infantil.
- "reducido" (5%): café, chocolate, azúcar, sal, aceites, pastas, harina, atún enlatado.
- "general" (19%): la mayoría — bebidas azucaradas, snacks, ropa, electrónica, etc.
Si dudas, usa "general".

Si no estás seguro de algo, deja el campo vacío o con un valor predeterminado coherente.`;

  try {
    const text = await aiVision({
      prompt,
      imageBase64,
      mimeType: "image/jpeg",
      jsonMode: true,
      maxTokens: 400,
    });
    if (!text) return null;
    const raw = JSON.parse(extractJson(text)) as Partial<Product> & { taxCategory?: TaxCategory };
    if (raw.taxCategory && raw.taxCategory in TAX_CATEGORY_RATES) {
      raw.taxRate = TAX_CATEGORY_RATES[raw.taxCategory];
    }
    return raw;
  } catch (error) {
    console.error("Vision Analysis Error:", error);
    return null;
  }
}

// ────────────────────────────────────────────────────────────────────
// AI Insights — Replenishment & Business Analysis
// ────────────────────────────────────────────────────────────────────

export async function getAIReplenishmentSuggestions(products: Product[], sales: SaleRecord[], storeDescription?: string): Promise<AIInsight[]> {
  if (!isAIConfigured()) {
    return [{
      type: 'replenishment',
      title: "Configuración requerida",
      description: "Agrega GROQ_API_KEY (gratis, sin tarjeta) o GEMINI_API_KEY en tu .env para activar las sugerencias de IA.",
      priority: 'medium'
    }];
  }

  const prompt = `Actúa como un experto en gestión de inventarios. Analiza los siguientes productos y su historial de ventas reciente para sugerir reposiciones.

Contexto del negocio: ${storeDescription || "Tienda general"}
Productos: ${JSON.stringify(products.map(p => ({ id: p.id, name: p.name, brand: p.brand, code: p.code, stock: p.quantity, min: p.minStockLevel })))}
Ventas recientes: ${JSON.stringify(sales.slice(0, 50))}

Responde en formato JSON con un objeto que contenga una lista "insights". Cada insight debe tener:
- type: "replenishment"
- title: un título corto
- description: explicación detallada de por qué reponer y cuánto
- priority: "low", "medium" o "high"
- productId: el ID del producto (opcional)

Ejemplo: { "insights": [{ "type": "replenishment", "title": "...", "description": "...", "priority": "high" }] }`;

  try {
    const text = await aiText({ userPrompt: prompt, jsonMode: true, maxTokens: 800 });
    if (!text) return [];
    const result = JSON.parse(extractJson(text));
    const list = Array.isArray(result) ? result : (result.insights || [result]);
    return Array.isArray(list) ? list : [];
  } catch (error) {
    console.error("Error getting replenishment insights:", error);
    return [];
  }
}

export async function getAIBusinessAnalysis(products: Product[], sales: SaleRecord[], storeDescription?: string): Promise<AIInsight[]> {
  if (!isAIConfigured()) return [];

  const prompt = `Analiza el rendimiento del negocio basado en el inventario y ventas.

Contexto del negocio: ${storeDescription || "Tienda general"}
Productos: ${JSON.stringify(products.slice(0, 30))}
Ventas: ${JSON.stringify(sales.slice(0, 50))}

Genera insights estratégicos y dinámicos. Incluye comparaciones porcentuales si es posible (ej: "Ventas subieron X%").
Identifica productos de alta rotación o productos "muertos" (sin ventas).

Responde en formato JSON con un objeto que contenga una lista "insights" de tipo "analysis" o "prediction".
Cada insight debe tener:
- type: "analysis" | "prediction"
- title: título corto y llamativo
- description: análisis detallada, consejo de negocio o predicción de demanda
- priority: "low", "medium" o "high"

Ejemplo: { "insights": [{ "type": "analysis", "title": "...", "description": "...", "priority": "medium" }] }`;

  try {
    const text = await aiText({ userPrompt: prompt, jsonMode: true, maxTokens: 800 });
    if (!text) return [];
    const result = JSON.parse(extractJson(text));
    const list = Array.isArray(result) ? result : (result.insights || [result]);
    return Array.isArray(list) ? list : [];
  } catch (error) {
    console.error("Error getting business analysis:", error);
    return [];
  }
}
