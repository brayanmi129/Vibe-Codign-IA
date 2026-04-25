/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react";
import { useState, useEffect, useMemo } from "react";
import { 
  LayoutDashboard, 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  Plus, 
  Search, 
  Filter,
  BrainCircuit,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
  Trash2,
  Edit2,
  RefreshCw,
  ShoppingCart,
  Calendar,
  DollarSign,
  History,
  ArrowRightLeft,
  Menu,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Toaster } from "@/components/ui/sonner";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  Cell
} from "recharts";
import { 
  auth, 
  db, 
  googleProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword,
  signInAnonymously,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut, 
  onAuthStateChanged, 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc,
  getDocs, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  addDoc,
  serverTimestamp,
  handleFirestoreError,
  OperationType,
  User 
} from "./lib/firebase";
import { Product, SaleItem, SaleRecord, InventoryStats, AIInsight, RestockRecord, Store, UserRole, StoreMember } from "./types";
import { getAIReplenishmentSuggestions, getAIBusinessAnalysis } from "./lib/inventoryService";
import { LogIn, LogOut, User as UserIcon, Store as StoreIcon, ShieldCheck, Users, Download, UserPlus } from "lucide-react";
import { ExcelExport, prepareSalesForExport, prepareInventoryForExport } from "./components/ExcelExport";
import { OnboardingWizard, OnboardingData } from "./components/OnboardingWizard";

// Sample Data
// Massive Demo Data Generation
const generateDemoData = (storeId: string) => {
  const products: Product[] = [
    { id: 'p1', name: 'MacBook Pro M3', brand: 'Apple', category: 'Laptops', price: 2499, quantity: 15, minStockLevel: 5, code: 'MAC-M3-01' },
    { id: 'p2', name: 'Dell XPS 15', brand: 'Dell', category: 'Laptops', price: 1899, quantity: 8, minStockLevel: 3, code: 'DELL-XPS-15' },
    { id: 'p3', name: 'Keyboard MX Keys', brand: 'Logitech', category: 'Periféricos', price: 109, quantity: 45, minStockLevel: 10, code: 'LOGI-MX' },
    { id: 'p4', name: 'Monitor 4K 32"', brand: 'Samsung', category: 'Monitores', price: 599, quantity: 12, minStockLevel: 4, code: 'SAM-4K-32' },
    { id: 'p5', name: 'Mouse MX Master 3S', brand: 'Logitech', category: 'Periféricos', price: 99, quantity: 30, minStockLevel: 8, code: 'LOGI-M3S' },
    { id: 'p6', name: 'iPad Air', brand: 'Apple', category: 'Tablets', price: 599, quantity: 20, minStockLevel: 5, code: 'IPAD-AIR' },
    { id: 'p7', name: 'Sony WH-1000XM5', brand: 'Sony', category: 'Audio', price: 349, quantity: 25, minStockLevel: 6, code: 'SONY-XM5' },
    { id: 'p8', name: 'SSD 2TB NVMe', brand: 'Samsung', category: 'Componentes', price: 179, quantity: 50, minStockLevel: 15, code: 'SS-2TB' },
    { id: 'p9', name: 'RTX 4080', brand: 'NVIDIA', category: 'Componentes', price: 1199, quantity: 5, minStockLevel: 2, code: 'RTX-4080' },
    { id: 'p10', name: 'Stream Deck XL', brand: 'Elgato', category: 'Streaming', price: 249, quantity: 10, minStockLevel: 3, code: 'ELGATO-XL' },
  ];

  // Add more variety to reach 30+ items
  for(let i = 11; i <= 30; i++) {
    products.push({
      id: `p${i}`,
      name: `Accesorio Tech #${i}`,
      brand: i % 2 === 0 ? 'Generic' : 'ProTech',
      category: 'Accesorios',
      price: Math.floor(Math.random() * 100) + 20,
      quantity: Math.floor(Math.random() * 20) + 5,
      minStockLevel: 10,
      code: `ACC-${i}`
    });
  }

  const sales: SaleRecord[] = [];
  const now = new Date();
  
  // Generate ~120 sales over the last 30 days
  for(let i = 0; i < 120; i++) {
    const saleDate = new Date();
    saleDate.setDate(now.getDate() - Math.floor(Math.random() * 30));
    const randomProduct = products[Math.floor(Math.random() * products.length)];
    const qty = Math.floor(Math.random() * 3) + 1;
    
    sales.push({
      id: `s_demo_${i}`,
      date: saleDate.toISOString(),
      items: [{
        productId: randomProduct.id,
        name: randomProduct.name,
        price: randomProduct.price,
        quantity: qty
      }],
      total: randomProduct.price * qty,
      userId: 'admin_demo_id'
    });
  }

  return { products, sales };
};

const INITIAL_PRODUCTS: Product[] = [
  { id: "1", name: "Leche Entera 1L", code: "LEC001", brand: "Colun", price: 4200, quantity: 45, category: "Lácteos", minStockLevel: 10, lastUpdated: new Date().toISOString() },
  { id: "2", name: "Pan de Molde", code: "PAN002", brand: "Ideal", price: 6500, quantity: 8, category: "Panadería", minStockLevel: 15, lastUpdated: new Date().toISOString() },
  { id: "3", name: "Arroz Extra 1kg", code: "ARR003", brand: "Tucapel", price: 3800, quantity: 60, category: "Despensa", minStockLevel: 20, lastUpdated: new Date().toISOString() },
  { id: "4", name: "Detergente Líquido", code: "DET004", brand: "Omo", price: 24500, quantity: 5, category: "Limpieza", minStockLevel: 8, lastUpdated: new Date().toISOString() },
  { id: "5", name: "Café Molido 250g", code: "CAF005", brand: "Nescafé", price: 12900, quantity: 25, category: "Despensa", minStockLevel: 10, lastUpdated: new Date().toISOString() },
];

const INITIAL_SALES: SaleRecord[] = [
  // Hoy
  { 
    id: "s_today_1", 
    items: [
      { productId: "1", productName: "Leche Entera 1L", quantity: 3, unitPrice: 4200, totalPrice: 12600 },
      { productId: "2", productName: "Pan de Molde", quantity: 1, unitPrice: 6500, totalPrice: 6500 }
    ], 
    totalAmount: 19100, 
    date: new Date().toISOString() 
  },
  { 
    id: "s_today_2", 
    items: [
      { productId: "3", productName: "Arroz Extra 1kg", quantity: 2, unitPrice: 3800, totalPrice: 7600 },
      { productId: "5", productName: "Café Molido 250g", quantity: 1, unitPrice: 12900, totalPrice: 12900 }
    ], 
    totalAmount: 20500, 
    date: new Date(Date.now() - 3600000 * 2).toISOString() 
  },
  // Ayer
  { 
    id: "s_yest_1", 
    items: [
      { productId: "4", productName: "Detergente Líquido", quantity: 1, unitPrice: 24500, totalPrice: 24500 },
      { productId: "1", productName: "Leche Entera 1L", quantity: 6, unitPrice: 4200, totalPrice: 25200 }
    ], 
    totalAmount: 49700, 
    date: new Date(Date.now() - 86400000).toISOString() 
  },
  { 
    id: "s_yest_2", 
    items: [
      { productId: "2", productName: "Pan de Molde", quantity: 4, unitPrice: 6500, totalPrice: 26000 }
    ], 
    totalAmount: 26000, 
    date: new Date(Date.now() - 86400000 - 3600000 * 5).toISOString() 
  },
  // Hace 2 días
  { 
    id: "s_2d_1", 
    items: [
      { productId: "3", productName: "Arroz Extra 1kg", quantity: 10, unitPrice: 3800, totalPrice: 38000 },
      { productId: "1", productName: "Leche Entera 1L", quantity: 4, unitPrice: 4200, totalPrice: 16800 }
    ], 
    totalAmount: 54800, 
    date: new Date(Date.now() - 86400000 * 2).toISOString() 
  },
  // Hace 3 días
  { 
    id: "s_3d_1", 
    items: [
      { productId: "5", productName: "Café Molido 250g", quantity: 3, unitPrice: 12900, totalPrice: 38700 },
      { productId: "2", productName: "Pan de Molde", quantity: 2, unitPrice: 6500, totalPrice: 13000 }
    ], 
    totalAmount: 51700, 
    date: new Date(Date.now() - 86400000 * 3).toISOString() 
  },
  // Hace 4 días
  { 
    id: "s_4d_1", 
    items: [
      { productId: "1", productName: "Leche Entera 1L", quantity: 12, unitPrice: 4200, totalPrice: 50400 }
    ], 
    totalAmount: 50400, 
    date: new Date(Date.now() - 86400000 * 4).toISOString() 
  },
  // Hace 5 días
  { 
    id: "s_5d_1", 
    items: [
      { productId: "4", productName: "Detergente Líquido", quantity: 2, unitPrice: 24500, totalPrice: 49000 },
      { productId: "3", productName: "Arroz Extra 1kg", quantity: 5, unitPrice: 3800, totalPrice: 19000 }
    ], 
    totalAmount: 68000, 
    date: new Date(Date.now() - 86400000 * 5).toISOString() 
  },
  // Hace 6 días
  { 
    id: "s_6d_1", 
    items: [
      { productId: "2", productName: "Pan de Molde", quantity: 8, unitPrice: 6500, totalPrice: 52000 },
      { productId: "1", productName: "Leche Entera 1L", quantity: 2, unitPrice: 4200, totalPrice: 8400 }
    ], 
    totalAmount: 60400, 
    date: new Date(Date.now() - 86400000 * 6).toISOString() 
  },
];

