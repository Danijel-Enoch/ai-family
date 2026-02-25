import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect, createContext, useContext } from 'react'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import ApiKeys from './pages/ApiKeys'
import ProviderConfigs from './pages/ProviderConfigs'
import Usage from './pages/Usage'
import Layout from './components/Layout'

interface User {
  id: string
  email: string
  role: string
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}

export const api = {
  baseUrl: 'http://localhost:3000',
  
  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = localStorage.getItem('token')
    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    })
    if (res.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return res.json()
  },
  
  login: (email: string, password: string) => 
    api.request<{ success: boolean; user?: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }).then(res => {
      if (!res.success) throw new Error('Login failed')
      localStorage.setItem('token', 'logged-in')
    }),
  
  logout: () => 
    api.request('/auth/logout', { method: 'POST' }),
  
  getConfigs: () => api.request<{ success: boolean; configs: ProviderConfig[] }>('/admin/configs'),
  
  createConfig: (data: CreateConfigData) => 
    api.request<{ success: boolean; config: ProviderConfig }>('/admin/configs', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  updateConfig: (id: string, data: Partial<ProviderConfig>) =>
    api.request<{ success: boolean }>(`/admin/configs/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  
  deleteConfig: (id: string) =>
    api.request<{ success: boolean }>(`/admin/configs/${id}`, { method: 'DELETE' }),
  
  getKeys: () => api.request<{ success: boolean; keys: ApiKey[] }>('/admin/keys'),
  
  createKey: (data: CreateKeyData) => 
    api.request<{ success: boolean; key: ApiKey }>('/admin/keys', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  updateKey: (id: string, data: Partial<ApiKey>) =>
    api.request<{ success: boolean }>(`/admin/keys/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  
  deleteKey: (id: string) =>
    api.request<{ success: boolean }>(`/admin/keys/${id}`, { method: 'DELETE' }),
  
  pauseKey: (id: string) =>
    api.request<{ success: boolean }>(`/admin/keys/${id}/pause`, { method: 'POST' }),
  
  resumeKey: (id: string) =>
    api.request<{ success: boolean }>(`/admin/keys/${id}/resume`, { method: 'POST' }),
  
  revokeKey: (id: string) =>
    api.request<{ success: boolean }>(`/admin/keys/${id}/revoke`, { method: 'POST' }),
  
  getUsage: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : ''
    return api.request<{ success: boolean; usages: UsageLog[]; stats: UsageStats[] }>(`/admin/usage${query}`)
  },
  
  getStats: () => 
    api.request<{ success: boolean; stats: Stats }>('/admin/stats'),
}

export interface ProviderConfig {
  id: string
  name: string
  provider: 'ANTHROPIC' | 'OPENAI' | 'MINIMAX'
  apiKey?: string
  isActive: boolean
  userId: string
  _count: { proxyKeys: number }
  createdAt: string
}

export interface CreateConfigData {
  name: string
  provider: 'ANTHROPIC' | 'OPENAI' | 'MINIMAX'
  apiKey: string
}

export interface ApiKey {
  id: string
  key: string
  name: string
  provider: 'ANTHROPIC' | 'OPENAI' | 'MINIMAX'
  isActive: boolean
  rateLimit: number
  userId: string
  user: { id: string; email: string }
  providerConfig?: { id: string; name: string; provider: string }
  _count: { usages: number }
  createdAt: string
  revokedAt: string | null
}

export interface CreateKeyData {
  name: string
  provider: 'ANTHROPIC' | 'OPENAI' | 'MINIMAX'
  providerConfigId?: string
  rateLimit?: number
}

export interface UsageLog {
  id: string
  apiKeyId: string
  apiKey: { id: string; name: string; provider: string }
  provider: string
  endpoint: string
  tokensUsed: number
  latencyMs: number
  statusCode: number
  createdAt: string
}

export interface UsageStats {
  apiKeyId: string
  _count: { id: number }
  _sum: { tokensUsed: number | null }
}

export interface Stats {
  totalKeys: number
  activeKeys: number
  totalRequests: number
  totalTokens: number
}

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      setUser({ id: '1', email: 'admin', role: 'ADMIN' })
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    await api.login(email, password)
    setUser({ id: '1', email, role: 'ADMIN' })
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
  }

  if (isLoading) return <div>Loading...</div>

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
          <Route path="/" element={user ? <Layout /> : <Navigate to="/login" />}>
            <Route index element={<Dashboard />} />
            <Route path="configs" element={<ProviderConfigs />} />
            <Route path="keys" element={<ApiKeys />} />
            <Route path="usage" element={<Usage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  )
}

export default App
