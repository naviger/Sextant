import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { LoginButton } from '../components/LoginButton'
import { MainMenu } from '../components/MainMenu'
import {
  addPlanningCycleParticipant,
  archivePlanningCycle,
  createPlanningCycle,
  getOrganizations,
  getPlanningCycleParticipantSuggestions,
  getPlanningCycles,
} from '../services/api'
import {
  OrganizationResponse,
  PlanningCycle,
  PlanningCycleParticipantSuggestion,
} from '../types'

const CYCLE_STATUS_OPTIONS = [
  'Draft',
  'Planning',
  'Negotiation',
  'Approved',
  'Executing',
  'Completed',
  'Archived',
]

const EMPTY_CYCLE_FORM = {
  name: '',
  description: '',
  owner_organization_id: '',
  status: 'Draft',
  start_date: '',
  end_date: '',
}

export const StrategyPlanningCycles: React.FC = () => {
  const [planningCycles, setPlanningCycles] = useState<PlanningCycle[]>([])
  const [organizations, setOrganizations] = useState<OrganizationResponse[]>([])
  const [participantSuggestions, setParticipantSuggestions] = useState<PlanningCycleParticipantSuggestion[]>([])
  const [acceptedSuggestionIds, setAcceptedSuggestionIds] = useState<string[]>([])
  const [additionalParticipantId, setAdditionalParticipantId] = useState('')
  const [additionalParticipantIds, setAdditionalParticipantIds] = useState<string[]>([])
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
  const [cycleForm, setCycleForm] = useState(EMPTY_CYCLE_FORM)
  const [statusMessage, setStatusMessage] = useState('')
  const [error, setError] = useState('')

  const refreshPlanningCycles = async () => {
    const data = await getPlanningCycles()
    setPlanningCycles(data)
  }

  useEffect(() => {
    const load = async () => {
      try {
        const [cycles, orgs] = await Promise.all([
          getPlanningCycles(),
          getOrganizations(),
        ])
        setPlanningCycles(cycles)
        setOrganizations(orgs)
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load planning cycles')
      }
    }

    void load()
  }, [])

  const organizationLookup = useMemo(() => {
    const lookup = new Map<string, string>()
    organizations.forEach((organization) => {
      lookup.set(organization.id, organization.name)
    })
    return lookup
  }, [organizations])

  const eligibleAdditionalParticipants = useMemo(() => {
    const excluded = new Set<string>([
      cycleForm.owner_organization_id,
      ...acceptedSuggestionIds,
      ...additionalParticipantIds,
    ])

    return organizations.filter((organization) => !excluded.has(organization.id))
  }, [acceptedSuggestionIds, additionalParticipantIds, cycleForm.owner_organization_id, organizations])

  const additionalParticipantNames = useMemo(() => {
    return additionalParticipantIds.map((id) => ({
      id,
      name: organizationLookup.get(id) || id,
    }))
  }, [additionalParticipantIds, organizationLookup])

  useEffect(() => {
    const ownerId = cycleForm.owner_organization_id
    if (!ownerId) {
      setParticipantSuggestions([])
      setAcceptedSuggestionIds([])
      return
    }

    const loadSuggestions = async () => {
      setIsLoadingSuggestions(true)
      try {
        const suggestions = await getPlanningCycleParticipantSuggestions(ownerId)
        setParticipantSuggestions(suggestions)
        setAcceptedSuggestionIds(suggestions.map((item) => item.organization_id))
      } catch {
        setParticipantSuggestions([])
        setAcceptedSuggestionIds([])
      } finally {
        setIsLoadingSuggestions(false)
      }
    }

    void loadSuggestions()
  }, [cycleForm.owner_organization_id])

  const toIsoDate = (value: string): string | undefined => {
    if (!value) {
      return undefined
    }
    return `${value}T00:00:00Z`
  }

  const formatDate = (value?: string | null): string => {
    if (!value) {
      return 'Not set'
    }
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) {
      return value
    }
    return parsed.toISOString().slice(0, 10)
  }

  const handleCreateCycle = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setStatusMessage('')

    if (!cycleForm.name.trim()) {
      setError('Planning cycle name is required.')
      return
    }

    if (!cycleForm.owner_organization_id) {
      setError('Owner organization is required.')
      return
    }

    try {
      const created = await createPlanningCycle({
        name: cycleForm.name.trim(),
        description: cycleForm.description.trim() || undefined,
        owner_organization_id: cycleForm.owner_organization_id,
        status: cycleForm.status,
        start_date: toIsoDate(cycleForm.start_date),
        end_date: toIsoDate(cycleForm.end_date),
      })

      const participantIds = Array.from(new Set([...acceptedSuggestionIds, ...additionalParticipantIds]))
      for (const organizationId of participantIds) {
        await addPlanningCycleParticipant(created.id, 'organization', organizationId)
      }

      setCycleForm(EMPTY_CYCLE_FORM)
      setParticipantSuggestions([])
      setAcceptedSuggestionIds([])
      setAdditionalParticipantId('')
      setAdditionalParticipantIds([])
      setStatusMessage(`Planning cycle created. Added ${participantIds.length} participant(s).`)
      await refreshPlanningCycles()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to create planning cycle')
    }
  }

  const toggleSuggestion = (organizationId: string) => {
    setAcceptedSuggestionIds((current) => {
      if (current.includes(organizationId)) {
        return current.filter((id) => id !== organizationId)
      }
      return [...current, organizationId]
    })
  }

  const addAdditionalParticipant = () => {
    if (!additionalParticipantId) {
      return
    }
    setAdditionalParticipantIds((current) => {
      if (current.includes(additionalParticipantId)) {
        return current
      }
      return [...current, additionalParticipantId]
    })
    setAdditionalParticipantId('')
  }

  const removeAdditionalParticipant = (organizationId: string) => {
    setAdditionalParticipantIds((current) => current.filter((id) => id !== organizationId))
  }

  const handleArchiveCycle = async (cycle: PlanningCycle) => {
    const confirmed = window.confirm(`Archive ${cycle.name}?`)
    if (!confirmed) {
      return
    }

    setError('')
    setStatusMessage('')

    try {
      await archivePlanningCycle(cycle.id)
      setStatusMessage(`${cycle.name} archived.`)
      await refreshPlanningCycles()
    } catch (archiveError) {
      setError(archiveError instanceof Error ? archiveError.message : 'Unable to archive planning cycle')
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

      <MainMenu breadcrumb="Strategy / Planning Cycles" />

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        {(statusMessage || error) && (
          <section className="surface-panel rounded-[1.5rem] p-5">
            <p className={`text-sm font-semibold ${error ? 'text-rose-700' : 'text-emerald-700'}`}>
              {error || statusMessage}
            </p>
          </section>
        )}

        <section className="surface-panel rounded-[2rem] p-7">
          <p className="section-kicker mb-2">Strategy Workspace</p>
          <h1 className="text-3xl font-semibold text-slate-900">Planning Cycles</h1>
          <p className="mt-3 text-slate-600">Planning cycles are bounded workspaces where strategic artifacts will be developed and tracked.</p>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          <article className="surface-panel rounded-[2rem] p-7">
            <p className="section-kicker mb-2">Create</p>
            <h2 className="text-2xl font-semibold text-slate-900">New Planning Cycle</h2>

            <form className="mt-6 space-y-4" onSubmit={handleCreateCycle}>
              <div>
                <label className="section-kicker mb-2 block" htmlFor="cycle-name">Name</label>
                <input
                  id="cycle-name"
                  className="input-field"
                  value={cycleForm.name}
                  onChange={(event) => setCycleForm({ ...cycleForm, name: event.target.value })}
                />
              </div>

              <div>
                <label className="section-kicker mb-2 block" htmlFor="cycle-description">Description</label>
                <textarea
                  id="cycle-description"
                  className="input-field min-h-[90px]"
                  value={cycleForm.description}
                  onChange={(event) => setCycleForm({ ...cycleForm, description: event.target.value })}
                />
              </div>

              <div>
                <label className="section-kicker mb-2 block" htmlFor="cycle-owner">Owner Organization</label>
                <select
                  id="cycle-owner"
                  className="input-field"
                  value={cycleForm.owner_organization_id}
                  onChange={(event) => setCycleForm({ ...cycleForm, owner_organization_id: event.target.value })}
                >
                  <option value="">Select owner organization</option>
                  {organizations.map((organization) => (
                    <option key={organization.id} value={organization.id}>{organization.name}</option>
                  ))}
                </select>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white/75 p-4">
                <p className="section-kicker mb-2">Suggested Participants</p>
                <p className="text-sm text-slate-600">
                  Suggestions are based on active strategic relationships and are optional for this planning cycle.
                </p>

                {isLoadingSuggestions ? (
                  <p className="mt-3 text-sm text-slate-500">Loading suggestions...</p>
                ) : participantSuggestions.length === 0 ? (
                  <p className="mt-3 text-sm text-slate-500">No suggestions available for the selected owner.</p>
                ) : (
                  <div className="mt-3 space-y-2">
                    {participantSuggestions.map((suggestion) => {
                      const checked = acceptedSuggestionIds.includes(suggestion.organization_id)
                      return (
                        <label key={suggestion.organization_id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2">
                          <span className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleSuggestion(suggestion.organization_id)}
                            />
                            <span className="text-sm font-semibold text-slate-900">{suggestion.organization_name}</span>
                          </span>
                          <span className="text-xs text-slate-500">
                            {suggestion.relationship_count} active relationship{suggestion.relationship_count === 1 ? '' : 's'}
                          </span>
                        </label>
                      )
                    })}
                  </div>
                )}

                <div className="mt-4 flex flex-wrap items-end gap-3">
                  <div className="min-w-[220px] flex-1">
                    <label className="section-kicker mb-2 block" htmlFor="additional-participant">Modify: add organization</label>
                    <select
                      id="additional-participant"
                      className="input-field"
                      value={additionalParticipantId}
                      onChange={(event) => setAdditionalParticipantId(event.target.value)}
                    >
                      <option value="">Select organization</option>
                      {eligibleAdditionalParticipants.map((organization) => (
                        <option key={organization.id} value={organization.id}>{organization.name}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    className="button-secondary"
                    onClick={addAdditionalParticipant}
                    disabled={!additionalParticipantId}
                  >
                    Add
                  </button>
                </div>

                {additionalParticipantNames.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {additionalParticipantNames.map((participant) => (
                      <button
                        key={participant.id}
                        type="button"
                        className="button-secondary"
                        onClick={() => removeAdditionalParticipant(participant.id)}
                      >
                        {participant.name} - Remove
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="section-kicker mb-2 block" htmlFor="cycle-status">Status</label>
                  <select
                    id="cycle-status"
                    className="input-field"
                    value={cycleForm.status}
                    onChange={(event) => setCycleForm({ ...cycleForm, status: event.target.value })}
                  >
                    {CYCLE_STATUS_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="section-kicker mb-2 block" htmlFor="cycle-start-date">Start Date</label>
                  <input
                    id="cycle-start-date"
                    type="date"
                    className="input-field"
                    value={cycleForm.start_date}
                    onChange={(event) => setCycleForm({ ...cycleForm, start_date: event.target.value })}
                  />
                </div>

                <div>
                  <label className="section-kicker mb-2 block" htmlFor="cycle-end-date">End Date</label>
                  <input
                    id="cycle-end-date"
                    type="date"
                    className="input-field"
                    value={cycleForm.end_date}
                    onChange={(event) => setCycleForm({ ...cycleForm, end_date: event.target.value })}
                  />
                </div>
              </div>

              <button className="button-primary" type="submit">Create</button>
            </form>
          </article>

          <article className="surface-panel rounded-[2rem] p-7">
            <p className="section-kicker mb-2">List</p>
            <h2 className="text-2xl font-semibold text-slate-900">Planning cycle workspace list</h2>

            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-[0.14em] text-slate-500">
                    <th className="py-3 pr-3">Name</th>
                    <th className="py-3 pr-3">Owner Organization</th>
                    <th className="py-3 pr-3">Status</th>
                    <th className="py-3 pr-3">Start Date</th>
                    <th className="py-3 pr-3">End Date</th>
                    <th className="py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {planningCycles.length === 0 ? (
                    <tr>
                      <td className="py-6 text-slate-500" colSpan={6}>No planning cycles created yet.</td>
                    </tr>
                  ) : (
                    planningCycles.map((cycle) => (
                      <tr key={cycle.id} className="border-b border-slate-100 align-top">
                        <td className="py-4 pr-3 font-semibold text-slate-900">{cycle.name}</td>
                        <td className="py-4 pr-3 text-slate-600">
                          {cycle.owner_organization_name || organizationLookup.get(cycle.owner_organization_id) || cycle.owner_organization_id}
                        </td>
                        <td className="py-4 pr-3 text-slate-600">{cycle.status}</td>
                        <td className="py-4 pr-3 text-slate-600">{formatDate(cycle.start_date)}</td>
                        <td className="py-4 pr-3 text-slate-600">{formatDate(cycle.end_date)}</td>
                        <td className="py-4">
                          <div className="flex flex-wrap gap-2">
                            <Link className="button-secondary" to={`/strategy/planning-cycles/${cycle.id}`}>View</Link>
                            <Link className="button-secondary" to={`/strategy/planning-cycles/${cycle.id}`}>Edit</Link>
                            {cycle.status !== 'Archived' && (
                              <button
                                type="button"
                                className="button-secondary text-rose-700 hover:border-rose-200 hover:bg-rose-50"
                                onClick={() => void handleArchiveCycle(cycle)}
                              >
                                Archive
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </article>
        </section>
      </main>
    </div>
  )
}
