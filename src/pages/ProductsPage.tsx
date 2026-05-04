import * as React from "react";
import * as XLSX from 'xlsx';
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
import { Search, Edit2, Trash2, AlertTriangle, Plus, Sparkles, Camera, Loader2, Upload, FileSpreadsheet, RefreshCw, Download, Receipt } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { Product, TaxCategory, TAX_CATEGORY_LABELS, TAX_CATEGORY_RATES } from "@/types";
import { analyzeProductImage, suggestProductTax } from "@/lib/inventoryService";
import { downloadProductTemplate } from "@/components/ExcelExport";
import { toast } from "sonner";

interface ImportRow {
  name: string;
  brand?: string;
  code?: string;
  category?: string;
  price?: number;
  costPrice?: number;
  quantity?: number;
  minStockLevel?: number;
}

const COLUMN_MAP: Record<string, keyof ImportRow> = {
  'nombre': 'name', 'producto': 'name', 'name': 'name',
  'marca': 'brand', 'brand': 'brand',
  'código': 'code', 'codigo': 'code', 'code': 'code', 'referencia': 'code', 'ref': 'code',
  'categoría': 'category', 'categoria': 'category', 'category': 'category',
  'precio': 'price', 'precio venta': 'price', 'precio de venta': 'price', 'price': 'price',
  'costo': 'costPrice', 'precio costo': 'costPrice', 'precio de costo': 'costPrice', 'cost': 'costPrice',
  'stock': 'quantity', 'cantidad': 'quantity', 'quantity': 'quantity', 'inventario': 'quantity',
  'stock mínimo': 'minStockLevel', 'stock minimo': 'minStockLevel',
  'mínimo': 'minStockLevel', 'minimo': 'minStockLevel', 'min stock': 'minStockLevel', 'min': 'minStockLevel',
};

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
  onImportProducts: (rows: ImportRow[]) => Promise<void>;
}

