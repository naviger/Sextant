import React, { useEffect, useState } from 'react'
import { MainMenu } from '../components/MainMenu'
import { LoginButton } from '../components/LoginButton'
import {
  createOrganization,
  deleteOrganization,
  getGovernanceConfig,
  getOrganizations,
  importOrganizations,
  saveGovernanceConfig,
  updateOrganization,
} from '../services/api'
import { GovernanceConfig, OrganizationImportResult, OrganizationResponse } from '../types'

const DEFAULT_CONFIG: GovernanceConfig = {
  enterprise_name: 'Enterprise',
  enterprise_code: null,
  enterprise_description: null,
  planning_cycles: ['Annual Planning', 'Strategic Review', 'Quarterly Business Review', 'Monthly Operations Review'],
  strategy_authority_rules: [
    'None = strategy created centrally only',
    'Constrained = strategy must stay within defined guardrails',
    'Shared = strategy requires joint approval',
    'Autonomous = strategy may be created locally',
  ],
  alignment_scoring_rules: [
    'Score contract coverage against strategic objectives',
    'Highlight missing reporting obligations',
    'Detect conflicting contracts and authorities',
  ],
  required_strategy_artifacts: ['North Star', 'Objectives', 'Initiatives', 'Outcomes'],
  strategy_review_cadence: 'Quarterly Business Review',
  contract_templates: ['Directive', 'Alignment', 'Collaborative', 'Observational'],
  planning_windows: ['Annual Planning', 'Quarterly Review'],
  governance_policies: [
    'Approval required for strategic contract activation',
    'Archived organizations remain queryable for history',
  ],
  escalation_workflows: ['Business Unit Leader -> Strategy Administrator -> Global Administrator'],
}

const EMPTY_ORGANIZATION_FORM = {
  name: '',
  code: '',
  description: '',
  parent_organization_id: '',
  organization_type: 'Business Unit',
  region: '',
  leader: '',
  status: 'active',
  strategic_classification: 'Operational',
  fiscal_responsibility: 'Profit Center',
  investment_authority: 'None',
}

const CSV_TEMPLATE = `name,code,description,organization_type,status,strategic_classification,fiscal_responsibility,investment_authority
Corporate,CORP,Head office,Corporate,active,Strategic,Enterprise Funded,Own
India BU,INDIA,India business unit,Business Unit,active,Hybrid,Profit Center,Approve`

const toTextareaValue = (items: string[]) => items.join('\n')
const fromTextareaValue = (value: string) =>
  value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)

