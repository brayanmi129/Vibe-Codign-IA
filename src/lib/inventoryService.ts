import { GoogleGenAI } from "@google/genai";
import { Product, SaleRecord, AIInsight } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

// ─── AI Brand Color Suggestion ────────────────────────────────────

export interface BrandColorSuggestion {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  textSecondaryColor: string;
}

export async function suggestBrandColors(description: string, businessType: string): Promise<BrandColorSuggestion | null> {
  if (!process.env.GEMINI_API_KEY) return null;

  const prompt = `Eres un experto en branding y diseño UI para apps de negocios latinoamericanos.
Sugiere una paleta de 5 colores para este negocio. Devuelve SOLO JSON con exactamente estos campos en hex:
{
  "primaryColor": "#xxxxxx",
  "secondaryColor": "#xxxxxx",
  "backgroundColor": "#xxxxxx",
  "textColor": "#xxxxxx",
  "textSecondaryColor": "#xxxxxx"
}

Tipo de negocio: ${businessType || "tienda general"}
Descripción: ${description || "negocio de retail en Colombia"}

Reglas estrictas:
- primaryColor: color de marca vibrante y representativo del sector
- secondaryColor: tono complementario o análogo al principal
- backgroundColor: muy claro, ideal para fondo de app (mínimo #f0f0f0)
- textColor: oscuro para máxima legibilidad como texto en sidebar (máximo #2a2a2a)
- textSecondaryColor: gris suave para subtítulos (#555 - #888)`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: { responseMimeType: "application/json", maxOutputTokens: 150 },
    });
    const result = JSON.parse(response.text || "{}");
    if (result.primaryColor && result.secondaryColor && result.backgroundColor) return result as BrandColorSuggestion;
    return null;
  } catch {
    return null;
  }
}

// ─── Chat Assistant ────────────────────────────────────────────────

function prepareBusinessContext(products: Product[], sales: SaleRecord[], storeDescription?: string): string {
  const now = new Date();
  const last7 = new Date(now);
  last7.setDate(now.getDate() - 7);
  const last30 = new Date(now);
  last30.setDate(now.getDate() - 30);

  const recentSales = sales.filter(s => new Date(s.date) >= last7);
  const monthlySales = sales.filter(s => new Date(s.date) >= last30);
  const revenue7d = recentSales.reduce((acc, s) => acc + s.totalAmount, 0);
  const revenue30d = monthlySales.reduce((acc, s) => acc + s.totalAmount, 0);

  const lowStock = products.filter(p => p.quantity > 0 && p.quantity <= p.minStockLevel);
  const outOfStock = products.filter(p => p.quantity === 0);

  // Sales volume by product
  const productVolume: Record<string, { qty: number; revenue: number; name: string }> = {};
  sales.forEach(s => {
    s.items.forEach(item => {
      if (!productVolume[item.productId]) productVolume[item.productId] = { qty: 0, revenue: 0, name: item.productName };
      productVolume[item.productId].qty += item.quantity;
      productVolume[item.productId].revenue += item.totalPrice;
    });
  });
  const topProducts = Object.values(productVolume)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5)
    .map(p => `${p.name} (${p.qty} uds, $${p.revenue.toLocaleString('es-CO')} COP)`);

  const deadProducts = products.filter(p => {
    const hasSales = sales.some(s => s.items.some(i => i.productId === p.id));
    return !hasSales && p.quantity > 0;
  }).map(p => p.name).slice(0, 5);

  return `
=== CONTEXTO DEL NEGOCIO (datos en tiempo real) ===
Tipo de negocio: ${storeDescription || "Tienda general"}
Fecha actual: ${now.toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}

INVENTARIO:
- Total productos: ${products.length}
- Stock bajo (≤ mínimo): ${lowStock.length} productos → ${lowStock.map(p => `${p.name} (${p.quantity} restantes)`).join(', ') || 'ninguno'}
- Sin stock (agotados): ${outOfStock.length} → ${outOfStock.map(p => p.name).join(', ') || 'ninguno'}
- Productos sin ventas: ${deadProducts.join(', ') || 'ninguno'}

VENTAS:
- Ingresos últimos 7 días: $${revenue7d.toLocaleString('es-CO')} COP (${recentSales.length} transacciones)
- Ingresos últimos 30 días: $${revenue30d.toLocaleString('es-CO')} COP (${monthlySales.length} transacciones)
- Top 5 productos más vendidos: ${topProducts.join(' | ') || 'sin ventas'}
- Total ventas históricas: ${sales.length}
===================================================`;
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
  history: ChatMessage[] = []
): Promise<string> {
  if (!process.env.GEMINI_API_KEY) {
    return "⚠️ La IA no está configurada. Agrega tu GEMINI_API_KEY en el panel de Secrets.";
  }

  const systemInstruction = `Eres un asistente de negocios experto en retail, gestión de inventario y ventas para América Latina.
Tu objetivo es ayudar al dueño del negocio a tomar mejores decisiones estratégicas y operativas.
Siempre respondes en español de forma clara, concreta y útil. Evitas respuestas genéricas.
Usas los datos reales del negocio para dar consejos específicos y accionables.
Cuando menciones dinero usas pesos colombianos (COP).
Si detectas problemas urgentes (stock crítico, caída de ventas), los mencionas primero.
Tus respuestas son concisas: máximo 3-4 párrafos o una lista corta. No eres verboso.

${prepareBusinessContext(products, sales, storeDescription)}`;

  const contents = [
    ...history.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.content }],
    })),
    { role: 'user' as const, parts: [{ text: userMessage }] },
  ];

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents,
      config: {
        systemInstruction,
        maxOutputTokens: 600,
      },
    });
    return response.text?.trim() || "No pude generar una respuesta. Intenta de nuevo.";
  } catch (error: any) {
    console.error("AI chat error:", error);
    if (error?.message?.includes("API_KEY")) return "⚠️ API Key inválida o no configurada.";
    return "Hubo un error al contactar la IA. Verifica tu conexión e intenta de nuevo.";
  }
}

