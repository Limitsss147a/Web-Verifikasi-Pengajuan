'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useProfile } from '@/hooks/use-profile'
import { formatCurrency } from '@/lib/format'
import type { Program, Activity, SubActivity } from '@/lib/types/database'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import { ArrowLeft, Plus, Trash2, Save, Send } from 'lucide-react'
import Link from 'next/link'

interface BudgetItemRow {
  id?: string
  account_code: string
  item_name: string
  description: string
  specification: string
  quantity: number
  unit: string
  unit_price: number
}

const emptyItem: BudgetItemRow = {
  account_code: '',
  item_name: '',
  description: '',
  specification: '',
  quantity: 1,
  unit: 'unit',
  unit_price: 0,
}

export default function NewBudgetPage() {
  const router = useRouter()
  const { profile, isLoading: profileLoading } = useProfile()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [programId, setProgramId] = useState('')
  const [activityId, setActivityId] = useState('')
  const [subActivityId, setSubActivityId] = useState('')
  const [items, setItems] = useState<BudgetItemRow[]>([{ ...emptyItem }])

  const [programs, setPrograms] = useState<Program[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [subActivities, setSubActivities] = useState<SubActivity[]>([])
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!profileLoading && profile) fetchPrograms()
  }, [profileLoading, profile])

  useEffect(() => {
    if (programId) fetchActivities(programId)
    else { setActivities([]); setActivityId('') }
  }, [programId])

  useEffect(() => {
    if (activityId) fetchSubActivities(activityId)
    else { setSubActivities([]); setSubActivityId('') }
  }, [activityId])

  async function fetchPrograms() {
    const supabase = createClient()
    const { data } = await supabase
      .from('programs')
      .select('*')
      .order('code')
    if (data) setPrograms(data)
  }

  async function fetchActivities(progId: string) {
    const supabase = createClient()
    const { data } = await supabase
      .from('activities')
      .select('*')
      .eq('program_id', progId)
      .order('code')
    if (data) setActivities(data)
  }

  async function fetchSubActivities(actId: string) {
    const supabase = createClient()
    const { data } = await supabase
      .from('sub_activities')
      .select('*')
      .eq('activity_id', actId)
      .order('code')
    if (data) setSubActivities(data)
  }

  function addItem() {
    setItems(prev => [...prev, { ...emptyItem }])
  }

  function removeItem(index: number) {
    if (items.length <= 1) return
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  function updateItem(index: number, field: keyof BudgetItemRow, value: string | number) {
    setItems(prev => prev.map((item, i) => {
      if (i !== index) return item
      return { ...item, [field]: value }
    }))
  }

  const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)

  async function handleSubmit(asDraft: boolean) {
    if (!title.trim()) {
      toast.error('Judul pengajuan wajib diisi')
      return
    }

    const validItems = items.filter(item => item.item_name.trim())
    if (validItems.length === 0) {
      toast.error('Minimal satu item anggaran harus diisi')
      return
    }

    setIsSaving(true)
    const supabase = createClient()

    try {
      // Get active fiscal year
      const { data: fiscalYear } = await supabase
        .from('fiscal_years')
        .select('id')
        .eq('is_active', true)
        .single()

      if (!fiscalYear) {
        toast.error('Tidak ada tahun anggaran aktif')
        return
      }

      // Create budget
      const { data: budget, error: budgetError } = await supabase
        .from('budgets')
        .insert({
          title,
          description: description || null,
          institution_id: profile!.institution_id,
          fiscal_year_id: fiscalYear.id,
          program_id: programId || null,
          activity_id: activityId || null,
          sub_activity_id: subActivityId || null,
          submitted_by: profile!.id,
          status: asDraft ? 'draft' : 'submitted',
          submission_date: asDraft ? null : new Date().toISOString(),
          total_amount: totalAmount,
        })
        .select()
        .single()

      if (budgetError) throw budgetError

      // Insert budget items
      const budgetItems = validItems.map((item, index) => ({
        budget_id: budget.id,
        account_code: item.account_code || null,
        item_name: item.item_name,
        description: item.description || null,
        specification: item.specification || null,
        quantity: item.quantity,
        unit: item.unit,
        unit_price: item.unit_price,
        sort_order: index,
      }))

      const { error: itemsError } = await supabase
        .from('budget_items')
        .insert(budgetItems)

      if (itemsError) throw itemsError

      toast.success(
        asDraft ? 'Pengajuan berhasil disimpan sebagai draft' : 'Pengajuan berhasil diajukan'
      )
      router.push('/dashboard/budgets')
    } catch (error) {
      console.error('Error saving budget:', error)
      toast.error('Gagal menyimpan pengajuan')
    } finally {
      setIsSaving(false)
    }
  }

  if (profileLoading) {
    return <div className="flex h-64 items-center justify-center"><Spinner className="h-8 w-8" /></div>
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/budgets"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Buat Pengajuan Baru</h1>
          <p className="text-muted-foreground">Isi data pengajuan anggaran dengan lengkap</p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informasi Pengajuan</CardTitle>
          <CardDescription>Data umum pengajuan anggaran</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Judul Pengajuan *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Pengadaan Peralatan Laboratorium Komputer"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Jelaskan secara ringkas tujuan pengajuan anggaran ini..."
              rows={3}
            />
          </div>

          <Separator />

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Program</Label>
              <Select value={programId} onValueChange={setProgramId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih program" />
                </SelectTrigger>
                <SelectContent>
                  {programs.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.code} - {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Kegiatan</Label>
              <Select value={activityId} onValueChange={setActivityId} disabled={!programId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kegiatan" />
                </SelectTrigger>
                <SelectContent>
                  {activities.map(a => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.code} - {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Sub Kegiatan</Label>
              <Select value={subActivityId} onValueChange={setSubActivityId} disabled={!activityId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih sub kegiatan" />
                </SelectTrigger>
                <SelectContent>
                  {subActivities.map(sa => (
                    <SelectItem key={sa.id} value={sa.id}>
                      {sa.code} - {sa.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Budget Items */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Rincian Anggaran</CardTitle>
            <CardDescription>Detail item yang dianggarkan</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={addItem}>
            <Plus className="mr-1 h-3 w-3" />
            Tambah Item
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">#</TableHead>
                  <TableHead className="min-w-[100px]">Kode Akun</TableHead>
                  <TableHead className="min-w-[200px]">Nama Item *</TableHead>
                  <TableHead className="min-w-[80px]">Qty</TableHead>
                  <TableHead className="min-w-[80px]">Satuan</TableHead>
                  <TableHead className="min-w-[140px]">Harga Satuan (Rp)</TableHead>
                  <TableHead className="text-right min-w-[140px]">Total</TableHead>
                  <TableHead className="w-[40px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="text-muted-foreground text-sm">{index + 1}</TableCell>
                    <TableCell>
                      <Input
                        value={item.account_code}
                        onChange={(e) => updateItem(index, 'account_code', e.target.value)}
                        placeholder="5.2.1"
                        className="h-8 text-sm"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={item.item_name}
                        onChange={(e) => updateItem(index, 'item_name', e.target.value)}
                        placeholder="Nama item anggaran"
                        className="h-8 text-sm"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                        className="h-8 text-sm w-20"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={item.unit}
                        onChange={(e) => updateItem(index, 'unit', e.target.value)}
                        placeholder="unit"
                        className="h-8 text-sm w-20"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        value={item.unit_price}
                        onChange={(e) => updateItem(index, 'unit_price', Number(e.target.value))}
                        className="h-8 text-sm"
                      />
                    </TableCell>
                    <TableCell className="text-right font-medium text-sm">
                      {formatCurrency(item.quantity * item.unit_price)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => removeItem(index)}
                        disabled={items.length <= 1}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={6} className="text-right font-semibold">
                    Total Anggaran
                  </TableCell>
                  <TableCell className="text-right font-bold text-base">
                    {formatCurrency(totalAmount)}
                  </TableCell>
                  <TableCell />
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button variant="outline" onClick={() => handleSubmit(true)} disabled={isSaving}>
          {isSaving ? <Spinner className="mr-2" /> : <Save className="mr-2 h-4 w-4" />}
          Simpan Draft
        </Button>
        <Button onClick={() => handleSubmit(false)} disabled={isSaving}>
          {isSaving ? <Spinner className="mr-2" /> : <Send className="mr-2 h-4 w-4" />}
          Ajukan Sekarang
        </Button>
      </div>
    </div>
  )
}
