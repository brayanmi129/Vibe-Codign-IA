import { Product, SaleRecord } from "../types";

export const generateDemoData = (storeId: string) => {
  const products: Product[] = [
    { id: 'p1', name: 'MacBook Pro M3', brand: 'Apple', category: 'Laptops', price: 2499, quantity: 15, minStockLevel: 5, code: 'MAC-M3-01', storeId, lastUpdated: new Date().toISOString() },
    { id: 'p2', name: 'Dell XPS 15', brand: 'Dell', category: 'Laptops', price: 1899, quantity: 8, minStockLevel: 3, code: 'DELL-XPS-15', storeId, lastUpdated: new Date().toISOString() },
    { id: 'p3', name: 'Keyboard MX Keys', brand: 'Logitech', category: 'Periféricos', price: 109, quantity: 45, minStockLevel: 10, code: 'LOGI-MX', storeId, lastUpdated: new Date().toISOString() },
    { id: 'p4', name: 'Monitor 4K 32"', brand: 'Samsung', category: 'Monitores', price: 599, quantity: 12, minStockLevel: 4, code: 'SAM-4K-32', storeId, lastUpdated: new Date().toISOString() },
    { id: 'p5', name: 'Mouse MX Master 3S', brand: 'Logitech', category: 'Periféricos', price: 99, quantity: 30, minStockLevel: 8, code: 'LOGI-M3S', storeId, lastUpdated: new Date().toISOString() },
    { id: 'p6', name: 'iPad Air', brand: 'Apple', category: 'Tablets', price: 599, quantity: 20, minStockLevel: 5, code: 'IPAD-AIR', storeId, lastUpdated: new Date().toISOString() },
    { id: 'p7', name: 'Sony WH-1000XM5', brand: 'Sony', category: 'Audio', price: 349, quantity: 25, minStockLevel: 6, code: 'SONY-XM5', storeId, lastUpdated: new Date().toISOString() },
    { id: 'p8', name: 'SSD 2TB NVMe', brand: 'Samsung', category: 'Componentes', price: 179, quantity: 50, minStockLevel: 15, code: 'SS-2TB', storeId, lastUpdated: new Date().toISOString() },
    { id: 'p9', name: 'RTX 4080', brand: 'NVIDIA', category: 'Componentes', price: 1199, quantity: 5, minStockLevel: 2, code: 'RTX-4080', storeId, lastUpdated: new Date().toISOString() },
    { id: 'p10', name: 'Stream Deck XL', brand: 'Elgato', category: 'Streaming', price: 249, quantity: 10, minStockLevel: 3, code: 'ELGATO-XL', storeId, lastUpdated: new Date().toISOString() },
  ];

  for (let i = 11; i <= 30; i++) {
    products.push({
      id: `p${i}`,
      name: `Accesorio Tech #${i}`,
      brand: i % 2 === 0 ? 'Generic' : 'ProTech',
      category: 'Accesorios',
      price: Math.floor(Math.random() * 100) + 20,
      quantity: Math.floor(Math.random() * 20) + 5,
      minStockLevel: 10,
      code: `ACC-${i}`,
      storeId,
      lastUpdated: new Date().toISOString()
    });
  }

  const sales: SaleRecord[] = [];
  const now = new Date();

  for (let i = 0; i < 120; i++) {
    const saleDate = new Date();
    saleDate.setDate(now.getDate() - Math.floor(Math.random() * 30));
    const randomProduct = products[Math.floor(Math.random() * products.length)];
    const qty = Math.floor(Math.random() * 3) + 1;

    sales.push({
      id: `s_demo_${i}`,
      date: saleDate.toISOString(),
      items: [{
        productId: randomProduct.id,
        productName: randomProduct.name,
        unitPrice: randomProduct.price,
        quantity: qty,
        totalPrice: randomProduct.price * qty
      }],
      totalAmount: randomProduct.price * qty,
      userId: 'admin_demo_id',
      storeId
    });
  }

  return { products, sales };
};

