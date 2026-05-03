import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import emailjs from "@emailjs/browser";
import { SaleRecord, SaleItem, Store, Customer } from "../types";

/**
 * Servicio de facturación
 * Responsabilidad única: generar PDFs de factura y enviarlos por email.
 * No conoce nada de Firestore ni del estado de React.
 */

// ────────────────────────────────────────────────────────────────────
// CONFIGURACIÓN
// ────────────────────────────────────────────────────────────────────

// Tarifa por defecto (legacy). Se usa solo cuando un item no tiene snapshot
// de taxRate y el producto tampoco tiene taxRate (productos creados antes
// de la migración tributaria).
export const TAX_RATE = 0.19;

// EmailJS: si quieres habilitar envío de correo automático,
// configura estas variables en tu archivo .env (raíz del proyecto):
//
//   VITE_EMAILJS_SERVICE_ID=service_xxxx
//   VITE_EMAILJS_TEMPLATE_ID=template_xxxx
//   VITE_EMAILJS_PUBLIC_KEY=xxxxxxxxxx
//
// Si NO las configuras, el sistema funciona igual: solo no envía emails.
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || "";
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || "";
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || "";

export const isEmailServiceConfigured = (): boolean => {
  return Boolean(EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID && EMAILJS_PUBLIC_KEY);
};

// ────────────────────────────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────────────────────────────

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (isoDate: string): string => {
  return new Date(isoDate).toLocaleString("es-CO", {
    dateStyle: "long",
    timeStyle: "short",
  });
};

/**
 * Genera el siguiente número de factura.
 * Formato: FAC-YYYYMMDD-XXXX (ej: FAC-20260425-0001)
 */
