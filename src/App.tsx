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
  ArrowRightLeft
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
import { Product, SaleRecord, InventoryStats, AIInsight, RestockRecord } from "./types";
import { getAIReplenishmentSuggestions, getAIBusinessAnalysis } from "./lib/inventoryService";

// Sample Data
const INITIAL_PRODUCTS: Product[] = [
  { id: "1", name: "Leche Entera 1L", code: "LEC001", brand: "Colun", price: 1.2, quantity: 45, category: "Lácteos", minStockLevel: 10, lastUpdated: new Date().toISOString() },
  { id: "2", name: "Pan de Molde", code: "PAN002", brand: "Ideal", price: 2.5, quantity: 8, category: "Panadería", minStockLevel: 15, lastUpdated: new Date().toISOString() },
  { id: "3", name: "Arroz Extra 1kg", code: "ARR003", brand: "Tucapel", price: 1.8, quantity: 60, category: "Despensa", minStockLevel: 20, lastUpdated: new Date().toISOString() },
  { id: "4", name: "Detergente Líquido", code: "DET004", brand: "Omo", price: 8.5, quantity: 5, category: "Limpieza", minStockLevel: 8, lastUpdated: new Date().toISOString() },
  { id: "5", name: "Café Molido 250g", code: "CAF005", brand: "Nescafé", price: 4.2, quantity: 25, category: "Despensa", minStockLevel: 10, lastUpdated: new Date().toISOString() },
];

const INITIAL_SALES: SaleRecord[] = [
  { id: "s1", productId: "1", quantity: 5, date: new Date(Date.now() - 86400000 * 1).toISOString() },
  { id: "s2", productId: "2", quantity: 12, date: new Date(Date.now() - 86400000 * 1).toISOString() },
  { id: "s3", productId: "4", quantity: 3, date: new Date(Date.now() - 86400000 * 2).toISOString() },
  { id: "s4", productId: "1", quantity: 8, date: new Date(Date.now() - 86400000 * 3).toISOString() },
  { id: "s5", productId: "3", quantity: 15, date: new Date(Date.now() - 86400000 * 4).toISOString() },
];

// Helper to generate a product code
const generateProductCode = (name: string) => {
  const prefix = name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X').padEnd(3, 'X');
  const random = Math.floor(100 + Math.random() * 900);
  return `${prefix}${random}`;
};

