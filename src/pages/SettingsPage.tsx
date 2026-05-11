import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  ShieldCheck, RefreshCw, Palette, Upload, ImageIcon, BrainCircuit, Building2,
  Sparkles, Lock, Eye, EyeOff, ChevronRight, ArrowLeft, Store as StoreIcon,
} from "lucide-react";
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
  user: any;
  onChangePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

type Section = null | 'security' | 'branding' | 'business' | 'fiscal';

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

// ── Tarjeta del hub principal ──────────────────────────────────────────────
function HubTile({
  icon, title, description, accent, onClick,
}: {
  icon: React.ReactNode; title: string; description: string; accent: string; onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group text-left bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-100/40 rounded-3xl p-6 transition-all hover:-translate-y-0.5 flex items-start gap-4"
    >
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${accent}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-bold text-slate-800 group-hover:text-indigo-700 transition-colors">{title}</h3>
          <ChevronRight size={16} className="text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
        </div>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">{description}</p>
      </div>
    </button>
  );
}

export function SettingsPage({
  storeId, tempSettings, setTempSettings,
  isUploadingLogo, onLogoFileSelect, isSavingSettings, handleSaveSettings,
  user, onChangePassword,
}: SettingsPageProps) {
  const [section, setSection] = React.useState<Section>(null);
  const [isGeneratingColors, setIsGeneratingColors] = React.useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [showCurrent, setShowCurrent] = React.useState(false);
  const [showNew, setShowNew] = React.useState(false);
  const [isChangingPassword, setIsChangingPassword] = React.useState(false);
  const [passwordError, setPasswordError] = React.useState('');
  const [passwordSuccess, setPasswordSuccess] = React.useState(false);

  const isGoogleOnly = React.useMemo(() =>
    user?.providerData?.length > 0 &&
    user.providerData.every((p: any) => p.providerId === 'google.com'),
    [user]
  );

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);
    if (newPassword.length < 6) { setPasswordError('La nueva contraseña debe tener al menos 6 caracteres.'); return; }
    if (newPassword !== confirmPassword) { setPasswordError('Las contraseñas no coinciden.'); return; }
    setIsChangingPassword(true);
    try {
      await onChangePassword(currentPassword, newPassword);
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      const code = err?.message ? JSON.parse(err.message)?.error : err?.code;
      if (code?.includes('wrong-password') || code?.includes('invalid-credential')) {
        setPasswordError('La contraseña actual es incorrecta.');
      } else if (code?.includes('too-many-requests')) {
        setPasswordError('Demasiados intentos. Espera unos minutos.');
      } else {
        setPasswordError('Error al cambiar la contraseña. Intenta de nuevo.');
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

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

  // Las secciones que modifican datos guardables muestran el botón Guardar.
  // Seguridad tiene su propio botón (cambio de contraseña), no requiere Guardar global.
  const sectionsNeedingSave: Section[] = ['branding', 'business', 'fiscal'];
  const showSaveBar = sectionsNeedingSave.includes(section);

  const sectionTitles: Record<Exclude<Section, null>, string> = {
    security: 'Privacidad y Seguridad',
    branding: 'Personalización Visual',
    business: 'Información del Negocio',
    fiscal: 'Información Fiscal',
  };

  return (
    <motion.div
      key="settings"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="space-y-6"
    >
      <AnimatePresence mode="wait">
        {section === null ? (
          // ─── HUB PRINCIPAL ────────────────────────────────────────────────
          <motion.div
            key="hub"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Ajustes</h2>
              <p className="text-sm text-slate-500 mt-1">Elige una categoría para personalizar tu tienda.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
              <HubTile
                icon={<Lock size={22} className="text-rose-600" />}
                accent="bg-rose-50"
                title="Privacidad y Seguridad"
                description="Cambia tu contraseña y revisa cómo accedes a tu cuenta."
                onClick={() => setSection('security')}
              />
              <HubTile
                icon={<Palette size={22} className="text-violet-600" />}
                accent="bg-violet-50"
                title="Personalización Visual"
                description="Colores, logo y tipografía de tu marca."
                onClick={() => setSection('branding')}
              />
              <HubTile
                icon={<StoreIcon size={22} className="text-emerald-600" />}
                accent="bg-emerald-50"
                title="Información del Negocio"
                description="Nombre de la tienda, tipo y contexto para el asistente IA."
                onClick={() => setSection('business')}
              />
              <HubTile
                icon={<Building2 size={22} className="text-amber-600" />}
                accent="bg-amber-50"
                title="Información Fiscal"
                description="Razón social, NIT y datos legales para tus facturas."
                onClick={() => setSection('fiscal')}
              />
            </div>

            <Card className="bg-slate-50 border-slate-200 max-w-4xl">
              <CardContent className="p-4 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-600 uppercase tracking-wider text-[10px]">ID de Tienda</p>
                  <p className="font-mono text-slate-500 mt-0.5 truncate">{storeId}</p>
                </div>
                <ShieldCheck size={20} className="text-slate-300" />
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          // ─── VISTA DE SECCIÓN ─────────────────────────────────────────────
          <motion.div
            key={section}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="space-y-6 max-w-4xl"
          >
            {/* Header con botón volver */}
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setSection(null)}
                className="gap-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 -ml-2"
              >
                <ArrowLeft size={16} />
                Volver
              </Button>
              <div className="h-5 w-px bg-slate-200" />
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                {sectionTitles[section]}
              </h2>
            </div>

            {/* ── Seguridad ─────────────────────────────────────────────── */}
            {section === 'security' && (
              <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
                <CardHeader className="bg-slate-50 border-b border-slate-100">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Lock size={16} className="text-rose-500" />
                    Cambiar contraseña
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {isGoogleOnly ? (
                    <div className="flex flex-col items-center gap-3 py-6 text-center">
                      <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center">
                        <img src="https://www.google.com/favicon.ico" className="w-7 h-7" alt="Google" />
                      </div>
                      <div className="max-w-xs">
                        <p className="text-sm font-semibold text-slate-700">Cuenta vinculada a Google</p>
                        <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                          Tu cuenta usa autenticación de Google. La contraseña se gestiona desde tu cuenta de Google y no puede cambiarse aquí.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
                      {passwordSuccess && (
                        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl px-3 py-2.5 text-sm">
                          <ShieldCheck size={14} /> Contraseña actualizada correctamente.
                        </div>
                      )}
                      {passwordError && (
                        <div className="bg-rose-50 border border-rose-100 text-rose-600 rounded-xl px-3 py-2.5 text-xs">
                          {passwordError}
                        </div>
                      )}
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-600">Contraseña actual</Label>
                        <div className="relative">
                          <Input
                            type={showCurrent ? 'text' : 'password'}
                            placeholder="••••••••"
                            value={currentPassword}
                            onChange={e => setCurrentPassword(e.target.value)}
                            className="pr-10 h-10"
                            required
                          />
                          <button type="button" onClick={() => setShowCurrent(v => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                            {showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-600">Nueva contraseña</Label>
                        <div className="relative">
                          <Input
                            type={showNew ? 'text' : 'password'}
                            placeholder="Mín. 6 caracteres"
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            className="pr-10 h-10"
                            required
                          />
                          <button type="button" onClick={() => setShowNew(v => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                            {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-600">Confirmar nueva contraseña</Label>
                        <Input
                          type="password"
                          placeholder="Repite la contraseña"
                          value={confirmPassword}
                          onChange={e => setConfirmPassword(e.target.value)}
                          className="h-10"
                          required
                        />
                      </div>
                      <Button
                        type="submit"
                        disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
                        className="w-full h-10 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-sm disabled:opacity-40"
                      >
                        {isChangingPassword
                          ? <><RefreshCw size={13} className="animate-spin mr-2" />Actualizando...</>
                          : 'Cambiar contraseña'}
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            )}

            {/* ── Personalización visual ────────────────────────────────── */}
            {section === 'branding' && (
              <div className="space-y-6">
                <Card className="bg-white border-slate-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <ImageIcon size={16} className="text-violet-500" />
                      Logo de la tienda
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <LogoUploadZone
                      logoUrl={tempSettings.logoUrl}
                      isUploading={isUploadingLogo}
                      onFileSelect={onLogoFileSelect}
                    />
                  </CardContent>
                </Card>

                <Card className="bg-white border-slate-200 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Palette size={16} className="text-violet-500" />
                      Colores de marca
                    </CardTitle>
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
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-6">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">Estilos predeterminados</p>
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
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Personalización manual</p>
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
                        className="rounded-2xl border border-slate-200 p-5 flex flex-col gap-4 transition-all duration-300 shadow-xl h-fit sticky top-4"
                        style={{
                          backgroundColor: preview.backgroundColor,
                          fontFamily: preview.fontFamily || 'inherit'
                        }}
                      >
                        <div className="flex justify-between items-center">
                          <p className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: preview.textSecondaryColor }}>Vista previa</p>
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
                          className="rounded-xl h-10 flex items-center justify-center text-xs font-black shadow-lg transition-all cursor-default"
                          style={{
                            backgroundColor: preview.primaryColor,
                            color: getContrastColor(preview.primaryColor) === "white" ? "#ffffff" : "#0f172a"
                          }}
                        >
                          Botón Principal
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ── Información del negocio ──────────────────────────────── */}
            {section === 'business' && (
              <div className="space-y-6">
                <Card className="bg-white border-slate-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <StoreIcon size={16} className="text-emerald-500" />
                      Datos generales
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
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
                  </CardContent>
                </Card>

                <Card className="bg-white border-slate-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <BrainCircuit size={16} className="text-indigo-500" />
                      Contexto para el asistente IA
                    </CardTitle>
                    <p className="text-xs text-slate-400">Esta descripción personaliza las respuestas del asistente.</p>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={tempSettings.description}
                      onChange={e => set("description", e.target.value)}
                      placeholder="Ej: Somos una tienda de electrónica en Bogotá, Colombia. Vendemos celulares, accesorios y garantías. Nuestros clientes principales son jóvenes entre 18-35 años..."
                      className="resize-none min-h-[120px] text-sm bg-slate-50"
                      rows={5}
                    />
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ── Información fiscal ───────────────────────────────────── */}
            {section === 'fiscal' && (
              <Card className="bg-white border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Building2 size={16} className="text-amber-500" />
                    Datos para facturas
                  </CardTitle>
                  <p className="text-xs text-slate-400">Aparecerán en todas las facturas que emitas.</p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-600">Razón Social</Label>
                      <Input value={tempSettings.legalName} onChange={e => set("legalName", e.target.value)} placeholder="Empresa S.A.S." />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-600">NIT / RUT</Label>
                      <Input value={tempSettings.nit} onChange={e => set("nit", e.target.value)} placeholder="900.123.456-7" />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label className="text-xs font-semibold text-slate-600">Dirección Fiscal</Label>
                      <Input value={tempSettings.fiscalAddress} onChange={e => set("fiscalAddress", e.target.value)} placeholder="Cra 1 #23-45, Bogotá" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-600">Teléfono Fiscal</Label>
                      <Input value={tempSettings.fiscalPhone} onChange={e => set("fiscalPhone", e.target.value)} placeholder="+57 300 000 0000" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ── Barra de guardar (sticky bottom) ─────────────────────── */}
            {showSaveBar && (
              <div className="sticky bottom-4 z-10">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/60 p-4 flex items-center justify-between gap-4">
                  <p className="text-xs text-slate-500 hidden sm:block">
                    Los cambios se aplican globalmente a toda la tienda.
                  </p>
                  <div className="flex items-center gap-2 ml-auto">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setSection(null)}
                      disabled={isSavingSettings}
                      className="text-slate-500"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleSaveSettings}
                      disabled={isSavingSettings || isUploadingLogo}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[160px] h-10 shadow-md shadow-indigo-100 rounded-xl"
                    >
                      {isSavingSettings ? (
                        <span className="flex items-center gap-2"><RefreshCw className="animate-spin w-4 h-4" />Guardando...</span>
                      ) : "Guardar Cambios"}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
