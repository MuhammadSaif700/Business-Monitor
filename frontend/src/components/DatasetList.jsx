import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { useToast } from './ToastProvider'

export default function DatasetList() {
  const [selectedDataset, setSelectedDataset] = useState(null)
  const [analysisType, setAnalysisType] = useState('summary')
  const [analysisParams, setAnalysisParams] = useState({})
  const [analysisResult, setAnalysisResult] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const toast = useToast()

  const { data: datasets, isLoading, error } = useQuery({
    queryKey: ['datasets'],
    queryFn: async () => {
      const res = await api.get('/datasets')
      return res.data.datasets
    }
  })

  const runAnalysis = async () => {
    if (!selectedDataset) return
    
    setIsAnalyzing(true)
    try {
      const body = { type: analysisType, ...analysisParams }
      const res = await api.post(`/datasets/${selectedDataset.table_name}/analyze`, body)
      setAnalysisResult(res.data)
      toast({ type: 'success', message: 'Analysis completed!' })
    } catch (e) {
      const msg = e.response?.data?.detail || 'Analysis failed'
      toast({ type: 'error', message: msg })
      setAnalysisResult({ error: msg })
    } finally {
      setIsAnalyzing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="panel p-8 text-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p>Loading datasets...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="panel p-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
        <p className="text-red-800 dark:text-red-300">Failed to load datasets: {error.message}</p>
      </div>
    )
  }

  if (!datasets || datasets.length === 0) {
    return (
      <div className="panel p-8 text-center">
        <div className="text-6xl mb-4">📊</div>
        <h3 className="text-lg font-semibold mb-2">No datasets yet</h3>
        <p className="text-slate-600 dark:text-slate-400">
          Upload your first file to start creating dynamic dashboards!
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">📊 Your Datasets</h2>
      
      {/* Dataset List */}
      <div className="grid gap-4">
        {datasets.map((dataset) => (
          <div
            key={dataset.table_name}
            className={`panel p-4 cursor-pointer transition-all ${
              selectedDataset?.table_name === dataset.table_name
                ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'hover:shadow-md'
            }`}
            onClick={() => setSelectedDataset(dataset)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-1">
                  📄 {dataset.original_filename}
                </h3>
                <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                  <p>📅 Uploaded: {new Date(dataset.upload_timestamp).toLocaleString()}</p>
                  <p>📊 {dataset.row_count} rows × {dataset.columns.length} columns</p>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {dataset.columns.slice(0, 5).map((col, i) => (
                    <span key={i} className="badge text-xs">
                      {col}
                    </span>
                  ))}
                  {dataset.columns.length > 5 && (
                    <span className="text-xs text-slate-500">
                      +{dataset.columns.length - 5} more
                    </span>
                  )}
                </div>
              </div>
              <div className="text-sm text-slate-500">
                ID: {dataset.table_name}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Analysis Panel */}
      {selectedDataset && (
        <div className="panel p-6 space-y-4">
          <h3 className="text-xl font-semibold">
            🔍 Analyze: {selectedDataset.original_filename}
          </h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Analysis Type Selection */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Analysis Type</label>
                <select
                  value={analysisType}
                  onChange={(e) => {
                    setAnalysisType(e.target.value)
                    setAnalysisParams({})
                    setAnalysisResult(null)
                  }}
                  className="input"
                >
                  <option value="summary">📈 Summary Statistics</option>
                  <option value="groupby">📊 Group By Analysis</option>
                  <option value="timeseries">📅 Time Series Analysis</option>
                </select>
              </div>

              {/* Dynamic Parameters */}
              {analysisType === 'groupby' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Group By Column</label>
                    <select
                      value={analysisParams.group_by || ''}
                      onChange={(e) => setAnalysisParams({...analysisParams, group_by: e.target.value})}
                      className="input"
                    >
                      <option value="">Select column...</option>
                      {selectedDataset.columns.map(col => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Aggregate Column</label>
                    <select
                      value={analysisParams.aggregate_column || ''}
                      onChange={(e) => setAnalysisParams({...analysisParams, aggregate_column: e.target.value})}
                      className="input"
                    >
                      <option value="">Select column...</option>
                      {selectedDataset.columns.map(col => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Function</label>
                    <select
                      value={analysisParams.aggregate_function || 'sum'}
                      onChange={(e) => setAnalysisParams({...analysisParams, aggregate_function: e.target.value})}
                      className="input"
                    >
                      <option value="sum">Sum</option>
                      <option value="mean">Average</option>
                      <option value="count">Count</option>
                      <option value="max">Maximum</option>
                      <option value="min">Minimum</option>
                    </select>
                  </div>
                </div>
              )}

              {analysisType === 'timeseries' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Date Column</label>
                    <select
                      value={analysisParams.date_column || ''}
                      onChange={(e) => setAnalysisParams({...analysisParams, date_column: e.target.value})}
                      className="input"
                    >
                      <option value="">Select date column...</option>
                      {selectedDataset.columns.map(col => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Value Column</label>
                    <select
                      value={analysisParams.value_column || ''}
                      onChange={(e) => setAnalysisParams({...analysisParams, value_column: e.target.value})}
                      className="input"
                    >
                      <option value="">Select value column...</option>
                      {selectedDataset.columns.map(col => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <button
                onClick={runAnalysis}
                disabled={isAnalyzing}
                className="btn btn-primary w-full"
              >
                {isAnalyzing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Analyzing...
                  </>
                ) : (
                  '🚀 Run Analysis'
                )}
              </button>
            </div>

            {/* Results */}
            <div>
              {analysisResult && (
                <div className="space-y-4">
                  <h4 className="font-semibold">📊 Results</h4>
                  
                  {analysisResult.error ? (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <p className="text-red-800 dark:text-red-300">{analysisResult.error}</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Summary Statistics */}
                      {analysisResult.numeric_summary && (
                        <div>
                          <h5 className="font-medium mb-2">🔢 Numeric Columns</h5>
                          <div className="grid gap-2">
                            {Object.entries(analysisResult.numeric_summary).map(([col, stats]) => (
                              <div key={col} className="bg-slate-50 dark:bg-slate-800 rounded p-3">
                                <div className="font-medium mb-1">{col}</div>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                  <span>Mean: {stats.mean?.toFixed(2)}</span>
                                  <span>Median: {stats.median?.toFixed(2)}</span>
                                  <span>Min: {stats.min?.toFixed(2)}</span>
                                  <span>Max: {stats.max?.toFixed(2)}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Categorical Summary */}
                      {analysisResult.categorical_summary && (
                        <div>
                          <h5 className="font-medium mb-2">📝 Categorical Columns</h5>
                          <div className="grid gap-2">
                            {Object.entries(analysisResult.categorical_summary).map(([col, stats]) => (
                              <div key={col} className="bg-slate-50 dark:bg-slate-800 rounded p-3">
                                <div className="font-medium mb-1">{col}</div>
                                <div className="text-sm">
                                  <p>Unique values: {stats.unique_count}</p>
                                  {Object.keys(stats.top_values).length > 0 && (
                                    <div className="mt-2">
                                      <p className="font-medium">Top values:</p>
                                      {Object.entries(stats.top_values).map(([val, count]) => (
                                        <div key={val} className="flex justify-between">
                                          <span>{String(val).slice(0, 20)}{String(val).length > 20 && '...'}</span>
                                          <span>{count}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Group By / Time Series Data */}
                      {analysisResult.data && (
                        <div>
                          <h5 className="font-medium mb-2">📈 Data</h5>
                          <div className="overflow-x-auto bg-slate-50 dark:bg-slate-800 rounded p-3 max-h-64">
                            <table className="min-w-full text-sm">
                              <thead>
                                <tr className="border-b border-slate-200 dark:border-slate-700">
                                  {Object.keys(analysisResult.data[0] || {}).map((key) => (
                                    <th key={key} className="text-left py-2 px-3 font-medium">
                                      {key}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {analysisResult.data.slice(0, 20).map((row, i) => (
                                  <tr key={i} className="border-b border-slate-100 dark:border-slate-700/50">
                                    {Object.values(row).map((val, j) => (
                                      <td key={j} className="py-2 px-3">
                                        {typeof val === 'number' ? val.toFixed(2) : String(val)}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            {analysisResult.data.length > 20 && (
                              <p className="text-xs text-slate-500 mt-2">
                                Showing first 20 of {analysisResult.data.length} results
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}