import React from 'react';
import * as XLSX from 'xlsx';
import { Button } from './ui/button';
import { FileSpreadsheet } from 'lucide-react';
import { SaleRecord, Product, TAX_CATEGORY_RATES, TAX_CATEGORY_LABELS, TaxCategory } from '../types';
import { calculateTotalsFromItems } from '../lib/invoiceService';

// Plantilla para CREAR productos nuevos — sin columna "Código" (se genera automático).
const NEW_TEMPLATE_HEADERS = [
  'Nombre', 'Marca', 'Categoría', 'Precio', 'Costo',
  'Stock', 'Stock Mínimo', 'Categoría IVA',
];

// Plantilla para EXPORTAR productos existentes — incluye "Código" porque ya existen.
const EXPORT_TEMPLATE_HEADERS = [
  'Nombre', 'Marca', 'Código', 'Categoría', 'Precio', 'Costo',
  'Stock', 'Stock Mínimo', 'Categoría IVA',
];

const TAX_CATEGORY_HELP = 'Valores válidos: general (19%), reducido (5%), exento (0%), excluido (sin IVA)';

/**
 * Plantilla vacía con 2 filas de ejemplo para crear inventario desde cero.
 * No incluye columna "Código" — se genera automáticamente al importar.
 */
export function downloadProductTemplate() {
  const ws = XLSX.utils.aoa_to_sheet([
    NEW_TEMPLATE_HEADERS,
    ['Camiseta Básica', 'Nike', 'Ropa', 45000, 28000, 30, 5, 'general'],
    ['Pantalón Jean', 'Levi\'s', 'Ropa', 120000, 75000, 15, 3, 'general'],
  ]);
  // Comentario con ayuda en la cabecera "Categoría IVA" (col H = índice 8)
  if (!ws['H1'].c) ws['H1'].c = [];
  ws['H1'].c.push({ a: 'StockMaster', t: TAX_CATEGORY_HELP });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Productos');
  XLSX.writeFile(wb, 'plantilla_productos.xlsx');
}

/**
 * Descarga la plantilla pre-llenada con los productos actuales. Útil para
 * editar masivamente en Excel y re-importar. Respeta el filtro recibido.
 * Aquí sí mantenemos "Código" porque son productos que ya existen.
 */
export function downloadProductTemplateWithData(products: Product[], fileName = 'plantilla_productos_actuales.xlsx') {
  const rows: (string | number)[][] = [EXPORT_TEMPLATE_HEADERS];
  for (const p of products) {
    const cat: TaxCategory = p.taxCategory || 'general';
    rows.push([
      p.name,
      p.brand,
      p.code,
      p.category,
      p.price,
      p.costPrice ?? '',
      p.quantity,
      p.minStockLevel,
      cat,
    ]);
  }
  const ws = XLSX.utils.aoa_to_sheet(rows);
  // "Categoría IVA" está en columna I (índice 9) cuando hay columna Código
  if (!ws['I1'].c) ws['I1'].c = [];
  ws['I1'].c.push({ a: 'StockMaster', t: TAX_CATEGORY_HELP });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Productos');
  XLSX.writeFile(wb, fileName);
}

interface ExcelExportProps {
  data: any[];
  fileName: string;
  sheetName: string;
  buttonText?: string;
}

export function ExcelExport({ data, fileName, sheetName, buttonText = "Exportar Excel" }: ExcelExportProps) {
  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  };

  return (
    <Button variant="outline" size="sm" onClick={exportToExcel} className="gap-2">
      <FileSpreadsheet size={16} />
      {buttonText}
    </Button>
  );
}

/**
 * Aplana ventas para exportar a Excel. Incluye subtotal e IVA — base para
 * declaración de renta / soporte tributario.
 */
export function prepareSalesForExport(sales: SaleRecord[]) {
  return sales.map(sale => {
    // Si la venta vieja no tiene subtotal/taxAmount guardados, los recalculamos.
    const totals = (sale.subtotal != null && sale.taxAmount != null)
      ? { subtotal: sale.subtotal, taxAmount: sale.taxAmount }
      : calculateTotalsFromItems(sale.items);
    return {
      Factura: sale.invoiceNumber || sale.id,
      Fecha: new Date(sale.date).toLocaleString('es-CO'),
      Cliente: sale.customer?.fullName || 'Anónimo',
      Identificación: sale.customer?.idNumber || '',
      Productos: sale.items.map(i => `${i.productName} (x${i.quantity})`).join('; '),
      Unidades: sale.items.reduce((acc, i) => acc + i.quantity, 0),
      Subtotal: totals.subtotal,
      IVA: totals.taxAmount,
      Total: sale.totalAmount,
    };
  });
}

/**
 * Desglose por categoría tributaria del período (para declaración de renta).
 */
export function prepareTaxBreakdownForExport(sales: SaleRecord[]) {
  const buckets: Record<string, { base: number; iva: number; ventas: number }> = {};
  for (const sale of sales) {
    for (const item of sale.items) {
      const cat: TaxCategory = item.taxCategory || 'general';
      const rate = item.taxRate ?? TAX_CATEGORY_RATES[cat];
      const subtotal = item.totalPrice / (1 + rate);
      const tax = item.totalPrice - subtotal;
      if (!buckets[cat]) buckets[cat] = { base: 0, iva: 0, ventas: 0 };
      buckets[cat].base += subtotal;
      buckets[cat].iva += tax;
      buckets[cat].ventas += item.totalPrice;
    }
  }
  return Object.entries(buckets).map(([cat, v]) => ({
    Categoría: TAX_CATEGORY_LABELS[cat as TaxCategory] || cat,
    'Base Gravable': Math.round(v.base),
    IVA: Math.round(v.iva),
    'Ventas Brutas': Math.round(v.ventas),
  }));
}

export function prepareInventoryForExport(products: Product[]) {
  return products.map(p => {
    const cat: TaxCategory = p.taxCategory || 'general';
    return {
      Código: p.code,
      Nombre: p.name,
      Marca: p.brand,
      Categoría: p.category,
      Precio: p.price,
      Costo: p.costPrice ?? '',
      Stock: p.quantity,
      'Stock Mínimo': p.minStockLevel,
      'Categoría IVA': cat,
      'Tarifa IVA': `${((p.taxRate ?? TAX_CATEGORY_RATES[cat]) * 100).toFixed(0)}%`,
      'Valor Inventario': p.price * p.quantity,
    };
  });
}

/**
 * Exporta ventas con desglose tributario en hojas separadas: "Ventas" (detalle)
 * y "Impuestos" (consolidado por categoría DIAN).
 */
export function exportSalesWorkbook(sales: SaleRecord[], fileName: string) {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(prepareSalesForExport(sales)),
    'Ventas',
  );
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(prepareTaxBreakdownForExport(sales)),
    'Impuestos',
  );
  XLSX.writeFile(wb, fileName);
}
