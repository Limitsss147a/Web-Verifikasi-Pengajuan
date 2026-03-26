'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useProfile } from '@/hooks/use-profile'
import { formatDate } from '@/lib/format'
import type { Institution } from '@/lib/types/database'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { Building2, Plus, Edit, Trash2 } from 'lucide-react'

export default function InstitutionsPage() {
  const { isAdmin, isLoading: profileLoading } = useProfile()
  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editItem, setEditItem] = useState<Institution | null>(null)
  const [formData, setFormData] = useState({ name: '', code: '', address: '', phone: '', email: '' })
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!profileLoading && isAdmin) fetchInstitutions()
  }, [profileLoading, isAdmin])

  async function fetchInstitutions() {
    const supabase = createClient()
    setIsLoading(true)
    const { data } = await supabase.from('institutions').select('*').order('name')
    if (data) setInstitutions(data)
    setIsLoading(false)
  }

  function openCreate() {
    setEditItem(null)
    setFormData({ name: '', code: '', address: '', phone: '', email: '' })
    setDialogOpen(true)
  }

  function openEdit(inst: Institution) {
    setEditItem(inst)
    setFormData({ name: inst.name, code: inst.code, address: inst.address || '', phone: inst.phone || '', email: inst.email || '' })
    setDialogOpen(true)
  }

  async function handleSave() {
    if (!formData.name || !formData.code) { toast.error('Nama dan kode wajib diisi'); return }
    setIsSaving(true)
    const supabase = createClient()

    try {
      if (editItem) {
        const { error } = await supabase.from('institutions').update({
          name: formData.name, code: formData.code,
          address: formData.address || null, phone: formData.phone || null, email: formData.email || null,
        }).eq('id', editItem.id)
        if (error) throw error
        toast.success('Instansi berhasil diperbarui')
      } else {
        const { error } = await supabase.from('institutions').insert({
          name: formData.name, code: formData.code,
          address: formData.address || null, phone: formData.phone || null, email: formData.email || null,
        })
        if (error) throw error
        toast.success('Instansi berhasil ditambahkan')
      }
      setDialogOpen(false)
      fetchInstitutions()
    } catch (error) {
      toast.error('Gagal menyimpan')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete(id: string) {
    const supabase = createClient()
    const { error } = await supabase.from('institutions').delete().eq('id', id)
    if (error) toast.error('Gagal menghapus instansi')
    else { toast.success('Instansi berhasil dihapus'); fetchInstitutions() }
  }

  if (!isAdmin && !profileLoading) {
    return <div className="flex flex-col items-center justify-center py-20"><Building2 className="h-12 w-12 text-muted-foreground/40 mb-3" /><h3 className="font-semibold text-lg">Akses Ditolak</h3></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kelola Instansi</h1>
          <p className="text-muted-foreground">Daftar instansi pemerintah daerah</p>
        </div>
        <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Tambah Instansi</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : institutions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Building2 className="h-12 w-12 text-muted-foreground/40 mb-3" />
              <h3 className="font-semibold text-lg">Belum ada instansi</h3>
              <Button variant="link" onClick={openCreate}>Tambah instansi pertama</Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kode</TableHead>
                  <TableHead>Nama Instansi</TableHead>
                  <TableHead>Alamat</TableHead>
                  <TableHead>Telepon</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="w-[100px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {institutions.map((inst) => (
                  <TableRow key={inst.id}>
                    <TableCell className="font-mono text-sm font-medium">{inst.code}</TableCell>
                    <TableCell className="font-medium">{inst.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{inst.address || '-'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{inst.phone || '-'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{inst.email || '-'}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(inst)}><Edit className="h-3.5 w-3.5" /></Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Hapus Instansi?</AlertDialogTitle>
                              <AlertDialogDescription>Instansi &quot;{inst.name}&quot; akan dihapus. Semua data terkait juga akan terhapus.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Batal</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(inst.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Hapus</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editItem ? 'Edit Instansi' : 'Tambah Instansi'}</DialogTitle>
            <DialogDescription>Isi data instansi pemerintah daerah</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Nama Instansi *</Label><Input value={formData.name} onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Kode *</Label><Input value={formData.code} onChange={(e) => setFormData(p => ({ ...p, code: e.target.value }))} placeholder="DISDIK" /></div>
            </div>
            <div className="space-y-2"><Label>Alamat</Label><Input value={formData.address} onChange={(e) => setFormData(p => ({ ...p, address: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Telepon</Label><Input value={formData.phone} onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Email</Label><Input value={formData.email} onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button onClick={handleSave} disabled={isSaving}>{isSaving ? <Spinner className="mr-2" /> : null}{editItem ? 'Simpan' : 'Tambah'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
