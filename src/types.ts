export type UserRole = 'admin' | 'employee' | 'viewer';

export interface Store {
  id: string;
  name: string;
  businessType?: string;
  description?: string;
  ownerId: string;
  createdAt: string;
  plan?: 'free' | 'pro';
  branding?: {
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
  };
}

export interface StoreMember {
  userId: string;
  role: UserRole;
  email: string;
  displayName?: string;
}

export interface Product {
  id: string;
  storeId: string;
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
  storeId: string;
  items: SaleItem[];
  totalAmount: number;
  date: string;
  userId: string;
}

export interface RestockRecord {
  id: string;
  storeId: string;
  productId: string;
  productName?: string;
  quantity: number;
  date: string;
  userId: string;
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
