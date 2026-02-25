import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { api, UsageLog } from '@/App'

export default function Usage() {
  const [usages, setUsages] = useState<UsageLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getUsage().then(res => {
      if (res.success) setUsages(res.usages)
      setLoading(false)
    })
  }, [])

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
        <h1 className="text-3xl font-bold">Usage Logs</h1>
        <p className="text-slate-500 mt-1">Recent API requests</p>
      </div>

      {usages.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium mb-2">No usage data yet</h3>
            <p className="text-slate-500">API requests will appear here</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-slate-50">
                    <th className="text-left p-4 text-sm font-medium text-slate-600">API Key</th>
                    <th className="text-left p-4 text-sm font-medium text-slate-600">Provider</th>
                    <th className="text-left p-4 text-sm font-medium text-slate-600">Endpoint</th>
                    <th className="text-left p-4 text-sm font-medium text-slate-600">Tokens</th>
                    <th className="text-left p-4 text-sm font-medium text-slate-600">Latency</th>
                    <th className="text-left p-4 text-sm font-medium text-slate-600">Status</th>
                    <th className="text-left p-4 text-sm font-medium text-slate-600">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {usages.map(log => (
                    <tr key={log.id} className="border-b last:border-0 hover:bg-slate-50">
                      <td className="p-4 font-medium">{log.apiKey?.name || 'Unknown'}</td>
                      <td className="p-4">
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-slate-100">
                          {log.provider}
                        </span>
                      </td>
                      <td className="p-4">
                        <code className="text-xs bg-slate-100 px-2 py-1 rounded">{log.endpoint}</code>
                      </td>
                      <td className="p-4 text-sm">{log.tokensUsed.toLocaleString()}</td>
                      <td className="p-4 text-sm">{log.latencyMs}ms</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          log.statusCode < 400 
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {log.statusCode}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-slate-500">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
