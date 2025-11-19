import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api, fmtCurrency } from '../lib/api'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useToast } from './ToastProvider'

export default function BalanceSheet() {
  const [asOfDate, setAsOfDate] = useState('')
  const toast = useToast()

  const { data, isLoading, error } = useQuery({
    queryKey: ['balance-sheet', { asOfDate }],
    queryFn: async () => {
      const params = {}
      if (asOfDate) params.as_of_date = asOfDate
      const res = await api.get('/reports/balance-sheet', { params })
      return res.data
    },
    staleTime: 60_000,
  })

  const handleExport = () => {
    if (!data) return
    const csv = [
      'Balance Sheet',
      `As of: ${asOfDate || 'Current'}`,
      '',
      'Category,Item,Amount',
      'Assets,Cash,' + data.assets.cash,
      'Assets,Inventory,' + data.assets.inventory,
      'Assets,Total Assets,' + data.assets.total,
      '',
      'Liabilities,Accounts Payable,' + data.liabilities.accounts_payable,
      'Liabilities,Total Liabilities,' + data.liabilities.total,
      '',
      'Equity,Retained Earnings,' + data.equity.retained_earnings,
      'Equity,Total Equity,' + data.equity.total,
    ].join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'balance-sheet.csv'
    a.click()
    toast?.('Exported successfully', 'success')
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="panel p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Balance Sheet</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">Financial Position Report</p>
          </div>
          <button
            onClick={handleExport}
            disabled={!data}
            className="btn btn-outline"
          >
            📥 Export CSV
          </button>
        </div>

        {/* Date Filter */}
        <div className="flex gap-3 items-center flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">As of Date</label>
            <input
              type="date"
              value={asOfDate}
              onChange={(e) => setAsOfDate(e.target.value)}
              className="input text-sm"
            />
          </div>
          {asOfDate && (
            <button
              onClick={() => setAsOfDate('')}
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
          <p className="mt-3 text-slate-600 dark:text-slate-400">Loading balance sheet...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="panel p-6 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <p className="text-red-700 dark:text-red-300">Failed to load balance sheet</p>
        </div>
      )}

      {/* Financial Data */}
      {data && !isLoading && (
        <>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Assets */}
            <div className="panel p-6 space-y-4">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
                Assets
              </h3>

              <div className="space-y-3">
                <div className="flex justify-between items-center py-2">
                  <span className="text-slate-700 dark:text-slate-300">Cash</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    {fmtCurrency(data.assets.cash)}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2">
                  <span className="text-slate-700 dark:text-slate-300">Inventory</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    {fmtCurrency(data.assets.inventory)}
                  </span>
                </div>

                <div className="flex justify-between items-center py-3 mt-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 px-4 rounded-lg border-t-2 border-green-500">
                  <span className="font-bold text-slate-900 dark:text-slate-100">Total Assets</span>
                  <span className="text-xl font-bold text-green-600 dark:text-green-400">
                    {fmtCurrency(data.assets.total)}
                  </span>
                </div>
              </div>
            </div>

            {/* Liabilities & Equity */}
            <div className="panel p-6 space-y-6">
              {/* Liabilities */}
              <div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
                  Liabilities
                </h3>

                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-slate-700 dark:text-slate-300">Accounts Payable</span>
                    <span className="font-medium text-slate-900 dark:text-slate-100">
                      {fmtCurrency(data.liabilities.accounts_payable)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-3 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 px-4 rounded-lg border-t-2 border-orange-500">
                    <span className="font-bold text-slate-900 dark:text-slate-100">Total Liabilities</span>
                    <span className="text-lg font-bold text-orange-600 dark:text-orange-400">
                      {fmtCurrency(data.liabilities.total)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Equity */}
              <div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4 mt-6">
                  Equity
                </h3>

                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-slate-700 dark:text-slate-300">Retained Earnings</span>
                    <span className="font-medium text-slate-900 dark:text-slate-100">
                      {fmtCurrency(data.equity.retained_earnings)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 px-4 rounded-lg border-t-2 border-blue-500">
                    <span className="font-bold text-slate-900 dark:text-slate-100">Total Equity</span>
                    <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      {fmtCurrency(data.equity.total)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Balance Check */}
          <div className="panel p-6 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">Balance Check</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">Assets = Liabilities + Equity</p>
              </div>
              <div className="text-right">
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  {fmtCurrency(data.assets.total)} = {fmtCurrency(data.liabilities.total)} + {fmtCurrency(data.equity.total)}
                </div>
                <div className={`text-lg font-bold mt-1 ${Math.abs(data.assets.total - (data.liabilities.total + data.equity.total)) < 0.01 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {Math.abs(data.assets.total - (data.liabilities.total + data.equity.total)) < 0.01 ? '✓ Balanced' : '⚠ Not Balanced'}
                </div>
              </div>
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

          {/* Key Metrics */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="panel p-6 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20">
              <div className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">Total Assets</div>
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {fmtCurrency(data.assets.total)}
              </div>
            </div>
            
            <div className="panel p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
              <div className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">Debt-to-Equity Ratio</div>
              <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                {data.equity.total > 0 ? (data.liabilities.total / data.equity.total).toFixed(2) : '0.00'}
              </div>
            </div>
            
            <div className="panel p-6 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20">
              <div className="text-sm font-medium text-emerald-700 dark:text-emerald-300 mb-1">Net Worth</div>
              <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                {fmtCurrency(data.equity.total)}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