export const generateInvoiceNumber = (existingCount: number): string => {
  const today = new Date();
  const ymd = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`;
  const seq = String(existingCount + 1).padStart(4, "0");
  return `FAC-${ymd}-${seq}`;
};

/**
 * @deprecated Usa calculateTotalsFromItems para soportar IVA por producto.
 * Se mantiene por retrocompatibilidad — calcula como si todo fuera al 19%.
 */
export const calculateTotals = (totalAmount: number) => {
  const subtotal = totalAmount / (1 + TAX_RATE);
  const taxAmount = totalAmount - subtotal;
  return {
    subtotal: Math.round(subtotal),
    taxAmount: Math.round(taxAmount),
    total: totalAmount,
  };
};

/**
 * Resuelve la tasa de IVA aplicable a un item. Orden de precedencia:
 *   1. taxRate snapshot del item (lo que se guardó al vender).
 *   2. fallback al 19% (para items legacy sin snapshot).
 * NO leemos del producto vivo a propósito: la factura debe mostrar lo que
 * realmente pagó el cliente, no lo que diga el producto hoy.
 */
const resolveItemTaxRate = (item: SaleItem): number => {
  if (typeof item.taxRate === 'number') return item.taxRate;
  return TAX_RATE;
};

export interface TaxBreakdownEntry {
  rate: number;          // 0, 0.05, 0.19
  taxableBase: number;   // suma de subtotales sin IVA a esa tasa
  taxAmount: number;     // IVA causado a esa tasa
}

export interface InvoiceTotals {
  subtotal: number;      // suma de bases gravables (sin IVA)
  taxAmount: number;     // IVA total
  total: number;         // total a pagar
  breakdown: TaxBreakdownEntry[]; // desglose por tasa
}

/**
 * Calcula totales línea por línea respetando el IVA de cada producto.
 * Asume que unitPrice del item YA incluye IVA (precio al público).
 * Para cada item:
 *   subtotal_item = totalPrice / (1 + taxRate)
 *   iva_item     = totalPrice - subtotal_item
 *
 * Productos excluidos / exentos (taxRate = 0) → subtotal = totalPrice, iva = 0.
 */
export const calculateTotalsFromItems = (items: SaleItem[]): InvoiceTotals => {
  const buckets = new Map<number, TaxBreakdownEntry>();
  let totalSubtotal = 0;
  let totalTax = 0;
  let total = 0;

  for (const item of items) {
    const rate = resolveItemTaxRate(item);
    const subtotal = item.totalPrice / (1 + rate);
    const tax = item.totalPrice - subtotal;

    totalSubtotal += subtotal;
    totalTax += tax;
    total += item.totalPrice;

    const entry = buckets.get(rate) ?? { rate, taxableBase: 0, taxAmount: 0 };
    entry.taxableBase += subtotal;
    entry.taxAmount += tax;
    buckets.set(rate, entry);
  }

  const breakdown = Array.from(buckets.values())
    .map(b => ({
      rate: b.rate,
      taxableBase: Math.round(b.taxableBase),
      taxAmount: Math.round(b.taxAmount),
    }))
    .sort((a, b) => a.rate - b.rate);

  return {
    subtotal: Math.round(totalSubtotal),
    taxAmount: Math.round(totalTax),
    total: Math.round(total),
    breakdown,
  };
};

// ────────────────────────────────────────────────────────────────────
// GENERAR PDF
// ────────────────────────────────────────────────────────────────────

export interface InvoicePdfPayload {
  sale: SaleRecord;
  store: Store;
  customer: Customer;
}

/**
 * Genera el PDF de la factura y lo retorna como un objeto jsPDF.
 * El consumidor decide si descargarlo, mostrarlo o adjuntarlo a un email.
 */
export const generateInvoicePdf = (payload: InvoicePdfPayload): jsPDF => {
  const { sale, store, customer } = payload;
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const totals = calculateTotalsFromItems(sale.items);

  // ─── ENCABEZADO ───────────────────────────────────────────────────
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(store.legalName || store.name, 14, 20);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`NIT: ${store.nit || "Pendiente de configuración"}`, 14, 27);
  if (store.fiscalAddress) doc.text(store.fiscalAddress, 14, 32);
  if (store.fiscalPhone) doc.text(`Tel: ${store.fiscalPhone}`, 14, 37);

  // Caja de factura (lado derecho)
  doc.setDrawColor(79, 70, 229); // indigo-600
  doc.setLineWidth(0.5);
  doc.rect(140, 15, 55, 25);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(79, 70, 229);
  doc.text("FACTURA DE VENTA", 167.5, 22, { align: "center" });
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`N°: ${sale.invoiceNumber || sale.id}`, 167.5, 29, { align: "center" });
  doc.text(`Fecha: ${formatDate(sale.date)}`, 167.5, 35, { align: "center" });

  // Línea divisoria
  doc.setDrawColor(200, 200, 200);
  doc.line(14, 45, 196, 45);

  // ─── DATOS DEL CLIENTE ────────────────────────────────────────────
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("CLIENTE", 14, 53);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Nombre: ${customer.fullName}`, 14, 60);
  doc.text(`Cédula: ${customer.idNumber}`, 14, 66);
  if (customer.phone) doc.text(`Teléfono: ${customer.phone}`, 14, 72);
  if (customer.email) doc.text(`Email: ${customer.email}`, 110, 60);
  if (customer.address) doc.text(`Dirección: ${customer.address}`, 110, 66);

  // ─── TABLA DE PRODUCTOS ───────────────────────────────────────────
  // Columna IVA: muestra la tarifa aplicada por línea (ej "19%", "5%", "Excl.")
  const taxLabel = (rate: number, category?: string): string => {
    if (rate === 0) return category === 'exento' ? '0%' : 'Excl.';
    return `${(rate * 100).toFixed(0)}%`;
  };

  const tableBody = sale.items.map((item) => {
    const rate = typeof item.taxRate === 'number' ? item.taxRate : TAX_RATE;
    const unitWithoutTax = item.unitPrice / (1 + rate);
    const subtotalWithoutTax = item.totalPrice / (1 + rate);
    return [
      item.productName,
      String(item.quantity),
      taxLabel(rate, item.taxCategory),
      formatCurrency(unitWithoutTax),
      formatCurrency(subtotalWithoutTax),
    ];
  });

  autoTable(doc, {
    startY: 82,
    head: [["Descripción", "Cant.", "IVA", "Vlr. Unit. (sin IVA)", "Subtotal"]],
    body: tableBody,
    theme: "striped",
    headStyles: {
      fillColor: [79, 70, 229],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 16, halign: "center" },
      2: { cellWidth: 16, halign: "center" },
      3: { cellWidth: 34, halign: "right" },
      4: { cellWidth: 34, halign: "right" },
    },
  });

  // ─── PIE DE PÁGINA: TOTALES ───────────────────────────────────────
  // @ts-ignore - jspdf-autotable agrega esta propiedad en runtime
  const finalY = (doc as any).lastAutoTable.finalY || 100;

  const totalsX = 130;
  const valuesX = 196;
  let y = finalY + 10;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Subtotal:", totalsX, y);
  doc.text(formatCurrency(totals.subtotal), valuesX, y, { align: "right" });

  // Desglose por tasa (solo entradas con IVA > 0; excluido/exento se omiten para no saturar)
  for (const entry of totals.breakdown) {
    if (entry.taxAmount === 0) continue;
    y += 6;
    doc.text(`IVA (${(entry.rate * 100).toFixed(0)}%):`, totalsX, y);
    doc.text(formatCurrency(entry.taxAmount), valuesX, y, { align: "right" });
  }

  // Si hubo productos excluidos/exentos, indicarlo (es requisito DIAN diferenciarlo)
  const zeroBase = totals.breakdown
    .filter(e => e.rate === 0)
    .reduce((acc, e) => acc + e.taxableBase, 0);
  if (zeroBase > 0) {
    y += 6;
    doc.setTextColor(120, 120, 120);
    doc.text("Base excluida/exenta:", totalsX, y);
    doc.text(formatCurrency(zeroBase), valuesX, y, { align: "right" });
    doc.setTextColor(0, 0, 0);
  }

  y += 8;
  doc.setDrawColor(79, 70, 229);
  doc.line(totalsX, y - 4, valuesX, y - 4);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(79, 70, 229);
  doc.text("TOTAL:", totalsX, y);
  doc.text(formatCurrency(totals.total), valuesX, y, { align: "right" });

  // ─── NOTA LEGAL ───────────────────────────────────────────────────
  doc.setTextColor(120, 120, 120);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.text(
    "Documento generado electrónicamente. Conserve este comprobante.",
    105,
    285,
    { align: "center" }
  );

  return doc;
};

