import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { api, ProviderConfig, CreateConfigData } from '@/App'

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
    if (confirm('Are you sure you want to delete this config?')) {
      await api.deleteConfig(id)
      loadConfigs()
    }
  }

  const handleToggleActive = async (id: string, isActive: boolean) => {
    await api.updateConfig(id, { isActive: !isActive })
    loadConfigs()
  }

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'OPENAI': return '🤖'
      case 'ANTHROPIC': return '🧠'
      case 'MINIMAX': return '⚡'
      default: return '🔑'
    }
  }

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
          <h1 className="text-3xl font-bold">Providers</h1>
          <p className="text-slate-500 mt-1">Manage your AI provider API keys</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Provider
        </Button>
      </div>

      {configs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium mb-2">No providers yet</h3>
            <p className="text-slate-500 mb-4">Add your first AI provider API key to get started</p>
            <Button onClick={() => setShowModal(true)}>Add Provider</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {configs.map(config => (
            <Card key={config.id} className={`${!config.isActive ? 'opacity-60' : ''}`}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-slate-100 rounded-lg flex items-center justify-center text-xl">
                    {getProviderIcon(config.provider)}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{config.name}</CardTitle>
                    <p className="text-sm text-slate-500">{config.provider}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      config.isActive 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {config.isActive ? 'Active' : 'Disabled'}
                    </span>
                    <span className="text-sm text-slate-500">
                      {config._count.proxyKeys} keys
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleToggleActive(config.id, config.isActive)}
                    >
                      {config.isActive ? 'Disable' : 'Enable'}
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => handleDelete(config.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <Card className="w-[450px] m-4" onClick={e => e.stopPropagation()}>
            <CardHeader>
              <CardTitle>Add Provider</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Name</label>
                  <Input 
                    value={form.name} 
                    onChange={e => setForm({ ...form, name: e.target.value })} 
                    placeholder="e.g., My OpenAI Key"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Provider</label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                    value={form.provider}
                    onChange={e => setForm({ ...form, provider: e.target.value as 'OPENAI' | 'ANTHROPIC' | 'MINIMAX' })}
                  >
                    <option value="OPENAI">OpenAI</option>
                    <option value="ANTHROPIC">Anthropic</option>
                    <option value="MINIMAX">MiniMax</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">API Key</label>
                  <Input 
                    type="password"
                    value={form.apiKey} 
                    onChange={e => setForm({ ...form, apiKey: e.target.value })} 
                    placeholder="sk-..."
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
                  <Button type="submit">Add Provider</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
