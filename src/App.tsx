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
  signInAnonymously, createUserWithEmailAndPassword, updateProfile, updatePassword,
  reauthenticateWithCredential, EmailAuthProvider, signOut,
  onAuthStateChanged, linkWithCredential, GoogleAuthProvider,
  collection, doc, setDoc, updateDoc, deleteDoc,
  getDoc, getDocs, query, orderBy, onSnapshot, addDoc, serverTimestamp,
  handleFirestoreError, OperationType, User, OAuthCredential,
} from "./lib/firebase";
import {
  Product, SaleItem, SaleRecord, InventoryStats, RestockRecord,
  Store, UserRole, StoreMember, Branch, TempStoreSettings,
} from "./types";
import { LogIn, LogOut, User as UserIcon, Store as StoreIcon, ShieldCheck, Users, Download, UserPlus, Settings, ChevronRight } from "lucide-react";
import { ExcelExport, prepareSalesForExport, prepareInventoryForExport } from "./components/ExcelExport";
import { CustomerForm } from "./components/CustomerForm";
import { SaleConfirmationDialog } from "./components/SaleConfirmationDialog";
import {
  TAX_RATE, generateInvoiceNumber, generateInvoicePdf, calculateTotals,
  downloadInvoicePdf, sendInvoiceByEmail, type InvoicePdfPayload,
} from "./lib/invoiceService";
import { uploadInvoicePdf, uploadStoreLogo } from "./lib/supabase";
import { Customer } from "./types";
import { OnboardingWizard, OnboardingData } from "./components/OnboardingWizard";
import { NavItem } from "./components/NavItem";
import { generateDemoData } from "./lib/demoData";
import { generateProductCode } from "./lib/formatters";
import { checkIsSuperAdmin } from "./lib/superAdminService";
import { getContrastColor } from "./lib/utils";
import { SuperAdminPage } from "./pages/SuperAdminPage";

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
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [tempSettings, setTempSettings] = useState<TempStoreSettings | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [restocks, setRestocks] = useState<RestockRecord[]>([]);

  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
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

  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  // Account linking state (hybrid login: Google OAuth ↔ email/password)
  const [pendingLinkEmail, setPendingLinkEmail] = useState('');
  const [pendingLinkCredential, setPendingLinkCredential] = useState<OAuthCredential | null>(null);
  const [linkPassword, setLinkPassword] = useState('');
  const [isLinkingAccount, setIsLinkingAccount] = useState(false);

  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authDisplayName, setAuthDisplayName] = useState("");
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authView, setAuthView] = useState<"login" | "signup" | "onboarding">("login");
  const authViewRef = React.useRef<"login" | "signup" | "onboarding">("login");
  const setAuthViewTracked = (v: "login" | "signup" | "onboarding") => {
    authViewRef.current = v;
    setAuthView(v);
  };

  const [salesDateFilter, setSalesDateFilter] = useState<string>(new Date().toISOString().split('T')[0]);
  const [salesRangeType, setSalesRangeType] = useState<'day' | 'week' | 'month'>('day');
  const [lastSync, setLastSync] = useState<Date>(new Date());

  const [restockProductId, setRestockProductId] = useState<string>("");
  const [restockQuantity, setRestockQuantity] = useState<string>("");

  const [members, setMembers] = useState<StoreMember[]>([]);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<UserRole>("employee");
  const [inviteAuthMethod, setInviteAuthMethod] = useState<'google' | 'email'>('email');
  const [invitePassword, setInvitePassword] = useState("");

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
    const root = document.documentElement;
    const b = currentStore?.branding;
    if (b) {
      root.style.setProperty('--brand-primary', b.primaryColor);
      root.style.setProperty('--brand-secondary', b.secondaryColor);
      root.style.setProperty('--brand-bg', b.backgroundColor);
      root.style.setProperty('--brand-text', b.textColor || '#0f172a');
      root.style.setProperty('--brand-text-secondary', b.textSecondaryColor || '#64748b');
    } else {
      ['--brand-primary','--brand-secondary','--brand-bg','--brand-text','--brand-text-secondary']
        .forEach(v => root.style.removeProperty(v));
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
        const superAdmin = await checkIsSuperAdmin(currentUser.email || '');
        if (superAdmin) {
          setIsSuperAdmin(true);
          setIsStoreLoading(false);
          return;
        }
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
            // Check if user has a pending store invitation
            const userEmail = currentUser.email;
            if (userEmail) {
              const inviteKey = userEmail.replace(/\./g, "_");
              const inviteDoc = await getDoc(doc(db, "userInvitations", inviteKey));
              if (inviteDoc.exists()) {
                const invite = inviteDoc.data();
                await setDoc(doc(db, "users", currentUser.uid, "userStores", invite.storeId), { role: invite.role });
                await updateDoc(doc(db, "stores", invite.storeId, "members", inviteKey), { userId: currentUser.uid });
                await deleteDoc(doc(db, "userInvitations", inviteKey));
                const storeDoc = await getDoc(doc(db, "stores", invite.storeId));
                if (storeDoc.exists()) {
                  const storeData = { ...storeDoc.data(), id: storeDoc.id } as Store;
                  setUserStores([storeData]);
                  handleSelectStore(storeData);
                  return;
                }
              }
            }
            // No stores, no invitation — only go to onboarding if not already there
            if (authViewRef.current !== "onboarding") {
              setAuthViewTracked("onboarding");
            }
          }
        } catch {
          if (authViewRef.current !== "onboarding") {
            setAuthViewTracked("onboarding");
          }
        }
      } else {
        setAuthViewTracked("login");
        setCurrentStore(null);
        setUserStores([]);
        setMemberRole(null);
        setIsSuperAdmin(false);
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

  // ─── Helpers ──────────────────────────────────────────────────────
  const buildTempSettings = (store: Store): TempStoreSettings => ({
    name: store.name || '',
    businessType: store.businessType || '',
    description: store.description || '',
    logoUrl: store.logoUrl || '',
    legalName: store.legalName || '',
    nit: store.nit || '',
    fiscalAddress: store.fiscalAddress || '',
    fiscalPhone: store.fiscalPhone || '',
    branding: {
      primaryColor: store.branding?.primaryColor || '#4f46e5',
      secondaryColor: store.branding?.secondaryColor || '#4338ca',
      backgroundColor: store.branding?.backgroundColor || '#f8fafc',
      textColor: store.branding?.textColor || '#0f172a',
      textSecondaryColor: store.branding?.textSecondaryColor || '#64748b',
    },
  });

  // ─── Handlers ─────────────────────────────────────────────────────
  const handleSelectStore = async (store: Store) => {
    setIsStoreLoading(true);
    try {
      const uid = auth.currentUser?.uid ?? (user as any)?.uid;
      const email = auth.currentUser?.email ?? (user as any)?.email;
      if (!uid) { toast.error("No hay sesión activa"); setIsStoreLoading(false); return; }
      // Try by UID first (legacy), then by email (new stores)
      let memberDoc = await getDoc(doc(db, "stores", store.id, "members", uid));
      if (!memberDoc.exists() && email) {
        memberDoc = await getDoc(doc(db, "stores", store.id, "members", email.replace(/\./g, "_")));
      }
      if (memberDoc.exists()) {
        setMemberRole(memberDoc.data().role as UserRole);
        setCurrentStore(store);
        setTempSettings(buildTempSettings(store));
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
            } else {
              const msg = getAuthError(error, 'onboarding');
              throw new Error(msg || error.message);
            }
          }
        }
        await setDoc(doc(db, "users", activeUser.uid), { uid: activeUser.uid, displayName: onboardingData.adminInfo.displayName, email: onboardingData.adminInfo.email, createdAt: new Date().toISOString() }, { merge: true });
      }
      if (!activeUser) throw new Error("Error de autenticación");

      const storeId = `store_${Math.random().toString(36).substr(2, 9)}`;
      const newStore: Store = { id: storeId, name: onboardingData.storeName, businessType: onboardingData.businessType, description: onboardingData.aiDescription, ownerId: activeUser.uid, createdAt: new Date().toISOString(), branding: { ...onboardingData.branding, textColor: '#0f172a', textSecondaryColor: '#64748b' } };
      await setDoc(doc(db, "stores", storeId), newStore);
      // Store admin member by email (consistent with employee lookup)
      const adminKey = activeUser.email!.replace(/\./g, "_");
      await setDoc(doc(db, "stores", storeId, "members", adminKey), { userId: activeUser.uid, storeId, role: "admin", email: activeUser.email!, displayName: activeUser.displayName || activeUser.email?.split("@")[0] });
      for (const emp of onboardingData.employees) {
        const empKey = emp.email.replace(/\./g, "_");
        await setDoc(doc(db, "stores", storeId, "members", empKey), { ...emp, storeId, userId: "", joinedAt: new Date().toISOString() });
        // Store invitation so employee can be auto-linked on first login
        await setDoc(doc(db, "userInvitations", empKey), { storeId, role: emp.role, email: emp.email, displayName: emp.displayName, authMethod: emp.authMethod });
      }
      await setDoc(doc(db, "users", activeUser.uid, "userStores", storeId), { role: "admin" });

      if (onboardingData.logoFile) {
        try {
          const logoUrl = await uploadStoreLogo(storeId, onboardingData.logoFile);
          await updateDoc(doc(db, "stores", storeId), { logoUrl });
          newStore.logoUrl = logoUrl;
        } catch { /* logo upload failure is non-critical */ }
      }

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

  // ─── Auth error messages ──────────────────────────────────────────
  const getAuthError = (error: any, mode: 'login' | 'signup' | 'google' | 'onboarding'): string | null => {
    const code = error?.code as string | undefined;
    switch (code) {
      case 'auth/invalid-email':
        return 'El formato del email no es válido.';
      case 'auth/user-not-found':
        return 'No existe ninguna cuenta con este email.';
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return mode === 'login'
          ? 'Contraseña incorrecta. ¿Quizás te registraste con Google?'
          : 'Contraseña incorrecta.';
      case 'auth/email-already-in-use':
        return 'Ya existe una cuenta con este email. Intenta iniciar sesión.';
      case 'auth/weak-password':
        return 'La contraseña debe tener al menos 6 caracteres.';
      case 'auth/too-many-requests':
        return 'Demasiados intentos fallidos. Espera unos minutos e intenta de nuevo.';
      case 'auth/network-request-failed':
        return 'Error de red. Verifica tu conexión a internet.';
      case 'auth/user-disabled':
        return 'Esta cuenta ha sido deshabilitada. Contacta al administrador.';
      case 'auth/operation-not-allowed':
        return mode === 'signup'
          ? 'El registro por email está deshabilitado. Usa Google u otro método.'
          : 'Este método de acceso no está habilitado.';
      case 'auth/popup-closed-by-user':
      case 'auth/cancelled-popup-request':
        return null; // user cancelled intentionally, no toast needed
      case 'auth/popup-blocked':
        return 'El popup fue bloqueado. Permite ventanas emergentes para este sitio.';
      case 'auth/account-exists-with-different-credential':
        return null; // handled separately (link dialog)
      default:
        return mode === 'google' ? 'Error al iniciar sesión con Google.' : 'Error de autenticación. Intenta de nuevo.';
    }
  };

  const handleEmailAuth = async (e: React.FormEvent, mode: "login" | "signup") => {
    e.preventDefault();
    if (!authEmail || !authPassword) return toast.error("Completa email y contraseña.");
    if (mode === "signup" && !authDisplayName.trim()) return toast.error("Ingresa tu nombre completo.");
    if (authEmail === "admin@stockmaster.ai" && authPassword === "Admin#123") {
      setIsAuthLoading(true);
      try {
        await signInWithEmailAndPassword(auth, authEmail, authPassword);
        toast.success("¡Bienvenido, Admin!");
      } catch (err: any) {
        toast.error("Usuario no encontrado. Ejecuta primero: npm run seed");
      } finally { setIsAuthLoading(false); }
      return;
    }
    setIsAuthLoading(true);
    try {
      if (mode === "signup") {
        const result = await createUserWithEmailAndPassword(auth, authEmail, authPassword);
        await updateProfile(result.user, { displayName: authDisplayName });
        await setDoc(doc(db, "users", result.user.uid), { uid: result.user.uid, displayName: authDisplayName, email: authEmail, createdAt: new Date().toISOString() }, { merge: true });
        toast.success("Cuenta creada. Bienvenido!");
      } else {
        await signInWithEmailAndPassword(auth, authEmail, authPassword);
        toast.success("Sesión iniciada. Bienvenido!");
      }
    } catch (error: any) {
      const msg = getAuthError(error, mode === "signup" ? "signup" : "login");
      if (msg) toast.error(msg);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await setDoc(doc(db, "users", result.user.uid), { uid: result.user.uid, displayName: result.user.displayName, email: result.user.email, photoURL: result.user.photoURL, lastLogin: new Date().toISOString() }, { merge: true });
    } catch (error: any) {
      if (error.code === 'auth/account-exists-with-different-credential') {
        const credential = GoogleAuthProvider.credentialFromError(error);
        const email = error.customData?.email || '';
        setPendingLinkEmail(email);
        setPendingLinkCredential(credential);
        setLinkPassword('');
      } else {
        const msg = getAuthError(error, 'google');
        if (msg) toast.error(msg);
      }
    }
  };

  const handleLinkAccounts = async () => {
    if (!pendingLinkEmail || !pendingLinkCredential || !linkPassword) return;
    setIsLinkingAccount(true);
    try {
      // Sign in with existing email/password account
      const result = await signInWithEmailAndPassword(auth, pendingLinkEmail, linkPassword);
      // Link the Google credential to this account
      await linkWithCredential(result.user, pendingLinkCredential);
      // Update profile with Google photo if missing
      await setDoc(doc(db, "users", result.user.uid), { lastLogin: new Date().toISOString() }, { merge: true });
      toast.success("¡Cuentas vinculadas! Ahora puedes usar Google o email/contraseña indistintamente.");
      setPendingLinkEmail('');
      setPendingLinkCredential(null);
      setLinkPassword('');
    } catch (err: any) {
      const msg = err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential'
        ? 'Contraseña incorrecta'
        : 'Error al vincular cuentas';
      toast.error(msg);
    } finally {
      setIsLinkingAccount(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("lastStoreId");
      localStorage.removeItem("demo_user");
      setCurrentStore(null);
      setMemberRole(null);
      setAuthViewTracked("login");
      toast.success("Sesión cerrada");
    } catch { toast.error("Error al cerrar sesión"); }
  };

  const handleChangePassword = async (currentPassword: string, newPassword: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser || !currentUser.email) throw new Error("No hay sesión activa");
    const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
    await reauthenticateWithCredential(currentUser, credential);
    await updatePassword(currentUser, newPassword);
  };

  const handleSaveSettings = async () => {
    if (!currentStore || !tempSettings) return;
    setIsSavingSettings(true);
    try {
      const update = {
        name: tempSettings.name,
        businessType: tempSettings.businessType,
        description: tempSettings.description,
        logoUrl: tempSettings.logoUrl,
        legalName: tempSettings.legalName,
        nit: tempSettings.nit,
        fiscalAddress: tempSettings.fiscalAddress,
        fiscalPhone: tempSettings.fiscalPhone,
        branding: tempSettings.branding,
      };
      await updateDoc(doc(db, "stores", currentStore.id), update);
      setCurrentStore(prev => prev ? ({ ...prev, ...update }) : null);
      toast.success("Ajustes guardados correctamente");
    } catch { toast.error("Error al guardar los ajustes"); }
    finally { setIsSavingSettings(false); }
  };

  const handleLogoFileSelect = async (file: File) => {
    if (!currentStore) return;
    setIsUploadingLogo(true);
    try {
      const url = await uploadStoreLogo(currentStore.id, file);
      setTempSettings(prev => prev ? { ...prev, logoUrl: url } : prev);
    setCurrentStore(prev => prev ? { ...prev, logoUrl: url } : prev);
    } catch { toast.error("Error al subir el logo"); }
    finally { setIsUploadingLogo(false); }
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
      const memberData = { userId: "", storeId: currentStore.id, role: inviteRole, email: inviteEmail, displayName: inviteEmail.split("@")[0], joinedAt: new Date().toISOString(), authMethod: inviteAuthMethod };
      await setDoc(doc(db, "stores", currentStore.id, "members", memberId), memberData);
      const invitationData: any = { storeId: currentStore.id, role: inviteRole, email: inviteEmail, displayName: inviteEmail.split("@")[0], authMethod: inviteAuthMethod };
      if (inviteAuthMethod === 'email' && invitePassword) invitationData.tempPassword = invitePassword;
      await setDoc(doc(db, "userInvitations", memberId), invitationData);
      toast.success(`Miembro ${inviteEmail} agregado al equipo`);
      setIsInviteDialogOpen(false);
      setInviteEmail("");
      setInviteAuthMethod('email');
      setInvitePassword("");
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

  // ─── Render: Super Admin ─────────────────────────────────────────
  if (user && isSuperAdmin) {
    return <SuperAdminPage user={user} onLogout={handleLogout} />;
  }

  // ─── Render: Auth ─────────────────────────────────────────────────
  if (!user || !currentStore) {
    // Onboarding: accessible with or without user (Google sign-in happens inside wizard)
    if (authView === "onboarding") {
      return <OnboardingWizard currentUser={user} onComplete={handleOnboardingComplete} onGoogleSignIn={handleGoogleLogin} onBack={() => setAuthViewTracked("login")} />;
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
              <CardTitle className="text-2xl font-bold">
                {authView === "login" ? "Bienvenido" : "Crear cuenta"}
              </CardTitle>
              <CardDescription>
                {authView === "login" ? "Ingresa para gestionar tu inventario" : "Regístrate como empleado invitado"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {authView === "login" ? (
                <form onSubmit={(e) => handleEmailAuth(e, "login")} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      placeholder="email@ejemplo.com"
                      value={authEmail}
                      onChange={e => setAuthEmail(e.target.value)}
                      disabled={isAuthLoading}
                      required
                      className="h-12 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Contraseña</Label>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={authPassword}
                      onChange={e => setAuthPassword(e.target.value)}
                      disabled={isAuthLoading}
                      required
                      className="h-12 rounded-xl"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={isAuthLoading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 rounded-xl text-white font-bold text-lg shadow-lg shadow-indigo-100 transition-all disabled:opacity-70"
                  >
                    {isAuthLoading
                      ? <RefreshCw size={18} className="animate-spin" />
                      : "Iniciar Sesión"}
                  </Button>
                  <div className="relative">
                    <Separator className="my-4" />
                    <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-[10px] text-slate-400 font-bold uppercase">O continúa con</span>
                  </div>
                  <Button
                    variant="outline"
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={isAuthLoading}
                    className="w-full h-12 gap-3 border-2 hover:bg-slate-50 rounded-xl"
                  >
                    <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
                    Iniciar con Google
                  </Button>
                  <div className="relative">
                    <Separator className="my-4" />
                    <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-[10px] text-slate-400 font-bold uppercase">¿Nuevo por aquí?</span>
                  </div>
                  <Button
                    type="button"
                    onClick={() => setAuthViewTracked("onboarding")}
                    disabled={isAuthLoading}
                    className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base shadow-lg shadow-emerald-100 transition-all"
                  >
                    <UserPlus size={18} className="mr-2" />
                    Registrar mi tienda
                  </Button>
                </form>
              ) : (
                <form onSubmit={(e) => handleEmailAuth(e, "signup")} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nombre Completo</Label>
                    <Input
                      placeholder="Tu Nombre"
                      value={authDisplayName}
                      onChange={e => setAuthDisplayName(e.target.value)}
                      disabled={isAuthLoading}
                      required
                      className="h-12 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      placeholder="email@ejemplo.com"
                      value={authEmail}
                      onChange={e => setAuthEmail(e.target.value)}
                      disabled={isAuthLoading}
                      required
                      className="h-12 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Contraseña</Label>
                    <Input
                      type="password"
                      placeholder="Mínimo 6 caracteres"
                      value={authPassword}
                      onChange={e => setAuthPassword(e.target.value)}
                      disabled={isAuthLoading}
                      required
                      className="h-12 rounded-xl"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={isAuthLoading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 rounded-xl text-white font-bold text-lg shadow-lg shadow-indigo-100 disabled:opacity-70"
                  >
                    {isAuthLoading
                      ? <RefreshCw size={18} className="animate-spin" />
                      : "Crear cuenta"}
                  </Button>
                  <div className="text-center">
                    <Button variant="link" type="button" onClick={() => setAuthViewTracked("login")} className="text-indigo-600">
                      ¿Ya tienes cuenta? Ingresa
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
          <div className="mt-8 text-center">
            <p className="text-xs text-slate-400 font-medium">© 2024 StockMaster Pro - Todos los derechos reservados</p>
          </div>

          {/* ── Account linking overlay ── */}
          <AnimatePresence>
            {pendingLinkEmail && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0, y: 12 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.95, opacity: 0, y: 12 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="w-full max-w-sm shadow-2xl border-none rounded-3xl overflow-hidden">
                    <CardHeader className="text-center pb-2 pt-8">
                      <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <img src="https://www.google.com/favicon.ico" className="w-7 h-7" alt="Google" />
                      </div>
                      <CardTitle className="text-xl">Vincular cuenta de Google</CardTitle>
                      <CardDescription className="text-sm leading-relaxed">
                        Ya existe una cuenta con{' '}
                        <span className="font-semibold text-slate-700">{pendingLinkEmail}</span>.{' '}
                        Ingresa tu contraseña para vincular Google a esta cuenta.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 px-6 pb-8">
                      <Input
                        type="password"
                        placeholder="Tu contraseña actual"
                        value={linkPassword}
                        onChange={e => setLinkPassword(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleLinkAccounts()}
                        className="h-12 rounded-xl"
                        autoFocus
                      />
                      <Button
                        onClick={handleLinkAccounts}
                        disabled={!linkPassword || isLinkingAccount}
                        className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold disabled:opacity-40"
                      >
                        {isLinkingAccount
                          ? <RefreshCw size={16} className="animate-spin" />
                          : 'Vincular y entrar'}
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => { setPendingLinkEmail(''); setPendingLinkCredential(null); setLinkPassword(''); }}
                        className="w-full text-slate-400 hover:text-slate-700"
                      >
                        Cancelar
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
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
  const primaryColor = currentStore?.branding?.primaryColor || "#6366f1";
  const fontFamily = currentStore?.branding?.fontFamily;
  const textColor = currentStore?.branding?.textColor || "#0f172a";
  const backgroundColor = currentStore?.branding?.backgroundColor || "#f8fafc";

  return (
    <div 
      className="h-screen overflow-hidden flex justify-center font-sans transition-colors duration-500"
      style={{ 
        '--brand-font': fontFamily,
        backgroundColor: backgroundColor,
        color: textColor
      } as React.CSSProperties}
    >
      <Toaster position="top-right" />
      <div className="w-full max-w-[1600px] bg-white flex flex-col md:flex-row shadow-2xl shadow-slate-200/50 h-full relative">

        {/* Mobile Header */}
        <div className="md:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between flex-shrink-0 z-50">
          <div className="flex items-center gap-2">
            {currentStore?.logoUrl ? (
              <img src={currentStore.logoUrl} alt="logo" className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
            ) : (
              <div className="p-1.5 rounded-lg" style={{ backgroundColor: primaryColor || "#4F46E5" }}>
                <Package className="text-white w-5 h-5" />
              </div>
            )}
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
                  {currentStore?.logoUrl ? (
                    <img src={currentStore.logoUrl} alt="logo" className="w-9 h-9 rounded-xl object-cover flex-shrink-0" />
                  ) : (
                    <div className="p-2 rounded-lg" style={{ backgroundColor: primaryColor || "#4F46E5" }}>
                      <Package className="text-white w-6 h-6" />
                    </div>
                  )}
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
        <div
          className="w-72 h-full p-5 hidden md:flex flex-col z-30 overflow-y-auto flex-shrink-0"
          style={{ backgroundColor: primaryColor || "#4f46e5" }}
        >
          {/* Logo + store name */}
          <div 
            className={`flex items-center gap-4 mb-8 px-2 cursor-pointer group ${getContrastColor(primaryColor || "#4f46e5") === "black" ? "text-slate-900" : "text-white"}`} 
            onClick={() => setActiveTab("dashboard")}
          >
            {currentStore?.logoUrl ? (
              <div className="relative">
                <img src={currentStore.logoUrl} alt="logo" className="w-12 h-12 rounded-2xl object-cover flex-shrink-0 ring-4 ring-white/10 shadow-2xl transition-transform group-hover:scale-105" />
                <div className="absolute inset-0 rounded-2xl shadow-[inset_0_0_12px_rgba(255,255,255,0.1)] pointer-events-none" />
              </div>
            ) : (
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ring-4 ring-white/5 ${getContrastColor(primaryColor || "#4f46e5") === "black" ? "bg-black/10" : "bg-white/10"}`}>
                <Package className={`w-7 h-7 ${getContrastColor(primaryColor || "#4f46e5") === "black" ? "text-slate-900" : "text-white"}`} />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className={`text-xl font-extrabold tracking-tight leading-tight truncate ${getContrastColor(primaryColor || "#4f46e5") === "black" ? "text-slate-900" : "text-white"}`}>
                {currentStore?.name || "StockMaster"}
              </h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${getContrastColor(primaryColor || "#4f46e5") === "black" ? "bg-slate-900" : "bg-emerald-400"}`} />
                <p className={`text-[10px] uppercase tracking-widest font-black ${getContrastColor(primaryColor || "#4f46e5") === "black" ? "text-slate-900/40" : "text-white/50"}`}>
                  Sistema Activo
                </p>
              </div>
            </div>
          </div>

          {/* Store / branch selector */}
          <div className="mb-6 px-2 space-y-2">
            <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border backdrop-blur-sm ${getContrastColor(primaryColor || "#4f46e5") === "black" ? "bg-black/5 border-black/5" : "bg-white/5 border-white/5"}`}>
              <StoreIcon size={16} className={`shrink-0 ${getContrastColor(primaryColor || "#4f46e5") === "black" ? "text-slate-900/40" : "text-white/40"}`} />
              <div className="overflow-hidden">
                <p className={`text-[11px] font-bold truncate leading-none mb-1 ${getContrastColor(primaryColor || "#4f46e5") === "black" ? "text-slate-900" : "text-white/90"}`}>
                  {currentStore?.name}
                </p>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[9px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded leading-none ${getContrastColor(primaryColor || "#4f46e5") === "black" ? "bg-black/5 text-slate-900/40" : "bg-white/5 text-white/30"}`}>
                    {memberRole}
                  </span>
                </div>
              </div>
            </div>
            {branches.length > 0 && (
              <Select value={activeBranchId ?? "all"} onValueChange={(v) => setActiveBranchId(v === "all" ? null : v)} disabled={!isAdmin}>
                <SelectTrigger className={`w-full h-10 border text-xs rounded-xl focus:ring-opacity-20 ${getContrastColor(primaryColor || "#4f46e5") === "black" ? "bg-black/5 border-black/10 text-slate-950 focus:ring-black" : "bg-white/5 border-white/10 text-white focus:ring-white"}`}>
                  <SelectValue placeholder="Sucursal" />
                </SelectTrigger>
                <SelectContent className={`${getContrastColor(primaryColor || "#4f46e5") === "black" ? "bg-white border-slate-200 text-slate-950" : "bg-slate-900 border-white/10 text-white"}`}>
                  {isAdmin && <SelectItem value="all">Todas las sucursales</SelectItem>}
                  {branches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Navigation */}
          <nav className="space-y-1 flex-1">
            <NavItem 
              dark={getContrastColor(primaryColor || "#4f46e5") === "white"} 
              active={activeTab === "dashboard"} 
              onClick={() => setActiveTab("dashboard")} 
              icon={<LayoutDashboard size={18} />} 
              label="Dashboard" 
            />
            <NavItem 
              dark={getContrastColor(primaryColor || "#4f46e5") === "white"} 
              active={activeTab === "inventory"} 
              onClick={() => setActiveTab("inventory")} 
              icon={<Package size={18} />} 
              label="Inventario" 
            />
            <NavItem 
              dark={getContrastColor(primaryColor || "#4f46e5") === "white"} 
              active={activeTab === "products"} 
              onClick={() => setActiveTab("products")} 
              icon={<Edit2 size={18} />} 
              label="Productos" 
            />
            {isAdmin && (
              <NavItem 
                dark={getContrastColor(primaryColor || "#4f46e5") === "white"} 
                active={activeTab === "team"} 
                onClick={() => setActiveTab("team")} 
                icon={<Users size={18} />} 
                label="Equipo" 
              />
            )}
            <NavItem 
              dark={getContrastColor(primaryColor || "#4f46e5") === "white"} 
              active={activeTab === "new-sale"} 
              onClick={() => setActiveTab("new-sale")} 
              icon={<Plus size={18} />} 
              label="Nueva Venta" 
            />
            <NavItem 
              dark={getContrastColor(primaryColor || "#4f46e5") === "white"} 
              active={activeTab === "sales"} 
              onClick={() => setActiveTab("sales")} 
              icon={<ShoppingCart size={18} />} 
              label="Ventas" 
            />
            <NavItem 
              dark={getContrastColor(primaryColor || "#4f46e5") === "white"} 
              active={activeTab === "ai"} 
              onClick={() => setActiveTab("ai")} 
              icon={<BrainCircuit size={18} />} 
              label="Asistente IA" 
            />
            {isAdmin && (
              <NavItem
                dark={getContrastColor(primaryColor || "#4f46e5") === "white"}
                active={activeTab === "settings"}
                onClick={() => { setActiveTab("settings"); if (currentStore) setTempSettings(buildTempSettings(currentStore)); }}
                icon={<Settings size={18} />}
                label="Ajustes"
              />
            )}
          </nav>

          {/* User section */}
          <div className={`mt-auto pt-6 border-t space-y-2 ${getContrastColor(primaryColor || "#4f46e5") === "black" ? "border-black/5" : "border-white/10"}`}>
            <div className="flex items-center gap-3 px-3 py-2">
              <div className={`w-10 h-10 rounded-2xl border overflow-hidden flex-shrink-0 shadow-inner ${getContrastColor(primaryColor || "#4f46e5") === "black" ? "bg-black/10 border-black/10" : "bg-white/10 border-white/10"}`}>
                {user.photoURL
                  ? <img src={user.photoURL} alt={user.displayName || "User"} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                  : <UserIcon className={`w-full h-full p-2 ${getContrastColor(primaryColor || "#4f46e5") === "black" ? "text-slate-900/40" : "text-white/40"}`} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-[13px] font-bold truncate ${getContrastColor(primaryColor || "#4f46e5") === "black" ? "text-slate-900" : "text-white"}`}>
                  {user.displayName}
                </p>
                <p className={`text-[10px] truncate font-medium ${getContrastColor(primaryColor || "#4f46e5") === "black" ? "text-slate-900/40" : "text-white/40"}`}>
                  {user.email}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all text-sm font-semibold group ${
                getContrastColor(primaryColor || "#4f46e5") === "black" 
                  ? "text-slate-900/60 hover:text-slate-950 hover:bg-black/5" 
                  : "text-white/60 hover:text-white hover:bg-white/10"
              }`}
            >
              <LogOut size={16} className="group-hover:translate-x-0.5 transition-transform" /><span>Cerrar Sesión</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto transition-colors duration-500 bg-brand-bg">
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
                  onOpenAI={() => setActiveTab("ai")}
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
                  inviteAuthMethod={inviteAuthMethod}
                  setInviteAuthMethod={setInviteAuthMethod}
                  invitePassword={invitePassword}
                  setInvitePassword={setInvitePassword}
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
                  storeName={currentStore?.name}
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
              {activeTab === "settings" && isAdmin && tempSettings && (
                <SettingsPage
                  storeId={currentStore.id}
                  tempSettings={tempSettings}
                  setTempSettings={setTempSettings as React.Dispatch<React.SetStateAction<TempStoreSettings>>}
                  isUploadingLogo={isUploadingLogo}
                  onLogoFileSelect={handleLogoFileSelect}
                  isSavingSettings={isSavingSettings}
                  handleSaveSettings={handleSaveSettings}
                  user={user}
                  onChangePassword={handleChangePassword}
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
