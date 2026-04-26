import * as React from "react";
import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RefreshCw, Package, History, Calendar, BrainCircuit, Plus, Search, AlertTriangle } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { Product, InventoryStats, RestockRecord } from "@/types";

interface InventoryPageProps {
  inventoryTab: "status" | "restock";
  setInventoryTab: (v: "status" | "restock") => void;
  filteredProducts: Product[];
  products: Product[];
  stats: InventoryStats;
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  getDaysOfStock: (id: string) => number;
  getRestockSuggestion: (id: string) => number;
  restockProductId: string;
  setRestockProductId: (v: string) => void;
  restockQuantity: string;
  setRestockQuantity: (v: string) => void;
  restocks: RestockRecord[];
  handleRestock: () => void;
  setActiveTab: (tab: string) => void;
}

export function InventoryPage({
  inventoryTab, setInventoryTab, filteredProducts, products, stats, searchTerm, setSearchTerm,
  getDaysOfStock, getRestockSuggestion, restockProductId, setRestockProductId,
  restockQuantity, setRestockQuantity, restocks, handleRestock, setActiveTab,
}: InventoryPageProps) {
  return (
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
                      Basado en ventas recientes, se recomienda reponer{" "}
                      <span className="font-bold text-indigo-800">{getRestockSuggestion(restockProductId)} unidades</span>{" "}
                      para cubrir los próximos 30 días.
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
                  onClick={handleRestock}
                >
                  <Plus size={16} className="mr-2" /> Registrar Entrada
                </Button>
              </CardContent>
            </Card>

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
  );
}
