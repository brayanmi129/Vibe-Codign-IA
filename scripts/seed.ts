/**
 * Seed script — ejecutar UNA sola vez antes de usar la app.
 *
 *   npm run seed
 *
 * Qué hace:
 *  1. Crea (o recupera) el usuario admin@stockmaster.ai en Firebase Auth.
 *  2. Borra TODOS los stores que le pertenecen + sus subcollections.
 *  3. Borra el perfil del admin en Firestore para empezar limpio.
 *  4. Crea la tienda "StockMaster Tech Store" con 25 productos,
 *     ~200 ventas distribuidas en los últimos 30 días y 10 reposiciones.
 */

import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  deleteDoc,
  doc,
  setDoc,
  query,
  where,
} from "firebase/firestore";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  inMemoryPersistence,
  setPersistence,
} from "firebase/auth";
import firebaseConfig from "../firebase-applet-config.json" with { type: "json" };

const app  = initializeApp(firebaseConfig);
const db   = getFirestore(app, firebaseConfig.firestoreDatabaseId);
const auth = getAuth(app);

const ADMIN_EMAIL    = "admin@stockmaster.ai";
const ADMIN_PASSWORD = "Admin#123";
const TENANT_ID      = "stockmaster-ai-demo";
const STORE_SUBCOLS  = ["products", "sales", "members", "restocks"] as const;

// ── Utilidades ───────────────────────────────────────────────────────────────

