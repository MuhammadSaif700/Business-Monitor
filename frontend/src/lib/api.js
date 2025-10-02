import axios from 'axios'

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export const api = axios.create({ baseURL })

// helper
export const fmtCurrency = (n) => typeof n === 'number' ? n.toLocaleString(undefined,{style:'currency',currency:'USD'}) : n
