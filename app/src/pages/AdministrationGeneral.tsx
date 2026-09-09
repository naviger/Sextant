import React, { useEffect, useState } from 'react'
import { MainMenu } from '../components/MainMenu'
import { LoginButton } from '../components/LoginButton'
import { getGovernanceConfig, saveGovernanceConfig } from '../services/api'
import { GovernanceConfig } from '../types'
import { DEFAULT_GOVERNANCE_CONFIG, fromTextareaValue, toTextareaValue } from './admin/governance'

export const AdministrationGeneral: React.FC = () => {
  const [config, setConfig] = useState<GovernanceConfig>(DEFAULT_GOVERNANCE_CONFIG)
  const [statusMessage, setStatusMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const governanceConfig = await getGovernanceConfig()
        setConfig({ ...DEFAULT_GOVERNANCE_CONFIG, ...governanceConfig })
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load governance configuration')
      }
    }

    void load()
  }, [])

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setStatusMessage('')

    try {
      const saved = await saveGovernanceConfig(config)
      setConfig({ ...DEFAULT_GOVERNANCE_CONFIG, ...saved })
      setStatusMessage('General governance configuration saved.')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to save general governance configuration')
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(0,166,166,0.08),transparent_28%),linear-gradient(180deg,#eef3f7_0%,#e7edf2_100%)] text-slate-800">
      <header className="relative z-[200] border-b border-white/70 bg-white/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <img src="/sextant-logo-horiz.svg" alt="Sextant" className="h-8 w-auto" />
          <LoginButton />
        </div>
      </header>

      <MainMenu breadcrumb="Administration / General" />

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        {(statusMessage || error) && (
          <section className="surface-panel rounded-[1.5rem] p-5">
            <p className={`text-sm font-semibold ${error ? 'text-rose-700' : 'text-emerald-700'}`}>
              {error || statusMessage}
            </p>
          </section>
        )}

        <section className="surface-panel rounded-[2rem] p-7">
          <p className="section-kicker mb-2">General</p>
          <h1 className="text-3xl font-semibold text-slate-900">Enterprise identity and cadence</h1>

          <form className="mt-6 space-y-4" onSubmit={handleSave}>
            <div>
              <label className="section-kicker mb-2 block" htmlFor="enterprise-name">Enterprise Name</label>
              <input
                id="enterprise-name"
                className="input-field"
                value={config.enterprise_name}
                onChange={(event) => setConfig({ ...config, enterprise_name: event.target.value })}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="section-kicker mb-2 block" htmlFor="enterprise-code">Enterprise Code</label>
                <input
                  id="enterprise-code"
                  className="input-field"
                  value={config.enterprise_code ?? ''}
                  onChange={(event) => setConfig({ ...config, enterprise_code: event.target.value || null })}
                />
              </div>

              <div>
                <label className="section-kicker mb-2 block" htmlFor="strategy-review-cadence">Strategy Review Cadence</label>
                <input
                  id="strategy-review-cadence"
                  className="input-field"
                  value={config.strategy_review_cadence}
                  onChange={(event) => setConfig({ ...config, strategy_review_cadence: event.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="section-kicker mb-2 block" htmlFor="enterprise-description">Enterprise Description</label>
              <textarea
                id="enterprise-description"
                className="input-field min-h-[120px]"
                value={config.enterprise_description ?? ''}
                onChange={(event) => setConfig({ ...config, enterprise_description: event.target.value || null })}
              />
            </div>

            <div>
              <label className="section-kicker mb-2 block" htmlFor="planning-cycles">Planning Cycles</label>
              <textarea
                id="planning-cycles"
                className="input-field min-h-[120px]"
                value={toTextareaValue(config.planning_cycles)}
                onChange={(event) => setConfig({ ...config, planning_cycles: fromTextareaValue(event.target.value) })}
              />
            </div>

            <div className="pt-2">
              <button className="button-primary" type="submit">Save general settings</button>
            </div>
          </form>
        </section>
      </main>
    </div>
  )
}
