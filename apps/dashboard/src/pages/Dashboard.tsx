import { useState, useEffect } from 'react'
import { api, Stats } from '../App'

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getStats().then(res => {
      if (res.success) setStats(res.stats)
      setLoading(false)
    })
  }, [])

  if (loading) return <div className="loading">Loading...</div>

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>Overview</h2>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats?.totalKeys || 0}</div>
          <div className="stat-label">Total API Keys</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats?.activeKeys || 0}</div>
          <div className="stat-label">Active Keys</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats?.totalRequests || 0}</div>
          <div className="stat-label">Total Requests</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{(stats?.totalTokens || 0).toLocaleString()}</div>
          <div className="stat-label">Total Tokens</div>
        </div>
      </div>
    </div>
  )
}
