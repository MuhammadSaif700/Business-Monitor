import React, {useState} from 'react'
import { api } from '../lib/api'
import { useToast } from './ToastProvider'

export default function Login({onToken}){
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)
  const toast = useToast()

  const submit = async e => {
    e.preventDefault()
    setErr('')
    setLoading(true)
    try{
  const res = await api.post('/auth/token', {password})
      const token = res.data.token
      onToken(token)
      toast({ type:'success', message:'Logged in' })
    }catch(e){
      const msg = e.response?.data?.detail || 'Login failed'
      setErr(msg)
      toast({ type:'error', message: msg })
    }finally{setLoading(false)}
  }

  return (
    <div className="panel p-4 mb-4 max-w-md">
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Password</label>
          <input type="password" placeholder="••••••" value={password} onChange={e=>setPassword(e.target.value)} className="input" />
        </div>
        <div className="flex items-center gap-3">
          <button disabled={loading} className="btn px-4">{loading? '...' : 'Login'}</button>
          {err && <div className="text-xs text-red-600 dark:text-red-400">{err}</div>}
        </div>
      </form>
    </div>
  )
}
