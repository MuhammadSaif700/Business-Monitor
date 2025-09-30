import React, {useMemo} from 'react'
import { Doughnut } from 'react-chartjs-2'
import ChartDataLabels from 'chartjs-plugin-datalabels'
import 'chart.js/auto'

export default function PieChart({items}){
  const dark = typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : false
  const safeItems = Array.isArray(items) ? items.filter(Boolean) : []
  const labels = safeItems.map(i=> {
    if('label' in i) return i.label
    const keys = Object.keys(i)
    return i[keys[0]]
  })
  const values = safeItems.map(i=> {
    if('value' in i) return i.value
    const keys = Object.keys(i)
    return i[keys[1]]
  })
  const numericValues = values.map(v => Number(v) || 0)
  const total = numericValues.reduce((a,b)=>a+(Number(b)||0),0)

  if (!safeItems.length || total === 0) {
    return (
      <div className="flex h-full w-full min-h-[220px] items-center justify-center text-sm text-slate-500 dark:text-slate-400">
        <div className="text-center space-y-1">
          <div className="text-2xl">🧭</div>
          <p>No sufficient data available yet</p>
        </div>
      </div>
    )
  }

  const paletteLight = ['#60A5FA','#34D399','#FBBF24','#F472B6','#818CF8','#F97316','#A78BFA']
  const paletteDark = ['#3B82F6','#10B981','#D97706','#DB2777','#6366F1','#F59E0B','#8B5CF6']
  const colors = useMemo(()=> (dark ? paletteDark : paletteLight).slice(0, numericValues.length), [dark, numericValues.length])
  const data = {labels, datasets:[{data: numericValues, backgroundColor: colors, borderColor: dark? '#0f172a':'#ffffff', borderWidth:2, hoverOffset:10, borderRadius:6}]}
  const options = {
    cutout: '60%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: dark? '#e2e8f0':'#334155', usePointStyle: true, pointStyle: 'circle' }
      },
      tooltip: {
        backgroundColor: dark? 'rgba(15,23,42,0.9)':'rgba(255,255,255,0.95)',
        titleColor: dark? '#e2e8f0':'#0f172a',
        bodyColor: dark? '#cbd5e1':'#334155',
        borderColor: dark? '#334155':'#e2e8f0',
        borderWidth: 1,
        padding: 10,
      },
      datalabels: {
        color: dark? '#e2e8f0':'#0f172a',
        formatter: (value, ctx) => {
          const pct = total ? (value/total*100) : 0
          return pct >= 4 ? `${pct.toFixed(0)}%` : ''
        },
        font: { weight: '600' }
      },
      // center total
      centerText: {
        display: true,
        text: total ? `${Math.round(total).toLocaleString()}` : '',
        subtext: 'Total',
        color: dark? '#e2e8f0':'#0f172a'
      }
    }
  }
  // plugin for center text
  const plugins = [{
    id: 'centerText',
    beforeDraw(chart, args, pluginOptions){
      const { ctx, chartArea, width, height } = chart
      const opts = chart.options.plugins.centerText || {}
      if(!opts.display || !opts.text) return
      ctx.save()
      const cx = (chartArea.left + chartArea.right) / 2
      const cy = (chartArea.top + chartArea.bottom) / 2
      ctx.textAlign = 'center'
      ctx.fillStyle = opts.color || '#0f172a'
      ctx.font = '600 16px system-ui, -apple-system, Segoe UI, Roboto, sans-serif'
      ctx.fillText(opts.text, cx, cy - 2)
      if(opts.subtext){
        ctx.font = 'normal 11px system-ui, -apple-system, Segoe UI, Roboto, sans-serif'
        ctx.fillStyle = (dark? '#94a3b8':'#64748b')
        ctx.fillText(opts.subtext, cx, cy + 14)
      }
      ctx.restore()
    }
  }]
  return <Doughnut data={data} options={options} plugins={[ChartDataLabels, ...plugins]} />
}
