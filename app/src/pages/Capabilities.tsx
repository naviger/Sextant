import React, { useEffect, useMemo, useState } from 'react'
import { LoginButton } from '../components/LoginButton'
import { MainMenu } from '../components/MainMenu'
import {
  createCapabilityAssessment,
  createCapability,
  getCapabilityAssessments,
  getCapabilities,
  getCapabilityDetail,
  getOrganizations,
  getPlanningCycles,
  retireCapability,
  updateCapabilityAssessment,
  updateCapability,
} from '../services/api'
import {
  Capability,
  CapabilityAssessment,
  CapabilityAssessmentCreate,
  CapabilityCreate,
  CapabilityDetail,
  OrganizationResponse,
  PlanningCycle,
} from '../types'

type CapabilityView = 'catalog' | 'map' | 'detail'
type CapabilityDetailTab = 'overview' | 'assessments'

const CAPABILITY_CATEGORY_OPTIONS = [
  'Commercial',
  'Operations',
  'Supply Chain',
  'Technology',
  'People',
  'Finance',
  'Innovation',
  'Risk',
  'Sustainability',
  'Other',
]

const CAPABILITY_STATUS_OPTIONS = ['Draft', 'Active', 'Retired']
const MATURITY_OPTIONS = [1, 2, 3, 4, 5]

const MATURITY_LABELS: Record<number, string> = {
  1: 'Initial',
  2: 'Developing',
  3: 'Established',
  4: 'Managed',
  5: 'Optimized',
}

const EMPTY_CAPABILITY_FORM: CapabilityCreate = {
  name: '',
  description: '',
  category: 'Other',
  status: 'Draft',
  owner_organization_id: '',
}

const EMPTY_ASSESSMENT_FORM: CapabilityAssessmentCreate = {
  capability_id: '',
  planning_cycle_id: '',
  current_maturity: 1,
  target_maturity: 3,
  assessment_notes: '',
  assessment_date: '',
  owner_organization_id: '',
}

