import React, { useEffect, useState } from 'react'
import { MainMenu } from '../components/MainMenu'
import { LoginButton } from '../components/LoginButton'
import { getGovernanceConfig, saveGovernanceConfig } from '../services/api'
import { GovernanceConfig } from '../types'
import { DEFAULT_GOVERNANCE_CONFIG, fromTextareaValue, toTextareaValue } from './admin/governance'

export const AdministrationRules: React.FC = () => {
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
      setStatusMessage('Rules configuration saved.')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to save rules configuration')
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

      <MainMenu breadcrumb="Administration / Rules" />

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        {(statusMessage || error) && (
          <section className="surface-panel rounded-[1.5rem] p-5">
            <p className={`text-sm font-semibold ${error ? 'text-rose-700' : 'text-emerald-700'}`}>
              {error || statusMessage}
            </p>
          </section>
        )}

        <section className="surface-panel rounded-[2rem] p-7">
          <p className="section-kicker mb-2">Rules</p>
          <h1 className="text-3xl font-semibold text-slate-900">Authority and alignment rules</h1>

          <form className="mt-6 space-y-4" onSubmit={handleSave}>
            <div>
              <label className="section-kicker mb-2 block" htmlFor="strategy-authority-rules">Strategy Authority Rules</label>
              <textarea
                id="strategy-authority-rules"
                className="input-field min-h-[120px]"
                value={toTextareaValue(config.strategy_authority_rules)}
                onChange={(event) => setConfig({ ...config, strategy_authority_rules: fromTextareaValue(event.target.value) })}
              />
            </div>

            <div>
              <label className="section-kicker mb-2 block" htmlFor="alignment-scoring-rules">Alignment Scoring Rules</label>
              <textarea
                id="alignment-scoring-rules"
                className="input-field min-h-[120px]"
                value={toTextareaValue(config.alignment_scoring_rules)}
                onChange={(event) => setConfig({ ...config, alignment_scoring_rules: fromTextareaValue(event.target.value) })}
              />
            </div>

            <div>
              <label className="section-kicker mb-2 block" htmlFor="governance-policies">Governance Policies</label>
              <textarea
                id="governance-policies"
                className="input-field min-h-[120px]"
                value={toTextareaValue(config.governance_policies)}
                onChange={(event) => setConfig({ ...config, governance_policies: fromTextareaValue(event.target.value) })}
              />
            </div>

            <div className="pt-2">
              <button className="button-primary" type="submit">Save rules</button>
            </div>
          </form>
        </section>
      </main>
    </div>
  )
}