export const Administration: React.FC = () => {
  const [organizations, setOrganizations] = useState<OrganizationResponse[]>([])
  const [csvContent, setCsvContent] = useState(CSV_TEMPLATE)
  const [fullReload, setFullReload] = useState(false)
  const [importResult, setImportResult] = useState<OrganizationImportResult | null>(null)
  const [config, setConfig] = useState<GovernanceConfig>(DEFAULT_CONFIG)
  const [statusMessage, setStatusMessage] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [organizationForm, setOrganizationForm] = useState(EMPTY_ORGANIZATION_FORM)
  const [editingOrganizationId, setEditingOrganizationId] = useState<string | null>(null)

  const refreshOrganizations = async () => {
    const refreshed = await getOrganizations()
    setOrganizations(refreshed)
  }

  useEffect(() => {
    const load = async () => {
      try {
        const [organizationData, governanceConfig] = await Promise.all([
          getOrganizations(),
          getGovernanceConfig(),
        ])
        setOrganizations(organizationData)
        setConfig({ ...DEFAULT_CONFIG, ...governanceConfig })
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load administration data')
      }
    }

    void load()
  }, [])

  const handleImport = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setStatusMessage('')

    try {
      const result = await importOrganizations(csvContent, fullReload)
      setImportResult(result)
      setStatusMessage(`Imported ${result.imported} organizations and updated ${result.updated}.`)
      await refreshOrganizations()
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : 'Organization import failed')
    }
  }

  const handleSaveConfig = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setStatusMessage('')

    try {
      const saved = await saveGovernanceConfig(config)
      setConfig({ ...DEFAULT_CONFIG, ...saved })
      setStatusMessage('Governance configuration saved.')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to save governance configuration')
    }
  }

  const handleOrganizationSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setStatusMessage('')

    const payload = {
      name: organizationForm.name.trim(),
      code: organizationForm.code.trim() || undefined,
      description: organizationForm.description.trim() || undefined,
      parent_organization_id: organizationForm.parent_organization_id || undefined,
      organization_type: organizationForm.organization_type,
      region: organizationForm.region.trim() || undefined,
      leader: organizationForm.leader.trim() || undefined,
      status: organizationForm.status,
      strategic_classification: organizationForm.strategic_classification,
      fiscal_responsibility: organizationForm.fiscal_responsibility,
      investment_authority: organizationForm.investment_authority,
    }

    if (!payload.name) {
      setError('Organization name is required.')
      return
    }

    try {
      if (editingOrganizationId) {
        await updateOrganization(editingOrganizationId, payload)
        setStatusMessage('Organization updated.')
      } else {
        await createOrganization(payload)
        setStatusMessage('Organization added.')
      }

      await refreshOrganizations()
      setOrganizationForm(EMPTY_ORGANIZATION_FORM)
      setEditingOrganizationId(null)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save organization')
    }
  }

  const handleRemoveOrganization = async (organization: OrganizationResponse) => {
    const confirmed = window.confirm(`Delete ${organization.name}?`)
    if (!confirmed) {
      return
    }

    try {
      await deleteOrganization(organization.id)
      if (editingOrganizationId === organization.id) {
        setEditingOrganizationId(null)
        setOrganizationForm(EMPTY_ORGANIZATION_FORM)
      }
      await refreshOrganizations()
      setStatusMessage(`Deleted ${organization.name}.`)
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete organization')
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

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <section className="surface-panel chart-grid rounded-[2rem] p-8 lg:p-10">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div>
              <p className="section-kicker mb-3">Administration Bridge</p>
              <h1 className="text-4xl font-semibold text-slate-900 sm:text-5xl">Define your enterprise and manage the operating model.</h1>
              <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">
                Set the enterprise identity, manage the org hierarchy directly, and import bulk structure when needed.
              </p>
            </div>

            <div className="surface-panel-dark rounded-[1.75rem] p-6 text-white">
              <p className="text-xs uppercase tracking-[0.2em] text-white/55">Current Org Fix</p>
              <p className="metric-number mt-4 text-4xl text-white">{organizations.length}</p>
              <p className="mt-2 text-sm text-white/65">Organizations currently loaded in the reference hierarchy.</p>
            </div>
          </div>
        </section>

        {(statusMessage || error) && (
          <section className="surface-panel rounded-[1.5rem] p-5">
            <p className={`text-sm font-semibold ${error ? 'text-rose-700' : 'text-emerald-700'}`}>
              {error || statusMessage}
            </p>
          </section>
        )}

        <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <article className="surface-panel rounded-[2rem] p-7">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="section-kicker mb-2">Organization Import</p>
                <h2 className="text-2xl font-semibold text-slate-900">CSV import wizard</h2>
              </div>
            </div>

            <form className="mt-6 space-y-4" onSubmit={handleImport}>
              <div>
                <label className="section-kicker mb-2 block" htmlFor="csv-content">CSV Content</label>
                <textarea
                  id="csv-content"
                  className="input-field min-h-[180px]"
                  value={csvContent}
                  onChange={(event) => setCsvContent(event.target.value)}
                />
              </div>

              <label className="flex items-center gap-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={fullReload}
                  onChange={(event) => setFullReload(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-[var(--north-atlantic-blue)] focus:ring-[var(--north-atlantic-blue)]"
                />
                Full reload mode archives organizations not present in the import.
              </label>

              <div className="flex flex-wrap gap-3">
                <button className="button-primary" type="submit">Import organizations</button>
                <button className="button-secondary" type="button" onClick={() => setCsvContent(CSV_TEMPLATE)}>
                  Reset template
                </button>
              </div>
            </form>

            {importResult && (
              <div className="mt-6 rounded-3xl border border-slate-200 bg-white/80 p-4">
                <p className="section-kicker mb-2">Import Result</p>
                <div className="grid gap-3 sm:grid-cols-4">
                  <div><p className="text-xs text-slate-500">Total Rows</p><p className="metric-number text-xl text-slate-900">{importResult.total_rows}</p></div>
                  <div><p className="text-xs text-slate-500">Imported</p><p className="metric-number text-xl text-emerald-700">{importResult.imported}</p></div>
                  <div><p className="text-xs text-slate-500">Updated</p><p className="metric-number text-xl text-[var(--north-atlantic-blue)]">{importResult.updated}</p></div>
                  <div><p className="text-xs text-slate-500">Skipped</p><p className="metric-number text-xl text-amber-700">{importResult.skipped}</p></div>
                </div>
                {importResult.errors.length > 0 && (
                  <ul className="mt-4 space-y-2 text-sm text-rose-700">
                    {importResult.errors.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                )}
              </div>
            )}

            <div className="mt-6 rounded-3xl border border-slate-200 bg-white/80 p-4">
              <p className="section-kicker mb-2">Organization Snapshot</p>
              <div className="space-y-2 text-sm text-slate-600">
                {organizations.slice(0, 5).map((organization) => (
                  <div key={organization.id} className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3">
                    <span className="font-semibold text-slate-900">{organization.name}</span>
                    <span>{organization.code || organization.id}</span>
                  </div>
                ))}
                {organizations.length === 0 && <p>No organizations loaded yet.</p>}
              </div>
            </div>
          </article>

          <article className="surface-panel rounded-[2rem] p-7">
            <p className="section-kicker mb-2">Governance Administration</p>
            <h2 className="text-2xl font-semibold text-slate-900">Operating model controls</h2>

            <form id="general" className="mt-6 space-y-4" onSubmit={handleSaveConfig}>
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
                  className="input-field min-h-[100px]"
                  value={config.enterprise_description ?? ''}
                  onChange={(event) => setConfig({ ...config, enterprise_description: event.target.value || null })}
                />
              </div>

              <div id="content-control">
                <label className="section-kicker mb-2 block" htmlFor="planning-cycles">Planning Cycles</label>
                <textarea
                  id="planning-cycles"
                  className="input-field min-h-[100px]"
                  value={toTextareaValue(config.planning_cycles)}
                  onChange={(event) => setConfig({ ...config, planning_cycles: fromTextareaValue(event.target.value) })}
                />
              </div>

              <div id="rules">
                <label className="section-kicker mb-2 block" htmlFor="strategy-authority-rules">Strategy Authority Rules</label>
                <textarea
                  id="strategy-authority-rules"
                  className="input-field min-h-[100px]"
                  value={toTextareaValue(config.strategy_authority_rules)}
                  onChange={(event) => setConfig({ ...config, strategy_authority_rules: fromTextareaValue(event.target.value) })}
                />
              </div>

              <div>
                <label className="section-kicker mb-2 block" htmlFor="alignment-scoring-rules">Alignment Scoring Rules</label>
                <textarea
                  id="alignment-scoring-rules"
                  className="input-field min-h-[100px]"
                  value={toTextareaValue(config.alignment_scoring_rules)}
                  onChange={(event) => setConfig({ ...config, alignment_scoring_rules: fromTextareaValue(event.target.value) })}
                />
              </div>

              <div>
                <label className="section-kicker mb-2 block" htmlFor="required-artifacts">Required Strategy Artifacts</label>
                <textarea
                  id="required-artifacts"
                  className="input-field min-h-[100px]"
                  value={toTextareaValue(config.required_strategy_artifacts)}
                  onChange={(event) => setConfig({ ...config, required_strategy_artifacts: fromTextareaValue(event.target.value) })}
                />
              </div>

              <div>
                <label className="section-kicker mb-2 block" htmlFor="contract-templates">Contract Templates</label>
                <textarea
                  id="contract-templates"
                  className="input-field min-h-[100px]"
                  value={toTextareaValue(config.contract_templates)}
                  onChange={(event) => setConfig({ ...config, contract_templates: fromTextareaValue(event.target.value) })}
                />
              </div>

              <div>
                <label className="section-kicker mb-2 block" htmlFor="governance-policies">Governance Policies</label>
                <textarea
                  id="governance-policies"
                  className="input-field min-h-[100px]"
                  value={toTextareaValue(config.governance_policies)}
                  onChange={(event) => setConfig({ ...config, governance_policies: fromTextareaValue(event.target.value) })}
                />
              </div>

              <div id="workflows">
                <label className="section-kicker mb-2 block" htmlFor="escalation-workflows">Escalation Workflows</label>
                <textarea
                  id="escalation-workflows"
                  className="input-field min-h-[80px]"
                  value={toTextareaValue(config.escalation_workflows)}
                  onChange={(event) => setConfig({ ...config, escalation_workflows: fromTextareaValue(event.target.value) })}
                />
              </div>

              <div id="users" className="flex flex-wrap gap-3 pt-2">
                <button className="button-primary" type="submit">Save governance config</button>
                <button className="button-secondary" type="button" onClick={() => setConfig(DEFAULT_CONFIG)}>
                  Reset defaults
                </button>
              </div>
            </form>
          </article>
        </section>

        <section id="hierarchies" className="surface-panel rounded-[2rem] p-7">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="section-kicker mb-2">Organization Structure</p>
              <h2 className="text-2xl font-semibold text-slate-900">Manual hierarchy management</h2>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
              {organizations.length} items
            </span>
          </div>

          <form className="mt-6 grid gap-4 lg:grid-cols-2" onSubmit={handleOrganizationSubmit}>
            <div>
              <label className="section-kicker mb-2 block" htmlFor="organization-name">Name</label>
              <input
                id="organization-name"
                className="input-field"
                value={organizationForm.name}
                onChange={(event) => setOrganizationForm({ ...organizationForm, name: event.target.value })}
              />
            </div>

            <div>
              <label className="section-kicker mb-2 block" htmlFor="organization-code">Code</label>
              <input
                id="organization-code"
                className="input-field"
                value={organizationForm.code}
                onChange={(event) => setOrganizationForm({ ...organizationForm, code: event.target.value })}
              />
            </div>

            <div className="lg:col-span-2">
              <label className="section-kicker mb-2 block" htmlFor="organization-description">Description</label>
              <textarea
                id="organization-description"
                className="input-field min-h-[90px]"
                value={organizationForm.description}
                onChange={(event) => setOrganizationForm({ ...organizationForm, description: event.target.value })}
              />
            </div>

            <div>
              <label className="section-kicker mb-2 block" htmlFor="organization-parent">Parent Organization</label>
              <select
                id="organization-parent"
                className="input-field"
                value={organizationForm.parent_organization_id}
                onChange={(event) => setOrganizationForm({ ...organizationForm, parent_organization_id: event.target.value })}
              >
                <option value="">No parent</option>
                {organizations
                  .filter((organization) => organization.id !== editingOrganizationId)
                  .map((organization) => (
                    <option key={organization.id} value={organization.id}>
                      {organization.name}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="section-kicker mb-2 block" htmlFor="organization-type">Organization Type</label>
              <select
                id="organization-type"
                className="input-field"
                value={organizationForm.organization_type}
                onChange={(event) => setOrganizationForm({ ...organizationForm, organization_type: event.target.value })}
              >
                <option value="Corporate">Corporate</option>
                <option value="Site">Site</option>
                <option value="Holding Company">Holding Company</option>
                <option value="Portfolio Company">Portfolio Company</option>
                <option value="Division">Division</option>
                <option value="Business Unit">Business Unit</option>
                <option value="Region">Region</option>
                <option value="Country">Country</option>
                <option value="Facility">Facility</option>
                <option value="Product Group">Product Group</option>
                <option value="Function">Function</option>
                <option value="Department">Department</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="section-kicker mb-2 block" htmlFor="organization-region">Region</label>
              <input
                id="organization-region"
                className="input-field"
                value={organizationForm.region}
                onChange={(event) => setOrganizationForm({ ...organizationForm, region: event.target.value })}
              />
            </div>

            <div>
              <label className="section-kicker mb-2 block" htmlFor="organization-leader">Leader</label>
              <input
                id="organization-leader"
                className="input-field"
                value={organizationForm.leader}
                onChange={(event) => setOrganizationForm({ ...organizationForm, leader: event.target.value })}
              />
            </div>

            <div>
              <label className="section-kicker mb-2 block" htmlFor="organization-status">Status</label>
              <select
                id="organization-status"
                className="input-field"
                value={organizationForm.status}
                onChange={(event) => setOrganizationForm({ ...organizationForm, status: event.target.value })}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div>
              <label className="section-kicker mb-2 block" htmlFor="organization-strategic-classification">Strategic Classification</label>
              <select
                id="organization-strategic-classification"
                className="input-field"
                value={organizationForm.strategic_classification}
                onChange={(event) => setOrganizationForm({ ...organizationForm, strategic_classification: event.target.value })}
              >
                <option value="Strategic">Strategic</option>
                <option value="Operational">Operational</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </div>

            <div>
              <label className="section-kicker mb-2 block" htmlFor="organization-fiscal-responsibility">Fiscal Responsibility</label>
              <select
                id="organization-fiscal-responsibility"
                className="input-field"
                value={organizationForm.fiscal_responsibility}
                onChange={(event) => setOrganizationForm({ ...organizationForm, fiscal_responsibility: event.target.value })}
              >
                <option value="Enterprise Funded">Enterprise Funded</option>
                <option value="Cost Center">Cost Center</option>
                <option value="Profit Center">Profit Center</option>
                <option value="Investment Center">Investment Center</option>
                <option value="Autonomous Business Unit">Autonomous Business Unit</option>
              </select>
            </div>

            <div>
              <label className="section-kicker mb-2 block" htmlFor="organization-investment-authority">Investment Authority</label>
              <select
                id="organization-investment-authority"
                className="input-field"
                value={organizationForm.investment_authority}
                onChange={(event) => setOrganizationForm({ ...organizationForm, investment_authority: event.target.value })}
              >
                <option value="None">None</option>
                <option value="Recommend">Recommend</option>
                <option value="Approve">Approve</option>
                <option value="Own">Own</option>
              </select>
            </div>

            <div className="lg:col-span-2 flex flex-wrap gap-3 pt-2">
              <button className="button-primary" type="submit">
                {editingOrganizationId ? 'Update organization' : 'Add organization'}
              </button>
              {editingOrganizationId && (
                <button
                  type="button"
                  className="button-secondary"
                  onClick={() => {
                    setEditingOrganizationId(null)
                    setOrganizationForm(EMPTY_ORGANIZATION_FORM)
                  }}
                >
                  Cancel edit
                </button>
              )}
            </div>
          </form>

          <div className="mt-8 space-y-3">
            {organizations.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600">
                No organization items exist yet. You can add the enterprise root and downstream units manually from this form.
              </p>
            ) : (
              organizations.map((organization) => (
                <div key={organization.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/80 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">{organization.name}</p>
                    <p className="text-sm text-slate-600">
                      {organization.code || organization.id} • {organization.organization_type || 'Organization'} • {organization.status}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="button-secondary"
                      onClick={() => {
                        setEditingOrganizationId(organization.id)
                        setOrganizationForm({
                          name: organization.name,
                          code: organization.code ?? '',
                          description: organization.description ?? '',
                          parent_organization_id: organization.parent_organization_id ?? '',
                          organization_type: organization.organization_type ?? 'Business Unit',
                          region: organization.region ?? '',
                          leader: organization.leader ?? '',
                          status: organization.status ?? 'active',
                          strategic_classification: organization.strategic_classification ?? 'Operational',
                          fiscal_responsibility: organization.fiscal_responsibility ?? 'Profit Center',
                          investment_authority: organization.investment_authority ?? 'None',
                        })
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="button-secondary text-rose-700 hover:border-rose-200 hover:bg-rose-50"
                      onClick={() => void handleRemoveOrganization(organization)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  )
}
