import { GoogleGenAI } from "@google/genai";
import { Product, SaleRecord, AIInsight } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function getAIReplenishmentSuggestions(products: Product[], sales: SaleRecord[]): Promise<AIInsight[]> {
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

export async function getAIBusinessAnalysis(products: Product[], sales: SaleRecord[]): Promise<AIInsight[]> {
  if (!process.env.GEMINI_API_KEY) return [];

  const prompt = `
    Analiza el rendimiento del negocio basado en el inventario y ventas.
    Productos: ${JSON.stringify(products)}
    Ventas: ${JSON.stringify(sales)}
    
    Genera insights estratégicos y dinámicos. Incluye comparaciones porcentuales si es posible (ej: "Ventas subieron X%").
    Identifica productos de alta rotación o productos "muertos" (sin ventas).
    
    Responde en formato JSON con una lista de insights de tipo "analysis" o "prediction".
    Cada insight debe tener:
    - type: "analysis" | "prediction"
    - title: título corto y llamativo
    - description: análisis detallado, consejo de negocio o predicción de demanda
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
