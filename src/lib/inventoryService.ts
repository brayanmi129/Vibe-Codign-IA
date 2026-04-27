import { GoogleGenAI } from "@google/genai";
import { Product, SaleRecord, AIInsight, Expense, InventoryAnalytics, InventoryStats } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

// ─── AI Brand Color Suggestion ────────────────────────────────────

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
  if (!process.env.GEMINI_API_KEY) return null;

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

  // Expense analysis
  const expensesToday = expenses.filter(e => e.date.startsWith(todayStr)).reduce((acc, e) => acc + e.amount, 0);
  const expenses7d = expenses.filter(e => new Date(e.date) >= last7).reduce((acc, e) => acc + e.amount, 0);
  
  // Basic profit estimate (revenue - product cost - expenses)
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
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)
    .map(p => `${p.name} (${p.qty} uds · $${p.revenue.toLocaleString('es-CO')} COP)`);

  const deadProducts = products.filter(p =>
    !sales.some(s => new Date(s.date) >= last7 && s.items.some(i => i.productId === p.id)) && p.quantity > 0
  ).map(p => p.name).slice(0, 5);

  const avgSaleValue = sales.length > 0 ? (sales.reduce((acc, s) => acc + s.totalAmount, 0) / sales.length) : 0;

  // Busiest day of week
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
  if (!process.env.GEMINI_API_KEY) {
    return "⚠️ La IA no está configurada. Agrega tu GEMINI_API_KEY en el panel de Secrets.";
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

export async function analyzeProductImage(imageBase64: string): Promise<Partial<Product> | null> {
  if (!process.env.GEMINI_API_KEY) return null;

  const prompt = `Analiza esta imagen de un producto para un sistema de inventario. 
Extrae la siguiente información y devuélvela SOLO en formato JSON:
{
  "name": "Nombre sugerido del producto",
  "brand": "Marca (si es visible)",
  "category": "Categoría (ej: Bebidas, Snacks, Electrónica, Ropa, etc.)",
  "price": 0, // Precio sugerido al consumidor (un número estimado si es común)
  "minStockLevel": 5, // Nivel mínimo sugerido
  "description": "Breve descripción de lo que ves"
}
Si no estás seguro de algo, deja el campo vacío o con un valor predeterminado coherente.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [
        { text: prompt },
        { inlineData: { mimeType: "image/jpeg", data: imageBase64 } }
      ],
      config: { responseMimeType: "application/json" },
    });
    return JSON.parse(response.text || "{}") as Partial<Product>;
  } catch (error) {
    console.error("Vision Analysis Error:", error);
    return null;
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
