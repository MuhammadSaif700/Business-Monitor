import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api, fmtCurrency } from '../lib/api'
import AIChat from './AIChat'
import SalesLineChart from './SalesLineChart'
import ProfitBarChart from './ProfitBarChart'
import PieChart from './PieChart'
import { useToast } from './ToastProvider'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export default function Dashboard(){
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  // Controls whether the dashboard should automatically load the latest dataset
  // Keep false on fresh page loads so the dashboard is empty until user opts in
  const [allowAutoLoad, setAllowAutoLoad] = useState(false)
  const toast = useToast()

  // Clear local dashboard/chat history on mount so the UI is fresh on every page load
  React.useEffect(() => {
    try {
      localStorage.removeItem('ai_dashboard_history_v1')
      localStorage.removeItem('ai_chat_history_v1')
    } catch (e) {
      // ignore
    }
  }, [])

  // If the upload flow set a flag to auto-load the latest dataset, enable it once
  React.useEffect(() => {
    try {
      const v = localStorage.getItem('allow_auto_load')
      if (v === '1') {
        setAllowAutoLoad(true)
        localStorage.removeItem('allow_auto_load')
      }
    } catch (e) {}
  }, [])

  // Summary query (fallback for business data)
  const { data: summary } = useQuery({
    queryKey: ['summary', { startDate, endDate }],
    queryFn: async () => {
      try {
        const params = {}
        if(startDate) params.start_date = startDate
        if(endDate) params.end_date = endDate
        const res = await api.get('/reports/summary', { params })
        return res.data
      } catch {
        return null // Fallback if no business data
      }
    },
    staleTime: 60_000,
  })

  // Datasets query for uploaded files
  const { data: datasets } = useQuery({
    queryKey: ['datasets'],
    queryFn: async () => {
      const res = await api.get('/datasets')
      return res.data.datasets
    },
    staleTime: 30_000,
  })

  // Smart analytics based on uploaded data
  const { data: smartAnalytics } = useQuery({
    queryKey: ['smart-analytics', datasets, { startDate, endDate }],
    queryFn: async () => {
      if (!datasets || datasets.length === 0) {
        console.log('Smart Analytics: No datasets available')
        return null
      }
      
      // Use the most recent dataset for analysis
      const latestDataset = datasets[0]
      console.log('Smart Analytics: Using dataset', latestDataset.table_name)
      
      try {
        const res = await api.post('/analytics/smart-dashboard', {
          table_name: latestDataset.table_name,
          start_date: startDate || undefined,
          end_date: endDate || undefined
        })
        console.log('Smart Analytics: Response received', res.data)
        return res.data
      } catch (error) {
        console.error('Smart Analytics: Detailed error', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
          headers: error.response?.headers
        })
        return null
      }
    },
    // Only run smart analytics when the user has explicitly allowed auto-loading
    enabled: allowAutoLoad && !!(datasets && datasets.length > 0),
    staleTime: 60_000,
  })

  // Chart queries via AI endpoint (cached separately)
  const { data: salesResp, isLoading: salesLoading } = useQuery({
    queryKey: ['ai','sales_over_time', { startDate, endDate }],
    queryFn: async () => {
      const params = { query: 'sales_over_time', start_date: startDate || undefined, end_date: endDate || undefined }
      const res = await api.get('/ai/query', { params })
      return res.data
    },
    staleTime: 60_000,
    enabled: allowAutoLoad,
  })
  const salesData = salesResp?.data
  const salesNarrative = salesResp?.narrative || ''
  const salesAiError = salesResp?.ai_error

  const { data: profitResp, isLoading: profitLoading } = useQuery({
    queryKey: ['ai','most_profitable_product', { startDate, endDate }],
    queryFn: async () => {
      const params = { query: 'most_profitable_product', start_date: startDate || undefined, end_date: endDate || undefined }
      const res = await api.get('/ai/query', { params })
      return res.data
    },
    staleTime: 60_000,
    enabled: allowAutoLoad,
  })
  const profitData = profitResp?.data
  const profitNarrative = profitResp?.narrative || ''
  const profitAiError = profitResp?.ai_error

  const { data: regionResp, isLoading: regionLoading } = useQuery({
    queryKey: ['ai','by_region', { startDate, endDate }],
    queryFn: async () => {
      const params = { query: 'by_region', start_date: startDate || undefined, end_date: endDate || undefined }
      const res = await api.get('/ai/query', { params })
      return res.data
    },
    staleTime: 60_000,
    enabled: allowAutoLoad,
  })
  const regionData = regionResp?.data
  const regionNarrative = regionResp?.narrative || ''
  const regionAiError = regionResp?.ai_error

  const { data: customerResp, isLoading: customerLoading } = useQuery({
    queryKey: ['ai','by_customer', { startDate, endDate }],
    queryFn: async () => {
      const params = { query: 'by_customer', start_date: startDate || undefined, end_date: endDate || undefined }
      const res = await api.get('/ai/query', { params })
      return res.data
    },
    staleTime: 60_000,
    enabled: allowAutoLoad,
  })
  const customerData = customerResp?.data
  const customerNarrative = customerResp?.narrative || ''
  const customerAiError = customerResp?.ai_error
  const loadingCharts = salesLoading || profitLoading || regionLoading || customerLoading

  // Compute deterministic totals from uploaded dataset when available
  const { data: totalSalesResp } = useQuery({
    queryKey: ['analytics','total_sales',{ startDate, endDate, datasets }],
    queryFn: async () => {
      if (!allowAutoLoad || !datasets || datasets.length === 0) return null
      try {
        const latest = datasets[0]
        const res = await api.post('/analytics/kpi', {
          metric: 'sum_amount',
          start_date: startDate || undefined,
          end_date: endDate || undefined,
          filters: [{ field: 'type', op: '=', value: 'sale' }]
        })
        return res.data
      } catch (e) {
        return null
      }
    },
    enabled: allowAutoLoad && !!(datasets && datasets.length > 0),
    staleTime: 30_000,
  })

  const { data: totalPurchasesResp } = useQuery({
    queryKey: ['analytics','total_purchases',{ startDate, endDate, datasets }],
    queryFn: async () => {
      if (!allowAutoLoad || !datasets || datasets.length === 0) return null
      try {
        const res = await api.post('/analytics/kpi', {
          metric: 'sum_amount',
          start_date: startDate || undefined,
          end_date: endDate || undefined,
          filters: [{ field: 'type', op: '=', value: 'purchase' }]
        })
        return res.data
      } catch (e) {
        return null
      }
    },
    enabled: allowAutoLoad && !!(datasets && datasets.length > 0),
    staleTime: 30_000,
  })

  const { data: totalQuantityResp } = useQuery({
    queryKey: ['analytics','total_quantity',{ startDate, endDate, datasets }],
    queryFn: async () => {
      if (!allowAutoLoad || !datasets || datasets.length === 0) return null
      try {
        const res = await api.post('/analytics/kpi', {
          metric: 'sum_quantity',
          start_date: startDate || undefined,
          end_date: endDate || undefined,
        })
        return res.data
      } catch (e) {
        return null
      }
    },
    enabled: allowAutoLoad && !!(datasets && datasets.length > 0),
    staleTime: 30_000,
  })

  // Only consider business/smart data present if the user allowed auto-loading.
  // This ensures the dashboard remains empty on a fresh page load.
  const hasBusinessData = allowAutoLoad && summary && (summary.total_sales || summary.total_purchases)
  const hasSmartData = allowAutoLoad && smartAnalytics && smartAnalytics.kpis
  // Auto-select the latest dataset when user has uploaded or enabled auto-load
  const activeDataset = (allowAutoLoad && datasets && datasets.length > 0) ? datasets[0] : null

  const getValue = (item) => {
    if (!item || typeof item !== 'object') return 0
    if ('value' in item) return Number(item.value) || 0
    const numericEntry = Object.entries(item).find(([, val]) => typeof val === 'number')
    return Number(numericEntry?.[1]) || 0
  }

  // Helper to extract KPI by fuzzy title match from smart analytics
  const extractKpi = (keywords = []) => {
    if (!smartAnalytics?.kpis) return undefined
    const lower = (s) => (String(s || '').toLowerCase())
    for (const k of smartAnalytics.kpis) {
      const t = lower(k.title)
      for (const kw of keywords) {
        if (t.includes(kw)) return k
      }
    }
    return undefined
  }

  // Derive dashboard metrics (preference: summary -> smartAnalytics -> fallback)
  const qtyKpi = extractKpi(['quantity', 'qty', 'units'])
  const salesKpi = extractKpi(['total sales', 'sales', 'revenue', 'amount'])
  const purchasesKpi = extractKpi(['purchase', 'purchases', 'cost', 'expenses'])
  const profitKpi = extractKpi(['profit'])
  const lossKpi = extractKpi(['loss'])

  const displayQuantity = summary?.total_quantity ?? (totalQuantityResp?.value ?? qtyKpi?.value) ?? '—'
  const displaySales = summary?.total_sales !== undefined ? fmtCurrency(summary.total_sales) : (totalSalesResp?.value ? fmtCurrency(totalSalesResp.value) : (salesKpi?.value ?? '—'))
  const displayPurchases = summary?.total_purchases !== undefined ? fmtCurrency(summary.total_purchases) : (totalPurchasesResp?.value ? fmtCurrency(totalPurchasesResp.value) : (purchasesKpi?.value ?? '—'))
  // profit/loss logic: prefer explicit profit/loss KPIs; if profit present but trend negative treat as loss
  const hasExplicitProfit = !!profitKpi
  const hasExplicitLoss = !!lossKpi
  const displayProfit = summary?.profit !== undefined ? fmtCurrency(summary.profit) : (profitKpi?.value ?? null)
  const profitIsNegative = summary?.profit < 0 || (profitKpi && profitKpi.trend === 'negative')

  const hasRegionData = Array.isArray(regionData) && regionData.some(item => getValue(item) > 0)
  const hasCustomerData = Array.isArray(customerData) && customerData.some(item => getValue(item) > 0)

  const exportBase = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
  const dateQuery = new URLSearchParams({ start_date: startDate || '', end_date: endDate || '' }).toString()
  const exportLinks = [
    { label: 'Summary CSV', path: '/export/summary' },
    { label: 'By product CSV', path: '/export/by_product' },
    { label: 'By region CSV', path: '/export/by_region' },
    { label: 'By customer CSV', path: '/export/by_customer' },
    { label: 'Download all (zip)', path: '/export/all.zip', emphasis: true },
  ]

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Preferred: business summary if available */}
        {hasBusinessData ? (
          <>
            <KPI title="Quantity" value={displayQuantity} />
            <KPI title="Sales" value={displaySales} trend={summary && summary.total_sales>=0 ? 'positive' : undefined} />
            <KPI title="Purchases" value={displayPurchases} />
            {/* Show profit and/or loss according to dataset */}
            {summary && summary.profit !== undefined ? (
              <KPI title="Profit / (Loss)" value={fmtCurrency(summary.profit)} trend={summary.profit>=0 ? 'positive' : 'negative'} />
            ) : (hasExplicitProfit || hasExplicitLoss) ? (
              <>
                {hasExplicitProfit && <KPI title="Profit" value={profitKpi.value} trend={profitKpi.trend} />}
                {hasExplicitLoss && <KPI title="Loss" value={lossKpi.value} trend={lossKpi.trend} />}
                {(!hasExplicitProfit && !hasExplicitLoss) && <KPI title="Profit" value={displayProfit ?? '—'} />}
              </>
            ) : (
              <KPI title="Profit" value={displayProfit ?? '—'} />
            )}
          </>
        ) : hasSmartData ? (
          // When smart analytics returns KPIs, display all available KPIs
          smartAnalytics.kpis.slice(0, 4).map((k, i) => (
            <KPI key={i} title={k.title} value={k.value} trend={k.trend} />
          ))
        ) : (activeDataset && allowAutoLoad) ? (
          <>
            <KPI title="Dataset" value={activeDataset.original_filename} />
            <KPI title="Rows" value={activeDataset.row_count?.toLocaleString() || '—'} />
            <KPI title="Columns" value={activeDataset.columns?.length || '—'} />
            <KPI title="Uploaded" value={new Date(activeDataset.upload_timestamp).toLocaleDateString()} />
          </>
          ) : (
          <>
            <KPI title="Total Files" value={datasets?.length || 0} />
            <KPI title="Status" value="No Data" />
            <KPI title="Ready" value="Upload Files" />
            <KPI title="Action" value="Get Started" />
          </>
        )}
      </div>

      <section className="panel p-6 space-y-4">
        <div className="flex flex-wrap items-start gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Date range</p>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Focus on the period that matters</h3>
          </div>
          {activeDataset && (
            <div className="ml-auto flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-3 dark:border-blue-500/30 dark:bg-blue-500/10">
              <div className="text-2xl">📁</div>
              <div>
                <p className="text-xs uppercase tracking-wide text-blue-700 dark:text-blue-200 font-semibold">Active dataset</p>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-100">{activeDataset.original_filename}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{activeDataset.row_count?.toLocaleString()} rows • {activeDataset.columns?.length || 0} columns</p>
              </div>
            </div>
          )}
        </div>

        <div className="date-filter">
          <div className="flex items-center gap-2">
            <label className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">From</label>
            <input
              type="date"
              value={startDate}
              onChange={e => {
                const v = e.target.value
                if (endDate && v && v > endDate) {
                  toast({ type: 'error', message: 'Start date cannot be after end date' })
                  return
                }
                setStartDate(v)
              }}
              className="date-input"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">To</label>
            <input
              type="date"
              value={endDate}
              onChange={e => {
                const v = e.target.value
                if (startDate && v && v < startDate) {
                  toast({ type: 'error', message: 'End date cannot be before start date' })
                  return
                }
                setEndDate(v)
              }}
              className="date-input"
            />
          </div>
          <div className="quick-filters">
            <button
              onClick={() => {
                const d = new Date()
                d.setDate(d.getDate() - 6)
                setStartDate(d.toISOString().slice(0, 10))
                setEndDate(new Date().toISOString().slice(0, 10))
              }}
              className="btn-outline text-xs px-3 py-1.5"
            >
              Last 7 days
            </button>
            <button
              onClick={() => {
                const now = new Date()
                setStartDate(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10))
                setEndDate(new Date().toISOString().slice(0, 10))
              }}
              className="btn-outline text-xs px-3 py-1.5"
            >
              This month
            </button>
            <button
              onClick={() => {
                setStartDate('')
                setEndDate('')
              }}
              className="btn-outline text-xs px-3 py-1.5"
            >
              All time
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {exportLinks.map(link => (
            <a
              key={link.path}
              className={`text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-blue-400 hover:text-blue-600 dark:hover:border-blue-400 ${link.emphasis ? 'font-semibold text-blue-600 dark:text-blue-300 border-dashed' : 'text-slate-600 dark:text-slate-300'}`}
              href={`${exportBase}${link.path}?${dateQuery}`}
            >
              {link.label}
            </a>
          ))}
        </div>
      </section>

      <div className="space-y-6">
        {hasBusinessData ? (
            <div className="grid gap-6">
              <ChartCard
                title="Sales over time"
                narrative={salesNarrative}
                error={salesAiError}
                loading={loadingCharts}
              >
                {salesData ? (
                  <SalesLineChart
                    key={document?.documentElement?.classList?.contains('dark') ? 'dark' : 'light'}
                    data={salesData}
                    options={{ xLabel: 'Date', yLabel: 'Sales' }}
                  />
                ) : (
                  <EmptyChart message="We couldn't load sales data for this range." />
                )}
              </ChartCard>

              <ChartCard
                title="Top products by profit"
                narrative={profitNarrative}
                error={profitAiError}
                loading={loadingCharts}
              >
                {profitData ? (
                  <ProfitBarChart
                    key={document?.documentElement?.classList?.contains('dark') ? 'dark' : 'light'}
                    items={profitData}
                    options={{ xLabel: 'Product', yLabel: 'Profit' }}
                  />
                ) : (
                  <EmptyChart message="Upload data or adjust the filter to see profitability." />
                )}
              </ChartCard>
            </div>
          ) : hasSmartData && smartAnalytics.charts ? (
            <div className="grid gap-6">
              {smartAnalytics.charts.map((chart, index) => (
                <ChartCard key={index} title={chart.title} narrative={chart.insight}>
                  {chart.type === 'line' && chart.data ? (
                    <SalesLineChart 
                      data={{
                        dates: chart.data.map(d => d.x || d.date || d.label || ''),
                        amounts: chart.data.map(d => d.y || d.value || 0)
                      }} 
                      options={{ xLabel: chart.xLabel, yLabel: chart.yLabel }} 
                    />
                  ) : chart.type === 'bar' && chart.data ? (
                    <ProfitBarChart 
                      items={chart.data.map(d => ({
                        product: d.name || d.category || d.label || d.x || '',
                        profit: d.value || d.y || 0
                      }))} 
                      options={{ xLabel: chart.xLabel, yLabel: chart.yLabel }} 
                    />
                  ) : chart.type === 'pie' && chart.data ? (
                    <PieChart items={chart.data} />
                  ) : (
                    <EmptyChart message={chart.description || 'Chart data processing...'} />
                  )}
                </ChartCard>
              ))}
            </div>
          ) : (activeDataset && allowAutoLoad) ? (
            <div className="grid md:grid-cols-2 gap-6">
              <div className="panel p-6 flex flex-col justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold"> Dataset overview</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{activeDataset.original_filename}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-5 text-center">
                  <p className="text-4xl mb-2">📁</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{activeDataset.row_count?.toLocaleString()} rows • {activeDataset.columns?.length || 0} columns</p>
                </div>
                <Link to={`/datasets?table=${activeDataset.table_name}`} className="btn btn-primary self-start">View full analytics</Link>
              </div>
              <div className="panel p-6">
                <h3 className="text-lg font-semibold mb-4">🔍 Column highlights</h3>
                <div className="grid grid-cols-2 gap-2">
                  {(activeDataset.columns || []).slice(0, 10).map((column, index) => (
                    <div key={index} className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/60 px-3 py-2 text-sm text-slate-600 dark:text-slate-300">
                      {column}
                    </div>
                  ))}
                </div>
                {activeDataset.columns && activeDataset.columns.length > 10 && (
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-3">+{activeDataset.columns.length - 10} more columns</p>
                )}
              </div>
            </div>
          ) : (
            <div className="panel p-10 text-center">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-2xl font-semibold mb-3">No insights yet</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">Upload any type of file to instantly generate dashboards tailored to your data.</p>
              <div className="flex flex-wrap gap-3 justify-center">
                <Link to="/upload" className="btn btn-primary">📤 Upload a file</Link>
                <Link to="/designer" className="btn btn-secondary">🤖 Try AI Designer</Link>
              </div>
              {/* If there are existing files on the server, offer a one-click option to load them */}
              {datasets && datasets.length > 0 && !allowAutoLoad && (
                <div className="mt-6">
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">We found uploaded files on your account. Click to load the latest dataset into this dashboard.</p>
                  <div className="flex justify-center">
                    <button onClick={() => setAllowAutoLoad(true)} className="inline-flex items-center justify-center gap-2.5 font-semibold rounded-xl px-6 py-3 text-sm border-2 border-slate-300 dark:border-slate-500 bg-transparent text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-400 dark:hover:border-slate-400 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-slate-500/30 focus:ring-offset-1 transition-all duration-200">Load latest dataset</button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            <ChartCard
              title="Sales by region"
              narrative={hasRegionData ? regionNarrative : ''}
              error={regionAiError}
              loading={loadingCharts}
              actionLabel="Export CSV"
              actionHref={`${exportBase}/export/by_region?${dateQuery}`}
            >
              {hasRegionData ? (
                <div className="w-full h-[250px]">
                  <PieChart key={document?.documentElement?.classList?.contains('dark') ? 'dark' : 'light'} items={regionData} />
                </div>
              ) : (
                <EmptyChart message="No regional data available for this period." />
              )}
            </ChartCard>

            <ChartCard
              title="Sales by customer"
              narrative={hasCustomerData ? customerNarrative : ''}
              error={customerAiError}
              loading={loadingCharts}
              actionLabel="Export CSV"
              actionHref={`${exportBase}/export/by_customer?${dateQuery}`}
            >
              {hasCustomerData ? (
                <div className="w-full h-[250px]">
                  <PieChart key={document?.documentElement?.classList?.contains('dark') ? 'dark' : 'light'} items={customerData} />
                </div>
              ) : (
                <EmptyChart message="No customer data available for this period." />
              )}
            </ChartCard>
          </div>

          {/* AI Chat - full width below charts */}
          <div className="panel p-6">
            <AIChat compact />
          </div>
        </div>
    </div>
  )
}

function KPI({title,value,trend}){
  const arrow = trend === 'positive' ? '▲' : trend === 'negative' ? '▼' : ''
  const trendColor = trend === 'positive' ? 'text-green-600 dark:text-green-400' : trend === 'negative' ? 'text-red-600 dark:text-red-400' : 'text-slate-500'
  return (
    <div className="kpi group">
      <div className="flex items-start justify-between">
        <div className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400 font-semibold">{title}</div>
        {arrow && <span className={`text-xs ${trendColor}`}>{arrow}</span>}
      </div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
    </div>
  )
}

function ChartCard({ title, children, narrative, error, loading, actionLabel, actionHref }) {
  return (
    <div className="panel p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
        {actionLabel && actionHref && (
          <a
            href={actionHref}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-200"
          >
            {actionLabel}
          </a>
        )}
      </div>
      <div className="h-[300px] w-full rounded-xl bg-slate-50 dark:bg-slate-900/40 overflow-hidden p-4">
        {loading ? <div className="h-full w-full skeleton" /> : children}
      </div>
      {error ? (
        <div className="text-xs px-3 py-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-300 border border-amber-500/30">
          {error}
        </div>
      ) : narrative ? (
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{narrative}</ReactMarkdown>
        </div>
      ) : null}
    </div>
  )
}

function EmptyChart({ message }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 px-6 text-center">
      <div className="text-4xl opacity-30">📊</div>
      <p className="text-sm text-slate-400 dark:text-slate-500">No data</p>
    </div>
  )
}
