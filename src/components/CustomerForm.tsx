import * as React from "react";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Customer, IdType, ID_TYPE_LABELS, CustomerRecord, buildCustomerKey } from "../types";
import { Loader2, Sparkles } from "lucide-react";

interface CustomerFormProps {
  open: boolean;
  totalAmount: number;
  isProcessing: boolean;
  onCancel: () => void;
  onSubmit: (customer: Customer) => void;
  // Catálogo en memoria de clientes ya registrados — permite autocompletar.
  customers?: CustomerRecord[];
}

// "Hace X tiempo" — humaniza la fecha de la última compra.
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'hoy';
  if (days === 1) return 'ayer';
  if (days < 30) return `hace ${days} días`;
  if (days < 365) return `hace ${Math.floor(days / 30)} meses`;
  return `hace ${Math.floor(days / 365)} años`;
}

/**
 * Modal con el formulario de datos del cliente para la facturación.
 * Validaciones:
 *  - Nombre completo: obligatorio, mínimo 3 caracteres.
 *  - Cédula: obligatoria, solo números, mínimo 5 dígitos.
 *  - Email: opcional, pero si se ingresa debe tener formato válido.
 */
// Reglas de validación por tipo de documento
const ID_RULES: Record<IdType, { regex: RegExp; minLen: number; example: string; hint: string; inputMode: 'numeric' | 'text' }> = {
  CC:  { regex: /^\d+$/,            minLen: 5, example: '1023456789',    hint: 'Solo números',                  inputMode: 'numeric' },
  CE:  { regex: /^\d+$/,            minLen: 5, example: '500123456',     hint: 'Solo números',                  inputMode: 'numeric' },
  PA:  { regex: /^[A-Za-z0-9]+$/,   minLen: 5, example: 'AN1234567',     hint: 'Letras y números (sin espacios)', inputMode: 'text' },
  NIT: { regex: /^\d+(-\d)?$/,      minLen: 9, example: '900.123.456-7', hint: 'Solo números, opcional dígito de verificación tras "-"', inputMode: 'text' },
};