function daysAgo(days: number, hour = 12, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

// ── 1. Auth ──────────────────────────────────────────────────────────────────

async function getOrCreateAdmin(): Promise<string> {
  await setPersistence(auth, inMemoryPersistence);
  try {
    const cred = await signInWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
    console.log("✅ Autenticado:", cred.user.uid);
    return cred.user.uid;
  } catch (err: any) {
    const notFound =
      err.code === "auth/user-not-found" ||
      err.code === "auth/invalid-credential";
    if (!notFound) throw err;
    console.log("  Creando usuario admin en Firebase Auth...");
    const cred = await createUserWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
    console.log("✅ Usuario creado:", cred.user.uid);
    return cred.user.uid;
  }
}

// ── 2. Limpieza total ────────────────────────────────────────────────────────

async function deleteStoreData(storeId: string) {
  for (const sub of STORE_SUBCOLS) {
    let snap;
    try {
      snap = await getDocs(collection(db, "stores", storeId, sub));
    } catch {
      continue; // sin acceso de lectura a esta subcollection
    }
    let deleted = 0;
    for (const d of snap.docs) {
      try {
        await deleteDoc(doc(db, "stores", storeId, sub, d.id));
        deleted++;
      } catch {
        // Doc protegido (ej. member de otra sesión) — se ignora
      }
    }
    if (deleted > 0)
      console.log(`   ✗ ${deleted}/${snap.size} docs borrados: stores/${storeId}/${sub}`);
  }
  // Borrar el documento raíz (las reglas deben estar desplegadas para esto)
  try {
    await deleteDoc(doc(db, "stores", storeId));
    console.log(`   ✗ Documento stores/${storeId} eliminado.`);
  } catch {
    // Se sobreescribirá con setDoc en seedStore
  }
}

// UIDs legados hardcodeados que las reglas permiten borrar (isDemoUser)
const LEGACY_USER_IDS = ["demo-user-123", "demo-employee-456"];

async function deleteUserAndSubcols(uid: string) {
  const subcols = ["userStores"];
  for (const sub of subcols) {
    try {
      const snap = await getDocs(collection(db, "users", uid, sub));
      for (const d of snap.docs) {
        try { await deleteDoc(doc(db, "users", uid, sub, d.id)); } catch { /* ok */ }
      }
    } catch { /* sin acceso */ }
  }
  try { await deleteDoc(doc(db, "users", uid)); } catch { /* ok */ }
}

async function nuclearClear(adminUid: string) {
  console.log("\n💥 Limpiando base de datos...\n");

  // 1. Todos los stores que pertenecen al admin actual (cualquier ID)
  try {
    const owned = await getDocs(
      query(collection(db, "stores"), where("ownerId", "==", adminUid))
    );
    for (const storeDoc of owned.docs) {
      await deleteStoreData(storeDoc.id);
    }
    if (owned.size > 0)
      console.log(`✅ ${owned.size} tienda(s) propias eliminadas.`);
  } catch {
    // Sin tiendas previas o sin permisos
  }

  // 2. Store demo (aunque tenga otro ownerId de sesiones anteriores)
  await deleteStoreData(TENANT_ID);

  // 3. Perfil del admin actual
  await deleteUserAndSubcols(adminUid);
  console.log("✅ Perfil de usuario anterior eliminado.");

  // 4. UIDs legacy hardcodeados de versiones anteriores del seed
  for (const uid of LEGACY_USER_IDS) {
    await deleteUserAndSubcols(uid);
  }
  console.log("✅ Perfiles legacy (demo-user-123, demo-employee-456) eliminados.");

  console.log("\n✅ Limpieza completa.\n");
}

// ── 3. Catálogo ──────────────────────────────────────────────────────────────
// Algunos productos con stock crítico/agotado para que el dashboard
// muestre alertas reales y la IA tenga material para analizar.

const PRODUCTS = [
  // Laptops
  { code: "LPT-001", name: "Laptop Gamer Pro i9 RTX4080",       brand: "SpeedTech",  category: "Laptops",       price: 6299000, costPrice: 5200000, quantity: 12, minStockLevel: 3 },
  { code: "LPT-002", name: 'MacBook Air M3 15"',                 brand: "Apple",      category: "Laptops",       price: 5199000, costPrice: 4400000, quantity:  1, minStockLevel: 2 }, // ⚠️ crítico
  { code: "LPT-003", name: 'Laptop Ultrabook 14" FHD',           brand: "LenovoPro",  category: "Laptops",       price: 3299000, costPrice: 2700000, quantity: 14, minStockLevel: 4 },
  { code: "LPT-004", name: "Laptop Empresarial ThinkPro",        brand: "LenovoPro",  category: "Laptops",       price: 2899000, costPrice: 2350000, quantity:  9, minStockLevel: 3 },
  { code: "LPT-005", name: 'Chromebook Student 11"',             brand: "AcerEdu",    category: "Laptops",       price: 1499000, costPrice: 1150000, quantity: 18, minStockLevel: 5 },
  // Monitores
  { code: "MON-001", name: 'Monitor 27" 4K UHD IPS',             brand: "VisionPlus", category: "Monitores",     price: 1899000, costPrice: 1450000, quantity:  7, minStockLevel: 2 },
  { code: "MON-002", name: 'Monitor Curvo 34" UltraWide 144Hz',  brand: "SamsungPro", category: "Monitores",     price: 2499000, costPrice: 1950000, quantity:  2, minStockLevel: 3 }, // ⚠️ crítico
  { code: "MON-003", name: 'Monitor Gaming 27" 165Hz 1ms',       brand: "AcerNitro",  category: "Monitores",     price: 1299000, costPrice:  990000, quantity: 11, minStockLevel: 3 },
  { code: "MON-004", name: 'Monitor Portátil 15.6" FHD USB-C',   brand: "AOCMobile",  category: "Monitores",     price:  799000, costPrice:  600000, quantity: 13, minStockLevel: 4 },
  // Smartphones
  { code: "SPH-001", name: "iPhone 15 Pro 256GB Titanio",        brand: "Apple",      category: "Smartphones",   price: 4299000, costPrice: 3600000, quantity:  2, minStockLevel: 3 }, // ⚠️ crítico
  { code: "SPH-002", name: "Samsung Galaxy S24 Ultra 512GB",     brand: "Samsung",    category: "Smartphones",   price: 3599000, costPrice: 2950000, quantity: 11, minStockLevel: 3 },
  { code: "SPH-003", name: "Xiaomi Redmi Note 13 Pro 256GB",     brand: "Xiaomi",     category: "Smartphones",   price: 1299000, costPrice:  950000, quantity: 22, minStockLevel: 6 },
  { code: "SPH-004", name: "Google Pixel 8a 128GB",              brand: "Google",     category: "Smartphones",   price: 1899000, costPrice: 1450000, quantity:  0, minStockLevel: 2 }, // ❌ sin stock
  // Periféricos
  { code: "PER-001", name: "Mouse Inalámbrico Ergonómico",       brand: "LogiFree",   category: "Periféricos",   price:  249000, costPrice:  160000, quantity: 36, minStockLevel: 8 },
  { code: "PER-002", name: "Teclado Mecánico RGB TKL",           brand: "GlowKey",    category: "Periféricos",   price:  379000, costPrice:  240000, quantity: 22, minStockLevel: 6 },
  { code: "PER-003", name: "Headset Gaming 7.1 Surround USB",    brand: "HyperSound", category: "Periféricos",   price:  329000, costPrice:  210000, quantity: 17, minStockLevel: 5 },
  { code: "PER-004", name: "Webcam HD 1080p 60fps Ring Light",   brand: "LogiFree",   category: "Periféricos",   price:  289000, costPrice:  185000, quantity: 15, minStockLevel: 4 },
  { code: "PER-005", name: "Hub USB-C 7 en 1 100W PD",          brand: "AnckerPro",  category: "Periféricos",   price:  169000, costPrice:  105000, quantity: 32, minStockLevel: 8 },
  { code: "PER-006", name: "Mousepad XL RGB 900×400mm",          brand: "GlowKey",    category: "Periféricos",   price:  129000, costPrice:   79000, quantity: 45, minStockLevel: 10 },
  { code: "PER-007", name: "Auriculares Bluetooth Pro ANC",      brand: "SonySound",  category: "Periféricos",   price:  549000, costPrice:  360000, quantity:  3, minStockLevel: 4 }, // ⚠️ crítico
  { code: "PER-008", name: "SSD Externo USB-C 1TB 1050MB/s",    brand: "SamsungPro", category: "Periféricos",   price:  419000, costPrice:  290000, quantity: 18, minStockLevel: 5 },
  // Redes & Audio
  { code: "RED-001", name: "Router WiFi 6 Dual Band AX3000",     brand: "TPLinkPro",  category: "Redes & Audio", price:  629000, costPrice:  430000, quantity: 11, minStockLevel: 3 },
  { code: "RED-002", name: "Parlante Bluetooth Portátil 20W IP67",brand: "JBLSound",  category: "Redes & Audio", price:  249000, costPrice:  160000, quantity: 27, minStockLevel: 7 },
  { code: "RED-003", name: "Barra de Sonido 2.1 80W HDMI ARC",   brand: "SonySound",  category: "Redes & Audio", price:  849000, costPrice:  580000, quantity:  6, minStockLevel: 2 },
  { code: "RED-004", name: "Access Point WiFi 6E Mesh EasyMesh",  brand: "TPLinkPro",  category: "Redes & Audio", price:  749000, costPrice:  520000, quantity:  1, minStockLevel: 2 }, // ⚠️ crítico
];

// ── 4. Generador de ventas ───────────────────────────────────────────────────

interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface SaleRecord {
  id: string;
  storeId: string;
  date: string;
  totalAmount: number;
  userId: string;
  items: SaleItem[];
}

// Los accesorios baratos se venden más que laptops/smartphones.
function weightedPick(n: number) {
  const pool = [...PRODUCTS];
  const weights = pool.map(p =>
    p.price < 100 ? 5 : p.price < 300 ? 3 : p.price < 700 ? 2 : 1
  );
  const total = weights.reduce((a, b) => a + b, 0);
  const result: typeof PRODUCTS[0][] = [];
  const used = new Set<number>();

  while (result.length < Math.min(n, pool.length)) {
    let r = Math.random() * total;
    for (let i = 0; i < pool.length; i++) {
      r -= weights[i];
      if (r <= 0 && !used.has(i)) {
        used.add(i);
        result.push(pool[i]);
        break;
      }
    }
  }
  return result;
}

function generateSales(adminUid: string): SaleRecord[] {
  const sales: SaleRecord[] = [];
  let counter = 1;

  for (let day = 29; day >= 0; day--) {
    const txCount = 5 + Math.floor(Math.random() * 4); // 5–8 ventas/día ≈ ~200 total
    for (let t = 0; t < txCount; t++) {
      const hour   = 9 + Math.floor(Math.random() * 10); // 9am–7pm
      const minute = Math.floor(Math.random() * 60);
      const date   = daysAgo(day, hour, minute);

      const numItems = 1 + Math.floor(Math.random() * 3); // 1–3 líneas por ticket
      const chosen   = weightedPick(numItems);

      const items: SaleItem[] = chosen.map(p => {
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
        id:          `sale-${String(counter++).padStart(4, "0")}`,
        storeId:     TENANT_ID,
        date,
        totalAmount,
        userId:      adminUid,
        items,
      });
    }
  }
  return sales;
}

// ── 5. Sucursales ─────────────────────────────────────────────────────────────

const BRANCHES = [
  { id: "branch-centro", name: "Sucursal Centro",  address: "Calle 72 #10-34, Bogotá" },
  { id: "branch-norte",  name: "Sucursal Norte",   address: "Cra 15 #127-60, Bogotá"  },
  { id: "branch-sur",    name: "Sucursal Sur",      address: "Av. 68 #38-54, Bogotá"   },
] as const;

// Distribución de productos por sucursal
const PRODUCT_BRANCH: Record<string, string> = {
  "lpt-001": "branch-centro", "lpt-002": "branch-norte",  "lpt-003": "branch-sur",
  "lpt-004": "branch-centro", "lpt-005": "branch-norte",
  "mon-001": "branch-centro", "mon-002": "branch-sur",    "mon-003": "branch-norte",
  "mon-004": "branch-sur",
  "sph-001": "branch-norte",  "sph-002": "branch-centro", "sph-003": "branch-sur",
  "sph-004": "branch-norte",
  "per-001": "branch-centro", "per-002": "branch-norte",  "per-003": "branch-sur",
  "per-004": "branch-centro", "per-005": "branch-norte",  "per-006": "branch-sur",
  "per-007": "branch-centro", "per-008": "branch-norte",
  "red-001": "branch-sur",    "red-002": "branch-centro", "red-003": "branch-norte",
  "red-004": "branch-sur",
};

// ── 6. Reposiciones ──────────────────────────────────────────────────────────

const RESTOCKS = [
  { productId: "lpt-001", productName: "Laptop Gamer Pro i9 RTX4080",        quantity:  6, day: 22 },
  { productId: "lpt-003", productName: 'Laptop Ultrabook 14" FHD',            quantity:  8, day: 18 },
  { productId: "sph-001", productName: "iPhone 15 Pro 256GB Titanio",         quantity:  5, day: 25 },
  { productId: "sph-002", productName: "Samsung Galaxy S24 Ultra 512GB",      quantity:  8, day: 15 },
  { productId: "sph-003", productName: "Xiaomi Redmi Note 13 Pro 256GB",      quantity: 12, day:  8 },
  { productId: "per-001", productName: "Mouse Inalámbrico Ergonómico",        quantity: 25, day: 12 },
  { productId: "per-002", productName: "Teclado Mecánico RGB TKL",            quantity: 15, day: 20 },
  { productId: "per-006", productName: "Mousepad XL RGB 900×400mm",           quantity: 40, day: 16 },
  { productId: "red-002", productName: "Parlante Bluetooth Portátil 20W IP67",quantity: 20, day:  6 },
  { productId: "mon-003", productName: 'Monitor Gaming 27" 165Hz 1ms',        quantity:  8, day: 24 },
];

// ── 6. Seed de la tienda ─────────────────────────────────────────────────────

async function seedStore(adminUid: string) {
  console.log("🌱 Creando tienda...\n");

  // ── Store document ──────────────────────────────────────────────────────
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
  } satisfies Record<string, unknown>);
  console.log("✅ Store creado.");

  // ── Perfil del admin en Firestore ───────────────────────────────────────
  // Estructura exacta que usa App.tsx (sin campo "role" en el doc raíz).
  await setDoc(doc(db, "users", adminUid), {
    uid:         adminUid,
    displayName: "Admin StockMaster",
    email:       ADMIN_EMAIL,
    createdAt:   daysAgo(90),
  });

  // userStores: { role } es lo que lee el onAuthStateChanged para listar tiendas.
  await setDoc(doc(db, "users", adminUid, "userStores", TENANT_ID), {
    role: "admin",
  });

  // members: el documento cuyo ID es la EMAIL-KEY (email con '.' → '_').
  // Esto coincide con cómo se escriben los miembros desde la app y con el
  // chequeo en firestore.rules (isStoreMember usa emailKey()).
  const adminMemberKey = ADMIN_EMAIL.replace(/\./g, "_");
  await setDoc(doc(db, "stores", TENANT_ID, "members", adminMemberKey), {
    userId:      adminUid,
    storeId:     TENANT_ID,
    role:        "admin",
    email:       ADMIN_EMAIL,
    displayName: "Admin StockMaster",
    authMethod:  "email",
    joinedAt:    daysAgo(90),
    // Admin sin branchId = acceso a todas las sucursales
  });
  console.log("✅ Admin vinculado a la tienda (usuario + miembro).");

  // ── Sucursales ──────────────────────────────────────────────────────────
  for (const b of BRANCHES) {
    await setDoc(doc(db, "stores", TENANT_ID, "branches", b.id), {
      id:       b.id,
      tenantId: TENANT_ID,
      name:     b.name,
      address:  b.address,
      createdAt: daysAgo(90),
    });
  }
  console.log(`✅ ${BRANCHES.length} sucursales creadas.`);

  // ── Productos ───────────────────────────────────────────────────────────
  for (const p of PRODUCTS) {
    const id = p.code.toLowerCase();
    await setDoc(doc(db, "stores", TENANT_ID, "products", id), {
      id,
      storeId:       TENANT_ID,
      branchId:      PRODUCT_BRANCH[id] ?? "branch-centro",
      code:          p.code,
      name:          p.name,
      brand:         p.brand,
      category:      p.category,
      price:         p.price,
      costPrice:     p.costPrice,
      quantity:      p.quantity,
      minStockLevel: p.minStockLevel,
      lastUpdated:   daysAgo(1),
    });
  }
  console.log(`✅ ${PRODUCTS.length} productos creados (incluye 5 con stock crítico/agotado).`);

  // ── Ventas ──────────────────────────────────────────────────────────────
  const sales = generateSales(adminUid);
  for (const s of sales) {
    // Heredar branchId del primer producto de la venta
    const firstProductId = s.items[0]?.productId ?? "";
    const branchId = PRODUCT_BRANCH[firstProductId] ?? "branch-centro";
    await setDoc(doc(db, "stores", TENANT_ID, "sales", s.id), { ...s, branchId });
  }
  console.log(`✅ ${sales.length} ventas generadas (30 días, ~7/día).`);

  // ── Reposiciones ────────────────────────────────────────────────────────
  for (let i = 0; i < RESTOCKS.length; i++) {
    const r  = RESTOCKS[i];
    const id = `restock-${String(i + 1).padStart(3, "0")}`;
    await setDoc(doc(db, "stores", TENANT_ID, "restocks", id), {
      id,
      storeId:     TENANT_ID,
      branchId:    PRODUCT_BRANCH[r.productId] ?? "branch-centro",
      productId:   r.productId,
      productName: r.productName,
      quantity:    r.quantity,
      date:        daysAgo(r.day),
      userId:      adminUid,
    });
  }
  console.log(`✅ ${RESTOCKS.length} registros de reposición creados.`);
}

// ── Entry point ──────────────────────────────────────────────────────────────

async function run() {
  try {
    console.log("🚀 StockMaster — seed inicial\n");

    const adminUid = await getOrCreateAdmin();
    await nuclearClear(adminUid);
    await seedStore(adminUid);

    console.log("\n═══════════════════════════════════════");
    console.log("✨ Tienda lista. Credenciales de acceso:");
    console.log("───────────────────────────────────────");
    console.log(`   Email:      ${ADMIN_EMAIL}`);
    console.log(`   Contraseña: ${ADMIN_PASSWORD}`);
    console.log(`   Productos:  ${PRODUCTS.length}`);
    console.log(`   Ventas:     últimos 30 días (~200)`);
    console.log("═══════════════════════════════════════\n");
    process.exit(0);
  } catch (error) {
    console.error("\n💥 Error durante el seed:", error);
    process.exit(1);
  }
}

run();
