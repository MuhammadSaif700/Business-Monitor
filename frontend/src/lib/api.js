import axios from 'axios'

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export const api = axios.create({ baseURL })

export function setApiToken(token){
  if(token){
    // Support both JWT tokens and legacy API keys
    if (token.includes('.')) {
      // JWT token
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    } else {
      // Legacy API key
      api.defaults.headers.common['X-API-Key'] = token
    }
    localStorage.setItem('api_token', token)
  }else{
    delete api.defaults.headers.common['Authorization']
    delete api.defaults.headers.common['X-API-Key']
    localStorage.removeItem('api_token')
  }
}

// Initialize with stored token on app load
const storedToken = localStorage.getItem('api_token')
if (storedToken) {
  setApiToken(storedToken)
}

// helper
export const fmtCurrency = (n) => typeof n === 'number' ? n.toLocaleString(undefined,{style:'currency',currency:'USD'}) : n
