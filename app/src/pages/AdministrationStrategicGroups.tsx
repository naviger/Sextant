import React, { useEffect, useMemo, useState } from 'react'
import { LoginButton } from '../components/LoginButton'
import { MainMenu } from '../components/MainMenu'
import {
  addStrategicGroupMember,
  archiveStrategicGroup,
  createStrategicGroup,
  getOrganizations,
  getStrategicGroupMembers,
  getStrategicGroups,
  removeStrategicGroupMember,
  updateStrategicGroup,
} from '../services/api'
import { OrganizationResponse, StrategicGroup, StrategicGroupMembership } from '../types'

const GROUP_TYPE_OPTIONS = [
  'Strategy Council',
  'Working Group',
  'Planning Committee',
  'Investment Committee',
  'Steering Committee',
  'Custom',
]

const EMPTY_GROUP_FORM = {
  name: '',
  description: '',
  group_type: 'Strategy Council',
  custom_group_type: '',
  status: 'Active',
}

export const AdministrationStrategicGroups: React.FC = () => {
  const [groups, setGroups] = useState<StrategicGroup[]>([])
  const [organizations, setOrganizations] = useState<OrganizationResponse[]>([])
  const [memberships, setMemberships] = useState<StrategicGroupMembership[]>([])
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [groupForm, setGroupForm] = useState(EMPTY_GROUP_FORM)
  const [memberToAdd, setMemberToAdd] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [error, setError] = useState('')

  const refreshGroups = async () => {
    const data = await getStrategicGroups()
    setGroups(data)
    if (!selectedGroupId && data.length > 0) {
      setSelectedGroupId(data[0].id)
    }
  }

  const refreshMembers = async (groupId: string) => {
    const data = await getStrategicGroupMembers(groupId)
    setMemberships(data)
  }

  useEffect(() => {
    const load = async () => {
      try {
        const [groupData, organizationData] = await Promise.all([
          getStrategicGroups(),
          getOrganizations(),
        ])
        setGroups(groupData)
        setOrganizations(organizationData)
        if (groupData.length > 0) {
          setSelectedGroupId(groupData[0].id)
        }
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load strategic group data')
      }
    }

    void load()
  }, [])

  useEffect(() => {
    if (!selectedGroupId) {
      setMemberships([])
      return
    }

    const loadMembers = async () => {
      try {
        await refreshMembers(selectedGroupId)
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load strategic group members')
      }
    }

    void loadMembers()
  }, [selectedGroupId])

  const selectedGroup = useMemo(
    () => groups.find((group) => group.id === selectedGroupId) ?? null,
    [groups, selectedGroupId],
  )

  const existingMemberIds = useMemo(
    () => new Set(memberships.map((membership) => membership.organization_id)),
    [memberships],
  )

  const eligibleOrganizations = useMemo(
    () => organizations.filter((organization) => !existingMemberIds.has(organization.id)),
    [existingMemberIds, organizations],
  )

  const resolveGroupType = (): string => {
    if (groupForm.group_type !== 'Custom') {
      return groupForm.group_type
    }

    const customType = groupForm.custom_group_type.trim()
    return customType || 'Custom'
  }

  const handleCreateGroup = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setStatusMessage('')

    const name = groupForm.name.trim()
    if (!name) {
      setError('Group name is required.')
      return
    }

    try {
      await createStrategicGroup({
        name,
        description: groupForm.description.trim() || undefined,
        group_type: resolveGroupType(),
        status: groupForm.status,
      })
      setStatusMessage('Strategic group created.')
      setGroupForm(EMPTY_GROUP_FORM)
      await refreshGroups()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to create strategic group')
    }
  }

  const handleSaveGroup = async () => {
    if (!selectedGroup) {
      return
    }

    setError('')
    setStatusMessage('')

    const name = groupForm.name.trim()
    if (!name) {
      setError('Group name is required.')
      return
    }

    try {
      await updateStrategicGroup(selectedGroup.id, {
        name,
        description: groupForm.description.trim() || undefined,
        group_type: resolveGroupType(),
        status: groupForm.status,
      })
      setStatusMessage('Strategic group updated.')
      await refreshGroups()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to update strategic group')
    }
  }

  const handleArchiveGroup = async () => {
    if (!selectedGroup) {
      return
    }

    const confirmed = window.confirm(`Archive ${selectedGroup.name}?`)
    if (!confirmed) {
      return
    }

    setError('')
    setStatusMessage('')

    try {
      await archiveStrategicGroup(selectedGroup.id)
      setStatusMessage(`${selectedGroup.name} archived.`)
      await refreshGroups()
    } catch (archiveError) {
      setError(archiveError instanceof Error ? archiveError.message : 'Unable to archive strategic group')
    }
  }

  const handleLoadGroup = (group: StrategicGroup) => {
    setSelectedGroupId(group.id)
    setGroupForm({
      name: group.name,
      description: group.description ?? '',
      group_type: GROUP_TYPE_OPTIONS.includes(group.group_type) ? group.group_type : 'Custom',
      custom_group_type: GROUP_TYPE_OPTIONS.includes(group.group_type) ? '' : group.group_type,
      status: group.status,
    })
    setMemberToAdd('')
    setError('')
    setStatusMessage('')
  }

  const handleAddMember = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!selectedGroupId || !memberToAdd) {
      return
    }

    setError('')
    setStatusMessage('')

    try {
      await addStrategicGroupMember(selectedGroupId, memberToAdd)
      setStatusMessage('Member added.')
      setMemberToAdd('')
      await refreshMembers(selectedGroupId)
    } catch (addError) {
      setError(addError instanceof Error ? addError.message : 'Unable to add member')
    }
  }

  const handleRemoveMember = async (organizationId: string) => {
    if (!selectedGroupId) {
      return
    }

    setError('')
    setStatusMessage('')

    try {
      await removeStrategicGroupMember(selectedGroupId, organizationId)
      setStatusMessage('Member removed.')
      await refreshMembers(selectedGroupId)
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : 'Unable to remove member')
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

      <MainMenu breadcrumb="Administration / Strategic Groups" />

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        {(statusMessage || error) && (
          <section className="surface-panel rounded-[1.5rem] p-5">
            <p className={`text-sm font-semibold ${error ? 'text-rose-700' : 'text-emerald-700'}`}>
              {error || statusMessage}
            </p>
          </section>
        )}

        <section className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
          <article className="surface-panel rounded-[2rem] p-7">
            <p className="section-kicker mb-2">Strategic Groups</p>
            <h1 className="text-2xl font-semibold text-slate-900">Create and manage participation groups</h1>
            <p className="mt-3 text-sm text-slate-600">
              Represent cross-organizational participation without creating a large web of peer relationships.
            </p>

            <form className="mt-6 space-y-4" onSubmit={handleCreateGroup}>
              <div>
                <label className="section-kicker mb-2 block" htmlFor="group-name">Name</label>
                <input
                  id="group-name"
                  className="input-field"
                  value={groupForm.name}
                  onChange={(event) => setGroupForm({ ...groupForm, name: event.target.value })}
                />
              </div>

              <div>
                <label className="section-kicker mb-2 block" htmlFor="group-description">Description</label>
                <textarea
                  id="group-description"
                  className="input-field min-h-[88px]"
                  value={groupForm.description}
                  onChange={(event) => setGroupForm({ ...groupForm, description: event.target.value })}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="section-kicker mb-2 block" htmlFor="group-type">Group Type</label>
                  <select
                    id="group-type"
                    className="input-field"
                    value={groupForm.group_type}
                    onChange={(event) => setGroupForm({ ...groupForm, group_type: event.target.value })}
                  >
                    {GROUP_TYPE_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="section-kicker mb-2 block" htmlFor="group-status">Status</label>
                  <select
                    id="group-status"
                    className="input-field"
                    value={groupForm.status}
                    onChange={(event) => setGroupForm({ ...groupForm, status: event.target.value })}
                  >
                    <option value="Active">Active</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
              </div>

              {groupForm.group_type === 'Custom' && (
                <div>
                  <label className="section-kicker mb-2 block" htmlFor="custom-group-type">Custom Group Type</label>
                  <input
                    id="custom-group-type"
                    className="input-field"
                    value={groupForm.custom_group_type}
                    onChange={(event) => setGroupForm({ ...groupForm, custom_group_type: event.target.value })}
                  />
                </div>
              )}

              <div className="flex flex-wrap gap-3 pt-2">
                <button className="button-primary" type="submit">Create Group</button>
                {selectedGroup && (
                  <button className="button-secondary" type="button" onClick={handleSaveGroup}>Save Selected Group</button>
                )}
                {selectedGroup && selectedGroup.status !== 'Archived' && (
                  <button className="button-secondary text-rose-700 hover:border-rose-200 hover:bg-rose-50" type="button" onClick={handleArchiveGroup}>
                    Archive Group
                  </button>
                )}
              </div>
            </form>
          </article>

          <article className="surface-panel rounded-[2rem] p-7">
            <p className="section-kicker mb-2">Groups</p>
            <h2 className="text-2xl font-semibold text-slate-900">Strategic participation groups</h2>

            <div className="mt-6 space-y-3">
              {groups.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600">
                  No strategic groups have been created yet.
                </p>
              ) : (
                groups.map((group) => (
                  <button
                    key={group.id}
                    type="button"
                    className={[
                      'w-full rounded-2xl border p-4 text-left transition-colors',
                      selectedGroupId === group.id
                        ? 'border-cyan-300 bg-cyan-50/70'
                        : 'border-slate-200 bg-white/80 hover:border-cyan-200 hover:bg-cyan-50/40',
                    ].join(' ')}
                    onClick={() => handleLoadGroup(group)}
                  >
                    <p className="font-semibold text-slate-900">{group.name}</p>
                    <p className="mt-1 text-sm text-slate-600">{group.group_type} • {group.status}</p>
                    {group.description && <p className="mt-2 text-sm text-slate-600">{group.description}</p>}
                  </button>
                ))
              )}
            </div>
          </article>
        </section>

        <section className="surface-panel rounded-[2rem] p-7">
          <p className="section-kicker mb-2">Membership</p>
          <h2 className="text-2xl font-semibold text-slate-900">Group members</h2>

          {!selectedGroupId ? (
            <p className="mt-4 text-sm text-slate-600">Select a group to manage members.</p>
          ) : (
            <>
              <form className="mt-6 flex flex-wrap items-end gap-3" onSubmit={handleAddMember}>
                <div className="min-w-[260px] flex-1">
                  <label className="section-kicker mb-2 block" htmlFor="member-organization">Add organization member</label>
                  <select
                    id="member-organization"
                    className="input-field"
                    value={memberToAdd}
                    onChange={(event) => setMemberToAdd(event.target.value)}
                  >
                    <option value="">Select organization</option>
                    {eligibleOrganizations.map((organization) => (
                      <option key={organization.id} value={organization.id}>
                        {organization.name} ({organization.code || organization.id})
                      </option>
                    ))}
                  </select>
                </div>
                <button className="button-primary" type="submit" disabled={!memberToAdd}>Add Member</button>
              </form>

              <div className="mt-6 space-y-3">
                {memberships.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600">
                    This group has no members yet.
                  </p>
                ) : (
                  memberships.map((membership) => (
                    <div key={membership.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/80 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">{membership.organization_name}</p>
                        <p className="text-sm text-slate-600">
                          {membership.organization_code || membership.organization_id} • {membership.organization_status}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="button-secondary text-rose-700 hover:border-rose-200 hover:bg-rose-50"
                        onClick={() => void handleRemoveMember(membership.organization_id)}
                      >
                        Remove Member
                      </button>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  )
}
