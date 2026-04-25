import { 
  collection, 
  getDocs, 
  deleteDoc, 
  doc, 
  setDoc, 
  query,
  where
} from "firebase/firestore";
import { db } from "./firebase";
import { toast } from "sonner";

const TENANT_ID = "stockmaster-ai-demo";
const ADMIN_UID = "demo-user-123"; 
const EMPLOYEE_UID = "demo-employee-456";

export async function reseedDatabase() {
  const confirm = window.confirm("¿Estás seguro de que quieres REINICIALIZAR la base de datos? Esto borrará todos los datos actuales.");
  if (!confirm) return;

  const promise = async () => {
    // 1. Clear Data
    const collectionsToClear = ["stores", "users"];
    
    for (const colName of collectionsToClear) {
      const q = query(collection(db, colName));
      const snap = await getDocs(q);
      
      for (const d of snap.docs) {
        const subcollections = ["products", "sales", "members", "restocks", "userStores"];
        for (const sub of subcollections) {
          const subSnap = await getDocs(collection(db, colName, d.id, sub));
          for (const subD of subSnap.docs) {
            await deleteDoc(doc(db, colName, d.id, sub, subD.id));
          }
        }
        await deleteDoc(doc(db, colName, d.id));
      }
    }

    // 2. Seed Data
    const storeData = {
      id: TENANT_ID,
      name: "StockMaster AI",
      businessType: "Tecnología / Electrónica",
      description: "Empresa dedicada a la venta de productos tecnológicos como laptops, periféricos y dispositivos inteligentes, con gestión de inventario asistida por IA.",
      ownerId: ADMIN_UID,
      createdAt: new Date().toISOString(),
      branding: {
        primaryColor: "#2563EB",
        secondaryColor: "#1E40AF",
        backgroundColor: "#F8FAFC"
      },
      aiContext: "Este negocio vende productos tecnológicos y busca optimizar inventario, ventas y análisis de productos mediante inteligencia artificial."
    };

    await setDoc(doc(db, "stores", TENANT_ID), storeData);

    const adminProfile = {
      uid: ADMIN_UID,
      displayName: "Admin StockMaster",
      email: "admin@stockmaster.ai",
      role: "ADMIN",
      createdAt: new Date().toISOString()
    };

    const employeeProfile = {
      uid: EMPLOYEE_UID,
      displayName: "Usuario Demo",
      email: "empleado@stockmaster.ai",
      role: "EMPLEADO",
      createdAt: new Date().toISOString()
    };

    await setDoc(doc(db, "users", ADMIN_UID), adminProfile);
    await setDoc(doc(db, "users", EMPLOYEE_UID), employeeProfile);
    await setDoc(doc(db, "users", ADMIN_UID, "userStores", TENANT_ID), { id: TENANT_ID });
    await setDoc(doc(db, "users", EMPLOYEE_UID, "userStores", TENANT_ID), { id: TENANT_ID });
    
    await setDoc(doc(db, "stores", TENANT_ID, "members", ADMIN_UID), {
      userId: ADMIN_UID,
      role: "admin",
      email: "admin@stockmaster.ai",
      displayName: "Admin StockMaster"
    });

    await setDoc(doc(db, "stores", TENANT_ID, "members", EMPLOYEE_UID), {
      userId: EMPLOYEE_UID,
      role: "employee",
      email: "empleado@stockmaster.ai",
      displayName: "Usuario Demo"
    });

    const products = [
      { code: "LPT-001", name: "Laptop Gamer Pro", brand: "SpeedTech", category: "Laptops", price: 1299.99, quantity: 15 },
      { code: "MSE-002", name: "Mouse Inalámbrico", brand: "LogiFree", category: "Accesorios", price: 49.99, quantity: 50 },
      { code: "KBD-003", name: "Teclado Mecánico RGB", brand: "GlowKey", category: "Accesorios", price: 89.99, quantity: 30 },
      { code: "MON-004", name: "Monitor 27” 4K", brand: "VisionPlus", category: "Monitores", price: 349.99, quantity: 10 }
    ];

    for (const p of products) {
      const pId = p.code.toLowerCase();
      await setDoc(doc(db, "stores", TENANT_ID, "products", pId), {
        ...p,
        id: pId,
        storeId: TENANT_ID,
        minStockLevel: 5,
        lastUpdated: new Date().toISOString()
      });
    }

    const sales = [
      {
        id: "sale-001",
        storeId: TENANT_ID,
        date: new Date(Date.now() - 3600000 * 2).toISOString(),
        totalAmount: 1349.98,
        userId: ADMIN_UID,
        items: [
          { productId: "lpt-001", productName: "Laptop Gamer Pro", quantity: 1, unitPrice: 1299.99, totalPrice: 1299.99 },
          { productId: "mse-002", productName: "Mouse Inalámbrico", quantity: 1, unitPrice: 49.99, totalPrice: 49.99 }
        ]
      },
      {
        id: "sale-002",
        storeId: TENANT_ID,
        date: new Date(Date.now() - 86400000).toISOString(),
        totalAmount: 89.99,
        userId: EMPLOYEE_UID,
        items: [
          { productId: "kbd-003", productName: "Teclado Mecánico RGB", quantity: 1, unitPrice: 89.99, totalPrice: 89.99 }
        ]
      }
    ];

    for (const s of sales) {
      await setDoc(doc(db, "stores", TENANT_ID, "sales", s.id), s);
    }
  };

  toast.promise(promise(), {
    loading: "Reinicializando base de datos...",
    success: "Base de datos reinicializada con éxito! Recarga la página.",
    error: "Error al reinicializar la base de datos."
  });
}
