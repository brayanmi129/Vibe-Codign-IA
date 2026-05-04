import * as React from "react";
import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Minus, Search, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { Product, SaleItem } from "@/types";

interface NewSalePageProps {
  products: Product[];
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  cart: SaleItem[];
  addToCart: (product: Product, qty: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity?: (productId: string, newQuantity: number) => void;
  handleStartCheckout: () => void;
}

export function NewSalePage({
  products, searchTerm, setSearchTerm, cart, addToCart, removeFromCart, updateCartQuantity, handleStartCheckout,
}: NewSalePageProps) {
  const cartTotal = cart.reduce((acc, item) => acc + item.totalPrice, 0);

  return (
    <motion.div
      key="new-sale"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                          <span className="text-lg font-bold text-brand-primary">{formatCurrency(product.price)}</span>
                          <Button
                            size="sm"
                            disabled={product.quantity <= 0}
                            onClick={() => addToCart(product, 1)}
                            className="bg-indigo-50 text-brand-primary hover:bg-indigo-100 border-none"
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

        <Card className="bg-white border-slate-200 shadow-sm h-fit sticky top-8">
          <CardHeader className="border-b border-slate-100">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg font-bold">Resumen de Venta</CardTitle>
              <Badge className="bg-brand-primary">{cart.length} ítems</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="max-h-[400px]">
              {cart.length === 0 ? (
                <div className="p-10 flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mb-3">
                    <Plus size={24} className="text-slate-300" />
                  </div>
                  <p className="text-sm font-bold text-slate-700">Carrito vacío</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-[220px]">
                    Busca un producto a la izquierda y haz clic en "Añadir" para empezar.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {cart.map(item => (
                    <div key={item.productId} className="p-4 flex justify-between items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <h5 className="text-sm font-medium text-slate-900 truncate">{item.productName}</h5>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[11px] text-slate-500">{formatCurrency(item.unitPrice)} c/u</span>
                          <span className="text-[11px] font-bold text-brand-primary">= {formatCurrency(item.totalPrice)}</span>
                        </div>
                      </div>
                      {/* Controles de cantidad +/- */}
                      <div className="flex items-center gap-1 bg-slate-50 rounded-lg p-0.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 hover:bg-white"
                          aria-label="Disminuir cantidad"
                          onClick={() => updateCartQuantity?.(item.productId, item.quantity - 1)}
                          disabled={!updateCartQuantity}
                        >
                          <Minus size={12} />
                        </Button>
                        <span className="w-7 text-center text-sm font-bold text-slate-900 tabular-nums">
                          {item.quantity}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 hover:bg-white"
                          aria-label="Aumentar cantidad"
                          onClick={() => updateCartQuantity?.(item.productId, item.quantity + 1)}
                          disabled={!updateCartQuantity}
                        >
                          <Plus size={12} />
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-slate-400 hover:text-red-500 flex-shrink-0"
                        aria-label="Quitar del carrito"
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
                  <span className="text-2xl font-bold text-slate-900">{formatCurrency(cartTotal)}</span>
                </div>
                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-12 text-lg font-bold"
                  onClick={handleStartCheckout}
                >
                  Continuar al Cliente →
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
