'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useProfile } from '@/hooks/use-profile'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/format'
import { statusConfig, type Budget, type BudgetItem, type BudgetDocument, type Revision, type BudgetStatus } from '@/lib/types/database'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Edit,
  Send,
  Trash2,
  FileText,
  Clock,
  User,
  Building2,
  CalendarDays,
  MessageSquare,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRightLeft,
} from 'lucide-react'
import Link from 'next/link'

export default function BudgetDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { profile, isAdmin } = useProfile()
  const [budget, setBudget] = useState<Budget | null>(null)
  const [items, setItems] = useState<BudgetItem[]>([])
  const [revisions, setRevisions] = useState<Revision[]>([])
  const [documents, setDocuments] = useState<BudgetDocument[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const budgetId = params.id as string

  useEffect(() => {
    fetchBudgetDetail()
  }, [budgetId])

  async function fetchBudgetDetail() {
    const supabase = createClient()
    setIsLoading(true)

    const [budgetRes, itemsRes, revisionsRes, docsRes] = await Promise.all([
      supabase
        .from('budgets')
        .select('*, institution:institutions(name, code), program:programs(name, code), activity:activities(name, code), sub_activity:sub_activities(name, code), submitter:profiles!budgets_submitted_by_fkey(full_name, position), reviewer:profiles!budgets_reviewed_by_fkey(full_name)')
        .eq('id', budgetId)
        .single(),
      supabase
        .from('budget_items')
        .select('*')
        .eq('budget_id', budgetId)
        .order('sort_order'),
      supabase
        .from('revisions')
        .select('*, reviewer:profiles!revisions_reviewer_id_fkey(full_name)')
        .eq('budget_id', budgetId)
        .order('created_at', { ascending: false }),
      supabase
        .from('budget_documents')
        .select('*')
        .eq('budget_id', budgetId)
        .order('created_at', { ascending: false }),
    ])

    if (budgetRes.data) setBudget(budgetRes.data as unknown as Budget)
    if (itemsRes.data) setItems(itemsRes.data)
    if (revisionsRes.data) setRevisions(revisionsRes.data as unknown as Revision[])
    if (docsRes.data) setDocuments(docsRes.data)

    setIsLoading(false)
  }

  async function handleSubmit() {
    setIsSubmitting(true)
    const supabase = createClient()

    const { error } = await supabase
      .from('budgets')
      .update({
        status: 'submitted',
        submission_date: new Date().toISOString(),
      })
      .eq('id', budgetId)

    if (error) {
      toast.error('Gagal mengajukan anggaran')
    } else {
      toast.success('Anggaran berhasil diajukan')
      fetchBudgetDetail()
    }
    setIsSubmitting(false)
  }

  async function handleDownload(doc: BudgetDocument) {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.storage
        .from('budget_documents')
        .createSignedUrl(doc.file_path, 3600)
        
      if (error) throw error
      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank')
      }
    } catch (error) {
      toast.error('Gagal mengunduh dokumen')
    }
  }

  async function handleDelete() {
    const supabase = createClient()

    const { error } = await supabase
      .from('budgets')
      .delete()
      .eq('id', budgetId)

    if (error) {
      toast.error('Gagal menghapus pengajuan')
    } else {
      toast.success('Pengajuan berhasil dihapus')
      router.push('/dashboard/budgets')
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-5xl">
        <Skeleton className="h-8 w-64" />
        <Card><CardContent className="p-6"><Skeleton className="h-40 w-full" /></CardContent></Card>
        <Card><CardContent className="p-6"><Skeleton className="h-60 w-full" /></CardContent></Card>
      </div>
    )
  }

  if (!budget) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <FileText className="h-12 w-12 text-muted-foreground/40 mb-3" />
        <h3 className="font-semibold text-lg">Pengajuan tidak ditemukan</h3>
        <Button variant="link" asChild className="mt-2">
          <Link href="/dashboard/budgets">Kembali ke daftar</Link>
        </Button>
      </div>
    )
  }

  const config = statusConfig[budget.status as BudgetStatus]
  const canEdit = !isAdmin && (budget.status === 'draft' || budget.status === 'revision')
  const canSubmit = !isAdmin && budget.status === 'draft'
  const canDelete = !isAdmin && budget.status === 'draft'

  const revisionStatusIcon = (status: BudgetStatus) => {
    switch (status) {
      case 'approved': return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case 'rejected': return <XCircle className="h-4 w-4 text-red-600" />
      case 'revision': return <AlertCircle className="h-4 w-4 text-orange-600" />
      case 'under_review': return <Clock className="h-4 w-4 text-yellow-600" />
      case 'submitted': return <Send className="h-4 w-4 text-blue-600" />
      default: return <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
    }
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" asChild className="mt-1">
            <Link href="/dashboard/budgets"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight">{budget.title}</h1>
              <Badge className={`${config.color} border-0`}>{config.label}</Badge>
              {budget.version > 1 && (
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                  Versi {budget.version}
                </span>
              )}
            </div>
            {budget.description && (
              <p className="text-muted-foreground mt-1">{budget.description}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2 sm:ml-auto">
          {canEdit && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/budgets/${budgetId}/edit`}>
                <Edit className="mr-1 h-3 w-3" /> Edit
              </Link>
            </Button>
          )}
          {canSubmit && (
            <Button size="sm" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? <Spinner className="mr-1" /> : <Send className="mr-1 h-3 w-3" />}
              Ajukan
            </Button>
          )}
          {canDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="mr-1 h-3 w-3" /> Hapus
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Hapus Pengajuan?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Pengajuan &quot;{budget.title}&quot; akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Hapus
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-lg p-2 bg-primary/10">
              <Building2 className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Instansi</p>
              <p className="text-sm font-medium truncate">{(budget as any).institution?.name || '-'}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-lg p-2 bg-chart-1/10">
              <FileText className="h-4 w-4 text-chart-1" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Program</p>
              <p className="text-sm font-medium truncate">{budget.program_name || (budget as any).program?.name || '-'}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-lg p-2 bg-chart-2/10">
              <User className="h-4 w-4 text-chart-2" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Pengaju</p>
              <p className="text-sm font-medium truncate">{(budget as any).submitter?.full_name || '-'}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-lg p-2 bg-chart-3/10">
              <CalendarDays className="h-4 w-4 text-chart-3" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Tanggal Pengajuan</p>
              <p className="text-sm font-medium">{formatDate(budget.submission_date)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Budget Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Rincian Anggaran</CardTitle>
          <CardDescription>{items.length} item | Total: {formatCurrency(Number(budget.total_amount))}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">#</TableHead>
                  <TableHead>Kode Akun</TableHead>
                  <TableHead>Nama Item</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead>Satuan</TableHead>
                  <TableHead className="text-right">Harga Satuan</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, i) => (
                  <TableRow key={item.id}>
                    <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                    <TableCell className="text-sm">{item.account_code || '-'}</TableCell>
                    <TableCell>
                      <div className="font-medium text-sm">{item.item_name}</div>
                      {item.specification && (
                        <p className="text-xs text-muted-foreground mt-0.5">{item.specification}</p>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-sm">{item.quantity}</TableCell>
                    <TableCell className="text-sm">{item.unit}</TableCell>
                    <TableCell className="text-right text-sm">{formatCurrency(Number(item.unit_price))}</TableCell>
                    <TableCell className="text-right font-medium text-sm">{formatCurrency(Number(item.total_price))}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={6} className="text-right font-semibold">Total Anggaran</TableCell>
                  <TableCell className="text-right font-bold text-base">{formatCurrency(Number(budget.total_amount))}</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Supporting Documents */}
      {documents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dokumen Pendukung</CardTitle>
            <CardDescription>File pendukung yang dilampirkan</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {documents.map((doc, index) => (
              <div key={index} className="flex flex-col sm:flex-row sm:items-center gap-4 p-3 border rounded-md">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <FileText className="h-8 w-8 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{doc.file_name}</p>
                    <p className="text-xs text-muted-foreground uppercase">{doc.document_type} • {(doc.file_size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <Button variant="secondary" size="sm" className="shrink-0" onClick={() => handleDownload(doc)}>
                  Lihat/Unduh
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Revision History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Riwayat Status</CardTitle>
          <CardDescription>Timeline perubahan status pengajuan</CardDescription>
        </CardHeader>
        <CardContent>
          {revisions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Belum ada riwayat perubahan status
            </p>
          ) : (
            <div className="space-y-4">
              {revisions.map((rev, index) => {
                const fromConfig = statusConfig[rev.from_status]
                const toConfig = statusConfig[rev.to_status]
                return (
                  <div key={rev.id} className="relative flex gap-4">
                    {/* Timeline line */}
                    {index < revisions.length - 1 && (
                      <div className="absolute left-[13px] top-8 bottom-0 w-px bg-border" />
                    )}
                    {/* Icon */}
                    <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border bg-background">
                      {revisionStatusIcon(rev.to_status)}
                    </div>
                    {/* Content */}
                    <div className="flex-1 min-w-0 pb-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={`${fromConfig.color} border-0 text-[10px]`}>{fromConfig.label}</Badge>
                        <ArrowRightLeft className="h-3 w-3 text-muted-foreground" />
                        <Badge className={`${toConfig.color} border-0 text-[10px]`}>{toConfig.label}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {(rev as any).reviewer?.full_name || 'System'} • {formatDateTime(rev.created_at)}
                      </p>
                      {rev.comments && (
                        <div className="mt-2 rounded-md bg-muted/50 p-3">
                          <div className="flex items-start gap-2">
                            <MessageSquare className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                            <p className="text-sm">{rev.comments}</p>
                          </div>
                        </div>
                      )}
                      {rev.revision_notes && (
                        <div className="mt-2 rounded-md bg-orange-50 border border-orange-200 p-3">
                          <p className="text-sm text-orange-800">{rev.revision_notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
