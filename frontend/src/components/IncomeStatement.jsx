import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api, fmtCurrency } from '../lib/api'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useToast } from './ToastProvider'

export default function IncomeStatement() {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const toast = useToast()

  const { data, isLoading, error } = useQuery({
    queryKey: ['income-statement', { startDate, endDate }],
    queryFn: async () => {
      const params = {}
      if (startDate) params.start_date = startDate
      if (endDate) params.end_date = endDate
      const res = await api.get('/reports/income-statement', { params })
      return res.data
    },
    staleTime: 60_000,
  })

  const handleExport = () => {
    if (!data) return
    const csv = [
      'Income Statement',
      `Period: ${startDate || 'All'} to ${endDate || 'All'}`,
      '',
      'Item,Amount',
      `Revenue,${data.revenue}`,
      `Cost of Goods Sold,${data.cogs}`,
      `Gross Profit,${data.gross_profit}`,
      `Operating Expenses,${data.operating_expenses}`,
      `Operating Income,${data.operating_income}`,
      `Net Income,${data.net_income}`,
    ].join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'income-statement.csv'
    a.click()
    toast?.('Exported successfully', 'success')
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="panel p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Income Statement</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">Profit & Loss Report</p>
          </div>
          <button
            onClick={handleExport}
            disabled={!data}
            className="btn btn-outline"
          >
            📥 Export CSV
          </button>
        </div>

        {/* Date Filters */}
        <div className="flex gap-3 items-center flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">From</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">To</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input text-sm"
            />
          </div>
          {(startDate || endDate) && (
            <button
              onClick={() => { setStartDate(''); setEndDate('') }}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="panel p-12 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-3 text-slate-600 dark:text-slate-400">Loading income statement...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="panel p-6 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <p className="text-red-700 dark:text-red-300">Failed to load income statement</p>
        </div>
      )}

      {/* Financial Data */}
      {data && !isLoading && (
        <>
          {/* Main Financial Statement */}
          <div className="panel p-6 space-y-4">
            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
              Financial Performance
            </h3>

            {/* Revenue */}
            <div className="flex justify-between items-center py-3 border-b border-slate-200 dark:border-slate-700">
              <span className="font-semibold text-slate-900 dark:text-slate-100">Revenue</span>
              <span className="text-lg font-bold text-green-600 dark:text-green-400">
                {fmtCurrency(data.revenue)}
              </span>
            </div>

            {/* COGS */}
            <div className="flex justify-between items-center py-3 border-b border-slate-200 dark:border-slate-700">
              <span className="text-slate-700 dark:text-slate-300">Cost of Goods Sold</span>
              <span className="text-red-600 dark:text-red-400">
                ({fmtCurrency(data.cogs)})
              </span>
            </div>

            {/* Gross Profit */}
            <div className="flex justify-between items-center py-3 bg-slate-50 dark:bg-slate-800/50 px-4 rounded-lg">
              <span className="font-semibold text-slate-900 dark:text-slate-100">Gross Profit</span>
              <div className="text-right">
                <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {fmtCurrency(data.gross_profit)}
                </span>
                <span className="text-sm text-slate-600 dark:text-slate-400 ml-2">
                  ({data.gross_margin.toFixed(1)}% margin)
                </span>
              </div>
            </div>

            {/* Operating Expenses */}
            <div className="flex justify-between items-center py-3 border-b border-slate-200 dark:border-slate-700">
              <span className="text-slate-700 dark:text-slate-300">Operating Expenses</span>
              <span className="text-red-600 dark:text-red-400">
                ({fmtCurrency(data.operating_expenses)})
              </span>
            </div>

            {/* Operating Income */}
            <div className="flex justify-between items-center py-3 border-b border-slate-200 dark:border-slate-700">
              <span className="font-medium text-slate-800 dark:text-slate-200">Operating Income</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {fmtCurrency(data.operating_income)}
              </span>
            </div>

            {/* Net Income */}
            <div className="flex justify-between items-center py-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 px-4 rounded-lg mt-4">
              <span className="text-lg font-bold text-slate-900 dark:text-slate-100">Net Income</span>
              <span className={`text-2xl font-bold ${data.net_income >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {fmtCurrency(data.net_income)}
              </span>
            </div>
          </div>

          {/* AI Insights */}
          {data.narrative && (
            <div className="panel p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">🤖</span>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  AI Financial Analysis
                </h3>
              </div>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{data.narrative}</ReactMarkdown>
              </div>
            </div>
          )}

          {/* AI Error */}
          {data.ai_error && (
            <div className="panel p-4 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
              <p className="text-sm text-amber-700 dark:text-amber-300">{data.ai_error}</p>
            </div>
          )}

          {/* Visual Summary */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="panel p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
              <div className="text-sm font-medium text-green-700 dark:text-green-300 mb-1">Total Revenue</div>
              <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                {fmtCurrency(data.revenue)}
              </div>
            </div>
            
            <div className="panel p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
              <div className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">Gross Margin</div>
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {data.gross_margin.toFixed(1)}%
              </div>
            </div>
            
            <div className={`panel p-6 bg-gradient-to-br ${data.net_income >= 0 ? 'from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20' : 'from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20'}`}>
              <div className={`text-sm font-medium mb-1 ${data.net_income >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'}`}>
                Net Income
              </div>
              <div className={`text-2xl font-bold ${data.net_income >= 0 ? 'text-emerald-900 dark:text-emerald-100' : 'text-red-900 dark:text-red-100'}`}>
                {fmtCurrency(data.net_income)}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
