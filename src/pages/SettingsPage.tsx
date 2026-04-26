import * as React from "react";
import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ShieldCheck, RefreshCw, Palette, Upload, ImageIcon, ChevronDown, ChevronUp, BrainCircuit, Building2, Sparkles } from "lucide-react";
import { TempStoreSettings } from "@/types";
import { suggestBrandColors } from "@/lib/inventoryService";
import { getContrastColor } from "@/lib/utils";
import { COLOR_PRESETS, FONT_PRESETS } from "@/constants";

interface SettingsPageProps {
  storeId: string;
  tempSettings: TempStoreSettings;
  setTempSettings: React.Dispatch<React.SetStateAction<TempStoreSettings>>;
  isUploadingLogo: boolean;
  onLogoFileSelect: (file: File) => void;
  isSavingSettings: boolean;
  handleSaveSettings: () => void;
}

// ── Color swatch picker ───────────────────────────────────────────────────────
function ColorField({ label, color, onChange }: { label: string; color: string; onChange: (hex: string) => void }) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold text-slate-600">{label}</p>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="w-full h-12 rounded-xl border-4 border-white ring-1 ring-slate-200 shadow hover:ring-indigo-300 hover:scale-[1.03] transition-all cursor-pointer"
        style={{ backgroundColor: color }}
      />
      <input ref={inputRef} type="color" value={color} onChange={e => onChange(e.target.value)} className="sr-only" />
      <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5">
        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
        <span className="font-mono text-[10px] text-slate-500 flex-1">{color.toUpperCase()}</span>
        <button type="button" onClick={() => inputRef.current?.click()} className="text-[10px] text-indigo-500 hover:text-indigo-700 font-semibold">·</button>
      </div>
    </div>
  );
}

