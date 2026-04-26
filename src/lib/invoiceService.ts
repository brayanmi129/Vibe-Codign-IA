import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import emailjs from "@emailjs/browser";
import { SaleRecord, Store, Customer } from "../types";

/**
 * Servicio de facturación
 * Responsabilidad única: generar PDFs de factura y enviarlos por email.
 * No conoce nada de Firestore ni del estado de React.
 */

// ────────────────────────────────────────────────────────────────────
// CONFIGURACIÓN
// ────────────────────────────────────────────────────────────────────

export const TAX_RATE = 0.19; // IVA Colombia 19%

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
 * Calcula totales (subtotal, IVA, total) a partir de items.
 * Asume que los precios unitarios YA incluyen IVA.
 * Si en tu negocio los precios NO incluyen IVA, mira la nota al final del archivo.
 */
export const calculateTotals = (totalAmount: number) => {
  // Si los precios incluyen IVA: subtotal = total / (1 + tasa)
  const subtotal = totalAmount / (1 + TAX_RATE);
  const taxAmount = totalAmount - subtotal;
  return {
    subtotal: Math.round(subtotal),
    taxAmount: Math.round(taxAmount),
    total: totalAmount,
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

  const totals = calculateTotals(sale.totalAmount);

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
  const tableBody = sale.items.map((item) => [
    item.productName,
    String(item.quantity),
    formatCurrency(item.unitPrice / (1 + TAX_RATE)), // Valor unitario SIN IVA
    formatCurrency(item.totalPrice / (1 + TAX_RATE)), // Subtotal SIN IVA
  ]);

  autoTable(doc, {
    startY: 82,
    head: [["Descripción", "Cant.", "Vlr. Unit. (sin IVA)", "Subtotal"]],
    body: tableBody,
    theme: "striped",
    headStyles: {
      fillColor: [79, 70, 229],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    columnStyles: {
      0: { cellWidth: 90 },
      1: { cellWidth: 20, halign: "center" },
      2: { cellWidth: 35, halign: "right" },
      3: { cellWidth: 35, halign: "right" },
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

  y += 6;
  doc.text(`IVA (${(TAX_RATE * 100).toFixed(0)}%):`, totalsX, y);
  doc.text(formatCurrency(totals.taxAmount), valuesX, y, { align: "right" });

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
    const totals = calculateTotals(sale.totalAmount);

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
