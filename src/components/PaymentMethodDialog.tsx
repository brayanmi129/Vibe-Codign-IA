import * as React from "react";
import { useState, useMemo, useEffect } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Banknote, CreditCard, ArrowRightLeft, Plus, Trash2,
  CheckCircle2, Loader2, AlertCircle,
} from "lucide-react";
import { PaymentRecord, PaymentMethod } from "@/types";
import { BANCOS_COLOMBIA } from "@/constants/bancos";
import { formatCurrency } from "@/lib/formatters";

interface PaymentMethodDialogProps {
  open: boolean;
  totalAmount: number;
  isProcessing: boolean;
  onCancel: () => void;
  onConfirm: (payments: PaymentRecord[]) => void;
}

// ── Helpers ────────────────────────────────────────────────────
const onlyDigits = (s: string) => s.replace(/\D/g, "");
const formatThousands = (n: number) =>
  n === 0 ? "" : new Intl.NumberFormat("es-CO").format(n);

/**
 * Modal "Método de Pago" con soporte de pagos divididos.
 *  - 3 pestañas: Efectivo / Tarjeta / Transferencia.
 *  - Cada "Agregar Pago" empuja un PaymentRecord al estado `payments`.
 *  - El botón final ("Aceptar Pago y Generar PDF") sólo se habilita
 *    cuando la suma de pagos === totalAmount EXACTAMENTE.
 */
