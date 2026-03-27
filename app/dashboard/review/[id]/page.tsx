'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useProfile } from '@/hooks/use-profile'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/format'
import { statusConfig, type Budget, type BudgetItem, type Revision, type BudgetStatus } from '@/lib/types/database'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import {
  Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import {
  ArrowLeft, CheckCircle2, XCircle, AlertCircle, ArrowRightLeft,
  MessageSquare, Building2, FileText, User, CalendarDays, Clock, Send,
} from 'lucide-react'
import Link from 'next/link'

type ReviewAction = 'approve' | 'revision' | 'reject'

export default function ReviewDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { profile, isAdmin } = useProfile()
  const budgetId = params.id as string

  const [budget, setBudget] = useState<Budget | null>(null)
  const [items, setItems] = useState<BudgetItem[]>([])
  const [revisions, setRevisions] = useState<Revision[]>([])
  const [documents, setDocuments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [reviewAction, setReviewAction] = useState<ReviewAction | null>(null)
  const [comments, setComments] = useState('')
  const [revisionNotes, setRevisionNotes] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => { fetchData() }, [budgetId])

  async function fetchData() {
    const supabase = createClient()
    setIsLoading(true)

    const [budgetRes, itemsRes, revisionsRes, docsRes] = await Promise.all([
      supabase.from('budgets')
        .select('*, institution:institutions(name, code), program:programs(name, code), activity:activities(name, code), submitter:profiles!budgets_submitted_by_fkey(full_name, position)')
        .eq('id', budgetId).single(),
      supabase.from('budget_items').select('*').eq('budget_id', budgetId).order('sort_order'),
      supabase.from('revisions')
        .select('*, reviewer:profiles!revisions_reviewer_id_fkey(full_name)')
        .eq('budget_id', budgetId).order('created_at', { ascending: false }),
      supabase.from('budget_documents')
        .select('*')
        .eq('budget_id', budgetId).order('created_at', { ascending: false }),
    ])

    if (budgetRes.data) setBudget(budgetRes.data as unknown as Budget)
    if (itemsRes.data) setItems(itemsRes.data)
    if (revisionsRes.data) setRevisions(revisionsRes.data as unknown as Revision[])
    if (docsRes.data) setDocuments(docsRes.data)
    setIsLoading(false)
  }

  async function handleDownload(doc: any) {
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
      toast.error('Gagal membuka dokumen')
    }
  }

  async function handleReview() {
    if (!reviewAction || !profile) return
    if (!comments.trim()) { toast.error('Komentar wajib diisi'); return }

    setIsProcessing(true)
    const supabase = createClient()

    try {
      const newStatus: BudgetStatus =
        reviewAction === 'approve' ? 'approved' :
        reviewAction === 'revision' ? 'revision' : 'rejected'

      // Update budget status
      const { error: budgetError } = await supabase
        .from('budgets')
        .update({
          status: newStatus,
          reviewed_by: profile.id,
          review_date: new Date().toISOString(),
        })
        .eq('id', budgetId)

      if (budgetError) throw budgetError

      // Create revision record
      const { error: revisionError } = await supabase
        .from('revisions')
        .insert({
          budget_id: budgetId,
          reviewer_id: profile.id,
          from_status: budget!.status,
          to_status: newStatus,
          comments: comments,
          revision_notes: reviewAction === 'revision' ? revisionNotes : null,
        })

      if (revisionError) throw revisionError

      const actionLabel = reviewAction === 'approve' ? 'disetujui' :
        reviewAction === 'revision' ? 'dikembalikan untuk revisi' : 'ditolak'

      toast.success(`Pengajuan berhasil ${actionLabel}`)
      setReviewAction(null)
      setComments('')
      setRevisionNotes('')
      fetchData()
    } catch (error) {
      console.error('Error:', error)
      toast.error('Gagal memproses review')
    } finally {
      setIsProcessing(false)
    }
  }

  // Mark as under_review when admin first views submitted budget
  useEffect(() => {
    if (budget && budget.status === 'submitted' && isAdmin && profile) {
      const supabase = createClient()
      supabase.from('budgets')
        .update({ status: 'under_review', reviewed_by: profile.id })
        .eq('id', budgetId)
        .then(() => {
          supabase.from('revisions').insert({
            budget_id: budgetId,
            reviewer_id: profile.id,
            from_status: 'submitted',
            to_status: 'under_review',
            comments: 'Pengajuan sedang ditinjau oleh admin',
          })
          setBudget(prev => prev ? { ...prev, status: 'under_review' } : prev)
        })
    }
  }, [budget?.status, isAdmin])

  if (isLoading) {
    return <div className="space-y-6 max-w-5xl"><Skeleton className="h-8 w-64" /><Skeleton className="h-40 w-full" /><Skeleton className="h-60 w-full" /></div>
  }

  if (!budget) {
    return <div className="flex flex-col items-center justify-center py-20"><p>Pengajuan tidak ditemukan</p></div>
  }

  const config = statusConfig[budget.status as BudgetStatus]
  const canReview = isAdmin && ['submitted', 'under_review'].includes(budget.status)

  const actionConfig = {
    approve: { title: 'Setujui Pengajuan', description: 'Pengajuan anggaran ini akan disetujui.', color: 'bg-green-600 hover:bg-green-700 text-white', icon: CheckCircle2 },
    revision: { title: 'Minta Revisi', description: 'Pengajuan akan dikembalikan untuk diperbaiki.', color: 'bg-orange-600 hover:bg-orange-700 text-white', icon: AlertCircle },
    reject: { title: 'Tolak Pengajuan', description: 'Pengajuan anggaran ini akan ditolak.', color: 'bg-red-600 hover:bg-red-700 text-white', icon: XCircle },
  }

  const revisionStatusIcon = (status: BudgetStatus) => {
    switch (status) {
      case 'approved': return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case 'rejected': return <XCircle className="h-4 w-4 text-red-600" />
      case 'revision': return <AlertCircle className="h-4 w-4 text-orange-600" />
      case 'under_review': return <Clock className="h-4 w-4 text-yellow-600" />
      default: return <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
    }
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" asChild className="mt-1">
            <Link href="/dashboard/review"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight">{budget.title}</h1>
              <Badge className={`${config.color} border-0`}>{config.label}</Badge>
            </div>
            {budget.description && <p className="text-muted-foreground mt-1">{budget.description}</p>}
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="rounded-lg p-2 bg-primary/10"><Building2 className="h-4 w-4 text-primary" /></div>
          <div className="min-w-0"><p className="text-xs text-muted-foreground">Instansi</p><p className="text-sm font-medium truncate">{(budget as any).institution?.name || '-'}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="rounded-lg p-2 bg-chart-1/10"><FileText className="h-4 w-4 text-chart-1" /></div>
          <div className="min-w-0"><p className="text-xs text-muted-foreground">Program</p><p className="text-sm font-medium truncate">{budget.program_name || (budget as any).program?.name || '-'}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="rounded-lg p-2 bg-chart-2/10"><User className="h-4 w-4 text-chart-2" /></div>
          <div className="min-w-0"><p className="text-xs text-muted-foreground">Pengaju</p><p className="text-sm font-medium truncate">{(budget as any).submitter?.full_name || '-'}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="rounded-lg p-2 bg-chart-3/10"><CalendarDays className="h-4 w-4 text-chart-3" /></div>
          <div className="min-w-0"><p className="text-xs text-muted-foreground">Tanggal</p><p className="text-sm font-medium">{formatDate(budget.submission_date)}</p></div>
        </CardContent></Card>
      </div>

      {/* Review Action Panel */}
      {canReview && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardReviewIcon className="h-5 w-5 text-primary" />
              Panel Review
            </CardTitle>
            <CardDescription>Pilih tindakan untuk pengajuan ini</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button onClick={() => setReviewAction('approve')} className="bg-green-600 hover:bg-green-700 text-white flex-1">
                <CheckCircle2 className="mr-2 h-4 w-4" /> Setujui
              </Button>
              <Button onClick={() => setReviewAction('revision')} className="bg-orange-600 hover:bg-orange-700 text-white flex-1">
                <AlertCircle className="mr-2 h-4 w-4" /> Minta Revisi
              </Button>
              <Button onClick={() => setReviewAction('reject')} className="bg-red-600 hover:bg-red-700 text-white flex-1">
                <XCircle className="mr-2 h-4 w-4" /> Tolak
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Items Table */}
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
                    <TableCell><div className="font-medium text-sm">{item.item_name}</div>{item.specification && <p className="text-xs text-muted-foreground mt-0.5">{item.specification}</p>}</TableCell>
                    <TableCell className="text-right text-sm">{item.quantity}</TableCell>
                    <TableCell className="text-sm">{item.unit}</TableCell>
                    <TableCell className="text-right text-sm">{formatCurrency(Number(item.unit_price))}</TableCell>
                    <TableCell className="text-right font-medium text-sm">{formatCurrency(Number(item.total_price))}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={6} className="text-right font-semibold">Total</TableCell>
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
            <CardDescription>File pendukung yang dilampirkan pemohon</CardDescription>
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
      {revisions.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Riwayat Status</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {revisions.map((rev, index) => {
                const fromC = statusConfig[rev.from_status]
                const toC = statusConfig[rev.to_status]
                return (
                  <div key={rev.id} className="relative flex gap-4">
                    {index < revisions.length - 1 && <div className="absolute left-[13px] top-8 bottom-0 w-px bg-border" />}
                    <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border bg-background">
                      {revisionStatusIcon(rev.to_status)}
                    </div>
                    <div className="flex-1 min-w-0 pb-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={`${fromC.color} border-0 text-[10px]`}>{fromC.label}</Badge>
                        <ArrowRightLeft className="h-3 w-3 text-muted-foreground" />
                        <Badge className={`${toC.color} border-0 text-[10px]`}>{toC.label}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{(rev as any).reviewer?.full_name || 'System'} • {formatDateTime(rev.created_at)}</p>
                      {rev.comments && (
                        <div className="mt-2 rounded-md bg-muted/50 p-3"><div className="flex items-start gap-2"><MessageSquare className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" /><p className="text-sm">{rev.comments}</p></div></div>
                      )}
                      {rev.revision_notes && (
                        <div className="mt-2 rounded-md bg-orange-50 border border-orange-200 p-3"><p className="text-sm text-orange-800">{rev.revision_notes}</p></div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Review Dialog */}
      {reviewAction && (
        <Dialog open={!!reviewAction} onOpenChange={() => { setReviewAction(null); setComments(''); setRevisionNotes('') }}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {(() => { const Icon = actionConfig[reviewAction].icon; return <Icon className="h-5 w-5" /> })()}
                {actionConfig[reviewAction].title}
              </DialogTitle>
              <DialogDescription>{actionConfig[reviewAction].description}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="comments">Komentar / Catatan *</Label>
                <Textarea id="comments" value={comments} onChange={(e) => setComments(e.target.value)} placeholder="Tuliskan komentar untuk pengaju..." rows={3} />
              </div>
              {reviewAction === 'revision' && (
                <div className="space-y-2">
                  <Label htmlFor="revisionNotes">Catatan Revisi (Apa yang perlu diperbaiki)</Label>
                  <Textarea id="revisionNotes" value={revisionNotes} onChange={(e) => setRevisionNotes(e.target.value)} placeholder="Jelaskan poin-poin yang perlu direvisi..." rows={3} />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setReviewAction(null)}>Batal</Button>
              <Button onClick={handleReview} disabled={isProcessing} className={actionConfig[reviewAction].color}>
                {isProcessing ? <Spinner className="mr-2" /> : null}
                Konfirmasi
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

function ClipboardReviewIcon({ className }: { className?: string }) {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/></svg>
}
