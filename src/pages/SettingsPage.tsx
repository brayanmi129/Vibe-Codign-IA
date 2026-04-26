import * as React from "react";
import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShieldCheck, RefreshCw, Palette } from "lucide-react";
import { Store } from "@/types";

interface SettingsPageProps {
  currentStore: Store;
  setCurrentStore: React.Dispatch<React.SetStateAction<Store | null>>;
  tempBranding: any;
  setTempBranding: React.Dispatch<React.SetStateAction<any>>;
  isSavingSettings: boolean;
  handleSaveSettings: (e: React.FormEvent) => void;
}

interface ColorFieldProps {
  label: string;
  color: string;
  onChange: (hex: string) => void;
}

function ColorField({ label, color, onChange }: ColorFieldProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-semibold text-slate-700">{label}</p>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="w-full h-16 rounded-2xl border-4 border-white ring-1 ring-slate-200 shadow-md hover:ring-indigo-300 hover:scale-[1.02] transition-all cursor-pointer"
        style={{ backgroundColor: color }}
        title="Clic para cambiar color"
      />
      <input
        ref={inputRef}
        type="color"
        value={color}
        onChange={e => onChange(e.target.value)}
        className="sr-only"
      />
      <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
        <span className="font-mono text-xs text-slate-500 flex-1">{color.toUpperCase()}</span>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="text-[10px] text-indigo-500 hover:text-indigo-700 font-semibold"
        >
          Cambiar
        </button>
      </div>
    </div>
  );
}

export function SettingsPage({
  currentStore, setCurrentStore, tempBranding, setTempBranding, isSavingSettings, handleSaveSettings,
}: SettingsPageProps) {
  return (
    <motion.div
      key="settings"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="space-y-8"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50 border-b border-slate-100">
              <CardTitle className="text-lg">Información General</CardTitle>
              <CardDescription>Detalles básicos de tu tienda.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label>Nombre de la Tienda</Label>
                <Input
                  value={currentStore?.name}
                  onChange={e => setCurrentStore(prev => prev ? ({ ...prev, name: e.target.value }) : null)}
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo de Negocio</Label>
                <Select
                  value={currentStore?.businessType}
                  onValueChange={val => setCurrentStore(prev => prev ? ({ ...prev, businessType: val }) : null)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tech">Tecnología</SelectItem>
                    <SelectItem value="fashion">Moda</SelectItem>
                    <SelectItem value="food">Alimentos</SelectItem>
                    <SelectItem value="health">Salud</SelectItem>
                    <SelectItem value="other">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>ID de Tienda</Label>
                <Input value={currentStore?.id} disabled className="bg-slate-50 font-mono text-xs" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-indigo-600 text-white border-none shadow-lg shadow-indigo-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck size={20} />
                Acceso de Administrador
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-indigo-100">
                Como administrador, tienes control total sobre la configuración visual y los miembros del equipo.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Right column — branding */}
        <div className="lg:col-span-2">
          <Card className="bg-white border-slate-200 shadow-sm overflow-hidden h-full flex flex-col">
            <CardHeader className="bg-slate-50 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="bg-indigo-100 p-1.5 rounded-lg">
                  <Palette className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Personalización de Marca</CardTitle>
                  <CardDescription>Define los colores que identifican tu negocio.</CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6 flex-1 space-y-8">
              {/* Color pickers — 3 columns */}
              <div className="grid grid-cols-3 gap-4">
                <ColorField
                  label="Color Principal"
                  color={tempBranding?.primaryColor || "#4F46E5"}
                  onChange={hex => setTempBranding((prev: any) => ({ ...prev, primaryColor: hex }))}
                />
                <ColorField
                  label="Color Secundario"
                  color={tempBranding?.secondaryColor || "#818CF8"}
                  onChange={hex => setTempBranding((prev: any) => ({ ...prev, secondaryColor: hex }))}
                />
                <ColorField
                  label="Color de Fondo"
                  color={tempBranding?.backgroundColor || "#F8FAFC"}
                  onChange={hex => setTempBranding((prev: any) => ({ ...prev, backgroundColor: hex }))}
                />
              </div>

              {/* Live preview */}
              <div className="space-y-3">
                <p className="text-sm font-semibold text-slate-700">Vista Previa</p>
                <div
                  className="w-full rounded-2xl border border-slate-200 shadow-inner p-5 flex flex-col gap-4 transition-all duration-300"
                  style={{ backgroundColor: tempBranding?.backgroundColor }}
                >
                  {/* Mock navbar */}
                  <div className="flex items-center justify-between bg-white shadow-sm px-4 py-2.5 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg" style={{ backgroundColor: tempBranding?.primaryColor }} />
                      <div className="space-y-1">
                        <div className="w-20 h-2 rounded-full bg-slate-100" />
                        <div className="w-12 h-1.5 rounded-full bg-slate-50" />
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-slate-100" />
                  </div>

                  {/* Mock cards row */}
                  <div className="grid grid-cols-3 gap-3">
                    {[tempBranding?.primaryColor, tempBranding?.secondaryColor, tempBranding?.primaryColor].map((c, i) => (
                      <div key={i} className="bg-white rounded-xl p-3 shadow-sm flex flex-col gap-2 border border-slate-50">
                        <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: `${c}25` }}>
                          <div className="w-4 h-4 rounded-md m-2" style={{ backgroundColor: c }} />
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-50" />
                        <div className="w-2/3 h-3 rounded-full" style={{ backgroundColor: c }} />
                      </div>
                    ))}
                  </div>

                  {/* Mock button */}
                  <div
                    className="w-full rounded-xl h-9 flex items-center justify-center font-bold text-xs text-white shadow"
                    style={{ backgroundColor: tempBranding?.primaryColor }}
                  >
                    Botón de Ejemplo
                  </div>
                </div>
              </div>

              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 leading-relaxed">
                Tip: Los colores se aplican automáticamente a botones, iconos activos y fondos en toda la interfaz.
              </p>
            </CardContent>

            <CardFooter className="bg-slate-50 border-t border-slate-100 p-5 flex justify-end">
              <Button
                onClick={handleSaveSettings}
                disabled={isSavingSettings}
                className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[180px] h-11 shadow-md shadow-indigo-100 rounded-xl"
              >
                {isSavingSettings ? (
                  <div className="flex items-center gap-2">
                    <RefreshCw className="animate-spin w-4 h-4" />
                    Guardando...
                  </div>
                ) : "Guardar Cambios"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
