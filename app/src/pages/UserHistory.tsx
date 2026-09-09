import React, { useEffect, useState } from 'react'
import { LoginButton } from '../components/LoginButton'
import { MainMenu } from '../components/MainMenu'
import { getMyUserHistory, logUserEvent } from '../services/api'
import { UserActivityEvent } from '../types'

export const UserHistory: React.FC = () => {
  const [query, setQuery] = useState('')
  const [items, setItems] = useState<UserActivityEvent[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const load = async (searchText = '') => {
    setIsLoading(true)
    setError('')
    try {
      const response = await getMyUserHistory({ q: searchText, limit: 100 })
      setItems(response.items)
      setTotal(response.total)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load history')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void load('')
  }, [])

  const handleSearch = async (event: React.FormEvent) => {
    event.preventDefault()
    await logUserEvent({ action: 'history_search', target: query || 'all' }).catch(() => undefined)
    await load(query)
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(0,166,166,0.08),transparent_28%),linear-gradient(180deg,#eef3f7_0%,#e7edf2_100%)] text-slate-800">
      <header className="relative z-[200] border-b border-white/70 bg-white/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <img src="/sextant-logo-horiz.svg" alt="Sextant" className="h-8 w-auto" />
          <LoginButton />
        </div>
      </header>

      <MainMenu breadcrumb="Account / History" />

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <section className="surface-panel rounded-[2rem] p-7">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="section-kicker mb-2">Audit Trail</p>
              <h1 className="text-3xl font-semibold text-slate-900">User activity history</h1>
              <p className="mt-2 text-slate-600">Search login and application action logs captured by Sextant services.</p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">
              {total} events
            </span>
          </div>

          <form className="mt-6 flex flex-wrap gap-3" onSubmit={handleSearch}>
            <input
              className="input-field min-w-[18rem] flex-1"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search action, path, method, or metadata"
            />
            <button className="button-primary" type="submit" disabled={isLoading}>
              {isLoading ? 'Searching...' : 'Search'}
            </button>
            <button
              className="button-secondary"
              type="button"
              onClick={() => {
                setQuery('')
                void load('')
              }}
            >
              Reset
            </button>
          </form>

          {error && <p className="mt-4 text-sm font-semibold text-rose-700">{error}</p>}

          <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white/65">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-[0.08em] text-slate-600">
                <tr>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">Path / Target</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 text-slate-600">{new Date(item.created_at).toLocaleString()}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{item.action}</td>
                    <td className="px-4 py-3 text-slate-700">{item.source}</td>
                    <td className="px-4 py-3 text-slate-700">{item.path || item.target || '-'}</td>
                    <td className="px-4 py-3 text-slate-700">{item.status_code ?? '-'}</td>
                    <td className="px-4 py-3 text-slate-700">{item.duration_ms ? `${item.duration_ms} ms` : '-'}</td>
                  </tr>
                ))}
                {items.length === 0 && !isLoading && (
                  <tr>
                    <td className="px-4 py-6 text-slate-600" colSpan={6}>
                      No history events found for this query.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  )
}