// ── Logo upload zone ──────────────────────────────────────────────────────────
function LogoUploadZone({
  logoUrl, isUploading, onFileSelect,
}: {
  logoUrl: string; isUploading: boolean; onFileSelect: (file: File) => void;
}) {
  const [isDragging, setIsDragging] = React.useState(false);
  const [localPreview, setLocalPreview] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setLocalPreview(URL.createObjectURL(file));
    onFileSelect(file);
  };

  const displayed = localPreview || logoUrl;

  return (
    <div className="space-y-2">
      <Label className="text-xs font-semibold text-slate-600">Logo de la Tienda</Label>
      <div
        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={e => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
        onClick={() => fileInputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed cursor-pointer transition-all h-36 ${
          isDragging ? "border-indigo-400 bg-indigo-50" : "border-slate-200 bg-slate-50 hover:border-indigo-300 hover:bg-indigo-50/50"
        }`}
      >
        {isUploading ? (
          <div className="flex flex-col items-center gap-2 text-slate-400">
            <RefreshCw className="animate-spin w-6 h-6 text-indigo-500" />
            <p className="text-xs">Subiendo logo...</p>
          </div>
        ) : displayed ? (
          <>
            <img src={displayed} alt="Logo" className="h-24 w-auto max-w-[80%] object-contain rounded-lg" />
            <span className="text-[10px] text-slate-400 absolute bottom-2">Clic o arrastra para cambiar</span>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 text-slate-400">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
              <ImageIcon size={24} className="text-slate-300" />
            </div>
            <div className="text-center">
              <p className="text-xs font-semibold text-slate-500">Arrastra tu logo aquí</p>
              <p className="text-[10px] text-slate-400">o haz clic para seleccionar</p>
            </div>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
      </div>
      {displayed && !isUploading && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          className="w-full text-xs text-slate-400 hover:text-indigo-600 gap-1.5"
        >
          <Upload size={12} /> Cambiar imagen
        </Button>
      )}
    </div>
  );
}

export function SettingsPage({
  storeId, tempSettings, setTempSettings,
  isUploadingLogo, onLogoFileSelect, isSavingSettings, handleSaveSettings,
}: SettingsPageProps) {
  const [fiscalExpanded, setFiscalExpanded] = React.useState(false);
  const [isGeneratingColors, setIsGeneratingColors] = React.useState(false);

  const handleAISuggestColors = async () => {
    setIsGeneratingColors(true);
    try {
      const suggestion = await suggestBrandColors(tempSettings.description, tempSettings.businessType);
      if (suggestion) {
        setTempSettings(prev => ({ ...prev, branding: { ...prev.branding, ...suggestion } }));
      }
    } finally {
      setIsGeneratingColors(false);
    }
  };

  const set = (key: keyof TempStoreSettings, value: string) =>
    setTempSettings(prev => ({ ...prev, [key]: value }));

  const setBranding = (key: keyof TempStoreSettings["branding"], value: string) =>
    setTempSettings(prev => ({ ...prev, branding: { ...prev.branding, [key]: value } }));

  const { branding } = tempSettings;
  const preview = branding;

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
              <CardTitle className="text-base">Información de Tienda</CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">ID del Tenant</p>
                <p className="font-mono text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 truncate">{storeId}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Tipo de negocio</p>
                <p className="text-sm text-slate-700 capitalize">{tempSettings.businessType || "—"}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-indigo-600 text-white border-none shadow-lg shadow-indigo-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck size={18} />
                Acceso Administrador
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-indigo-100 leading-relaxed">
                Tienes control total sobre la identidad visual, la configuración del asistente IA y los datos fiscales de esta tienda.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="lg:col-span-2">
          <Card className="bg-white border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <CardContent className="p-6 space-y-8 flex-1">

              {/* ── 1. Identidad visual ───────────────────────────────── */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="bg-indigo-50 p-1.5 rounded-lg"><Palette className="w-4 h-4 text-indigo-600" /></div>
                  <h4 className="font-semibold text-slate-800">Identidad Visual</h4>
                </div>

                <LogoUploadZone
                  logoUrl={tempSettings.logoUrl}
                  isUploading={isUploadingLogo}
                  onFileSelect={onLogoFileSelect}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-600">Nombre de la Tienda</Label>
                    <Input
                      value={tempSettings.name}
                      onChange={e => set("name", e.target.value)}
                      placeholder="Mi Tienda"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-600">Tipo de Negocio</Label>
                    <Select value={tempSettings.businessType} onValueChange={v => set("businessType", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tech">Tecnología</SelectItem>
                        <SelectItem value="fashion">Moda</SelectItem>
                        <SelectItem value="food">Alimentos</SelectItem>
                        <SelectItem value="health">Salud</SelectItem>
                        <SelectItem value="other">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              {/* ── 2. Colores ────────────────────────────────────────── */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="bg-indigo-50 p-1.5 rounded-lg"><Palette className="w-4 h-4 text-indigo-600" /></div>
                    <h4 className="font-semibold text-slate-800">Colores de Marca</h4>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAISuggestColors}
                    disabled={isGeneratingColors}
                    className="gap-1.5 text-indigo-600 border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 text-xs h-8"
                  >
                    {isGeneratingColors
                      ? <><RefreshCw size={12} className="animate-spin" />Generando...</>
                      : <><Sparkles size={12} />Sugerir con IA</>}
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Presets and custom pickers */}
                  <div className="space-y-6">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">Estilos Predeterminados</p>
                      <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                        {COLOR_PRESETS.map((p) => (
                          <button
                            key={p.name}
                            type="button"
                            onClick={() => {
                              setBranding("primaryColor", p.primaryColor);
                              setBranding("secondaryColor", p.secondaryColor);
                              setBranding("backgroundColor", p.backgroundColor);
                              setBranding("textColor", p.textColor);
                              setBranding("textSecondaryColor", p.textSecondaryColor);
                              if (p.textAccentColor) setBranding("textAccentColor", p.textAccentColor);
                            }}
                            className={`w-full aspect-square rounded-lg border-2 transition-all hover:scale-110 active:scale-95 shadow-sm overflow-hidden flex flex-col ${
                              branding.primaryColor === p.primaryColor ? "border-indigo-500 ring-2 ring-indigo-200" : "border-slate-200"
                            }`}
                            title={p.name}
                          >
                            <div className="flex-1 w-full" style={{ backgroundColor: p.primaryColor }} />
                            <div className="h-1.5 w-full" style={{ backgroundColor: p.secondaryColor }} />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Personalización Manual</p>
                      <div className="grid grid-cols-3 gap-3">
                        <ColorField label="Principal" color={branding.primaryColor} onChange={v => setBranding("primaryColor", v)} />
                        <ColorField label="Secundario" color={branding.secondaryColor} onChange={v => setBranding("secondaryColor", v)} />
                        <ColorField label="Fondo" color={branding.backgroundColor} onChange={v => setBranding("backgroundColor", v)} />
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Tipografía</p>
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <ColorField label="Color principal" color={branding.textColor} onChange={v => setBranding("textColor", v)} />
                        <ColorField label="Color secundario" color={branding.textSecondaryColor} onChange={v => setBranding("textSecondaryColor", v)} />
                      </div>
                      <div className="mb-4">
                        <ColorField label="Color de destaque" color={branding.textAccentColor || branding.primaryColor} onChange={v => setBranding("textAccentColor", v)} />
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Estilo de letra (Fuente)</p>
                        <Select
                          value={branding.fontFamily || FONT_PRESETS[0].value}
                          onValueChange={(val) => setBranding("fontFamily", val)}
                        >
                          <SelectTrigger className="w-full bg-slate-50 border-slate-200 h-9 text-xs">
                            <SelectValue placeholder="Selecciona una fuente" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[250px]">
                            {FONT_PRESETS.map(font => (
                              <SelectItem 
                                key={font.value} 
                                value={font.value}
                                style={{ fontFamily: font.value }}
                              >
                                {font.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Live preview */}
                  <div
                    className="rounded-2xl border border-slate-200 p-5 flex flex-col gap-4 transition-all duration-300 shadow-xl"
                    style={{ 
                      backgroundColor: preview.backgroundColor,
                      fontFamily: preview.fontFamily || 'inherit'
                    }}
                  >
                    <div className="flex justify-between items-center">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: preview.textSecondaryColor }}>Panel de Control</p>
                      <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${getContrastColor(preview.backgroundColor) === 'white' ? 'bg-white/10 text-white/60' : 'bg-black/5 text-black/40'}`}>
                        Contraste OK
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: preview.textSecondaryColor }}>VENTAS TOTALES</p>
                      <h3 className="text-2xl font-black tracking-tight" style={{ color: preview.textColor }}>$1.240.000</h3>
                      <p className="text-[11px] font-bold flex items-center gap-1" style={{ color: preview.textAccentColor || preview.primaryColor }}>
                        <Sparkles size={10} /> +12% esta semana
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      {[1, 2].map(i => (
                        <div key={i} className="rounded-2xl p-3 border border-slate-100 flex flex-col gap-2 bg-white/50 backdrop-blur-sm">
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: i === 1 ? preview.primaryColor + '15' : preview.secondaryColor + '15' }}>
                            <div className="w-4 h-4 rounded-md" style={{ backgroundColor: i === 1 ? preview.primaryColor : preview.secondaryColor }} />
                          </div>
                          <div className="w-full h-1 rounded-full bg-slate-100" />
                          <div className="w-2/3 h-2 rounded-full" style={{ backgroundColor: preview.textSecondaryColor + '40' }} />
                        </div>
                      ))}
                    </div>

                    <div 
                      className="rounded-xl h-10 flex items-center justify-center text-xs font-black shadow-lg transition-all transform hover:scale-[1.02] cursor-default" 
                      style={{ 
                        backgroundColor: preview.primaryColor,
                        color: getContrastColor(preview.primaryColor) === "white" ? "#ffffff" : "#0f172a"
                      }}
                    >
                      Botón Principal
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* ── 3. Asistente IA ───────────────────────────────────── */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="bg-indigo-50 p-1.5 rounded-lg"><BrainCircuit className="w-4 h-4 text-indigo-600" /></div>
                  <div>
                    <h4 className="font-semibold text-slate-800">Asistente IA</h4>
                    <p className="text-xs text-slate-400">Esta descripción personaliza las respuestas del asistente.</p>
                  </div>
                </div>
                <Textarea
                  value={tempSettings.description}
                  onChange={e => set("description", e.target.value)}
                  placeholder="Ej: Somos una tienda de electrónica en Bogotá, Colombia. Vendemos celulares, accesorios y garantías. Nuestros clientes principales son jóvenes entre 18-35 años..."
                  className="resize-none min-h-[100px] text-sm bg-slate-50"
                  rows={4}
                />
              </div>

              <Separator />

              {/* ── 4. Información fiscal (colapsable) ───────────────── */}
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => setFiscalExpanded(v => !v)}
                  className="w-full flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2">
                    <div className="bg-slate-100 p-1.5 rounded-lg group-hover:bg-indigo-50 transition-colors">
                      <Building2 className="w-4 h-4 text-slate-500 group-hover:text-indigo-600 transition-colors" />
                    </div>
                    <div className="text-left">
                      <h4 className="font-semibold text-slate-800">Información Fiscal</h4>
                      <p className="text-xs text-slate-400">Datos para facturas y documentos legales.</p>
                    </div>
                  </div>
                  {fiscalExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                </button>

                {fiscalExpanded && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-600">Razón Social</Label>
                      <Input value={tempSettings.legalName} onChange={e => set("legalName", e.target.value)} placeholder="Empresa S.A.S." />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-600">NIT / RUT</Label>
                      <Input value={tempSettings.nit} onChange={e => set("nit", e.target.value)} placeholder="900.123.456-7" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-600">Dirección Fiscal</Label>
                      <Input value={tempSettings.fiscalAddress} onChange={e => set("fiscalAddress", e.target.value)} placeholder="Cra 1 #23-45, Bogotá" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-600">Teléfono Fiscal</Label>
                      <Input value={tempSettings.fiscalPhone} onChange={e => set("fiscalPhone", e.target.value)} placeholder="+57 300 000 0000" />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>

            <CardFooter className="bg-slate-50 border-t border-slate-100 p-5 flex items-center justify-between">
              <p className="text-xs text-slate-400">Los cambios se aplican globalmente a toda la tienda.</p>
              <Button
                onClick={handleSaveSettings}
                disabled={isSavingSettings || isUploadingLogo}
                className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[160px] h-10 shadow-md shadow-indigo-100 rounded-xl"
              >
                {isSavingSettings ? (
                  <span className="flex items-center gap-2"><RefreshCw className="animate-spin w-4 h-4" />Guardando...</span>
                ) : "Guardar Cambios"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