export function CustomerForm({ open, totalAmount, isProcessing, onCancel, onSubmit, customers = [] }: CustomerFormProps) {
  const [fullName, setFullName] = useState("");
  const [idType, setIdType] = useState<IdType>('CC');
  const [idNumber, setIdNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  // Match contra customers ya registrados (autocompletar)
  const [matched, setMatched] = useState<CustomerRecord | null>(null);

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(n);

  // Construye un índice rápido por key para lookups O(1)
  const customersByKey = React.useMemo(() => {
    const map = new Map<string, CustomerRecord>();
    for (const c of customers) map.set(c.id, c);
    return map;
  }, [customers]);

  // Busca cliente cada vez que cambie tipo o número (mínimo 4 chars)
  React.useEffect(() => {
    if (!open) return;
    const cleaned = idNumber.trim();
    if (cleaned.length < 4) {
      setMatched(null);
      return;
    }
    const key = buildCustomerKey(idType, cleaned);
    const found = customersByKey.get(key);
    if (found) {
      setMatched(found);
    } else {
      setMatched(null);
    }
  }, [idType, idNumber, customersByKey, open]);

  // Aplicar datos del cliente encontrado a los inputs vacíos
  const applyMatched = () => {
    if (!matched) return;
    setFullName(matched.fullName);
    if (matched.phone) setPhone(matched.phone);
    if (matched.email) setEmail(matched.email);
    if (matched.address) setAddress(matched.address);
  };

  // Auto-aplicar si los campos están vacíos (no machacar lo que ya escribió)
  React.useEffect(() => {
    if (matched && !fullName && !phone && !email && !address) {
      applyMatched();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matched]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    const docLabel = ID_TYPE_LABELS[idType];

    if (!fullName.trim()) {
      newErrors.fullName = idType === 'NIT' ? "La razón social es obligatoria" : "El nombre es obligatorio";
    } else if (fullName.trim().length < 3) {
      newErrors.fullName = "Mínimo 3 caracteres";
    }

    const rule = ID_RULES[idType];
    const cleaned = idNumber.trim();
    if (!cleaned) {
      newErrors.idNumber = `${docLabel} es obligatorio`;
    } else if (!rule.regex.test(cleaned)) {
      newErrors.idNumber = `Formato inválido — ${rule.hint.toLowerCase()}`;
    } else if (cleaned.replace(/\D/g, '').length < rule.minLen) {
      newErrors.idNumber = `Mínimo ${rule.minLen} caracteres`;
    }

    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = "Formato de email inválido";
    }

    if (phone.trim() && !/^[\d\s+\-()]+$/.test(phone.trim())) {
      newErrors.phone = "Teléfono inválido";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const customer: Customer = {
      fullName: fullName.trim(),
      idType,
      idNumber: idNumber.trim(),
      phone: phone.trim() || undefined,
      address: address.trim() || undefined,
      email: email.trim() || undefined,
    };
    onSubmit(customer);
  };

  const handleReset = () => {
    setFullName("");
    setIdType('CC');
    setIdNumber("");
    setPhone("");
    setAddress("");
    setEmail("");
    setErrors({});
    setMatched(null);
  };

  // Limpia el campo según el tipo: CC/CE dejan solo dígitos, NIT acepta dígitos + un guión
  const handleIdNumberChange = (raw: string) => {
    if (idType === 'CC' || idType === 'CE') {
      setIdNumber(raw.replace(/\D/g, ''));
    } else if (idType === 'NIT') {
      // Permite dígitos y un guion para el dígito de verificación
      setIdNumber(raw.replace(/[^\d-]/g, ''));
    } else {
      // Pasaporte: alfanumérico, mayúsculas por convención
      setIdNumber(raw.replace(/[^A-Za-z0-9]/g, '').toUpperCase());
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen && !isProcessing) {
          handleReset();
          onCancel();
        }
      }}
    >
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Datos para la facturación</DialogTitle>
          <DialogDescription>
            Total a pagar: <span className="font-bold text-indigo-600">{formatCurrency(totalAmount)}</span>
          </DialogDescription>
        </DialogHeader>

        {matched && (
          <div className="bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-200 rounded-2xl p-3 flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-violet-600 flex items-center justify-center flex-shrink-0">
              <Sparkles size={16} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-violet-900">
                Cliente conocido — {matched.totalPurchases} compra{matched.totalPurchases !== 1 ? 's' : ''} previa{matched.totalPurchases !== 1 ? 's' : ''}
              </p>
              <p className="text-[11px] text-violet-700 leading-relaxed mt-0.5">
                Última compra {timeAgo(matched.lastPurchaseAt)} · Total histórico {formatCurrency(matched.totalSpent)}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={applyMatched}
              className="text-violet-700 hover:bg-violet-100 h-7 text-[11px] font-bold"
              title="Rellenar nombre, teléfono y email con los datos guardados"
            >
              Autocompletar
            </Button>
          </div>
        )}

        <div className="grid gap-4 py-4">
          {/* Nombre / Razón social */}
          <div className="space-y-2">
            <Label htmlFor="fullName">
              {idType === 'NIT' ? 'Razón social' : 'Nombre completo'} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={idType === 'NIT' ? 'Ej: Comercializadora ABC S.A.S.' : 'Ej: Juan Pérez García'}
              disabled={isProcessing}
              autoFocus
            />
            {errors.fullName && <p className="text-xs text-red-500">{errors.fullName}</p>}
          </div>

          {/* Tipo de documento + número */}
          <div className="grid grid-cols-[150px_1fr] gap-3">
            <div className="space-y-2">
              <Label htmlFor="idType">Tipo <span className="text-red-500">*</span></Label>
              <Select
                value={idType}
                onValueChange={(v) => {
                  setIdType(v as IdType);
                  setIdNumber(""); // limpia el número para evitar formatos cruzados
                  setErrors(prev => ({ ...prev, idNumber: '' }));
                }}
                disabled={isProcessing}
              >
                <SelectTrigger id="idType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CC">C.C. — Cédula</SelectItem>
                  <SelectItem value="CE">C.E. — Cédula Extranjería</SelectItem>
                  <SelectItem value="PA">Pasaporte</SelectItem>
                  <SelectItem value="NIT">NIT — Empresa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="idNumber">
                Número <span className="text-red-500">*</span>
              </Label>
              <Input
                id="idNumber"
                value={idNumber}
                onChange={(e) => handleIdNumberChange(e.target.value)}
                placeholder={`Ej: ${ID_RULES[idType].example}`}
                inputMode={ID_RULES[idType].inputMode}
                disabled={isProcessing}
              />
              {errors.idNumber
                ? <p className="text-xs text-red-500">{errors.idNumber}</p>
                : <p className="text-[10px] text-slate-400">{ID_RULES[idType].hint}</p>}
            </div>
          </div>

          {/* Teléfono y Email en fila */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ej: 3001234567"
                disabled={isProcessing}
              />
              {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="cliente@correo.com"
                disabled={isProcessing}
              />
              {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
            </div>
          </div>

          {/* Dirección */}
          <div className="space-y-2">
            <Label htmlFor="address">Dirección</Label>
            <Textarea
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Ej: Calle 123 #45-67, Bogotá"
              rows={2}
              disabled={isProcessing}
            />
          </div>

          <p className="text-xs text-slate-500">
            Los campos marcados con <span className="text-red-500">*</span> son obligatorios.
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onCancel} disabled={isProcessing}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isProcessing}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Procesando...
              </>
            ) : (
              "Continuar al Pago →"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}