/**
 * Descarga el PDF al disco del usuario.
 */
export const downloadInvoicePdf = (payload: InvoicePdfPayload): void => {
  const doc = generateInvoicePdf(payload);
  const fileName = `${payload.sale.invoiceNumber || payload.sale.id}.pdf`;
  doc.save(fileName);
};

// ────────────────────────────────────────────────────────────────────
// ENVÍO DE EMAIL (vía EmailJS)
// ────────────────────────────────────────────────────────────────────

export interface SendEmailResult {
  success: boolean;
  message: string;
}

/**
 * Envía la factura por email al cliente usando EmailJS.
 * Si EmailJS no está configurado, retorna { success: false, message: '...' }
 * sin lanzar error.
 */
/**
 * Envía la factura por email al cliente usando EmailJS.
 *
 * NOTA: La versión gratuita de EmailJS NO permite adjuntos.
 * Por eso el correo lleva los datos de la factura en el cuerpo,
 * pero el PDF se descarga aparte desde el modal de confirmación.
 *
 * Si en el futuro quieres adjuntar el PDF, hay 2 opciones:
 *   1) Plan pago de EmailJS (~$5/mes) → reactivar la línea de pdf_attachment
 *   2) Migrar a Resend (gratis con adjuntos) → cambiar el servicio
 */
export const sendInvoiceByEmail = async (
  payload: InvoicePdfPayload
): Promise<SendEmailResult> => {
  const { sale, store, customer } = payload;

  if (!customer.email) {
    return { success: false, message: "El cliente no proporcionó email" };
  }

  if (!isEmailServiceConfigured()) {
    return {
      success: false,
      message: "Servicio de email no configurado (revisa variables VITE_EMAILJS_* en .env)",
    };
  }

  try {
    const totals = calculateTotalsFromItems(sale.items);

    // Construye el detalle de productos como texto (para incluir en el cuerpo)
    const itemsList = sale.items
      .map(
        (item) =>
          `• ${item.productName} × ${item.quantity} = ${formatCurrency(item.totalPrice)}`
      )
      .join("\n");

    const templateParams = {
      to_email: customer.email,
      to_name: customer.fullName,
      from_name: store.legalName || store.name,
      invoice_number: sale.invoiceNumber || sale.id,
      invoice_date: formatDate(sale.date),
      subtotal: formatCurrency(totals.subtotal),
      tax: formatCurrency(totals.taxAmount),
      total: formatCurrency(totals.total),
      items_list: itemsList,
      // pdf_attachment: NO se incluye porque el plan free de EmailJS no soporta adjuntos
    };

    await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams,
      { publicKey: EMAILJS_PUBLIC_KEY }
    );

    return {
      success: true,
      message: `Resumen de factura enviado a ${customer.email}. El PDF debe descargarse aparte.`,
    };
  } catch (error) {
    console.error("Error enviando email:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Error desconocido al enviar email",
    };
  }
};

// ────────────────────────────────────────────────────────────────────
// NOTA SOBRE IVA
// ────────────────────────────────────────────────────────────────────
// Esta implementación asume que los precios de los productos YA incluyen IVA
// (precio al público). El subtotal se calcula descomponiendo del total.
//
// Si en tu negocio los precios NO incluyen IVA y el IVA se suma encima,
// cambia las funciones calculateTotals y generateInvoicePdf así:
//
//   const subtotal = totalAmount;
//   const taxAmount = subtotal * TAX_RATE;
//   const total = subtotal + taxAmount;
//
// Pregúntale a tu compañero cómo manejan los precios para saber qué versión usar.
