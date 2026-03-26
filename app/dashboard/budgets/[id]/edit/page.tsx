'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useProfile } from '@/hooks/use-profile'
import { formatCurrency } from '@/lib/format'
import type { Budget, BudgetItem, Program, Activity, SubActivity } from '@/lib/types/database'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { Separator } from '@/components/ui/separator'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow,
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

export default function EditBudgetPage() {
  const params = useParams()
  const router = useRouter()
  const { profile, isLoading: profileLoading } = useProfile()
  const budgetId = params.id as string

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [programId, setProgramId] = useState('')
  const [activityId, setActivityId] = useState('')
  const [subActivityId, setSubActivityId] = useState('')
  const [items, setItems] = useState<BudgetItemRow[]>([])
  const [originalStatus, setOriginalStatus] = useState('')

  const [programs, setPrograms] = useState<Program[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [subActivities, setSubActivities] = useState<SubActivity[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!profileLoading && profile) {
      fetchPrograms()
      fetchBudget()
    }
  }, [profileLoading, profile])

  useEffect(() => {
    if (programId) fetchActivities(programId)
  }, [programId])

  useEffect(() => {
    if (activityId) fetchSubActivities(activityId)
  }, [activityId])

  async function fetchBudget() {
    const supabase = createClient()
    setIsLoading(true)

    const [budgetRes, itemsRes] = await Promise.all([
      supabase.from('budgets').select('*').eq('id', budgetId).single(),
      supabase.from('budget_items').select('*').eq('budget_id', budgetId).order('sort_order'),
    ])

    if (budgetRes.data) {
      const b = budgetRes.data
      setTitle(b.title)
      setDescription(b.description || '')
      setProgramId(b.program_id || '')
      setActivityId(b.activity_id || '')
      setSubActivityId(b.sub_activity_id || '')
      setOriginalStatus(b.status)
    }

    if (itemsRes.data && itemsRes.data.length > 0) {
      setItems(itemsRes.data.map(item => ({
        id: item.id,
        account_code: item.account_code || '',
        item_name: item.item_name,
        description: item.description || '',
        specification: item.specification || '',
        quantity: Number(item.quantity),
        unit: item.unit,
        unit_price: Number(item.unit_price),
      })))
    } else {
      setItems([{ account_code: '', item_name: '', description: '', specification: '', quantity: 1, unit: 'unit', unit_price: 0 }])
    }

    setIsLoading(false)
  }

  async function fetchPrograms() {
    const supabase = createClient()
    const { data } = await supabase.from('programs').select('*').order('code')
    if (data) setPrograms(data)
  }

  async function fetchActivities(progId: string) {
    const supabase = createClient()
    const { data } = await supabase.from('activities').select('*').eq('program_id', progId).order('code')
    if (data) setActivities(data)
  }

  async function fetchSubActivities(actId: string) {
    const supabase = createClient()
    const { data } = await supabase.from('sub_activities').select('*').eq('activity_id', actId).order('code')
    if (data) setSubActivities(data)
  }

  function addItem() {
    setItems(prev => [...prev, { account_code: '', item_name: '', description: '', specification: '', quantity: 1, unit: 'unit', unit_price: 0 }])
  }

  function removeItem(index: number) {
    if (items.length <= 1) return
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  function updateItem(index: number, field: keyof BudgetItemRow, value: string | number) {
    setItems(prev => prev.map((item, i) => i !== index ? item : { ...item, [field]: value }))
  }

  const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)

  async function handleSubmit(submitNow: boolean) {
    if (!title.trim()) { toast.error('Judul wajib diisi'); return }
    const validItems = items.filter(item => item.item_name.trim())
    if (validItems.length === 0) { toast.error('Minimal satu item'); return }

    setIsSaving(true)
    const supabase = createClient()

    try {
      const newStatus = submitNow ? 'submitted' : (originalStatus === 'revision' ? 'revision' : 'draft')
      const newVersion = submitNow && originalStatus === 'revision' ? undefined : undefined

      const updateData: Record<string, unknown> = {
        title,
        description: description || null,
        program_id: programId || null,
        activity_id: activityId || null,
        sub_activity_id: subActivityId || null,
        total_amount: totalAmount,
        status: submitNow ? 'submitted' : (originalStatus === 'revision' ? 'submitted' : 'draft'),
      }

      if (submitNow) {
        updateData.submission_date = new Date().toISOString()
        if (originalStatus === 'revision') {
          // Increment version on resubmission after revision
          const { data: current } = await supabase.from('budgets').select('version').eq('id', budgetId).single()
          if (current) updateData.version = current.version + 1
        }
      }

      const { error: budgetError } = await supabase
        .from('budgets')
        .update(updateData)
        .eq('id', budgetId)

      if (budgetError) throw budgetError

      // Delete old items and re-insert
      await supabase.from('budget_items').delete().eq('budget_id', budgetId)

      const budgetItems = validItems.map((item, index) => ({
        budget_id: budgetId,
        account_code: item.account_code || null,
        item_name: item.item_name,
        description: item.description || null,
        specification: item.specification || null,
        quantity: item.quantity,
        unit: item.unit,
        unit_price: item.unit_price,
        sort_order: index,
      }))

      const { error: itemsError } = await supabase.from('budget_items').insert(budgetItems)
      if (itemsError) throw itemsError

      toast.success(submitNow ? 'Pengajuan berhasil diajukan kembali' : 'Perubahan berhasil disimpan')
      router.push(`/dashboard/budgets/${budgetId}`)
    } catch (error) {
      console.error('Error:', error)
      toast.error('Gagal menyimpan')
    } finally {
      setIsSaving(false)
    }
  }

  if (profileLoading || isLoading) {
    return <div className="flex h-64 items-center justify-center"><Spinner className="h-8 w-8" /></div>
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/budgets/${budgetId}`}><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Pengajuan</h1>
          <p className="text-muted-foreground">
            {originalStatus === 'revision' ? 'Perbaiki pengajuan sesuai catatan reviewer' : 'Edit draft pengajuan anggaran'}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informasi Pengajuan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Judul Pengajuan *</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>
          <Separator />
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Program</Label>
              <Select value={programId} onValueChange={setProgramId}>
                <SelectTrigger><SelectValue placeholder="Pilih program" /></SelectTrigger>
                <SelectContent>
                  {programs.map(p => <SelectItem key={p.id} value={p.id}>{p.code} - {p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Kegiatan</Label>
              <Select value={activityId} onValueChange={setActivityId} disabled={!programId}>
                <SelectTrigger><SelectValue placeholder="Pilih kegiatan" /></SelectTrigger>
                <SelectContent>
                  {activities.map(a => <SelectItem key={a.id} value={a.id}>{a.code} - {a.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Sub Kegiatan</Label>
              <Select value={subActivityId} onValueChange={setSubActivityId} disabled={!activityId}>
                <SelectTrigger><SelectValue placeholder="Pilih sub kegiatan" /></SelectTrigger>
                <SelectContent>
                  {subActivities.map(sa => <SelectItem key={sa.id} value={sa.id}>{sa.code} - {sa.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Rincian Anggaran</CardTitle>
            <CardDescription>Detail item yang dianggarkan</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={addItem}>
            <Plus className="mr-1 h-3 w-3" /> Tambah Item
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
                      <Input value={item.account_code} onChange={(e) => updateItem(index, 'account_code', e.target.value)} className="h-8 text-sm" />
                    </TableCell>
                    <TableCell>
                      <Input value={item.item_name} onChange={(e) => updateItem(index, 'item_name', e.target.value)} className="h-8 text-sm" />
                    </TableCell>
                    <TableCell>
                      <Input type="number" min="1" value={item.quantity} onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))} className="h-8 text-sm w-20" />
                    </TableCell>
                    <TableCell>
                      <Input value={item.unit} onChange={(e) => updateItem(index, 'unit', e.target.value)} className="h-8 text-sm w-20" />
                    </TableCell>
                    <TableCell>
                      <Input type="number" min="0" value={item.unit_price} onChange={(e) => updateItem(index, 'unit_price', Number(e.target.value))} className="h-8 text-sm" />
                    </TableCell>
                    <TableCell className="text-right font-medium text-sm">
                      {formatCurrency(item.quantity * item.unit_price)}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => removeItem(index)} disabled={items.length <= 1}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={6} className="text-right font-semibold">Total Anggaran</TableCell>
                  <TableCell className="text-right font-bold text-base">{formatCurrency(totalAmount)}</TableCell>
                  <TableCell />
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button variant="outline" onClick={() => handleSubmit(false)} disabled={isSaving}>
          {isSaving ? <Spinner className="mr-2" /> : <Save className="mr-2 h-4 w-4" />}
          Simpan
        </Button>
        <Button onClick={() => handleSubmit(true)} disabled={isSaving}>
          {isSaving ? <Spinner className="mr-2" /> : <Send className="mr-2 h-4 w-4" />}
          {originalStatus === 'revision' ? 'Ajukan Ulang' : 'Ajukan Sekarang'}
        </Button>
      </div>
    </div>
  )
}
