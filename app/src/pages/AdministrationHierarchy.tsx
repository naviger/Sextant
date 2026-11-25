import React, { useEffect, useMemo, useState } from 'react'
import { MainMenu } from '../components/MainMenu'
import { LoginButton } from '../components/LoginButton'
import { TreeView, TreeViewItem } from '../components/TreeView'
import {
  createOrganization,
  createStrategicRelationship,
  deleteOrganization,
  deleteStrategicRelationship,
  getOrganizations,
  getStrategicRelationships,
  importOrganizations,
  setOrganizationRoot,
  updateOrganization,
  updateStrategicRelationship,
} from '../services/api'
import {
  OrganizationImportResult,
  OrganizationResponse,
  StrategicRelationship,
} from '../types'

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

type EditorTab = 'org-details' | 'strategic-relationships'

interface OrganizationTreeNode {
  organization: OrganizationResponse
  children: OrganizationTreeNode[]
}

const RELATIONSHIP_TYPES = ['Governance', 'Collaboration', 'Dependency', 'Oversight']
const RELATIONSHIP_STATUSES = ['Draft', 'Active', 'Suspended', 'Retired']
const STRATEGIC_CLASSIFICATION_VALUES = ['Strategic', 'Operational', 'Hybrid']
const FISCAL_RESPONSIBILITY_VALUES = ['Enterprise Funded', 'Cost Center', 'Profit Center', 'Investment Center', 'Autonomous Business Unit']
const INVESTMENT_AUTHORITY_VALUES = ['None', 'Recommend', 'Approve', 'Own']
const PARTICIPATION_ROLE_VALUES = ['Lead', 'Required Participant', 'Contributor', 'Observer']
const STRATEGY_ROLE_VALUES = ['Defines', 'Co-Defines', 'Responds', 'Executes']
const REVIEW_CADENCE_VALUES = ['Monthly', 'Quarterly', 'Semi-Annual', 'Annual']
const EMPTY_RELATIONSHIP_DETAILS_FORM = {
  relationship_type: 'Governance',
  participation_role: 'Contributor',
  strategy_role: 'Responds',
  review_cadence: 'Quarterly',
  status: 'Draft',
  notes: '',
}

const sortOrganizationsByName = (organizations: OrganizationResponse[]): OrganizationResponse[] => {
  return [...organizations].sort((left, right) => left.name.localeCompare(right.name))
}

const buildOrganizationTree = (organizations: OrganizationResponse[]): OrganizationTreeNode[] => {
  const nodeMap = new Map<string, OrganizationTreeNode>()
  sortOrganizationsByName(organizations).forEach((organization) => {
    nodeMap.set(organization.id, { organization, children: [] })
  })

  const roots: OrganizationTreeNode[] = []

  sortOrganizationsByName(organizations).forEach((organization) => {
    const node = nodeMap.get(organization.id)
    if (!node) {
      return
    }

    const parentId = organization.parent_organization_id ?? organization.parentOrganizationId
    if (parentId && nodeMap.has(parentId)) {
      nodeMap.get(parentId)?.children.push(node)
    } else {
      roots.push(node)
    }
  })

  const sortChildren = (nodes: OrganizationTreeNode[]) => {
    nodes.sort((left, right) => left.organization.name.localeCompare(right.organization.name))
    nodes.forEach((node) => sortChildren(node.children))
  }

  sortChildren(roots)
  return roots
}

const mapTreeNodesToItems = (nodes: OrganizationTreeNode[]): TreeViewItem<OrganizationResponse>[] => {
  return nodes.map((node) => ({
    id: node.organization.id,
    title: node.organization.name,
    subtitle: `${node.organization.code || node.organization.id} • ${node.organization.organization_type || node.organization.organizationType || 'Organization'} • ${node.organization.status}`,
    data: node.organization,
    children: mapTreeNodesToItems(node.children),
  }))
}

const branchIdsFromTree = (nodes: OrganizationTreeNode[]): string[] => {
  const branchIds: string[] = []
  const walk = (items: OrganizationTreeNode[]) => {
    items.forEach((item) => {
      if (item.children.length > 0) {
        branchIds.push(item.organization.id)
        walk(item.children)
      }
    })
  }
  walk(nodes)
  return branchIds
}

const getRelationshipArrow = (relationshipType: string): string => {
  if (relationshipType === 'Collaboration') {
    return '↔'
  }
  return '→'
}

const normalizeStatus = (value?: string | null): string => (value || '').toLowerCase()

