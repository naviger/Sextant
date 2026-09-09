import React, { useEffect, useState } from 'react'
import { MainMenu } from '../components/MainMenu'
import { LoginButton } from '../components/LoginButton'
import { getGovernanceConfig, saveGovernanceConfig } from '../services/api'
import { GovernanceConfig } from '../types'
import { DEFAULT_GOVERNANCE_CONFIG, fromTextareaValue, toTextareaValue } from './admin/governance'

export const AdministrationContentControl: React.FC = () => {
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
      setStatusMessage('Content control configuration saved.')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to save content controls')
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

      <MainMenu breadcrumb="Administration / Content Control" />

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        {(statusMessage || error) && (
          <section className="surface-panel rounded-[1.5rem] p-5">
            <p className={`text-sm font-semibold ${error ? 'text-rose-700' : 'text-emerald-700'}`}>
              {error || statusMessage}
            </p>
          </section>
        )}

        <section className="surface-panel rounded-[2rem] p-7">
          <p className="section-kicker mb-2">Content Control</p>
          <h1 className="text-3xl font-semibold text-slate-900">Artifacts and templates</h1>

          <form className="mt-6 space-y-4" onSubmit={handleSave}>
            <div>
              <label className="section-kicker mb-2 block" htmlFor="required-artifacts">Required Strategy Artifacts</label>
              <textarea
                id="required-artifacts"
                className="input-field min-h-[120px]"
                value={toTextareaValue(config.required_strategy_artifacts)}
                onChange={(event) => setConfig({ ...config, required_strategy_artifacts: fromTextareaValue(event.target.value) })}
              />
            </div>

            <div>
              <label className="section-kicker mb-2 block" htmlFor="contract-templates">Contract Templates</label>
              <textarea
                id="contract-templates"
                className="input-field min-h-[120px]"
                value={toTextareaValue(config.contract_templates)}
                onChange={(event) => setConfig({ ...config, contract_templates: fromTextareaValue(event.target.value) })}
              />
            </div>

            <div className="pt-2">
              <button className="button-primary" type="submit">Save content controls</button>
            </div>
          </form>
        </section>
      </main>
    </div>
  )
}
