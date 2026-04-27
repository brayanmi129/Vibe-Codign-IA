import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Customer } from "../types";
import { Loader2 } from "lucide-react";

interface CustomerFormProps {
  open: boolean;
  totalAmount: number;
  isProcessing: boolean;
  onCancel: () => void;
  onSubmit: (customer: Customer) => void;
}

/**
 * Modal con el formulario de datos del cliente para la facturación.
 * Validaciones:
 *  - Nombre completo: obligatorio, mínimo 3 caracteres.
 *  - Cédula: obligatoria, solo números, mínimo 5 dígitos.
 *  - Email: opcional, pero si se ingresa debe tener formato válido.
 */
export function CustomerForm({ open, totalAmount, isProcessing, onCancel, onSubmit }: CustomerFormProps) {
  const [fullName, setFullName] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(n);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!fullName.trim()) {
      newErrors.fullName = "El nombre es obligatorio";
    } else if (fullName.trim().length < 3) {
      newErrors.fullName = "Mínimo 3 caracteres";
    }

    if (!idNumber.trim()) {
      newErrors.idNumber = "La cédula es obligatoria";
    } else if (!/^\d+$/.test(idNumber.trim())) {
      newErrors.idNumber = "La cédula debe contener solo números";
    } else if (idNumber.trim().length < 5) {
      newErrors.idNumber = "Cédula inválida";
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
      idNumber: idNumber.trim(),
      phone: phone.trim() || undefined,
      address: address.trim() || undefined,
      email: email.trim() || undefined,
    };
    onSubmit(customer);
  };

  const handleReset = () => {
    setFullName("");
    setIdNumber("");
    setPhone("");
    setAddress("");
    setEmail("");
    setErrors({});
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

        <div className="grid gap-4 py-4">
          {/* Nombre completo */}
          <div className="space-y-2">
            <Label htmlFor="fullName">
              Nombre completo <span className="text-red-500">*</span>
            </Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ej: Juan Pérez García"
              disabled={isProcessing}
              autoFocus
            />
            {errors.fullName && <p className="text-xs text-red-500">{errors.fullName}</p>}
          </div>

          {/* Cédula */}
          <div className="space-y-2">
            <Label htmlFor="idNumber">
              Cédula <span className="text-red-500">*</span>
            </Label>
            <Input
              id="idNumber"
              value={idNumber}
              onChange={(e) => setIdNumber(e.target.value.replace(/\D/g, ""))}
              placeholder="Ej: 1023456789"
              inputMode="numeric"
              disabled={isProcessing}
            />
            {errors.idNumber && <p className="text-xs text-red-500">{errors.idNumber}</p>}
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
              "Terminar la Venta"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}