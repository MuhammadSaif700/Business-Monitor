import React, {useEffect, useState, useMemo} from 'react'
import { api, fmtCurrency } from '../lib/api'

export default function TransactionsTable(){
  const [rows, setRows] = useState([])
  const [limit, setLimit] = useState(25)
  const [offset, setOffset] = useState(0)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [product, setProduct] = useState('')
  const [region, setRegion] = useState('')
  const [customer, setCustomer] = useState('')
  const [sortBy, setSortBy] = useState('date')
  const [sortDir, setSortDir] = useState('desc')
  const [totals, setTotals] = useState({page_amount: 0, global_amount: null})
  const [meta, setMeta] = useState({products:[], regions:[], customers:[]})
  // Derived page total amount if backend totals are missing
  const pageAmountFallback = useMemo(()=> rows.reduce((acc, r)=> acc + ((Number(r.quantity)||0) * (Number(r.price)||0)), 0), [rows])

  const fetchPage = async ()=>{
  const params = {limit, offset, sort_by:sortBy, sort_dir:sortDir}
  if(debouncedSearch) params.search = debouncedSearch
    if(product) params.product = product
    if(region) params.region = region
    if(customer) params.customer = customer
    const res = await api.get('/transactions', {params})
    setRows(res.data.transactions || [])
    setTotal(res.data.pagination?.total || 0)
    setTotals(res.data.totals || {page_amount: 0, global_amount: null})
  }

  useEffect(()=>{ fetchPage().catch(console.error) },[limit, offset, debouncedSearch, product, region, customer, sortBy, sortDir])
  useEffect(()=>{
    const t = setTimeout(()=> setDebouncedSearch(search), 300)
    return ()=> clearTimeout(t)
  },[search])

  useEffect(()=>{
    // load distincts for quick filters
    api.get('/meta/distincts').then(res=> setMeta(res.data)).catch(()=>{})
  },[])

  return (
    <div className="panel p-4 space-y-3">
      <div className="flex flex-wrap gap-2 items-center text-xs">
  <input value={search} onChange={e=>{setOffset(0);setSearch(e.target.value)}} placeholder="Search (product, customer, region, type)" className="input !py-1 !px-2 w-48" />
        <select value={product} onChange={e=>{setOffset(0);setProduct(e.target.value)}} className="input !py-1 !px-2 w-36">
          <option value="">All products</option>
          {meta.products.map(p=> <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={region} onChange={e=>{setOffset(0);setRegion(e.target.value)}} className="input !py-1 !px-2 w-36">
          <option value="">All regions</option>
          {meta.regions.map(r=> <option key={r} value={r}>{r}</option>)}
        </select>
        <select value={customer} onChange={e=>{setOffset(0);setCustomer(e.target.value)}} className="input !py-1 !px-2 w-36">
          <option value="">All customers</option>
          {meta.customers.map(c=> <option key={c} value={c}>{c}</option>)}
        </select>
        <a className="link" href={(import.meta.env.VITE_API_BASE_URL||'http://127.0.0.1:8000') + '/export/upload_errors.csv'}>Download last upload errors</a>
      </div>
      <div className="flex items-center justify-between gap-4">
        <h3 className="font-semibold text-sm tracking-wide uppercase text-slate-500 dark:text-slate-300">Transactions</h3>
        <div className="flex items-center gap-2 text-xs">
          <button disabled={offset===0} onClick={()=>setOffset(o=> Math.max(0, o-limit))} className="btn-outline px-2 py-1 disabled:opacity-50">Prev</button>
          <button disabled={offset+limit >= total} onClick={()=>setOffset(o=> o+limit)} className="btn-outline px-2 py-1 disabled:opacity-50">Next</button>
          <select value={limit} onChange={e=>{setOffset(0); setLimit(Number(e.target.value))}} className="input !py-1 !px-2 w-auto">
            {[10,25,50,100].map(n=> <option key={n} value={n}>{n}</option>)}
          </select>
          <span className="text-slate-500 dark:text-slate-400">{offset+1}-{Math.min(offset+limit, total)} / {total}</span>
          {/* Export all filtered */}
          <a className="link" href={(import.meta.env.VITE_API_BASE_URL||'http://127.0.0.1:8000') + `/export/transactions?${new URLSearchParams({product:product||'',region:region||'',customer:customer||'',search:debouncedSearch||'',sort_by:sortBy,sort_dir:sortDir})}`}>Export all (filtered)</a>
          {/* Export current page */}
          <a className="link" href={(import.meta.env.VITE_API_BASE_URL||'http://127.0.0.1:8000') + `/export/transactions?${new URLSearchParams({product:product||'',region:region||'',customer:customer||'',search:debouncedSearch||'',sort_by:sortBy,sort_dir:sortDir, limit:String(limit), offset:String(offset)})}`}>Export page</a>
        </div>
      </div>
      <div className="overflow-auto max-h-80 scrollbar-thin">
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-slate-800 text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
            <tr>
              {[
                {key:'date', label:'Date', align:'left'},
                {key:'type', label:'Type', align:'left'},
                {key:'product', label:'Product', align:'left'},
                {key:'quantity', label:'Qty', align:'right'},
                {key:'price', label:'Price', align:'right'},
                {key:'customer', label:'Customer', align:'left'},
                {key:'region', label:'Region', align:'left'},
              ].map(col => (
                <th key={col.key} className={`py-2 px-2 text-${col.align}`}>
                  <button className="hover:underline" onClick={()=>{
                    if(sortBy===col.key){ setSortDir(d=> d==='asc'?'desc':'asc') } else { setSortBy(col.key); setSortDir(col.key==='date'?'desc':'asc') }
                  }}>
                    {col.label}{sortBy===col.key ? (sortDir==='asc'?' ▲':' ▼') : ''}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {rows.map((r,i)=> (
              <tr key={i} className={i%2===1? 'bg-slate-50/50 dark:bg-slate-800/40':''}>
                <td className="px-2 py-1 whitespace-nowrap">{r.date}</td>
                <td className="px-2 py-1">{r.type}</td>
                <td className="px-2 py-1">{r.product}</td>
                <td className="px-2 py-1 text-right tabular-nums">{r.quantity}</td>
                <td className="px-2 py-1 text-right tabular-nums">{fmtCurrency(r.price)}</td>
                <td className="px-2 py-1">{r.customer}</td>
                <td className="px-2 py-1">{r.region}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-slate-200 dark:border-slate-700 font-semibold">
              <td colSpan={4}></td>
              <td className="px-2 py-2 text-right tabular-nums">{fmtCurrency(totals.page_amount ?? pageAmountFallback)}</td>
              <td colSpan={2}></td>
            </tr>
            <tr className="text-xs text-slate-500 dark:text-slate-400">
              <td colSpan={4}></td>
              <td className="px-2 py-1 text-right tabular-nums">Global total: {totals.global_amount != null ? fmtCurrency(totals.global_amount) : '—'}</td>
              <td colSpan={2}></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
