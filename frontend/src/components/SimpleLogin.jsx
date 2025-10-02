import React, { useState } from 'react'
import { api, setApiToken } from '../lib/api'

export default function SimpleLogin({ onToken }) {
  const [loading, setLoading] = useState(false)
  
  const handleLegacyLogin = async () => {
    setLoading(true)
    try {
      // Set the API key directly
      setApiToken('738353')
      console.log('Legacy token set:', '738353')
      
      // Test the API immediately
      const testRes = await api.get('/datasets')
      console.log('API test successful:', testRes.data)
      
      onToken('738353')
    } catch (error) {
      console.error('Legacy login failed:', error)
      alert('Login failed: ' + (error.response?.data?.detail || error.message))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">Simple Login</h2>
        <button 
          onClick={handleLegacyLogin}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Logging in...' : 'Login with Demo Credentials'}
        </button>
      </div>
    </div>
  )
}