import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { api, Stats, UsageLog } from '@/App'

function SimpleLineChart({ data, dataKey, color = "#3b82f6" }: { data: { label: string; value: number }[]; dataKey: string; color?: string }) {
  const max = Math.max(...data.map(d => d.value), 1)
  
  return (
    <div className="flex items-end gap-1 h-32">
      {data.map((item, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div 
            className="w-full rounded-t transition-all"
            style={{ 
              height: `${(item.value / max) * 100}px`,
              backgroundColor: color,
              opacity: 0.3 + (item.value / max) * 0.7
            }}
          />
          <span className="text-[10px] text-slate-400">{item.label}</span>
        </div>
      ))}
    </div>
  )
}

function SimpleBarChart({ data, dataKey }: { data: { label: string; value: number }[]; dataKey: string }) {
  const max = Math.max(...data.map(d => d.value), 1)
  const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"]
  
  return (
    <div className="space-y-3">
      {data.map((item, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="w-20 text-sm text-slate-600 truncate">{item.label}</span>
          <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full transition-all"
              style={{ 
                width: `${(item.value / max) * 100}%`,
                backgroundColor: colors[i % colors.length]
              }}
            />
          </div>
          <span className="text-sm font-medium w-16 text-right">{item.value}</span>
        </div>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [usages, setUsages] = useState<UsageLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.getStats(),
      api.getUsage()
    ]).then(([statsRes, usageRes]) => {
      if (statsRes.success) setStats(statsRes.stats)
      if (usageRes.success) setUsages(usageRes.usages)
      setLoading(false)
    })
  }, [])

  const usageByDay = usages.reduce((acc, u) => {
    const date = new Date(u.createdAt).toLocaleDateString('en-US', { weekday: 'short' })
    acc[date] = (acc[date] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const usageByProvider = usages.reduce((acc, u) => {
    acc[u.provider] = (acc[u.provider] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const usageByKey = usages.reduce((acc, u) => {
    const name = u.apiKey?.name || 'Unknown'
    acc[name] = (acc[name] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const chartData = Object.entries(usageByDay).map(([label, value]) => ({ label, value }))
  const providerData = Object.entries(usageByProvider).map(([label, value]) => ({ label, value }))
  const keyData = Object.entries(usageByKey).map(([label, value]) => ({ label, value }))

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-slate-500 mt-1">Overview of your API usage</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Keys</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.totalKeys || 0}</div>
            <p className="text-xs text-slate-500">{stats?.activeKeys || 0} active</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.totalRequests || 0}</div>
            <p className="text-xs text-slate-500">all time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tokens</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{(stats?.totalTokens || 0).toLocaleString()}</div>
            <p className="text-xs text-slate-500">used</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Keys</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.activeKeys || 0}</div>
            <p className="text-xs text-slate-500">of {stats?.totalKeys || 0}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Requests by Day</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <SimpleLineChart data={chartData} dataKey="value" />
            ) : (
              <p className="text-sm text-slate-500 text-center py-8">No data yet</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Usage by Provider</CardTitle>
          </CardHeader>
          <CardContent>
            {providerData.length > 0 ? (
              <SimpleBarChart data={providerData} dataKey="value" />
            ) : (
              <p className="text-sm text-slate-500 text-center py-8">No data yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usage by API Key</CardTitle>
        </CardHeader>
        <CardContent>
          {keyData.length > 0 ? (
            <SimpleBarChart data={keyData.slice(0, 5)} dataKey="value" />
          ) : (
            <p className="text-sm text-slate-500 text-center py-8">No data yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
