import React, {useState} from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { useToast } from './ToastProvider'

const FEEDBACK_TYPES = [
  { value: 'bug_report', label: 'Bug Report', icon: '🐛' },
  { value: 'feature_request', label: 'Feature Request', icon: '💡' },
  { value: 'general', label: 'General Feedback', icon: '💬' }
]

export default function FeedbackForm({ onClose }){
  const [formData, setFormData] = useState({
    feedback_type: 'general',
    title: '',
    content: '',
    rating: 5
  })
  const [errors, setErrors] = useState({})
  const toast = useToast()
  const queryClient = useQueryClient()

  const submitMutation = useMutation({
    mutationFn: async (data) => {
      const res = await api.post('/user/feedback', data)
      return res.data
    },
    onSuccess: () => {
      toast({ type: 'success', message: 'Thank you for your feedback!' })
      queryClient.invalidateQueries(['notifications'])
      onClose?.()
    },
    onError: (error) => {
      const errorMsg = error.response?.data?.detail || 'Failed to submit feedback'
      setErrors({ general: errorMsg })
      toast({ type: 'error', message: errorMsg })
    }
  })

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required'
    }
    
    if (!formData.content.trim()) {
      newErrors.content = 'Message is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return
    submitMutation.mutate(formData)
  }

  const selectedType = FEEDBACK_TYPES.find(t => t.value === formData.feedback_type)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="panel p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Share Your Feedback</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {errors.general && (
            <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {errors.general}
            </div>
          )}

          {/* Feedback Type */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
              What type of feedback would you like to share?
            </label>
            <div className="grid grid-cols-1 gap-3">
              {FEEDBACK_TYPES.map(type => (
                <label
                  key={type.value}
                  className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                    formData.feedback_type === type.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-slate-200 dark:border-slate-600 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="feedback_type"
                    value={type.value}
                    checked={formData.feedback_type === type.value}
                    onChange={(e) => setFormData({...formData, feedback_type: e.target.value})}
                    className="sr-only"
                  />
                  <span className="text-xl mr-3">{type.icon}</span>
                  <span className="font-medium">{type.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className={`input ${errors.title ? 'border-red-500 focus:ring-red-500/40' : ''}`}
              placeholder={`Brief description of your ${selectedType?.label.toLowerCase()}`}
            />
            {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title}</p>}
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Message
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({...formData, content: e.target.value})}
              className={`input min-h-[120px] resize-none ${errors.content ? 'border-red-500 focus:ring-red-500/40' : ''}`}
              placeholder="Please provide details about your feedback. The more information you share, the better we can help!"
              rows={5}
            />
            {errors.content && <p className="mt-1 text-xs text-red-600">{errors.content}</p>}
          </div>

          {/* Rating */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Overall Rating
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map(rating => (
                <button
                  key={rating}
                  type="button"
                  onClick={() => setFormData({...formData, rating})}
                  className={`text-2xl transition-colors ${
                    rating <= formData.rating
                      ? 'text-yellow-400 hover:text-yellow-500'
                      : 'text-slate-300 hover:text-slate-400'
                  }`}
                >
                  ⭐
                </button>
              ))}
              <span className="ml-2 text-sm text-slate-600 dark:text-slate-400">
                {formData.rating}/5 stars
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-outline"
              disabled={submitMutation.isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 btn bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              disabled={submitMutation.isLoading}
            >
              {submitMutation.isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Sending...
                </div>
              ) : (
                'Send Feedback'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}