import React, {useMemo} from 'react'
import { Bar } from 'react-chartjs-2'
import 'chart.js/auto'

// Generic bar chart for [{label, value}] data
export default function BarChart({items, options={}}){
  const dark = typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : false
  const colors = useMemo(()=>({
    bar: dark ? 'rgba(59,130,246,0.7)' : 'rgba(37,99,235,0.75)',
    grid: dark ? '#334155' : '#e2e8f0',
    text: dark ? '#cbd5e1' : '#475569'
  }),[dark])
  const labels = (items || []).map(i=> i.label ?? i[Object.keys(i)[0]])
  const dataVals = (items || []).map(i=> i.value ?? i[Object.keys(i)[1]])
  const chartData = { labels, datasets:[{label: options.datasetLabel || 'Value', data: dataVals, backgroundColor: colors.bar, borderRadius:4, borderSkipped:false}] }
  const defaultOptions = {
    responsive:true,
    maintainAspectRatio: false,
    plugins:{
      legend:{display:false},
      tooltip:{ callbacks:{ label:(ctx)=> ` ${ctx.label}: ${Number(ctx.parsed.y||0).toLocaleString()}` } }
    },
    scales:{
      x:{title:{display:!!options.xLabel,text:options.xLabel||''}, grid:{color: colors.grid}, ticks:{color: colors.text}},
      y:{
        title:{display:!!options.yLabel,text:options.yLabel||''},
        ticks:{ callback: (v)=> Number(v).toLocaleString(), color: colors.text },
        grid:{color: colors.grid}
      }
    }
  }
  return <div style={{height:300}}><Bar data={chartData} options={defaultOptions} /></div>
}
