import React, {useState, useEffect} from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { useToast } from './ToastProvider'
import NotificationCenter from './NotificationCenter'

export default function UserProfile(){
  const [activeTab, setActiveTab] = useState('profile')
  const [editMode, setEditMode] = useState(false)
  const [formData, setFormData] = useState({})
  const toast = useToast()
  const queryClient = useQueryClient()

  const { data: user, isLoading } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const res = await api.get('/user/profile')
      return res.data
    },
    staleTime: 300_000
  })

  const { data: activities = [] } = useQuery({
    queryKey: ['user-activities'],
    queryFn: async () => {
      const res = await api.get('/user/activities')
      return res.data
    },
    staleTime: 60_000,
    enabled: activeTab === 'activity'
  })

  const updateProfileMutation = useMutation({
    mutationFn: async (data) => {
      const res = await api.patch('/user/profile', data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['user-profile'])
      setEditMode(false)
      toast({ type: 'success', message: 'Profile updated successfully' })
    },
    onError: (error) => {
      toast({ type: 'error', message: error.response?.data?.detail || 'Failed to update profile' })
    }
  })

  useEffect(() => {
    if (user && !formData.email) {
      setFormData({
        email: user.email || '',
        username: user.username || '',
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        company: user.company || ''
      })
    }
  }, [user, formData.email])

  const handleSaveProfile = () => {
    updateProfileMutation.mutate(formData)
  }

  const getActivityIcon = (type) => {
    switch(type) {
      case 'login': return '🔐'
      case 'upload': return '📊'
      case 'query': return '🔍'
      case 'dashboard_create': return '📈'
      case 'registration': return '✨'
      default: return '📝'
    }
  }

  const formatActivityTime = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'activity', label: 'Activity', icon: '📊' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'preferences', label: 'Preferences', icon: '⚙️' }
  ]

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="panel p-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
            <div className="space-y-4">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded"></div>
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="panel p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </div>
            <div>
              <h1 className="text-2xl font-bold">
                {user?.first_name} {user?.last_name}
              </h1>
              <p className="text-slate-600 dark:text-slate-400">@{user?.username}</p>
              <p className="text-sm text-slate-500">
                Member since {new Date(user?.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-slate-500">Last login</div>
            <div className="font-medium">
              {user?.last_login ? new Date(user.last_login).toLocaleString() : 'Never'}
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="panel p-4">
            <nav className="space-y-2">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-3 transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {activeTab === 'profile' && (
            <div className="panel p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Profile Information</h2>
                <button
                  onClick={() => editMode ? setEditMode(false) : setEditMode(true)}
                  className="btn-outline px-4 py-2"
                >
                  {editMode ? 'Cancel' : 'Edit Profile'}
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Email Address
                    </label>
                    {editMode ? (
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="input"
                      />
                    ) : (
                      <p className="text-slate-900 dark:text-slate-100">{user?.email}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Username
                    </label>
                    {editMode ? (
                      <input
                        type="text"
                        value={formData.username}
                        onChange={(e) => setFormData({...formData, username: e.target.value})}
                        className="input"
                      />
                    ) : (
                      <p className="text-slate-900 dark:text-slate-100">@{user?.username}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      First Name
                    </label>
                    {editMode ? (
                      <input
                        type="text"
                        value={formData.first_name}
                        onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                        className="input"
                      />
                    ) : (
                      <p className="text-slate-900 dark:text-slate-100">{user?.first_name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Last Name
                    </label>
                    {editMode ? (
                      <input
                        type="text"
                        value={formData.last_name}
                        onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                        className="input"
                      />
                    ) : (
                      <p className="text-slate-900 dark:text-slate-100">{user?.last_name}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Company
                    </label>
                    {editMode ? (
                      <input
                        type="text"
                        value={formData.company}
                        onChange={(e) => setFormData({...formData, company: e.target.value})}
                        className="input"
                      />
                    ) : (
                      <p className="text-slate-900 dark:text-slate-100">{user?.company || 'Not specified'}</p>
                    )}
                  </div>
                </div>

                {editMode && (
                  <div className="flex gap-3 pt-6 border-t">
                    <button
                      onClick={handleSaveProfile}
                      disabled={updateProfileMutation.isLoading}
                      className="btn bg-blue-600 hover:bg-blue-700 text-white px-6"
                    >
                      {updateProfileMutation.isLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="panel p-6">
              <h2 className="text-xl font-semibold mb-6">Recent Activity</h2>
              {activities.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <div className="text-4xl mb-2">📊</div>
                  <p>No activity recorded yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activities.map(activity => (
                    <div key={activity.id} className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <span className="text-2xl">{getActivityIcon(activity.activity_type)}</span>
                      <div className="flex-1">
                        <p className="font-medium">{activity.description}</p>
                        <p className="text-sm text-slate-500">
                          {formatActivityTime(activity.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'notifications' && <NotificationCenter />}

          {activeTab === 'preferences' && (
            <div className="panel p-6">
              <h2 className="text-xl font-semibold mb-6">Preferences</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium mb-3">Theme</h3>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3">
                      <input type="radio" name="theme" className="text-blue-600" />
                      <span>Light mode</span>
                    </label>
                    <label className="flex items-center gap-3">
                      <input type="radio" name="theme" className="text-blue-600" />
                      <span>Dark mode</span>
                    </label>
                    <label className="flex items-center gap-3">
                      <input type="radio" name="theme" className="text-blue-600" defaultChecked />
                      <span>System preference</span>
                    </label>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-3">Notifications</h3>
                  <div className="space-y-3">
                    <label className="flex items-center justify-between">
                      <span>Email notifications</span>
                      <input type="checkbox" className="text-blue-600" defaultChecked />
                    </label>
                    <label className="flex items-center justify-between">
                      <span>Dashboard updates</span>
                      <input type="checkbox" className="text-blue-600" defaultChecked />
                    </label>
                    <label className="flex items-center justify-between">
                      <span>Security alerts</span>
                      <input type="checkbox" className="text-blue-600" defaultChecked />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}