export const Capabilities: React.FC = () => {
  const [capabilities, setCapabilities] = useState<Capability[]>([])
  const [organizations, setOrganizations] = useState<OrganizationResponse[]>([])
  const [selectedCapabilityId, setSelectedCapabilityId] = useState('')
  const [selectedCapabilityDetail, setSelectedCapabilityDetail] = useState<CapabilityDetail | null>(null)
  const [planningCycles, setPlanningCycles] = useState<PlanningCycle[]>([])
  const [assessmentsByCapability, setAssessmentsByCapability] = useState<Record<string, CapabilityAssessment[]>>({})
  const [selectedAssessmentId, setSelectedAssessmentId] = useState('')
  const [assessmentForm, setAssessmentForm] = useState<CapabilityAssessmentCreate>(EMPTY_ASSESSMENT_FORM)
  const [detailTab, setDetailTab] = useState<CapabilityDetailTab>('overview')
  const [capabilityForm, setCapabilityForm] = useState<CapabilityCreate>(EMPTY_CAPABILITY_FORM)
  const [activeView, setActiveView] = useState<CapabilityView>('catalog')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [error, setError] = useState('')

  const refreshCapabilities = async () => {
    const data = await getCapabilities(search || undefined, categoryFilter || undefined, statusFilter || undefined)
    setCapabilities(data)
  }

  const loadCapabilityDetail = async (capabilityId: string) => {
    const detail = await getCapabilityDetail(capabilityId)
    setSelectedCapabilityDetail(detail)
    setAssessmentsByCapability((current) => ({
      ...current,
      [capabilityId]: detail.assessments || [],
    }))
  }

  const loadAssessmentsForCapability = async (capabilityId: string) => {
    const assessments = await getCapabilityAssessments(capabilityId)
    setAssessmentsByCapability((current) => ({
      ...current,
      [capabilityId]: assessments,
    }))
  }

  useEffect(() => {
    const load = async () => {
      try {
        const [capabilityData, orgs, cycles] = await Promise.all([
          getCapabilities(),
          getOrganizations(),
          getPlanningCycles(),
        ])
        setCapabilities(capabilityData)
        setOrganizations(orgs)
        setPlanningCycles(cycles)

        if (capabilityData.length > 0) {
          const detailRows = await Promise.all(
            capabilityData.map(async (capability) => {
              try {
                const detail = await getCapabilityDetail(capability.id)
                return { capabilityId: capability.id, assessments: detail.assessments || [] }
              } catch {
                return { capabilityId: capability.id, assessments: [] }
              }
            }),
          )
          const byCapability: Record<string, CapabilityAssessment[]> = {}
          for (const row of detailRows) {
            byCapability[row.capabilityId] = row.assessments
          }
          setAssessmentsByCapability(byCapability)
        }
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load capabilities')
      }
    }

    void load()
  }, [])

  const capabilitiesByCategory = useMemo(() => {
    const grouped: Record<string, Capability[]> = {}
    for (const capability of capabilities) {
      if (!grouped[capability.category]) {
        grouped[capability.category] = []
      }
      grouped[capability.category].push(capability)
    }
    return grouped
  }, [capabilities])

  const resetCapabilityForm = () => {
    setSelectedCapabilityId('')
    setSelectedAssessmentId('')
    setDetailTab('overview')
    setCapabilityForm(EMPTY_CAPABILITY_FORM)
    setAssessmentForm(EMPTY_ASSESSMENT_FORM)
    setSelectedCapabilityDetail(null)
  }

  const handleSelectCapability = async (capability: Capability) => {
    setSelectedCapabilityId(capability.id)
    setSelectedAssessmentId('')
    setDetailTab('overview')
    setCapabilityForm({
      name: capability.name,
      description: capability.description || '',
      category: capability.category,
      status: capability.status,
      owner_organization_id: capability.owner_organization_id,
    })
    setAssessmentForm({
      ...EMPTY_ASSESSMENT_FORM,
      capability_id: capability.id,
      owner_organization_id: capability.owner_organization_id,
    })
    setActiveView('detail')
    try {
      await loadCapabilityDetail(capability.id)
    } catch (detailError) {
      setError(detailError instanceof Error ? detailError.message : 'Unable to load capability detail')
    }
  }

  const handleSaveCapability = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setStatusMessage('')

    if (!capabilityForm.name.trim()) {
      setError('Capability name is required.')
      return
    }

    if (!capabilityForm.owner_organization_id) {
      setError('Owner organization is required.')
      return
    }

    try {
      if (selectedCapabilityId) {
        await updateCapability(selectedCapabilityId, {
          ...capabilityForm,
          name: capabilityForm.name.trim(),
          description: capabilityForm.description?.trim() || undefined,
        })
        setStatusMessage('Capability updated.')
      } else {
        const created = await createCapability({
          ...capabilityForm,
          name: capabilityForm.name.trim(),
          description: capabilityForm.description?.trim() || undefined,
        })
        setSelectedCapabilityId(created.id)
        setStatusMessage('Capability created.')
      }
      await refreshCapabilities()
      if (selectedCapabilityId) {
        await loadCapabilityDetail(selectedCapabilityId)
      }
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save capability')
    }
  }

  const handleRetireCapability = async (capability: Capability) => {
    setError('')
    setStatusMessage('')
    try {
      await retireCapability(capability.id)
      setStatusMessage(`${capability.name} retired.`)
      await refreshCapabilities()
      if (selectedCapabilityId === capability.id) {
        await loadCapabilityDetail(capability.id)
      }
    } catch (retireError) {
      setError(retireError instanceof Error ? retireError.message : 'Unable to retire capability')
    }
  }

  const handleSaveAssessment = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!selectedCapabilityId) {
      return
    }
    setError('')
    setStatusMessage('')

    if (!assessmentForm.planning_cycle_id) {
      setError('Planning cycle is required for assessment.')
      return
    }
    if (!assessmentForm.owner_organization_id) {
      setError('Owner organization is required for assessment.')
      return
    }

    const assessmentPayload: CapabilityAssessmentCreate = {
      ...assessmentForm,
      capability_id: selectedCapabilityId,
      assessment_date: assessmentForm.assessment_date || undefined,
    }

    try {
      if (selectedAssessmentId) {
        await updateCapabilityAssessment(selectedCapabilityId, selectedAssessmentId, assessmentPayload)
        setStatusMessage('Capability assessment updated.')
      } else {
        await createCapabilityAssessment(selectedCapabilityId, assessmentPayload)
        setStatusMessage('Capability assessment created.')
      }
      await Promise.all([
        loadCapabilityDetail(selectedCapabilityId),
        loadAssessmentsForCapability(selectedCapabilityId),
      ])
      setSelectedAssessmentId('')
      setAssessmentForm((current) => ({
        ...EMPTY_ASSESSMENT_FORM,
        capability_id: selectedCapabilityId,
        owner_organization_id: current.owner_organization_id || capabilityForm.owner_organization_id,
      }))
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save capability assessment')
    }
  }

  const handleEditAssessment = (assessment: CapabilityAssessment) => {
    setSelectedAssessmentId(assessment.id)
    setAssessmentForm({
      capability_id: assessment.capability_id,
      planning_cycle_id: assessment.planning_cycle_id,
      current_maturity: assessment.current_maturity,
      target_maturity: assessment.target_maturity,
      assessment_notes: assessment.assessment_notes || '',
      assessment_date: assessment.assessment_date ? new Date(assessment.assessment_date).toISOString().slice(0, 10) : '',
      owner_organization_id: assessment.owner_organization_id,
    })
    setDetailTab('assessments')
  }

  const choiceCount = selectedCapabilityDetail?.linked_choices.length || 0
  const agreementCount = selectedCapabilityDetail?.linked_agreements.length || 0
  const selectedAssessments = selectedCapabilityId ? (assessmentsByCapability[selectedCapabilityId] || []) : []

  const latestAssessmentByCapability = useMemo(() => {
    const latest = new Map<string, CapabilityAssessment>()
    for (const capability of capabilities) {
      const assessments = assessmentsByCapability[capability.id] || []
      if (assessments.length > 0) {
        latest.set(capability.id, assessments[0])
      }
    }
    return latest
  }, [capabilities, assessmentsByCapability])

  const capabilityGaps = useMemo(() => {
    const rows = capabilities.map((capability) => {
      const assessment = latestAssessmentByCapability.get(capability.id)
      const current = assessment?.current_maturity ?? 0
      const target = assessment?.target_maturity ?? 0
      const gap = assessment?.assessment_gap ?? 0
      return {
        capability,
        assessment,
        current,
        target,
        gap,
      }
    })
    return rows.sort((a, b) => b.gap - a.gap)
  }, [capabilities, latestAssessmentByCapability])

  const maturityLabel = (value: number): string => {
    return MATURITY_LABELS[value] ? `${value} ${MATURITY_LABELS[value]}` : 'Not Assessed'
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(0,166,166,0.08),transparent_28%),linear-gradient(180deg,#eef3f7_0%,#e7edf2_100%)] text-slate-800">
      <header className="relative z-[200] border-b border-white/70 bg-white/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <img src="/sextant-logo-horiz.svg" alt="Sextant" className="h-8 w-auto" />
          <LoginButton />
        </div>
      </header>

      <MainMenu breadcrumb="Strategy / Capabilities" />

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        {(statusMessage || error) && (
          <section className="surface-panel rounded-[1.5rem] p-5">
            <p className={`text-sm font-semibold ${error ? 'text-rose-700' : 'text-emerald-700'}`}>
              {error || statusMessage}
            </p>
          </section>
        )}

        <section className="surface-panel rounded-[2rem] p-7">
          <p className="section-kicker mb-2">Execution Bridge</p>
          <h1 className="text-3xl font-semibold text-slate-900">Capabilities</h1>
          <p className="mt-3 text-slate-600">
            Capabilities are reusable strategic assets that connect Strategic Choices to execution readiness.
          </p>
        </section>

        <section className="surface-panel rounded-[2rem] p-7">
          <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-4">
            <button type="button" className={`button-secondary ${activeView === 'catalog' ? 'bg-cyan-50 border-cyan-300' : ''}`} onClick={() => setActiveView('catalog')}>
              Capability Catalog
            </button>
            <button type="button" className={`button-secondary ${activeView === 'map' ? 'bg-cyan-50 border-cyan-300' : ''}`} onClick={() => setActiveView('map')}>
              Capability Map
            </button>
            <button type="button" className={`button-secondary ${activeView === 'detail' ? 'bg-cyan-50 border-cyan-300' : ''}`} onClick={() => setActiveView('detail')}>
              Capability Detail
            </button>
          </div>

          {activeView === 'catalog' && (
            <div className="mt-6 grid gap-6 lg:grid-cols-5">
              <section className="lg:col-span-3 space-y-4">
                <form
                  className="grid gap-3 rounded-2xl border border-slate-200 bg-white/80 p-4 sm:grid-cols-4"
                  onSubmit={(event) => {
                    event.preventDefault()
                    void refreshCapabilities()
                  }}
                >
                  <input
                    className="input-field sm:col-span-2"
                    placeholder="Search capability name or description"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                  <select className="input-field" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
                    <option value="">All categories</option>
                    {CAPABILITY_CATEGORY_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                  <select className="input-field" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                    <option value="">All status</option>
                    {CAPABILITY_STATUS_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                  <div className="sm:col-span-4 flex gap-2">
                    <button className="button-primary" type="submit">Apply Filters</button>
                    <button
                      type="button"
                      className="button-secondary"
                      onClick={() => {
                        setSearch('')
                        setCategoryFilter('')
                        setStatusFilter('')
                        void getCapabilities().then(setCapabilities)
                      }}
                    >
                      Reset
                    </button>
                  </div>
                </form>

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white/80">
                  <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50 text-left">
                      <tr>
                        <th className="px-4 py-3 font-semibold text-slate-700">Name</th>
                        <th className="px-4 py-3 font-semibold text-slate-700">Category</th>
                        <th className="px-4 py-3 font-semibold text-slate-700">Owner</th>
                        <th className="px-4 py-3 font-semibold text-slate-700">Status</th>
                        <th className="px-4 py-3 font-semibold text-slate-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {capabilities.length === 0 ? (
                        <tr>
                          <td className="px-4 py-6 text-slate-600" colSpan={5}>No capabilities found.</td>
                        </tr>
                      ) : (
                        capabilities.map((capability) => (
                          <tr key={capability.id} className="align-top">
                            <td className="px-4 py-3 font-semibold text-slate-900">{capability.name}</td>
                            <td className="px-4 py-3 text-slate-700">{capability.category}</td>
                            <td className="px-4 py-3 text-slate-700">{capability.owner_organization_name || capability.owner_organization_id}</td>
                            <td className="px-4 py-3 text-slate-700">{capability.status}</td>
                            <td className="px-4 py-3">
                              <div className="flex gap-2">
                                <button type="button" className="button-secondary" onClick={() => void handleSelectCapability(capability)}>
                                  Open
                                </button>
                                <button
                                  type="button"
                                  className="button-secondary text-rose-700 hover:border-rose-200 hover:bg-rose-50"
                                  onClick={() => void handleRetireCapability(capability)}
                                  disabled={capability.status === 'Retired'}
                                >
                                  Retire
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white/80 p-5">
                <p className="section-kicker mb-3">{selectedCapabilityId ? 'Edit Capability' : 'Create Capability'}</p>
                <form className="space-y-3" onSubmit={handleSaveCapability}>
                  <div>
                    <label className="section-kicker mb-2 block" htmlFor="capability-name">Name</label>
                    <input
                      id="capability-name"
                      className="input-field"
                      value={capabilityForm.name}
                      onChange={(event) => setCapabilityForm({ ...capabilityForm, name: event.target.value })}
                    />
                  </div>

                  <div>
                    <label className="section-kicker mb-2 block" htmlFor="capability-description">Description</label>
                    <textarea
                      id="capability-description"
                      className="input-field min-h-[84px]"
                      value={capabilityForm.description || ''}
                      onChange={(event) => setCapabilityForm({ ...capabilityForm, description: event.target.value })}
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="section-kicker mb-2 block" htmlFor="capability-category">Category</label>
                      <select
                        id="capability-category"
                        className="input-field"
                        value={capabilityForm.category}
                        onChange={(event) => setCapabilityForm({ ...capabilityForm, category: event.target.value })}
                      >
                        {CAPABILITY_CATEGORY_OPTIONS.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="section-kicker mb-2 block" htmlFor="capability-status">Status</label>
                      <select
                        id="capability-status"
                        className="input-field"
                        value={capabilityForm.status}
                        onChange={(event) => setCapabilityForm({ ...capabilityForm, status: event.target.value })}
                      >
                        {CAPABILITY_STATUS_OPTIONS.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="section-kicker mb-2 block" htmlFor="capability-owner">Owner Organization</label>
                    <select
                      id="capability-owner"
                      className="input-field"
                      value={capabilityForm.owner_organization_id}
                      onChange={(event) => setCapabilityForm({ ...capabilityForm, owner_organization_id: event.target.value })}
                    >
                      <option value="">Select owner organization</option>
                      {organizations.map((organization) => (
                        <option key={organization.id} value={organization.id}>{organization.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    <button className="button-primary" type="submit">{selectedCapabilityId ? 'Save Capability' : 'Create Capability'}</button>
                    {selectedCapabilityId && (
                      <button type="button" className="button-secondary" onClick={resetCapabilityForm}>Clear Selection</button>
                    )}
                  </div>
                </form>
              </section>
            </div>
          )}

          {activeView === 'map' && (
            <div className="mt-6 space-y-4">
              <div className="rounded-xl border border-cyan-100 bg-cyan-50/60 px-4 py-3 text-sm text-cyan-900">
                {'Capability Heat Map and Capability Gaps are derived from latest Current vs Target maturity assessments.'}
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white/80">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50 text-left">
                    <tr>
                      <th className="px-4 py-3 font-semibold text-slate-700">Capability</th>
                      <th className="px-4 py-3 font-semibold text-slate-700">Current</th>
                      <th className="px-4 py-3 font-semibold text-slate-700">Target</th>
                      <th className="px-4 py-3 font-semibold text-slate-700">Gap</th>
                      <th className="px-4 py-3 font-semibold text-slate-700">Heat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {capabilityGaps.length === 0 ? (
                      <tr>
                        <td className="px-4 py-6 text-slate-600" colSpan={5}>No capabilities found.</td>
                      </tr>
                    ) : (
                      capabilityGaps.map((row) => (
                        <tr key={row.capability.id}>
                          <td className="px-4 py-3 font-semibold text-slate-900">{row.capability.name}</td>
                          <td className="px-4 py-3 text-slate-700">{maturityLabel(row.current)}</td>
                          <td className="px-4 py-3 text-slate-700">{maturityLabel(row.target)}</td>
                          <td className="px-4 py-3 text-slate-700">{row.gap}</td>
                          <td className="px-4 py-3">
                            <span className={[
                              'inline-flex rounded-full px-2 py-1 text-xs font-semibold',
                              row.gap >= 3 ? 'bg-rose-100 text-rose-700' : row.gap >= 1 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700',
                            ].join(' ')}>
                              {row.gap >= 3 ? 'High Gap' : row.gap >= 1 ? 'Medium Gap' : 'Low Gap'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
                <p className="section-kicker">Capability Gaps</p>
                <div className="mt-2 space-y-2">
                  {capabilityGaps.filter((row) => row.gap > 0).length === 0 ? (
                    <p className="text-sm text-slate-600">No open capability maturity gaps based on latest assessments.</p>
                  ) : (
                    capabilityGaps
                      .filter((row) => row.gap > 0)
                      .slice(0, 10)
                      .map((row) => (
                        <div key={row.capability.id} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                          {row.capability.name}
                          {` | Current ${maturityLabel(row.current)} | Target ${maturityLabel(row.target)} | Gap ${row.gap}`}
                        </div>
                      ))
                  )}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {Object.entries(capabilitiesByCategory).length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600 sm:col-span-2 xl:col-span-3">
                    Capability map appears when capabilities are created.
                  </p>
                ) : (
                  Object.entries(capabilitiesByCategory).map(([category, items]) => (
                    <div key={category} className="rounded-2xl border border-slate-200 bg-white/80 p-4">
                      <p className="section-kicker">{category}</p>
                      <p className="mt-1 text-2xl font-semibold text-slate-900">{items.length}</p>
                      <p className="mt-2 text-xs text-slate-600">
                        {items.slice(0, 3).map((item) => item.name).join(' • ')}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeView === 'detail' && (
            <div className="mt-6 space-y-4">
              {!selectedCapabilityDetail ? (
                <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600">
                  Open a capability from the catalog to view details.
                </p>
              ) : (
                <>
                  <div className="rounded-xl border border-cyan-100 bg-cyan-50/60 px-4 py-3 text-sm text-cyan-900">
                    {'Traceability: Driver -> Question -> Objective -> Choice -> Capability'}
                  </div>

                  <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
                    <button
                      type="button"
                      className={`button-secondary ${detailTab === 'overview' ? 'bg-cyan-50 border-cyan-300' : ''}`}
                      onClick={() => setDetailTab('overview')}
                    >
                      Overview
                    </button>
                    <button
                      type="button"
                      className={`button-secondary ${detailTab === 'assessments' ? 'bg-cyan-50 border-cyan-300' : ''}`}
                      onClick={() => setDetailTab('assessments')}
                    >
                      Assessments
                    </button>
                  </div>

                  {detailTab === 'overview' ? (
                    <>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
                          <p className="section-kicker">Name</p>
                          <p className="mt-1 font-semibold text-slate-900">{selectedCapabilityDetail.name}</p>
                          <p className="section-kicker mt-4">Description</p>
                          <p className="mt-1 text-sm text-slate-700">{selectedCapabilityDetail.description || 'No description'}</p>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
                          <p className="section-kicker">Category</p>
                          <p className="mt-1 text-sm text-slate-700">{selectedCapabilityDetail.category}</p>
                          <p className="section-kicker mt-4">Owner Organization</p>
                          <p className="mt-1 text-sm text-slate-700">
                            {selectedCapabilityDetail.owner_organization_name || selectedCapabilityDetail.owner_organization_id}
                          </p>
                          <p className="section-kicker mt-4">Status</p>
                          <p className="mt-1 text-sm text-slate-700">{selectedCapabilityDetail.status}</p>
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
                          <p className="section-kicker">Linked Choices</p>
                          <p className="mt-1 text-xs text-slate-500">{choiceCount} linked</p>
                          <div className="mt-2 space-y-2">
                            {selectedCapabilityDetail.linked_choices.length === 0 ? (
                              <p className="text-sm text-slate-600">No linked choices.</p>
                            ) : (
                              selectedCapabilityDetail.linked_choices.map((link) => (
                                <div key={link.id} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                                  {link.strategic_choice_title || link.strategic_choice_id}
                                </div>
                              ))
                            )}
                          </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
                          <p className="section-kicker">Linked Agreements</p>
                          <p className="mt-1 text-xs text-slate-500">{agreementCount} linked through choices</p>
                          <div className="mt-2 space-y-2">
                            {selectedCapabilityDetail.linked_agreements.length === 0 ? (
                              <p className="text-sm text-slate-600">No linked agreements.</p>
                            ) : (
                              selectedCapabilityDetail.linked_agreements.map((link) => (
                                <div key={link.id} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                                  {(link.strategic_agreement_title || link.strategic_agreement_id)}
                                  {link.strategic_agreement_status ? ` • ${link.strategic_agreement_status}` : ''}
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-4">
                      <div className="rounded-xl border border-cyan-100 bg-cyan-50/60 px-4 py-3 text-sm text-cyan-900">
                        {'Capability Assessment compares Current maturity to Target maturity and surfaces the Gap.'}
                      </div>

                      <form className="grid gap-3 rounded-2xl border border-slate-200 bg-white/80 p-4 sm:grid-cols-2" onSubmit={handleSaveAssessment}>
                        <div>
                          <label className="section-kicker mb-2 block" htmlFor="assessment-planning-cycle">Planning Cycle</label>
                          <select
                            id="assessment-planning-cycle"
                            className="input-field"
                            value={assessmentForm.planning_cycle_id}
                            onChange={(event) => setAssessmentForm({ ...assessmentForm, planning_cycle_id: event.target.value })}
                          >
                            <option value="">Select planning cycle</option>
                            {planningCycles.map((cycle) => (
                              <option key={cycle.id} value={cycle.id}>{cycle.name}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="section-kicker mb-2 block" htmlFor="assessment-owner">Owner Organization</label>
                          <select
                            id="assessment-owner"
                            className="input-field"
                            value={assessmentForm.owner_organization_id}
                            onChange={(event) => setAssessmentForm({ ...assessmentForm, owner_organization_id: event.target.value })}
                          >
                            <option value="">Select owner organization</option>
                            {organizations.map((organization) => (
                              <option key={organization.id} value={organization.id}>{organization.name}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="section-kicker mb-2 block" htmlFor="assessment-current">Current</label>
                          <select
                            id="assessment-current"
                            className="input-field"
                            value={assessmentForm.current_maturity}
                            onChange={(event) => setAssessmentForm({ ...assessmentForm, current_maturity: Number(event.target.value) })}
                          >
                            {MATURITY_OPTIONS.map((value) => (
                              <option key={value} value={value}>{maturityLabel(value)}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="section-kicker mb-2 block" htmlFor="assessment-target">Target</label>
                          <select
                            id="assessment-target"
                            className="input-field"
                            value={assessmentForm.target_maturity}
                            onChange={(event) => setAssessmentForm({ ...assessmentForm, target_maturity: Number(event.target.value) })}
                          >
                            {MATURITY_OPTIONS.map((value) => (
                              <option key={value} value={value}>{maturityLabel(value)}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="section-kicker mb-2 block" htmlFor="assessment-date">Assessment Date</label>
                          <input
                            id="assessment-date"
                            type="date"
                            className="input-field"
                            value={assessmentForm.assessment_date || ''}
                            onChange={(event) => setAssessmentForm({ ...assessmentForm, assessment_date: event.target.value })}
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="section-kicker mb-2 block" htmlFor="assessment-notes">Assessment Notes</label>
                          <textarea
                            id="assessment-notes"
                            className="input-field min-h-[84px]"
                            value={assessmentForm.assessment_notes || ''}
                            onChange={(event) => setAssessmentForm({ ...assessmentForm, assessment_notes: event.target.value })}
                          />
                        </div>

                        <div className="sm:col-span-2 flex flex-wrap gap-2">
                          <button className="button-primary" type="submit">
                            {selectedAssessmentId ? 'Save Assessment' : 'Create Assessment'}
                          </button>
                          {selectedAssessmentId && (
                            <button
                              type="button"
                              className="button-secondary"
                              onClick={() => {
                                setSelectedAssessmentId('')
                                setAssessmentForm({
                                  ...EMPTY_ASSESSMENT_FORM,
                                  capability_id: selectedCapabilityId,
                                  owner_organization_id: capabilityForm.owner_organization_id,
                                })
                              }}
                            >
                              Clear Assessment Selection
                            </button>
                          )}
                        </div>
                      </form>

                      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white/80">
                        <table className="min-w-full divide-y divide-slate-200 text-sm">
                          <thead className="bg-slate-50 text-left">
                            <tr>
                              <th className="px-4 py-3 font-semibold text-slate-700">Planning Cycle</th>
                              <th className="px-4 py-3 font-semibold text-slate-700">Current</th>
                              <th className="px-4 py-3 font-semibold text-slate-700">Target</th>
                              <th className="px-4 py-3 font-semibold text-slate-700">Gap</th>
                              <th className="px-4 py-3 font-semibold text-slate-700">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white">
                            {selectedAssessments.length === 0 ? (
                              <tr>
                                <td className="px-4 py-6 text-slate-600" colSpan={5}>No assessments yet.</td>
                              </tr>
                            ) : (
                              selectedAssessments.map((assessment) => (
                                <tr key={assessment.id}>
                                  <td className="px-4 py-3 text-slate-700">{assessment.planning_cycle_name || assessment.planning_cycle_id}</td>
                                  <td className="px-4 py-3 text-slate-700">{maturityLabel(assessment.current_maturity)}</td>
                                  <td className="px-4 py-3 text-slate-700">{maturityLabel(assessment.target_maturity)}</td>
                                  <td className="px-4 py-3 text-slate-700">{assessment.assessment_gap}</td>
                                  <td className="px-4 py-3">
                                    <button type="button" className="button-secondary" onClick={() => handleEditAssessment(assessment)}>
                                      Edit
                                    </button>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
