import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { api, ApiKey, ProviderConfig } from '@/App'

export default function ApiKeys() {
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [configs, setConfigs] = useState<ProviderConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', provider: 'OPENAI', rateLimit: 60 })

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
    const configId = configs.find(c => c.provider === form.provider && c.isActive)?.id
    if (!configId) return
    await api.createKey({ name: form.name, provider: form.provider as any, providerConfigId: configId, rateLimit: form.rateLimit })
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
    if (confirm('Revoke this key?')) {
      await api.revokeKey(id)
      loadData()
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Delete this key?')) {
      await api.deleteKey(id)
      loadData()
    }
  }

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key)
    alert('Copied!')
  }

  const availableConfigs = configs.filter(c => c.provider === form.provider && c.isActive)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Proxy Keys</h1>
          <p className="text-slate-500 mt-1">Create keys for friends and family</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Key
        </Button>
      </div>

      {keys.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium mb-2">No proxy keys yet</h3>
            <p className="text-slate-500 mb-4">Create your first proxy key to share with friends</p>
            <Button onClick={() => setShowModal(true)}>Create Key</Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-slate-50">
                    <th className="text-left p-4 text-sm font-medium text-slate-600">Name</th>
                    <th className="text-left p-4 text-sm font-medium text-slate-600">Provider</th>
                    <th className="text-left p-4 text-sm font-medium text-slate-600">Linked To</th>
                    <th className="text-left p-4 text-sm font-medium text-slate-600">API Key</th>
                    <th className="text-left p-4 text-sm font-medium text-slate-600">Status</th>
                    <th className="text-left p-4 text-sm font-medium text-slate-600">Usage</th>
                    <th className="text-left p-4 text-sm font-medium text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {keys.map(key => (
                    <tr key={key.id} className="border-b last:border-0 hover:bg-slate-50">
                      <td className="p-4 font-medium">{key.name}</td>
                      <td className="p-4">
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-slate-100">
                          {key.provider}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-slate-600">
                        {key.providerConfig?.name || '—'}
                      </td>
                      <td className="p-4">
                        <code 
                          className="text-xs bg-slate-100 px-2 py-1 rounded cursor-pointer hover:bg-slate-200"
                          onClick={() => copyKey(key.key)}
                        >
                          {key.key.slice(0, 16)}...
                        </code>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          key.revokedAt 
                            ? 'bg-red-100 text-red-700'
                            : key.isActive 
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {key.revokedAt ? 'Revoked' : key.isActive ? 'Active' : 'Paused'}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-slate-600">
                        {key._count.usages} requests
                      </td>
                      <td className="p-4">
                        <div className="flex gap-1">
                          {key.isActive ? (
                            <Button size="sm" variant="outline" onClick={() => handlePause(key.id)}>Pause</Button>
                          ) : (
                            <Button size="sm" variant="outline" onClick={() => handleResume(key.id)}>Resume</Button>
                          )}
                          <Button size="sm" variant="destructive" onClick={() => handleRevoke(key.id)}>Revoke</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <Card className="w-[450px] m-4" onClick={e => e.stopPropagation()}>
            <CardHeader>
              <CardTitle>Create Proxy Key</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Name</label>
                  <Input 
                    value={form.name} 
                    onChange={e => setForm({ ...form, name: e.target.value })} 
                    placeholder="e.g., Friend John"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Provider</label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                    value={form.provider}
                    onChange={e => setForm({ ...form, provider: e.target.value })}
                  >
                    <option value="OPENAI">OpenAI</option>
                    <option value="ANTHROPIC">Anthropic</option>
                    <option value="MINIMAX">MiniMax</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Rate Limit (req/min)</label>
                  <Input 
                    type="number"
                    value={form.rateLimit} 
                    onChange={e => setForm({ ...form, rateLimit: parseInt(e.target.value) })} 
                  />
                </div>
                {availableConfigs.length === 0 && (
                  <p className="text-sm text-red-500">
                    No active config for {form.provider}. Add one in Providers first.
                  </p>
                )}
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
                  <Button type="submit" disabled={availableConfigs.length === 0}>Create</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
