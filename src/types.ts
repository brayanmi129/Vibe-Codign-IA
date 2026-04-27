export type UserRole = 'admin' | 'employee';

export interface Branch {
  id: string;
  tenantId: string;
  name: string;
  address?: string;
  createdAt: string;
}

export interface Store {
  id: string;
  name: string;
  businessType?: string;
  description?: string;
  ownerId: string;
  createdAt: string;
  plan?: 'free' | 'pro';
  logoUrl?: string;
  legalName?: string;
  nit?: string;
  fiscalAddress?: string;
  fiscalPhone?: string;
  branding?: {
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
    textColor: string;
    textSecondaryColor: string;
    textAccentColor?: string;
    fontFamily?: string;
  };
}

export interface StoreMember {
  userId: string;
  storeId: string;
  role: UserRole;
  email: string;
  displayName?: string;
  joinedAt?: string;
  branchId?: string;
}

export interface Product {
  id: string;
  storeId: string;
  name: string;
  code: string;
  brand: string;
  price: number;
  costPrice?: number;
  imageUrl?: string;
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

// 🆕 NUEVO: datos del cliente para la factura
export interface Customer {
  fullName: string;       // Obligatorio
  idNumber: string;       // Obligatorio (cédula)
  phone?: string;         // Opcional
  address?: string;       // Opcional
  email?: string;         // Opcional
}

export interface SaleRecord {
  id: string;
  storeId: string;
  branchId?: string;
  items: SaleItem[];
  totalAmount: number;
  date: string;
  userId: string;
  customer?: Customer;
  subtotal?: number;
  taxRate?: number;
  taxAmount?: number;
  invoiceNumber?: string;
  invoicePdfUrl?: string;
  emailSent?: boolean;
  payments?: PaymentRecord[];   // 🆕 AÑADIR ESTA LÍNEA
}

export interface RestockRecord {
  id: string;
  storeId: string;
  branchId?: string;
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

export interface AdminStoreView {
  id: string;
  name: string;
  businessType?: string;
  ownerId: string;
  createdAt: string;
  logoUrl?: string;
  branding?: Store['branding'];
  members: StoreMember[];
  productCount: number;
  saleCount: number;
}

export interface TempStoreSettings {
  name: string;
  businessType: string;
  description: string;
  logoUrl: string;
  legalName: string;
  nit: string;
  fiscalAddress: string;
  fiscalPhone: string;
  branding: { 
    primaryColor: string; 
    secondaryColor: string; 
    backgroundColor: string; 
    textColor: string; 
    textSecondaryColor: string;
    textAccentColor?: string;
    fontFamily?: string;
  };
}
export type PaymentMethod = 'efectivo' | 'tarjeta' | 'transferencia';

export interface PaymentRecord {
  id: string;
  method: PaymentMethod;
  amount: number;                 // en pesos colombianos (entero)
  // Campos opcionales según el método
  lastFourDigits?: string;        // tarjeta
  expiryDate?: string;            // tarjeta (formato MM/YY)
  cardType?: 'debito' | 'credito';// tarjeta
  bankId?: string;                // tarjeta + transferencia
  bankName?: string;              // tarjeta + transferencia
  transferReference?: string;     // transferencia
  createdAt: string;              // ISO
}