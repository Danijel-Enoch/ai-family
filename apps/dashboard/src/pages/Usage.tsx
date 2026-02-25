import { useState, useEffect } from 'react'
import { api, UsageLog } from '../App'

export default function Usage() {
  const [usages, setUsages] = useState<UsageLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getUsage().then(res => {
      if (res.success) setUsages(res.usages)
      setLoading(false)
    })
  }, [])

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>Usage Logs</h2>
      {loading ? <div className="loading">Loading...</div> : usages.length === 0 ? (
        <div className="empty">No usage data yet.</div>
      ) : (
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>API Key</th>
                <th>Provider</th>
                <th>Endpoint</th>
                <th>Tokens</th>
                <th>Latency</th>
                <th>Status</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {usages.map(log => (
                <tr key={log.id}>
                  <td>{log.apiKey.name}</td>
                  <td>{log.provider}</td>
                  <td><code>{log.endpoint}</code></td>
                  <td>{log.tokensUsed.toLocaleString()}</td>
                  <td>{log.latencyMs}ms</td>
                  <td>
                    <span className={`badge ${log.statusCode < 400 ? 'badge-active' : 'badge-inactive'}`}>
                      {log.statusCode}
                    </span>
                  </td>
                  <td>{new Date(log.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
