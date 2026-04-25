import React from 'react';
import * as XLSX from 'xlsx';
import { Button } from './ui/button';
import { FileSpreadsheet } from 'lucide-react';
import { SaleRecord, Product } from '../types';

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

export function prepareSalesForExport(sales: SaleRecord[]) {
  return sales.map(sale => ({
    ID: sale.id,
    Fecha: new Date(sale.date).toLocaleString(),
    Total: sale.totalAmount,
    Usuario: sale.userId,
    Productos: sale.items.map(i => `${i.productName} (x${i.quantity})`).join(', ')
  }));
}

export function prepareInventoryForExport(products: Product[]) {
  return products.map(p => ({
    Código: p.code,
    Nombre: p.name,
    Marca: p.brand,
    Categoría: p.category,
    Precio: p.price,
    Stock: p.quantity,
    'Stock Mínimo': p.minStockLevel,
    Valor: p.price * p.quantity
  }));
}
