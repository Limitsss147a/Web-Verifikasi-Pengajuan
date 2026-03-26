'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatRelativeTime } from '@/lib/format'
import type { Notification } from '@/lib/types/database'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Bell, BellOff, CheckCheck } from 'lucide-react'
import Link from 'next/link'

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => { fetchNotifications() }, [])

  async function fetchNotifications() {
    const supabase = createClient()
    setIsLoading(true)
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
    if (data) setNotifications(data)
    setIsLoading(false)
  }

  async function markAsRead(id: string) {
    const supabase = createClient()
    await supabase.from('notifications').update({ is_read: true, read_at: new Date().toISOString() }).eq('id', id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
  }

  async function markAllAsRead() {
    const supabase = createClient()
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id)
    if (unreadIds.length === 0) return
    await supabase.from('notifications').update({ is_read: true, read_at: new Date().toISOString() }).in('id', unreadIds)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    toast.success('Semua notifikasi ditandai sudah dibaca')
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  const typeIcon: Record<string, string> = {
    approval: '✅', rejection: '❌', revision_request: '🔄',
    status_change: '📋', info: 'ℹ️', warning: '⚠️',
  }

  const typeColor: Record<string, string> = {
    approval: 'bg-green-100 text-green-800',
    rejection: 'bg-red-100 text-red-800',
    revision_request: 'bg-orange-100 text-orange-800',
    status_change: 'bg-blue-100 text-blue-800',
    info: 'bg-gray-100 text-gray-800',
    warning: 'bg-yellow-100 text-yellow-800',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifikasi</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} belum dibaca` : 'Semua sudah dibaca'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllAsRead}>
            <CheckCheck className="mr-2 h-4 w-4" /> Tandai Semua Dibaca
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
      ) : notifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <BellOff className="h-12 w-12 text-muted-foreground/40 mb-3" />
            <h3 className="font-semibold text-lg">Belum ada notifikasi</h3>
            <p className="text-sm text-muted-foreground">Notifikasi akan muncul ketika ada perubahan status</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => (
            <Card
              key={notif.id}
              className={`transition-colors cursor-pointer hover:bg-muted/50 ${!notif.is_read ? 'border-primary/30 bg-primary/5' : ''}`}
            >
              <CardContent className="p-4">
                <button
                  className="w-full text-left"
                  onClick={() => { if (!notif.is_read) markAsRead(notif.id) }}
                >
                  <div className="flex gap-3">
                    <span className="text-xl mt-0.5 shrink-0">{typeIcon[notif.type] || '📋'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-sm">{notif.title}</h3>
                        <Badge className={`${typeColor[notif.type] || ''} border-0 text-[10px]`}>
                          {notif.type === 'revision_request' ? 'Revisi' :
                           notif.type === 'approval' ? 'Disetujui' :
                           notif.type === 'rejection' ? 'Ditolak' :
                           notif.type === 'status_change' ? 'Status' :
                           notif.type === 'warning' ? 'Peringatan' : 'Info'}
                        </Badge>
                        {!notif.is_read && (
                          <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{notif.message}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-muted-foreground/70">
                          {formatRelativeTime(notif.created_at)}
                        </span>
                        {notif.related_budget_id && (
                          <Link
                            href={`/dashboard/budgets/${notif.related_budget_id}`}
                            className="text-xs text-primary hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Lihat pengajuan →
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