export function ProductsPage({
  filteredProducts, searchTerm, setSearchTerm, categoryFilter, setCategoryFilter,
  categories, canEdit, isAddDialogOpen, setIsAddDialogOpen, editingProduct,
  setEditingProduct, handleAddProduct, handleDeleteProduct, onImportProducts,
}: ProductsPageProps) {
  const [isScanning, setIsScanning] = React.useState(false);
  const [formValues, setFormValues] = React.useState<Partial<Product>>({});
  const [importRows, setImportRows] = React.useState<ImportRow[]>([]);
  const [isImportOpen, setIsImportOpen] = React.useState(false);
  const [isImporting, setIsImporting] = React.useState(false);
  const [taxCategory, setTaxCategory] = React.useState<TaxCategory>('general');
  const [isSuggestingTax, setIsSuggestingTax] = React.useState(false);
  // Producto pendiente de confirmar para borrar (null = cerrado)
  const [productToDelete, setProductToDelete] = React.useState<Product | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const importRef = React.useRef<HTMLInputElement>(null);
  const formRef = React.useRef<HTMLFormElement>(null);
  // Caché en memoria: nombre+categoría que ya consultamos esta sesión.
  // Evita re-llamar a la IA cada vez que el usuario hace blur sobre el mismo input.
  const suggestedKeysRef = React.useRef<Set<string>>(new Set());

  // Sincroniza el Select de IVA cuando cambia el producto que se está editando
  // o cuando la IA llena formValues (escaneo por imagen).
  React.useEffect(() => {
    if (editingProduct?.taxCategory) setTaxCategory(editingProduct.taxCategory);
    else if (formValues.taxCategory) setTaxCategory(formValues.taxCategory as TaxCategory);
    else setTaxCategory('general');
  }, [editingProduct?.id, formValues.taxCategory]);

  // Limpiar caché cada vez que se abre el dialog (nuevo producto / edición distinta)
  React.useEffect(() => {
    if (isAddDialogOpen) suggestedKeysRef.current.clear();
  }, [isAddDialogOpen]);

  /**
   * Lógica común de sugerencia. `silent`=true (uso automático): solo avisa si
   * la confianza es baja. `silent`=false (botón manual): siempre muestra toast.
   */
  const runTaxSuggestion = async (name: string, category: string, silent: boolean) => {
    const cacheKey = `${name.toLowerCase()}::${category.toLowerCase()}`;
    if (suggestedKeysRef.current.has(cacheKey)) return; // ya consultado en esta sesión
    suggestedKeysRef.current.add(cacheKey);

    setIsSuggestingTax(true);
    try {
      const result = await suggestProductTax(name, category);
      if (result) {
        setTaxCategory(result.taxCategory);
        const confLabel = result.confidence === 'alta' ? '✓' : result.confidence === 'baja' ? '?' : '';
        // En modo silencioso solo mostramos toast si confianza baja (vale la pena revisar manualmente)
        if (!silent || result.confidence === 'baja') {
          const fn = result.confidence === 'baja' ? toast.warning : toast.success;
          fn(`${confLabel} IVA: ${TAX_CATEGORY_LABELS[result.taxCategory]} — ${result.reasoning}`, { duration: 5500 });
        } else {
          // En modo silencioso con confianza alta/media: mensaje breve
          toast.success(`IVA detectado: ${TAX_CATEGORY_LABELS[result.taxCategory]}`, { duration: 2500 });
        }
      } else if (!silent) {
        toast.error("No se pudo obtener sugerencia. Verifica tu API key (GROQ_API_KEY o GEMINI_API_KEY) en .env");
      }
    } finally {
      setIsSuggestingTax(false);
    }
  };

  // Botón manual "IA" — siempre da feedback explícito.
  const handleSuggestTax = async () => {
    const form = formRef.current;
    if (!form) return;
    const fd = new FormData(form);
    const name = String(fd.get('name') || '').trim();
    const category = String(fd.get('category') || '').trim();
    if (!name) {
      toast.error("Escribe primero el nombre del producto");
      return;
    }
    // Botón manual: forzar re-consulta aunque ya esté en caché
    suggestedKeysRef.current.delete(`${name.toLowerCase()}::${category.toLowerCase()}`);
    await runTaxSuggestion(name, category, false);
  };

  // Auto-sugerencia al perder foco del input de nombre.
  const handleNameBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const name = e.currentTarget.value.trim();
    if (name.length < 3) return;
    // Si está editando un producto que ya tiene categoría tributaria, no machacamos
    if (editingProduct?.taxCategory) return;
    const fd = new FormData(formRef.current!);
    const category = String(fd.get('category') || '').trim();
    await runTaxSuggestion(name, category, true);
  };

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

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = new Uint8Array(ev.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const raw = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

        if (raw.length < 2) { toast.error("El archivo no tiene datos"); return; }

        const headers = (raw[0] as any[]).map(h => String(h ?? '').toLowerCase().trim());
        const numericFields = new Set<keyof ImportRow>(['price', 'costPrice', 'quantity', 'minStockLevel']);

        const rows = raw.slice(1)
          .filter(r => r.some((c: any) => c !== '' && c != null))
          .map(row => {
            const obj: any = {};
            headers.forEach((h, i) => {
              const key = COLUMN_MAP[h];
              if (key && row[i] != null && row[i] !== '') {
                obj[key] = numericFields.has(key) ? (Number(row[i]) || 0) : String(row[i]);
              }
            });
            return obj as ImportRow;
          })
          .filter(r => r.name?.trim());

        if (rows.length === 0) { toast.error("No se encontraron filas válidas. Verifica que el archivo tenga una columna 'Nombre'."); return; }
        setImportRows(rows);
        setIsImportOpen(true);
      } catch {
        toast.error("Error al leer el archivo. Asegúrate de que sea un .xlsx o .csv válido.");
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  const handleConfirmImport = async () => {
    setIsImporting(true);
    try {
      await onImportProducts(importRows);
      setIsImportOpen(false);
      setImportRows([]);
    } finally {
      setIsImporting(false);
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
      {/* Hidden inputs */}
      <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
      <input type="file" accept=".xlsx,.xls,.csv" className="hidden" ref={importRef} onChange={handleImportFile} />

      {/* Confirmación de eliminar producto */}
      <Dialog open={!!productToDelete} onOpenChange={(open) => !open && setProductToDelete(null)}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-2">
              <Trash2 className="text-rose-600" size={20} />
            </div>
            <DialogTitle className="text-center">¿Eliminar producto?</DialogTitle>
            <DialogDescription className="text-center">
              Vas a borrar <strong className="text-slate-900">{productToDelete?.name}</strong>.
              Esta acción no se puede deshacer y el producto desaparecerá de tu catálogo.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setProductToDelete(null)} className="flex-1">
              Cancelar
            </Button>
            <Button
              className="flex-1 bg-rose-600 hover:bg-rose-700 text-white"
              onClick={() => {
                if (productToDelete) {
                  handleDeleteProduct(productToDelete.id);
                  setProductToDelete(null);
                }
              }}
            >
              Sí, eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import preview dialog */}
      <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Importar {importRows.length} producto{importRows.length !== 1 ? 's' : ''}</DialogTitle>
            <DialogDescription>
              Revisa los datos antes de confirmar. Las filas sin nombre serán ignoradas.
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-x-auto max-h-72 rounded-xl border border-slate-100">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Marca</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Stock</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {importRows.slice(0, 12).map((row, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell className="text-slate-500">{row.brand || '—'}</TableCell>
                    <TableCell><Badge variant="secondary" className="text-[10px]">{row.category || 'General'}</Badge></TableCell>
                    <TableCell>{row.price ? formatCurrency(row.price) : '—'}</TableCell>
                    <TableCell>{row.quantity ?? 0}</TableCell>
                  </TableRow>
                ))}
                {importRows.length > 12 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-slate-400 text-xs py-3">
                      ... y {importRows.length - 12} productos más
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsImportOpen(false)}>Cancelar</Button>
            <Button
              disabled={isImporting}
              onClick={handleConfirmImport}
              className="bg-brand-primary hover:bg-brand-secondary text-white gap-2"
            >
              {isImporting ? <RefreshCw size={13} className="animate-spin" /> : <Upload size={13} />}
              Importar {importRows.length} producto{importRows.length !== 1 ? 's' : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="pb-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-bold">Gestión de Catálogo</CardTitle>
              <CardDescription>Edita la información básica de tus productos.</CardDescription>
            </div>
            <div className="flex flex-col md:flex-row md:items-center gap-3">
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
                    <SelectItem key={cat} value={cat}>{cat === "all" ? "Todas" : cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {canEdit && (
                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-slate-200 text-slate-600 hover:bg-slate-50 h-9 gap-1.5"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isScanning}
                  >
                    {isScanning ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
                    Escanear
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 h-9 gap-1.5"
                    onClick={() => importRef.current?.click()}
                  >
                    <FileSpreadsheet size={14} />
                    Importar Excel
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-slate-400 hover:text-slate-600 h-9 gap-1.5"
                    onClick={downloadProductTemplate}
                    title="Descargar plantilla de importación"
                  >
                    <Download size={14} />
                    Plantilla
                  </Button>

                  <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
                    if (!open) { setFormValues({}); setEditingProduct(null); }
                    setIsAddDialogOpen(open);
                  }}>
                    <DialogTrigger
                      render={
                        <Button
                          className="bg-brand-primary text-white shadow-lg px-5 h-9 rounded-xl gap-1.5"
                          onClick={() => { setEditingProduct(null); setFormValues({}); }}
                        />
                      }
                    >
                      <Plus size={16} /> Nuevo
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <form ref={formRef} onSubmit={handleAddProduct}>
                        {/* taxCategory no es un input nativo (Select shadcn) — lo enviamos por hidden */}
                        <input type="hidden" name="taxCategory" value={taxCategory} />
                        <DialogHeader>
                          <div className="flex items-center justify-between">
                            <DialogTitle>{editingProduct ? "Editar Producto" : "Agregar Producto"}</DialogTitle>
                            {Object.keys(formValues).length > 0 && (
                              <Badge className="bg-emerald-100 text-emerald-700 border-none font-bold">
                                <Sparkles size={10} className="mr-1" /> IA Sugerido
                              </Badge>
                            )}
                          </div>
                          <DialogDescription>Completa los detalles del producto para tu catálogo.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">Nombre</Label>
                            <Input
                              id="name"
                              name="name"
                              defaultValue={editingProduct?.name || formValues.name}
                              onBlur={handleNameBlur}
                              className="col-span-3"
                              required
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="brand" className="text-right">Marca</Label>
                            <Input id="brand" name="brand" defaultValue={editingProduct?.brand || formValues.brand} className="col-span-3" placeholder="Ej: Nestlé" />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="code" className="text-right">Código</Label>
                            <Input id="code" name="code" defaultValue={editingProduct?.code} className="col-span-3" placeholder="Opcional — se genera automático" />
                          </div>
                          {/* ── Categoría con autocomplete ────────────────────
                              Usamos <datalist> nativo: muestra las categorías ya
                              existentes pero permite escribir una nueva libre. */}
                          <div className="grid grid-cols-4 items-start gap-4">
                            <Label htmlFor="category" className="text-right pt-2">Categoría</Label>
                            <div className="col-span-3 space-y-1">
                              <Input
                                id="category"
                                name="category"
                                list="product-category-options"
                                defaultValue={editingProduct?.category || formValues.category}
                                placeholder={categories.length > 1 ? "Escoge o escribe una nueva" : "Ej: Bebidas, Snacks..."}
                                required
                                autoComplete="off"
                              />
                              <datalist id="product-category-options">
                                {categories.filter(c => c !== 'all').map(c => (
                                  <option key={c} value={c} />
                                ))}
                              </datalist>
                              {categories.filter(c => c !== 'all').length > 0 && (
                                <p className="text-[10px] text-slate-400">
                                  {categories.filter(c => c !== 'all').length} categoría{categories.filter(c => c !== 'all').length !== 1 ? 's' : ''} existente{categories.filter(c => c !== 'all').length !== 1 ? 's' : ''} · escribe una nueva si no está
                                </p>
                              )}
                            </div>
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
                          {/* ── IVA — Categoría tributaria DIAN ───────────────── */}
                          <div className="grid grid-cols-4 items-start gap-4">
                            <Label className="text-right pt-2 flex items-center justify-end gap-1.5">
                              <Receipt size={12} className="text-slate-400" />
                              IVA
                            </Label>
                            <div className="col-span-3 space-y-2">
                              <div className="flex gap-2">
                                <Select value={taxCategory} onValueChange={(v) => setTaxCategory(v as TaxCategory)}>
                                  <SelectTrigger className="flex-1">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="general">General — 19%</SelectItem>
                                    <SelectItem value="reducido">Reducido — 5%</SelectItem>
                                    <SelectItem value="exento">Exento — 0%</SelectItem>
                                    <SelectItem value="excluido">Excluido (sin IVA)</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="border-violet-200 text-violet-700 hover:bg-violet-50 gap-1.5 h-9"
                                  onClick={handleSuggestTax}
                                  disabled={isSuggestingTax}
                                  title="ARIA analiza el producto y sugiere la categoría tributaria DIAN"
                                >
                                  {isSuggestingTax
                                    ? <Loader2 size={13} className="animate-spin" />
                                    : <Sparkles size={13} />}
                                  IA
                                </Button>
                              </div>
                              <p className="text-[10px] text-slate-400 leading-relaxed">
                                {taxCategory === 'general' && 'Tarifa estándar — la mayoría de productos.'}
                                {taxCategory === 'reducido' && 'Café, chocolate, azúcar, sal, aceites, harina.'}
                                {taxCategory === 'exento' && 'Leche, huevos, carne fresca, pescado fresco.'}
                                {taxCategory === 'excluido' && 'Medicamentos, libros, transporte público.'}
                              </p>
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
                              <Label htmlFor="minStock" className="text-right font-semibold text-brand-primary">Stock Mín.</Label>
                              <Input id="minStock" name="minStock" type="number" defaultValue={editingProduct?.minStockLevel || formValues.minStockLevel || 5} className="col-span-3 border-indigo-100 focus:border-indigo-300" required />
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1 ml-[25%]">Se activará una alerta cuando el stock sea igual o menor a este valor.</p>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button type="submit" className="bg-brand-primary text-white rounded-xl">Guardar Cambios</Button>
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
                  <TableHead className="font-semibold">IVA</TableHead>
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
                      <Badge variant="secondary" className="bg-slate-100 text-slate-600">{product.category}</Badge>
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
                      {(() => {
                        const cat: TaxCategory = product.taxCategory || 'general';
                        const rate = product.taxRate ?? TAX_CATEGORY_RATES[cat];
                        const className =
                          cat === 'general' ? 'bg-slate-100 text-slate-600' :
                          cat === 'reducido' ? 'bg-amber-50 text-amber-700' :
                          cat === 'exento' ? 'bg-sky-50 text-sky-700' :
                          'bg-violet-50 text-violet-700';
                        const label = cat === 'excluido' ? 'Excl.' : `${(rate * 100).toFixed(0)}%`;
                        const isLegacy = !product.taxCategory;
                        return (
                          <Badge
                            variant="secondary"
                            className={className}
                            title={isLegacy ? 'Sin categoría asignada — se asume 19%. Edita el producto para confirmar.' : undefined}
                          >
                            {label}{isLegacy && '*'}
                          </Badge>
                        );
                      })()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-slate-500">
                        <AlertTriangle size={14} className="text-amber-500" />
                        <span>{product.minStockLevel} ud.</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-brand-primary hover:bg-indigo-50" onClick={() => {
                          setEditingProduct(product);
                          setIsAddDialogOpen(true);
                        }}>
                          <Edit2 size={16} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50" onClick={() => setProductToDelete(product)} aria-label="Eliminar producto">
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredProducts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} className="h-64 text-center">
                      <div className="flex flex-col items-center gap-3 py-6">
                        <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center">
                          <Search size={24} className="text-slate-300" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-700">
                            {searchTerm || categoryFilter !== "all" ? "No se encontraron productos" : "Tu catálogo está vacío"}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5 mb-3">
                            {searchTerm || categoryFilter !== "all"
                              ? "Prueba con otra búsqueda o quita los filtros."
                              : "Empieza añadiendo tu primer producto o importa desde Excel."}
                          </p>
                          {!searchTerm && categoryFilter === "all" && canEdit && (
                            <Button
                              size="sm"
                              className="bg-brand-primary hover:bg-brand-secondary text-white"
                              onClick={() => { setEditingProduct(null); setFormValues({}); setIsAddDialogOpen(true); }}
                            >
                              <Plus size={14} className="mr-1.5" /> Crear primer producto
                            </Button>
                          )}
                        </div>
                      </div>
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
