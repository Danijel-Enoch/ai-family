import { useState, useEffect } from 'react'
import { api, ProviderConfig, CreateConfigData } from '../App'

export default function ProviderConfigs() {
  const [configs, setConfigs] = useState<ProviderConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<CreateConfigData>({ name: '', provider: 'OPENAI', apiKey: '' })

  const loadConfigs = () => {
    api.getConfigs().then(res => {
      if (res.success) setConfigs(res.configs)
      setLoading(false)
    })
  }

  useEffect(() => { loadConfigs() }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    await api.createConfig(form)
    setShowModal(false)
    setForm({ name: '', provider: 'OPENAI', apiKey: '' })
    loadConfigs()
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this config? All linked proxy keys will be unlinked.')) {
      await api.deleteConfig(id)
      loadConfigs()
    }
  }

  const handleToggleActive = async (id: string, isActive: boolean) => {
    await api.updateConfig(id, { isActive: !isActive })
    loadConfigs()
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2>Provider API Keys</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add Provider</button>
      </div>

      <p style={{ marginBottom: 16, color: '#666' }}>
        Add your actual AI provider API keys here (OpenAI, Anthropic, MiniMax). Then create proxy keys for friends/family.
      </p>

      {loading ? <div className="loading">Loading...</div> : configs.length === 0 ? (
        <div className="empty">No provider configs yet. Add your first provider API key.</div>
      ) : (
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Provider</th>
                <th>API Key</th>
                <th>Proxy Keys</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {configs.map(config => (
                <tr key={config.id}>
                  <td>{config.name}</td>
                  <td>{config.provider}</td>
                  <td><code>••••••••</code></td>
                  <td>{config._count.proxyKeys}</td>
                  <td>
                    <span className={`badge ${config.isActive ? 'badge-active' : 'badge-inactive'}`}>
                      {config.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <button className="btn btn-warning btn-sm" onClick={() => handleToggleActive(config.id, config.isActive)}>
                        {config.isActive ? 'Disable' : 'Enable'}
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(config.id)}>Delete</button>
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
              <h3>Add Provider</h3>
            </div>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>Name</label>
                <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g., My OpenAI Key" required />
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
                <label>API Key</label>
                <input className="input" type="password" value={form.apiKey} onChange={e => setForm({ ...form, apiKey: e.target.value })} placeholder="sk-..." required />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
