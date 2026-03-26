'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useProfile } from '@/hooks/use-profile'
import { formatCurrency, formatDate } from '@/lib/format'
import { statusConfig, type Budget, type BudgetStatus } from '@/lib/types/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { FileText, Plus, Search } from 'lucide-react'
import Link from 'next/link'

export default function BudgetsPage() {
  const { profile, isAdmin, isLoading: profileLoading } = useProfile()
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (!profileLoading && profile) fetchBudgets()
  }, [profileLoading, profile])

  async function fetchBudgets() {
    const supabase = createClient()
    setIsLoading(true)

    const { data, error } = await supabase
      .from('budgets')
      .select('*, institution:institutions(name, code), program:programs(name, code), submitter:profiles!budgets_submitted_by_fkey(full_name)')
      .order('updated_at', { ascending: false })

    if (!error && data) {
      setBudgets(data as Budget[])
    }
    setIsLoading(false)
  }

  const filteredBudgets = budgets.filter(b => {
    const matchesStatus = statusFilter === 'all' || b.status === statusFilter
    const matchesSearch = !searchQuery || 
      b.title.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesSearch
  })

  if (profileLoading) {
    return <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
    </div>
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pengajuan Anggaran</h1>
          <p className="text-muted-foreground">
            {isAdmin ? 'Seluruh pengajuan anggaran dari semua instansi' : 'Kelola pengajuan anggaran instansi Anda'}
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/budgets/new">
            <Plus className="mr-2 h-4 w-4" />
            Buat Pengajuan
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari berdasarkan judul..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
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
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : filteredBudgets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <FileText className="h-12 w-12 text-muted-foreground/40 mb-3" />
              <h3 className="font-semibold text-lg">Belum ada pengajuan</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-4">
                {searchQuery || statusFilter !== 'all'
                  ? 'Tidak ada data yang cocok dengan filter.'
                  : 'Mulai buat pengajuan anggaran pertama Anda.'}
              </p>
              {!searchQuery && statusFilter === 'all' && (
                <Button asChild>
                  <Link href="/dashboard/budgets/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Buat Pengajuan Pertama
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Judul Pengajuan</TableHead>
                  {isAdmin && <TableHead>Instansi</TableHead>}
                  <TableHead>Program</TableHead>
                  <TableHead className="text-right">Nominal</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tanggal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBudgets.map((budget) => {
                  const config = statusConfig[budget.status as BudgetStatus]
                  return (
                    <TableRow key={budget.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell>
                        <Link
                          href={`/dashboard/budgets/${budget.id}`}
                          className="font-medium hover:underline underline-offset-4"
                        >
                          {budget.title}
                        </Link>
                        {budget.version > 1 && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            v{budget.version}
                          </span>
                        )}
                      </TableCell>
                      {isAdmin && (
                        <TableCell className="text-sm">
                          {(budget as any).institution?.name || '-'}
                        </TableCell>
                      )}
                      <TableCell className="text-sm text-muted-foreground">
                        {(budget as any).program?.name || '-'}
                      </TableCell>
                      <TableCell className="text-right font-medium text-sm">
                        {formatCurrency(Number(budget.total_amount))}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${config.color} border-0 text-[11px]`}>
                          {config.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(budget.updated_at)}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
