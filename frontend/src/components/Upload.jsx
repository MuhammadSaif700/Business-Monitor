import React, {useState} from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { useToast } from './ToastProvider'

export default function Upload(){
  const [file, setFile] = useState(null)
  const [message, setMessage] = useState('')
  const [stats, setStats] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const toast = useToast()
  const queryClient = useQueryClient()

  const resetData = async () => {
    const ok = window.confirm('This will delete ALL transactions. Continue?')
    if(!ok) return
    try{
      const res = await api.post('/admin/reset')
      const deleted = res.data?.deleted ?? 0
      toast({ type:'success', message: `Deleted ${deleted} rows` })
      setMessage(`Deleted ${deleted} rows`)
      setStats(null)
      try{
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['summary'], exact: false }),
          queryClient.invalidateQueries({ queryKey: ['ai'], exact: false }),
          queryClient.invalidateQueries({ queryKey: ['datasets'], exact: false }),
        ])
      }catch(_){/* noop */}
    }catch(e){
      const detail = e.response?.data?.detail || 'Reset failed'
      toast({ type:'error', message: detail })
      setMessage(detail)
    }
  }

  const submit = async e => {
    e.preventDefault()
    if(!file) return setMessage('Choose a file')
    if(isUploading) return
    
    setIsUploading(true)
    const form = new FormData()
    form.append('file', file)
    
    try{
      const res = await api.post('/upload', form, {headers:{'Content-Type':'multipart/form-data'}})
      const data = res.data
      setStats(data)
      
      const msg = `✅ Successfully uploaded ${data.metadata?.original_filename} with ${data.rows_inserted} rows`
      setMessage(msg)
      toast({ type:'success', message: msg })
      
      // Invalidate cached queries
      try{
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['summary'], exact: false }),
          queryClient.invalidateQueries({ queryKey: ['ai'], exact: false }),
          queryClient.invalidateQueries({ queryKey: ['datasets'], exact: false }),
        ])
      }catch(_){}
      
      // Clear file input
      setFile(null)
      const fileInput = document.querySelector('input[type="file"]')
      if(fileInput) fileInput.value = ''
      
    }catch(e){
      const detail = e.response?.data
      const msg = detail?.detail || detail?.message || 'Upload failed'
      setMessage(`❌ ${msg}`)
      toast({ type:'error', message: msg })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="upload-section">
        <div className="upload-header">Upload Your Dataset</div>
        <div className="upload-description">
          Transform your data into powerful insights with our smart analytics platform
        </div>
        
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="text-sm text-slate-600 dark:text-slate-400 font-medium">
            📁 Supported formats: CSV, Excel (.xlsx, .xls), JSON, TSV, Parquet, TXT
          </div>
          <button type="button" onClick={resetData} className="btn-reset">
            <span>🗑️</span>
            Reset Data
          </button>
        </div>
        
        <form onSubmit={submit} className="space-y-6">
          <div>
            <label className="block text-lg font-semibold mb-4 text-slate-800 dark:text-slate-200">
              Choose your data file
            </label>
            <input 
              type="file" 
              onChange={e=>setFile(e.target.files[0])} 
              className="file-input" 
              accept=".csv,.xlsx,.xls,.json,.tsv,.txt,.parquet"
              disabled={isUploading}
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            <button className="btn btn-primary text-lg px-8 py-4" disabled={!file || isUploading}>
              {isUploading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <span>🚀</span>
                  Upload & Create Dashboard
                </>
              )}
            </button>
            {file && (
              <div className="text-sm text-slate-600 dark:text-slate-400 font-medium bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-xl">
                <span className="text-green-600 dark:text-green-400">✓</span> Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </div>
            )}
          </div>
          
          {message && (
            <div className={`text-sm p-4 rounded-2xl border font-medium ${
              message.includes('✅') ? 'bg-green-50 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-400/30' :
              message.includes('❌') ? 'bg-red-50 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-400/30' :
              'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-400/30'
            }`}>
              {message}
            </div>
          )}
        </form>
      </div>
      
      {stats && stats.metadata && (
        <div className="panel p-4 space-y-3">
          <h3 className="font-semibold text-lg">📊 Dataset Created Successfully</h3>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
            <Stat label="File Name" value={stats.metadata.original_filename} />
            <Stat label="Rows" value={stats.rows_inserted} />
            <Stat label="Columns" value={stats.columns?.length || 0} />
            <Stat label="Table ID" value={stats.table_name} />
          </div>
          
          {stats.columns && stats.columns.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">📋 Detected Columns:</h4>
              <div className="flex flex-wrap gap-2">
                {stats.columns.map((col, i) => (
                  <span key={i} className="badge">
                    {col}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {stats.sample_data && stats.sample_data.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">👀 Sample Data:</h4>
              <div className="overflow-x-auto bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                <table className="min-w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      {stats.columns.map((col, i) => (
                        <th key={i} className="text-left py-2 px-3 font-medium">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {stats.sample_data.map((row, i) => (
                      <tr key={i} className="border-b border-slate-100 dark:border-slate-700/50">
                        {stats.columns.map((col, j) => (
                          <td key={j} className="py-2 px-3">
                            {String(row[col] || '').slice(0, 50)}
                            {String(row[col] || '').length > 50 && '...'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Stat({label,value}){
  return (
    <div className="panel p-2 flex flex-col gap-0.5">
      <span className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400 font-medium">{label}</span>
      <span className="font-semibold tabular-nums">{value ?? '—'}</span>
    </div>
  )
}