export function PaymentMethodDialog({
  open, totalAmount, isProcessing, onCancel, onConfirm,
}: PaymentMethodDialogProps) {
  // ── Estado principal ────────────────────────────────────────
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [activeTab, setActiveTab] = useState<PaymentMethod>("efectivo");
  const [error, setError] = useState<string>("");

  // ── Formularios por tab ─────────────────────────────────────
  const [cashAmount, setCashAmount] = useState("");

  const [cardAmount, setCardAmount] = useState("");
  const [cardLastFour, setCardLastFour] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardBank, setCardBank] = useState("");
  const [cardType, setCardType] = useState("");

  const [transferAmount, setTransferAmount] = useState("");
  const [transferBank, setTransferBank] = useState("");
  const [transferRef, setTransferRef] = useState("");

  // ── Valores derivados ───────────────────────────────────────
  const totalPaid = useMemo(
    () => payments.reduce((sum, p) => sum + p.amount, 0),
    [payments]
  );
  const remaining = totalAmount - totalPaid;
  const isFullyPaid = remaining === 0 && payments.length > 0;
  const progressPct = totalAmount > 0 ? Math.min(100, (totalPaid / totalAmount) * 100) : 0;

  // ── Reset cuando se cierra el modal ─────────────────────────
  useEffect(() => {
    if (!open) {
      setPayments([]); setActiveTab("efectivo"); setError("");
      setCashAmount("");
      setCardAmount(""); setCardLastFour(""); setCardExpiry(""); setCardBank(""); setCardType("");
      setTransferAmount(""); setTransferBank(""); setTransferRef("");
    }
  }, [open]);

  // ── Auto-rellenar el campo "valor a cancelar" con lo restante ─
  useEffect(() => {
    const r = remaining > 0 ? String(remaining) : "";
    if (activeTab === "efectivo" && !cashAmount) setCashAmount(r);
    else if (activeTab === "tarjeta" && !cardAmount) setCardAmount(r);
    else if (activeTab === "transferencia" && !transferAmount) setTransferAmount(r);
    // Dependencias intencionalmente sin los amount fields (evita loops)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, remaining]);

  // ── Handlers de inputs ──────────────────────────────────────
  const handleAmountChange =
    (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setError("");
      setter(onlyDigits(e.target.value));
    };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = onlyDigits(e.target.value).slice(0, 4);
    if (v.length >= 3) v = `${v.slice(0, 2)}/${v.slice(2)}`;
    setCardExpiry(v);
    setError("");
  };

  // ── Validación común para "Agregar Pago" ────────────────────
  const validateAmount = (amountStr: string): number | null => {
    const amount = parseInt(amountStr || "0", 10);
    if (!amount || amount <= 0) {
      setError("Debes ingresar un valor mayor a cero.");
      return null;
    }
    if (amount > remaining) {
      setError(`El valor excede lo restante por pagar (${formatCurrency(remaining)}).`);
      return null;
    }
    return amount;
  };

  // ── Agregar pago: Efectivo ──────────────────────────────────
  const addCashPayment = () => {
    const amount = validateAmount(cashAmount);
    if (amount === null) return;
    setPayments(prev => [...prev, {
      id: `pay_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      method: "efectivo",
      amount,
      createdAt: new Date().toISOString(),
    }]);
    setCashAmount("");
  };

  // ── Agregar pago: Tarjeta ───────────────────────────────────
  const addCardPayment = () => {
    if (cardLastFour.length !== 4) { setError("Los últimos 4 dígitos son obligatorios."); return; }
    if (!/^\d{2}\/\d{2}$/.test(cardExpiry)) { setError("Fecha de vencimiento inválida (MM/YY)."); return; }
    if (!cardBank) { setError("Selecciona el banco."); return; }
    if (!cardType) { setError("Selecciona el tipo de tarjeta."); return; }
    const amount = validateAmount(cardAmount);
    if (amount === null) return;

    const bank = BANCOS_COLOMBIA.find(b => b.id === cardBank);
    setPayments(prev => [...prev, {
      id: `pay_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      method: "tarjeta",
      amount,
      lastFourDigits: cardLastFour,
      expiryDate: cardExpiry,
      bankId: cardBank,
      bankName: bank?.nombre ?? cardBank,
      cardType: cardType as "debito" | "credito",
      createdAt: new Date().toISOString(),
    }]);
    setCardAmount(""); setCardLastFour(""); setCardExpiry("");
    setCardBank(""); setCardType("");
  };

  // ── Agregar pago: Transferencia ─────────────────────────────
  const addTransferPayment = () => {
    if (!transferBank) { setError("Selecciona el banco."); return; }
    if (!transferRef.trim()) { setError("La referencia/número de transferencia es obligatorio."); return; }
    const amount = validateAmount(transferAmount);
    if (amount === null) return;

    const bank = BANCOS_COLOMBIA.find(b => b.id === transferBank);
    setPayments(prev => [...prev, {
      id: `pay_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      method: "transferencia",
      amount,
      bankId: transferBank,
      bankName: bank?.nombre ?? transferBank,
      transferReference: transferRef.trim(),
      createdAt: new Date().toISOString(),
    }]);
    setTransferAmount(""); setTransferBank(""); setTransferRef("");
  };

  const removePayment = (id: string) => {
    setPayments(prev => prev.filter(p => p.id !== id));
    setError("");
  };

  const handleConfirm = () => {
    if (!isFullyPaid) return;
    onConfirm(payments);
  };

  const getMethodLabel = (m: PaymentMethod) =>
    m === "efectivo" ? "Efectivo" : m === "tarjeta" ? "Tarjeta" : "Transferencia";

  // ── Render ──────────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={(v) => !v && !isProcessing && onCancel()}>
      <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Método de Pago</DialogTitle>
          <DialogDescription>
            Registra uno o varios pagos hasta cubrir el total de la factura.
          </DialogDescription>
        </DialogHeader>

        {/* ── Resumen ──────────────────────────────────────── */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className="text-xs text-slate-500">Total factura</p>
              <p className="text-lg font-bold text-slate-900">{formatCurrency(totalAmount)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Ya pagado</p>
              <p className="text-lg font-bold text-emerald-600">{formatCurrency(totalPaid)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Restante</p>
              <p className={`text-lg font-bold ${remaining === 0 ? "text-emerald-600" : "text-amber-600"}`}>
                {formatCurrency(remaining)}
              </p>
            </div>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${remaining === 0 ? "bg-emerald-500" : "bg-indigo-500"}`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* ── Tabs ─────────────────────────────────────────── */}
        <Tabs
          value={activeTab}
          onValueChange={(v: any) => { setActiveTab(v); setError(""); }}
          className="w-full"
        >
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="efectivo">
              <Banknote className="w-4 h-4 mr-1" /> Efectivo
            </TabsTrigger>
            <TabsTrigger value="tarjeta">
              <CreditCard className="w-4 h-4 mr-1" /> Tarjeta
            </TabsTrigger>
            <TabsTrigger value="transferencia">
              <ArrowRightLeft className="w-4 h-4 mr-1" /> Transferencia
            </TabsTrigger>
          </TabsList>

          {/* ── Efectivo ────────────────────────────────── */}
          <TabsContent value="efectivo" className="mt-4 space-y-3">
            <div className="space-y-2">
              <Label htmlFor="cashAmount">Valor a cancelar</Label>
              <Input
                id="cashAmount"
                inputMode="numeric"
                placeholder="Ej: 20000"
                value={formatThousands(parseInt(cashAmount || "0", 10))}
                onChange={handleAmountChange(setCashAmount)}
                disabled={isProcessing || isFullyPaid}
              />
            </div>
            <Button
              onClick={addCashPayment}
              disabled={isProcessing || isFullyPaid || !cashAmount}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" /> Agregar Pago
            </Button>
          </TabsContent>

          {/* ── Tarjeta ─────────────────────────────────── */}
          <TabsContent value="tarjeta" className="mt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="cardAmount">Valor a cancelar</Label>
                <Input
                  id="cardAmount"
                  inputMode="numeric"
                  placeholder="Ej: 30000"
                  value={formatThousands(parseInt(cardAmount || "0", 10))}
                  onChange={handleAmountChange(setCardAmount)}
                  disabled={isProcessing || isFullyPaid}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cardLastFour">Últimos 4 dígitos</Label>
                <Input
                  id="cardLastFour"
                  inputMode="numeric"
                  placeholder="1234"
                  maxLength={4}
                  value={cardLastFour}
                  onChange={(e) => {
                    setError("");
                    setCardLastFour(onlyDigits(e.target.value).slice(0, 4));
                  }}
                  disabled={isProcessing || isFullyPaid}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cardExpiry">Vencimiento (MM/YY)</Label>
                <Input
                  id="cardExpiry"
                  placeholder="MM/YY"
                  maxLength={5}
                  value={cardExpiry}
                  onChange={handleExpiryChange}
                  disabled={isProcessing || isFullyPaid}
                />
              </div>
              <div className="space-y-2">
                <Label>Banco</Label>
                <Select
                  value={cardBank}
                  onValueChange={(v) => { setError(""); setCardBank(v); }}
                  disabled={isProcessing || isFullyPaid}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona banco" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[250px]">
                    {BANCOS_COLOMBIA.map(b => (
                      <SelectItem key={b.id} value={b.id}>{b.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tipo de tarjeta</Label>
                <Select
                  value={cardType}
                  onValueChange={(v) => { setError(""); setCardType(v); }}
                  disabled={isProcessing || isFullyPaid}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Débito / Crédito" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="debito">Débito</SelectItem>
                    <SelectItem value="credito">Crédito</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              onClick={addCardPayment}
              disabled={isProcessing || isFullyPaid || !cardAmount}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" /> Agregar Pago
            </Button>
          </TabsContent>

          {/* ── Transferencia ─────────────────────────── */}
          <TabsContent value="transferencia" className="mt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2 col-span-2">
                <Label>Banco</Label>
                <Select
                  value={transferBank}
                  onValueChange={(v) => { setError(""); setTransferBank(v); }}
                  disabled={isProcessing || isFullyPaid}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona banco" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[250px]">
                    {BANCOS_COLOMBIA.map(b => (
                      <SelectItem key={b.id} value={b.id}>{b.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="transferRef">Número de transferencia (referencia)</Label>
                <Input
                  id="transferRef"
                  placeholder="Ej: TRX-123456"
                  value={transferRef}
                  onChange={(e) => { setError(""); setTransferRef(e.target.value); }}
                  disabled={isProcessing || isFullyPaid}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="transferAmount">Valor a cancelar</Label>
                <Input
                  id="transferAmount"
                  inputMode="numeric"
                  placeholder="Ej: 50000"
                  value={formatThousands(parseInt(transferAmount || "0", 10))}
                  onChange={handleAmountChange(setTransferAmount)}
                  disabled={isProcessing || isFullyPaid}
                />
              </div>
            </div>
            <Button
              onClick={addTransferPayment}
              disabled={isProcessing || isFullyPaid || !transferAmount}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" /> Agregar Pago
            </Button>
          </TabsContent>
        </Tabs>

        {/* ── Mensaje de error ─────────────────────────── */}
        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* ── Lista de pagos agregados ─────────────────── */}
        {payments.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-700">
              Pagos agregados ({payments.length})
            </p>
            <ScrollArea className="max-h-[180px] pr-2">
              <div className="space-y-2">
                {payments.map(p => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-lg"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Badge className={
                        p.method === "efectivo"
                          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                          : p.method === "tarjeta"
                          ? "bg-indigo-100 text-indigo-700 hover:bg-indigo-100"
                          : "bg-amber-100 text-amber-700 hover:bg-amber-100"
                      }>
                        {getMethodLabel(p.method)}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900">
                          {formatCurrency(p.amount)}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {p.method === "tarjeta" &&
                            `${p.bankName} • **** ${p.lastFourDigits} • ${p.cardType}`}
                          {p.method === "transferencia" &&
                            `${p.bankName} • Ref: ${p.transferReference}`}
                          {p.method === "efectivo" && "Pago en efectivo"}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-slate-400 hover:text-red-500 flex-shrink-0"
                      onClick={() => removePayment(p.id)}
                      disabled={isProcessing}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* ── Estado de pago completo ──────────────────── */}
        {isFullyPaid && (
          <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <p className="text-sm font-medium text-emerald-800">
              ¡Pago completo! Ya puedes generar el PDF.
            </p>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onCancel} disabled={isProcessing}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!isFullyPaid || isProcessing}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Aceptar Pago y Generar PDF
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}