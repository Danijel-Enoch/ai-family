import { useState, useEffect } from 'react'
import { api, ApiKey, CreateKeyData, ProviderConfig } from '../App'

export default function ApiKeys() {
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [configs, setConfigs] = useState<ProviderConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<CreateKeyData>({ name: '', provider: 'OPENAI', rateLimit: 60 })

  const loadData = () => {
    Promise.all([api.getKeys(), api.getConfigs()]).then(([keysRes, configsRes]) => {
      if (keysRes.success) setKeys(keysRes.keys)
      if (configsRes.success) setConfigs(configsRes.configs)
      setLoading(false)
    })
  }

  useEffect(() => { loadData() }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    await api.createKey(form)
    setShowModal(false)
    setForm({ name: '', provider: 'OPENAI', rateLimit: 60 })
    loadData()
  }

  const handlePause = async (id: string) => {
    await api.pauseKey(id)
    loadData()
  }

  const handleResume = async (id: string) => {
    await api.resumeKey(id)
    loadData()
  }

  const handleRevoke = async (id: string) => {
    if (confirm('Are you sure you want to revoke this key?')) {
      await api.revokeKey(id)
      loadData()
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this key?')) {
      await api.deleteKey(id)
      loadData()
    }
  }

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key)
    alert('API key copied to clipboard')
  }

  const getStatusBadge = (key: ApiKey) => {
    if (key.revokedAt) return <span className="badge badge-paused">Revoked</span>
    if (!key.isActive) return <span className="badge badge-inactive">Paused</span>
    return <span className="badge badge-active">Active</span>
  }

  const getProviderBadge = (key: ApiKey) => {
    if (!key.providerConfig) return <span className="badge badge-inactive">No Provider</span>
    return <span className="badge badge-active">{key.providerConfig.name}</span>
  }

  const availableConfigs = configs.filter(c => c.provider === form.provider && c.isActive)

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2>Proxy Keys</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Create Proxy Key</button>
      </div>

      <p style={{ marginBottom: 16, color: '#666' }}>
        Create proxy API keys for friends/family. Each proxy key links to a provider config.
      </p>

      {loading ? <div className="loading">Loading...</div> : keys.length === 0 ? (
        <div className="empty">No proxy keys yet. Create one to share with friends/family.</div>
      ) : (
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Provider</th>
                <th>Linked To</th>
                <th>API Key</th>
                <th>Status</th>
                <th>Requests</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {keys.map(key => (
                <tr key={key.id}>
                  <td>{key.name}</td>
                  <td>{key.provider}</td>
                  <td>{getProviderBadge(key)}</td>
                  <td>
                    <code style={{ cursor: 'pointer' }} onClick={() => copyKey(key.key)}>
                      {key.key.slice(0, 20)}...
                    </code>
                  </td>
                  <td>{getStatusBadge(key)}</td>
                  <td>{key._count.usages}</td>
                  <td>
                    <div className="flex gap-2">
                      {key.isActive ? (
                        <button className="btn btn-warning btn-sm" onClick={() => handlePause(key.id)}>Pause</button>
                      ) : (
                        <button className="btn btn-success btn-sm" onClick={() => handleResume(key.id)}>Resume</button>
                      )}
                      <button className="btn btn-danger btn-sm" onClick={() => handleRevoke(key.id)}>Revoke</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(key.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Proxy Key</h3>
            </div>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>Name</label>
                <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g., Friend John" required />
              </div>
              <div className="form-group">
                <label>Provider</label>
                <select className="select" value={form.provider} onChange={e => setForm({ ...form, provider: e.target.value as 'OPENAI' | 'ANTHROPIC' | 'MINIMAX' })}>
                  <option value="OPENAI">OpenAI</option>
                  <option value="ANTHROPIC">Anthropic</option>
                  <option value="MINIMAX">MiniMax</option>
                </select>
              </div>
              <div className="form-group">
                <label>Provider Config</label>
                <select className="select" required>
                  <option value="">Select a provider config...</option>
                  {availableConfigs.map(config => (
                    <option key={config.id} value={config.id}>{config.name}</option>
                  ))}
                </select>
                {availableConfigs.length === 0 && (
                  <p style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                    No active config for {form.provider}. Add one in Providers first.
                  </p>
                )}
              </div>
              <div className="form-group">
                <label>Rate Limit (req/min)</label>
                <input className="input" type="number" value={form.rateLimit} onChange={e => setForm({ ...form, rateLimit: parseInt(e.target.value) })} />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={availableConfigs.length === 0}>Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
