export type UserRole = 'admin' | 'employee' | 'viewer';

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
  // 🆕 NUEVOS CAMPOS PARA FACTURACIÓN
  legalName?: string;        // Razón social (si difiere del nombre comercial)
  nit?: string;              // NIT con formato xxx.xxx.xxx-x
  fiscalAddress?: string;    // Dirección fiscal de la empresa
  fiscalPhone?: string;      // Teléfono fiscal
  // ───────────────────────────────────
  branding?: {
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
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
  // 🆕 NUEVOS CAMPOS PARA FACTURACIÓN
  customer?: Customer;    // Datos del cliente facturado
  subtotal?: number;      // Total antes de IVA
  taxRate?: number;       // % IVA aplicado (ej: 0.19)
  taxAmount?: number;     // Monto de IVA
  invoiceNumber?: string; // Número consecutivo de factura
  emailSent?: boolean;    // Si se envió el correo
  // ───────────────────────────────────
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