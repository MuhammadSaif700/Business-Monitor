import React, {useMemo} from 'react'
import { Bar } from 'react-chartjs-2'
import 'chart.js/auto'

export default function ProfitBarChart({items, options={}}){
  const dark = typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : false
  const colors = useMemo(()=>({
    bar: dark ? 'rgba(16,185,129,0.6)' : 'rgba(16,185,129,0.7)',
    grid: dark ? '#334155' : '#e2e8f0',
    text: dark ? '#cbd5e1' : '#475569'
  }),[dark])
  // items: [{product, profit}, ...]
  const labels = (items || []).map(i=>i.product)
  const data = (items || []).map(i=>i.profit)
  const chartData = { labels, datasets:[{label:'Profit', data, backgroundColor: colors.bar, borderRadius:4, borderSkipped:false}] }
  const defaultOptions = {
    responsive:true,
    maintainAspectRatio: false,
    plugins:{
      legend:{display:false},
      tooltip:{ callbacks:{ label:(ctx)=> ` ${ctx.label}: ${ctx.parsed.y.toLocaleString()}` } }
    },
    scales:{
      x:{title:{display:true,text:options.xLabel||'Product'}, grid:{color: colors.grid}, ticks:{color: colors.text, maxRotation: 45, minRotation: 0}},
      y:{
        title:{display:true,text:options.yLabel||'Profit'},
        ticks:{ callback: (v)=> v.toLocaleString(), color: colors.text },
        grid:{color: colors.grid},
        beginAtZero: true
      }
    }
  }
  return <div style={{width: '100%', height: '100%', minHeight: '260px'}}><Bar data={chartData} options={defaultOptions} /></div>
}
