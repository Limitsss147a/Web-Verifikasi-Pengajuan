'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useProfile } from '@/hooks/use-profile'
import { formatCurrency, formatDate } from '@/lib/format'
import { statusConfig, type Budget, type BudgetStatus } from '@/lib/types/database'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Archive, Search, Trash2, Eye, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'

export default function ManageBudgetsPage() {
  const { profile, isAdmin, isLoading: profileLoading } = useProfile()
  const { toast } = useToast()
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [budgetToDelete, setBudgetToDelete] = useState<Budget | null>(null)

  const fetchBudgets = useCallback(async () => {
    const supabase = createClient()
    setIsLoading(true)
    const { data } = await supabase
      .from('budgets')
      .select('*, institution:institutions(name, code), submitter:profiles!budgets_submitted_by_fkey(full_name)')
      .order('updated_at', { ascending: false })
    if (data) setBudgets(data as Budget[])
    setIsLoading(false)
  }, [])

  useEffect(() => {
    if (!profileLoading && profile && isAdmin) fetchBudgets()
  }, [profileLoading, profile, isAdmin, fetchBudgets])

  const filteredBudgets = budgets.filter(b => {
    const matchesStatus = statusFilter === 'all' || b.status === statusFilter
    const matchesSearch = !searchQuery ||
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b as any).institution?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b as any).submitter?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesSearch
  })

  async function handleDelete() {
    if (!budgetToDelete) return
    const supabase = createClient()
    setIsDeleting(true)
    const { error } = await supabase
      .from('budgets')
      .delete()
      .eq('id', budgetToDelete.id)

    setIsDeleting(false)
    setBudgetToDelete(null)

    if (error) {
      toast({
        title: 'Gagal menghapus',
        description: error.message,
        variant: 'destructive',
      })
    } else {
      setBudgets(prev => prev.filter(b => b.id !== budgetToDelete.id))
      toast({
        title: 'Pengajuan dihapus',
        description: `"${budgetToDelete.title}" berhasil dihapus dari sistem.`,
      })
    }
  }

  if (profileLoading) return <Skeleton className="h-96 w-full" />

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Archive className="h-12 w-12 text-muted-foreground/40 mb-3" />
        <h3 className="font-semibold text-lg">Akses Ditolak</h3>
        <p className="text-muted-foreground">Halaman ini hanya untuk Administrator</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kelola Pengajuan</h1>
          <p className="text-muted-foreground">Kelola seluruh pengajuan anggaran — hapus data yang tidak diperlukan lagi</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{filteredBudgets.length}</span> dari{' '}
          <span className="font-semibold text-foreground">{budgets.length}</span> pengajuan
        </div>
      </div>

      {/* Warning Banner */}
      <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
        <p>Penghapusan bersifat <strong>permanen</strong> dan tidak dapat dibatalkan. Pastikan Anda yakin sebelum menghapus pengajuan.</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari judul, instansi, atau pengaju..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-52">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="submitted">Diajukan</SelectItem>
                <SelectItem value="under_review">Sedang Ditinjau</SelectItem>
                <SelectItem value="revision">Perlu Revisi</SelectItem>
                <SelectItem value="approved">Disetujui</SelectItem>
                <SelectItem value="rejected">Ditolak</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : filteredBudgets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Archive className="h-12 w-12 text-muted-foreground/40 mb-3" />
              <h3 className="font-semibold text-lg">Tidak ada pengajuan</h3>
              <p className="text-sm text-muted-foreground">Coba ubah filter atau kata kunci pencarian</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Judul</TableHead>
                  <TableHead>Instansi</TableHead>
                  <TableHead>Pengaju</TableHead>
                  <TableHead className="text-right">Nominal</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Diperbarui</TableHead>
                  <TableHead className="w-[80px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBudgets.map((budget) => {
                  const config = statusConfig[budget.status as BudgetStatus]
                  return (
                    <TableRow key={budget.id} className="group">
                      <TableCell>
                        <Link
                          href={`/dashboard/review/${budget.id}`}
                          className="font-medium hover:underline underline-offset-4"
                        >
                          {budget.title}
                        </Link>
                        {budget.version > 1 && (
                          <span className="ml-1.5 text-xs text-muted-foreground">v{budget.version}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">{(budget as any).institution?.name || '-'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {(budget as any).submitter?.full_name || '-'}
                      </TableCell>
                      <TableCell className="text-right font-medium text-sm">
                        {formatCurrency(Number(budget.total_amount))}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${config.color} border-0 text-[11px]`}>{config.label}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(budget.updated_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                            <Link href={`/dashboard/review/${budget.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => setBudgetToDelete(budget)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!budgetToDelete} onOpenChange={(open) => !open && setBudgetToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Pengajuan?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>
                  Anda akan menghapus pengajuan <strong>"{budgetToDelete?.title}"</strong> secara permanen.
                  Semua data terkait (item anggaran, dokumen, riwayat revisi) juga akan ikut terhapus.
                </p>
                <p className="text-destructive font-medium">Tindakan ini tidak dapat dibatalkan.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
