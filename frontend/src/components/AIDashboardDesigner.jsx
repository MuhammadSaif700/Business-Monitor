import React, {useEffect, useState} from 'react'
import { api } from '../lib/api'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import AIDashboardRenderer from './AIDashboardRenderer'
import { addDashboardHistory, getDashboardHistory, removeDashboardHistory } from '../lib/history'

const LS_KEY = 'ai_dashboard_config'

export default function AIDashboardDesigner(){
  const [prompt, setPrompt] = useState('Create a dashboard with sales over time, top 5 products by amount, and sales share by region.')
  const [config, setConfig] = useState(null)
  const [preview, setPreview] = useState(null)
  const [aiError, setAiError] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [history, setHistory] = useState([])

  useEffect(()=>{ setHistory(getDashboardHistory()) },[])

  const generate = async ()=>{
    setLoading(true); setAiError(''); setStatus('Requesting AI config...')
    try{
      const res = await api.post('/ai/dashboard_config', { prompt })
      if(res.data.ai_error){ setAiError(res.data.ai_error); setPreview(null) }
      else{ setPreview(res.data.config) }
    }catch(e){
      const code = e?.response?.status
      if(code === 401){
        setAiError('Not authorized. Please login first (top-right).')
      }else{
        setAiError(e?.response?.data?.detail || 'Failed to generate config')
      }
    }finally{ setLoading(false) }
  }

  const applyConfig = ()=>{
    if(preview){
      setConfig(preview)
      setHistory(addDashboardHistory({ name: preview?.name || (preview?.charts?.[0]?.title || 'Dashboard'), prompt, config: preview }))
    }
  }
  const clearConfig = ()=>{ setConfig(null) }

  const testAI = async ()=>{
    setStatus('Testing AI...'); setAiError('')
    try{
      const res = await api.get('/ai/test')
      if(res.data.status === 'ok'){
        setStatus(`AI OK${res.data.model? ' ('+res.data.model+')':''}`)
      }else{
        setAiError(res.data.detail || 'AI test returned error')
        setStatus('')
      }
    }catch(e){
      const code = e?.response?.status
      if(code === 401){ setAiError('Not authorized. Please login first (top-right).') }
      else{ setAiError(e?.response?.data?.detail || 'Failed to reach /ai/test') }
      setStatus('')
    }
  }

  return (
    <div className="space-y-6">
      <div className="panel p-4 space-y-3">
        <h2 className="text-lg font-semibold">AI Dashboard Designer</h2>
        <p className="text-sm text-slate-600 dark:text-slate-300">Describe the dashboard you want. The AI will propose a layout you can preview and apply.</p>
        <textarea value={prompt} onChange={e=>setPrompt(e.target.value)} rows={3} className="w-full border rounded p-2 font-mono" />
        <div className="flex flex-wrap gap-2 items-center">
          <button onClick={generate} className="btn-primary px-3 py-1" disabled={loading}>{loading? 'Thinking…':'Generate'}</button>
          <button onClick={applyConfig} className="btn-secondary px-3 py-1" disabled={!preview}>Apply</button>
          <button onClick={clearConfig} className="btn-outline px-3 py-1">Clear</button>
          <button onClick={testAI} className="btn-outline px-3 py-1">Test AI</button>
          {status && <span className="text-xs text-slate-500">{status}</span>}
        </div>
        {aiError && (
          <div className="mt-2 text-xs px-2 py-1 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">{aiError}</div>
        )}
        {preview && (
          <details className="mt-2">
            <summary className="cursor-pointer text-sm">Preview JSON</summary>
            <pre className="text-xs bg-slate-900 text-slate-100 p-2 rounded overflow-auto">{JSON.stringify(preview, null, 2)}</pre>
          </details>
        )}
      </div>

      <div className="panel p-4">
        <div className="flex gap-2 items-center mb-3 text-sm">
          <label>From</label>
          <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className="border p-1 rounded" />
          <label>To</label>
          <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} className="border p-1 rounded" />
        </div>
        {config ? (
          <AIDashboardRenderer config={config} startDate={startDate} endDate={endDate} />
        ) : (
          <div className="text-slate-500">No dashboard applied. Use the designer above to generate and apply one.</div>
        )}
      </div>

      {/* History */}
      <div className="panel p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">Saved Dashboards</h3>
        </div>
        {history.length === 0 ? (
          <div className="text-sm text-slate-500">No saved dashboards yet.</div>
        ) : (
          <ul className="space-y-2">
            {history.map(h => (
              <li key={h.id} className="border dark:border-slate-700 rounded p-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">{h.name || 'Dashboard'}</div>
                    <div className="text-xs text-slate-500">{new Date(h.ts).toLocaleString()}</div>
                  </div>
                  <div className="flex gap-2">
                    <button className="text-xs btn-outline px-2 py-1" onClick={()=> setConfig(h.config)}>Apply</button>
                    <button className="text-xs btn-outline px-2 py-1" onClick={()=> setPreview(h.config)}>Preview</button>
                    <button className="text-xs btn-outline px-2 py-1" onClick={()=> setHistory(removeDashboardHistory(h.id))}>Delete</button>
                  </div>
                </div>
                {h.prompt && <details className="mt-2"><summary className="cursor-pointer text-xs">Prompt</summary><div className="text-xs whitespace-pre-wrap">{h.prompt}</div></details>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
