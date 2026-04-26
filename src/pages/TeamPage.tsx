import * as React from "react";
import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { UserPlus, Trash2 } from "lucide-react";
import { StoreMember, UserRole, Store } from "@/types";

interface TeamPageProps {
  currentStore: Store;
  isAdmin: boolean;
  members: StoreMember[];
  user: any;
  isInviteDialogOpen: boolean;
  setIsInviteDialogOpen: (v: boolean) => void;
  inviteEmail: string;
  setInviteEmail: (v: string) => void;
  inviteRole: UserRole;
  setInviteRole: (v: UserRole) => void;
  handleInviteMember: (e: React.FormEvent) => void;
  handleUpdateMemberRole: (email: string, role: UserRole) => void;
  handleRemoveMember: (email: string) => void;
}

export function TeamPage({
  currentStore, members, user, isInviteDialogOpen, setIsInviteDialogOpen,
  inviteEmail, setInviteEmail, inviteRole, setInviteRole,
  handleInviteMember, handleUpdateMemberRole, handleRemoveMember,
}: TeamPageProps) {
  return (
    <motion.div
      key="team"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold">Gestión de Equipo</CardTitle>
            <CardDescription>Administra quién tiene acceso a {currentStore?.name}</CardDescription>
          </div>
          <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
            <DialogTrigger render={
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                <UserPlus size={18} className="mr-2" /> Invitar Miembro
              </Button>
            } />
            <DialogContent>
              <form onSubmit={handleInviteMember}>
                <DialogHeader>
                  <DialogTitle>Invitar Nuevo Miembro</DialogTitle>
                  <DialogDescription>
                    Envía una invitación para unirse a tu tienda.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>Email del invitado</Label>
                    <Input
                      type="email"
                      placeholder="ejemplo@correo.com"
                      value={inviteEmail}
                      onChange={e => setInviteEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Rol asignado</Label>
                    <Select value={inviteRole} onValueChange={(v: any) => setInviteRole(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="w-full">
                        <SelectItem value="admin">Administrador (Control total)</SelectItem>
                        <SelectItem value="employee">Empleado (Ventas e Inventario)</SelectItem>
                        <SelectItem value="viewer">Observador (Solo lectura)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" className="bg-indigo-600 text-white w-full">Enviar Invitación</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>Miembro</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map(member => (
                <TableRow key={member.email}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                        {member.displayName[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-sm text-slate-900">{member.displayName}</p>
                        <p className="text-xs text-slate-500">{member.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {member.role === "admin" ? "Administrador" : member.role === "employee" ? "Empleado" : "Observador"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-100">
                      Activo
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {member.email !== user?.email ? (
                      <div className="flex justify-end gap-2">
                        <Select
                          value={member.role}
                          onValueChange={(v: any) => handleUpdateMemberRole(member.email, v)}
                        >
                          <SelectTrigger className="w-[110px] h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="employee">Empleado</SelectItem>
                            <SelectItem value="viewer">Ver</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                          onClick={() => handleRemoveMember(member.email)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic font-normal">Tú</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </motion.div>
  );
}
