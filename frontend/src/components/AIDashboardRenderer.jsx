import React, {useMemo} from 'react'
import { useQuery } from '@tanstack/react-query'
import { api, fmtCurrency } from '../lib/api'
import SalesLineChart from './SalesLineChart'
import PieChart from './PieChart'
import BarChart from './BarChart'

function KpiCard({title, value}){
  return (
    <div className="kpi">
      <div className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400 font-semibold">{title}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{typeof value==='number'? fmtCurrency(value) : value}</div>
    </div>
  )
}

function ChartBlock({spec, params}){
  const { type, title, metric='sum_amount', group_by, top_n } = spec
  const queryKey = ["chart", type, metric, group_by, top_n, params]
  const fetcher = async () => {
    if(type === 'timeseries'){
      const res = await api.post('/analytics/timeseries', { metric, ...params })
      return { kind:'timeseries', data: res.data }
    }
    if(type === 'bar' || type === 'pie'){
      const res = await api.post('/analytics/query', { metric, group_by, top_n, ...params })
      return { kind:type, data: res.data }
    }
    return { kind:'unknown', data:null }
  }
  const { data, isLoading, error } = useQuery({ queryKey, queryFn: fetcher, staleTime: 60_000 })
  if(isLoading) return <div className="panel p-4"><div className="h-[300px] skeleton"/></div>
  if(error) return <div className="panel p-4 text-sm text-red-600">{String(error)}</div>
  if(!data) return null
  const d = data.data
  return (
    <div className="panel p-4">
      <h3 className="font-semibold mb-2">{title}</h3>
  {data.kind === 'timeseries' && <SalesLineChart data={{dates: d.dates, amounts: d.values}} options={{xLabel:'Date', yLabel: metric}} />}
  {data.kind === 'pie' && <PieChart items={d.items||[]} />}
  {data.kind === 'bar' && <BarChart items={d.items||[]} options={{xLabel: spec.group_by}} />}
    </div>
  )
}

export default function AIDashboardRenderer({config, startDate, endDate}){
  const params = useMemo(()=>({ start_date: startDate || undefined, end_date: endDate || undefined }), [startDate, endDate])
  const kpis = config?.kpis || []
  const charts = config?.charts || []
  return (
    <div className="space-y-6">
      {kpis.length>0 && (
        <div className="grid md:grid-cols-4 sm:grid-cols-2 grid-cols-1 gap-4">
          {kpis.slice(0,4).map((k,i)=> <KpiCard key={i} title={k.title||k.metric} value={<KpiValue metric={k.metric} params={params} />} />)}
        </div>
      )}
      {charts.length>0 && (
        <div className="grid lg:grid-cols-2 gap-6">
          {charts.map((c,i)=> <ChartBlock key={i} spec={c} params={params} />)}
        </div>
      )}
    </div>
  )
}

function KpiValue({metric, params}){
  const { data } = useQuery({
    queryKey: ['kpi', metric, params],
    queryFn: async ()=>{
      const res = await api.post('/analytics/kpi', { metric, ...params })
      return res.data
    },
    staleTime: 60_000,
  })
  const v = data?.value ?? 0
  return <span>{fmtCurrency(v)}</span>
}
