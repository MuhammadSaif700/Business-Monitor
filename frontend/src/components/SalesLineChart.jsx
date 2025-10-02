import React, {useMemo} from 'react'
import { Line } from 'react-chartjs-2'
import 'chart.js/auto'

export default function SalesLineChart({data, options={}}){
  const dark = typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : false
  const colors = useMemo(()=> ({
    line: dark ? 'rgba(96,165,250,1)' : 'rgba(37,99,235,1)',
    fill: dark ? 'rgba(96,165,250,0.15)' : 'rgba(37,99,235,0.2)',
    grid: dark ? '#334155' : '#e2e8f0',
    text: dark ? '#cbd5e1' : '#475569'
  }),[dark])
  // data: {dates:[], amounts:[]}
  const chartData = {
    labels: data?.dates || [],
    datasets: [
      {
        label: 'Sales',
        data: data?.amounts || [],
        borderColor: colors.line,
        backgroundColor: colors.fill,
        tension: 0.35,
        pointRadius: 2,
        pointHoverRadius: 4
      }
    ]
  }
  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {display: true, position:'top'},
      tooltip: {
        callbacks: {
          label: (ctx) => ` ${ctx.dataset.label}: ${ctx.parsed.y.toLocaleString()}`
        }
      }
    },
    scales: {
      x: {title: {display: true, text: options.xLabel || 'Date'}, grid:{color: colors.grid}, ticks:{color: colors.text, maxRotation: 45, minRotation: 0}},
      y: {
        title: {display: true, text: options.yLabel || 'Sales Amount'},
        ticks: { callback: (v)=> v.toLocaleString(), color: colors.text },
        grid:{color: colors.grid},
        beginAtZero: true
      }
    }
  }
  return (
    <div style={{width: '100%', height: '100%', minHeight: '260px'}}>
      <Line data={chartData} options={defaultOptions} />
    </div>
  )
}
