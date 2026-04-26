import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Download, Mail, MailX, X } from "lucide-react";

interface SaleConfirmationDialogProps {
  open: boolean;
  invoiceNumber: string;
  customerName: string;
  customerEmail?: string;
  emailSent: boolean;
  emailMessage: string;
  onDownload: () => void;
  onClose: () => void;
}

/**
 * Modal de confirmación final.
 * Muestra el estado de la venta y deja al usuario:
 *   - Descargar el PDF
 *   - Cerrar sin descargar
 */
export function SaleConfirmationDialog({
  open,
  invoiceNumber,
  customerName,
  customerEmail,
  emailSent,
  emailMessage,
  onDownload,
  onClose,
}: SaleConfirmationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mx-auto mb-3">
            <CheckCircle2 className="w-9 h-9 text-emerald-600" />
          </div>
          <DialogTitle className="text-center text-xl">¡Venta registrada!</DialogTitle>
          <DialogDescription className="text-center">
            La factura <span className="font-semibold text-slate-900">{invoiceNumber}</span> a nombre de{" "}
            <span className="font-semibold text-slate-900">{customerName}</span> se generó correctamente.
          </DialogDescription>
        </DialogHeader>

        {/* Estado del envío de email */}
        <div className="my-4 p-4 rounded-lg bg-slate-50 border border-slate-200">
          {customerEmail ? (
            emailSent ? (
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">Factura enviada por correo</p>
                  <p className="text-xs text-slate-500 mt-0.5">{emailMessage}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <MailX className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">No se pudo enviar el correo</p>
                  <p className="text-xs text-slate-500 mt-0.5">{emailMessage}</p>
                </div>
              </div>
            )
          ) : (
            <div className="flex items-start gap-3">
              <MailX className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900">Sin envío por correo</p>
                <p className="text-xs text-slate-500 mt-0.5">El cliente no proporcionó email.</p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={onClose}>
            <X className="w-4 h-4 mr-2" />
            No descargar PDF
          </Button>
          <Button onClick={onDownload} className="bg-indigo-600 hover:bg-indigo-700 text-white">
            <Download className="w-4 h-4 mr-2" />
            Descargar PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}