export const INITIAL_PRODUCTS: Product[] = [
  { id: "1", storeId: "demo", name: "Leche Entera 1L", code: "LEC001", brand: "Colun", price: 4200, quantity: 45, category: "Lácteos", minStockLevel: 10, lastUpdated: new Date().toISOString() },
  { id: "2", storeId: "demo", name: "Pan de Molde", code: "PAN002", brand: "Ideal", price: 6500, quantity: 8, category: "Panadería", minStockLevel: 15, lastUpdated: new Date().toISOString() },
  { id: "3", storeId: "demo", name: "Arroz Extra 1kg", code: "ARR003", brand: "Tucapel", price: 3800, quantity: 60, category: "Despensa", minStockLevel: 20, lastUpdated: new Date().toISOString() },
  { id: "4", storeId: "demo", name: "Detergente Líquido", code: "DET004", brand: "Omo", price: 24500, quantity: 5, category: "Limpieza", minStockLevel: 8, lastUpdated: new Date().toISOString() },
  { id: "5", storeId: "demo", name: "Café Molido 250g", code: "CAF005", brand: "Nescafé", price: 12900, quantity: 25, category: "Despensa", minStockLevel: 10, lastUpdated: new Date().toISOString() },
];

export const INITIAL_SALES: SaleRecord[] = [
  {
    id: "s_today_1", storeId: "demo", userId: "demo",
    items: [
      { productId: "1", productName: "Leche Entera 1L", quantity: 3, unitPrice: 4200, totalPrice: 12600 },
      { productId: "2", productName: "Pan de Molde", quantity: 1, unitPrice: 6500, totalPrice: 6500 }
    ],
    totalAmount: 19100, date: new Date().toISOString()
  },
  {
    id: "s_today_2", storeId: "demo", userId: "demo",
    items: [
      { productId: "3", productName: "Arroz Extra 1kg", quantity: 2, unitPrice: 3800, totalPrice: 7600 },
      { productId: "5", productName: "Café Molido 250g", quantity: 1, unitPrice: 12900, totalPrice: 12900 }
    ],
    totalAmount: 20500, date: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: "s_yest_1", storeId: "demo", userId: "demo",
    items: [
      { productId: "4", productName: "Detergente Líquido", quantity: 1, unitPrice: 24500, totalPrice: 24500 },
      { productId: "1", productName: "Leche Entera 1L", quantity: 6, unitPrice: 4200, totalPrice: 25200 }
    ],
    totalAmount: 49700, date: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: "s_yest_2", storeId: "demo", userId: "demo",
    items: [{ productId: "2", productName: "Pan de Molde", quantity: 4, unitPrice: 6500, totalPrice: 26000 }],
    totalAmount: 26000, date: new Date(Date.now() - 86400000 - 3600000 * 5).toISOString()
  },
  {
    id: "s_2d_1", storeId: "demo", userId: "demo",
    items: [
      { productId: "3", productName: "Arroz Extra 1kg", quantity: 10, unitPrice: 3800, totalPrice: 38000 },
      { productId: "1", productName: "Leche Entera 1L", quantity: 4, unitPrice: 4200, totalPrice: 16800 }
    ],
    totalAmount: 54800, date: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: "s_3d_1", storeId: "demo", userId: "demo",
    items: [
      { productId: "5", productName: "Café Molido 250g", quantity: 3, unitPrice: 12900, totalPrice: 38700 },
      { productId: "2", productName: "Pan de Molde", quantity: 2, unitPrice: 6500, totalPrice: 13000 }
    ],
    totalAmount: 51700, date: new Date(Date.now() - 86400000 * 3).toISOString()
  },
  {
    id: "s_4d_1", storeId: "demo", userId: "demo",
    items: [{ productId: "1", productName: "Leche Entera 1L", quantity: 12, unitPrice: 4200, totalPrice: 50400 }],
    totalAmount: 50400, date: new Date(Date.now() - 86400000 * 4).toISOString()
  },
  {
    id: "s_5d_1", storeId: "demo", userId: "demo",
    items: [
      { productId: "4", productName: "Detergente Líquido", quantity: 2, unitPrice: 24500, totalPrice: 49000 },
      { productId: "3", productName: "Arroz Extra 1kg", quantity: 5, unitPrice: 3800, totalPrice: 19000 }
    ],
    totalAmount: 68000, date: new Date(Date.now() - 86400000 * 5).toISOString()
  },
  {
    id: "s_6d_1", storeId: "demo", userId: "demo",
    items: [
      { productId: "2", productName: "Pan de Molde", quantity: 8, unitPrice: 6500, totalPrice: 52000 },
      { productId: "1", productName: "Leche Entera 1L", quantity: 2, unitPrice: 4200, totalPrice: 8400 }
    ],
    totalAmount: 60400, date: new Date(Date.now() - 86400000 * 6).toISOString()
  },
];