export default function App() {
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem("inventory_products");
    const initial = saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
    // Migration: ensure all products have a code and brand
    return initial.map((p: Product) => ({
      ...p,
      code: p.code || generateProductCode(p.name),
      brand: p.brand || "Genérico"
    }));
  });
  const [sales, setSales] = useState<SaleRecord[]>(() => {
    const saved = localStorage.getItem("inventory_sales");
    return saved ? JSON.parse(saved) : INITIAL_SALES;
  });
  const [restocks, setRestocks] = useState<RestockRecord[]>(() => {
    const saved = localStorage.getItem("inventory_restocks");
    return saved ? JSON.parse(saved) : [];
  });
  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [inventoryTab, setInventoryTab] = useState<"status" | "restock">("status");

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

    const calculateRevenue = (records: SaleRecord[]) => records.reduce((acc, s) => {
      const p = products.find(prod => prod.id === s.productId);
      return acc + (p ? p.price * s.quantity : 0);
    }, 0);

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
      const pSales = sales.filter(s => s.productId === p.id);
      const totalQty = pSales.reduce((acc, s) => acc + s.quantity, 0);
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
      const recentSales = sales.filter(s => s.productId === p.id && new Date(s.date) >= threeDaysAgo);
      const totalRecent = recentSales.reduce((acc, s) => acc + s.quantity, 0);
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
      const recentSales = sales.filter(s => s.productId === p.id && new Date(s.date) >= sevenDaysAgo);
      if (recentSales.length === 0 && p.quantity > 0) {
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

  // Persistence
  useEffect(() => {
    localStorage.setItem("inventory_products", JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem("inventory_sales", JSON.stringify(sales));
  }, [sales]);

  useEffect(() => {
    localStorage.setItem("inventory_restocks", JSON.stringify(restocks));
  }, [restocks]);

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
        getAIReplenishmentSuggestions(products, sales),
        getAIBusinessAnalysis(products, sales)
      ]);
      setAiInsights([...replenishment, ...analysis]);
      toast.success("Análisis de IA completado");
    } catch (error) {
      toast.error("Error al ejecutar el análisis de IA");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Product Handlers
  const handleAddProduct = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const newProduct: Product = {
      id: editingProduct?.id || Math.random().toString(36).substr(2, 9),
      name,
      code: (formData.get("code") as string) || generateProductCode(name),
      brand: (formData.get("brand") as string) || "Genérico",
      price: parseFloat(formData.get("price") as string),
      quantity: editingProduct ? editingProduct.quantity : parseInt(formData.get("quantity") as string),
      category: formData.get("category") as string,
      minStockLevel: parseInt(formData.get("minStock") as string),
      lastUpdated: new Date().toISOString(),
    };

    if (editingProduct) {
      setProducts(products.map(p => p.id === editingProduct.id ? newProduct : p));
      toast.success("Producto actualizado");
    } else {
      setProducts([...products, newProduct]);
      toast.success("Producto añadido");
    }
    setIsAddDialogOpen(false);
    setEditingProduct(null);
  };

  const handleDeleteProduct = (id: string) => {
    setProducts(products.filter(p => p.id !== id));
    toast.success("Producto eliminado");
  };

  const handleSimulateSale = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product && product.quantity > 0) {
      setProducts(products.map(p => p.id === productId ? { ...p, quantity: p.quantity - 1 } : p));
      const newSale: SaleRecord = {
        id: Math.random().toString(36).substr(2, 9),
        productId,
        quantity: 1,
        date: new Date().toISOString(),
      };
      setSales([...sales, newSale]);
      toast.info(`Venta registrada: ${product.name}`);
    } else {
      toast.error("Sin stock disponible");
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
      const total = daySales.reduce((acc, s) => acc + s.quantity, 0);
      return { date: date.split('-').slice(1).join('/'), sales: total };
    });
  }, [sales]);

  return (
    <div className="min-h-screen bg-[#F8F9FC] text-slate-900 font-sans">
      <Toaster position="top-right" />
      
      {/* Sidebar / Nav */}
      <div className="fixed left-0 top-0 h-full w-64 bg-white border-r border-slate-200 p-6 hidden md:block">
        <div className="flex items-center gap-2 mb-10">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <Package className="text-white w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">StockMaster <span className="text-indigo-600">AI</span></h1>
        </div>

        <nav className="space-y-2">
          <NavItem 
            active={activeTab === "dashboard"} 
            onClick={() => setActiveTab("dashboard")}
            icon={<LayoutDashboard size={20} />}
            label="Dashboard"
          />
          <NavItem 
            active={activeTab === "inventory"} 
            onClick={() => setActiveTab("inventory")}
            icon={<Package size={20} />}
            label="Inventario"
          />
          <NavItem 
            active={activeTab === "products"} 
            onClick={() => setActiveTab("products")}
            icon={<Edit2 size={20} />}
            label="Productos"
          />
          <NavItem 
            active={activeTab === "sales"} 
            onClick={() => setActiveTab("sales")}
            icon={<ShoppingCart size={20} />}
            label="Ventas"
          />
          <NavItem 
            active={activeTab === "ai"} 
            onClick={() => setActiveTab("ai")}
            icon={<BrainCircuit size={20} />}
            label="Insights IA"
          />
        </nav>
      </div>

      {/* Main Content */}
      <main className="md:ml-64 p-8">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              {activeTab === "dashboard" ? "Resumen de Negocio" : 
               activeTab === "inventory" ? "Control de Inventario" : 
               activeTab === "products" ? "Catálogo de Productos" :
               activeTab === "sales" ? "Reporte de Ventas" :
               "Inteligencia Artificial"}
            </h2>
            <p className="text-slate-500 text-sm">Bienvenido de nuevo, aquí está lo que sucede hoy.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="bg-white" onClick={() => window.location.reload()}>
              <RefreshCw size={16} className="mr-2" /> Refrescar
            </Button>
            {activeTab === "products" && (
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger render={
                  <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => setEditingProduct(null)}>
                    <Plus size={16} className="mr-2" /> Nuevo Producto
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
                  value={`$${analytics.todayRevenue.toFixed(2)}`} 
                  icon={<TrendingUp className="text-emerald-600" />}
                  trend={`${analytics.revenueChange >= 0 ? '+' : ''}${analytics.revenueChange.toFixed(1)}%`}
                  trendUp={analytics.revenueChange >= 0}
                  description="vs. ayer"
                />
                <StatCard 
                  title="Ingresos Semana" 
                  value={`$${analytics.thisWeekRevenue.toFixed(2)}`} 
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
                            <p className="text-[10px] text-emerald-600 font-medium">${p.totalRev.toFixed(2)}</p>
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
                  <Table>
                    <TableHeader className="bg-slate-50/50">
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
                          <TableCell className="font-semibold text-slate-700">${product.price.toFixed(2)}</TableCell>
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
                          <TableCell colSpan={5} className="h-32 text-center text-slate-500">
                            No se encontraron productos en el catálogo.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
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
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
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

                const totalRevenue = filteredSales.reduce((acc, s) => {
                  const p = products.find(prod => prod.id === s.productId);
                  return acc + (p ? p.price * s.quantity : 0);
                }, 0);

                const totalUnits = filteredSales.reduce((acc, s) => acc + s.quantity, 0);

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
                        value={`$${totalRevenue.toFixed(2)}`} 
                        icon={<DollarSign className="text-emerald-600" />}
                      />
                      <StatCard 
                        title="Promedio por Venta" 
                        value={`$${filteredSales.length ? (totalRevenue / filteredSales.length).toFixed(2) : "0.00"}`} 
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
                                    const product = products.find(p => p.id === sale.productId);
                                    return (
                                      <TableRow key={sale.id}>
                                        <TableCell className="font-medium">{product?.name || "Desconocido"}</TableCell>
                                        <TableCell className="text-slate-500 text-xs">
                                          {new Date(sale.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </TableCell>
                                        <TableCell>{sale.quantity}</TableCell>
                                        <TableCell className="text-right font-semibold">
                                          ${(sale.quantity * (product?.price || 0)).toFixed(2)}
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
                                const p = products.find(prod => prod.id === s.productId);
                                acc[date].total += (p ? p.price * s.quantity : 0);
                                acc[date].units += s.quantity;
                                return acc;
                              }, {} as Record<string, any>);

                              const sortedGrouped = Object.values(grouped).sort((a: any, b: any) => b.date.localeCompare(a.date));

                              return (
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
                                          ${group.total.toFixed(2)}
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
        </AnimatePresence>
      </main>
    </div>
  );
}

// Helper Components
function NavItem({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
        active 
          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" 
          : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
      }`}
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
