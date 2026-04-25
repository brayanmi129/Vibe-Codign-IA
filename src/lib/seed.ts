/**
 * Reseed desde la app (botón en el panel de admin).
 * Requiere estar autenticado como admin.
 * Usa la misma estructura de datos que scripts/seed.ts.
 */

import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  setDoc,
  query,
  where,
} from "firebase/firestore";
import { db, auth } from "./firebase";
import { toast } from "sonner";

const TENANT_ID     = "stockmaster-ai-demo";
const STORE_SUBCOLS = ["products", "sales", "members", "restocks"] as const;

function daysAgo(days: number, hour = 12, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

// ── Catálogo ─────────────────────────────────────────────────────────────────

const PRODUCTS = [
  // Laptops
  { code: "LPT-001", name: "Laptop Gamer Pro i9 RTX4080",       brand: "SpeedTech",  category: "Laptops",       price: 1499.99, quantity: 12, minStockLevel: 3 },
  { code: "LPT-002", name: 'MacBook Air M3 15"',                 brand: "Apple",      category: "Laptops",       price: 1199.99, quantity:  1, minStockLevel: 2 },
  { code: "LPT-003", name: 'Laptop Ultrabook 14" FHD',           brand: "LenovoPro",  category: "Laptops",       price:  799.99, quantity: 14, minStockLevel: 4 },
  { code: "LPT-004", name: "Laptop Empresarial ThinkPro",        brand: "LenovoPro",  category: "Laptops",       price:  699.99, quantity:  9, minStockLevel: 3 },
  { code: "LPT-005", name: 'Chromebook Student 11"',             brand: "AcerEdu",    category: "Laptops",       price:  349.99, quantity: 18, minStockLevel: 5 },
  // Monitores
  { code: "MON-001", name: 'Monitor 27" 4K UHD IPS',             brand: "VisionPlus", category: "Monitores",     price:  449.99, quantity:  7, minStockLevel: 2 },
  { code: "MON-002", name: 'Monitor Curvo 34" UltraWide 144Hz',  brand: "SamsungPro", category: "Monitores",     price:  599.99, quantity:  2, minStockLevel: 3 },
  { code: "MON-003", name: 'Monitor Gaming 27" 165Hz 1ms',       brand: "AcerNitro",  category: "Monitores",     price:  299.99, quantity: 11, minStockLevel: 3 },
  { code: "MON-004", name: 'Monitor Portátil 15.6" FHD USB-C',   brand: "AOCMobile",  category: "Monitores",     price:  189.99, quantity: 13, minStockLevel: 4 },
  // Smartphones
  { code: "SPH-001", name: "iPhone 15 Pro 256GB Titanio",        brand: "Apple",      category: "Smartphones",   price:  999.99, quantity:  2, minStockLevel: 3 },
  { code: "SPH-002", name: "Samsung Galaxy S24 Ultra 512GB",     brand: "Samsung",    category: "Smartphones",   price:  849.99, quantity: 11, minStockLevel: 3 },
  { code: "SPH-003", name: "Xiaomi Redmi Note 13 Pro 256GB",     brand: "Xiaomi",     category: "Smartphones",   price:  299.99, quantity: 22, minStockLevel: 6 },
  { code: "SPH-004", name: "Google Pixel 8a 128GB",              brand: "Google",     category: "Smartphones",   price:  449.99, quantity:  0, minStockLevel: 2 },
  // Periféricos
  { code: "PER-001", name: "Mouse Inalámbrico Ergonómico",       brand: "LogiFree",   category: "Periféricos",   price:   59.99, quantity: 36, minStockLevel: 8 },
  { code: "PER-002", name: "Teclado Mecánico RGB TKL",           brand: "GlowKey",    category: "Periféricos",   price:   89.99, quantity: 22, minStockLevel: 6 },
  { code: "PER-003", name: "Headset Gaming 7.1 Surround USB",    brand: "HyperSound", category: "Periféricos",   price:   79.99, quantity: 17, minStockLevel: 5 },
  { code: "PER-004", name: "Webcam HD 1080p 60fps Ring Light",   brand: "LogiFree",   category: "Periféricos",   price:   69.99, quantity: 15, minStockLevel: 4 },
  { code: "PER-005", name: "Hub USB-C 7 en 1 100W PD",          brand: "AnckerPro",  category: "Periféricos",   price:   39.99, quantity: 32, minStockLevel: 8 },
  { code: "PER-006", name: "Mousepad XL RGB 900×400mm",          brand: "GlowKey",    category: "Periféricos",   price:   29.99, quantity: 45, minStockLevel: 10 },
  { code: "PER-007", name: "Auriculares Bluetooth Pro ANC",      brand: "SonySound",  category: "Periféricos",   price:  129.99, quantity:  3, minStockLevel: 4 },
  { code: "PER-008", name: "SSD Externo USB-C 1TB 1050MB/s",    brand: "SamsungPro", category: "Periféricos",   price:   99.99, quantity: 18, minStockLevel: 5 },
  // Redes & Audio
  { code: "RED-001", name: "Router WiFi 6 Dual Band AX3000",     brand: "TPLinkPro",  category: "Redes & Audio", price:  149.99, quantity: 11, minStockLevel: 3 },
  { code: "RED-002", name: "Parlante Bluetooth Portátil 20W IP67",brand: "JBLSound",  category: "Redes & Audio", price:   59.99, quantity: 27, minStockLevel: 7 },
  { code: "RED-003", name: "Barra de Sonido 2.1 80W HDMI ARC",   brand: "SonySound",  category: "Redes & Audio", price:  199.99, quantity:  6, minStockLevel: 2 },
  { code: "RED-004", name: "Access Point WiFi 6E Mesh EasyMesh",  brand: "TPLinkPro",  category: "Redes & Audio", price:  179.99, quantity:  1, minStockLevel: 2 },
];

const RESTOCKS = [
  { productId: "lpt-001", productName: "Laptop Gamer Pro i9 RTX4080",         quantity:  6, day: 22 },
  { productId: "lpt-003", productName: 'Laptop Ultrabook 14" FHD',             quantity:  8, day: 18 },
  { productId: "sph-001", productName: "iPhone 15 Pro 256GB Titanio",          quantity:  5, day: 25 },
  { productId: "sph-002", productName: "Samsung Galaxy S24 Ultra 512GB",       quantity:  8, day: 15 },
  { productId: "sph-003", productName: "Xiaomi Redmi Note 13 Pro 256GB",       quantity: 12, day:  8 },
  { productId: "per-001", productName: "Mouse Inalámbrico Ergonómico",         quantity: 25, day: 12 },
  { productId: "per-002", productName: "Teclado Mecánico RGB TKL",             quantity: 15, day: 20 },
  { productId: "per-006", productName: "Mousepad XL RGB 900×400mm",            quantity: 40, day: 16 },
  { productId: "red-002", productName: "Parlante Bluetooth Portátil 20W IP67", quantity: 20, day:  6 },
  { productId: "mon-003", productName: 'Monitor Gaming 27" 165Hz 1ms',         quantity:  8, day: 24 },
];

// ── Generador de ventas ───────────────────────────────────────────────────────

function weightedPick(n: number) {
  const weights = PRODUCTS.map(p =>
    p.price < 100 ? 5 : p.price < 300 ? 3 : p.price < 700 ? 2 : 1
  );
  const total  = weights.reduce((a, b) => a + b, 0);
  const result: typeof PRODUCTS[0][] = [];
  const used   = new Set<number>();

  while (result.length < Math.min(n, PRODUCTS.length)) {
    let r = Math.random() * total;
    for (let i = 0; i < PRODUCTS.length; i++) {
      r -= weights[i];
      if (r <= 0 && !used.has(i)) {
        used.add(i);
        result.push(PRODUCTS[i]);
        break;
      }
    }
  }
  return result;
}

function generateSales(adminUid: string) {
  const sales = [];
  let counter = 1;

  for (let day = 29; day >= 0; day--) {
    const txCount = 5 + Math.floor(Math.random() * 4);
    for (let t = 0; t < txCount; t++) {
      const hour   = 9 + Math.floor(Math.random() * 10);
      const minute = Math.floor(Math.random() * 60);
      const date   = daysAgo(day, hour, minute);

      const numItems = 1 + Math.floor(Math.random() * 3);
      const chosen   = weightedPick(numItems);

      const items = chosen.map(p => {
        const qty = 1 + Math.floor(Math.random() * 2);
        return {
          productId:   p.code.toLowerCase(),
          productName: p.name,
          quantity:    qty,
          unitPrice:   p.price,
          totalPrice:  parseFloat((qty * p.price).toFixed(2)),
        };
      });

      const totalAmount = parseFloat(
        items.reduce((s, i) => s + i.totalPrice, 0).toFixed(2)
      );

      sales.push({
        id: `sale-${String(counter++).padStart(4, "0")}`,
        storeId: TENANT_ID,
        date,
        totalAmount,
        userId: adminUid,
        items,
      });
    }
  }
  return sales;
}

// ── Función exportada ─────────────────────────────────────────────────────────

export async function reseedDatabase() {
  const confirmed = window.confirm(
    "¿Seguro? Esto BORRARÁ todo y recreará la tienda desde cero con datos de demostración."
  );
  if (!confirmed) return;

  const adminUid   = auth.currentUser?.uid;
  const adminEmail = auth.currentUser?.email ?? "admin@stockmaster.ai";

  if (!adminUid) {
    toast.error("Debes estar autenticado para reinicializar la base de datos.");
    return;
  }

  const promise = async () => {
    // ── Limpieza ─────────────────────────────────────────────────────────

    // Borrar todas las tiendas propias
    try {
      const owned = await getDocs(
        query(collection(db, "stores"), where("ownerId", "==", adminUid))
      );
      for (const storeDoc of owned.docs) {
        for (const sub of STORE_SUBCOLS) {
          const snap = await getDocs(collection(db, "stores", storeDoc.id, sub));
          for (const d of snap.docs) {
            await deleteDoc(doc(db, "stores", storeDoc.id, sub, d.id));
          }
        }
        try { await deleteDoc(doc(db, "stores", storeDoc.id)); } catch { /* ok */ }
      }
    } catch { /* sin tiendas previas */ }

    // Forzar limpieza del store demo
    for (const sub of STORE_SUBCOLS) {
      const snap = await getDocs(collection(db, "stores", TENANT_ID, sub));
      for (const d of snap.docs) {
        await deleteDoc(doc(db, "stores", TENANT_ID, sub, d.id));
      }
    }
    try { await deleteDoc(doc(db, "stores", TENANT_ID)); } catch { /* ok */ }

    // Limpiar perfil del admin
    const userStores = await getDocs(collection(db, "users", adminUid, "userStores"));
    for (const d of userStores.docs) {
      await deleteDoc(doc(db, "users", adminUid, "userStores", d.id));
    }

    // ── Store ─────────────────────────────────────────────────────────────
    await setDoc(doc(db, "stores", TENANT_ID), {
      id:           TENANT_ID,
      name:         "StockMaster Tech Store",
      businessType: "Tecnología / Electrónica",
      description:  "Tienda especializada en tecnología: laptops, smartphones, monitores, periféricos y accesorios. Gestión de inventario asistida por IA.",
      ownerId:      adminUid,
      createdAt:    daysAgo(90),
      plan:         "pro",
      branding: {
        primaryColor:    "#2563EB",
        secondaryColor:  "#1E40AF",
        backgroundColor: "#F8FAFC",
      },
    });

    // ── Perfil del admin ─────────────────────────────────────────────────
    await setDoc(doc(db, "users", adminUid), {
      uid:         adminUid,
      displayName: "Admin StockMaster",
      email:       adminEmail,
      createdAt:   daysAgo(90),
    });

    // userStores con { role } — estructura que lee onAuthStateChanged
    await setDoc(doc(db, "users", adminUid, "userStores", TENANT_ID), {
      role: "admin",
    });

    // members/{uid} — handleSelectStore lee este doc para obtener el rol
    await setDoc(doc(db, "stores", TENANT_ID, "members", adminUid), {
      userId:      adminUid,
      role:        "admin",
      email:       adminEmail,
      displayName: "Admin StockMaster",
    });

    // ── Productos ─────────────────────────────────────────────────────────
    for (const p of PRODUCTS) {
      const id = p.code.toLowerCase();
      await setDoc(doc(db, "stores", TENANT_ID, "products", id), {
        id,
        storeId:       TENANT_ID,
        code:          p.code,
        name:          p.name,
        brand:         p.brand,
        category:      p.category,
        price:         p.price,
        quantity:      p.quantity,
        minStockLevel: p.minStockLevel,
        lastUpdated:   daysAgo(1),
      });
    }

    // ── Ventas ────────────────────────────────────────────────────────────
    const sales = generateSales(adminUid);
    for (const s of sales) {
      await setDoc(doc(db, "stores", TENANT_ID, "sales", s.id), s);
    }

    // ── Reposiciones ──────────────────────────────────────────────────────
    for (let i = 0; i < RESTOCKS.length; i++) {
      const r  = RESTOCKS[i];
      const id = `restock-${String(i + 1).padStart(3, "0")}`;
      await setDoc(doc(db, "stores", TENANT_ID, "restocks", id), {
        id,
        storeId:     TENANT_ID,
        productId:   r.productId,
        productName: r.productName,
        quantity:    r.quantity,
        date:        daysAgo(r.day),
        userId:      adminUid,
      });
    }
  };

  toast.promise(promise(), {
    loading: "Reinicializando base de datos completa...",
    success: "¡Tienda recreada! Recarga la página.",
    error:   (err) => `Error: ${err instanceof Error ? err.message : "desconocido"}`,
  });
}
