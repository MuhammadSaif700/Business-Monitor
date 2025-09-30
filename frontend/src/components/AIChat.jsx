import React, {useEffect, useState} from 'react'
import { api } from '../lib/api'
import SalesLineChart from './SalesLineChart'
import ProfitBarChart from './ProfitBarChart'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { addAiChatHistory, getAiChatHistory, clearAiChatHistory } from '../lib/history'

export default function AIChat({ compact = false }){
  const [query, setQuery] = useState('')
  const [answer, setAnswer] = useState('')
  const [aiError, setAiError] = useState('')
  const [chartData, setChartData] = useState(null)
  const [chartType, setChartType] = useState(null)
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState([])

  useEffect(()=>{ setHistory(getAiChatHistory()) },[])

  const detectAnalytics = (q) => {
    const s = q.toLowerCase()
    if(s.includes('most profitable') || s.includes('most profitable product') || s.includes('profitable product')) return 'most_profitable_product'
    if(s.includes('sales over time') || s.includes('sales this') || s.includes('sales by')) return 'sales_over_time'
    return null
  }

  const ask = async () => {
    if(!query) return
    setAnswer('')
    setChartData(null)
    setChartType(null)
    setLoading(true)
    setAiError('')
    try{
      const intent = detectAnalytics(query)
      if(intent){
        const res = await api.get('/ai/query', { params: { query: intent } })
        if(res.data && res.data.data){
          setChartData(res.data.data)
          setChartType(intent)
          setAnswer(res.data.narrative || '')
          if(res.data.ai_error) setAiError(res.data.ai_error)
          setHistory(addAiChatHistory({ query, answer: res.data.narrative || '', aiError: res.data.ai_error || '', chartType: intent }))
        }else{
          setAnswer('No data returned')
        }
      }else{
        const res = await api.post('/ai/nl_query', { prompt: query })
        setAnswer(res.data.narrative)
        if(res.data.ai_error) setAiError(res.data.ai_error)
        if(res.data.query && res.data.data){
          const q = res.data.query
          setChartType(q)
          setChartData(res.data.data)
        }
        setHistory(addAiChatHistory({ query, answer: res.data.narrative || '', aiError: res.data.ai_error || '', chartType: res.data.query }))
      }
    }catch(e){
      console.error(e)
  const msg = e?.response?.data?.detail || e?.response?.data?.error || (e?.response?.status ? `AI request failed (HTTP ${e.response.status})` : 'AI request failed')
  setAiError(msg)
    }finally{
      setLoading(false)
    }
  }

  const suggestions = [
    'Show me the strongest sales trend this quarter',
    'Which customer segment has the highest revenue?',
    'What product drove the most profit last month?'
  ]

  const outerClass = compact ? 'panel p-0 overflow-hidden max-w-md' : 'panel p-0 overflow-hidden'
  const headerClass = compact ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white px-4 py-3' : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white px-6 py-5'

  return (
    <div className={outerClass}>
      <div className={headerClass}>
        <h3 className={compact ? 'text-sm font-semibold' : 'text-lg font-semibold'}>AI Insights Assistant</h3>
        {!compact && <p className="text-sm opacity-80 mt-1">Ask questions in plain language and get instant, data-backed answers.</p>}
      </div>
      <div className={compact ? 'p-3 space-y-3' : 'p-6 space-y-5'}>
        <div className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={query}
              onChange={e=>setQuery(e.target.value)}
              className="input flex-1"
              placeholder="e.g. Which region performed best last quarter?"
            />
            <button
              onClick={ask}
              className="btn btn-primary min-w-[120px]"
              disabled={!query || loading}
            >
              {loading ? 'Thinking…' : 'Ask' }
            </button>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            {suggestions.map(s => (
              <button key={s} onClick={()=>setQuery(s)} className="btn-outline text-xs px-3 py-1.5">
                {s}
              </button>
            ))}
          </div>
        </div>

        {(answer || loading) && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/40 p-4">
            {loading ? (
              <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-300">
                <svg className="h-5 w-5 animate-spin text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                </svg>
                <span>Analyzing your data…</span>
              </div>
            ) : (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{answer || 'Ask a question to start the conversation.'}</ReactMarkdown>
              </div>
            )}
          </div>
        )}

        {aiError && (
          <div className="text-xs px-3 py-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-300 border border-amber-500/30">
            {aiError}
          </div>
        )}

        {chartType === 'sales_over_time' && chartData && (
          <ChartPreview title="Sales trend" subtitle="Generated from AI insight">
            <SalesLineChart data={chartData} />
          </ChartPreview>
        )}

        {chartType === 'most_profitable_product' && chartData && (
          <ChartPreview title="Top products" subtitle="Most profitable items for the period">
            <ProfitBarChart items={chartData} />
          </ChartPreview>
        )}

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Recent questions</h4>
            <button onClick={()=>{ clearAiChatHistory(); setHistory([]) }} className="text-xs btn-outline px-3 py-1.5">Clear</button>
          </div>
          {history.length === 0 ? (
            <div className="text-sm text-slate-500 dark:text-slate-400">No history yet—your upcoming questions will appear here.</div>
          ) : (
            <ul className="space-y-3">
              {history.map(h => (
                <li key={h.id} className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-white/70 dark:bg-slate-900/40">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium text-slate-800 dark:text-slate-200">{h.query}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{new Date(h.ts).toLocaleString()}</div>
                    </div>
                    <div className="flex gap-2">
                      <button className="btn-outline text-xs px-3 py-1.5" onClick={()=>setQuery(h.query)}>Reuse</button>
                      <button className="btn-outline text-xs px-3 py-1.5" onClick={()=>{ navigator.clipboard?.writeText(h.answer||'') }}>Copy</button>
                    </div>
                  </div>
                  {h.answer && (
                    <div className="prose prose-xs dark:prose-invert max-w-none mt-3">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{h.answer}</ReactMarkdown>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

function ChartPreview({ title, subtitle, children }) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/40 p-5 space-y-3">
      <div>
        <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{title}</h4>
        <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
      </div>
      <div className="h-[220px] flex items-center justify-center">
        {children}
      </div>
    </div>
  )
}
