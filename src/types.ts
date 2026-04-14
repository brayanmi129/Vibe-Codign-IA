export interface Product {
  id: string;
  name: string;
  code: string;
  brand: string;
  price: number;
  quantity: number;
  category: string;
  minStockLevel: number;
  lastUpdated: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface SaleRecord {
  id: string;
  items: SaleItem[];
  totalAmount: number;
  date: string;
  userId?: string;
}

export interface RestockRecord {
  id: string;
  productId: string;
  productName?: string;
  quantity: number;
  date: string;
}

export interface InventoryStats {
  totalProducts: number;
  totalValue: number;
  lowStockCount: number;
  outOfStockCount: number;
}

export interface AIInsight {
  type: 'replenishment' | 'analysis' | 'prediction';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  productId?: string;
}
