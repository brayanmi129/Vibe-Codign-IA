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
  userId: string;                  // empty string until first login binds a Firebase UID
  storeId: string;
  role: UserRole;
  email: string;
  displayName?: string;
  joinedAt?: string;
  branchId?: string;
  authMethod: 'google' | 'email';  // chosen by whoever pre-registered the user
  // Cleartext temp password set by the admin for first-time email/password login.
  // Removed from the doc the moment the Firebase Auth account is created.
  tempPassword?: string;
}

// Stored at superadmins/{email}. Mirrors StoreMember's auth handshake so a new super
// admin's first login works without a self-registration UI (only existing super admins
// can create new ones).
export interface SuperAdminRecord {
  email: string;
  authMethod: 'google' | 'email';
  tempPassword?: string;
  createdAt: string;
}

// ── Categorías tributarias DIAN (Colombia) ────────────────────────
// - excluido: no causa IVA (ej: medicamentos, servicios médicos)
// - exento:   gravado a tasa 0% (ej: leche, huevos, carne fresca)
// - reducido: tarifa especial 5% (ej: café, chocolate, productos canasta familiar)
// - general:  tarifa estándar 19% (la mayoría de productos)
export type TaxCategory = 'excluido' | 'exento' | 'reducido' | 'general';

export const TAX_CATEGORY_RATES: Record<TaxCategory, number> = {
  excluido: 0,
  exento: 0,
  reducido: 0.05,
  general: 0.19,
};

export const TAX_CATEGORY_LABELS: Record<TaxCategory, string> = {
  excluido: 'Excluido (sin IVA)',
  exento: 'Exento (0%)',
  reducido: 'Reducido (5%)',
  general: 'General (19%)',
};

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
  branchStock?: Record<string, number>;
  category: string;
  minStockLevel: number;
  lastUpdated: string;
  // Tributario — opcional para retrocompatibilidad. Si no está, se asume 'general' (19%)
  taxCategory?: TaxCategory;
  taxRate?: number; // Derivado de taxCategory; se guarda redundante para queries/snapshot
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  // Snapshot tributario al momento de la venta — NO recalcular si después cambia el producto.
  taxRate?: number;
  taxCategory?: TaxCategory;
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
  totalCostValue: number; // Nuevo: valor total a precio de costo
  lowStockCount: number;
  outOfStockCount: number;
}

export interface Expense {
  id: string;
  storeId: string;
  category: string;
  amount: number;
  description: string;
  date: string;
  userId: string;
}

export interface InventoryAnalytics {
  todayRevenue: number;
  thisWeekRevenue: number;
  revenueChange: number;
  weekChange: number;
  topByQty: { id: string; name: string; category: string; totalQty: number; totalRev: number }[];
  notifications: { id: string; type: string; title: string; message: string }[];
  // Utilidad: solo cuenta items vendidos cuyo producto tiene costPrice. Lo demás se ignora.
  netProfit?: number;
  totalExpenses?: number;
  // Cobertura de costo: % de items vendidos para los que SÍ conocemos el costo.
  // Si < 100, el netProfit es parcial — la UI debe avisar al usuario.
  profitCoverage?: number; // 0 a 100
  productsMissingCost?: number; // # de productos del catálogo sin costPrice
  salesItemsMissingCost?: number; // # de items vendidos sin costPrice conocido
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