export async function getAIReplenishmentSuggestions(products: Product[], sales: SaleRecord[], storeDescription?: string): Promise<AIInsight[]> {
  if (!process.env.GEMINI_API_KEY) {
    return [{
      type: 'replenishment',
      title: "Configuración requerida",
      description: "Por favor, configura tu GEMINI_API_KEY para recibir sugerencias de IA.",
      priority: 'medium'
    }];
  }

  const prompt = `
    Actúa como un experto en gestión de inventarios. Analiza los siguientes productos y su historial de ventas reciente para sugerir reposiciones.
    
    Contexto del negocio: ${storeDescription || "Tienda general"}
    Productos: ${JSON.stringify(products.map(p => ({ id: p.id, name: p.name, brand: p.brand, code: p.code, stock: p.quantity, min: p.minStockLevel })))}
    Ventas recientes: ${JSON.stringify(sales)}
    
    Responde en formato JSON con una lista de insights. Cada insight debe tener:
    - type: "replenishment"
    - title: un título corto
    - description: explicación detallada de por qué reponer y cuánto
    - priority: "low", "medium" o "high"
    - productId: el ID del producto (opcional)
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const result = JSON.parse(response.text || "[]");
    return Array.isArray(result) ? result : [result];
  } catch (error) {
    console.error("Error calling Gemini:", error);
    return [];
  }
}

export async function getAIBusinessAnalysis(products: Product[], sales: SaleRecord[], storeDescription?: string): Promise<AIInsight[]> {
  if (!process.env.GEMINI_API_KEY) return [];

  const prompt = `
    Analiza el rendimiento del negocio basado en el inventario y ventas.
    
    Contexto del negocio: ${storeDescription || "Tienda general"}
    Productos: ${JSON.stringify(products)}
    Ventas: ${JSON.stringify(sales)}
    
    Genera insights estratégicos y dinámicos. Incluye comparaciones porcentuales si es posible (ej: "Ventas subieron X%").
    Identifica productos de alta rotación o productos "muertos" (sin ventas).
    
    Responde en formato JSON con una lista de insights de tipo "analysis" o "prediction".
    Cada insight debe tener:
    - type: "analysis" | "prediction"
    - title: título corto y llamativo
    - description: análisis detallada, consejo de negocio o predicción de demanda
    - priority: "low", "medium" o "high"
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const result = JSON.parse(response.text || "[]");
    return Array.isArray(result) ? result : [result];
  } catch (error) {
    console.error("Error calling Gemini:", error);
    return [];
  }
}
