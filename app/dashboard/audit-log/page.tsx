'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useProfile } from '@/hooks/use-profile'
import { formatDateTime } from '@/lib/format'
import type { AuditLog } from '@/lib/types/database'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ScrollText, Search, Eye } from 'lucide-react'

export default function AuditLogPage() {
  const { isAdmin, isLoading: profileLoading } = useProfile()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [actionFilter, setActionFilter] = useState<string>('all')
  const [tableFilter, setTableFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)

  useEffect(() => {
    if (!profileLoading && isAdmin) fetchLogs()
  }, [profileLoading, isAdmin])

  async function fetchLogs() {
    const supabase = createClient()
    setIsLoading(true)
    const { data } = await supabase
      .from('audit_logs')
      .select('*, user:profiles!audit_logs_user_id_fkey(full_name)')
      .order('created_at', { ascending: false })
      .limit(200)
    if (data) setLogs(data as unknown as AuditLog[])
    setIsLoading(false)
  }

  const filtered = logs.filter(log => {
    const matchesAction = actionFilter === 'all' || log.action === actionFilter
    const matchesTable = tableFilter === 'all' || log.table_name === tableFilter
    const matchesSearch = !searchQuery ||
      (log.user as any)?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.table_name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesAction && matchesTable && matchesSearch
  })

  const tables = [...new Set(logs.map(l => l.table_name))]

  const actionColor: Record<string, string> = {
    INSERT: 'bg-green-100 text-green-800',
    UPDATE: 'bg-blue-100 text-blue-800',
    DELETE: 'bg-red-100 text-red-800',
  }

  if (!isAdmin && !profileLoading) {
    return <div className="flex flex-col items-center justify-center py-20"><ScrollText className="h-12 w-12 text-muted-foreground/40 mb-3" /><h3 className="font-semibold text-lg">Akses Ditolak</h3></div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Audit Log</h1>
        <p className="text-muted-foreground">Rekam jejak semua perubahan data dalam sistem</p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Cari berdasarkan user..." className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-full sm:w-36"><SelectValue placeholder="Aksi" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Aksi</SelectItem>
                <SelectItem value="INSERT">INSERT</SelectItem>
                <SelectItem value="UPDATE">UPDATE</SelectItem>
                <SelectItem value="DELETE">DELETE</SelectItem>
              </SelectContent>
            </Select>
            <Select value={tableFilter} onValueChange={setTableFilter}>
              <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Tabel" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Tabel</SelectItem>
                {tables.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">{[...Array(8)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <ScrollText className="h-12 w-12 text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground">Tidak ada log ditemukan</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Waktu</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Aksi</TableHead>
                  <TableHead>Tabel</TableHead>
                  <TableHead>Record ID</TableHead>
                  <TableHead className="w-[60px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((log) => (
                  <TableRow key={log.id} className="text-sm">
                    <TableCell className="text-muted-foreground whitespace-nowrap">{formatDateTime(log.created_at)}</TableCell>
                    <TableCell className="font-medium">{(log as any).user?.full_name || 'System'}</TableCell>
                    <TableCell><Badge className={`${actionColor[log.action] || 'bg-gray-100 text-gray-800'} border-0 text-[10px]`}>{log.action}</Badge></TableCell>
                    <TableCell className="font-mono text-xs">{log.table_name}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{log.record_id?.slice(0, 8)}...</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelectedLog(log)}>
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detail Audit Log</DialogTitle>
            <DialogDescription>{formatDateTime(selectedLog?.created_at || '')}</DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">User:</span> <span className="font-medium">{(selectedLog as any).user?.full_name || 'System'}</span></div>
                <div><span className="text-muted-foreground">Aksi:</span> <Badge className={`${actionColor[selectedLog.action] || ''} border-0 text-[10px] ml-1`}>{selectedLog.action}</Badge></div>
                <div><span className="text-muted-foreground">Tabel:</span> <span className="font-mono">{selectedLog.table_name}</span></div>
                <div><span className="text-muted-foreground">Record:</span> <span className="font-mono text-xs">{selectedLog.record_id}</span></div>
              </div>
              {selectedLog.old_data && (
                <div>
                  <p className="text-sm font-medium mb-1 text-muted-foreground">Data Lama:</p>
                  <ScrollArea className="max-h-40">
                    <pre className="bg-muted rounded-md p-3 text-xs overflow-x-auto">{JSON.stringify(selectedLog.old_data, null, 2)}</pre>
                  </ScrollArea>
                </div>
              )}
              {selectedLog.new_data && (
                <div>
                  <p className="text-sm font-medium mb-1 text-muted-foreground">Data Baru:</p>
                  <ScrollArea className="max-h-40">
                    <pre className="bg-muted rounded-md p-3 text-xs overflow-x-auto">{JSON.stringify(selectedLog.new_data, null, 2)}</pre>
                  </ScrollArea>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
