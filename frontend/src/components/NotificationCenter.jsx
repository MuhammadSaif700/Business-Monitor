import React, {useState, useEffect} from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { useToast } from './ToastProvider'

export default function NotificationCenter(){
  const [showAll, setShowAll] = useState(false)
  const toast = useToast()
  const queryClient = useQueryClient()

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', showAll ? 'all' : 'unread'],
    queryFn: async () => {
      const res = await api.get('/user/notifications', {
        params: { unread_only: !showAll }
      })
      return res.data
    },
    staleTime: 30_000,
    refetchInterval: 60_000 // Check for new notifications every minute
  })

  const markReadMutation = useMutation({
    mutationFn: async (notificationId) => {
      await api.patch(`/user/notifications/${notificationId}/read`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications'])
    }
  })

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await api.patch('/user/notifications/mark-all-read')
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications'])
      toast({ type: 'success', message: 'All notifications marked as read' })
    }
  })

  const unreadCount = notifications.filter(n => !n.read).length

  const getNotificationIcon = (type) => {
    switch(type) {
      case 'success': return '✅'
      case 'warning': return '⚠️'
      case 'error': return '❌'
      default: return 'ℹ️'
    }
  }

  const getNotificationColor = (type) => {
    switch(type) {
      case 'success': return 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
      case 'warning': return 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20'
      case 'error': return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
      default: return 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20'
    }
  }

  if (isLoading) {
    return (
      <div className="panel p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
          <div className="space-y-2">
            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded"></div>
            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="panel p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          Notifications
          {unreadCount > 0 && (
            <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
              {unreadCount}
            </span>
          )}
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAll(!showAll)}
            className="btn-outline px-3 py-1 text-sm"
          >
            {showAll ? 'Unread Only' : 'Show All'}
          </button>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllReadMutation.mutate()}
              className="btn-secondary px-3 py-1 text-sm"
              disabled={markAllReadMutation.isLoading}
            >
              Mark All Read
            </button>
          )}
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-8 text-slate-500">
          <div className="text-4xl mb-2">🔔</div>
          <p>{showAll ? 'No notifications yet' : 'No unread notifications'}</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {notifications.map(notification => (
            <div
              key={notification.id}
              className={`p-4 rounded-lg border ${getNotificationColor(notification.notification_type)} ${
                !notification.read ? 'ring-2 ring-blue-200 dark:ring-blue-800' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <span className="text-lg">{getNotificationIcon(notification.notification_type)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-slate-900 dark:text-slate-100">
                        {notification.title}
                      </h4>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      {notification.message}
                    </p>
                    <p className="text-xs text-slate-500 mt-2">
                      {new Date(notification.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                {!notification.read && (
                  <button
                    onClick={() => markReadMutation.mutate(notification.id)}
                    className="btn-outline px-2 py-1 text-xs ml-2"
                    disabled={markReadMutation.isLoading}
                  >
                    Mark Read
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}