import * as React from "react";
import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Search, Edit2, Trash2, AlertTriangle, Plus, Sparkles, Camera, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { Product } from "@/types";
import { analyzeProductImage } from "@/lib/inventoryService";
import { toast } from "sonner";

interface ProductsPageProps {
  filteredProducts: Product[];
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  categoryFilter: string;
  setCategoryFilter: (v: string) => void;
  categories: string[];
  canEdit: boolean;
  isAddDialogOpen: boolean;
  setIsAddDialogOpen: (v: boolean) => void;
  editingProduct: Product | null;
  setEditingProduct: (p: Product | null) => void;
  handleAddProduct: (e: React.FormEvent<HTMLFormElement>) => void;
  handleDeleteProduct: (id: string) => void;
}

export function ProductsPage({
  filteredProducts, searchTerm, setSearchTerm, categoryFilter, setCategoryFilter,
  categories, canEdit, isAddDialogOpen, setIsAddDialogOpen, editingProduct,
  setEditingProduct, handleAddProduct, handleDeleteProduct,
}: ProductsPageProps) {
  const [isScanning, setIsScanning] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [formValues, setFormValues] = React.useState<Partial<Product>>({});

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(",")[1];
        const analysis = await analyzeProductImage(base64);
        if (analysis) {
          setFormValues(analysis);
          setEditingProduct(null);
          setIsAddDialogOpen(true);
          toast.success("¡Análisis completado con éxito! ✨");
        } else {
          toast.error("No pudimos analizar la imagen. Intenta con otra.");
        }
        setIsScanning(false);
      };
      reader.readAsDataURL(file);
    } catch {
      toast.error("Error al procesar la imagen");
      setIsScanning(false);
    }
  };

  return (
    <motion.div
      key="products"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="space-y-6"
    >
      <input 
        type="file" 
        accept="image/*" 
        className="hidden" 
        ref={fileInputRef}
        onChange={handleFileChange}
      />

      <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="pb-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-bold">Gestión de Catálogo</CardTitle>
              <CardDescription>Edita la información básica de tus productos.</CardDescription>
            </div>
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <Input
                  placeholder="Buscar por nombre..."
                  className="pl-10 bg-white border-slate-200 h-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[160px] bg-white border-slate-200 h-9">
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>
                      {cat === "all" ? "Todas" : cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {canEdit && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    className="border-indigo-200 text-indigo-600 hover:bg-indigo-50 px-4 h-11 rounded-2xl"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isScanning}
                  >
                    {isScanning ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Camera className="mr-2 h-4 w-4" />
                    )}
                    Escanear Producto
                  </Button>

                  <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
                    if (!open) {
                      setFormValues({});
                      setEditingProduct(null);
                    }
                    setIsAddDialogOpen(open);
                  }}>
                    <DialogTrigger
                      render={
                        <Button
                          className="bg-brand-primary text-white shadow-lg px-6 h-11 rounded-2xl"
                          onClick={() => {
                            setEditingProduct(null);
                            setFormValues({});
                          }}
                        />
                      }
                    >
                      <Plus size={18} className="mr-2" /> Nuevo
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <form onSubmit={handleAddProduct}>
                        <DialogHeader>
                          <div className="flex items-center justify-between">
                            <DialogTitle>{editingProduct ? "Editar Producto" : "Agregar Producto"}</DialogTitle>
                            {Object.keys(formValues).length > 0 && (
                              <Badge className="bg-emerald-100 text-emerald-700 border-none font-bold">
                                <Sparkles size={10} className="mr-1" /> IA Sugerido
                              </Badge>
                            )}
                          </div>
                          <DialogDescription>
                            Completa los detalles del producto para tu catálogo.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">Nombre</Label>
                            <Input id="name" name="name" defaultValue={editingProduct?.name || formValues.name} className="col-span-3" required />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="brand" className="text-right">Marca</Label>
                            <Input id="brand" name="brand" defaultValue={editingProduct?.brand || formValues.brand} className="col-span-3" placeholder="Ej: Nestlé" required />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="code" className="text-right">Código</Label>
                            <Input id="code" name="code" defaultValue={editingProduct?.code} className="col-span-3" placeholder="Ej: COD123 (Opcional)" />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="category" className="text-right">Categoría</Label>
                            <Input id="category" name="category" defaultValue={editingProduct?.category || formValues.category} className="col-span-3" required />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="price" className="text-right">Precio venta</Label>
                            <div className="col-span-3 relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">$</span>
                              <Input id="price" name="price" type="number" step="1" defaultValue={editingProduct?.price || formValues.price} className="pl-7" required />
                            </div>
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="costPrice" className="text-right">Precio costo</Label>
                            <div className="col-span-3 relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">$</span>
                              <Input id="costPrice" name="costPrice" type="number" step="1" defaultValue={editingProduct?.costPrice} className="pl-7" placeholder="Opcional" />
                            </div>
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
                              <Input id="minStock" name="minStock" type="number" defaultValue={editingProduct?.minStockLevel || formValues.minStockLevel} className="col-span-3 border-indigo-100 focus:border-indigo-300" required />
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1 ml-[25%]">Se activará una alerta cuando el stock sea igual o menor a este valor.</p>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button type="submit" className="bg-indigo-600 text-white rounded-xl">Guardar Cambios</Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
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
                  <TableHead className="font-semibold">Precio Venta</TableHead>
                  <TableHead className="font-semibold">Precio Costo</TableHead>
                  <TableHead className="font-semibold">Margen</TableHead>
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
                    <TableCell className="text-slate-500">
                      {product.costPrice ? formatCurrency(product.costPrice) : <span className="text-slate-300 italic text-xs">—</span>}
                    </TableCell>
                    <TableCell>
                      {product.costPrice ? (() => {
                        const margin = ((product.price - product.costPrice) / product.price) * 100;
                        return (
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            margin >= 30 ? "bg-emerald-50 text-emerald-700" :
                            margin >= 15 ? "bg-amber-50 text-amber-700" :
                            "bg-rose-50 text-rose-700"
                          }`}>
                            {margin.toFixed(1)}%
                          </span>
                        );
                      })() : <span className="text-slate-300 italic text-xs">—</span>}
                    </TableCell>
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
                    <TableCell colSpan={9} className="h-32 text-center text-slate-500">
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
  );
}
