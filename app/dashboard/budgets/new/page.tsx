'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useProfile } from '@/hooks/use-profile'
import { formatCurrency } from '@/lib/format'
import type { Program, Activity, SubActivity, DocumentType } from '@/lib/types/database'
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
import { ArrowLeft, Plus, Trash2, Save, Send, UploadCloud, X, FileText } from 'lucide-react'
import Link from 'next/link'

interface DocumentUpload {
  file: File
  type: DocumentType | ''
}

interface BudgetItemRow {
  id?: string
  account_code: string
  item_name: string
  description: string
  specification: string
  quantity_before: number
  unit_before: string
  unit_price_before: number
  quantity: number
  unit: string
  unit_price: number
}

const emptyItem: BudgetItemRow = {
  account_code: '',
  item_name: '',
  description: '',
  specification: '',
  quantity_before: 0,
  unit_before: 'unit',
  unit_price_before: 0,
  quantity: 1,
  unit: 'unit',
  unit_price: 0,
}

export default function NewBudgetPage() {
  const router = useRouter()
  const { profile, isLoading: profileLoading } = useProfile()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [programName, setProgramName] = useState('')
  const [activityName, setActivityName] = useState('')
  const [subActivityName, setSubActivityName] = useState('')
  const [items, setItems] = useState<BudgetItemRow[]>([{ ...emptyItem }])

  const [isSaving, setIsSaving] = useState(false)
  const [documents, setDocuments] = useState<DocumentUpload[]>([])

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

  function addDocument(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      const newDocs = Array.from(e.target.files).map(file => ({
        file,
        type: '' as DocumentType | ''
      }))
      setDocuments(prev => [...prev, ...newDocs])
    }
  }

  function removeDocument(index: number) {
    setDocuments(prev => prev.filter((_, i) => i !== index))
  }

  function updateDocumentType(index: number, type: DocumentType) {
    setDocuments(prev => prev.map((doc, i) => i === index ? { ...doc, type } : doc))
  }

  const totalAmountBefore = items.reduce((sum, item) => sum + (item.quantity_before * item.unit_price_before), 0)
  const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)
  const totalDifference = totalAmount - totalAmountBefore

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

    const hasIncompleteDocs = documents.some(doc => !doc.type)
    if (hasIncompleteDocs) {
      toast.error('Silakan pilih jenis dokumen untuk semua file pendukung')
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
          program_name: programName || null,
          activity_name: activityName || null,
          sub_activity_name: subActivityName || null,
          submitted_by: profile!.id,
          status: 'draft', // Always draft during insertion due to RLS policies
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
        quantity_before: item.quantity_before,
        unit_before: item.unit_before,
        unit_price_before: item.unit_price_before,
        quantity: item.quantity,
        unit: item.unit,
        unit_price: item.unit_price,
        sort_order: index,
      }))

      const { error: itemsError } = await supabase
        .from('budget_items')
        .insert(budgetItems)

      if (itemsError) throw itemsError

      // Insert budget documents
      if (documents.length > 0) {
        const budgetDocInserts = []
        for (const doc of documents) {
          if (!doc.type) continue
          
          const fileExt = doc.file.name.split('.').pop()
          const fileName = `${budget.id}/${Math.random().toString(36).substring(2, 15)}.${fileExt}`
          
          const { error: uploadError } = await supabase.storage
            .from('budget_documents')
            .upload(fileName, doc.file)
            
          if (!uploadError) {
            budgetDocInserts.push({
              budget_id: budget.id,
              file_name: doc.file.name,
              file_path: fileName,
              file_type: doc.file.type || 'application/octet-stream',
              file_size: doc.file.size,
              document_type: doc.type,
              uploaded_by: profile!.id
            })
          } else {
            console.error('Failed to upload document:', uploadError)
          }
        }
        
        if (budgetDocInserts.length > 0) {
          await supabase.from('budget_documents').insert(budgetDocInserts)
        }
      }

      // If user wants to submit immediately, update the status to 'submitted' now that items are inserted
      if (!asDraft) {
        const { error: updateError } = await supabase
          .from('budgets')
          .update({ status: 'submitted' })
          .eq('id', budget.id)
          
        if (updateError) throw updateError
      }

      toast.success(
        asDraft ? 'Pengajuan berhasil disimpan sebagai draft' : 'Pengajuan berhasil diajukan'
      )
      router.push('/dashboard/budgets')
    } catch (error: any) {
      console.error('Error saving budget:', error?.message || error)
      toast.error(`Gagal menyimpan: ${error?.message || 'Terjadi kesalahan sistem'}`)
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
              <Input
                value={programName}
                onChange={(e) => setProgramName(e.target.value)}
                placeholder="Masukkan nama program"
              />
            </div>

            <div className="space-y-2">
              <Label>Kegiatan</Label>
              <Input
                value={activityName}
                onChange={(e) => setActivityName(e.target.value)}
                placeholder="Masukkan nama kegiatan"
              />
            </div>

            <div className="space-y-2">
              <Label>Sub Kegiatan</Label>
              <Input
                value={subActivityName}
                onChange={(e) => setSubActivityName(e.target.value)}
                placeholder="Masukkan nama sub kegiatan"
              />
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
                  <TableHead rowSpan={2} className="w-[50px] text-center border-r align-middle">#</TableHead>
                  <TableHead rowSpan={2} className="min-w-[120px] text-center border-r align-middle">Kode Rekening</TableHead>
                  <TableHead rowSpan={2} className="min-w-[200px] text-center border-r align-middle">Uraian / Item *</TableHead>
                  <TableHead colSpan={4} className="text-center border-b border-r bg-muted/30">Sebelum</TableHead>
                  <TableHead colSpan={4} className="text-center border-b border-r bg-primary/5">Setelah</TableHead>
                  <TableHead rowSpan={2} className="text-center min-w-[140px] border-r align-middle font-semibold">Bertambah/<br/>Berkurang</TableHead>
                  <TableHead rowSpan={2} className="w-[40px] text-center align-middle" />
                </TableRow>
                <TableRow>
                  {/* Sebelum */}
                  <TableHead className="min-w-[80px] text-center border-r bg-muted/30 text-xs">Vol</TableHead>
                  <TableHead className="min-w-[80px] text-center border-r bg-muted/30 text-xs">Satuan</TableHead>
                  <TableHead className="min-w-[120px] text-center border-r bg-muted/30 text-xs">Harga</TableHead>
                  <TableHead className="text-right min-w-[120px] border-r bg-muted/30 text-xs">Jumlah</TableHead>
                  {/* Setelah */}
                  <TableHead className="min-w-[80px] text-center border-r bg-primary/5 text-xs">Vol</TableHead>
                  <TableHead className="min-w-[80px] text-center border-r bg-primary/5 text-xs">Satuan</TableHead>
                  <TableHead className="min-w-[120px] text-center border-r bg-primary/5 text-xs">Harga</TableHead>
                  <TableHead className="text-right min-w-[120px] border-r bg-primary/5 text-xs">Jumlah</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, index) => (
                  <TableRow key={index} className="group hover:bg-transparent">
                    <TableCell className="text-muted-foreground text-sm text-center border-r">{index + 1}</TableCell>
                    <TableCell className="border-r p-2 bg-background">
                      <Input
                        value={item.account_code}
                        onChange={(e) => updateItem(index, 'account_code', e.target.value)}
                        placeholder="5.2.1"
                        className="h-8 text-sm focus-visible:ring-1"
                      />
                    </TableCell>
                    <TableCell className="border-r p-2 bg-background">
                      <Input
                        value={item.item_name}
                        onChange={(e) => updateItem(index, 'item_name', e.target.value)}
                        placeholder="Nama item anggaran"
                        className="h-8 text-sm focus-visible:ring-1"
                      />
                    </TableCell>
                    {/* Sebelum */}
                    <TableCell className="border-r p-2 bg-muted/10">
                      <Input
                        type="number"
                        min="0"
                        value={item.quantity_before}
                        onChange={(e) => updateItem(index, 'quantity_before', Number(e.target.value))}
                        className="h-8 text-sm w-full bg-background border-input focus-visible:ring-1 text-center"
                      />
                    </TableCell>
                    <TableCell className="border-r p-2 bg-muted/10">
                      <Input
                        value={item.unit_before}
                        onChange={(e) => updateItem(index, 'unit_before', e.target.value)}
                        placeholder="unit"
                        className="h-8 text-sm w-full bg-background border-input focus-visible:ring-1 text-center"
                      />
                    </TableCell>
                    <TableCell className="border-r p-2 bg-muted/10">
                      <Input
                        type="number"
                        min="0"
                        value={item.unit_price_before}
                        onChange={(e) => updateItem(index, 'unit_price_before', Number(e.target.value))}
                        className="h-8 text-sm bg-background border-input focus-visible:ring-1 text-right"
                      />
                    </TableCell>
                    <TableCell className="text-right font-medium text-sm border-r p-2 bg-muted/10">
                      {formatCurrency(item.quantity_before * item.unit_price_before)}
                    </TableCell>
                    {/* Setelah */}
                    <TableCell className="border-r p-2 bg-primary/[0.02]">
                      <Input
                        type="number"
                        min="0"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                        className="h-8 text-sm w-full bg-background border-input focus-visible:ring-1 text-center"
                      />
                    </TableCell>
                    <TableCell className="border-r p-2 bg-primary/[0.02]">
                      <Input
                        value={item.unit}
                        onChange={(e) => updateItem(index, 'unit', e.target.value)}
                        placeholder="unit"
                        className="h-8 text-sm w-full bg-background border-input focus-visible:ring-1 text-center"
                      />
                    </TableCell>
                    <TableCell className="border-r p-2 bg-primary/[0.02]">
                      <Input
                        type="number"
                        min="0"
                        value={item.unit_price}
                        onChange={(e) => updateItem(index, 'unit_price', Number(e.target.value))}
                        className="h-8 text-sm bg-background border-input focus-visible:ring-1 text-right"
                      />
                    </TableCell>
                    <TableCell className="text-right font-medium text-sm border-r p-2 bg-primary/[0.02]">
                      {formatCurrency(item.quantity * item.unit_price)}
                    </TableCell>
                    {/* Difference */}
                    <TableCell className={`text-right font-semibold text-sm border-r p-2 align-middle bg-background ${(item.quantity * item.unit_price) - (item.quantity_before * item.unit_price_before) < 0 ? 'text-destructive' : 'text-emerald-600'}`}>
                      {((item.quantity * item.unit_price) - (item.quantity_before * item.unit_price_before)) < 0 ? '(' : ''}{formatCurrency(Math.abs((item.quantity * item.unit_price) - (item.quantity_before * item.unit_price_before)))}{((item.quantity * item.unit_price) - (item.quantity_before * item.unit_price_before)) < 0 ? ')' : ''}
                    </TableCell>
                    <TableCell className="p-2 text-center align-middle bg-background">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeItem(index)}
                        disabled={items.length <= 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={3} className="text-right font-bold border-r">
                    Total Anggaran
                  </TableCell>
                  <TableCell colSpan={4} className="text-right font-bold border-r bg-muted/30">
                    {formatCurrency(totalAmountBefore)}
                  </TableCell>
                  <TableCell colSpan={4} className="text-right font-bold border-r bg-primary/5">
                    {formatCurrency(totalAmount)}
                  </TableCell>
                  <TableCell className={`text-right font-bold border-r ${totalDifference < 0 ? 'text-destructive' : 'text-emerald-600'}`}>
                    {totalDifference < 0 ? '(' : ''}{formatCurrency(Math.abs(totalDifference))}{totalDifference < 0 ? ')' : ''}
                  </TableCell>
                  <TableCell />
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Supporting Documents */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Dokumen Pendukung</CardTitle>
            <CardDescription>RAB, TOR, atau file pendukung lainnya</CardDescription>
          </div>
          <div>
            <Label htmlFor="file-upload" className="cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors h-9 px-3">
              <UploadCloud className="mr-2 h-4 w-4" />
              Unggah File
            </Label>
            <Input id="file-upload" type="file" multiple className="hidden" onChange={addDocument} disabled={isSaving} />
          </div>
        </CardHeader>
        {documents.length > 0 && (
          <CardContent className="space-y-3">
            {documents.map((doc, index) => (
              <div key={index} className="flex flex-col sm:flex-row sm:items-center gap-4 p-3 border rounded-md">
                <div className="flex items-center gap-3 flex-1 overflow-hidden">
                  <FileText className="h-8 w-8 text-muted-foreground shrink-0" />
                  <div className="overflow-hidden">
                    <p className="text-sm font-medium truncate">{doc.file.name}</p>
                    <p className="text-xs text-muted-foreground">{(doc.file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={doc.type} onValueChange={(val: DocumentType) => updateDocumentType(index, val)} disabled={isSaving}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Pilih Jenis Dokumen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rab">RAB</SelectItem>
                      <SelectItem value="tor">TOR</SelectItem>
                      <SelectItem value="rkakl">RKA-KL</SelectItem>
                      <SelectItem value="supporting">Dokumen Pendukung</SelectItem>
                      <SelectItem value="other">Lainnya</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive shrink-0" onClick={() => removeDocument(index)} disabled={isSaving}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        )}
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
