'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useProfile } from '@/hooks/use-profile'
import { formatDate } from '@/lib/format'
import { statusConfig, type Budget, type BudgetStatus } from '@/lib/types/database'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { ClipboardCheck, Search, Eye } from 'lucide-react'
import Link from 'next/link'

export default function ReviewPage() {
  const { profile, isAdmin, isLoading: profileLoading } = useProfile()
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (!profileLoading && profile && isAdmin) fetchBudgets()
  }, [profileLoading, profile])

  async function fetchBudgets() {
    const supabase = createClient()
    setIsLoading(true)

    const { data } = await supabase
      .from('budgets')
      .select('*, institution:institutions(name, code), submitter:profiles!budgets_submitted_by_fkey(full_name)')
      .in('status', ['submitted', 'under_review', 'revision', 'approved', 'rejected'])
      .order('updated_at', { ascending: false })

    if (data) setBudgets(data as Budget[])
    setIsLoading(false)
  }

  const filteredBudgets = budgets.filter(b => {
    const matchesStatus = statusFilter === 'all'
      ? true
      : statusFilter === 'pending'
        ? ['submitted', 'under_review'].includes(b.status)
        : b.status === statusFilter
    const matchesSearch = !searchQuery ||
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b as any).institution?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesSearch
  })

  if (profileLoading) return <Skeleton className="h-96 w-full" />

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <ClipboardCheck className="h-12 w-12 text-muted-foreground/40 mb-3" />
        <h3 className="font-semibold text-lg">Akses Ditolak</h3>
        <p className="text-muted-foreground">Halaman ini hanya untuk Administrator</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Verifikasi RKA/DPA</h1>
        <p className="text-muted-foreground">Review dan verifikasi pengajuan RKA/DPA dari seluruh instansi</p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Cari judul atau instansi..." className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-52">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Menunggu Review</SelectItem>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="submitted">Diajukan</SelectItem>
                <SelectItem value="under_review">Sedang Ditinjau</SelectItem>
                <SelectItem value="revision">Revisi</SelectItem>
                <SelectItem value="approved">Disetujui</SelectItem>
                <SelectItem value="rejected">Ditolak</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : filteredBudgets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <ClipboardCheck className="h-12 w-12 text-muted-foreground/40 mb-3" />
              <h3 className="font-semibold text-lg">Tidak ada pengajuan</h3>
              <p className="text-sm text-muted-foreground">Belum ada pengajuan yang perlu diverifikasi</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Judul</TableHead>
                  <TableHead>Instansi</TableHead>
                  <TableHead>Pengaju</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead className="w-[60px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBudgets.map((budget) => {
                  const config = statusConfig[budget.status as BudgetStatus]
                  return (
                    <TableRow key={budget.id}>
                      <TableCell>
                        <Link href={`/dashboard/review/${budget.id}`} className="font-medium hover:underline underline-offset-4">
                          {budget.title}
                        </Link>
                        {budget.version > 1 && <span className="ml-1.5 text-xs text-muted-foreground">v{budget.version}</span>}
                      </TableCell>
                      <TableCell className="text-sm">{(budget as any).institution?.name || '-'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{(budget as any).submitter?.full_name || '-'}</TableCell>
                      <TableCell><Badge className={`${config.color} border-0 text-[11px]`}>{config.label}</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(budget.submission_date || budget.updated_at)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                          <Link href={`/dashboard/review/${budget.id}`}><Eye className="h-4 w-4" /></Link>
                        </Button>
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
