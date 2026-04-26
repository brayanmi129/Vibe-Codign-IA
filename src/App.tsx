/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react";
import { useState, useEffect, useMemo } from "react";
import {
  LayoutDashboard, Package, AlertTriangle, Plus, Edit2,
  BrainCircuit, Menu, X, ShoppingCart, RefreshCw,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import {
  auth, db, googleProvider, signInWithPopup, signInWithEmailAndPassword,
  signInAnonymously, createUserWithEmailAndPassword, updateProfile, signOut,
  onAuthStateChanged, collection, doc, setDoc, updateDoc, deleteDoc,
  getDoc, getDocs, query, orderBy, onSnapshot, addDoc, serverTimestamp,
  handleFirestoreError, OperationType, User,
} from "./lib/firebase";
import {
  Product, SaleItem, SaleRecord, InventoryStats, AIInsight, RestockRecord,
  Store, UserRole, StoreMember, Branch,
} from "./types";
import { getAIReplenishmentSuggestions, getAIBusinessAnalysis } from "./lib/inventoryService";
import { LogIn, LogOut, User as UserIcon, Store as StoreIcon, ShieldCheck, Users, Download, UserPlus, Settings, ChevronRight } from "lucide-react";
import { ExcelExport, prepareSalesForExport, prepareInventoryForExport } from "./components/ExcelExport";
import { CustomerForm } from "./components/CustomerForm";
import { SaleConfirmationDialog } from "./components/SaleConfirmationDialog";
import {
  TAX_RATE, generateInvoiceNumber, generateInvoicePdf, calculateTotals,
  downloadInvoicePdf, sendInvoiceByEmail, type InvoicePdfPayload,
} from "./lib/invoiceService";
import { uploadInvoicePdf } from "./lib/supabase";
import { Customer } from "./types";
import { OnboardingWizard, OnboardingData } from "./components/OnboardingWizard";
import { NavItem } from "./components/NavItem";
import { generateDemoData } from "./lib/demoData";
import { generateProductCode } from "./lib/formatters";

// Pages
import { DashboardPage } from "./pages/DashboardPage";
import { ProductsPage } from "./pages/ProductsPage";
import { InventoryPage } from "./pages/InventoryPage";
import { TeamPage } from "./pages/TeamPage";
import { SalesPage } from "./pages/SalesPage";
import { AIPage } from "./pages/AIPage";
import { NewSalePage } from "./pages/NewSalePage";
import { SettingsPage } from "./pages/SettingsPage";

export default function App() {
  const [user, setUser] = useState<User | any>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [currentStore, setCurrentStore] = useState<Store | null>(null);
  const [userStores, setUserStores] = useState<Store[]>([]);
  const [memberRole, setMemberRole] = useState<UserRole | null>(null);
  const [isStoreLoading, setIsStoreLoading] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [tempBranding, setTempBranding] = useState<any>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [restocks, setRestocks] = useState<RestockRecord[]>([]);

  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [inventoryTab, setInventoryTab] = useState<"status" | "restock">("status");
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [isCustomerFormOpen, setIsCustomerFormOpen] = useState(false);
  const [isProcessingSale, setIsProcessingSale] = useState(false);
  const [saleConfirmation, setSaleConfirmation] = useState<{
    open: boolean;
    invoicePayload: InvoicePdfPayload | null;
    emailSent: boolean;
    emailMessage: string;
  }>({ open: false, invoicePayload: null, emailSent: false, emailMessage: "" });

  const [branches, setBranches] = useState<Branch[]>([]);
  const [activeBranchId, setActiveBranchId] = useState<string | null>(null);

  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authDisplayName, setAuthDisplayName] = useState("");
  const [authView, setAuthView] = useState<"login" | "signup" | "onboarding">("login");

  const [salesDateFilter, setSalesDateFilter] = useState<string>(new Date().toISOString().split('T')[0]);
  const [salesRangeType, setSalesRangeType] = useState<'day' | 'week' | 'month'>('day');
  const [lastSync, setLastSync] = useState<Date>(new Date());

  const [restockProductId, setRestockProductId] = useState<string>("");
  const [restockQuantity, setRestockQuantity] = useState<string>("");

  const [members, setMembers] = useState<StoreMember[]>([]);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<UserRole>("employee");

  // ─── Analytics ────────────────────────────────────────────────────
  const analytics = useMemo(() => {
    const scopedSales = activeBranchId ? sales.filter(s => s.branchId === activeBranchId) : sales;
    const scopedProducts = activeBranchId ? products.filter(p => p.branchId === activeBranchId) : products;

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const getSalesForDate = (dateStr: string) => scopedSales.filter(s => s.date.startsWith(dateStr));
    const todaySales = getSalesForDate(todayStr);
    const yesterdaySales = getSalesForDate(yesterdayStr);
    const calculateRevenue = (records: SaleRecord[]) => records.reduce((acc, s) => acc + s.totalAmount, 0);

    const todayRevenue = calculateRevenue(todaySales);
    const yesterdayRevenue = calculateRevenue(yesterdaySales);

    const startOfThisWeek = new Date(now);
    startOfThisWeek.setDate(now.getDate() - now.getDay());
    startOfThisWeek.setHours(0, 0, 0, 0);
    const startOfLastWeek = new Date(startOfThisWeek);
    startOfLastWeek.setDate(startOfThisWeek.getDate() - 7);

    const thisWeekSales = scopedSales.filter(s => new Date(s.date) >= startOfThisWeek);
    const lastWeekSales = scopedSales.filter(s => {
      const d = new Date(s.date);
      return d >= startOfLastWeek && d < startOfThisWeek;
    });

    const productPerformance = scopedProducts.map(p => {
      const totalQty = scopedSales.reduce((acc, s) => {
        const item = (s.items || []).find(i => i.productId === p.id);
        return acc + (item ? item.quantity : 0);
      }, 0);
      return { ...p, totalQty, totalRev: totalQty * p.price };
    });

    const notifications: any[] = [];
    const threeDaysAgo = new Date(now);
    threeDaysAgo.setDate(now.getDate() - 3);
    scopedProducts.forEach(p => {
      const totalRecent = scopedSales.reduce((acc, s) => {
        if (new Date(s.date) < threeDaysAgo) return acc;
        const item = (s.items || []).find(i => i.productId === p.id);
        return acc + (item ? item.quantity : 0);
      }, 0);
      if (totalRecent > 10) {
        notifications.push({ id: `high-demand-${p.id}`, type: 'high-demand', title: 'Alta Demanda', message: `${p.name} tiene una rotación alta recientemente.`, productId: p.id });
      }
    });
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);
    scopedProducts.forEach(p => {
      const hasRecentSales = scopedSales.some(s => new Date(s.date) >= sevenDaysAgo && (s.items || []).some(i => i.productId === p.id));
      if (!hasRecentSales && p.quantity > 0) {
        notifications.push({ id: `no-movement-${p.id}`, type: 'no-movement', title: 'Sin Movimiento', message: `${p.name} no ha tenido ventas en los últimos 7 días.`, productId: p.id });
      }
    });

    return {
      todayRevenue,
      yesterdayRevenue,
      revenueChange: yesterdayRevenue === 0 ? 100 : ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100,
      thisWeekRevenue: calculateRevenue(thisWeekSales),
      lastWeekRevenue: calculateRevenue(lastWeekSales),
      weekChange: calculateRevenue(lastWeekSales) === 0 ? 100 : ((calculateRevenue(thisWeekSales) - calculateRevenue(lastWeekSales)) / calculateRevenue(lastWeekSales)) * 100,
      topByQty: [...productPerformance].sort((a, b) => b.totalQty - a.totalQty).slice(0, 5),
      topByRev: [...productPerformance].sort((a, b) => b.totalRev - a.totalRev).slice(0, 5),
      notifications,
    };
  }, [products, sales, activeBranchId]);

  const getDaysOfStock = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product || product.quantity === 0) return 0;
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    const recentSales = sales.filter(s => s.productId === productId && new Date(s.date) >= fourteenDaysAgo);
    const avgPerDay = recentSales.reduce((acc, s) => acc + s.quantity, 0) / 14;
    if (avgPerDay === 0) return 999;
    return Math.round(product.quantity / avgPerDay);
  };

  const getRestockSuggestion = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return 0;
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    const recentSales = sales.filter(s => s.productId === productId && new Date(s.date) >= fourteenDaysAgo);
    const avgPerDay = recentSales.reduce((acc, s) => acc + s.quantity, 0) / 14;
    const suggestion = Math.max(0, Math.ceil(avgPerDay * 30) - product.quantity);
    if (suggestion === 0 && product.quantity <= product.minStockLevel) return product.minStockLevel * 2;
    return suggestion;
  };

  const salesHistoryData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();
    return last7Days.map(date => {
      const total = sales.filter(s => s.date.startsWith(date)).reduce((acc, s) => acc + s.items.reduce((sum, item) => sum + item.quantity, 0), 0);
      return { date: date.split('-').slice(1).join('/'), sales: total };
    });
  }, [sales]);

  const stats = useMemo<InventoryStats>(() => ({
    totalProducts: products.length,
    totalValue: products.reduce((acc, p) => acc + p.price * p.quantity, 0),
    lowStockCount: products.filter(p => p.quantity > 0 && p.quantity <= p.minStockLevel).length,
    outOfStockCount: products.filter(p => p.quantity === 0).length,
  }), [products]);

  const categories = useMemo(() => ["all", ...Array.from(new Set(products.map(p => p.category)))], [products]);

  const filteredProducts = useMemo(() => products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || p.category === categoryFilter;
    const matchesBranch = !activeBranchId || p.branchId === activeBranchId;
    return matchesSearch && matchesCategory && matchesBranch;
  }), [products, searchTerm, categoryFilter, activeBranchId]);

  // ─── Effects ──────────────────────────────────────────────────────
  useEffect(() => {
    if (currentStore?.branding) {
      const root = document.documentElement;
      root.style.setProperty('--brand-primary', currentStore.branding.primaryColor);
      root.style.setProperty('--brand-secondary', currentStore.branding.secondaryColor);
      root.style.setProperty('--brand-bg', currentStore.branding.backgroundColor);
    } else {
      const root = document.documentElement;
      root.style.removeProperty('--brand-primary');
      root.style.removeProperty('--brand-secondary');
      root.style.removeProperty('--brand-bg');
    }
  }, [currentStore]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (activeUser) => {
      let currentUser = activeUser;
      const demoStorage = localStorage.getItem("demo_user");
      if (demoStorage) {
        const demoUser = JSON.parse(demoStorage);
        if (currentUser && currentUser.uid === demoUser.uid) currentUser = { ...currentUser, ...demoUser } as any;
        else if (!currentUser && demoUser.isDemo) currentUser = demoUser;
      }
      setUser(currentUser);
      setIsAuthReady(true);
      if (currentUser) {
        try {
          const q = query(collection(db, "users", currentUser.uid, "userStores"));
          const qSnapshot = await getDocs(q);
          const storesIds = qSnapshot.docs.map(d => d.id);
          if (storesIds.length > 0) {
            const storeDocs = await Promise.all(storesIds.map(id => getDoc(doc(db, "stores", id))));
            const storesData = storeDocs.map(d => ({ ...d.data(), id: d.id } as Store)).filter(s => s.name);
            setUserStores(storesData);
            const savedStoreId = localStorage.getItem("lastStoreId");
            handleSelectStore(storesData.find(s => s.id === savedStoreId) ?? storesData[0]);
          } else {
            setAuthView("onboarding");
          }
        } catch {
          setAuthView("onboarding");
        }
      } else {
        setAuthView("login");
        setCurrentStore(null);
        setUserStores([]);
        setMemberRole(null);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !currentStore) { setProducts([]); setSales([]); setRestocks([]); return; }
    const unsubProducts = onSnapshot(
      query(collection(db, "stores", currentStore.id, "products"), orderBy("name")),
      (snapshot) => { setProducts(snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Product))); setLastSync(new Date()); },
      (error) => handleFirestoreError(error, OperationType.LIST, `stores/${currentStore.id}/products`)
    );
    const unsubSales = onSnapshot(
      query(collection(db, "stores", currentStore.id, "sales"), orderBy("date", "desc")),
      (snapshot) => { setSales(snapshot.docs.map(d => ({ ...d.data(), id: d.id } as SaleRecord))); setLastSync(new Date()); },
      (error) => handleFirestoreError(error, OperationType.LIST, `stores/${currentStore.id}/sales`)
    );
    const unsubRestocks = onSnapshot(
      query(collection(db, "stores", currentStore.id, "restocks"), orderBy("date", "desc")),
      (snapshot) => { setRestocks(snapshot.docs.map(d => ({ ...d.data(), id: d.id } as RestockRecord))); setLastSync(new Date()); },
      (error) => handleFirestoreError(error, OperationType.LIST, `stores/${currentStore.id}/restocks`)
    );
    return () => { unsubProducts(); unsubSales(); unsubRestocks(); };
  }, [user, currentStore]);

  useEffect(() => {
    if (!currentStore) return;
    const unsub = onSnapshot(query(collection(db, "stores", currentStore.id, "branches")), (snapshot) => {
      setBranches(snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Branch)));
    });
    return () => unsub();
  }, [currentStore]);

  useEffect(() => {
    if (!currentStore || !user || memberRole === "admin") return;
    const me = members.find(m => m.userId === (auth.currentUser?.uid ?? user?.uid));
    if (me?.branchId) setActiveBranchId(me.branchId);
  }, [members, currentStore, memberRole]);

  useEffect(() => {
    if (!currentStore) return;
    const unsubscribe = onSnapshot(
      query(collection(db, "stores", currentStore.id, "members")),
      (snapshot) => setMembers(snapshot.docs.map(d => d.data() as StoreMember)),
      (error) => handleFirestoreError(error, OperationType.LIST, `stores/${currentStore.id}/members`)
    );
    return () => unsubscribe();
  }, [currentStore]);

  // ─── Handlers ─────────────────────────────────────────────────────
  const handleSelectStore = async (store: Store) => {
    setIsStoreLoading(true);
    try {
      const uid = auth.currentUser?.uid ?? (user as any)?.uid;
      if (!uid) { toast.error("No hay sesión activa"); setIsStoreLoading(false); return; }
      const memberDoc = await getDoc(doc(db, "stores", store.id, "members", uid));
      if (memberDoc.exists()) {
        setMemberRole(memberDoc.data().role as UserRole);
        setCurrentStore(store);
        setTempBranding(store.branding || { primaryColor: '#4f46e5', secondaryColor: '#4338ca', backgroundColor: '#f8fafc' });
        localStorage.setItem("lastStoreId", store.id);
        toast.success(`Entrando a ${store.name}`);
      } else {
        toast.error("No tienes acceso a esta tienda");
      }
    } catch { toast.error("Error al acceder a la tienda"); }
    finally { setIsStoreLoading(false); }
  };

  const handleOnboardingComplete = async (onboardingData: OnboardingData) => {
    setIsStoreLoading(true);
    try {
      let activeUser = user;
      if (!activeUser && onboardingData.adminInfo?.password) {
        if (onboardingData.adminInfo.email === "admin@stockmaster.ai") {
          let uid = "demo-user-123";
          try { const r = await signInAnonymously(auth); uid = r.user.uid; } catch { }
          activeUser = { uid, email: "admin@stockmaster.ai", displayName: onboardingData.adminInfo.displayName, isDemo: true } as any;
          setUser(activeUser);
          localStorage.setItem("demo_user", JSON.stringify(activeUser));
        } else {
          try {
            const result = await createUserWithEmailAndPassword(auth, onboardingData.adminInfo.email, onboardingData.adminInfo.password);
            await updateProfile(result.user, { displayName: onboardingData.adminInfo.displayName });
            activeUser = result.user;
            setUser(activeUser);
          } catch (error: any) {
            if (error.code === 'auth/operation-not-allowed') {
              activeUser = { uid: `local_${onboardingData.adminInfo.email.replace(/@/g, '_')}`, email: onboardingData.adminInfo.email, displayName: onboardingData.adminInfo.displayName } as any;
              setUser(activeUser);
            } else throw error;
          }
        }
        await setDoc(doc(db, "users", activeUser.uid), { uid: activeUser.uid, displayName: onboardingData.adminInfo.displayName, email: onboardingData.adminInfo.email, createdAt: new Date().toISOString() }, { merge: true });
      }
      if (!activeUser) throw new Error("Error de autenticación");

      const storeId = `store_${Math.random().toString(36).substr(2, 9)}`;
      const newStore: Store = { id: storeId, name: onboardingData.storeName, businessType: onboardingData.businessType, description: onboardingData.aiDescription, ownerId: activeUser.uid, createdAt: new Date().toISOString(), branding: onboardingData.branding };
      await setDoc(doc(db, "stores", storeId), newStore);
      await setDoc(doc(db, "stores", storeId, "members", activeUser.uid), { userId: activeUser.uid, storeId, role: "admin", email: activeUser.email!, displayName: activeUser.displayName || activeUser.email?.split("@")[0] });
      for (const emp of onboardingData.employees) {
        await setDoc(doc(db, "stores", storeId, "members", emp.email.replace(/\./g, "_")), { ...emp, storeId, userId: "", joinedAt: new Date().toISOString() });
      }
      await setDoc(doc(db, "users", activeUser.uid, "userStores", storeId), { role: "admin" });

      if (activeUser.email === "admin@stockmaster.ai") {
        const { products: demoProducts, sales: demoSales } = generateDemoData(storeId);
        for (const p of demoProducts) await setDoc(doc(db, "stores", storeId, "products", p.id), { ...p, storeId });
        for (const s of demoSales) await setDoc(doc(db, "stores", storeId, "sales", s.id), { ...s, storeId });
        toast.info("¡Datos de prueba generados exitosamente! 📊");
      }

      setUserStores(prev => [...prev, newStore]);
      handleSelectStore(newStore);
      toast.success("¡Tienda creada con éxito! 🚀");
    } catch (error: any) {
      toast.error(error.message || "Error al completar el onboarding");
    } finally {
      setIsStoreLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent, mode: "login" | "signup") => {
    e.preventDefault();
    if (!authEmail || !authPassword) return toast.error("Completa todos los campos");
    if (authEmail === "admin@stockmaster.ai" && authPassword === "Admin#123") {
      try {
        await signInWithEmailAndPassword(auth, authEmail, authPassword);
        toast.success("¡Bienvenido, Admin! 🚀");
      } catch (err: any) {
        if (err.code === "auth/user-not-found" || err.code === "auth/invalid-credential") toast.error("Usuario no encontrado. Ejecuta primero: npm run seed");
        else toast.error("Error al iniciar sesión");
      }
      return;
    }
    try {
      if (mode === "signup") {
        const result = await createUserWithEmailAndPassword(auth, authEmail, authPassword);
        await updateProfile(result.user, { displayName: authDisplayName });
        await setDoc(doc(db, "users", result.user.uid), { uid: result.user.uid, displayName: authDisplayName, email: authEmail, createdAt: new Date().toISOString() }, { merge: true });
        toast.success("Cuenta creada correctamente");
      } else {
        await signInWithEmailAndPassword(auth, authEmail, authPassword);
        toast.success("Bienvenido");
      }
    } catch (error: any) {
      const message = error.code === "auth/wrong-password" ? "Contraseña incorrecta" :
        error.code === "auth/user-not-found" ? "Usuario no encontrado" :
        error.code === "auth/email-already-in-use" ? "El email ya está en uso" :
        error.code === "auth/operation-not-allowed" ? "El registro por email está deshabilitado en Firebase Console." :
        "Error de autenticación";
      toast.error(message);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await setDoc(doc(db, "users", result.user.uid), { uid: result.user.uid, displayName: result.user.displayName, email: result.user.email, photoURL: result.user.photoURL, lastLogin: new Date().toISOString() }, { merge: true });
    } catch { toast.error("Error al iniciar con Google"); }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("lastStoreId");
      localStorage.removeItem("demo_user");
      setCurrentStore(null);
      setMemberRole(null);
      toast.success("Sesión cerrada");
    } catch { toast.error("Error al cerrar sesión"); }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStore || !tempBranding) return;
    setIsSavingSettings(true);
    try {
      await updateDoc(doc(db, "stores", currentStore.id), { branding: tempBranding });
      setCurrentStore(prev => prev ? ({ ...prev, branding: tempBranding }) : null);
      toast.success("Ajustes guardados correctamente ✨");
    } catch { toast.error("Error al guardar los ajustes"); }
    finally { setIsSavingSettings(false); }
  };

  const handleAddProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    try {
      const id = editingProduct?.id || Math.random().toString(36).substr(2, 9);
      const costPriceRaw = parseFloat(formData.get("costPrice") as string);
      const newProduct: Product = {
        id, storeId: currentStore!.id, name,
        code: (formData.get("code") as string) || generateProductCode(name),
        brand: (formData.get("brand") as string) || "Genérico",
        price: parseFloat(formData.get("price") as string) || 0,
        costPrice: isNaN(costPriceRaw) ? undefined : costPriceRaw,
        quantity: editingProduct ? editingProduct.quantity : parseInt(formData.get("quantity") as string) || 0,
        category: formData.get("category") as string || "General",
        minStockLevel: parseInt(formData.get("minStock") as string) || 5,
        lastUpdated: new Date().toISOString(),
      };
      await setDoc(doc(db, "stores", currentStore!.id, "products", id), newProduct);
      toast.success(editingProduct ? "Producto actualizado" : "Producto añadido");
      setIsAddDialogOpen(false);
      setEditingProduct(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `stores/${currentStore!.id}/products`);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!currentStore) return;
    try {
      await deleteDoc(doc(db, "stores", currentStore.id, "products", id));
      toast.success("Producto eliminado");
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `stores/${currentStore.id}/products/${id}`);
    }
  };

  const handleStartCheckout = () => {
    if (!user || !currentStore) { toast.error("Debes iniciar sesión para realizar ventas"); return; }
    if (cart.length === 0) { toast.error("El carrito está vacío"); return; }
    for (const item of cart) {
      const product = products.find(p => p.id === item.productId);
      if (!product || product.quantity < item.quantity) { toast.error(`Stock insuficiente para ${item.productName}`); return; }
    }
    setIsCustomerFormOpen(true);
  };

  const handleFinalizeSale = async (customer: Customer) => {
    if (!user || !currentStore || cart.length === 0) return;
    setIsProcessingSale(true);
    try {
      const totalAmount = cart.reduce((acc, item) => acc + item.totalPrice, 0);
      const totals = calculateTotals(totalAmount);
      const saleId = `sale_${Date.now()}`;
      const invoiceNumber = generateInvoiceNumber(sales.length);
      const cleanCustomer: Customer = {
        fullName: customer.fullName, idNumber: customer.idNumber,
        ...(customer.phone && { phone: customer.phone }),
        ...(customer.address && { address: customer.address }),
        ...(customer.email && { email: customer.email }),
      };
      const newSale: SaleRecord = {
        id: saleId, storeId: currentStore.id, items: cart, totalAmount,
        date: new Date().toISOString(), userId: user.uid, customer: cleanCustomer,
        subtotal: totals.subtotal, taxRate: TAX_RATE, taxAmount: totals.taxAmount,
        invoiceNumber, emailSent: false,
      };
      if (activeBranchId) newSale.branchId = activeBranchId;

      await setDoc(doc(db, "stores", currentStore.id, "sales", saleId), newSale);
      for (const item of cart) {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          await updateDoc(doc(db, "stores", currentStore.id, "products", product.id), { quantity: product.quantity - item.quantity, lastUpdated: new Date().toISOString() });
        }
      }

      const invoicePayload: InvoicePdfPayload = { sale: newSale, store: currentStore, customer };
      const emailResult = await sendInvoiceByEmail(invoicePayload);
      if (emailResult.success) await updateDoc(doc(db, "stores", currentStore.id, "sales", saleId), { emailSent: true });

      try {
        const pdfDoc = generateInvoicePdf(invoicePayload);
        const pdfBlob = pdfDoc.output("blob") as Blob;
        const pdfUrl = await uploadInvoicePdf(currentStore.id, invoiceNumber, pdfBlob);
        await updateDoc(doc(db, "stores", currentStore.id, "sales", saleId), { invoicePdfUrl: pdfUrl });
      } catch { }

      setIsCustomerFormOpen(false);
      setCart([]);
      setSaleConfirmation({ open: true, invoicePayload, emailSent: emailResult.success, emailMessage: emailResult.message });
      toast.success("Venta registrada con éxito");
    } catch (error) {
      toast.error("Error al procesar la venta");
      handleFirestoreError(error, OperationType.WRITE, `stores/${currentStore.id}/sales`);
    } finally {
      setIsProcessingSale(false);
    }
  };

  const handleDownloadInvoice = () => {
    if (saleConfirmation.invoicePayload) downloadInvoicePdf(saleConfirmation.invoicePayload);
    setSaleConfirmation(prev => ({ ...prev, open: false }));
    setActiveTab("dashboard");
  };

  const handleCloseConfirmation = () => {
    setSaleConfirmation(prev => ({ ...prev, open: false }));
    setActiveTab("dashboard");
  };

  const handleRestock = async () => {
    if (!user || !currentStore || !restockProductId || !restockQuantity) return;
    try {
      const qty = parseInt(restockQuantity);
      const product = products.find(p => p.id === restockProductId);
      if (!product) return;
      const restockId = `restock_${Date.now()}`;
      const newRestock: RestockRecord = { id: restockId, storeId: currentStore.id, productId: restockProductId, productName: product.name, quantity: qty, date: new Date().toISOString(), userId: user.uid };
      if (activeBranchId) newRestock.branchId = activeBranchId;
      await setDoc(doc(db, "stores", currentStore.id, "restocks", restockId), newRestock);
      await updateDoc(doc(db, "stores", currentStore.id, "products", product.id), { quantity: product.quantity + qty, lastUpdated: new Date().toISOString() });
      setRestockProductId("");
      setRestockQuantity("");
      toast.success(`Se han añadido ${qty} unidades a ${product.name}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `stores/${currentStore.id}/restocks`);
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStore || !isAdmin) return;
    try {
      const memberId = inviteEmail.replace(/\./g, "_");
      await setDoc(doc(db, "stores", currentStore.id, "members", memberId), { userId: "", storeId: currentStore.id, role: inviteRole, email: inviteEmail, displayName: inviteEmail.split("@")[0], joinedAt: new Date().toISOString() });
      toast.success(`Invitación enviada a ${inviteEmail}`);
      setIsInviteDialogOpen(false);
      setInviteEmail("");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `stores/${currentStore.id}/members`);
    }
  };

  const handleUpdateMemberRole = async (memberEmail: string, newRole: UserRole) => {
    if (!currentStore || !isAdmin) return;
    try {
      await updateDoc(doc(db, "stores", currentStore.id, "members", memberEmail.replace(/\./g, "_")), { role: newRole });
      toast.success("Rol actualizado");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `stores/${currentStore.id}/members`);
    }
  };

  const handleRemoveMember = async (memberEmail: string) => {
    if (!currentStore || !isAdmin) return;
    if (memberEmail === user?.email) return toast.error("No puedes eliminarte a ti mismo");
    try {
      await deleteDoc(doc(db, "stores", currentStore.id, "members", memberEmail.replace(/\./g, "_")));
      toast.success("Miembro eliminado");
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `stores/${currentStore.id}/members`);
    }
  };

  const addToCart = (product: Product, quantity: number) => {
    if (quantity <= 0) return;
    if (quantity > product.quantity) { toast.error(`Stock insuficiente para ${product.name}`); return; }
    const existingItem = cart.find(item => item.productId === product.id);
    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      if (newQuantity > product.quantity) { toast.error(`Stock insuficiente para ${product.name}`); return; }
      setCart(cart.map(item => item.productId === product.id ? { ...item, quantity: newQuantity, totalPrice: newQuantity * item.unitPrice } : item));
    } else {
      setCart([...cart, { productId: product.id, productName: product.name, quantity, unitPrice: product.price, totalPrice: quantity * product.price }]);
    }
    toast.success(`${product.name} añadido al carrito`);
  };

  const removeFromCart = (productId: string) => setCart(cart.filter(item => item.productId !== productId));

  const isAdmin = memberRole === "admin";
  const canEdit = memberRole === "admin" || memberRole === "employee";

  // ─── Render: Loading ──────────────────────────────────────────────
  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="animate-spin text-indigo-600 w-10 h-10" />
          <p className="text-slate-500 font-medium">Cargando StockMaster AI...</p>
        </div>
      </div>
    );
  }

  // ─── Render: Auth ─────────────────────────────────────────────────
  if (!user || !currentStore) {
    if (user && authView === "onboarding") {
      return <OnboardingWizard currentUser={user} onComplete={handleOnboardingComplete} onGoogleSignIn={handleGoogleLogin} />;
    }
    if (!user && (authView === "login" || authView === "signup")) {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
          <div className="mb-8 flex flex-col items-center">
            <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-indigo-200 mb-4 transform -rotate-3 transition-transform hover:rotate-0">
              <Package className="text-white w-8 h-8" />
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">StockMaster <span className="text-indigo-600">Pro</span></h1>
            <p className="text-slate-500 font-medium">Gestión de inventario para el futuro</p>
          </div>

          <Card className="w-full max-w-md shadow-2xl border-none p-1 bg-white rounded-3xl overflow-hidden">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl font-bold">Bienvenido</CardTitle>
              <CardDescription>
                {authView === "login" ? "Ingresa para gestionar tu inventario" : "Crea tu cuenta administradora"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {authView === "login" ? (
                <form onSubmit={(e) => handleEmailAuth(e, "login")} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input type="email" placeholder="email@ejemplo.com" value={authEmail} onChange={e => setAuthEmail(e.target.value)} required className="h-12 rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label>Contraseña</Label>
                    <Input type="password" placeholder="••••••••" value={authPassword} onChange={e => setAuthPassword(e.target.value)} required className="h-12 rounded-xl" />
                  </div>
                  <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 rounded-xl text-white font-bold text-lg shadow-lg shadow-indigo-100 transition-all">
                    Iniciar Sesión
                  </Button>
                  <div className="text-center">
                    <Button variant="link" type="button" onClick={() => setAuthView("signup")} className="text-indigo-600">¿No tienes cuenta? Regístrate</Button>
                  </div>
                  <div className="relative">
                    <Separator className="my-6" />
                    <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-[10px] text-slate-400 font-bold uppercase">O entra con</span>
                  </div>
                  <Button variant="outline" type="button" onClick={handleGoogleLogin} className="w-full h-12 gap-3 border-2 hover:bg-slate-50 rounded-xl">
                    <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
                    Google Login
                  </Button>
                </form>
              ) : (
                <form onSubmit={(e) => handleEmailAuth(e, "signup")} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nombre Completo</Label>
                    <Input placeholder="Tu Nombre" value={authDisplayName} onChange={e => setAuthDisplayName(e.target.value)} required className="h-12 rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input type="email" placeholder="email@ejemplo.com" value={authEmail} onChange={e => setAuthEmail(e.target.value)} required className="h-12 rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label>Contraseña</Label>
                    <Input type="password" placeholder="Mínimo 6 caracteres" value={authPassword} onChange={e => setAuthPassword(e.target.value)} required className="h-12 rounded-xl" />
                  </div>
                  <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 rounded-xl text-white font-bold text-lg shadow-lg shadow-indigo-100">
                    Siguiente: Crear Tienda
                  </Button>
                  <div className="text-center">
                    <Button variant="link" type="button" onClick={() => setAuthView("login")} className="text-indigo-600">¿Ya tienes cuenta? Ingresa</Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
          <div className="mt-8 text-center">
            <p className="text-xs text-slate-400 font-medium">© 2024 StockMaster Pro - Todos los derechos reservados</p>
          </div>
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="animate-spin text-indigo-600 w-10 h-10" />
          <p className="text-slate-500 font-medium">Cargando tu tienda...</p>
        </div>
      </div>
    );
  }

  // ─── Render: Main App ─────────────────────────────────────────────
  const primaryColor = currentStore?.branding?.primaryColor;

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center overflow-x-hidden">
      <Toaster position="top-right" />
      <div className="w-full max-w-[1600px] bg-white flex flex-col md:flex-row shadow-2xl shadow-slate-200/50 min-h-screen relative">

        {/* Mobile Header */}
        <div className="md:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg" style={{ backgroundColor: primaryColor || "#4F46E5" }}>
              <Package className="text-white w-5 h-5" />
            </div>
            <h1 className="text-lg font-bold tracking-tight">{currentStore?.name || "StockMaster"}</h1>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </Button>
        </div>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setIsMobileMenuOpen(false)}
                className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden"
              />
              <motion.div
                initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed left-0 top-0 h-full w-72 bg-white z-50 p-6 md:hidden shadow-2xl"
              >
                <div className="flex items-center gap-2 mb-10">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: primaryColor || "#4F46E5" }}>
                    <Package className="text-white w-6 h-6" />
                  </div>
                  <h1 className="text-xl font-bold tracking-tight">{currentStore?.name || "StockMaster"}</h1>
                </div>
                <nav className="space-y-2">
                  {[
                    { tab: "dashboard", icon: <LayoutDashboard size={20} />, label: "Dashboard" },
                    { tab: "inventory", icon: <Package size={20} />, label: "Inventario" },
                    { tab: "products", icon: <Edit2 size={20} />, label: "Productos" },
                    { tab: "new-sale", icon: <Plus size={20} />, label: "Nueva Venta" },
                    { tab: "sales", icon: <ShoppingCart size={20} />, label: "Ventas" },
                    { tab: "ai", icon: <BrainCircuit size={20} />, label: "Insights IA" },
                  ].map(({ tab, icon, label }) => (
                    <NavItem key={tab} active={activeTab === tab} onClick={() => { setActiveTab(tab); setIsMobileMenuOpen(false); }} icon={icon} label={label} primaryColor={primaryColor} />
                  ))}
                </nav>
                <div className="mt-auto pt-6 border-t border-slate-100 space-y-2">
                  <div className="flex items-center gap-3 px-4 py-2">
                    <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden">
                      {user.photoURL ? <img src={user.photoURL} alt={user.displayName || "User"} referrerPolicy="no-referrer" /> : <UserIcon className="w-full h-full p-1.5 text-slate-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{user.displayName}</p>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    </div>
                  </div>
                  <Button variant="ghost" className="w-full justify-start gap-3 text-slate-500 hover:text-rose-600 hover:bg-rose-50" onClick={handleLogout}>
                    <LogOut size={18} /><span>Cerrar Sesión</span>
                  </Button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Sidebar Desktop */}
        <div className="sticky left-0 top-0 h-screen w-72 bg-white border-r border-slate-100 p-5 hidden md:flex flex-col shadow-sm z-30 overflow-y-auto">
          <div className="flex items-center gap-3 mb-5 px-2 cursor-pointer" onClick={() => setActiveTab("dashboard")}>
            <div className="p-2.5 rounded-xl shadow-lg transition-transform hover:scale-105" style={{ backgroundColor: primaryColor || "#4F46E5" }}>
              <Package className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-none">{currentStore?.name || "StockMaster"}</h1>
              <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mt-1">PRO ENGINE</p>
            </div>
          </div>

          <div className="mb-4 px-2 space-y-2">
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-200">
              <StoreIcon size={16} style={{ color: primaryColor || "#4F46E5" }} className="shrink-0" />
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-slate-900 truncate">{currentStore?.name}</p>
                <p className="text-[10px] text-slate-500 capitalize">{memberRole}</p>
              </div>
            </div>
            {branches.length > 0 && (
              <Select value={activeBranchId ?? "all"} onValueChange={(v) => setActiveBranchId(v === "all" ? null : v)} disabled={!isAdmin}>
                <SelectTrigger className="w-full h-9 bg-white border-slate-200 text-xs"><SelectValue placeholder="Sucursal" /></SelectTrigger>
                <SelectContent>
                  {isAdmin && <SelectItem value="all">Todas las sucursales</SelectItem>}
                  {branches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </div>

          <nav className="space-y-2 flex-1">
            <NavItem active={activeTab === "dashboard"} onClick={() => setActiveTab("dashboard")} icon={<LayoutDashboard size={20} />} label="Dashboard" primaryColor={primaryColor} />
            <NavItem active={activeTab === "inventory"} onClick={() => setActiveTab("inventory")} icon={<Package size={20} />} label="Inventario" primaryColor={primaryColor} />
            <NavItem active={activeTab === "products"} onClick={() => setActiveTab("products")} icon={<Edit2 size={20} />} label="Productos" primaryColor={primaryColor} />
            {isAdmin && <NavItem active={activeTab === "team"} onClick={() => setActiveTab("team")} icon={<Users size={20} />} label="Equipo" primaryColor={primaryColor} />}
            <NavItem active={activeTab === "new-sale"} onClick={() => setActiveTab("new-sale")} icon={<Plus size={20} />} label="Nueva Venta" primaryColor={primaryColor} />
            <NavItem active={activeTab === "sales"} onClick={() => setActiveTab("sales")} icon={<ShoppingCart size={20} />} label="Ventas" primaryColor={primaryColor} />
            <NavItem active={activeTab === "ai"} onClick={() => setActiveTab("ai")} icon={<BrainCircuit size={20} />} label="Insights IA" primaryColor={primaryColor} />
            {isAdmin && (
              <NavItem
                active={activeTab === "settings"}
                onClick={() => { setActiveTab("settings"); setTempBranding(currentStore?.branding || { primaryColor: '#4f46e5', secondaryColor: '#4338ca', backgroundColor: '#f8fafc' }); }}
                icon={<Settings size={20} />}
                label="Ajustes"
                primaryColor={primaryColor}
              />
            )}
          </nav>

          <div className="mt-auto pt-4 border-t border-slate-100 space-y-2">
            <div className="flex items-center gap-2.5 px-2 py-1">
              <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 overflow-hidden shadow-inner flex-shrink-0">
                {user.photoURL ? <img src={user.photoURL} alt={user.displayName || "User"} referrerPolicy="no-referrer" className="w-full h-full object-cover" /> : <UserIcon className="w-full h-full p-1.5 text-slate-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-900 truncate">{user.displayName}</p>
                <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="w-full justify-start gap-2.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl px-3 h-8" onClick={handleLogout}>
              <LogOut size={15} /><span className="font-medium text-sm">Cerrar Sesión</span>
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 min-h-screen transition-colors duration-500 bg-brand-bg">
          <div className="max-w-7xl mx-auto p-6 md:p-10 lg:p-12">
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-12">
              <div>
                <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
                  {activeTab === "dashboard" ? "Resumen de Negocio" :
                   activeTab === "inventory" ? "Control de Inventario" :
                   activeTab === "products" ? "Catálogo de Productos" :
                   activeTab === "new-sale" ? "Nueva Venta" :
                   activeTab === "sales" ? "Reporte de Ventas" :
                   activeTab === "settings" ? "Ajustes de Tienda" :
                   activeTab === "team" ? "Equipo" :
                   "Inteligencia Artificial"}
                </h2>
                <p className="text-slate-500 mt-1 font-medium">Panel de Control: {currentStore?.name}</p>
              </div>
              <div className="flex items-center gap-3">
                {(activeTab === "products" || activeTab === "inventory") && (
                  <ExcelExport data={prepareInventoryForExport(products)} fileName={`Inventario_${currentStore?.name}_${new Date().toISOString().split('T')[0]}`} sheetName="Inventario" />
                )}
                {activeTab === "sales" && (
                  <ExcelExport data={prepareSalesForExport(sales)} fileName={`Ventas_${currentStore?.name}_${new Date().toISOString().split('T')[0]}`} sheetName="Ventas" />
                )}
                <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg shadow-sm">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    En vivo · {lastSync.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
              </div>
            </header>

            <AnimatePresence mode="wait">
              {activeTab === "dashboard" && (
                <DashboardPage
                  analytics={analytics}
                  stats={stats}
                  salesHistoryData={salesHistoryData}
                  aiInsights={aiInsights}
                  isAnalyzing={isAnalyzing}
                  runAIAnalysis={async () => {
                    setIsAnalyzing(true);
                    try {
                      const [replenishment, analysis] = await Promise.all([
                        getAIReplenishmentSuggestions(products, sales, currentStore?.description),
                        getAIBusinessAnalysis(products, sales, currentStore?.description),
                      ]);
                      setAiInsights([...replenishment, ...analysis]);
                      toast.success("Análisis de IA completado");
                    } catch { toast.error("Error al ejecutar el análisis de IA"); }
                    finally { setIsAnalyzing(false); }
                  }}
                />
              )}
              {activeTab === "products" && (
                <ProductsPage
                  filteredProducts={filteredProducts}
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  categoryFilter={categoryFilter}
                  setCategoryFilter={setCategoryFilter}
                  categories={categories}
                  canEdit={canEdit}
                  isAddDialogOpen={isAddDialogOpen}
                  setIsAddDialogOpen={setIsAddDialogOpen}
                  editingProduct={editingProduct}
                  setEditingProduct={setEditingProduct}
                  handleAddProduct={handleAddProduct}
                  handleDeleteProduct={handleDeleteProduct}
                />
              )}
              {activeTab === "inventory" && (
                <InventoryPage
                  inventoryTab={inventoryTab}
                  setInventoryTab={setInventoryTab}
                  filteredProducts={filteredProducts}
                  products={products}
                  stats={stats}
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  getDaysOfStock={getDaysOfStock}
                  getRestockSuggestion={getRestockSuggestion}
                  restockProductId={restockProductId}
                  setRestockProductId={setRestockProductId}
                  restockQuantity={restockQuantity}
                  setRestockQuantity={setRestockQuantity}
                  restocks={restocks}
                  handleRestock={handleRestock}
                  setActiveTab={setActiveTab}
                />
              )}
              {activeTab === "team" && isAdmin && (
                <TeamPage
                  currentStore={currentStore}
                  isAdmin={isAdmin}
                  members={members}
                  user={user}
                  isInviteDialogOpen={isInviteDialogOpen}
                  setIsInviteDialogOpen={setIsInviteDialogOpen}
                  inviteEmail={inviteEmail}
                  setInviteEmail={setInviteEmail}
                  inviteRole={inviteRole}
                  setInviteRole={setInviteRole}
                  handleInviteMember={handleInviteMember}
                  handleUpdateMemberRole={handleUpdateMemberRole}
                  handleRemoveMember={handleRemoveMember}
                />
              )}
              {activeTab === "sales" && (
                <SalesPage
                  sales={sales}
                  salesDateFilter={salesDateFilter}
                  setSalesDateFilter={setSalesDateFilter}
                  salesRangeType={salesRangeType}
                  setSalesRangeType={setSalesRangeType}
                  activeBranchId={activeBranchId}
                  branches={branches}
                  currentStore={currentStore}
                />
              )}
              {activeTab === "ai" && (
                <AIPage
                  products={products}
                  sales={sales}
                  storeDescription={currentStore?.description}
                />
              )}
              {activeTab === "new-sale" && (
                <NewSalePage
                  products={products}
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  cart={cart}
                  addToCart={addToCart}
                  removeFromCart={removeFromCart}
                  handleStartCheckout={handleStartCheckout}
                />
              )}
              {activeTab === "settings" && isAdmin && (
                <SettingsPage
                  currentStore={currentStore}
                  setCurrentStore={setCurrentStore}
                  tempBranding={tempBranding}
                  setTempBranding={setTempBranding}
                  isSavingSettings={isSavingSettings}
                  handleSaveSettings={handleSaveSettings}
                />
              )}
            </AnimatePresence>
          </div>

          <CustomerForm
            open={isCustomerFormOpen}
            totalAmount={cart.reduce((acc, item) => acc + item.totalPrice, 0)}
            isProcessing={isProcessingSale}
            onCancel={() => setIsCustomerFormOpen(false)}
            onSubmit={handleFinalizeSale}
          />
          {saleConfirmation.invoicePayload && (
            <SaleConfirmationDialog
              open={saleConfirmation.open}
              invoiceNumber={saleConfirmation.invoicePayload.sale.invoiceNumber || ""}
              customerName={saleConfirmation.invoicePayload.customer.fullName}
              customerEmail={saleConfirmation.invoicePayload.customer.email}
              emailSent={saleConfirmation.emailSent}
              emailMessage={saleConfirmation.emailMessage}
              onDownload={handleDownloadInvoice}
              onClose={handleCloseConfirmation}
            />
          )}
        </main>
      </div>
    </div>
  );
}