// Helper to generate a product code
const generateProductCode = (name: string) => {
  const prefix = name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X').padEnd(3, 'X');
  const random = Math.floor(100 + Math.random() * 900);
  return `${prefix}${random}`;
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function App() {
  const [user, setUser] = useState<User | any>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [currentStore, setCurrentStore] = useState<Store | null>(null);
  const [userStores, setUserStores] = useState<Store[]>([]);
  const [memberRole, setMemberRole] = useState<UserRole | null>(null);
  const [isStoreLoading, setIsStoreLoading] = useState(false);
  
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

  // Auth State
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authDisplayName, setAuthDisplayName] = useState("");
  const [authView, setAuthView] = useState<"login" | "signup" | "select-store" | "register-store" | "onboarding">("login");
  const [newStoreName, setNewStoreName] = useState("");

  // Sales Filter State
  const [salesDateFilter, setSalesDateFilter] = useState<string>(new Date().toISOString().split('T')[0]);
  const [salesRangeType, setSalesRangeType] = useState<'day' | 'week' | 'month'>('day');

  // Restock Form State
  const [restockProductId, setRestockProductId] = useState<string>("");
  const [restockQuantity, setRestockQuantity] = useState<string>("");

  // Analytics Calculations
  const analytics = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const getSalesForDate = (dateStr: string) => sales.filter(s => s.date.startsWith(dateStr));
    
    const todaySales = getSalesForDate(todayStr);
    const yesterdaySales = getSalesForDate(yesterdayStr);

    const calculateRevenue = (records: SaleRecord[]) => records.reduce((acc, s) => acc + s.totalAmount, 0);
    const calculateUnits = (records: SaleRecord[]) => records.reduce((acc, s) => acc + (s.items || []).reduce((sum, item) => sum + item.quantity, 0), 0);

    const todayRevenue = calculateRevenue(todaySales);
    const yesterdayRevenue = calculateRevenue(yesterdaySales);

    // Week comparison
    const startOfThisWeek = new Date(now);
    startOfThisWeek.setDate(now.getDate() - now.getDay());
    startOfThisWeek.setHours(0,0,0,0);

    const startOfLastWeek = new Date(startOfThisWeek);
    startOfLastWeek.setDate(startOfThisWeek.getDate() - 7);

    const thisWeekSales = sales.filter(s => new Date(s.date) >= startOfThisWeek);
    const lastWeekSales = sales.filter(s => {
      const d = new Date(s.date);
      return d >= startOfLastWeek && d < startOfThisWeek;
    });

    const thisWeekRevenue = calculateRevenue(thisWeekSales);
    const lastWeekRevenue = calculateRevenue(lastWeekSales);

    // Top Products
    const productPerformance = products.map(p => {
      const totalQty = sales.reduce((acc, s) => {
        const item = (s.items || []).find(i => i.productId === p.id);
        return acc + (item ? item.quantity : 0);
      }, 0);
      const totalRev = totalQty * p.price;
      return { ...p, totalQty, totalRev };
    });

    const topByQty = [...productPerformance].sort((a, b) => b.totalQty - a.totalQty).slice(0, 5);
    const topByRev = [...productPerformance].sort((a, b) => b.totalRev - a.totalRev).slice(0, 5);

    // Smart Notifications
    const notifications = [];
    
    // High demand (sold more than 10 units in last 3 days)
    const threeDaysAgo = new Date(now);
    threeDaysAgo.setDate(now.getDate() - 3);
    products.forEach(p => {
      const totalRecent = sales.reduce((acc, s) => {
        if (new Date(s.date) < threeDaysAgo) return acc;
        const item = (s.items || []).find(i => i.productId === p.id);
        return acc + (item ? item.quantity : 0);
      }, 0);
      if (totalRecent > 10) {
        notifications.push({
          id: `high-demand-${p.id}`,
          type: 'high-demand',
          title: 'Alta Demanda',
          message: `${p.name} tiene una rotación alta recientemente.`,
          productId: p.id
        });
      }
    });

    // No movement (no sales in last 7 days)
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);
    products.forEach(p => {
      const hasRecentSales = sales.some(s => 
        new Date(s.date) >= sevenDaysAgo && 
        (s.items || []).some(i => i.productId === p.id)
      );
      if (!hasRecentSales && p.quantity > 0) {
        notifications.push({
          id: `no-movement-${p.id}`,
          type: 'no-movement',
          title: 'Sin Movimiento',
          message: `${p.name} no ha tenido ventas en los últimos 7 días.`,
          productId: p.id
        });
      }
    });

    return {
      todayRevenue,
      yesterdayRevenue,
      revenueChange: yesterdayRevenue === 0 ? 100 : ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100,
      thisWeekRevenue,
      lastWeekRevenue,
      weekChange: lastWeekRevenue === 0 ? 100 : ((thisWeekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100,
      topByQty,
      topByRev,
      notifications
    };
  }, [products, sales]);

  // Days of stock calculation helper
  const getDaysOfStock = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product || product.quantity === 0) return 0;

    // Average sales per day (last 14 days)
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    const recentSales = sales.filter(s => s.productId === productId && new Date(s.date) >= fourteenDaysAgo);
    const totalSold = recentSales.reduce((acc, s) => acc + s.quantity, 0);
    const avgPerDay = totalSold / 14;

    if (avgPerDay === 0) return 999; // Practically infinite
    return Math.round(product.quantity / avgPerDay);
  };

  // Smart Restock Suggestion
  const getRestockSuggestion = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return 0;

    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    const recentSales = sales.filter(s => s.productId === productId && new Date(s.date) >= fourteenDaysAgo);
    const totalSold = recentSales.reduce((acc, s) => acc + s.quantity, 0);
    const avgPerDay = totalSold / 14;

    // Suggest enough for 30 days minus current stock
    const targetStock = Math.ceil(avgPerDay * 30);
    const suggestion = Math.max(0, targetStock - product.quantity);
    
    // If suggestion is 0 but it's low stock, suggest at least minStockLevel * 2
    if (suggestion === 0 && product.quantity <= product.minStockLevel) {
      return product.minStockLevel * 2;
    }

    return suggestion;
  };

  // Theme Effect
  useEffect(() => {
    if (currentStore?.branding) {
      const root = document.documentElement;
      root.style.setProperty('--brand-primary', currentStore.branding.primaryColor);
      root.style.setProperty('--brand-secondary', currentStore.branding.secondaryColor);
      root.style.setProperty('--brand-bg', currentStore.branding.backgroundColor);
      
      // Update shadcn primary if needed, or just use these vars in components
    } else {
      const root = document.documentElement;
      root.style.removeProperty('--brand-primary');
      root.style.removeProperty('--brand-secondary');
      root.style.removeProperty('--brand-bg');
    }
  }, [currentStore]);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (activeUser) => {
      let currentUser = activeUser;
      
      // If no Firebase user, check for local demo user
      if (!currentUser) {
        const demoStorage = localStorage.getItem("demo_user");
        if (demoStorage) {
          currentUser = JSON.parse(demoStorage);
        }
      }

      setUser(currentUser);
      setIsAuthReady(true);
      
      if (currentUser) {
        // Fetch user's stores
        const q = query(collection(db, "users", currentUser.uid, "userStores"));
        const qSnapshot = await getDocs(q);
        const storesIds = qSnapshot.docs.map(doc => doc.id);
        
        if (storesIds.length > 0) {
          const storePromises = storesIds.map(id => getDoc(doc(db, "stores", id)));
          const storeDocs = await Promise.all(storePromises);
          const storesData = storeDocs.map(d => ({ ...d.data(), id: d.id } as Store));
          setUserStores(storesData);
          
          // Auto-select store if only one and none saved
          const savedStoreId = localStorage.getItem("lastStoreId");
          const selected = storesData.find(s => s.id === savedStoreId) || storesData[0];
          
          if (selected) {
             handleSelectStore(selected);
          } else {
            setAuthView("select-store");
          }
        } else {
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

  // Real-time Data Sync (Scoped to Store)
  useEffect(() => {
    if (!user || !currentStore) {
      setProducts([]);
      setSales([]);
      setRestocks([]);
      return;
    }

    const unsubProducts = onSnapshot(
      query(collection(db, "stores", currentStore.id, "products"), orderBy("name")), 
      (snapshot) => {
        setProducts(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Product)));
      }, 
      (error) => handleFirestoreError(error, OperationType.LIST, `stores/${currentStore.id}/products`)
    );

    const unsubSales = onSnapshot(
      query(collection(db, "stores", currentStore.id, "sales"), orderBy("date", "desc")), 
      (snapshot) => {
        setSales(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as SaleRecord)));
      }, 
      (error) => handleFirestoreError(error, OperationType.LIST, `stores/${currentStore.id}/sales`)
    );

    const unsubRestocks = onSnapshot(
      query(collection(db, "stores", currentStore.id, "restocks"), orderBy("date", "desc")), 
      (snapshot) => {
        setRestocks(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as RestockRecord)));
      }, 
      (error) => handleFirestoreError(error, OperationType.LIST, `stores/${currentStore.id}/restocks`)
    );

    return () => {
      unsubProducts();
      unsubSales();
      unsubRestocks();
    };
  }, [user, currentStore]);

  const handleSelectStore = async (store: Store) => {
    setIsStoreLoading(true);
    try {
      // Get role
      const memberDoc = await getDoc(doc(db, "stores", store.id, "members", user.uid));
      if (memberDoc.exists()) {
        setMemberRole(memberDoc.data().role as UserRole);
        setCurrentStore(store);
        localStorage.setItem("lastStoreId", store.id);
        toast.success(`Entrando a ${store.name}`);
      } else {
        toast.error("No tienes acceso a esta tienda");
      }
    } catch (e) {
      toast.error("Error al acceder a la tienda");
    } finally {
      setIsStoreLoading(false);
    }
  };

  const handleOnboardingComplete = async (onboardingData: OnboardingData) => {
    setIsStoreLoading(true);
    try {
      let activeUser = user;

      // 1. Create User if not exists
      if (!activeUser && onboardingData.adminInfo?.password) {
        if (onboardingData.adminInfo.email === "admin@stockmaster.ai") {
          const anonResult = await signInAnonymously(auth);
          activeUser = {
            uid: anonResult.user.uid,
            email: "admin@stockmaster.ai",
            displayName: onboardingData.adminInfo.displayName,
            isDemo: true
          } as any;
          setUser(activeUser);
          localStorage.setItem("demo_user", JSON.stringify(activeUser));
        } else {
          try {
            const result = await createUserWithEmailAndPassword(
              auth, 
              onboardingData.adminInfo.email, 
              onboardingData.adminInfo.password
            );
            await updateProfile(result.user, { displayName: onboardingData.adminInfo.displayName });
            activeUser = result.user;
            setUser(activeUser);
          } catch (error: any) {
            if (error.code === 'auth/operation-not-allowed') {
               activeUser = {
                 uid: `local_${onboardingData.adminInfo.email.replace(/@/g, '_')}`,
                 email: onboardingData.adminInfo.email,
                 displayName: onboardingData.adminInfo.displayName
               } as any;
               setUser(activeUser);
            } else throw error;
          }
        }
        
        await setDoc(doc(db, "users", activeUser.uid), {
          uid: activeUser.uid,
          displayName: onboardingData.adminInfo.displayName,
          email: onboardingData.adminInfo.email,
          createdAt: new Date().toISOString()
        }, { merge: true });
      }

      if (!activeUser) throw new Error("Error de autenticación");

      // 2. Create Store
      const storeId = `store_${Math.random().toString(36).substr(2, 9)}`;
      const newStore: Store = {
        id: storeId,
        name: onboardingData.storeName,
        businessType: onboardingData.businessType,
        description: onboardingData.aiDescription,
        ownerId: activeUser.uid,
        createdAt: new Date().toISOString(),
        branding: onboardingData.branding
      };

      await setDoc(doc(db, "stores", storeId), newStore);

      // 3. Add Admin Member
      const adminMember: StoreMember = {
        userId: activeUser.uid,
        role: "admin",
        email: activeUser.email!,
        displayName: activeUser.displayName || activeUser.email?.split("@")[0]
      };
      await setDoc(doc(db, "stores", storeId, "members", activeUser.uid), adminMember);

      // 4. Add Employees
      for (const emp of onboardingData.employees) {
        const memberId = emp.email.replace(/\./g, "_");
        await setDoc(doc(db, "stores", storeId, "members", memberId), {
          ...emp,
          storeId,
          userId: "", // To be linked on login
          joinedAt: new Date().toISOString()
        });
      }

      // 5. Link User
      await setDoc(doc(db, "users", activeUser.uid, "userStores", storeId), { role: "admin" });

      // 6. Seed Demo Data if admin email
      if (activeUser.email === "admin@stockmaster.ai") {
        const { products: demoProducts, sales: demoSales } = generateDemoData(storeId);
        
        // Seed Products
        for (const p of demoProducts) {
          await setDoc(doc(db, "stores", storeId, "products", p.id), { ...p, storeId });
        }
        
        // Seed Sales
        for (const s of demoSales) {
          await setDoc(doc(db, "stores", storeId, "sales", s.id), { ...s, storeId });
        }
        
        toast.info("¡Datos de prueba generados exitosamente! 📊");
      }

      setUserStores(prev => [...prev, newStore]);
      handleSelectStore(newStore);
      toast.success("¡Tienda creada con éxito! 🚀");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Error al completar el onboarding");
    } finally {
      setIsStoreLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent, mode: "login" | "signup") => {
    e.preventDefault();
    if (!authEmail || !authPassword) return toast.error("Completa todos los campos");

    // DEMO BYPASS: Specific case for the user requested admin login
    if (authEmail === "admin@stockmaster.ai" && authPassword === "admin#123") {
      try {
        // Sign in anonymously so we have a real Firebase session for rules
        const anonResult = await signInAnonymously(auth);
        const demoUser = {
          uid: anonResult.user.uid, // Use actual Firebase UID
          email: "admin@stockmaster.ai",
          displayName: authDisplayName || "Admin StockMaster",
          photoURL: null,
          isDemo: true
        };
        
        localStorage.setItem("demo_user", JSON.stringify(demoUser));
        setUser(demoUser as any);
        
        if (mode === "signup") {
          setAuthView("onboarding");
        } else {
          // Now this query should work because we are "signed in" to Firebase
          const q = query(collection(db, "stores"), where("ownerId", "==", demoUser.uid));
          const snap = await getDocs(q);
          const stores = snap.docs.map(d => ({ id: d.id, ...d.data() } as Store));
          setUserStores(stores);
          
          if (stores.length === 1) {
            handleSelectStore(stores[0]);
          } else if (stores.length > 1) {
            setAuthView("select-store");
          } else {
            setAuthView("onboarding");
          }
        }
        toast.success("¡Acceso de administrador (Modo Demo) concedido! 🚀");
      } catch (err) {
        console.error(err);
        toast.error("Error al iniciar modo demo");
      }
      return;
    }

    try {
      if (mode === "signup") {
        const result = await createUserWithEmailAndPassword(auth, authEmail, authPassword);
        await updateProfile(result.user, { displayName: authDisplayName });
        await setDoc(doc(db, "users", result.user.uid), {
          uid: result.user.uid,
          displayName: authDisplayName,
          email: authEmail,
          createdAt: new Date().toISOString()
        }, { merge: true });
        toast.success("Cuenta creada correctamente");
      } else {
        await signInWithEmailAndPassword(auth, authEmail, authPassword);
        toast.success("Bienvenido");
      }
    } catch (error: any) {
      console.error(error);
      const message = error.code === "auth/wrong-password" ? "Contraseña incorrecta" : 
                      error.code === "auth/user-not-found" ? "Usuario no encontrado" :
                      error.code === "auth/email-already-in-use" ? "El email ya está en uso" :
                      error.code === "auth/operation-not-allowed" ? "El registro por email está deshabilitado en Firebase Console. Usa las credenciales de demo." :
                      "Error de autenticación";
      toast.error(message);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await setDoc(doc(db, "users", result.user.uid), {
        uid: result.user.uid,
        displayName: result.user.displayName,
        email: result.user.email,
        photoURL: result.user.photoURL,
        lastLogin: new Date().toISOString()
      }, { merge: true });
    } catch (error) {
      toast.error("Error al iniciar con Google");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("lastStoreId");
      localStorage.removeItem("demo_user");
      setCurrentStore(null);
      setMemberRole(null);
      toast.success("Sesión cerrada");
    } catch (error) {
      toast.error("Error al cerrar sesión");
    }
  };

  const [members, setMembers] = useState<StoreMember[]>([]);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<StoreRole>("employee");

  // Sync Store Members
  useEffect(() => {
    if (!currentStore) return;
    const q = query(collection(db, "stores", currentStore.id, "members"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMembers(snapshot.docs.map(doc => doc.data() as StoreMember));
    }, (error) => handleFirestoreError(error, OperationType.LIST, `stores/${currentStore.id}/members`));
    return () => unsubscribe();
  }, [currentStore]);

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStore || !isAdmin) return;
    
    try {
      const memberId = inviteEmail.replace(/\./g, "_"); // Simplified ID
      const newMember: StoreMember = {
        userId: "", // Will be linked when user joins, or just use email as identifier for now
        storeId: currentStore.id,
        role: inviteRole,
        email: inviteEmail,
        displayName: inviteEmail.split("@")[0],
        joinedAt: new Date().toISOString()
      };

      await setDoc(doc(db, "stores", currentStore.id, "members", memberId), newMember);
      toast.success(`Invitación enviada a ${inviteEmail}`);
      setIsInviteDialogOpen(false);
      setInviteEmail("");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `stores/${currentStore.id}/members`);
    }
  };

  const handleUpdateMemberRole = async (memberEmail: string, newRole: StoreRole) => {
    if (!currentStore || !isAdmin) return;
    try {
      const memberId = memberEmail.replace(/\./g, "_");
      await updateDoc(doc(db, "stores", currentStore.id, "members", memberId), { role: newRole });
      toast.success("Rol actualizado");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `stores/${currentStore.id}/members`);
    }
  };

  const handleRemoveMember = async (memberEmail: string) => {
    if (!currentStore || !isAdmin) return;
    if (memberEmail === user?.email) return toast.error("No puedes eliminarte a ti mismo");
    
    try {
      const memberId = memberEmail.replace(/\./g, "_");
      await deleteDoc(doc(db, "stores", currentStore.id, "members", memberId));
      toast.success("Miembro eliminado");
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `stores/${currentStore.id}/members`);
    }
  };

  const isAdmin = memberRole === "admin";
  const canEdit = memberRole === "admin" || memberRole === "employee";

  // Data Handlers
  const handleAddProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    
    try {
      const id = editingProduct?.id || Math.random().toString(36).substr(2, 9);
      const newProduct = {
        id,
        name,
        code: (formData.get("code") as string) || generateProductCode(name),
        brand: (formData.get("brand") as string) || "Genérico",
        price: parseFloat(formData.get("price") as string) || 0,
        quantity: editingProduct ? editingProduct.quantity : parseInt(formData.get("quantity") as string) || 0,
        category: formData.get("category") as string || "General",
        minStockLevel: parseInt(formData.get("minStock") as string) || 5,
        lastUpdated: new Date().toISOString()
      };

      await setDoc(doc(db, "users", user.uid, "products", id), newProduct);
      toast.success(editingProduct ? "Producto actualizado" : "Producto añadido");
      setIsAddDialogOpen(false);
      setEditingProduct(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/products`);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, "users", user.uid, "products", id));
      toast.success("Producto eliminado");
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${user.uid}/products/${id}`);
    }
  };

  const handleConfirmSale = async () => {
    if (!user) return toast.error("Debes iniciar sesión para realizar ventas");
    if (cart.length === 0) return;

    try {
      const totalAmount = cart.reduce((acc, item) => acc + item.totalPrice, 0);
      const saleId = `sale_${Date.now()}`;
      
      const newSale: SaleRecord = {
        id: saleId,
        items: cart,
        totalAmount,
        date: new Date().toISOString(),
        userId: user.uid
      };

      // 1. Create sale record
      await setDoc(doc(db, "users", user.uid, "sales", saleId), newSale);

      // 2. Update product quantities
      for (const item of cart) {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          await updateDoc(doc(db, "users", user.uid, "products", product.id), {
            quantity: product.quantity - item.quantity,
            lastUpdated: new Date().toISOString()
          });
        }
      }

      setCart([]);
      toast.success("Venta confirmada con éxito");
      setActiveTab("dashboard");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/sales`);
    }
  };

  const handleRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!restockProductId || !restockQuantity) return;

    try {
      const qty = parseInt(restockQuantity);
      const product = products.find(p => p.id === restockProductId);
      
      if (!product) return;

      const restockId = `restock_${Date.now()}`;
      const newRestock: RestockRecord = {
        id: restockId,
        productId: restockProductId,
        productName: product.name,
        quantity: qty,
        date: new Date().toISOString()
      };

      // 1. Create restock record
      await setDoc(doc(db, "users", user.uid, "restocks", restockId), newRestock);

      // 2. Update product quantity
      await updateDoc(doc(db, "users", user.uid, "products", product.id), {
        quantity: product.quantity + qty,
        lastUpdated: new Date().toISOString()
      });

      setRestockProductId("");
      setRestockQuantity("");
      toast.success(`Se han añadido ${qty} unidades a ${product.name}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/restocks`);
    }
  };

  // Chart Data
  const stockByCategoryData = useMemo(() => {
    const data: Record<string, number> = {};
    products.forEach(p => {
      data[p.category] = (data[p.category] || 0) + p.quantity;
    });
    return Object.entries(data).map(([name, value]) => ({ name, value }));
  }, [products]);

  const salesHistoryData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    return last7Days.map(date => {
      const daySales = sales.filter(s => s.date.startsWith(date));
      const total = daySales.reduce((acc, s) => acc + s.items.reduce((sum, item) => sum + item.quantity, 0), 0);
      return { date: date.split('-').slice(1).join('/'), sales: total };
    });
  }, [sales]);

  // Stats Calculation
  const stats = useMemo<InventoryStats>(() => {
    return {
      totalProducts: products.length,
      totalValue: products.reduce((acc, p) => acc + p.price * p.quantity, 0),
      lowStockCount: products.filter(p => p.quantity > 0 && p.quantity <= p.minStockLevel).length,
      outOfStockCount: products.filter(p => p.quantity === 0).length,
    };
  }, [products]);

  const categories = useMemo(() => {
    return ["all", ...Array.from(new Set(products.map(p => p.category)))];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === "all" || p.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, categoryFilter]);

  // AI Logic
  const runAIAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const [replenishment, analysis] = await Promise.all([
        getAIReplenishmentSuggestions(products, sales, currentStore?.description),
        getAIBusinessAnalysis(products, sales, currentStore?.description)
      ]);
      setAiInsights([...replenishment, ...analysis]);
      toast.success("Análisis de IA completado");
    } catch (error) {
      toast.error("Error al ejecutar el análisis de IA");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const addToCart = (product: Product, quantity: number) => {
    if (quantity <= 0) return;
    if (quantity > product.quantity) {
      toast.error(`Stock insuficiente para ${product.name}`);
      return;
    }

    const existingItem = cart.find(item => item.productId === product.id);
    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      if (newQuantity > product.quantity) {
        toast.error(`Stock insuficiente para ${product.name}`);
        return;
      }
      setCart(cart.map(item => 
        item.productId === product.id 
          ? { ...item, quantity: newQuantity, totalPrice: newQuantity * item.unitPrice }
          : item
      ));
    } else {
      setCart([...cart, {
        productId: product.id,
        productName: product.name,
        quantity,
        unitPrice: product.price,
        totalPrice: quantity * product.price
      }]);
    }
    toast.success(`${product.name} añadido al carrito`);
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

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

  if (!user || !currentStore) {
    if (user && authView === "onboarding") {
      return (
        <OnboardingWizard 
          currentUser={user} 
          onComplete={handleOnboardingComplete} 
          onGoogleSignIn={handleGoogleLogin}
        />
      );
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl border-none p-1 bg-white rounded-3xl overflow-hidden">
          <CardHeader className="text-center bg-indigo-600 text-white rounded-2xl m-2 py-8">
            <div className="mx-auto w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-4">
              <StoreIcon className="text-white w-8 h-8" />
            </div>
            <CardTitle className="text-2xl font-bold">Mis Tiendas</CardTitle>
            <CardDescription className="text-indigo-100 italic">
              Selecciona una sucursal para continuar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            
            {(authView === "select-store" || authView === "register-store") && (
              <div className="space-y-4">
                <div className="grid gap-3 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
                  {userStores.map(store => (
                    <Button 
                      key={store.id} 
                      variant="outline" 
                      className="h-20 justify-start px-6 gap-4 bg-white hover:bg-indigo-50/30 border-slate-100 hover:border-indigo-200 transition-all rounded-2xl group"
                      onClick={() => handleSelectStore(store)}
                      disabled={isStoreLoading}
                    >
                      <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600 flex items-center justify-center transition-colors">
                        <StoreIcon size={20} />
                      </div>
                      <div className="text-left flex-1">
                        <p className="font-bold text-slate-900">{store.name}</p>
                        <Badge variant="outline" className="text-[10px] text-slate-400 font-normal border-slate-100 lowercase">id: {store.id}</Badge>
                      </div>
                      <ChevronRight className="text-slate-300 group-hover:text-indigo-600 transition-colors" size={20} />
                    </Button>
                  ))}
                </div>
                
                <div className="grid grid-cols-2 gap-3 mt-6">
                  <Button variant="outline" onClick={() => setAuthView("onboarding")} className="rounded-xl h-11 border-2">
                    <Plus size={18} className="mr-2" /> Nueva
                  </Button>
                  <Button variant="outline" onClick={handleLogout} className="rounded-xl h-11 border-2 text-rose-600 hover:bg-rose-50 hover:border-rose-100 transition-all">
                    <LogOut size={18} className="mr-2" /> Salir
                  </Button>
                </div>
              </div>
            )}

          </CardContent>
          <div className="p-4 text-center border-t border-slate-100">
             <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">StockMaster Multi-Tenant Engine</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center overflow-x-hidden">
      <Toaster position="top-right" />
      <div className="w-full max-w-[1600px] bg-white flex flex-col md:flex-row shadow-2xl shadow-slate-200/50 min-h-screen relative">
        {/* Mobile Header */}
        <div className="md:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div 
            className="p-1.5 rounded-lg"
            style={{ backgroundColor: currentStore?.branding?.primaryColor || "#4F46E5" }}
          >
            <Package className="text-white w-5 h-5" />
          </div>
          <h1 className="text-lg font-bold tracking-tight">
            {currentStore?.name || "StockMaster"}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden"
            />
            <motion.div 
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 h-full w-72 bg-white z-50 p-6 md:hidden shadow-2xl"
            >
        <div className="flex items-center gap-2 mb-10">
          <div 
            className="p-2 rounded-lg"
            style={{ backgroundColor: currentStore?.branding?.primaryColor || "#4F46E5" }}
          >
            <Package className="text-white w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">
            {currentStore?.name || "StockMaster"}
          </h1>
        </div>
              <nav className="space-y-2">
                <NavItem 
                  active={activeTab === "dashboard"} 
                  onClick={() => { setActiveTab("dashboard"); setIsMobileMenuOpen(false); }}
                  icon={<LayoutDashboard size={20} />}
                  label="Dashboard"
                  primaryColor={currentStore?.branding?.primaryColor}
                />
                <NavItem 
                  active={activeTab === "inventory"} 
                  onClick={() => { setActiveTab("inventory"); setIsMobileMenuOpen(false); }}
                  icon={<Package size={20} />}
                  label="Inventario"
                  primaryColor={currentStore?.branding?.primaryColor}
                />
                <NavItem 
                  active={activeTab === "products"} 
                  onClick={() => { setActiveTab("products"); setIsMobileMenuOpen(false); }}
                  icon={<Edit2 size={20} />}
                  label="Productos"
                  primaryColor={currentStore?.branding?.primaryColor}
                />
                <NavItem 
                  active={activeTab === "new-sale"} 
                  onClick={() => { setActiveTab("new-sale"); setIsMobileMenuOpen(false); }}
                  icon={<Plus size={20} />}
                  label="Nueva Venta"
                  primaryColor={currentStore?.branding?.primaryColor}
                />
                <NavItem 
                  active={activeTab === "sales"} 
                  onClick={() => { setActiveTab("sales"); setIsMobileMenuOpen(false); }}
                  icon={<ShoppingCart size={20} />}
                  label="Ventas"
                  primaryColor={currentStore?.branding?.primaryColor}
                />
                <NavItem 
                  active={activeTab === "ai"} 
                  onClick={() => { setActiveTab("ai"); setIsMobileMenuOpen(false); }}
                  icon={<BrainCircuit size={20} />}
                  label="Insights IA"
                  primaryColor={currentStore?.branding?.primaryColor}
                />
              </nav>

              <div className="mt-auto pt-6 border-t border-slate-100 space-y-2">
                <div className="flex items-center gap-3 px-4 py-2">
                  <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt={user.displayName || "User"} referrerPolicy="no-referrer" />
                    ) : (
                      <UserIcon className="w-full h-full p-1.5 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{user.displayName}</p>
                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start gap-3 text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                  onClick={handleLogout}
                >
                  <LogOut size={18} />
                  <span>Cerrar Sesión</span>
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Sidebar / Nav (Desktop) */}
      <div className="sticky left-0 top-0 h-screen w-80 bg-white border-r border-slate-100 p-8 hidden md:flex flex-col shadow-sm z-30">
        <div className="flex items-center gap-3 mb-10 px-2 cursor-pointer" onClick={() => setActiveTab("dashboard")}>
          <div 
            className="p-2.5 rounded-xl shadow-lg transition-transform hover:scale-105"
            style={{ backgroundColor: currentStore?.branding?.primaryColor || "#4F46E5" }}
          >
            <Package className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-none">
              {currentStore?.name || "StockMaster"}
            </h1>
            <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mt-1">PRO ENGINE</p>
          </div>
        </div>

        <div className="mb-8 px-2">
          <Button 
            variant="outline" 
            className="w-full justify-start gap-3 bg-slate-50 border-slate-200 hover:bg-slate-100"
            onClick={() => setAuthView("select-store")}
          >
            <StoreIcon size={18} style={{ color: currentStore?.branding?.primaryColor || "#4F46E5" }} />
            <div className="text-left overflow-hidden">
              <p className="text-xs font-semibold text-slate-900 truncate">{currentStore?.name}</p>
              <p className="text-[10px] text-slate-500 capitalize">{memberRole}</p>
            </div>
          </Button>
        </div>

        <nav className="space-y-2 flex-1">
          <NavItem 
            active={activeTab === "dashboard"} 
            onClick={() => setActiveTab("dashboard")}
            icon={<LayoutDashboard size={20} />}
            label="Dashboard"
            primaryColor={currentStore?.branding?.primaryColor}
          />
          <NavItem 
            active={activeTab === "inventory"} 
            onClick={() => setActiveTab("inventory")}
            icon={<Package size={20} />}
            label="Inventario"
            primaryColor={currentStore?.branding?.primaryColor}
          />
          <NavItem 
            active={activeTab === "products"} 
            onClick={() => setActiveTab("products")}
            icon={<Edit2 size={20} />}
            label="Productos"
            primaryColor={currentStore?.branding?.primaryColor}
          />
          {isAdmin && (
            <NavItem 
              active={activeTab === "team"} 
              onClick={() => setActiveTab("team")}
              icon={<Users size={20} />}
              label="Equipo"
              primaryColor={currentStore?.branding?.primaryColor}
            />
          )}
          <NavItem 
            active={activeTab === "new-sale"} 
            onClick={() => setActiveTab("new-sale")}
            icon={<Plus size={20} />}
            label="Nueva Venta"
            primaryColor={currentStore?.branding?.primaryColor}
          />
          <NavItem 
            active={activeTab === "sales"} 
            onClick={() => setActiveTab("sales")}
            icon={<ShoppingCart size={20} />}
            label="Ventas"
            primaryColor={currentStore?.branding?.primaryColor}
          />
          <NavItem 
            active={activeTab === "ai"} 
            onClick={() => setActiveTab("ai")}
            icon={<BrainCircuit size={20} />}
            label="Insights IA"
            primaryColor={currentStore?.branding?.primaryColor}
          />
        </nav>

        <div className="mt-auto pt-8 border-t border-slate-100 space-y-4">
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 overflow-hidden shadow-inner">
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || "User"} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
              ) : (
                <UserIcon className="w-full h-full p-2 text-slate-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">{user.displayName}</p>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-3 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl px-4"
            onClick={handleLogout}
          >
            <LogOut size={18} />
            <span className="font-medium">Cerrar Sesión</span>
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <main 
        className="flex-1 min-h-screen transition-colors duration-500"
        style={{ backgroundColor: currentStore?.branding?.backgroundColor || "#F8FAFC" }}
      >
        <div className="max-w-7xl mx-auto p-6 md:p-10 lg:p-12">
          <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-12">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
                {activeTab === "dashboard" ? "Resumen de Negocio" : 
                 activeTab === "inventory" ? "Control de Inventario" : 
                 activeTab === "products" ? "Catálogo de Productos" :
                 activeTab === "new-sale" ? "Nueva Venta" :
                 activeTab === "sales" ? "Reporte de Ventas" :
                 "Inteligencia Artificial"}
              </h2>
              <p className="text-slate-500 mt-1 font-medium">Panel de Control: {currentStore?.name}</p>
            </div>
            <div className="flex items-center gap-3">
              {(activeTab === "products" || activeTab === "inventory") && (
                <ExcelExport 
                  data={prepareInventoryForExport(products)} 
                  fileName={`Inventario_${currentStore?.name}_${new Date().toISOString().split('T')[0]}`} 
                  sheetName="Inventario" 
                />
              )}
              {activeTab === "sales" && (
                <ExcelExport 
                  data={prepareSalesForExport(sales)} 
                  fileName={`Ventas_${currentStore?.name}_${new Date().toISOString().split('T')[0]}`} 
                  sheetName="Ventas" 
                />
              )}
              <Button variant="outline" size="lg" className="bg-white shadow-sm border-slate-200 hover:bg-slate-50" onClick={() => window.location.reload()}>
                <RefreshCw size={16} className="mr-2" /> Refrescar
              </Button>
              {activeTab === "products" && canEdit && (
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger render={
                    <Button 
                      className="text-white shadow-lg px-6 h-11" 
                      onClick={() => setEditingProduct(null)}
                      style={{ backgroundColor: currentStore?.branding?.primaryColor || "#4F46E5" }}
                    >
                      <Plus size={18} className="mr-2" /> Nuevo Producto
                    </Button>
                  } />
                  <DialogContent className="sm:max-w-[425px]">
                    <form onSubmit={handleAddProduct}>
                      <DialogHeader>
                        <DialogTitle>{editingProduct ? "Editar Producto" : "Agregar Producto"}</DialogTitle>
                        <DialogDescription>
                          Completa los detalles del producto para tu catálogo.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="name" className="text-right">Nombre</Label>
                          <Input id="name" name="name" defaultValue={editingProduct?.name} className="col-span-3" required />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="brand" className="text-right">Marca</Label>
                          <Input id="brand" name="brand" defaultValue={editingProduct?.brand} className="col-span-3" placeholder="Ej: Nestlé" required />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="code" className="text-right">Código</Label>
                          <Input id="code" name="code" defaultValue={editingProduct?.code} className="col-span-3" placeholder="Ej: COD123 (Opcional)" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="category" className="text-right">Categoría</Label>
                          <Input id="category" name="category" defaultValue={editingProduct?.category} className="col-span-3" required />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="price" className="text-right">Precio</Label>
                          <Input id="price" name="price" type="number" step="0.01" defaultValue={editingProduct?.price} className="col-span-3" required />
                        </div>
                        {!editingProduct && (
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="quantity" className="text-right">Stock Inicial</Label>
                            <Input id="quantity" name="quantity" type="number" defaultValue={0} className="col-span-3" required />
                          </div>
                        )}
                        <div className="pt-4 mt-2 border-t border-slate-100">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="minStock" className="text-right font-semibold text-indigo-600">Stock Mín.</Label>
                            <Input id="minStock" name="minStock" type="number" defaultValue={editingProduct?.minStockLevel} className="col-span-3 border-indigo-100 focus:border-indigo-300" required />
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1 ml-[25%]">Se activará una alerta cuando el stock sea igual o menor a este valor.</p>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="submit" className="bg-indigo-600 text-white">Guardar Cambios</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </header>

        <AnimatePresence mode="wait">
          {activeTab === "dashboard" && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                  title="Ingresos Hoy" 
                  value={formatCurrency(analytics.todayRevenue)} 
                  icon={<TrendingUp className="text-emerald-600" />}
                  trend={`${analytics.revenueChange >= 0 ? '+' : ''}${analytics.revenueChange.toFixed(1)}%`}
                  trendUp={analytics.revenueChange >= 0}
                  description="vs. ayer"
                />
                <StatCard 
                  title="Ingresos Semana" 
                  value={formatCurrency(analytics.thisWeekRevenue)} 
                  icon={<DollarSign className="text-indigo-600" />}
                  trend={`${analytics.weekChange >= 0 ? '+' : ''}${analytics.weekChange.toFixed(1)}%`}
                  trendUp={analytics.weekChange >= 0}
                  description="vs. semana anterior"
                />
                <StatCard 
                  title="Stock Bajo" 
                  value={stats.lowStockCount.toString()} 
                  icon={<AlertTriangle className="text-amber-600" />}
                  variant={stats.lowStockCount > 0 ? "warning" : "default"}
                />
                <StatCard 
                  title="Sin Stock" 
                  value={stats.outOfStockCount.toString()} 
                  icon={<AlertTriangle className="text-rose-600" />}
                  variant={stats.outOfStockCount > 0 ? "danger" : "default"}
                />
              </div>

              {/* AI Insights & Notifications */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 bg-indigo-600 text-white border-none shadow-indigo-200 shadow-lg overflow-hidden relative">
                  <div className="absolute top-0 right-0 p-8 opacity-10">
                    <BrainCircuit size={120} />
                  </div>
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <BrainCircuit size={20} />
                      <span className="text-xs font-bold uppercase tracking-wider opacity-80">AI Insights</span>
                    </div>
                    <CardTitle className="text-2xl font-bold">Análisis Inteligente</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {aiInsights.length > 0 ? (
                        aiInsights.slice(0, 2).map((insight, idx) => (
                          <div key={idx} className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
                            <h4 className="font-bold text-lg mb-1">{insight.title}</h4>
                            <p className="text-indigo-100 text-sm">{insight.description}</p>
                          </div>
                        ))
                      ) : (
                        <div className="flex flex-col items-center justify-center py-6 text-center">
                          <p className="text-indigo-100 mb-4">Genera insights personalizados para tu negocio.</p>
                          <Button 
                            variant="secondary" 
                            className="bg-white text-indigo-600 hover:bg-indigo-50"
                            onClick={runAIAnalysis}
                            disabled={isAnalyzing}
                          >
                            {isAnalyzing ? "Analizando..." : "Generar Insights"}
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white border-slate-200 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <AlertTriangle size={18} className="text-amber-500" />
                      Alertas Inteligentes
                    </CardTitle>
                  </CardHeader>
                  <ScrollArea className="h-[280px]">
                    <CardContent className="space-y-3">
                      {analytics.notifications.length > 0 ? (
                        analytics.notifications.map((notif) => (
                          <div key={notif.id} className={`p-3 rounded-lg border flex gap-3 ${
                            notif.type === 'high-demand' ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'
                          }`}>
                            <div className={`p-2 rounded-full h-fit ${
                              notif.type === 'high-demand' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {notif.type === 'high-demand' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-900">{notif.title}</p>
                              <p className="text-[11px] text-slate-500 leading-tight">{notif.message}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-10">
                          <p className="text-slate-400 text-sm italic">No hay alertas nuevas.</p>
                        </div>
                      )}
                    </CardContent>
                  </ScrollArea>
                </Card>
              </div>

              {/* Charts & Top Products */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 bg-white border-slate-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">Tendencia de Ventas</CardTitle>
                    <CardDescription>Visualización del volumen de ventas diario.</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={salesHistoryData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Line type="monotone" dataKey="sales" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4, fill: '#4f46e5' }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="bg-white border-slate-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold">Top 5 Productos</CardTitle>
                    <CardDescription>Por volumen de ventas total.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-slate-100">
                      {analytics.topByQty.map((p, idx) => (
                        <div key={p.id} className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                          <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                            {idx + 1}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-slate-900">{p.name}</p>
                            <p className="text-[10px] text-slate-400">{p.category}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-slate-700">{p.totalQty} ud.</p>
                            <p className="text-[10px] text-emerald-600 font-medium">{formatCurrency(p.totalRev)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}

          {activeTab === "products" && (
            <motion.div 
              key="products"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="space-y-6"
            >
              <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
                <CardHeader className="pb-4 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <CardTitle className="text-lg font-bold">Gestión de Catálogo</CardTitle>
                      <CardDescription>Edita la información básica de tus productos.</CardDescription>
                    </div>
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <Input 
                          placeholder="Buscar por nombre..." 
                          className="pl-10 bg-white border-slate-200 h-9"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                      <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger className="w-[180px] bg-white border-slate-200 h-9">
                          <SelectValue placeholder="Categoría" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map(cat => (
                            <SelectItem key={cat} value={cat}>
                              {cat === "all" ? "Todas las categorías" : cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-slate-50">
                        <TableRow>
                          <TableHead className="font-semibold">Código</TableHead>
                          <TableHead className="font-semibold">Producto</TableHead>
                          <TableHead className="font-semibold">Marca</TableHead>
                          <TableHead className="font-semibold">Categoría</TableHead>
                          <TableHead className="font-semibold">Precio Unitario</TableHead>
                          <TableHead className="font-semibold">Stock Mínimo</TableHead>
                          <TableHead className="text-right font-semibold">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredProducts.map((product) => (
                          <TableRow key={product.id} className="hover:bg-slate-50/50 transition-colors">
                            <TableCell className="font-mono text-xs text-slate-500">{product.code}</TableCell>
                            <TableCell className="font-medium">{product.name}</TableCell>
                            <TableCell className="text-slate-600">{product.brand}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="bg-slate-100 text-slate-600">
                                {product.category}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-semibold text-slate-700">{formatCurrency(product.price)}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2 text-slate-500">
                                <AlertTriangle size={14} className="text-amber-500" />
                                <span>{product.minStockLevel} unidades</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50" onClick={() => {
                                  setEditingProduct(product);
                                  setIsAddDialogOpen(true);
                                }}>
                                  <Edit2 size={16} />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50" onClick={() => handleDeleteProduct(product.id)}>
                                  <Trash2 size={16} />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                        {filteredProducts.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={7} className="h-32 text-center text-slate-500">
                              No se encontraron productos en el catálogo.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeTab === "inventory" && (
            <motion.div 
              key="inventory"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="space-y-6"
            >
              <Tabs value={inventoryTab} onValueChange={(v: any) => setInventoryTab(v)} className="w-full">
                <TabsList className="bg-slate-100 p-1 rounded-xl mb-6">
                  <TabsTrigger value="status" className="rounded-lg px-6 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                    <Package size={16} className="mr-2" /> Estado de Stock
                  </TabsTrigger>
                  <TabsTrigger value="restock" className="rounded-lg px-6 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                    <RefreshCw size={16} className="mr-2" /> Reposiciones (Restock)
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="status" className="mt-0 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard 
                      title="Total Productos" 
                      value={stats.totalProducts.toString()} 
                      icon={<Package className="text-indigo-600" />}
                    />
                    <StatCard 
                      title="Stock Bajo" 
                      value={stats.lowStockCount.toString()} 
                      icon={<AlertTriangle className="text-amber-600" />}
                      variant={stats.lowStockCount > 0 ? "warning" : "default"}
                    />
                    <StatCard 
                      title="Sin Stock" 
                      value={stats.outOfStockCount.toString()} 
                      icon={<AlertTriangle className="text-rose-600" />}
                      variant={stats.outOfStockCount > 0 ? "danger" : "default"}
                    />
                  </div>

                  <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
                    <CardHeader className="pb-4 border-b border-slate-100">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <CardTitle className="text-lg font-bold">Resumen de Existencias</CardTitle>
                        <div className="flex items-center gap-3">
                          <div className="relative max-w-xs">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <Input 
                              placeholder="Filtrar stock..." 
                              className="pl-9 h-9 bg-slate-50 border-slate-200"
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader className="bg-slate-50/50">
                            <TableRow>
                              <TableHead className="font-semibold">Código</TableHead>
                              <TableHead className="font-semibold">Producto</TableHead>
                              <TableHead className="font-semibold">Marca</TableHead>
                              <TableHead className="font-semibold">Stock Actual</TableHead>
                              <TableHead className="font-semibold">Predicción</TableHead>
                              <TableHead className="font-semibold">Estado</TableHead>
                              <TableHead className="text-right font-semibold">Acciones</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredProducts.map((product) => {
                              const daysLeft = getDaysOfStock(product.id);
                              return (
                                <TableRow key={product.id} className="hover:bg-slate-50/50 transition-colors">
                                  <TableCell className="font-mono text-xs text-slate-500">{product.code}</TableCell>
                                  <TableCell className="font-medium">{product.name}</TableCell>
                                  <TableCell className="text-slate-600 text-xs">{product.brand}</TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <span className={`text-lg font-bold ${product.quantity <= product.minStockLevel ? "text-amber-600" : "text-slate-900"}`}>
                                        {product.quantity}
                                      </span>
                                      <span className="text-slate-400 text-xs">ud.</span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <Calendar size={14} className="text-slate-400" />
                                      <span className="text-sm text-slate-600">
                                        {daysLeft === 999 ? "Estable" : `~${daysLeft} días`}
                                      </span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    {product.quantity === 0 ? (
                                      <Badge className="bg-rose-100 text-rose-700 border-rose-200">Agotado</Badge>
                                    ) : product.quantity <= product.minStockLevel ? (
                                      <Badge className="bg-amber-100 text-amber-700 border-amber-200">Crítico</Badge>
                                    ) : (
                                      <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Saludable</Badge>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="h-8 text-xs border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                                      onClick={() => {
                                        setRestockProductId(product.id);
                                        setInventoryTab("restock");
                                      }}
                                    >
                                      <RefreshCw size={14} className="mr-1" /> Reponer
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="restock" className="mt-0 space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Restock Form */}
                    <Card className="lg:col-span-1 bg-white border-slate-200 shadow-sm h-fit">
                      <CardHeader>
                        <CardTitle className="text-lg font-bold">Nueva Entrada</CardTitle>
                        <CardDescription>Registra el ingreso de mercancía al almacén.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="restock-product">Producto a Reponer</Label>
                          <Select value={restockProductId} onValueChange={setRestockProductId}>
                            <SelectTrigger id="restock-product" className="bg-slate-50 border-slate-200">
                              <SelectValue placeholder="Seleccionar producto">
                                {restockProductId && products.find(p => p.id === restockProductId) ? (
                                  `${products.find(p => p.id === restockProductId)?.name} - ${products.find(p => p.id === restockProductId)?.code}`
                                ) : "Seleccionar producto"}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {products.map(p => (
                                <SelectItem key={p.id} value={p.id}>
                                  {p.name} ({p.brand}) - {p.code} ({p.quantity} en stock)
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {restockProductId && (
                          <motion.div 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-indigo-50 p-4 rounded-xl border border-indigo-100"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <BrainCircuit size={16} className="text-indigo-600" />
                                <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Sugerencia IA</span>
                              </div>
                              <Badge className="bg-indigo-600 text-white text-[10px]">Optimizado</Badge>
                            </div>
                            <p className="text-xs text-indigo-600 mb-3 leading-relaxed">
                              Basado en ventas recientes, se recomienda reponer <span className="font-bold text-indigo-800">{getRestockSuggestion(restockProductId)} unidades</span> para cubrir los próximos 30 días.
                            </p>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="w-full h-8 text-xs bg-white border-indigo-200 text-indigo-600 hover:bg-indigo-50 font-semibold"
                              onClick={() => setRestockQuantity(getRestockSuggestion(restockProductId).toString())}
                            >
                              Aplicar Sugerencia
                            </Button>
                          </motion.div>
                        )}

                        <div className="space-y-2">
                          <Label htmlFor="restock-qty">Cantidad Ingresada</Label>
                          <Input 
                            id="restock-qty" 
                            type="number" 
                            min="1" 
                            placeholder="Ej: 50"
                            value={restockQuantity}
                            onChange={(e) => setRestockQuantity(e.target.value)}
                            className="bg-slate-50 border-slate-200"
                          />
                        </div>
                        <Button 
                          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-100"
                          onClick={() => {
                            if (!restockProductId || !restockQuantity || parseInt(restockQuantity) <= 0) {
                              toast.error("Por favor completa los campos correctamente");
                              return;
                            }
                            const qty = parseInt(restockQuantity);
                            const product = products.find(p => p.id === restockProductId);
                            if (!product) return;

                            setProducts(products.map(p => p.id === restockProductId ? { ...p, quantity: p.quantity + qty } : p));
                            
                            const newRestock: RestockRecord = {
                              id: Math.random().toString(36).substr(2, 9),
                              productId: restockProductId,
                              quantity: qty,
                              date: new Date().toISOString(),
                            };
                            setRestocks([newRestock, ...restocks]);
                            setRestockQuantity("");
                            setRestockProductId("");
                            toast.success(`Entrada registrada: +${qty} ${product.name}`);
                          }}
                        >
                          <Plus size={16} className="mr-2" /> Registrar Entrada
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Restock History */}
                    <Card className="lg:col-span-2 bg-white border-slate-200 shadow-sm">
                      <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-4">
                        <div>
                          <CardTitle className="text-lg font-bold">Historial de Entradas</CardTitle>
                          <CardDescription>Registro cronológico de reposiciones.</CardDescription>
                        </div>
                        <History className="text-slate-300" size={24} />
                      </CardHeader>
                      <CardContent className="p-0">
                        <ScrollArea className="h-[450px]">
                          <div className="overflow-x-auto">
                            <Table>
                            <TableHeader className="bg-slate-50/50">
                              <TableRow>
                                <TableHead>Producto</TableHead>
                                <TableHead>Fecha y Hora</TableHead>
                                <TableHead className="text-right">Cantidad</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {restocks.map((r) => {
                                const product = products.find(p => p.id === r.productId);
                                return (
                                  <TableRow key={r.id} className="hover:bg-slate-50/50 transition-colors">
                                    <TableCell className="font-medium text-slate-900">{product?.name || "Desconocido"}</TableCell>
                                    <TableCell className="text-slate-500 text-xs">
                                      <div className="flex items-center gap-1">
                                        <Calendar size={12} />
                                        {new Date(r.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 font-bold">
                                        +{r.quantity}
                                      </Badge>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                              {restocks.length === 0 && (
                                <TableRow>
                                  <TableCell colSpan={3} className="h-48 text-center text-slate-400 italic">
                                    No hay registros de entradas recientes.
                                  </TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      </ScrollArea>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </motion.div>
          )}

          {activeTab === "team" && isAdmin && (
            <motion.div 
              key="team"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <Card className="bg-white border-slate-200 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-bold">Gestión de Equipo</CardTitle>
                    <CardDescription>Administra quién tiene acceso a {currentStore?.name}</CardDescription>
                  </div>
                  <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                    <DialogTrigger render={
                      <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                        <UserPlus size={18} className="mr-2" /> Invitar Miembro
                      </Button>
                    } />
                    <DialogContent>
                      <form onSubmit={handleInviteMember}>
                        <DialogHeader>
                          <DialogTitle>Invitar Nuevo Miembro</DialogTitle>
                          <DialogDescription>
                            Envía una invitación para unirse a tu tienda.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid gap-2">
                            <Label>Email del invitado</Label>
                            <Input 
                              type="email" 
                              placeholder="ejemplo@correo.com" 
                              value={inviteEmail}
                              onChange={e => setInviteEmail(e.target.value)}
                              required
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label>Rol asignado</Label>
                            <Select value={inviteRole} onValueChange={(v: any) => setInviteRole(v)}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">Administrador (Control total)</SelectItem>
                                <SelectItem value="employee">Empleado (Ventas e Inventario)</SelectItem>
                                <SelectItem value="viewer">Observador (Solo lectura)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button type="submit" className="bg-indigo-600 text-white w-full">Enviar Invitación</Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead>Miembro</TableHead>
                        <TableHead>Rol</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {members.map(member => (
                        <TableRow key={member.email}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                                {member.displayName[0].toUpperCase()}
                              </div>
                              <div>
                                <p className="font-medium text-sm text-slate-900">{member.displayName}</p>
                                <p className="text-xs text-slate-500">{member.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {member.role === "admin" ? "Administrador" : member.role === "employee" ? "Empleado" : "Observador"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-100">
                              Activo
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {member.email !== user?.email && (
                              <div className="flex justify-end gap-2">
                                <Select 
                                  value={member.role} 
                                  onValueChange={(v: any) => handleUpdateMemberRole(member.email, v)}
                                >
                                  <SelectTrigger className="w-[110px] h-8 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="employee">Empleado</SelectItem>
                                    <SelectItem value="viewer">Ver</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                                  onClick={() => handleRemoveMember(member.email)}
                                >
                                  <Trash2 size={16} />
                                </Button>
                              </div>
                            )}
                            {member.email === user?.email && (
                              <span className="text-xs text-slate-400 italic font-normal">Tú</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeTab === "sales" && (
            <motion.div 
              key="sales"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="space-y-6"
            >
              {/* Sales Filter Controls */}
              <Card className="bg-white border-slate-200 shadow-sm">
                <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="flex-1 md:flex-none">
                      <Label htmlFor="sales-date" className="text-xs font-semibold text-slate-500 mb-1 block">Fecha de Referencia</Label>
                      <Input 
                        id="sales-date"
                        type="date" 
                        value={salesDateFilter} 
                        onChange={(e) => setSalesDateFilter(e.target.value)}
                        className="h-9 bg-slate-50"
                      />
                    </div>
                    <div className="flex-1 md:flex-none">
                      <Label className="text-xs font-semibold text-slate-500 mb-1 block">Rango de Reporte</Label>
                      <Select value={salesRangeType} onValueChange={(v: any) => setSalesRangeType(v)}>
                        <SelectTrigger className="h-9 w-full md:w-[140px] bg-slate-50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="day">Día Único</SelectItem>
                          <SelectItem value="week">Esta Semana</SelectItem>
                          <SelectItem value="month">Este Mes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500 text-sm">
                    <Calendar size={16} />
                    <span className="font-medium">
                      {(() => {
                        const filterDate = new Date(salesDateFilter);
                        if (salesRangeType === 'day') return "Reporte Diario";
                        if (salesRangeType === 'week') {
                          const start = new Date(filterDate);
                          start.setDate(filterDate.getDate() - filterDate.getDay());
                          const end = new Date(start);
                          end.setDate(start.getDate() + 6);
                          return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
                        }
                        if (salesRangeType === 'month') {
                          const start = new Date(filterDate.getFullYear(), filterDate.getMonth(), 1);
                          const end = new Date(filterDate.getFullYear(), filterDate.getMonth() + 1, 0);
                          return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
                        }
                        return "";
                      })()}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Sales Stats & Content */}
              {(() => {
                const filteredSales = sales.filter(s => {
                  const saleDate = new Date(s.date);
                  const filterDate = new Date(salesDateFilter);
                  
                  if (salesRangeType === 'day') {
                    return s.date.startsWith(salesDateFilter);
                  } else if (salesRangeType === 'week') {
                    const startOfWeek = new Date(filterDate);
                    startOfWeek.setDate(filterDate.getDate() - filterDate.getDay());
                    const endOfWeek = new Date(startOfWeek);
                    endOfWeek.setDate(startOfWeek.getDate() + 6);
                    return saleDate >= startOfWeek && saleDate <= endOfWeek;
                  } else {
                    return saleDate.getMonth() === filterDate.getMonth() && 
                           saleDate.getFullYear() === filterDate.getFullYear();
                  }
                });

                const totalRevenue = filteredSales.reduce((acc, s) => acc + s.totalAmount, 0);
                const totalUnits = filteredSales.reduce((acc, s) => acc + s.items.reduce((sum, item) => sum + item.quantity, 0), 0);

                return (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <StatCard 
                        title="Unidades Vendidas" 
                        value={totalUnits.toString()} 
                        icon={<ShoppingCart className="text-indigo-600" />}
                      />
                      <StatCard 
                        title="Ingresos Totales" 
                        value={formatCurrency(totalRevenue)} 
                        icon={<DollarSign className="text-emerald-600" />}
                      />
                      <StatCard 
                        title="Promedio por Venta" 
                        value={formatCurrency(filteredSales.length ? (totalRevenue / filteredSales.length) : 0)} 
                        icon={<TrendingUp className="text-indigo-600" />}
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                      {salesRangeType === 'day' ? (
                        <Card className="bg-white border-slate-200 shadow-sm">
                          <CardHeader>
                            <CardTitle className="text-lg font-bold">Detalle de Ventas</CardTitle>
                            <CardDescription>Listado completo de transacciones para el día seleccionado.</CardDescription>
                          </CardHeader>
                          <CardContent className="p-0">
                            <div className="overflow-x-auto">
                              <Table>
                                <TableHeader className="bg-slate-50">
                                  <TableRow>
                                    <TableHead>Producto</TableHead>
                                    <TableHead>Hora</TableHead>
                                    <TableHead>Cant.</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {filteredSales
                                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                    .map((sale) => {
                                      return (
                                        <TableRow key={sale.id}>
                                          <TableCell className="font-medium">
                                            <div className="flex flex-col gap-1">
                                              {(sale.items || []).map((item, idx) => (
                                                <div key={idx} className="text-xs">
                                                  <span className="font-semibold">{item.productName}</span>
                                                  <span className="text-slate-500 ml-1">x{item.quantity}</span>
                                                </div>
                                              ))}
                                            </div>
                                          </TableCell>
                                          <TableCell className="text-slate-500 text-xs">
                                            {new Date(sale.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                          </TableCell>
                                          <TableCell>{(sale.items || []).reduce((acc, i) => acc + i.quantity, 0)}</TableCell>
                                          <TableCell className="text-right font-semibold">
                                            {formatCurrency(sale.totalAmount)}
                                          </TableCell>
                                        </TableRow>
                                      );
                                    })}
                                  {filteredSales.length === 0 && (
                                    <TableRow>
                                      <TableCell colSpan={4} className="h-32 text-center text-slate-400 italic">
                                        No hay ventas registradas para este día.
                                      </TableCell>
                                    </TableRow>
                                  )}
                                </TableBody>
                              </Table>
                            </div>
                          </CardContent>
                        </Card>
                      ) : (
                        <Card className="bg-white border-slate-200 shadow-sm">
                          <CardHeader>
                            <CardTitle className="text-lg font-bold">Resumen Agrupado</CardTitle>
                            <CardDescription>Ventas consolidadas por día en el rango seleccionado.</CardDescription>
                          </CardHeader>
                          <CardContent className="p-0">
                            {(() => {
                              const grouped = filteredSales.reduce((acc, s) => {
                                const date = s.date.split('T')[0];
                                if (!acc[date]) acc[date] = { date, total: 0, units: 0 };
                                acc[date].total += s.totalAmount;
                                acc[date].units += (s.items || []).reduce((sum, item) => sum + item.quantity, 0);
                                return acc;
                              }, {} as Record<string, any>);

                              const sortedGrouped = Object.values(grouped).sort((a: any, b: any) => b.date.localeCompare(a.date));

                              return (
                                <div className="overflow-x-auto">
                                  <Table>
                                  <TableHeader className="bg-slate-50">
                                    <TableRow>
                                      <TableHead>Fecha</TableHead>
                                      <TableHead>Unidades</TableHead>
                                      <TableHead className="text-right">Ingresos Totales</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {sortedGrouped.map((group: any) => (
                                      <TableRow key={group.date}>
                                        <TableCell className="font-medium">{new Date(group.date).toLocaleDateString()}</TableCell>
                                        <TableCell>{group.units}</TableCell>
                                        <TableCell className="text-right font-bold text-indigo-600">
                                          {formatCurrency(group.total)}
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                    {sortedGrouped.length === 0 && (
                                      <TableRow>
                                        <TableCell colSpan={3} className="h-32 text-center text-slate-400 italic">
                                          No hay datos para el rango seleccionado.
                                        </TableCell>
                                      </TableRow>
                                    )}
                                  </TableBody>
                                </Table>
                              </div>
                            );
                          })()}
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </>
                );
              })()}
            </motion.div>
          )}



          {activeTab === "ai" && (
            <motion.div 
              key="ai"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-indigo-100 p-2 rounded-full">
                    <BrainCircuit className="text-indigo-600 w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">Insights de Inteligencia Artificial</h3>
                    <p className="text-slate-500 text-sm">Análisis predictivo y sugerencias automáticas.</p>
                  </div>
                </div>
                <Button className="bg-indigo-600 text-white" onClick={runAIAnalysis} disabled={isAnalyzing}>
                  {isAnalyzing ? "Procesando..." : "Generar Nuevos Insights"}
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {aiInsights.length > 0 ? (
                  aiInsights.map((insight, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                    >
                      <Card className="h-full border-slate-200 hover:border-indigo-200 transition-all hover:shadow-md">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start mb-2">
                            <Badge className={
                              insight.type === 'replenishment' ? "bg-indigo-100 text-indigo-700" :
                              insight.type === 'analysis' ? "bg-emerald-100 text-emerald-700" :
                              "bg-amber-100 text-amber-700"
                            }>
                              {insight.type === 'replenishment' ? "Reposición" : insight.type === 'analysis' ? "Análisis" : "Predicción"}
                            </Badge>
                            <Badge variant="outline" className={
                              insight.priority === 'high' ? "border-rose-200 text-rose-600" :
                              insight.priority === 'medium' ? "border-amber-200 text-amber-600" :
                              "border-slate-200 text-slate-600"
                            }>
                              {insight.priority.toUpperCase()}
                            </Badge>
                          </div>
                          <CardTitle className="text-base">{insight.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-slate-600 leading-relaxed">{insight.description}</p>
                          {insight.productId && (
                            <div className="mt-4 pt-4 border-t border-slate-100">
                              <Button variant="link" className="p-0 h-auto text-indigo-600 text-xs font-semibold" onClick={() => {
                                setSearchTerm(products.find(p => p.id === insight.productId)?.name || "");
                                setActiveTab("inventory");
                              }}>
                                Ver producto relacionado →
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))
                ) : (
                  <div className="col-span-full py-20 text-center space-y-4">
                    <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                      <BrainCircuit className="text-slate-300 w-8 h-8" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900">No hay insights generados</h4>
                      <p className="text-slate-500 text-sm max-w-xs mx-auto">Haz clic en el botón superior para que la IA analice tu inventario actual.</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === "new-sale" && (
            <motion.div 
              key="new-sale"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Product Selection */}
                <Card className="lg:col-span-2 bg-white border-slate-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold">Seleccionar Productos</CardTitle>
                    <CardDescription>Busca y añade productos a la venta actual.</CardDescription>
                    <div className="relative mt-2">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <Input 
                        placeholder="Buscar por nombre, marca o código..." 
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[500px] pr-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {products
                          .filter(p => 
                            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            p.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            p.code.toLowerCase().includes(searchTerm.toLowerCase())
                          )
                          .map(product => (
                            <Card key={product.id} className="border-slate-100 hover:border-indigo-200 transition-colors">
                              <CardContent className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <h4 className="font-bold text-slate-900">{product.name}</h4>
                                    <p className="text-xs text-slate-500">{product.brand} • {product.code}</p>
                                  </div>
                                  <Badge variant={product.quantity > product.minStockLevel ? "secondary" : "destructive"}>
                                    Stock: {product.quantity}
                                  </Badge>
                                </div>
                                <div className="flex justify-between items-center mt-4">
                                  <span className="text-lg font-bold text-indigo-600">{formatCurrency(product.price)}</span>
                                  <Button 
                                    size="sm" 
                                    disabled={product.quantity <= 0}
                                    onClick={() => addToCart(product, 1)}
                                    className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border-none"
                                  >
                                    <Plus size={14} className="mr-1" /> Añadir
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>

                {/* Cart Summary */}
                <Card className="bg-white border-slate-200 shadow-sm h-fit sticky top-8">
                  <CardHeader className="border-b border-slate-100">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg font-bold">Resumen de Venta</CardTitle>
                      <Badge className="bg-indigo-600">{cart.length} ítems</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScrollArea className="max-h-[400px]">
                      {cart.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 italic">
                          El carrito está vacío.
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-100">
                          {cart.map(item => (
                            <div key={item.productId} className="p-4 flex justify-between items-center">
                              <div className="flex-1">
                                <h5 className="text-sm font-medium text-slate-900">{item.productName}</h5>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs text-slate-500">{formatCurrency(item.unitPrice)} x {item.quantity}</span>
                                  <span className="text-xs font-bold text-indigo-600">{formatCurrency(item.totalPrice)}</span>
                                </div>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="icon-sm" 
                                className="text-slate-400 hover:text-red-500"
                                onClick={() => removeFromCart(item.productId)}
                              >
                                <Trash2 size={14} />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                    
                    {cart.length > 0 && (
                      <div className="p-4 bg-slate-50 border-t border-slate-100 space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-600 font-medium">Total a Pagar</span>
                          <span className="text-2xl font-bold text-slate-900">
                            {formatCurrency(cart.reduce((acc, item) => acc + item.totalPrice, 0))}
                          </span>
                        </div>
                        <Button 
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-12 text-lg font-bold"
                          onClick={handleConfirmSale}
                        >
                          Confirmar Venta
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </main>
      </div>
    </div>
  );
}

// Helper Components
function NavItem({ active, onClick, icon, label, primaryColor }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, primaryColor?: string }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
        active 
          ? "text-white shadow-lg" 
          : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
      }`}
      style={{ 
        backgroundColor: active ? (primaryColor || "#4F46E5") : 'transparent',
      }}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </button>
  );
}

function StatCard({ title, value, icon, trend, trendUp, description, variant = "default" }: { 
  title: string, 
  value: string, 
  icon: React.ReactNode, 
  trend?: string, 
  trendUp?: boolean,
  description?: string,
  variant?: "default" | "warning" | "danger"
}) {
  const bgClass = 
    variant === "warning" ? "border-amber-100 bg-amber-50/30" : 
    variant === "danger" ? "border-rose-100 bg-rose-50/30" : 
    "bg-white border-slate-200";

  return (
    <Card className={`${bgClass} shadow-sm border`}>
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
            {icon}
          </div>
          {trend && (
            <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${
              trendUp ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
            }`}>
              {trendUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              {trend}
            </div>
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
          {description && <p className="text-[10px] text-slate-400 mt-1">{description}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
