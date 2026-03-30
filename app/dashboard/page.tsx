'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useProfile } from '@/hooks/use-profile'
import { formatCurrency, formatCompactNumber, formatDate } from '@/lib/format'
import { statusConfig, type Budget, type BudgetStatus } from '@/lib/types/database'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { Bar, BarChart, XAxis, YAxis, Pie, PieChart, Cell, ResponsiveContainer } from 'recharts'
import {
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  TrendingUp,
  Building2,
  ArrowUpRight,
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface DashboardStats {
  total: number
  submitted: number
  underReview: number
  revision: number
  approved: number
  rejected: number
  draft: number
  totalAmount: number
  approvedAmount: number
}

const statusChartConfig: ChartConfig = {
  draft: { label: 'Draft', color: 'var(--color-muted-foreground)' },
  submitted: { label: 'Diajukan', color: 'var(--color-chart-1)' },
  under_review: { label: 'Ditinjau', color: 'var(--color-chart-3)' },
  revision: { label: 'Revisi', color: 'var(--color-chart-4)' },
  approved: { label: 'Disetujui', color: 'var(--color-chart-2)' },
  rejected: { label: 'Ditolak', color: 'var(--color-destructive)' },
}

export default function DashboardPage() {
  const { profile, isAdmin, isLoading: profileLoading } = useProfile()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentBudgets, setRecentBudgets] = useState<Budget[]>([])
  const [statusData, setStatusData] = useState<{ status: string; count: number; fill: string }[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!profileLoading && profile) {
      fetchDashboardData()
    }
  }, [profileLoading, profile])

  async function fetchDashboardData() {
    const supabase = createClient()
    setIsLoading(true)

    try {
      // Fetch budgets
      const { data: budgets } = await supabase
        .from('budgets')
        .select('*, institution:institutions(name, code), submitter:profiles!budgets_submitted_by_fkey(full_name)')
        .order('updated_at', { ascending: false })

      if (budgets) {
        const total = budgets.length
        const submitted = budgets.filter(b => b.status === 'submitted').length
        const underReview = budgets.filter(b => b.status === 'under_review').length
        const revision = budgets.filter(b => b.status === 'revision').length
        const approved = budgets.filter(b => b.status === 'approved').length
        const rejected = budgets.filter(b => b.status === 'rejected').length
        const draft = budgets.filter(b => b.status === 'draft').length
        const totalAmount = budgets.reduce((sum, b) => sum + Number(b.total_amount), 0)
        const approvedAmount = budgets
          .filter(b => b.status === 'approved')
          .reduce((sum, b) => sum + Number(b.total_amount), 0)

        setStats({
          total, submitted, underReview, revision, approved, rejected, draft,
          totalAmount, approvedAmount,
        })

        setRecentBudgets(budgets.slice(0, 5) as Budget[])

        // Pie chart data
        const chartData = [
          { status: 'Draft', count: draft, fill: 'var(--color-muted-foreground)' },
          { status: 'Diajukan', count: submitted, fill: 'var(--color-chart-1)' },
          { status: 'Ditinjau', count: underReview, fill: 'var(--color-chart-3)' },
          { status: 'Revisi', count: revision, fill: 'var(--color-chart-4)' },
          { status: 'Disetujui', count: approved, fill: 'var(--color-chart-2)' },
          { status: 'Ditolak', count: rejected, fill: 'var(--color-destructive)' },
        ].filter(d => d.count > 0)

        setStatusData(chartData)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (profileLoading || isLoading) {
    return <DashboardSkeleton />
  }

  const statCards = isAdmin
    ? [
        {
          title: 'Total Pengajuan',
          value: stats?.total || 0,
          icon: FileText,
          description: 'Seluruh pengajuan anggaran',
          color: 'text-chart-1',
          bg: 'bg-chart-1/10',
        },
        {
          title: 'Menunggu Verifikasi',
          value: (stats?.submitted || 0) + (stats?.underReview || 0),
          icon: Clock,
          description: 'Perlu ditinjau',
          color: 'text-chart-3',
          bg: 'bg-chart-3/10',
        },
        {
          title: 'Disetujui',
          value: stats?.approved || 0,
          icon: CheckCircle2,
          description: formatCurrency(stats?.approvedAmount || 0),
          color: 'text-chart-2',
          bg: 'bg-chart-2/10',
        },
        {
          title: 'Total Anggaran',
          value: formatCompactNumber(stats?.totalAmount || 0),
          icon: TrendingUp,
          description: 'Seluruh pengajuan',
          color: 'text-primary',
          bg: 'bg-primary/10',
          isText: true,
        },
      ]
    : [
        {
          title: 'Total Pengajuan',
          value: stats?.total || 0,
          icon: FileText,
          description: 'Pengajuan Anda',
          color: 'text-chart-1',
          bg: 'bg-chart-1/10',
        },
        {
          title: 'Disetujui',
          value: stats?.approved || 0,
          icon: CheckCircle2,
          description: formatCurrency(stats?.approvedAmount || 0),
          color: 'text-chart-2',
          bg: 'bg-chart-2/10',
        },
        {
          title: 'Perlu Revisi',
          value: stats?.revision || 0,
          icon: AlertCircle,
          description: 'Segera perbaiki',
          color: 'text-chart-4',
          bg: 'bg-chart-4/10',
        },
        {
          title: 'Ditolak',
          value: stats?.rejected || 0,
          icon: XCircle,
          description: 'Tidak dapat diproses',
          color: 'text-destructive',
          bg: 'bg-destructive/10',
        },
      ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Selamat datang, {profile?.full_name?.split(' ')[0]}!
            {profile?.institution?.name && (
              <span className="ml-1 text-foreground/70">— {profile.institution.name}</span>
            )}
          </p>
        </div>
        {!isAdmin && (
          <Button asChild>
            <Link href="/dashboard/budgets/new">
              <FileText className="mr-2 h-4 w-4" />
              Buat Pengajuan
            </Link>
          </Button>
        )}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {statCards.map((card) => (
          <Card key={card.title} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2 sm:p-6 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground line-clamp-1">
                {card.title}
              </CardTitle>
              <div className={`rounded-lg p-1.5 sm:p-2 ${card.bg}`}>
                <card.icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
              <div className="text-lg sm:text-2xl font-bold truncate">
                {card.isText ? card.value : card.value.toLocaleString('id-ID')}
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 line-clamp-1">{card.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts & Table Row */}
      <div className="flex overflow-x-auto pb-6 pt-2 gap-4 -mx-4 px-4 snap-x snap-mandatory lg:grid lg:grid-cols-5 lg:overflow-visible lg:p-0 lg:mx-0 lg:flex-none hide-scrollbar">
        {/* Status Chart */}
        <div className="w-[85vw] max-w-sm shrink-0 snap-center lg:w-auto lg:max-w-none lg:col-span-2">
          <Card className="h-full relative overflow-hidden">
            <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base">Status Pengajuan</CardTitle>
            <CardDescription>Distribusi status anggaran</CardDescription>
          </CardHeader>
          <CardContent>
            {statusData.length > 0 ? (
              <div className="space-y-4">
                <ChartContainer config={statusChartConfig} className="mx-auto aspect-square max-h-[220px]">
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Pie
                      data={statusData}
                      dataKey="count"
                      nameKey="status"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
                <div className="flex flex-wrap gap-3 justify-center">
                  {statusData.map((d) => (
                    <div key={d.status} className="flex items-center gap-1.5 text-xs">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.fill }} />
                      <span className="text-muted-foreground">{d.status}</span>
                      <span className="font-semibold">{d.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
                Belum ada data pengajuan
              </div>
            )}
          </CardContent>
          </Card>
        </div>

        {/* Recent Budgets Table */}
        <div className="w-[85vw] shrink-0 snap-center lg:w-auto lg:col-span-3">
          <Card className="h-full relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between p-4 sm:p-6">
            <div>
              <CardTitle className="text-base">Pengajuan Terbaru</CardTitle>
              <CardDescription>
                {isAdmin ? 'Pengajuan terbaru dari seluruh instansi' : 'Pengajuan anggaran terbaru Anda'}
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href={isAdmin ? '/dashboard/review' : '/dashboard/budgets'}>
                Lihat Semua
                <ArrowUpRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentBudgets.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Judul</TableHead>
                    {isAdmin && <TableHead>Instansi</TableHead>}
                    <TableHead className="text-right">Nominal</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentBudgets.map((budget) => {
                    const config = statusConfig[budget.status as BudgetStatus]
                    return (
                      <TableRow key={budget.id}>
                        <TableCell>
                          <Link
                            href={`/dashboard/${isAdmin ? 'review' : 'budgets'}/${budget.id}`}
                            className="font-medium hover:underline underline-offset-4"
                          >
                            {budget.title}
                          </Link>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {formatDate(budget.updated_at)}
                          </p>
                        </TableCell>
                        {isAdmin && (
                          <TableCell className="text-sm text-muted-foreground">
                            {(budget as any).institution?.name || '-'}
                          </TableCell>
                        )}
                        <TableCell className="text-right font-medium text-sm">
                          {formatCurrency(Number(budget.total_amount))}
                        </TableCell>
                        <TableCell>
                          <Badge className={`${config.color} border-0 text-[11px]`}>
                            {config.label}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
                <div className="text-center">
                  <FileText className="mx-auto h-8 w-8 mb-2 opacity-50" />
                  <p>Belum ada pengajuan</p>
                  {!isAdmin && (
                    <Button variant="link" size="sm" asChild className="mt-1">
                      <Link href="/dashboard/budgets/new">Buat pengajuan pertama</Link>
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72 mt-2" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-7 w-16" />
              <Skeleton className="h-3 w-32 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader><Skeleton className="h-5 w-32" /></CardHeader>
          <CardContent><Skeleton className="h-[220px] rounded-lg" /></CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader><Skeleton className="h-5 w-40" /></CardHeader>
          <CardContent>
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full mb-2" />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
