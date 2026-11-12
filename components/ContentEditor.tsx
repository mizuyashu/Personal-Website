'use client'

import { useEffect, useState } from 'react'

type Kind = 'projects' | 'team'
type Field = { name: string; label: string; type?: 'textarea' | 'select' | 'lines'; options?: string[] }

const CONFIG: Record<Kind, { path: string; titleKey: string; fields: Field[] }> = {
  projects: {
    path: '/projects', titleKey: 'title',
    fields: [
      { name: 'title', label: 'Title' },
      { name: 'short_description', label: 'Short description' },
      { name: 'description', label: 'Full description', type: 'textarea' },
      { name: 'status', label: 'Status', type: 'select', options: ['completed', 'in_progress', 'planned'] },
      { name: 'year', label: 'Year' },
      { name: 'images', label: 'Image links (one per line)', type: 'lines' },
    ],
  },
  team: {
    path: '/team', titleKey: 'name',
    fields: [
      { name: 'name', label: 'Name' },
      { name: 'role', label: 'Role' },
      { name: 'major', label: 'Major' },
      { name: 'image_url', label: 'Photo link' },
      { name: 'email', label: 'Email' },
      { name: 'bio', label: 'Bio', type: 'textarea' },
    ],
  },
}

const box = 'border-2 border-solar-light-green rounded-lg p-2 w-full'
const btn = 'bg-solar-green text-white rounded-lg px-3 py-1 text-sm'

export function StorageMeter({ refresh = 0 }: { refresh?: number }) {
  const [s, setS] = useState<{ usedMB: number; limitMB: number; pct: number } | null>(null)
  useEffect(() => {
    fetch('/api/storage', { cache: 'no-store' }).then((r) => r.json()).then(setS)
  }, [refresh])
  if (!s) return null
  const color = s.pct >= 90 ? 'bg-red-600' : s.pct >= 70 ? 'bg-yellow-500' : 'bg-solar-green'
  return (
    <div>
      <p className="text-sm">Storage: {s.usedMB} MB of {s.limitMB} MB ({s.pct}%)</p>
      <div className="h-3 bg-gray-200 rounded">
        <div className={`h-3 rounded ${color}`} style={{ width: `${Math.min(s.pct, 100)}%` }} />
      </div>
      {s.pct >= 70 && <p className="text-sm text-red-600">Storage is getting full. Delete unused items.</p>}
    </div>
  )
}

export default function ContentEditor({ kind, onChange }: { kind: Kind; onChange?: () => void }) {
  const cfg = CONFIG[kind]
  const [items, setItems] = useState<any[]>([])
  const [form, setForm] = useState<any>(null)
  const [versions, setVersions] = useState<any[]>([])
  const [msg, setMsg] = useState('')
  const [frameKey, setFrameKey] = useState(0)

  const load = () =>
    fetch(`/api/${kind}`, { cache: 'no-store' }).then((r) => r.json()).then(setItems)

  const loadHistory = (id: number) =>
    fetch(`/api/content/${kind}?id=${id}`).then((r) => r.json()).then(setVersions)

  useEffect(() => { load(); setForm(null); setVersions([]); setMsg('') }, [kind])

  const toForm = (it: any) => ({ ...it, images: Array.isArray(it.images) ? it.images.join('\n') : it.images })

  function pick(it: any) { setForm(toForm(it)); setMsg(''); loadHistory(it.id) }

  function newItem() {
    const f: any = {}
    cfg.fields.forEach((x) => { if (x.type === 'select') f[x.name] = x.options![0] })
    setForm(f); setVersions([]); setMsg('')
  }

  async function post(item: any) {
    const body = { ...item }
    if (typeof body.images === 'string')
      body.images = body.images.split('\n').map((s: string) => s.trim()).filter(Boolean)
    const r = await fetch(`/api/content/${kind}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item: body }),
    })
    return { ok: r.ok, ...(await r.json()) }
  }

  async function save() {
    const r = await post(form)
    if (!r.ok) return setMsg(r.error || 'Failed')
    setMsg('Saved!'); setForm({ ...form, id: r.id })
    await load(); loadHistory(r.id); setFrameKey((k) => k + 1); onChange?.()
  }

  async function remove() {
    if (!form?.id || !confirm('Delete this item and its history permanently?')) return
    await fetch(`/api/content/${kind}?id=${form.id}`, { method: 'DELETE' })
    setForm(null); setVersions([]); setMsg('Deleted'); await load(); setFrameKey((k) => k + 1); onChange?.()
  }

  async function importOld() {
    const url = prompt('Link to the old data (e.g. https://old-site.com/api/' + kind + ')')
    if (!url) return
    try {
      const old = await (await fetch(url)).json()
      for (const it of old) await post(it)
      setMsg(`Imported ${old.length} items`); load(); setFrameKey((k) => k + 1); onChange?.()
    } catch { setMsg('Import failed (the old site may block this). Add items by hand instead.') }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <button className={btn} onClick={newItem}>+ New</button>
          {items.length === 0 && <button className={btn} onClick={importOld}>Import old data</button>}
        </div>

        <div className="max-h-40 overflow-y-auto border rounded-lg">
          {items.map((it) => (
            <button key={it.id} onClick={() => pick(it)}
              className={`block w-full text-left px-3 py-1 hover:bg-green-50 ${form?.id === it.id ? 'bg-green-100' : ''}`}>
              {it[cfg.titleKey]}
            </button>
          ))}
        </div>

        {form && (
          <div className="space-y-2">
            {cfg.fields.map((f) => (
              <label key={f.name} className="block text-sm">
                {f.label}
                {f.type === 'textarea' || f.type === 'lines' ? (
                  <textarea className={box} rows={f.type === 'lines' ? 3 : 5}
                    value={form[f.name] ?? ''} onChange={(e) => setForm({ ...form, [f.name]: e.target.value })} />
                ) : f.type === 'select' ? (
                  <select className={box} value={form[f.name] ?? ''}
                    onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}>
                    {f.options!.map((o) => <option key={o}>{o}</option>)}
                  </select>
                ) : (
                  <input className={box} value={form[f.name] ?? ''}
                    onChange={(e) => setForm({ ...form, [f.name]: e.target.value })} />
                )}
              </label>
            ))}
            <div className="flex gap-2">
              <button className={btn} onClick={save}>Save</button>
              {form.id && <button className="bg-red-600 text-white rounded-lg px-3 py-1 text-sm" onClick={remove}>Delete</button>}
            </div>

            {versions.length > 0 && (
              <div>
                <p className="text-sm font-semibold mt-2">History (click to load into the form, then Save to restore)</p>
                <div className="max-h-32 overflow-y-auto border rounded-lg">
                  {versions.map((v, i) => (
                    <button key={i} onClick={() => setForm(toForm(v.data))}
                      className="block w-full text-left px-3 py-1 text-sm hover:bg-green-50">
                      {new Date(v.savedAt).toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        {msg && <p className="text-sm">{msg}</p>}
      </div>

      <iframe key={frameKey} src={cfg.path} className="w-full h-[80vh] border-2 rounded-lg" />
    </div>
  )
}