export const AdministrationHierarchy: React.FC = () => {
  const [organizations, setOrganizations] = useState<OrganizationResponse[]>([])
  const [csvContent, setCsvContent] = useState(
    'name,code,description,organization_type,status,strategic_classification,fiscal_responsibility,investment_authority\nCorporate,CORP,Head office,Corporate,active,Strategic,Enterprise Funded,Own\nIndia BU,INDIA,India business unit,Business Unit,active,Hybrid,Profit Center,Approve',
  )
  const [fullReload, setFullReload] = useState(false)
  const [importResult, setImportResult] = useState<OrganizationImportResult | null>(null)
  const [statusMessage, setStatusMessage] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [modalError, setModalError] = useState<string>('')
  const [organizationForm, setOrganizationForm] = useState(EMPTY_ORGANIZATION_FORM)
  const [editingOrganizationId, setEditingOrganizationId] = useState<string | null>(null)
  const [isNodeEditorOpen, setIsNodeEditorOpen] = useState(false)
  const [activeEditorTab, setActiveEditorTab] = useState<EditorTab>('org-details')

  const [nodeRelationships, setNodeRelationships] = useState<StrategicRelationship[]>([])
  const [selectedRelationshipId, setSelectedRelationshipId] = useState<string | null>(null)
  const [relationshipDetailsForm, setRelationshipDetailsForm] = useState(EMPTY_RELATIONSHIP_DETAILS_FORM)

  const [isRelationshipBuilderOpen, setIsRelationshipBuilderOpen] = useState(false)
  const [relationshipTargetSearch, setRelationshipTargetSearch] = useState('')
  const [relationshipTargetTypeFilter, setRelationshipTargetTypeFilter] = useState('All')
  const [relationshipTargetRegionFilter, setRelationshipTargetRegionFilter] = useState('All')
  const [relationshipTargetStatusFilter, setRelationshipTargetStatusFilter] = useState('All')
  const [newRelationshipDraft, setNewRelationshipDraft] = useState({
    target_node_id: '',
    relationship_type: 'Governance',
  })
  const [collapsedNodeIds, setCollapsedNodeIds] = useState<Set<string>>(new Set())

  const organizationById = useMemo(() => {
    const map = new Map<string, OrganizationResponse>()
    organizations.forEach((organization) => {
      map.set(organization.id, organization)
    })
    return map
  }, [organizations])

  const refreshOrganizations = async () => {
    const refreshed = await getOrganizations()
    setOrganizations(refreshed)
  }

  const getOrganizationDisplayName = (organizationId: string): string => {
    const organization = organizationById.get(organizationId)
    return organization?.name || organizationId
  }

  const loadRelationshipsForNode = async (nodeId: string) => {
    const relationships = await getStrategicRelationships(nodeId)
    setNodeRelationships(relationships)

    if (relationships.length > 0) {
      const firstRelationship = relationships[0]
      setSelectedRelationshipId(firstRelationship.id)
      setRelationshipDetailsForm({
        relationship_type: firstRelationship.relationship_type,
        participation_role: firstRelationship.participation_role,
        strategy_role: firstRelationship.strategy_role,
        review_cadence: firstRelationship.review_cadence,
        status: firstRelationship.status,
        notes: firstRelationship.notes ?? '',
      })
    } else {
      setSelectedRelationshipId(null)
      setRelationshipDetailsForm(EMPTY_RELATIONSHIP_DETAILS_FORM)
    }
  }

  useEffect(() => {
    const load = async () => {
      try {
        const organizationData = await getOrganizations()
        setOrganizations(organizationData)
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load administration data')
      }
    }

    void load()
  }, [])

  const childCountById = useMemo(() => {
    const counts = new Map<string, number>()
    organizations.forEach((organization) => {
      const parentId = organization.parent_organization_id ?? organization.parentOrganizationId
      if (!parentId) {
        return
      }

      const existingCount = counts.get(parentId) ?? 0
      counts.set(parentId, existingCount + 1)
    })
    return counts
  }, [organizations])

  const organizationTree = useMemo(() => buildOrganizationTree(organizations), [organizations])
  const organizationTreeItems = useMemo(() => mapTreeNodesToItems(organizationTree), [organizationTree])
  const branchNodeIds = useMemo(() => branchIdsFromTree(organizationTree), [organizationTree])
  const definedRootCount = useMemo(
    () => organizations.filter((organization) => organization.is_root).length,
    [organizations],
  )
  const hasDefinedRoot = definedRootCount > 0

  const singleTopLevelNodeId = useMemo(() => {
    const topLevel = organizations.filter((organization) => {
      const parentId = organization.parent_organization_id ?? organization.parentOrganizationId
      return !parentId
    })
    return topLevel.length === 1 ? topLevel[0].id : null
  }, [organizations])

  const openCreateModal = (parentOrganizationId = '') => {
    let resolvedParentId = parentOrganizationId
    if (!resolvedParentId && hasDefinedRoot) {
      const currentRoot = organizations.find((organization) => organization.is_root)
      resolvedParentId = currentRoot?.id ?? ''
    }

    setEditingOrganizationId(null)
    setOrganizationForm({
      ...EMPTY_ORGANIZATION_FORM,
      parent_organization_id: resolvedParentId,
    })
    setNodeRelationships([])
    setSelectedRelationshipId(null)
    setRelationshipDetailsForm(EMPTY_RELATIONSHIP_DETAILS_FORM)
    setActiveEditorTab('org-details')
    setIsNodeEditorOpen(true)
    setIsRelationshipBuilderOpen(false)
    setModalError('')
    setError('')
  }

  const openEditModal = async (organization: OrganizationResponse) => {
    setEditingOrganizationId(organization.id)
    setOrganizationForm({
      name: organization.name,
      code: organization.code ?? '',
      description: organization.description ?? '',
      parent_organization_id: organization.parent_organization_id ?? organization.parentOrganizationId ?? '',
      organization_type: organization.organization_type ?? organization.organizationType ?? 'Business Unit',
      region: organization.region ?? '',
      leader: organization.leader ?? '',
      status: organization.status ?? 'active',
      strategic_classification: organization.strategic_classification ?? organization.strategicClassification ?? 'Operational',
      fiscal_responsibility: organization.fiscal_responsibility ?? organization.fiscalResponsibility ?? 'Profit Center',
      investment_authority: organization.investment_authority ?? organization.investmentAuthority ?? 'None',
    })

    setActiveEditorTab('org-details')
    setIsNodeEditorOpen(true)
    setIsRelationshipBuilderOpen(false)
    setModalError('')
    setError('')

    try {
      await loadRelationshipsForNode(organization.id)
    } catch (loadError) {
      setModalError(loadError instanceof Error ? loadError.message : 'Unable to load strategic relationships')
    }
  }

  const closeNodeEditor = () => {
    setIsNodeEditorOpen(false)
    setEditingOrganizationId(null)
    setOrganizationForm(EMPTY_ORGANIZATION_FORM)
    setNodeRelationships([])
    setSelectedRelationshipId(null)
    setRelationshipDetailsForm(EMPTY_RELATIONSHIP_DETAILS_FORM)
    setIsRelationshipBuilderOpen(false)
    setModalError('')
  }

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

  const handleOrganizationSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setModalError('')
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
      setModalError('Organization name is required.')
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
      closeNodeEditor()
    } catch (saveError) {
      setModalError(saveError instanceof Error ? saveError.message : 'Unable to save organization')
    }
  }

  const handleRemoveLeaf = async (organization: OrganizationResponse) => {
    const childCount = childCountById.get(organization.id) ?? 0
    if (childCount > 0) {
      setError('Only leaf nodes can be removed. Remove child nodes first.')
      return
    }

    const confirmed = window.confirm(`Delete leaf "${organization.name}"? This action cannot be undone.`)
    if (!confirmed) {
      return
    }

    try {
      await deleteOrganization(organization.id)
      await refreshOrganizations()
      setStatusMessage(`Deleted ${organization.name}.`)
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete organization')
    }
  }

  const handleSetAsRoot = async (organization: OrganizationResponse) => {
    setError('')
    setStatusMessage('')
    try {
      await setOrganizationRoot(organization.id)
      await refreshOrganizations()
      setStatusMessage(`${organization.name} is now set as the hierarchy root.`)
    } catch (setRootError) {
      setError(setRootError instanceof Error ? setRootError.message : 'Unable to set hierarchy root')
    }
  }

  const handleCollapseAllBranches = () => {
    setCollapsedNodeIds(new Set(branchNodeIds))
  }

  const handleExpandAllBranches = () => {
    setCollapsedNodeIds(new Set())
  }

  const toggleBranch = (organizationId: string) => {
    setCollapsedNodeIds((previous) => {
      const next = new Set(previous)
      if (next.has(organizationId)) {
        next.delete(organizationId)
      } else {
        next.add(organizationId)
      }
      return next
    })
  }

  const handleExportOrganizationStructure = () => {
    const rows = sortOrganizationsByName(organizations).map((organization) => ({
      id: organization.id,
      name: organization.name,
      code: organization.code || '',
      parent_organization_id: organization.parent_organization_id ?? organization.parentOrganizationId ?? '',
      organization_type: organization.organization_type ?? organization.organizationType ?? '',
      status: organization.status,
      region: organization.region ?? '',
      leader: organization.leader ?? '',
      strategic_classification: organization.strategic_classification ?? organization.strategicClassification ?? '',
      fiscal_responsibility: organization.fiscal_responsibility ?? organization.fiscalResponsibility ?? '',
      investment_authority: organization.investment_authority ?? organization.investmentAuthority ?? '',
      is_root: organization.is_root ? 'true' : 'false',
    }))

    const headers = [
      'id',
      'name',
      'code',
      'parent_organization_id',
      'organization_type',
      'status',
      'region',
      'leader',
      'strategic_classification',
      'fiscal_responsibility',
      'investment_authority',
      'is_root',
    ]

    const escapeCell = (value: string): string => {
      if (/[",\n]/.test(value)) {
        return `"${value.replace(/"/g, '""')}"`
      }
      return value
    }

    const csv = [
      headers.join(','),
      ...rows.map((row) => headers.map((header) => escapeCell(String(row[header as keyof typeof row] ?? ''))).join(',')),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `organization-structure-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    setStatusMessage('Organization structure exported.')
  }

  const relatedNodeIds = useMemo(() => {
    const ids = new Set<string>()
    nodeRelationships.forEach((relationship) => {
      ids.add(relationship.source_node_id)
      ids.add(relationship.target_node_id)
    })
    return ids
  }, [nodeRelationships])

  const relationshipTargetCandidates = useMemo(() => {
    if (!editingOrganizationId) {
      return []
    }

    const query = relationshipTargetSearch.trim().toLowerCase()
    return organizations
      .filter((organization) => organization.id !== editingOrganizationId)
      .filter((organization) => !relatedNodeIds.has(organization.id))
      .filter((organization) => normalizeStatus(organization.status) !== 'archived')
      .filter((organization) => relationshipTargetTypeFilter === 'All' || (organization.organization_type ?? organization.organizationType ?? 'Other') === relationshipTargetTypeFilter)
      .filter((organization) => relationshipTargetRegionFilter === 'All' || (organization.region ?? 'Unspecified') === relationshipTargetRegionFilter)
      .filter((organization) => relationshipTargetStatusFilter === 'All' || organization.status === relationshipTargetStatusFilter)
      .filter((organization) => {
        if (!query) {
          return true
        }
        const name = organization.name.toLowerCase()
        const code = (organization.code ?? '').toLowerCase()
        const region = (organization.region ?? '').toLowerCase()
        return name.includes(query) || code.includes(query) || region.includes(query)
      })
  }, [editingOrganizationId, organizations, relatedNodeIds, relationshipTargetSearch, relationshipTargetTypeFilter, relationshipTargetRegionFilter, relationshipTargetStatusFilter])

  const relationshipTypeOptions = useMemo(() => {
    const set = new Set<string>()
    organizations.forEach((organization) => {
      set.add(organization.organization_type ?? organization.organizationType ?? 'Other')
    })
    return ['All', ...Array.from(set).sort()]
  }, [organizations])

  const relationshipRegionOptions = useMemo(() => {
    const set = new Set<string>()
    organizations.forEach((organization) => {
      set.add(organization.region ?? 'Unspecified')
    })
    return ['All', ...Array.from(set).sort()]
  }, [organizations])

  const relationshipStatusOptions = useMemo(() => {
    const set = new Set<string>()
    organizations.forEach((organization) => {
      set.add(organization.status)
    })
    return ['All', ...Array.from(set).sort()]
  }, [organizations])

  const selectedRelationship = useMemo(
    () => nodeRelationships.find((relationship) => relationship.id === selectedRelationshipId) ?? null,
    [nodeRelationships, selectedRelationshipId],
  )

  const handleCreateRelationship = async () => {
    if (!editingOrganizationId || !newRelationshipDraft.target_node_id) {
      return
    }

    try {
      const relationship = await createStrategicRelationship({
        source_node_id: editingOrganizationId,
        target_node_id: newRelationshipDraft.target_node_id,
        relationship_type: newRelationshipDraft.relationship_type,
        participation_role: 'Contributor',
        strategy_role: 'Responds',
        review_cadence: 'Quarterly',
        status: 'Draft',
        notes: '',
      })

      await loadRelationshipsForNode(editingOrganizationId)
      setSelectedRelationshipId(relationship.id)
      setRelationshipDetailsForm({
        relationship_type: relationship.relationship_type,
        participation_role: relationship.participation_role,
        strategy_role: relationship.strategy_role,
        review_cadence: relationship.review_cadence,
        status: relationship.status,
        notes: relationship.notes ?? '',
      })
      setIsRelationshipBuilderOpen(false)
      setNewRelationshipDraft({ target_node_id: '', relationship_type: 'Governance' })
      setStatusMessage('Strategic relationship created.')
    } catch (relationshipError) {
      setModalError(relationshipError instanceof Error ? relationshipError.message : 'Unable to create strategic relationship')
    }
  }

  const handleSelectRelationship = (relationship: StrategicRelationship) => {
    setSelectedRelationshipId(relationship.id)
    setRelationshipDetailsForm({
      relationship_type: relationship.relationship_type,
      participation_role: relationship.participation_role,
      strategy_role: relationship.strategy_role,
      review_cadence: relationship.review_cadence,
      status: relationship.status,
      notes: relationship.notes ?? '',
    })
  }

  const handleSaveRelationship = async () => {
    if (!selectedRelationship || !editingOrganizationId) {
      return
    }

    try {
      await updateStrategicRelationship(selectedRelationship.id, {
        relationship_type: relationshipDetailsForm.relationship_type,
        participation_role: relationshipDetailsForm.participation_role,
        strategy_role: relationshipDetailsForm.strategy_role,
        review_cadence: relationshipDetailsForm.review_cadence,
        status: relationshipDetailsForm.status,
        notes: relationshipDetailsForm.notes,
      })
      await loadRelationshipsForNode(editingOrganizationId)
      setStatusMessage('Strategic relationship saved.')
    } catch (relationshipError) {
      setModalError(relationshipError instanceof Error ? relationshipError.message : 'Unable to save strategic relationship')
    }
  }

  const handleDeleteRelationship = async (relationship: StrategicRelationship) => {
    const confirmed = window.confirm('Delete this strategic relationship?')
    if (!confirmed || !editingOrganizationId) {
      return
    }

    try {
      await deleteStrategicRelationship(relationship.id)
      await loadRelationshipsForNode(editingOrganizationId)
      setStatusMessage('Strategic relationship removed.')
    } catch (deleteError) {
      setModalError(deleteError instanceof Error ? deleteError.message : 'Unable to delete strategic relationship')
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

      <MainMenu breadcrumb="Administration / Hierarchies" />

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        {(statusMessage || (error && !isNodeEditorOpen)) && (
          <section className="surface-panel rounded-[1.5rem] p-5">
            <p className={`text-sm font-semibold ${error ? 'text-rose-700' : 'text-emerald-700'}`}>
              {error || statusMessage}
            </p>
          </section>
        )}

        <section className="surface-panel rounded-[2rem] p-7">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="section-kicker mb-2">Organization Structure</p>
              <h2 className="text-2xl font-semibold text-slate-900">Node Editor setup</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="button-secondary"
                onClick={handleExportOrganizationStructure}
              >
                Export structure
              </button>
              <button
                type="button"
                className="button-secondary"
                onClick={handleExpandAllBranches}
              >
                Expand all
              </button>
              <button
                type="button"
                className="button-secondary"
                onClick={handleCollapseAllBranches}
              >
                Collapse all
              </button>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
                {organizations.length} items
              </span>
              <button
                type="button"
                className="button-primary"
                onClick={() => openCreateModal('')}
              >
                {hasDefinedRoot ? 'Add organization' : 'Add root'}
              </button>
            </div>
          </div>

          <div className="mt-6 max-h-[34rem] overflow-auto rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            {organizationTree.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600">
                No organization items exist yet. Add a root branch to start the tree.
              </p>
            ) : (
              <TreeView
                items={organizationTreeItems}
                collapsedIds={collapsedNodeIds}
                onToggle={toggleBranch}
                renderActions={(item) => {
                  const organization = item.data
                  const childCount = item.children.length
                  const isLeaf = childCount === 0
                  const canSetAsRoot =
                    !organization.parent_organization_id &&
                    !(organization.parentOrganizationId || '').trim() &&
                    definedRootCount === 0 &&
                    singleTopLevelNodeId === organization.id &&
                    !organization.is_root

                  return (
                    <>
                      {canSetAsRoot && (
                        <button
                          type="button"
                          className="button-secondary border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                          onClick={() => void handleSetAsRoot(organization)}
                        >
                          Set as root
                        </button>
                      )}
                      <button
                        type="button"
                        className="button-secondary"
                        onClick={() => openCreateModal(organization.id)}
                      >
                        Add child
                      </button>
                      <button
                        type="button"
                        className="button-secondary"
                        onClick={() => void openEditModal(organization)}
                      >
                        Edit node
                      </button>
                      {isLeaf ? (
                        <button
                          type="button"
                          className="button-secondary text-rose-700 hover:border-rose-200 hover:bg-rose-50"
                          onClick={() => void handleRemoveLeaf(organization)}
                        >
                          Remove leaf
                        </button>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                          {childCount} child nodes
                        </span>
                      )}
                      {organization.is_root && (
                        <span className="rounded-full bg-emerald-100 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">
                          Root
                        </span>
                      )}
                    </>
                  )
                }}
              />
            )}
          </div>
        </section>

        <section className="surface-panel rounded-[2rem] p-7">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="section-kicker mb-2">Import</p>
              <h2 className="text-2xl font-semibold text-slate-900">CSV hierarchy import</h2>
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
              <button
                className="button-secondary"
                type="button"
                onClick={() =>
                  setCsvContent(
                    'name,code,description,organization_type,status,strategic_classification,fiscal_responsibility,investment_authority\nCorporate,CORP,Head office,Corporate,active,Strategic,Enterprise Funded,Own\nIndia BU,INDIA,India business unit,Business Unit,active,Hybrid,Profit Center,Approve',
                  )
                }
              >
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
        </section>
      </main>

      {isNodeEditorOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/35 px-4 py-8 backdrop-blur-sm">
          <div className="surface-panel flex h-[85vh] w-full max-w-6xl flex-col rounded-[2rem] p-7">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="section-kicker mb-2">Node Editor</p>
                <h3 className="text-2xl font-semibold text-slate-900">
                  {editingOrganizationId
                    ? `Edit Organization Node: ${organizationForm.name || 'Unnamed'}`
                    : 'Create Organization Node'}
                </h3>
              </div>
              <button type="button" className="button-secondary" onClick={closeNodeEditor}>Close</button>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                className={[
                  'rounded-full px-4 py-2 text-sm font-semibold transition-colors',
                  activeEditorTab === 'org-details'
                    ? 'bg-[var(--north-atlantic-blue)] text-white'
                    : 'bg-white text-slate-700 border border-slate-300',
                ].join(' ')}
                onClick={() => setActiveEditorTab('org-details')}
              >
                Org Details
              </button>
              <button
                type="button"
                className={[
                  'rounded-full px-4 py-2 text-sm font-semibold transition-colors',
                  activeEditorTab === 'strategic-relationships'
                    ? 'bg-[var(--north-atlantic-blue)] text-white'
                    : 'bg-white text-slate-700 border border-slate-300',
                  !editingOrganizationId ? 'opacity-50 cursor-not-allowed' : '',
                ].join(' ')}
                disabled={!editingOrganizationId}
                onClick={() => setActiveEditorTab('strategic-relationships')}
              >
                Strategic Relationships
              </button>
            </div>

            {modalError && (
              <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
                <p className="text-sm font-semibold text-rose-700">{modalError}</p>
              </div>
            )}

            <div className="mt-6 min-h-0 flex-1 overflow-y-auto pr-1">
              {activeEditorTab === 'org-details' && (
                <div>
                <form className="grid gap-4 lg:grid-cols-2" onSubmit={handleOrganizationSubmit}>
                  <div>
                    <label className="section-kicker mb-2 block" htmlFor="modal-organization-name">Name</label>
                    <input
                      id="modal-organization-name"
                      className="input-field"
                      value={organizationForm.name}
                      onChange={(event) => setOrganizationForm({ ...organizationForm, name: event.target.value })}
                    />
                  </div>

                  <div>
                    <label className="section-kicker mb-2 block" htmlFor="modal-organization-code">Code</label>
                    <input
                      id="modal-organization-code"
                      className="input-field"
                      value={organizationForm.code}
                      onChange={(event) => setOrganizationForm({ ...organizationForm, code: event.target.value })}
                    />
                  </div>

                  <div className="lg:col-span-2">
                    <label className="section-kicker mb-2 block" htmlFor="modal-organization-description">Description</label>
                    <textarea
                      id="modal-organization-description"
                      className="input-field min-h-[90px]"
                      value={organizationForm.description}
                      onChange={(event) => setOrganizationForm({ ...organizationForm, description: event.target.value })}
                    />
                  </div>

                  <div>
                    <label className="section-kicker mb-2 block" htmlFor="modal-organization-parent">Parent Organization</label>
                    <select
                      id="modal-organization-parent"
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
                    <label className="section-kicker mb-2 block" htmlFor="modal-organization-type">Organization Type</label>
                    <select
                      id="modal-organization-type"
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
                    <label className="section-kicker mb-2 block" htmlFor="modal-organization-region">Region</label>
                    <input
                      id="modal-organization-region"
                      className="input-field"
                      value={organizationForm.region}
                      onChange={(event) => setOrganizationForm({ ...organizationForm, region: event.target.value })}
                    />
                  </div>

                  <div>
                    <label className="section-kicker mb-2 block" htmlFor="modal-organization-leader">Leader</label>
                    <input
                      id="modal-organization-leader"
                      className="input-field"
                      value={organizationForm.leader}
                      onChange={(event) => setOrganizationForm({ ...organizationForm, leader: event.target.value })}
                    />
                  </div>

                  <div>
                    <label className="section-kicker mb-2 block" htmlFor="modal-organization-status">Status</label>
                    <select
                      id="modal-organization-status"
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
                    <label className="section-kicker mb-2 block" htmlFor="modal-organization-classification">Strategic Classification</label>
                    <select
                      id="modal-organization-classification"
                      className="input-field"
                      value={organizationForm.strategic_classification}
                      onChange={(event) => setOrganizationForm({ ...organizationForm, strategic_classification: event.target.value })}
                    >
                      {STRATEGIC_CLASSIFICATION_VALUES.map((item) => <option key={item}>{item}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="section-kicker mb-2 block" htmlFor="modal-organization-fiscal">Fiscal Responsibility</label>
                    <select
                      id="modal-organization-fiscal"
                      className="input-field"
                      value={organizationForm.fiscal_responsibility}
                      onChange={(event) => setOrganizationForm({ ...organizationForm, fiscal_responsibility: event.target.value })}
                    >
                      {FISCAL_RESPONSIBILITY_VALUES.map((item) => <option key={item}>{item}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="section-kicker mb-2 block" htmlFor="modal-organization-investment-authority">Investment Authority</label>
                    <select
                      id="modal-organization-investment-authority"
                      className="input-field"
                      value={organizationForm.investment_authority}
                      onChange={(event) => setOrganizationForm({ ...organizationForm, investment_authority: event.target.value })}
                    >
                      {INVESTMENT_AUTHORITY_VALUES.map((item) => <option key={item}>{item}</option>)}
                    </select>
                  </div>

                  <div className="lg:col-span-2 flex flex-wrap gap-3 pt-2">
                    <button className="button-primary" type="submit">
                      {editingOrganizationId ? 'Save node details' : 'Create node'}
                    </button>
                    <button type="button" className="button-secondary" onClick={closeNodeEditor}>
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
              )}

              {activeEditorTab === 'strategic-relationships' && editingOrganizationId && (
                <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
                <section className="rounded-2xl border border-slate-200 bg-white/80 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-600">Strategic Relationships</h4>
                    <button
                      type="button"
                      className="button-secondary"
                      onClick={() => setIsRelationshipBuilderOpen((previous) => !previous)}
                    >
                      + New Relationship
                    </button>
                  </div>

                  {isRelationshipBuilderOpen && (
                    <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="section-kicker mb-2">Step 1</p>
                      <label className="section-kicker mb-2 block" htmlFor="relationship-target-search">Search organizations...</label>
                      <input
                        id="relationship-target-search"
                        className="input-field"
                        value={relationshipTargetSearch}
                        onChange={(event) => setRelationshipTargetSearch(event.target.value)}
                      />

                      <div className="mt-3 grid gap-2 sm:grid-cols-3">
                        <select className="input-field" value={relationshipTargetTypeFilter} onChange={(event) => setRelationshipTargetTypeFilter(event.target.value)}>
                          {relationshipTypeOptions.map((item) => <option key={item}>{item}</option>)}
                        </select>
                        <select className="input-field" value={relationshipTargetRegionFilter} onChange={(event) => setRelationshipTargetRegionFilter(event.target.value)}>
                          {relationshipRegionOptions.map((item) => <option key={item}>{item}</option>)}
                        </select>
                        <select className="input-field" value={relationshipTargetStatusFilter} onChange={(event) => setRelationshipTargetStatusFilter(event.target.value)}>
                          {relationshipStatusOptions.map((item) => <option key={item}>{item}</option>)}
                        </select>
                      </div>

                      <div className="mt-3 max-h-44 overflow-auto space-y-1 rounded-xl border border-slate-200 bg-white p-2">
                        {relationshipTargetCandidates.length === 0 ? (
                          <p className="px-2 py-2 text-sm text-slate-500">No available target nodes for current filters.</p>
                        ) : (
                          relationshipTargetCandidates.map((organization) => (
                            <button
                              key={organization.id}
                              type="button"
                              className={[
                                'w-full rounded-lg px-3 py-2 text-left text-sm transition-colors',
                                newRelationshipDraft.target_node_id === organization.id
                                  ? 'bg-[var(--horizon-teal)] text-white'
                                  : 'hover:bg-slate-100 text-slate-700',
                              ].join(' ')}
                              onClick={() => setNewRelationshipDraft((previous) => ({ ...previous, target_node_id: organization.id }))}
                            >
                              {organization.name} ({organization.code || organization.id})
                            </button>
                          ))
                        )}
                      </div>

                      <p className="section-kicker mb-2 mt-4">Step 2</p>
                      <label className="section-kicker mb-2 block" htmlFor="relationship-type">Relationship Type</label>
                      <select
                        id="relationship-type"
                        className="input-field"
                        value={newRelationshipDraft.relationship_type}
                        onChange={(event) => setNewRelationshipDraft((previous) => ({ ...previous, relationship_type: event.target.value }))}
                      >
                        {RELATIONSHIP_TYPES.map((item) => <option key={item}>{item}</option>)}
                      </select>

                      <div className="mt-4 flex gap-2">
                        <button
                          type="button"
                          className="button-primary"
                          disabled={!newRelationshipDraft.target_node_id}
                          onClick={() => void handleCreateRelationship()}
                        >
                          Step 3: Create Relationship
                        </button>
                        <button type="button" className="button-secondary" onClick={() => setIsRelationshipBuilderOpen(false)}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 max-h-[26rem] overflow-auto rounded-2xl border border-slate-200 bg-white">
                    <div className="grid grid-cols-[1.3fr_0.8fr_0.6fr] border-b border-slate-200 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      <span>Relationship Name</span>
                      <span>Type</span>
                      <span>Status</span>
                    </div>
                    {nodeRelationships.length === 0 ? (
                      <p className="px-3 py-4 text-sm text-slate-500">No strategic relationships for this node.</p>
                    ) : (
                      nodeRelationships.map((relationship) => {
                        const relationshipName = `${getOrganizationDisplayName(relationship.source_node_id)} ${getRelationshipArrow(relationship.relationship_type)} ${getOrganizationDisplayName(relationship.target_node_id)}`
                        return (
                          <button
                            key={relationship.id}
                            type="button"
                            className={[
                              'grid w-full grid-cols-[1.3fr_0.8fr_0.6fr] px-3 py-3 text-left text-sm transition-colors border-b border-slate-100',
                              selectedRelationshipId === relationship.id
                                ? 'bg-[rgba(0,166,166,0.12)]'
                                : 'hover:bg-slate-50',
                            ].join(' ')}
                            onClick={() => handleSelectRelationship(relationship)}
                          >
                            <span className="pr-2 font-semibold text-slate-800">{relationshipName}</span>
                            <span className="text-slate-600">{relationship.relationship_type}</span>
                            <span className="text-slate-600">{relationship.status}</span>
                          </button>
                        )
                      })
                    )}
                  </div>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white/80 p-4">
                  <h4 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-600">Relationship Details</h4>

                  {!selectedRelationship ? (
                    <p className="mt-4 text-sm text-slate-500">Select a relationship to view and edit participation details.</p>
                  ) : (
                    <div className="mt-4 space-y-4">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label className="section-kicker mb-2 block">Relationship Name</label>
                          <input
                            className="input-field"
                            value={`${getOrganizationDisplayName(selectedRelationship.source_node_id)} ${getRelationshipArrow(selectedRelationship.relationship_type)} ${getOrganizationDisplayName(selectedRelationship.target_node_id)}`}
                            readOnly
                          />
                        </div>
                        <div>
                          <label className="section-kicker mb-2 block">Relationship Type</label>
                          <select
                            className="input-field"
                            value={relationshipDetailsForm.relationship_type}
                            onChange={(event) => setRelationshipDetailsForm((previous) => ({ ...previous, relationship_type: event.target.value }))}
                          >
                            {RELATIONSHIP_TYPES.map((item) => <option key={item}>{item}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="section-kicker mb-2 block">Source Node</label>
                          <input className="input-field" value={getOrganizationDisplayName(selectedRelationship.source_node_id)} readOnly />
                        </div>
                        <div>
                          <label className="section-kicker mb-2 block">Target Node</label>
                          <input className="input-field" value={getOrganizationDisplayName(selectedRelationship.target_node_id)} readOnly />
                        </div>
                        <div>
                          <label className="section-kicker mb-2 block">Status</label>
                          <select
                            className="input-field"
                            value={relationshipDetailsForm.status}
                            onChange={(event) => setRelationshipDetailsForm((previous) => ({ ...previous, status: event.target.value }))}
                          >
                            {RELATIONSHIP_STATUSES.map((item) => <option key={item}>{item}</option>)}
                          </select>
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label className="section-kicker mb-2 block">Participation Role</label>
                          <select className="input-field" value={relationshipDetailsForm.participation_role} onChange={(event) => setRelationshipDetailsForm((previous) => ({ ...previous, participation_role: event.target.value }))}>
                            {PARTICIPATION_ROLE_VALUES.map((item) => <option key={item}>{item}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="section-kicker mb-2 block">Strategy Role</label>
                          <select className="input-field" value={relationshipDetailsForm.strategy_role} onChange={(event) => setRelationshipDetailsForm((previous) => ({ ...previous, strategy_role: event.target.value }))}>
                            {STRATEGY_ROLE_VALUES.map((item) => <option key={item}>{item}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="section-kicker mb-2 block">Review Cadence</label>
                          <select className="input-field" value={relationshipDetailsForm.review_cadence} onChange={(event) => setRelationshipDetailsForm((previous) => ({ ...previous, review_cadence: event.target.value }))}>
                            {REVIEW_CADENCE_VALUES.map((item) => <option key={item}>{item}</option>)}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="section-kicker mb-2 block">Notes</label>
                        <textarea
                          className="input-field min-h-[120px]"
                          value={relationshipDetailsForm.notes}
                          onChange={(event) => setRelationshipDetailsForm((previous) => ({ ...previous, notes: event.target.value }))}
                        />
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button type="button" className="button-primary" onClick={() => void handleSaveRelationship()}>
                          Save relationship
                        </button>
                        <button type="button" className="button-secondary text-rose-700 hover:border-rose-200 hover:bg-rose-50" onClick={() => void handleDeleteRelationship(selectedRelationship)}>
                          Remove relationship
                        </button>
                      </div>
                    </div>
                  )}
                </section>
              </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
