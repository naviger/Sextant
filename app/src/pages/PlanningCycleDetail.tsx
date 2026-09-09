import React, { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { LoginButton } from '../components/LoginButton'
import { MainMenu } from '../components/MainMenu'
import {
  addPlanningCycleParticipant,
  attachAgreementToInitiative,
  attachCapabilityToInitiative,
  attachCapabilityToChoice,
  archiveDriver,
  createCapability,
  createInitiativeForChoice,
  createMetricForOutcome,
  createOutcomeForInitiative,
  createStrategicTheme,
  createStrategicAgreement,
  detachCapabilityFromChoice,
  archiveStrategicChoice,
  archiveStrategicObjective,
  archiveStrategicQuestion,
  attachDriverToStrategicQuestion,
  createDriver,
  createStrategicChoice,
  createStrategicObjective,
  createStrategicQuestion,
  detachDriverFromStrategicQuestion,
  getDrivers,
  getCapabilities,
  getCapabilitiesForChoice,
  getInitiativeDetail,
  getInitiativesForChoice,
  getOutcomeDetail,
  getOutcomesForInitiative,
  getOrganizations,
  getPlanningCycle,
  getPlanningCycleParticipants,
  getStrategyReview,
  getStrategyReviews,
  getStrategicThemes,
  getStrategicChoicesForObjective,
  getStrategicAgreementsForChoice,
  getStrategicObjectives,
  getStrategicQuestionDrivers,
  getStrategicQuestions,
  getStrategicGroups,
  removePlanningCycleParticipant,
  archiveStrategicTheme,
  createStrategyReview,
  updateStrategyReview,
  updateStrategicAgreement,
  updateStrategicChoice,
  updateStrategicObjective,
  updateStrategicQuestion,
  updateDriver,
  updateInitiativeForChoice,
  updateMetricForOutcome,
  updateOutcomeForInitiative,
  updatePlanningCycle,
  updateStrategicTheme,
} from '../services/api'
import {
  Driver,
  OrganizationResponse,
  PlanningCycle,
  PlanningCycleParticipant,
  StrategicGroup,
  Capability,
  CapabilityCreate,
  Initiative,
  InitiativeCreate,
  InitiativeDetail,
  MetricDetail,
  MetricCreate,
  Outcome,
  OutcomeCreate,
  StrategyReview,
  StrategyReviewDetail,
  StrategyReviewCreate,
  StrategicTheme,
  StrategicThemeCreate,
  StrategicAgreement,
  StrategicAgreementCreate,
  StrategicChoice,
  StrategicChoiceCreate,
  StrategicObjective,
  StrategicObjectiveCreate,
  StrategicQuestion,
  StrategicQuestionDriverLink,
} from '../types'

type CycleTab = 'overview' | 'participants' | 'themes' | 'drivers' | 'strategic_questions' | 'objectives' | 'reviews' | 'timeline'
type ChoiceDetailTab = 'details' | 'initiatives' | 'agreements'

const CYCLE_STATUS_OPTIONS = [
  'Draft',
  'Planning',
  'Negotiation',
  'Approved',
  'Executing',
  'Completed',
  'Archived',
]

const EMPTY_FORM = {
  name: '',
  description: '',
  owner_organization_id: '',
  status: 'Draft',
  start_date: '',
  end_date: '',
}

const DRIVER_CATEGORY_OPTIONS = [
  'Market',
  'Customer',
  'Technology',
  'Financial',
  'Workforce',
  'Regulatory',
  'Environmental',
  'Supply Chain',
  'Competitive',
  'Other',
]

const DRIVER_IMPACT_OPTIONS = ['Low', 'Medium', 'High', 'Critical']
const DRIVER_HORIZON_OPTIONS = ['Immediate', '1-3 Years', '3-5 Years', '5+ Years']
const DRIVER_STATUS_OPTIONS = ['Draft', 'Active', 'Archived']
const THEME_STATUS_OPTIONS = ['Draft', 'Active', 'Archived']
const QUESTION_PRIORITY_OPTIONS = ['Low', 'Medium', 'High', 'Critical']
const QUESTION_STATUS_OPTIONS = ['Draft', 'Active', 'Answered', 'Archived']
const OBJECTIVE_TYPE_OPTIONS = [
  'Growth',
  'Operational Excellence',
  'Customer',
  'Financial',
  'Workforce',
  'Technology',
  'Sustainability',
  'Risk',
  'Regulatory',
]
const OBJECTIVE_PRIORITY_OPTIONS = ['Low', 'Medium', 'High', 'Critical']
const OBJECTIVE_STATUS_OPTIONS = ['Draft', 'Proposed', 'Approved', 'Active', 'Completed', 'Archived']
const CHOICE_TYPE_OPTIONS = [
  'Investment',
  'Operating Model',
  'Capability',
  'Market',
  'Product',
  'Technology',
  'People',
  'Partnership',
  'Acquisition',
  'Other',
]
const CHOICE_STATUS_OPTIONS = ['Draft', 'Under Evaluation', 'Recommended', 'Approved', 'Rejected', 'Archived']
const CHOICE_RECOMMENDATION_OPTIONS = ['No Recommendation', 'Recommended', 'Not Recommended']
const AGREEMENT_STATUS_OPTIONS = ['Draft', 'Proposed', 'Negotiating', 'Approved', 'Active', 'Completed', 'Cancelled']
const INITIATIVE_STATUS_OPTIONS = ['Proposed', 'Planned', 'In Progress', 'On Hold', 'Completed', 'Cancelled']
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
const REVIEW_STATUS_OPTIONS = ['Draft', 'In Progress', 'Completed', 'Archived']

const EMPTY_DRIVER_FORM = {
  title: '',
  description: '',
  category: 'Other',
  impact_level: 'Medium',
  time_horizon: '1-3 Years',
  status: 'Draft',
  strategic_theme_id: '',
  owner_organization_id: '',
}

const EMPTY_THEME_FORM: StrategicThemeCreate = {
  planning_cycle_id: '',
  name: '',
  description: '',
  status: 'Draft',
}

const EMPTY_QUESTION_FORM = {
  title: '',
  description: '',
  priority: 'Medium',
  status: 'Draft',
  strategic_theme_id: '',
  lead_organization_id: '',
}

const EMPTY_OBJECTIVE_FORM: StrategicObjectiveCreate = {
  planning_cycle_id: '',
  strategic_question_id: '',
  title: '',
  description: '',
  objective_type: 'Operational Excellence',
  priority: 'Medium',
  status: 'Draft',
  strategic_theme_id: '',
  owner_organization_id: '',
  target_date: '',
}

const EMPTY_CHOICE_FORM: StrategicChoiceCreate = {
  planning_cycle_id: '',
  strategic_objective_id: '',
  title: '',
  description: '',
  choice_type: 'Other',
  status: 'Draft',
  recommendation: 'No Recommendation',
  strategic_theme_id: '',
  owner_organization_id: '',
}

const EMPTY_AGREEMENT_FORM: StrategicAgreementCreate = {
  planning_cycle_id: '',
  strategic_choice_id: '',
  title: '',
  description: '',
  status: 'Draft',
  effective_date: '',
  owner_organization_id: '',
}

const EMPTY_CAPABILITY_FORM: CapabilityCreate = {
  name: '',
  description: '',
  category: 'Other',
  status: 'Draft',
  owner_organization_id: '',
}

const EMPTY_INITIATIVE_FORM: InitiativeCreate = {
  planning_cycle_id: '',
  name: '',
  description: '',
  status: 'Proposed',
  owner_organization_id: '',
  start_date: '',
  end_date: '',
  budget: undefined,
}

const EMPTY_OUTCOME_FORM: OutcomeCreate = {
  planning_cycle_id: '',
  strategic_objective_id: '',
  initiative_id: '',
  name: '',
  description: '',
}

const EMPTY_METRIC_FORM = {
  name: '',
  description: '',
  unit: '',
  target_value: '',
  target_unit: '',
  target_date: '',
  target_notes: '',
  actual_value: '',
  actual_unit: '',
  measured_at: '',
  actual_notes: '',
}

const EMPTY_REVIEW_FORM: StrategyReviewCreate = {
  planning_cycle_id: '',
  date: '',
  status: 'Draft',
  recommendations: '',
  summary: '',
}

export const PlanningCycleDetail: React.FC = () => {
  const { cycleId } = useParams<{ cycleId: string }>()
  const [activeTab, setActiveTab] = useState<CycleTab>('overview')
  const [cycle, setCycle] = useState<PlanningCycle | null>(null)
  const [cycleForm, setCycleForm] = useState(EMPTY_FORM)
  const [organizations, setOrganizations] = useState<OrganizationResponse[]>([])
  const [strategicGroups, setStrategicGroups] = useState<StrategicGroup[]>([])
  const [participants, setParticipants] = useState<PlanningCycleParticipant[]>([])
  const [strategicThemes, setStrategicThemes] = useState<StrategicTheme[]>([])
  const [selectedThemeId, setSelectedThemeId] = useState('')
  const [themeForm, setThemeForm] = useState<StrategicThemeCreate>(EMPTY_THEME_FORM)
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [selectedDriverId, setSelectedDriverId] = useState('')
  const [driverForm, setDriverForm] = useState(EMPTY_DRIVER_FORM)
  const [strategicQuestions, setStrategicQuestions] = useState<StrategicQuestion[]>([])
  const [selectedQuestionId, setSelectedQuestionId] = useState('')
  const [questionForm, setQuestionForm] = useState(EMPTY_QUESTION_FORM)
  const [linkedDrivers, setLinkedDrivers] = useState<StrategicQuestionDriverLink[]>([])
  const [driverToLinkId, setDriverToLinkId] = useState('')
  const [objectives, setObjectives] = useState<StrategicObjective[]>([])
  const [selectedObjectiveId, setSelectedObjectiveId] = useState('')
  const [objectiveForm, setObjectiveForm] = useState<StrategicObjectiveCreate>(EMPTY_OBJECTIVE_FORM)
  const [choicesByObjective, setChoicesByObjective] = useState<Record<string, StrategicChoice[]>>({})
  const [selectedChoiceId, setSelectedChoiceId] = useState('')
  const [choiceForm, setChoiceForm] = useState<StrategicChoiceCreate>(EMPTY_CHOICE_FORM)
  const [agreementsByChoice, setAgreementsByChoice] = useState<Record<string, StrategicAgreement[]>>({})
  const [initiativesByChoice, setInitiativesByChoice] = useState<Record<string, Initiative[]>>({})
  const [initiativeDetailsById, setInitiativeDetailsById] = useState<Record<string, InitiativeDetail>>({})
  const [selectedInitiativeId, setSelectedInitiativeId] = useState('')
  const [initiativeForm, setInitiativeForm] = useState<InitiativeCreate>(EMPTY_INITIATIVE_FORM)
  const [initiativeCapabilityToLinkId, setInitiativeCapabilityToLinkId] = useState('')
  const [initiativeAgreementToLinkId, setInitiativeAgreementToLinkId] = useState('')
  const [outcomesByInitiative, setOutcomesByInitiative] = useState<Record<string, Outcome[]>>({})
  const [outcomeDetailsById, setOutcomeDetailsById] = useState<Record<string, Outcome & { linked_metrics: MetricDetail[] }>>({})
  const [selectedOutcomeId, setSelectedOutcomeId] = useState('')
  const [selectedMetricId, setSelectedMetricId] = useState('')
  const [outcomeForm, setOutcomeForm] = useState<OutcomeCreate>(EMPTY_OUTCOME_FORM)
  const [metricForm, setMetricForm] = useState(EMPTY_METRIC_FORM)
  const [strategyReviews, setStrategyReviews] = useState<StrategyReview[]>([])
  const [selectedReviewId, setSelectedReviewId] = useState('')
  const [selectedReviewDetail, setSelectedReviewDetail] = useState<StrategyReviewDetail | null>(null)
  const [reviewForm, setReviewForm] = useState<StrategyReviewCreate>(EMPTY_REVIEW_FORM)
  const [capabilitiesCatalog, setCapabilitiesCatalog] = useState<Capability[]>([])
  const [capabilitiesByChoice, setCapabilitiesByChoice] = useState<Record<string, Capability[]>>({})
  const [capabilityToLinkId, setCapabilityToLinkId] = useState('')
  const [newCapabilityForm, setNewCapabilityForm] = useState<CapabilityCreate>(EMPTY_CAPABILITY_FORM)
  const [selectedAgreementId, setSelectedAgreementId] = useState('')
  const [agreementForm, setAgreementForm] = useState<StrategicAgreementCreate>(EMPTY_AGREEMENT_FORM)
  const [choiceDetailTab, setChoiceDetailTab] = useState<ChoiceDetailTab>('details')
  const [participantTypeToAdd, setParticipantTypeToAdd] = useState<'organization' | 'strategic_group'>('organization')
  const [participantIdToAdd, setParticipantIdToAdd] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [error, setError] = useState('')

  const toInputDate = (value?: string | null): string => {
    if (!value) {
      return ''
    }
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) {
      return value.slice(0, 10)
    }
    return parsed.toISOString().slice(0, 10)
  }

  const toIsoDate = (value: string): string | undefined => {
    if (!value) {
      return undefined
    }
    return `${value}T00:00:00Z`
  }

  const refreshCycle = async () => {
    if (!cycleId) {
      return
    }
    const data = await getPlanningCycle(cycleId)
    setCycle(data)
    setCycleForm({
      name: data.name,
      description: data.description || '',
      owner_organization_id: data.owner_organization_id,
      status: data.status,
      start_date: toInputDate(data.start_date),
      end_date: toInputDate(data.end_date),
    })
  }

  const refreshParticipants = async () => {
    if (!cycleId) {
      return
    }
    const data = await getPlanningCycleParticipants(cycleId)
    setParticipants(data)
  }

  const refreshStrategicThemes = async () => {
    if (!cycleId) {
      return
    }
    const data = await getStrategicThemes(cycleId)
    setStrategicThemes(data)
  }

  const refreshDrivers = async () => {
    if (!cycleId) {
      return
    }
    const data = await getDrivers(cycleId)
    setDrivers(data)
  }

  const refreshStrategicQuestions = async () => {
    if (!cycleId) {
      return
    }
    const data = await getStrategicQuestions(cycleId)
    setStrategicQuestions(data)
  }

  const refreshObjectives = async () => {
    if (!cycleId) {
      return
    }
    const data = await getStrategicObjectives(cycleId)
    setObjectives(data)
  }

  const refreshChoicesForObjective = async (objectiveId: string) => {
    if (!cycleId || !objectiveId) {
      return
    }
    const data = await getStrategicChoicesForObjective(cycleId, objectiveId)
    setChoicesByObjective((current) => ({
      ...current,
      [objectiveId]: data,
    }))
  }

  const refreshAgreementsForChoice = async (objectiveId: string, choiceId: string) => {
    if (!cycleId || !objectiveId || !choiceId) {
      return
    }
    const data = await getStrategicAgreementsForChoice(cycleId, objectiveId, choiceId)
    setAgreementsByChoice((current) => ({
      ...current,
      [choiceId]: data,
    }))
  }

  const refreshInitiativesForChoice = async (objectiveId: string, choiceId: string) => {
    if (!cycleId || !objectiveId || !choiceId) {
      return
    }
    const data = await getInitiativesForChoice(cycleId, objectiveId, choiceId)
    setInitiativesByChoice((current) => ({
      ...current,
      [choiceId]: data,
    }))
  }

  const refreshInitiativeDetail = async (objectiveId: string, choiceId: string, initiativeId: string) => {
    if (!cycleId || !objectiveId || !choiceId || !initiativeId) {
      return
    }
    const data = await getInitiativeDetail(cycleId, objectiveId, choiceId, initiativeId)
    setInitiativeDetailsById((current) => ({
      ...current,
      [initiativeId]: data,
    }))
  }

  const refreshOutcomesForInitiative = async (objectiveId: string, initiativeId: string) => {
    if (!cycleId || !objectiveId || !initiativeId) {
      return
    }
    const data = await getOutcomesForInitiative(cycleId, objectiveId, initiativeId)
    setOutcomesByInitiative((current) => ({
      ...current,
      [initiativeId]: data,
    }))
  }

  const refreshOutcomeDetail = async (objectiveId: string, initiativeId: string, outcomeId: string) => {
    if (!cycleId || !objectiveId || !initiativeId || !outcomeId) {
      return
    }
    const data = await getOutcomeDetail(cycleId, objectiveId, initiativeId, outcomeId)
    setOutcomeDetailsById((current) => ({
      ...current,
      [outcomeId]: data,
    }))
  }

  const refreshCapabilitiesForChoice = async (objectiveId: string, choiceId: string) => {
    if (!cycleId || !objectiveId || !choiceId) {
      return
    }
    const data = await getCapabilitiesForChoice(cycleId, objectiveId, choiceId)
    setCapabilitiesByChoice((current) => ({
      ...current,
      [choiceId]: data,
    }))
  }

  const refreshStrategyReviews = async () => {
    if (!cycleId) {
      return
    }
    const data = await getStrategyReviews(cycleId)
    setStrategyReviews(data)
  }

  const refreshStrategyReviewDetail = async (reviewId: string) => {
    if (!cycleId || !reviewId) {
      return
    }
    const data = await getStrategyReview(cycleId, reviewId)
    setSelectedReviewDetail(data)
  }

  useEffect(() => {
    const load = async () => {
      if (!cycleId) {
        return
      }

      try {
        const [cycleData, orgs, groups, participantData, themesData, driversData, questionsData, objectivesData, capabilityData, reviewData] = await Promise.all([
          getPlanningCycle(cycleId),
          getOrganizations(),
          getStrategicGroups(),
          getPlanningCycleParticipants(cycleId),
          getStrategicThemes(cycleId),
          getDrivers(cycleId),
          getStrategicQuestions(cycleId),
          getStrategicObjectives(cycleId),
          getCapabilities(),
          getStrategyReviews(cycleId),
        ])
        setCycle(cycleData)
        setCycleForm({
          name: cycleData.name,
          description: cycleData.description || '',
          owner_organization_id: cycleData.owner_organization_id,
          status: cycleData.status,
          start_date: toInputDate(cycleData.start_date),
          end_date: toInputDate(cycleData.end_date),
        })
        setOrganizations(orgs)
        setStrategicGroups(groups)
        setParticipants(participantData)
        setStrategicThemes(themesData)
        setDrivers(driversData)
        setStrategicQuestions(questionsData)
        setObjectives(objectivesData)
        setCapabilitiesCatalog(capabilityData.filter((capability) => capability.status !== 'Retired'))
        setStrategyReviews(reviewData)
        setReviewForm((current) => ({
          ...current,
          planning_cycle_id: cycleId,
        }))
        setThemeForm((current) => ({
          ...current,
          planning_cycle_id: cycleId,
        }))
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load planning cycle details')
      }
    }

    void load()
  }, [cycleId])

  const existingParticipantKeys = useMemo(
    () => new Set(participants.map((participant) => `${participant.participant_type}::${participant.participant_id}`)),
    [participants],
  )

  const selectableOrganizations = useMemo(
    () => organizations.filter((organization) => !existingParticipantKeys.has(`organization::${organization.id}`)),
    [existingParticipantKeys, organizations],
  )

  const selectableStrategicGroups = useMemo(
    () => strategicGroups.filter((group) => !existingParticipantKeys.has(`strategic_group::${group.id}`)),
    [existingParticipantKeys, strategicGroups],
  )

  const participantOptions = participantTypeToAdd === 'organization' ? selectableOrganizations : selectableStrategicGroups

  const groupedDrivers = useMemo(() => {
    const groups: Record<string, Driver[]> = {}
    for (const driver of drivers) {
      if (!groups[driver.category]) {
        groups[driver.category] = []
      }
      groups[driver.category].push(driver)
    }
    return groups
  }, [drivers])

  const groupedStrategyByTheme = useMemo(() => {
    const groups = strategicThemes.map((theme) => ({
      theme,
      drivers: drivers.filter((driver) => driver.strategic_theme_id === theme.id),
      questions: strategicQuestions.filter((question) => question.strategic_theme_id === theme.id),
      objectives: objectives.filter((objective) => objective.strategic_theme_id === theme.id),
      choices: Object.values(choicesByObjective).flat().filter((choice) => choice.strategic_theme_id === theme.id),
    }))

    const unassigned = {
      drivers: drivers.filter((driver) => !driver.strategic_theme_id),
      questions: strategicQuestions.filter((question) => !question.strategic_theme_id),
      objectives: objectives.filter((objective) => !objective.strategic_theme_id),
      choices: Object.values(choicesByObjective).flat().filter((choice) => !choice.strategic_theme_id),
    }

    return { groups, unassigned }
  }, [strategicThemes, drivers, strategicQuestions, objectives, choicesByObjective])

  const linkedDriverIds = useMemo(
    () => new Set(linkedDrivers.map((link) => link.driver_id)),
    [linkedDrivers],
  )

  const availableDriversToLink = useMemo(
    () => drivers.filter((driver) => !linkedDriverIds.has(driver.id)),
    [drivers, linkedDriverIds],
  )

  const objectivesByQuestion = useMemo(() => {
    const grouped: Record<string, StrategicObjective[]> = {}
    for (const objective of objectives) {
      if (!grouped[objective.strategic_question_id]) {
        grouped[objective.strategic_question_id] = []
      }
      grouped[objective.strategic_question_id].push(objective)
    }
    return grouped
  }, [objectives])

  const selectedObjectiveChoices = useMemo(
    () => (selectedObjectiveId ? (choicesByObjective[selectedObjectiveId] || []) : []),
    [choicesByObjective, selectedObjectiveId],
  )

  const selectedObjective = useMemo(
    () => objectives.find((objective) => objective.id === selectedObjectiveId) || null,
    [objectives, selectedObjectiveId],
  )

  const selectedObjectiveQuestion = useMemo(
    () => strategicQuestions.find((question) => question.id === selectedObjective?.strategic_question_id) || null,
    [strategicQuestions, selectedObjective?.strategic_question_id],
  )

  const selectedChoice = useMemo(
    () => selectedObjectiveChoices.find((choice) => choice.id === selectedChoiceId) || null,
    [selectedObjectiveChoices, selectedChoiceId],
  )

  const selectedChoiceAgreements = useMemo(
    () => (selectedChoiceId ? (agreementsByChoice[selectedChoiceId] || []) : []),
    [agreementsByChoice, selectedChoiceId],
  )

  const selectedChoiceCapabilities = useMemo(
    () => (selectedChoiceId ? (capabilitiesByChoice[selectedChoiceId] || []) : []),
    [capabilitiesByChoice, selectedChoiceId],
  )

  const availableCapabilitiesToLink = useMemo(() => {
    const linkedIds = new Set(selectedChoiceCapabilities.map((capability) => capability.id))
    return capabilitiesCatalog.filter((capability) => !linkedIds.has(capability.id))
  }, [capabilitiesCatalog, selectedChoiceCapabilities])

  const selectedChoiceInitiatives = useMemo(
    () => (selectedChoiceId ? (initiativesByChoice[selectedChoiceId] || []) : []),
    [initiativesByChoice, selectedChoiceId],
  )

  const selectedInitiative = useMemo(
    () => selectedChoiceInitiatives.find((initiative) => initiative.id === selectedInitiativeId) || null,
    [selectedChoiceInitiatives, selectedInitiativeId],
  )

  const selectedInitiativeDetail = useMemo(
    () => (selectedInitiativeId ? (initiativeDetailsById[selectedInitiativeId] || null) : null),
    [initiativeDetailsById, selectedInitiativeId],
  )

  const selectedInitiativeOutcomes = useMemo(
    () => (selectedInitiativeId ? (outcomesByInitiative[selectedInitiativeId] || []) : []),
    [outcomesByInitiative, selectedInitiativeId],
  )

  const selectedOutcome = useMemo(
    () => selectedInitiativeOutcomes.find((outcome) => outcome.id === selectedOutcomeId) || null,
    [selectedInitiativeOutcomes, selectedOutcomeId],
  )

  const selectedOutcomeDetail = useMemo(
    () => (selectedOutcomeId ? (outcomeDetailsById[selectedOutcomeId] || null) : null),
    [outcomeDetailsById, selectedOutcomeId],
  )

  const selectedOutcomeMetrics = useMemo(
    () => selectedOutcomeDetail?.linked_metrics || [],
    [selectedOutcomeDetail],
  )

  const availableInitiativeCapabilitiesToLink = useMemo(() => {
    const linkedIds = new Set((selectedInitiativeDetail?.linked_capabilities || []).map((item) => item.capability_id))
    return selectedChoiceCapabilities.filter((capability) => !linkedIds.has(capability.id))
  }, [selectedChoiceCapabilities, selectedInitiativeDetail])

  const availableInitiativeAgreementsToLink = useMemo(() => {
    const linkedIds = new Set((selectedInitiativeDetail?.linked_agreements || []).map((item) => item.strategic_agreement_id))
    return selectedChoiceAgreements.filter((agreement) => !linkedIds.has(agreement.id))
  }, [selectedChoiceAgreements, selectedInitiativeDetail])

  const handleSaveOverview = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!cycleId) {
      return
    }

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
      await updatePlanningCycle(cycleId, {
        name: cycleForm.name.trim(),
        description: cycleForm.description.trim() || undefined,
        owner_organization_id: cycleForm.owner_organization_id,
        status: cycleForm.status,
        start_date: toIsoDate(cycleForm.start_date),
        end_date: toIsoDate(cycleForm.end_date),
      })
      setStatusMessage('Planning cycle updated.')
      await refreshCycle()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to update planning cycle')
    }
  }

  const handleAddParticipant = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!cycleId || !participantIdToAdd) {
      return
    }

    setError('')
    setStatusMessage('')

    try {
      await addPlanningCycleParticipant(cycleId, participantTypeToAdd, participantIdToAdd)
      setStatusMessage('Participant added.')
      setParticipantIdToAdd('')
      await refreshParticipants()
    } catch (addError) {
      setError(addError instanceof Error ? addError.message : 'Unable to add participant')
    }
  }

  const handleRemoveParticipant = async (participant: PlanningCycleParticipant) => {
    if (!cycleId) {
      return
    }

    setError('')
    setStatusMessage('')

    try {
      await removePlanningCycleParticipant(cycleId, participant.participant_type as 'organization' | 'strategic_group', participant.participant_id)
      setStatusMessage('Participant removed.')
      await refreshParticipants()
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : 'Unable to remove participant')
    }
  }

  const resetThemeForm = () => {
    setSelectedThemeId('')
    setThemeForm({
      ...EMPTY_THEME_FORM,
      planning_cycle_id: cycleId || '',
    })
  }

  const handleEditTheme = (theme: StrategicTheme) => {
    setSelectedThemeId(theme.id)
    setThemeForm({
      planning_cycle_id: cycleId || '',
      name: theme.name,
      description: theme.description || '',
      status: theme.status,
    })
    setActiveTab('themes')
  }

  const handleSaveTheme = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!cycleId) {
      return
    }

    setError('')
    setStatusMessage('')
    if (!themeForm.name.trim()) {
      setError('Theme name is required.')
      return
    }

    try {
      if (selectedThemeId) {
        await updateStrategicTheme(cycleId, selectedThemeId, {
          planning_cycle_id: cycleId,
          name: themeForm.name.trim(),
          description: themeForm.description?.trim() || undefined,
          status: themeForm.status,
        })
        setStatusMessage('Strategic theme updated.')
      } else {
        await createStrategicTheme(cycleId, {
          planning_cycle_id: cycleId,
          name: themeForm.name.trim(),
          description: themeForm.description?.trim() || undefined,
          status: themeForm.status,
        })
        setStatusMessage('Strategic theme created.')
      }
      await refreshStrategicThemes()
      resetThemeForm()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save strategic theme')
    }
  }

  const handleArchiveTheme = async (themeId: string) => {
    if (!cycleId) {
      return
    }

    setError('')
    setStatusMessage('')
    try {
      await archiveStrategicTheme(cycleId, themeId)
      setStatusMessage('Strategic theme archived.')
      await refreshStrategicThemes()
      if (selectedThemeId === themeId) {
        resetThemeForm()
      }
    } catch (archiveError) {
      setError(archiveError instanceof Error ? archiveError.message : 'Unable to archive strategic theme')
    }
  }

  const resetDriverForm = () => {
    setSelectedDriverId('')
    setDriverForm({
      ...EMPTY_DRIVER_FORM,
      owner_organization_id: cycle?.owner_organization_id || '',
    })
  }

  const handleEditDriver = (driver: Driver) => {
    setSelectedDriverId(driver.id)
    setDriverForm({
      title: driver.title,
      description: driver.description || '',
      category: driver.category,
      impact_level: driver.impact_level,
      time_horizon: driver.time_horizon,
      status: driver.status,
      strategic_theme_id: driver.strategic_theme_id || '',
      owner_organization_id: driver.owner_organization_id,
    })
    setActiveTab('drivers')
  }

  const handleSaveDriver = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!cycleId) {
      return
    }

    setError('')
    setStatusMessage('')
    if (!driverForm.title.trim()) {
      setError('Driver title is required.')
      return
    }
    if (!driverForm.owner_organization_id) {
      setError('Driver owner organization is required.')
      return
    }

    try {
      if (selectedDriverId) {
        await updateDriver(cycleId, selectedDriverId, {
          title: driverForm.title.trim(),
          description: driverForm.description.trim() || undefined,
          category: driverForm.category,
          impact_level: driverForm.impact_level,
          time_horizon: driverForm.time_horizon,
          status: driverForm.status,
          strategic_theme_id: driverForm.strategic_theme_id || undefined,
          owner_organization_id: driverForm.owner_organization_id,
          planning_cycle_id: cycleId,
        })
        setStatusMessage('Driver updated.')
      } else {
        await createDriver(cycleId, {
          planning_cycle_id: cycleId,
          title: driverForm.title.trim(),
          description: driverForm.description.trim() || undefined,
          category: driverForm.category,
          impact_level: driverForm.impact_level,
          time_horizon: driverForm.time_horizon,
          status: driverForm.status,
          strategic_theme_id: driverForm.strategic_theme_id || undefined,
          owner_organization_id: driverForm.owner_organization_id,
        })
        setStatusMessage('Driver created.')
      }
      await refreshDrivers()
      resetDriverForm()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save driver')
    }
  }

  const handleArchiveDriver = async (driverId: string) => {
    if (!cycleId) {
      return
    }

    setError('')
    setStatusMessage('')
    try {
      await archiveDriver(cycleId, driverId)
      setStatusMessage('Driver archived.')
      await refreshDrivers()
      if (selectedDriverId === driverId) {
        resetDriverForm()
      }
    } catch (archiveError) {
      setError(archiveError instanceof Error ? archiveError.message : 'Unable to archive driver')
    }
  }

  const resetQuestionForm = () => {
    setSelectedQuestionId('')
    setDriverToLinkId('')
    setLinkedDrivers([])
    setQuestionForm({
      ...EMPTY_QUESTION_FORM,
      lead_organization_id: cycle?.owner_organization_id || '',
    })
  }

  const handleSelectQuestion = async (question: StrategicQuestion) => {
    if (!cycleId) {
      return
    }
    setSelectedQuestionId(question.id)
    setQuestionForm({
      title: question.title,
      description: question.description || '',
      priority: question.priority,
      status: question.status,
      strategic_theme_id: question.strategic_theme_id || '',
      lead_organization_id: question.lead_organization_id,
    })
    setDriverToLinkId('')
    try {
      const data = await getStrategicQuestionDrivers(cycleId, question.id)
      setLinkedDrivers(data)
      setActiveTab('strategic_questions')
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load linked drivers')
    }
  }

  const handleSaveQuestion = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!cycleId) {
      return
    }

    setError('')
    setStatusMessage('')
    if (!questionForm.title.trim()) {
      setError('Strategic question is required.')
      return
    }
    if (!questionForm.lead_organization_id) {
      setError('Lead organization is required.')
      return
    }

    try {
      if (selectedQuestionId) {
        await updateStrategicQuestion(cycleId, selectedQuestionId, {
          planning_cycle_id: cycleId,
          title: questionForm.title.trim(),
          description: questionForm.description.trim() || undefined,
          priority: questionForm.priority,
          status: questionForm.status,
          strategic_theme_id: questionForm.strategic_theme_id || undefined,
          lead_organization_id: questionForm.lead_organization_id,
        })
        setStatusMessage('Strategic question updated.')
      } else {
        await createStrategicQuestion(cycleId, {
          planning_cycle_id: cycleId,
          title: questionForm.title.trim(),
          description: questionForm.description.trim() || undefined,
          priority: questionForm.priority,
          status: questionForm.status,
          strategic_theme_id: questionForm.strategic_theme_id || undefined,
          lead_organization_id: questionForm.lead_organization_id,
        })
        setStatusMessage('Strategic question created.')
      }
      await refreshStrategicQuestions()
      resetQuestionForm()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save strategic question')
    }
  }

  const handleArchiveQuestion = async (questionId: string) => {
    if (!cycleId) {
      return
    }

    setError('')
    setStatusMessage('')
    try {
      await archiveStrategicQuestion(cycleId, questionId)
      setStatusMessage('Strategic question archived.')
      await refreshStrategicQuestions()
      if (selectedQuestionId === questionId) {
        resetQuestionForm()
      }
    } catch (archiveError) {
      setError(archiveError instanceof Error ? archiveError.message : 'Unable to archive strategic question')
    }
  }

  const handleAttachDriver = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!cycleId || !selectedQuestionId || !driverToLinkId) {
      return
    }

    setError('')
    setStatusMessage('')
    try {
      await attachDriverToStrategicQuestion(cycleId, selectedQuestionId, driverToLinkId)
      setDriverToLinkId('')
      setStatusMessage('Driver linked to strategic question.')
      const [linksData] = await Promise.all([
        getStrategicQuestionDrivers(cycleId, selectedQuestionId),
        refreshStrategicQuestions(),
      ])
      setLinkedDrivers(linksData)
    } catch (attachError) {
      setError(attachError instanceof Error ? attachError.message : 'Unable to attach driver')
    }
  }

  const handleDetachDriver = async (driverId: string) => {
    if (!cycleId || !selectedQuestionId) {
      return
    }

    setError('')
    setStatusMessage('')
    try {
      await detachDriverFromStrategicQuestion(cycleId, selectedQuestionId, driverId)
      setStatusMessage('Driver detached from strategic question.')
      const [linksData] = await Promise.all([
        getStrategicQuestionDrivers(cycleId, selectedQuestionId),
        refreshStrategicQuestions(),
      ])
      setLinkedDrivers(linksData)
    } catch (detachError) {
      setError(detachError instanceof Error ? detachError.message : 'Unable to detach driver')
    }
  }

  const resetObjectiveForm = () => {
    setSelectedObjectiveId('')
    setSelectedChoiceId('')
    setCapabilityToLinkId('')
    setSelectedAgreementId('')
    setChoiceDetailTab('details')
    setObjectiveForm({
      ...EMPTY_OBJECTIVE_FORM,
      planning_cycle_id: cycleId || '',
      owner_organization_id: cycle?.owner_organization_id || '',
      strategic_question_id: selectedQuestionId || '',
    })
    setChoiceForm({
      ...EMPTY_CHOICE_FORM,
      planning_cycle_id: cycleId || '',
      owner_organization_id: cycle?.owner_organization_id || '',
      strategic_objective_id: '',
    })
    setAgreementForm({
      ...EMPTY_AGREEMENT_FORM,
      planning_cycle_id: cycleId || '',
      strategic_choice_id: '',
      owner_organization_id: cycle?.owner_organization_id || '',
    })
    setNewCapabilityForm({
      ...EMPTY_CAPABILITY_FORM,
      owner_organization_id: cycle?.owner_organization_id || '',
    })
  }

  const handleSelectObjective = async (objective: StrategicObjective) => {
    setSelectedObjectiveId(objective.id)
    setSelectedChoiceId('')
    setObjectiveForm({
      planning_cycle_id: cycleId || '',
      strategic_question_id: objective.strategic_question_id,
      title: objective.title,
      description: objective.description || '',
      objective_type: objective.objective_type,
      priority: objective.priority,
      status: objective.status,
      strategic_theme_id: objective.strategic_theme_id || '',
      owner_organization_id: objective.owner_organization_id,
      target_date: toInputDate(objective.target_date),
    })
    setChoiceForm({
      ...EMPTY_CHOICE_FORM,
      planning_cycle_id: cycleId || '',
      strategic_objective_id: objective.id,
      strategic_theme_id: objective.strategic_theme_id || '',
      owner_organization_id: objective.owner_organization_id || cycle?.owner_organization_id || '',
    })
    setNewCapabilityForm({
      ...EMPTY_CAPABILITY_FORM,
      owner_organization_id: objective.owner_organization_id || cycle?.owner_organization_id || '',
    })
    await refreshChoicesForObjective(objective.id)
    setActiveTab('objectives')
  }

  const handleSaveObjective = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!cycleId) {
      return
    }

    setError('')
    setStatusMessage('')

    if (!objectiveForm.title.trim()) {
      setError('Objective title is required.')
      return
    }
    if (!objectiveForm.strategic_question_id) {
      setError('Linked question is required.')
      return
    }
    if (!objectiveForm.owner_organization_id) {
      setError('Owner organization is required.')
      return
    }

    try {
      if (selectedObjectiveId) {
        await updateStrategicObjective(cycleId, selectedObjectiveId, {
          ...objectiveForm,
          planning_cycle_id: cycleId,
          title: objectiveForm.title.trim(),
          description: objectiveForm.description?.trim() || undefined,
          strategic_theme_id: objectiveForm.strategic_theme_id || undefined,
          target_date: objectiveForm.target_date ? toIsoDate(objectiveForm.target_date) : undefined,
        })
        setStatusMessage('Strategic objective updated.')
      } else {
        await createStrategicObjective(cycleId, {
          ...objectiveForm,
          planning_cycle_id: cycleId,
          title: objectiveForm.title.trim(),
          description: objectiveForm.description?.trim() || undefined,
          strategic_theme_id: objectiveForm.strategic_theme_id || undefined,
          target_date: objectiveForm.target_date ? toIsoDate(objectiveForm.target_date) : undefined,
        })
        setStatusMessage('Strategic objective created.')
      }
      await refreshObjectives()
      resetObjectiveForm()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save strategic objective')
    }
  }

  const handleArchiveObjective = async (objectiveId: string) => {
    if (!cycleId) {
      return
    }

    setError('')
    setStatusMessage('')
    try {
      await archiveStrategicObjective(cycleId, objectiveId)
      setStatusMessage('Strategic objective archived.')
      await refreshObjectives()
      if (choicesByObjective[objectiveId]) {
        setChoicesByObjective((current) => {
          const next = { ...current }
          delete next[objectiveId]
          return next
        })
      }
      if (selectedObjectiveId === objectiveId) {
        resetObjectiveForm()
      }
    } catch (archiveError) {
      setError(archiveError instanceof Error ? archiveError.message : 'Unable to archive strategic objective')
    }
  }

  const handleSaveChoice = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!cycleId || !selectedObjectiveId) {
      return
    }

    setError('')
    setStatusMessage('')
    if (!choiceForm.title.trim()) {
      setError('Choice title is required.')
      return
    }
    if (!choiceForm.owner_organization_id) {
      setError('Choice owner organization is required.')
      return
    }

    try {
      if (selectedChoiceId) {
        await updateStrategicChoice(cycleId, selectedObjectiveId, selectedChoiceId, {
          ...choiceForm,
          planning_cycle_id: cycleId,
          strategic_objective_id: selectedObjectiveId,
          title: choiceForm.title.trim(),
          description: choiceForm.description?.trim() || undefined,
          strategic_theme_id: choiceForm.strategic_theme_id || undefined,
        })
        setStatusMessage('Strategic choice updated.')
      } else {
        await createStrategicChoice(cycleId, selectedObjectiveId, {
          ...choiceForm,
          planning_cycle_id: cycleId,
          strategic_objective_id: selectedObjectiveId,
          title: choiceForm.title.trim(),
          description: choiceForm.description?.trim() || undefined,
          strategic_theme_id: choiceForm.strategic_theme_id || undefined,
        })
        setStatusMessage('Strategic choice created.')
      }
      await refreshChoicesForObjective(selectedObjectiveId)
      setSelectedChoiceId('')
      setChoiceForm((current) => ({
        ...EMPTY_CHOICE_FORM,
        planning_cycle_id: cycleId,
        strategic_objective_id: selectedObjectiveId,
        owner_organization_id: current.owner_organization_id || objectiveForm.owner_organization_id,
      }))
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save strategic choice')
    }
  }

  const handleEditChoice = (choice: StrategicChoice) => {
    setChoiceDetailTab('details')
    setSelectedChoiceId(choice.id)
    setCapabilityToLinkId('')
    setNewCapabilityForm({
      ...EMPTY_CAPABILITY_FORM,
      owner_organization_id: choice.owner_organization_id || objectiveForm.owner_organization_id || cycle?.owner_organization_id || '',
    })
    setSelectedAgreementId('')
    setSelectedInitiativeId('')
    setInitiativeCapabilityToLinkId('')
    setInitiativeAgreementToLinkId('')
    setChoiceForm({
      planning_cycle_id: cycleId || '',
      strategic_objective_id: selectedObjectiveId,
      title: choice.title,
      description: choice.description || '',
      choice_type: choice.choice_type,
      status: choice.status,
      recommendation: choice.recommendation,
      strategic_theme_id: choice.strategic_theme_id || '',
      owner_organization_id: choice.owner_organization_id,
    })
    setAgreementForm({
      ...EMPTY_AGREEMENT_FORM,
      planning_cycle_id: cycleId || '',
      strategic_choice_id: choice.id,
      owner_organization_id: choice.owner_organization_id || objectiveForm.owner_organization_id,
    })
    setInitiativeForm({
      ...EMPTY_INITIATIVE_FORM,
      planning_cycle_id: cycleId || '',
      owner_organization_id: choice.owner_organization_id || objectiveForm.owner_organization_id || cycle?.owner_organization_id || '',
    })
    void refreshAgreementsForChoice(selectedObjectiveId, choice.id)
    void refreshCapabilitiesForChoice(selectedObjectiveId, choice.id)
    void refreshInitiativesForChoice(selectedObjectiveId, choice.id)
  }

  const handleArchiveChoice = async (choiceId: string) => {
    if (!cycleId || !selectedObjectiveId) {
      return
    }

    setError('')
    setStatusMessage('')
    try {
      await archiveStrategicChoice(cycleId, selectedObjectiveId, choiceId)
      setStatusMessage('Strategic choice archived.')
      await refreshChoicesForObjective(selectedObjectiveId)
      if (agreementsByChoice[choiceId]) {
        setAgreementsByChoice((current) => {
          const next = { ...current }
          delete next[choiceId]
          return next
        })
      }
      if (capabilitiesByChoice[choiceId]) {
        setCapabilitiesByChoice((current) => {
          const next = { ...current }
          delete next[choiceId]
          return next
        })
      }
      if (initiativesByChoice[choiceId]) {
        setInitiativesByChoice((current) => {
          const next = { ...current }
          delete next[choiceId]
          return next
        })
      }
      if (selectedChoiceId === choiceId) {
        setSelectedChoiceId('')
        setCapabilityToLinkId('')
        setSelectedAgreementId('')
        setSelectedInitiativeId('')
        setInitiativeCapabilityToLinkId('')
        setInitiativeAgreementToLinkId('')
        setChoiceForm((current) => ({
          ...EMPTY_CHOICE_FORM,
          planning_cycle_id: cycleId,
          strategic_objective_id: selectedObjectiveId,
          owner_organization_id: current.owner_organization_id || objectiveForm.owner_organization_id,
        }))
        setAgreementForm((current) => ({
          ...EMPTY_AGREEMENT_FORM,
          planning_cycle_id: cycleId,
          strategic_choice_id: '',
          owner_organization_id: current.owner_organization_id || objectiveForm.owner_organization_id,
        }))
        setInitiativeForm((current) => ({
          ...EMPTY_INITIATIVE_FORM,
          planning_cycle_id: cycleId,
          owner_organization_id: current.owner_organization_id || objectiveForm.owner_organization_id,
        }))
      }
    } catch (archiveError) {
      setError(archiveError instanceof Error ? archiveError.message : 'Unable to archive strategic choice')
    }
  }

  const handleAttachCapability = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!cycleId || !selectedObjectiveId || !selectedChoiceId || !capabilityToLinkId) {
      return
    }

    setError('')
    setStatusMessage('')
    try {
      await attachCapabilityToChoice(cycleId, selectedObjectiveId, selectedChoiceId, capabilityToLinkId)
      setCapabilityToLinkId('')
      setStatusMessage('Required capability linked to strategic choice.')
      await refreshCapabilitiesForChoice(selectedObjectiveId, selectedChoiceId)
    } catch (attachError) {
      setError(attachError instanceof Error ? attachError.message : 'Unable to link capability')
    }
  }

  const handleCreateAndLinkCapability = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!cycleId || !selectedObjectiveId || !selectedChoiceId) {
      return
    }

    setError('')
    setStatusMessage('')
    if (!newCapabilityForm.name.trim()) {
      setError('Capability name is required.')
      return
    }
    if (!newCapabilityForm.owner_organization_id) {
      setError('Capability owner organization is required.')
      return
    }

    try {
      const created = await createCapability({
        ...newCapabilityForm,
        name: newCapabilityForm.name.trim(),
        description: newCapabilityForm.description?.trim() || undefined,
      })
      await attachCapabilityToChoice(cycleId, selectedObjectiveId, selectedChoiceId, created.id)
      const refreshedCatalog = await getCapabilities()
      setCapabilitiesCatalog(refreshedCatalog.filter((capability) => capability.status !== 'Retired'))
      await refreshCapabilitiesForChoice(selectedObjectiveId, selectedChoiceId)
      setNewCapabilityForm({
        ...EMPTY_CAPABILITY_FORM,
        owner_organization_id: created.owner_organization_id || choiceForm.owner_organization_id || objectiveForm.owner_organization_id || '',
      })
      setStatusMessage('New capability created and linked as a required capability.')
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Unable to create capability')
    }
  }

  const handleDetachCapability = async (capabilityId: string) => {
    if (!cycleId || !selectedObjectiveId || !selectedChoiceId) {
      return
    }

    setError('')
    setStatusMessage('')
    try {
      await detachCapabilityFromChoice(cycleId, selectedObjectiveId, selectedChoiceId, capabilityId)
      setStatusMessage('Capability detached from strategic choice.')
      await refreshCapabilitiesForChoice(selectedObjectiveId, selectedChoiceId)
    } catch (detachError) {
      setError(detachError instanceof Error ? detachError.message : 'Unable to detach capability')
    }
  }

  const handleSaveAgreement = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!cycleId || !selectedObjectiveId || !selectedChoiceId) {
      return
    }

    setError('')
    setStatusMessage('')
    if (!agreementForm.title.trim()) {
      setError('Agreement title is required.')
      return
    }
    if (!agreementForm.owner_organization_id) {
      setError('Agreement owner organization is required.')
      return
    }

    try {
      if (selectedAgreementId) {
        await updateStrategicAgreement(cycleId, selectedObjectiveId, selectedChoiceId, selectedAgreementId, {
          ...agreementForm,
          planning_cycle_id: cycleId,
          strategic_choice_id: selectedChoiceId,
          title: agreementForm.title.trim(),
          description: agreementForm.description?.trim() || undefined,
          effective_date: agreementForm.effective_date ? toIsoDate(agreementForm.effective_date) : undefined,
        })
        setStatusMessage('Strategic agreement updated.')
      } else {
        await createStrategicAgreement(cycleId, selectedObjectiveId, selectedChoiceId, {
          ...agreementForm,
          planning_cycle_id: cycleId,
          strategic_choice_id: selectedChoiceId,
          title: agreementForm.title.trim(),
          description: agreementForm.description?.trim() || undefined,
          effective_date: agreementForm.effective_date ? toIsoDate(agreementForm.effective_date) : undefined,
        })
        setStatusMessage('Strategic agreement created.')
      }
      await refreshAgreementsForChoice(selectedObjectiveId, selectedChoiceId)
      setSelectedAgreementId('')
      setAgreementForm((current) => ({
        ...EMPTY_AGREEMENT_FORM,
        planning_cycle_id: cycleId,
        strategic_choice_id: selectedChoiceId,
        owner_organization_id: current.owner_organization_id || choiceForm.owner_organization_id,
      }))
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save strategic agreement')
    }
  }

  const handleEditAgreement = (agreement: StrategicAgreement) => {
    setSelectedAgreementId(agreement.id)
    setAgreementForm({
      planning_cycle_id: cycleId || '',
      strategic_choice_id: selectedChoiceId,
      title: agreement.title,
      description: agreement.description || '',
      status: agreement.status,
      effective_date: toInputDate(agreement.effective_date),
      owner_organization_id: agreement.owner_organization_id,
    })
  }

  const resetReviewForm = () => {
    setSelectedReviewId('')
    setSelectedReviewDetail(null)
    setReviewForm({
      ...EMPTY_REVIEW_FORM,
      planning_cycle_id: cycleId || '',
    })
  }

  const handleEditReview = (review: StrategyReview) => {
    setSelectedReviewId(review.id)
    void refreshStrategyReviewDetail(review.id)
    setReviewForm({
      planning_cycle_id: cycleId || '',
      date: toInputDate(review.date),
      status: review.status,
      recommendations: review.recommendations || '',
      summary: review.summary || '',
    })
  }

  const handleSaveReview = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!cycleId) {
      return
    }

    setError('')
    setStatusMessage('')
    if (!reviewForm.date) {
      setError('Review date is required.')
      return
    }

    try {
      let savedReviewId = selectedReviewId
      if (selectedReviewId) {
        await updateStrategyReview(cycleId, selectedReviewId, {
          planning_cycle_id: cycleId,
          date: toIsoDate(reviewForm.date) || reviewForm.date,
          status: reviewForm.status,
          recommendations: reviewForm.recommendations?.trim() || undefined,
          summary: reviewForm.summary?.trim() || undefined,
        })
        setStatusMessage('Strategy review updated.')
      } else {
        const created = await createStrategyReview(cycleId, {
          planning_cycle_id: cycleId,
          date: toIsoDate(reviewForm.date) || reviewForm.date,
          status: reviewForm.status,
          recommendations: reviewForm.recommendations?.trim() || undefined,
          summary: reviewForm.summary?.trim() || undefined,
        })
        savedReviewId = created.id
        setSelectedReviewId(created.id)
        setStatusMessage('Strategy review created.')
      }
      await refreshStrategyReviews()
      await refreshStrategyReviewDetail(savedReviewId)
      setReviewForm((current) => ({
        ...current,
        planning_cycle_id: cycleId,
      }))
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save strategy review')
    }
  }

  const resetInitiativeForm = () => {
    setSelectedInitiativeId('')
    setInitiativeCapabilityToLinkId('')
    setInitiativeAgreementToLinkId('')
    setSelectedOutcomeId('')
    setSelectedMetricId('')
    setOutcomeForm({
      ...EMPTY_OUTCOME_FORM,
      planning_cycle_id: cycleId || '',
      strategic_objective_id: selectedObjectiveId,
      initiative_id: '',
    })
    setOutcomesByInitiative((current) => {
      const next = { ...current }
      if (selectedInitiativeId) {
        delete next[selectedInitiativeId]
      }
      return next
    })
    setInitiativeForm({
      ...EMPTY_INITIATIVE_FORM,
      planning_cycle_id: cycleId || '',
      owner_organization_id: selectedChoice?.owner_organization_id || objectiveForm.owner_organization_id || cycle?.owner_organization_id || '',
    })
  }

  const handleEditInitiative = (initiative: Initiative) => {
    setChoiceDetailTab('initiatives')
    setSelectedInitiativeId(initiative.id)
    setInitiativeCapabilityToLinkId('')
    setInitiativeAgreementToLinkId('')
    setSelectedOutcomeId('')
    setSelectedMetricId('')
    setOutcomeForm({
      ...EMPTY_OUTCOME_FORM,
      planning_cycle_id: cycleId || '',
      strategic_objective_id: selectedObjectiveId,
      initiative_id: initiative.id,
    })
    setInitiativeForm({
      planning_cycle_id: cycleId || '',
      name: initiative.name,
      description: initiative.description || '',
      status: initiative.status,
      owner_organization_id: initiative.owner_organization_id,
      start_date: toInputDate(initiative.start_date),
      end_date: toInputDate(initiative.end_date),
      budget: initiative.budget ?? undefined,
    })
    void refreshInitiativeDetail(selectedObjectiveId, selectedChoiceId, initiative.id)
    void refreshOutcomesForInitiative(selectedObjectiveId, initiative.id)
  }

  const handleSaveInitiative = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!cycleId || !selectedObjectiveId || !selectedChoiceId) {
      return
    }

    setError('')
    setStatusMessage('')
    if (!initiativeForm.name.trim()) {
      setError('Initiative name is required.')
      return
    }
    if (!initiativeForm.owner_organization_id) {
      setError('Initiative owner organization is required.')
      return
    }

    try {
      if (selectedInitiativeId) {
        const updated = await updateInitiativeForChoice(cycleId, selectedObjectiveId, selectedChoiceId, selectedInitiativeId, {
          ...initiativeForm,
          planning_cycle_id: cycleId,
          name: initiativeForm.name.trim(),
          description: initiativeForm.description?.trim() || undefined,
          start_date: initiativeForm.start_date ? toIsoDate(initiativeForm.start_date) : undefined,
          end_date: initiativeForm.end_date ? toIsoDate(initiativeForm.end_date) : undefined,
        })
        await refreshInitiativesForChoice(selectedObjectiveId, selectedChoiceId)
        await refreshInitiativeDetail(selectedObjectiveId, selectedChoiceId, updated.id)
        setStatusMessage('Strategic initiative updated.')
      } else {
        const created = await createInitiativeForChoice(cycleId, selectedObjectiveId, selectedChoiceId, {
          ...initiativeForm,
          planning_cycle_id: cycleId,
          name: initiativeForm.name.trim(),
          description: initiativeForm.description?.trim() || undefined,
          start_date: initiativeForm.start_date ? toIsoDate(initiativeForm.start_date) : undefined,
          end_date: initiativeForm.end_date ? toIsoDate(initiativeForm.end_date) : undefined,
        })
        await refreshInitiativesForChoice(selectedObjectiveId, selectedChoiceId)
        setSelectedInitiativeId(created.id)
        await refreshInitiativeDetail(selectedObjectiveId, selectedChoiceId, created.id)
        setStatusMessage('Strategic initiative created.')
      }
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save strategic initiative')
    }
  }

  const handleAttachCapabilityToInitiative = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!cycleId || !selectedObjectiveId || !selectedChoiceId || !selectedInitiativeId || !initiativeCapabilityToLinkId) {
      return
    }

    setError('')
    setStatusMessage('')
    try {
      await attachCapabilityToInitiative(
        cycleId,
        selectedObjectiveId,
        selectedChoiceId,
        selectedInitiativeId,
        initiativeCapabilityToLinkId,
      )
      setInitiativeCapabilityToLinkId('')
      await refreshInitiativeDetail(selectedObjectiveId, selectedChoiceId, selectedInitiativeId)
      setStatusMessage('Capability linked to strategic initiative.')
    } catch (attachError) {
      setError(attachError instanceof Error ? attachError.message : 'Unable to link initiative capability')
    }
  }

  const handleAttachAgreementToInitiative = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!cycleId || !selectedObjectiveId || !selectedChoiceId || !selectedInitiativeId || !initiativeAgreementToLinkId) {
      return
    }

    setError('')
    setStatusMessage('')
    try {
      await attachAgreementToInitiative(
        cycleId,
        selectedObjectiveId,
        selectedChoiceId,
        selectedInitiativeId,
        initiativeAgreementToLinkId,
      )
      setInitiativeAgreementToLinkId('')
      await refreshInitiativeDetail(selectedObjectiveId, selectedChoiceId, selectedInitiativeId)
      setStatusMessage('Agreement linked to strategic initiative.')
    } catch (attachError) {
      setError(attachError instanceof Error ? attachError.message : 'Unable to link initiative agreement')
    }
  }

  const resetOutcomeForm = () => {
    setSelectedOutcomeId('')
    setSelectedMetricId('')
    setMetricForm({ ...EMPTY_METRIC_FORM })
    setOutcomeForm({
      ...EMPTY_OUTCOME_FORM,
      planning_cycle_id: cycleId || '',
      strategic_objective_id: selectedObjectiveId,
      initiative_id: selectedInitiativeId,
    })
  }

  const handleEditOutcome = (outcome: Outcome) => {
    setSelectedOutcomeId(outcome.id)
    setSelectedMetricId('')
    setOutcomeForm({
      planning_cycle_id: cycleId || '',
      strategic_objective_id: selectedObjectiveId,
      initiative_id: selectedInitiativeId,
      name: outcome.name,
      description: outcome.description || '',
    })
    setMetricForm({ ...EMPTY_METRIC_FORM })
    void refreshOutcomeDetail(selectedObjectiveId, selectedInitiativeId, outcome.id)
  }

  const handleSaveOutcome = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!cycleId || !selectedObjectiveId || !selectedInitiativeId) {
      return
    }

    setError('')
    setStatusMessage('')
    if (!outcomeForm.name.trim()) {
      setError('Outcome name is required.')
      return
    }

    try {
      if (selectedOutcomeId) {
        const updated = await updateOutcomeForInitiative(cycleId, selectedObjectiveId, selectedInitiativeId, selectedOutcomeId, {
          planning_cycle_id: cycleId,
          strategic_objective_id: selectedObjectiveId,
          initiative_id: selectedInitiativeId,
          name: outcomeForm.name.trim(),
          description: outcomeForm.description?.trim() || undefined,
        })
        await refreshOutcomesForInitiative(selectedObjectiveId, selectedInitiativeId)
        await refreshOutcomeDetail(selectedObjectiveId, selectedInitiativeId, updated.id)
        setStatusMessage('Outcome updated.')
      } else {
        const created = await createOutcomeForInitiative(cycleId, selectedObjectiveId, selectedInitiativeId, {
          planning_cycle_id: cycleId,
          strategic_objective_id: selectedObjectiveId,
          initiative_id: selectedInitiativeId,
          name: outcomeForm.name.trim(),
          description: outcomeForm.description?.trim() || undefined,
        })
        await refreshOutcomesForInitiative(selectedObjectiveId, selectedInitiativeId)
        setSelectedOutcomeId(created.id)
        await refreshOutcomeDetail(selectedObjectiveId, selectedInitiativeId, created.id)
        setStatusMessage('Outcome created.')
      }
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save outcome')
    }
  }

  const handleSaveMetric = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!cycleId || !selectedObjectiveId || !selectedInitiativeId || !selectedOutcomeId) {
      return
    }

    setError('')
    setStatusMessage('')
    if (!metricForm.name.trim()) {
      setError('Metric name is required.')
      return
    }

    const targetValue = metricForm.target_value === '' ? undefined : Number(metricForm.target_value)
    const actualValue = metricForm.actual_value === '' ? undefined : Number(metricForm.actual_value)

    try {
      const metricPayload: MetricCreate = {
        outcome_id: selectedOutcomeId,
        name: metricForm.name.trim(),
        description: metricForm.description?.trim() || undefined,
        unit: metricForm.unit?.trim() || undefined,
        target: typeof targetValue === 'number'
          ? {
              target_value: targetValue,
              target_unit: metricForm.target_unit?.trim() || undefined,
              target_date: metricForm.target_date ? toIsoDate(metricForm.target_date) : undefined,
              notes: metricForm.target_notes?.trim() || undefined,
            }
          : undefined,
        actual: typeof actualValue === 'number'
          ? {
              actual_value: actualValue,
              actual_unit: metricForm.actual_unit?.trim() || undefined,
              measured_at: metricForm.measured_at ? toIsoDate(metricForm.measured_at) : undefined,
              notes: metricForm.actual_notes?.trim() || undefined,
            }
          : undefined,
      }

      if (selectedMetricId) {
        const saved = await updateMetricForOutcome(
          cycleId,
          selectedObjectiveId,
          selectedInitiativeId,
          selectedOutcomeId,
          selectedMetricId,
          metricPayload,
        )
        await refreshOutcomeDetail(selectedObjectiveId, selectedInitiativeId, selectedOutcomeId)
        setSelectedMetricId(saved.id)
        setStatusMessage('Metric updated.')
      } else {
        const created = await createMetricForOutcome(
          cycleId,
          selectedObjectiveId,
          selectedInitiativeId,
          selectedOutcomeId,
          metricPayload,
        )
        await refreshOutcomeDetail(selectedObjectiveId, selectedInitiativeId, selectedOutcomeId)
        setSelectedMetricId(created.id)
        setStatusMessage('Metric created.')
      }
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save metric')
    }
  }

  const handleEditMetric = (metric: MetricDetail) => {
    setSelectedMetricId(metric.id)
    setMetricForm({
      name: metric.name,
      description: metric.description || '',
      unit: metric.unit || '',
      target_value: metric.target ? String(metric.target.target_value) : '',
      target_unit: metric.target?.target_unit || '',
      target_date: metric.target?.target_date ? toInputDate(metric.target.target_date) : '',
      target_notes: metric.target?.notes || '',
      actual_value: metric.actuals[metric.actuals.length - 1] ? String(metric.actuals[metric.actuals.length - 1].actual_value) : '',
      actual_unit: metric.actuals[metric.actuals.length - 1]?.actual_unit || '',
      measured_at: metric.actuals[metric.actuals.length - 1]?.measured_at ? toInputDate(metric.actuals[metric.actuals.length - 1].measured_at) : '',
      actual_notes: metric.actuals[metric.actuals.length - 1]?.notes || '',
    })
  }

  useEffect(() => {
    if (cycle?.owner_organization_id && !driverForm.owner_organization_id) {
      setDriverForm((current) => ({
        ...current,
        owner_organization_id: cycle.owner_organization_id,
      }))
    }
  }, [cycle?.owner_organization_id, driverForm.owner_organization_id])

  useEffect(() => {
    if (cycle?.owner_organization_id && !questionForm.lead_organization_id) {
      setQuestionForm((current) => ({
        ...current,
        lead_organization_id: cycle.owner_organization_id,
      }))
    }
  }, [cycle?.owner_organization_id, questionForm.lead_organization_id])

  useEffect(() => {
    if (!cycleId) {
      return
    }
    setObjectiveForm((current) => ({
      ...current,
      planning_cycle_id: cycleId,
      owner_organization_id: current.owner_organization_id || cycle?.owner_organization_id || '',
      strategic_question_id: current.strategic_question_id || selectedQuestionId || '',
    }))
  }, [cycleId, cycle?.owner_organization_id, selectedQuestionId])

  useEffect(() => {
    if (!cycleId || !selectedObjectiveId) {
      return
    }
    setChoiceForm((current) => ({
      ...current,
      planning_cycle_id: cycleId,
      strategic_objective_id: selectedObjectiveId,
      owner_organization_id: current.owner_organization_id || objectiveForm.owner_organization_id || cycle?.owner_organization_id || '',
    }))
  }, [cycleId, selectedObjectiveId, objectiveForm.owner_organization_id, cycle?.owner_organization_id])

  useEffect(() => {
    if (!cycleId || !selectedChoiceId) {
      return
    }
    setAgreementForm((current) => ({
      ...current,
      planning_cycle_id: cycleId,
      strategic_choice_id: selectedChoiceId,
      owner_organization_id: current.owner_organization_id || choiceForm.owner_organization_id || objectiveForm.owner_organization_id || '',
    }))
  }, [cycleId, selectedChoiceId, choiceForm.owner_organization_id, objectiveForm.owner_organization_id])

  useEffect(() => {
    if (!cycleId || !selectedChoiceId) {
      return
    }
    setInitiativeForm((current) => ({
      ...current,
      planning_cycle_id: cycleId,
      owner_organization_id: current.owner_organization_id || choiceForm.owner_organization_id || objectiveForm.owner_organization_id || '',
    }))
  }, [cycleId, selectedChoiceId, choiceForm.owner_organization_id, objectiveForm.owner_organization_id])

  useEffect(() => {
    if (!selectedChoiceId || !selectedObjectiveId || choiceDetailTab !== 'initiatives') {
      return
    }
    void refreshInitiativesForChoice(selectedObjectiveId, selectedChoiceId)
  }, [choiceDetailTab, selectedObjectiveId, selectedChoiceId])

  useEffect(() => {
    if (!selectedChoiceId || !selectedObjectiveId || !selectedInitiativeId || choiceDetailTab !== 'initiatives') {
      return
    }
    void refreshOutcomesForInitiative(selectedObjectiveId, selectedInitiativeId)
  }, [choiceDetailTab, selectedObjectiveId, selectedChoiceId, selectedInitiativeId])

  useEffect(() => {
    if (!selectedOutcomeId || !selectedObjectiveId || !selectedInitiativeId) {
      return
    }
    void refreshOutcomeDetail(selectedObjectiveId, selectedInitiativeId, selectedOutcomeId)
  }, [selectedOutcomeId, selectedObjectiveId, selectedInitiativeId])

  useEffect(() => {
    if (!cycleId || activeTab !== 'themes' || objectives.length === 0) {
      return
    }

    const loadChoicesForThemes = async () => {
      const updates = await Promise.all(
        objectives.map(async (objective) => ({
          objectiveId: objective.id,
          choices: await getStrategicChoicesForObjective(cycleId, objective.id),
        })),
      )
      setChoicesByObjective((current) => {
        const next = { ...current }
        for (const item of updates) {
          next[item.objectiveId] = item.choices
        }
        return next
      })
    }

    void loadChoicesForThemes()
  }, [activeTab, cycleId, objectives])

  useEffect(() => {
    if (!cycleId) {
      return
    }
    setThemeForm((current) => ({
      ...current,
      planning_cycle_id: cycleId,
    }))
  }, [cycleId])

  useEffect(() => {
    if (!newCapabilityForm.owner_organization_id && (choiceForm.owner_organization_id || objectiveForm.owner_organization_id || cycle?.owner_organization_id)) {
      setNewCapabilityForm((current) => ({
        ...current,
        owner_organization_id: choiceForm.owner_organization_id || objectiveForm.owner_organization_id || cycle?.owner_organization_id || '',
      }))
    }
  }, [newCapabilityForm.owner_organization_id, choiceForm.owner_organization_id, objectiveForm.owner_organization_id, cycle?.owner_organization_id])

  if (!cycleId) {
    return null
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(0,166,166,0.08),transparent_28%),linear-gradient(180deg,#eef3f7_0%,#e7edf2_100%)] text-slate-800">
      <header className="relative z-[200] border-b border-white/70 bg-white/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <img src="/sextant-logo-horiz.svg" alt="Sextant" className="h-8 w-auto" />
          <LoginButton />
        </div>
      </header>

      <MainMenu breadcrumb="Strategy / Planning Cycles / Detail" />

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <section className="surface-panel rounded-[2rem] p-7">
          <p className="section-kicker mb-2">Planning Cycle Detail</p>
          <h1 className="text-3xl font-semibold text-slate-900">{cycle?.name || 'Planning Cycle'}</h1>
          <p className="mt-3 text-slate-600">Manage overview, participants, and timeline context for this cycle workspace.</p>
          <div className="mt-4">
            <Link className="button-secondary" to="/strategy/planning-cycles">Back to Planning Cycles</Link>
          </div>
        </section>

        {(statusMessage || error) && (
          <section className="surface-panel rounded-[1.5rem] p-5">
            <p className={`text-sm font-semibold ${error ? 'text-rose-700' : 'text-emerald-700'}`}>
              {error || statusMessage}
            </p>
          </section>
        )}

        <section className="surface-panel rounded-[2rem] p-7">
          <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-4">
            <button type="button" className={`button-secondary ${activeTab === 'overview' ? 'bg-cyan-50 border-cyan-300' : ''}`} onClick={() => setActiveTab('overview')}>
              Overview
            </button>
            <button type="button" className={`button-secondary ${activeTab === 'participants' ? 'bg-cyan-50 border-cyan-300' : ''}`} onClick={() => setActiveTab('participants')}>
              Participants
            </button>
            <button type="button" className={`button-secondary ${activeTab === 'themes' ? 'bg-cyan-50 border-cyan-300' : ''}`} onClick={() => setActiveTab('themes')}>
              Themes
            </button>
            <button type="button" className={`button-secondary ${activeTab === 'drivers' ? 'bg-cyan-50 border-cyan-300' : ''}`} onClick={() => setActiveTab('drivers')}>
              Drivers
            </button>
            <button type="button" className={`button-secondary ${activeTab === 'strategic_questions' ? 'bg-cyan-50 border-cyan-300' : ''}`} onClick={() => setActiveTab('strategic_questions')}>
              Strategic Questions
            </button>
            <button type="button" className={`button-secondary ${activeTab === 'objectives' ? 'bg-cyan-50 border-cyan-300' : ''}`} onClick={() => setActiveTab('objectives')}>
              Objectives
            </button>
            <button type="button" className={`button-secondary ${activeTab === 'reviews' ? 'bg-cyan-50 border-cyan-300' : ''}`} onClick={() => setActiveTab('reviews')}>
              Reviews
            </button>
            <button type="button" className={`button-secondary ${activeTab === 'timeline' ? 'bg-cyan-50 border-cyan-300' : ''}`} onClick={() => setActiveTab('timeline')}>
              Timeline
            </button>
          </div>

          {activeTab === 'overview' && (
            <form className="mt-6 space-y-4" onSubmit={handleSaveOverview}>
              <div>
                <label className="section-kicker mb-2 block" htmlFor="overview-name">Name</label>
                <input
                  id="overview-name"
                  className="input-field"
                  value={cycleForm.name}
                  onChange={(event) => setCycleForm({ ...cycleForm, name: event.target.value })}
                />
              </div>

              <div>
                <label className="section-kicker mb-2 block" htmlFor="overview-description">Description</label>
                <textarea
                  id="overview-description"
                  className="input-field min-h-[90px]"
                  value={cycleForm.description}
                  onChange={(event) => setCycleForm({ ...cycleForm, description: event.target.value })}
                />
              </div>

              <div>
                <label className="section-kicker mb-2 block" htmlFor="overview-owner">Owner Organization</label>
                <select
                  id="overview-owner"
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

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="section-kicker mb-2 block" htmlFor="overview-status">Status</label>
                  <select
                    id="overview-status"
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
                  <label className="section-kicker mb-2 block" htmlFor="overview-start-date">Start Date</label>
                  <input
                    id="overview-start-date"
                    type="date"
                    className="input-field"
                    value={cycleForm.start_date}
                    onChange={(event) => setCycleForm({ ...cycleForm, start_date: event.target.value })}
                  />
                </div>

                <div>
                  <label className="section-kicker mb-2 block" htmlFor="overview-end-date">End Date</label>
                  <input
                    id="overview-end-date"
                    type="date"
                    className="input-field"
                    value={cycleForm.end_date}
                    onChange={(event) => setCycleForm({ ...cycleForm, end_date: event.target.value })}
                  />
                </div>
              </div>

              <button className="button-primary" type="submit">Save</button>
            </form>
          )}

          {activeTab === 'participants' && (
            <div className="mt-6 space-y-6">
              <form className="flex flex-wrap items-end gap-3" onSubmit={handleAddParticipant}>
                <div>
                  <label className="section-kicker mb-2 block" htmlFor="participant-type">Participant Type</label>
                  <select
                    id="participant-type"
                    className="input-field"
                    value={participantTypeToAdd}
                    onChange={(event) => {
                      const value = event.target.value as 'organization' | 'strategic_group'
                      setParticipantTypeToAdd(value)
                      setParticipantIdToAdd('')
                    }}
                  >
                    <option value="organization">Organization</option>
                    <option value="strategic_group">Strategic Group</option>
                  </select>
                </div>

                <div className="min-w-[280px] flex-1">
                  <label className="section-kicker mb-2 block" htmlFor="participant-id">Participating Organizations</label>
                  <select
                    id="participant-id"
                    className="input-field"
                    value={participantIdToAdd}
                    onChange={(event) => setParticipantIdToAdd(event.target.value)}
                  >
                    <option value="">Select participant</option>
                    {participantOptions.map((participant) => (
                      <option key={participant.id} value={participant.id}>
                        {participant.name}
                      </option>
                    ))}
                  </select>
                </div>

                <button className="button-primary" type="submit" disabled={!participantIdToAdd}>Add</button>
              </form>

              <div className="space-y-3">
                {participants.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600">
                    No participants assigned yet.
                  </p>
                ) : (
                  participants.map((participant) => (
                    <div key={participant.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/80 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">{participant.participant_name}</p>
                        <p className="text-sm text-slate-600">
                          {participant.participant_type === 'organization' ? 'Organization' : 'Strategic Group'}
                          {participant.participant_status ? ` • ${participant.participant_status}` : ''}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="button-secondary text-rose-700 hover:border-rose-200 hover:bg-rose-50"
                        onClick={() => void handleRemoveParticipant(participant)}
                      >
                        Remove
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'themes' && (
            <div className="mt-6 grid gap-6 lg:grid-cols-5">
              <section className="lg:col-span-3 space-y-4">
                <div className="rounded-xl border border-cyan-100 bg-cyan-50/60 px-4 py-3 text-sm text-cyan-900">
                  {'Executive View: strategy grouped by Strategic Theme across Drivers, Questions, Objectives, and Choices.'}
                </div>

                {groupedStrategyByTheme.groups.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600">
                    Create strategic themes to group strategy artifacts.
                  </p>
                ) : (
                  groupedStrategyByTheme.groups.map((group) => (
                    <div key={group.theme.id} className="rounded-2xl border border-slate-200 bg-white/80 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="section-kicker">Theme</p>
                          <p className="mt-1 font-semibold text-slate-900">{group.theme.name}</p>
                          <p className="text-xs text-slate-600">{group.theme.status}</p>
                        </div>
                        <div className="flex gap-2">
                          <button type="button" className="button-secondary" onClick={() => handleEditTheme(group.theme)}>Edit</button>
                          <button
                            type="button"
                            className="button-secondary text-rose-700 hover:border-rose-200 hover:bg-rose-50"
                            onClick={() => void handleArchiveTheme(group.theme.id)}
                            disabled={group.theme.status === 'Archived'}
                          >
                            Archive
                          </button>
                        </div>
                      </div>
                      {group.theme.description && <p className="mt-2 text-sm text-slate-700">{group.theme.description}</p>}

                      <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                          <p className="section-kicker">Drivers</p>
                          <p className="mt-1 text-xl font-semibold text-slate-900">{group.drivers.length}</p>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                          <p className="section-kicker">Questions</p>
                          <p className="mt-1 text-xl font-semibold text-slate-900">{group.questions.length}</p>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                          <p className="section-kicker">Objectives</p>
                          <p className="mt-1 text-xl font-semibold text-slate-900">{group.objectives.length}</p>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                          <p className="section-kicker">Choices</p>
                          <p className="mt-1 text-xl font-semibold text-slate-900">{group.choices.length}</p>
                        </div>
                      </div>

                      <div className="mt-3 text-xs text-slate-600">
                        <p>{group.drivers.slice(0, 2).map((item) => item.title).join(' • ') || 'No drivers assigned'}</p>
                        <p>{group.questions.slice(0, 2).map((item) => item.title).join(' • ') || 'No questions assigned'}</p>
                        <p>{group.objectives.slice(0, 2).map((item) => item.title).join(' • ') || 'No objectives assigned'}</p>
                        <p>{group.choices.slice(0, 2).map((item) => item.title).join(' • ') || 'No choices assigned'}</p>
                      </div>
                    </div>
                  ))
                )}

                <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
                  <p className="section-kicker">Unassigned Strategy</p>
                  <p className="mt-1 text-sm text-slate-700">
                    {`Drivers ${groupedStrategyByTheme.unassigned.drivers.length} • Questions ${groupedStrategyByTheme.unassigned.questions.length} • Objectives ${groupedStrategyByTheme.unassigned.objectives.length} • Choices ${groupedStrategyByTheme.unassigned.choices.length}`}
                  </p>
                </div>
              </section>

              <section className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white/80 p-5">
                <p className="section-kicker mb-3">{selectedThemeId ? 'Edit Strategic Theme' : 'Create Strategic Theme'}</p>
                <form className="space-y-3" onSubmit={handleSaveTheme}>
                  <div>
                    <label className="section-kicker mb-2 block" htmlFor="theme-name">Name</label>
                    <input
                      id="theme-name"
                      className="input-field"
                      value={themeForm.name}
                      onChange={(event) => setThemeForm({ ...themeForm, name: event.target.value })}
                    />
                  </div>

                  <div>
                    <label className="section-kicker mb-2 block" htmlFor="theme-description">Description</label>
                    <textarea
                      id="theme-description"
                      className="input-field min-h-[90px]"
                      value={themeForm.description || ''}
                      onChange={(event) => setThemeForm({ ...themeForm, description: event.target.value })}
                    />
                  </div>

                  <div>
                    <label className="section-kicker mb-2 block" htmlFor="theme-status">Status</label>
                    <select
                      id="theme-status"
                      className="input-field"
                      value={themeForm.status}
                      onChange={(event) => setThemeForm({ ...themeForm, status: event.target.value })}
                    >
                      {THEME_STATUS_OPTIONS.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button className="button-primary" type="submit">
                      {selectedThemeId ? 'Save Theme' : 'Create Theme'}
                    </button>
                    {selectedThemeId && (
                      <button type="button" className="button-secondary" onClick={resetThemeForm}>Clear Selection</button>
                    )}
                  </div>
                </form>
              </section>
            </div>
          )}

          {activeTab === 'drivers' && (
            <div className="mt-6 grid gap-6 lg:grid-cols-5">
              <section className="lg:col-span-3 space-y-4">
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white/80">
                  <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50 text-left">
                      <tr>
                        <th className="px-4 py-3 font-semibold text-slate-700">Title</th>
                        <th className="px-4 py-3 font-semibold text-slate-700">Category</th>
                        <th className="px-4 py-3 font-semibold text-slate-700">Impact</th>
                        <th className="px-4 py-3 font-semibold text-slate-700">Time Horizon</th>
                        <th className="px-4 py-3 font-semibold text-slate-700">Owner</th>
                        <th className="px-4 py-3 font-semibold text-slate-700">Status</th>
                        <th className="px-4 py-3 font-semibold text-slate-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {drivers.length === 0 ? (
                        <tr>
                          <td className="px-4 py-6 text-slate-600" colSpan={7}>No drivers created yet.</td>
                        </tr>
                      ) : (
                        drivers.map((driver) => (
                          <tr key={driver.id} className="align-top">
                            <td className="px-4 py-3 font-semibold text-slate-900">{driver.title}</td>
                            <td className="px-4 py-3 text-slate-700">{driver.category}</td>
                            <td className="px-4 py-3 text-slate-700">{driver.impact_level}</td>
                            <td className="px-4 py-3 text-slate-700">{driver.time_horizon}</td>
                            <td className="px-4 py-3 text-slate-700">{driver.owner_organization_name || driver.owner_organization_id}</td>
                            <td className="px-4 py-3 text-slate-700">{driver.status}</td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-2">
                                <button type="button" className="button-secondary" onClick={() => handleEditDriver(driver)}>Edit</button>
                                <button
                                  type="button"
                                  className="button-secondary text-rose-700 hover:border-rose-200 hover:bg-rose-50"
                                  onClick={() => void handleArchiveDriver(driver.id)}
                                  disabled={driver.status === 'Archived'}
                                >
                                  Archive
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {Object.entries(groupedDrivers).length === 0 ? (
                    <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600 sm:col-span-2 xl:col-span-3">
                      Category grouping will appear as drivers are added.
                    </p>
                  ) : (
                    Object.entries(groupedDrivers).map(([category, categoryDrivers]) => (
                      <div key={category} className="rounded-2xl border border-cyan-100 bg-cyan-50/60 p-4">
                        <p className="section-kicker text-cyan-800">{category}</p>
                        <p className="mt-1 text-2xl font-semibold text-slate-900">{categoryDrivers.length}</p>
                        <p className="mt-2 text-xs text-slate-600">
                          {categoryDrivers.slice(0, 2).map((item) => item.title).join(' • ')}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </section>

              <section className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white/80 p-5">
                <p className="section-kicker mb-3">{selectedDriverId ? 'Edit Driver' : 'Create Driver'}</p>
                <form className="space-y-3" onSubmit={handleSaveDriver}>
                  <div>
                    <label className="section-kicker mb-2 block" htmlFor="driver-title">Title</label>
                    <input
                      id="driver-title"
                      className="input-field"
                      value={driverForm.title}
                      onChange={(event) => setDriverForm({ ...driverForm, title: event.target.value })}
                    />
                  </div>

                  <div>
                    <label className="section-kicker mb-2 block" htmlFor="driver-description">Description</label>
                    <textarea
                      id="driver-description"
                      className="input-field min-h-[84px]"
                      value={driverForm.description}
                      onChange={(event) => setDriverForm({ ...driverForm, description: event.target.value })}
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="section-kicker mb-2 block" htmlFor="driver-category">Category</label>
                      <select
                        id="driver-category"
                        className="input-field"
                        value={driverForm.category}
                        onChange={(event) => setDriverForm({ ...driverForm, category: event.target.value })}
                      >
                        {DRIVER_CATEGORY_OPTIONS.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="section-kicker mb-2 block" htmlFor="driver-impact">Impact</label>
                      <select
                        id="driver-impact"
                        className="input-field"
                        value={driverForm.impact_level}
                        onChange={(event) => setDriverForm({ ...driverForm, impact_level: event.target.value })}
                      >
                        {DRIVER_IMPACT_OPTIONS.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="section-kicker mb-2 block" htmlFor="driver-horizon">Time Horizon</label>
                      <select
                        id="driver-horizon"
                        className="input-field"
                        value={driverForm.time_horizon}
                        onChange={(event) => setDriverForm({ ...driverForm, time_horizon: event.target.value })}
                      >
                        {DRIVER_HORIZON_OPTIONS.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="section-kicker mb-2 block" htmlFor="driver-status">Status</label>
                      <select
                        id="driver-status"
                        className="input-field"
                        value={driverForm.status}
                        onChange={(event) => setDriverForm({ ...driverForm, status: event.target.value })}
                      >
                        {DRIVER_STATUS_OPTIONS.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="section-kicker mb-2 block" htmlFor="driver-owner">Owner Organization</label>
                    <select
                      id="driver-owner"
                      className="input-field"
                      value={driverForm.owner_organization_id}
                      onChange={(event) => setDriverForm({ ...driverForm, owner_organization_id: event.target.value })}
                    >
                      <option value="">Select owner organization</option>
                      {organizations.map((organization) => (
                        <option key={organization.id} value={organization.id}>{organization.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="section-kicker mb-2 block" htmlFor="driver-theme">Strategic Theme</label>
                    <select
                      id="driver-theme"
                      className="input-field"
                      value={driverForm.strategic_theme_id}
                      onChange={(event) => setDriverForm({ ...driverForm, strategic_theme_id: event.target.value })}
                    >
                      <option value="">Unassigned</option>
                      {strategicThemes.map((theme) => (
                        <option key={theme.id} value={theme.id}>{theme.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    <button className="button-primary" type="submit">{selectedDriverId ? 'Save Driver' : 'Create Driver'}</button>
                    {selectedDriverId && (
                      <button type="button" className="button-secondary" onClick={resetDriverForm}>Clear Selection</button>
                    )}
                  </div>
                </form>
              </section>
            </div>
          )}

          {activeTab === 'strategic_questions' && (
            <div className="mt-6 grid gap-6 lg:grid-cols-5">
              <section className="lg:col-span-3 space-y-4">
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white/80">
                  <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50 text-left">
                      <tr>
                        <th className="px-4 py-3 font-semibold text-slate-700">Question</th>
                        <th className="px-4 py-3 font-semibold text-slate-700">Priority</th>
                        <th className="px-4 py-3 font-semibold text-slate-700">Lead Organization</th>
                        <th className="px-4 py-3 font-semibold text-slate-700">Status</th>
                        <th className="px-4 py-3 font-semibold text-slate-700">Drivers Linked</th>
                        <th className="px-4 py-3 font-semibold text-slate-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {strategicQuestions.length === 0 ? (
                        <tr>
                          <td className="px-4 py-6 text-slate-600" colSpan={6}>No strategic questions created yet.</td>
                        </tr>
                      ) : (
                        strategicQuestions.map((question) => (
                          <tr key={question.id} className="align-top">
                            <td className="px-4 py-3 font-semibold text-slate-900">{question.title}</td>
                            <td className="px-4 py-3 text-slate-700">{question.priority}</td>
                            <td className="px-4 py-3 text-slate-700">{question.lead_organization_name || question.lead_organization_id}</td>
                            <td className="px-4 py-3 text-slate-700">{question.status}</td>
                            <td className="px-4 py-3 text-slate-700">{question.drivers_linked}</td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-2">
                                <button type="button" className="button-secondary" onClick={() => void handleSelectQuestion(question)}>Edit</button>
                                <button
                                  type="button"
                                  className="button-secondary text-rose-700 hover:border-rose-200 hover:bg-rose-50"
                                  onClick={() => void handleArchiveQuestion(question.id)}
                                  disabled={question.status === 'Archived'}
                                >
                                  Archive
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-5 text-sm text-slate-600">
                  Objectives will be created from Strategic Questions in a future release.
                </div>
              </section>

              <section className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white/80 p-5 space-y-5">
                <div>
                  <p className="section-kicker mb-3">{selectedQuestionId ? 'Edit Strategic Question' : 'Create Strategic Question'}</p>
                  <form className="space-y-3" onSubmit={handleSaveQuestion}>
                    <div>
                      <label className="section-kicker mb-2 block" htmlFor="question-title">Question</label>
                      <input
                        id="question-title"
                        className="input-field"
                        value={questionForm.title}
                        onChange={(event) => setQuestionForm({ ...questionForm, title: event.target.value })}
                      />
                    </div>

                    <div>
                      <label className="section-kicker mb-2 block" htmlFor="question-description">Description</label>
                      <textarea
                        id="question-description"
                        className="input-field min-h-[84px]"
                        value={questionForm.description}
                        onChange={(event) => setQuestionForm({ ...questionForm, description: event.target.value })}
                      />
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="section-kicker mb-2 block" htmlFor="question-priority">Priority</label>
                        <select
                          id="question-priority"
                          className="input-field"
                          value={questionForm.priority}
                          onChange={(event) => setQuestionForm({ ...questionForm, priority: event.target.value })}
                        >
                          {QUESTION_PRIORITY_OPTIONS.map((option) => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="section-kicker mb-2 block" htmlFor="question-status">Status</label>
                        <select
                          id="question-status"
                          className="input-field"
                          value={questionForm.status}
                          onChange={(event) => setQuestionForm({ ...questionForm, status: event.target.value })}
                        >
                          {QUESTION_STATUS_OPTIONS.map((option) => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="section-kicker mb-2 block" htmlFor="question-lead">Lead Organization</label>
                      <select
                        id="question-lead"
                        className="input-field"
                        value={questionForm.lead_organization_id}
                        onChange={(event) => setQuestionForm({ ...questionForm, lead_organization_id: event.target.value })}
                      >
                        <option value="">Select lead organization</option>
                        {organizations.map((organization) => (
                          <option key={organization.id} value={organization.id}>{organization.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="section-kicker mb-2 block" htmlFor="question-theme">Strategic Theme</label>
                      <select
                        id="question-theme"
                        className="input-field"
                        value={questionForm.strategic_theme_id}
                        onChange={(event) => setQuestionForm({ ...questionForm, strategic_theme_id: event.target.value })}
                      >
                        <option value="">Unassigned</option>
                        {strategicThemes.map((theme) => (
                          <option key={theme.id} value={theme.id}>{theme.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      <button className="button-primary" type="submit">
                        {selectedQuestionId ? 'Save Question' : 'Create Question'}
                      </button>
                      {selectedQuestionId && (
                        <button type="button" className="button-secondary" onClick={resetQuestionForm}>Clear Selection</button>
                      )}
                    </div>
                  </form>
                </div>

                <div className="border-t border-slate-200 pt-4">
                  <p className="section-kicker mb-3">Linked Drivers</p>

                  {!selectedQuestionId ? (
                    <p className="text-sm text-slate-600">Select a strategic question to attach or detach drivers.</p>
                  ) : (
                    <>
                      <form className="flex flex-wrap items-end gap-3" onSubmit={handleAttachDriver}>
                        <div className="min-w-[240px] flex-1">
                          <label className="section-kicker mb-2 block" htmlFor="question-driver-link">Attach Driver</label>
                          <select
                            id="question-driver-link"
                            className="input-field"
                            value={driverToLinkId}
                            onChange={(event) => setDriverToLinkId(event.target.value)}
                          >
                            <option value="">Select driver</option>
                            {availableDriversToLink.map((driver) => (
                              <option key={driver.id} value={driver.id}>{driver.title}</option>
                            ))}
                          </select>
                        </div>
                        <button className="button-primary" type="submit" disabled={!driverToLinkId}>Attach</button>
                      </form>

                      <div className="mt-3 space-y-2">
                        {linkedDrivers.length === 0 ? (
                          <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm text-slate-600">
                            No drivers linked.
                          </p>
                        ) : (
                          linkedDrivers.map((link) => (
                            <div key={link.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3">
                              <div>
                                <p className="text-sm font-semibold text-slate-900">{link.driver_title}</p>
                                <p className="text-xs text-slate-600">{link.driver_status || 'Unknown status'}</p>
                              </div>
                              <button
                                type="button"
                                className="button-secondary text-rose-700 hover:border-rose-200 hover:bg-rose-50"
                                onClick={() => void handleDetachDriver(link.driver_id)}
                              >
                                Detach
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </>
                  )}
                </div>
              </section>
            </div>
          )}

          {activeTab === 'objectives' && (
            <div className="mt-6 grid gap-6 lg:grid-cols-5">
              <section className="lg:col-span-3 space-y-4">
                <div className="space-y-4">
                  {strategicQuestions.length === 0 ? (
                    <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600">
                      Create a strategic question before creating objectives.
                    </p>
                  ) : (
                    strategicQuestions.map((question) => {
                      const questionObjectives = objectivesByQuestion[question.id] || []
                      return (
                        <div key={question.id} className="rounded-2xl border border-slate-200 bg-white/80 p-4">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="section-kicker">Question</p>
                              <p className="mt-1 font-semibold text-slate-900">{question.title}</p>
                            </div>
                            <button type="button" className="button-secondary" onClick={() => void handleSelectQuestion(question)}>
                              Open Question
                            </button>
                          </div>

                          <div className="mt-3 rounded-xl border border-cyan-100 bg-cyan-50/60 px-3 py-2 text-sm text-cyan-900">
                            {'Traceability: Driver -> Question -> Objective'}
                          </div>

                          <div className="mt-3 space-y-2">
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Objectives</p>
                            {questionObjectives.length === 0 ? (
                              <p className="text-sm text-slate-600">No objectives linked yet.</p>
                            ) : (
                              questionObjectives.map((objective) => (
                                <div key={objective.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2">
                                  <div>
                                    <p className="text-sm font-semibold text-slate-900">{objective.title}</p>
                                    <p className="text-xs text-slate-600">
                                      {objective.objective_type} • {objective.priority} • {objective.status}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                      {(choicesByObjective[objective.id] || []).length} choices loaded
                                    </p>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    <button type="button" className="button-secondary" onClick={() => void handleSelectObjective(objective)}>
                                      Open Objective
                                    </button>
                                    <button
                                      type="button"
                                      className="button-secondary text-rose-700 hover:border-rose-200 hover:bg-rose-50"
                                      onClick={() => void handleArchiveObjective(objective.id)}
                                      disabled={objective.status === 'Archived'}
                                    >
                                      Archive
                                    </button>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>

                          <div className="mt-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Drivers</p>
                            <p className="mt-1 text-sm text-slate-600">
                              {question.drivers_linked > 0
                                ? `${question.drivers_linked} linked driver${question.drivers_linked === 1 ? '' : 's'}`
                                : 'No drivers currently linked to this question.'}
                            </p>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </section>

              <section className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white/80 p-5 space-y-5">
                <p className="section-kicker mb-3">{selectedObjectiveId ? 'Edit Objective' : 'Create Objective'}</p>
                <form className="space-y-3" onSubmit={handleSaveObjective}>
                  <div>
                    <label className="section-kicker mb-2 block" htmlFor="objective-title">Title</label>
                    <input
                      id="objective-title"
                      className="input-field"
                      value={objectiveForm.title}
                      onChange={(event) => setObjectiveForm({ ...objectiveForm, title: event.target.value })}
                    />
                  </div>

                  <div>
                    <label className="section-kicker mb-2 block" htmlFor="objective-description">Description</label>
                    <textarea
                      id="objective-description"
                      className="input-field min-h-[84px]"
                      value={objectiveForm.description || ''}
                      onChange={(event) => setObjectiveForm({ ...objectiveForm, description: event.target.value })}
                    />
                  </div>

                  <div>
                    <label className="section-kicker mb-2 block" htmlFor="objective-question">Linked Question</label>
                    <select
                      id="objective-question"
                      className="input-field"
                      value={objectiveForm.strategic_question_id}
                      onChange={(event) => setObjectiveForm({ ...objectiveForm, strategic_question_id: event.target.value })}
                    >
                      <option value="">Select strategic question</option>
                      {strategicQuestions.map((question) => (
                        <option key={question.id} value={question.id}>{question.title}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="section-kicker mb-2 block" htmlFor="objective-type">Objective Type</label>
                      <select
                        id="objective-type"
                        className="input-field"
                        value={objectiveForm.objective_type}
                        onChange={(event) => setObjectiveForm({ ...objectiveForm, objective_type: event.target.value })}
                      >
                        {OBJECTIVE_TYPE_OPTIONS.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="section-kicker mb-2 block" htmlFor="objective-owner">Owner Organization</label>
                      <select
                        id="objective-owner"
                        className="input-field"
                        value={objectiveForm.owner_organization_id}
                        onChange={(event) => setObjectiveForm({ ...objectiveForm, owner_organization_id: event.target.value })}
                      >
                        <option value="">Select owner organization</option>
                        {organizations.map((organization) => (
                          <option key={organization.id} value={organization.id}>{organization.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="section-kicker mb-2 block" htmlFor="objective-priority">Priority</label>
                      <select
                        id="objective-priority"
                        className="input-field"
                        value={objectiveForm.priority}
                        onChange={(event) => setObjectiveForm({ ...objectiveForm, priority: event.target.value })}
                      >
                        {OBJECTIVE_PRIORITY_OPTIONS.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="section-kicker mb-2 block" htmlFor="objective-theme">Strategic Theme</label>
                      <select
                        id="objective-theme"
                        className="input-field"
                        value={objectiveForm.strategic_theme_id || ''}
                        onChange={(event) => setObjectiveForm({ ...objectiveForm, strategic_theme_id: event.target.value })}
                      >
                        <option value="">Unassigned</option>
                        {strategicThemes.map((theme) => (
                          <option key={theme.id} value={theme.id}>{theme.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="section-kicker mb-2 block" htmlFor="objective-status">Status</label>
                      <select
                        id="objective-status"
                        className="input-field"
                        value={objectiveForm.status}
                        onChange={(event) => setObjectiveForm({ ...objectiveForm, status: event.target.value })}
                      >
                        {OBJECTIVE_STATUS_OPTIONS.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="section-kicker mb-2 block" htmlFor="objective-target-date">Target Date</label>
                    <input
                      id="objective-target-date"
                      type="date"
                      className="input-field"
                      value={objectiveForm.target_date || ''}
                      onChange={(event) => setObjectiveForm({ ...objectiveForm, target_date: event.target.value })}
                    />
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    <button className="button-primary" type="submit">{selectedObjectiveId ? 'Save Objective' : 'Create Objective'}</button>
                    {selectedObjectiveId && (
                      <button type="button" className="button-secondary" onClick={resetObjectiveForm}>Clear Selection</button>
                    )}
                  </div>
                </form>

                <div className="border-t border-slate-200 pt-4">
                  <p className="section-kicker mb-3">Choices</p>

                  {!selectedObjectiveId ? (
                    <p className="text-sm text-slate-600">Select an objective to manage strategic choices.</p>
                  ) : (
                    <>
                      <div className="mb-3 rounded-xl border border-cyan-100 bg-cyan-50/60 px-3 py-2 text-xs text-cyan-900">
                        {`Traceability: Driver -> Question -> Objective -> Choice -> Agreement`}
                        {selectedObjectiveQuestion ? ` | Question: ${selectedObjectiveQuestion.title}` : ''}
                      </div>

                      <form className="space-y-3" onSubmit={handleSaveChoice}>
                        <div>
                          <label className="section-kicker mb-2 block" htmlFor="choice-title">Title</label>
                          <input
                            id="choice-title"
                            className="input-field"
                            value={choiceForm.title}
                            onChange={(event) => setChoiceForm({ ...choiceForm, title: event.target.value })}
                          />
                        </div>

                        <div>
                          <label className="section-kicker mb-2 block" htmlFor="choice-description">Description</label>
                          <textarea
                            id="choice-description"
                            className="input-field min-h-[84px]"
                            value={choiceForm.description || ''}
                            onChange={(event) => setChoiceForm({ ...choiceForm, description: event.target.value })}
                          />
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <div>
                            <label className="section-kicker mb-2 block" htmlFor="choice-type">Type</label>
                            <select
                              id="choice-type"
                              className="input-field"
                              value={choiceForm.choice_type}
                              onChange={(event) => setChoiceForm({ ...choiceForm, choice_type: event.target.value })}
                            >
                              {CHOICE_TYPE_OPTIONS.map((option) => (
                                <option key={option} value={option}>{option}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="section-kicker mb-2 block" htmlFor="choice-status">Status</label>
                            <select
                              id="choice-status"
                              className="input-field"
                              value={choiceForm.status}
                              onChange={(event) => setChoiceForm({ ...choiceForm, status: event.target.value })}
                            >
                              {CHOICE_STATUS_OPTIONS.map((option) => (
                                <option key={option} value={option}>{option}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="section-kicker mb-2 block" htmlFor="choice-recommendation">Recommendation</label>
                            <select
                              id="choice-recommendation"
                              className="input-field"
                              value={choiceForm.recommendation}
                              onChange={(event) => setChoiceForm({ ...choiceForm, recommendation: event.target.value })}
                            >
                              {CHOICE_RECOMMENDATION_OPTIONS.map((option) => (
                                <option key={option} value={option}>{option}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="section-kicker mb-2 block" htmlFor="choice-owner">Owner Organization</label>
                            <select
                              id="choice-owner"
                              className="input-field"
                              value={choiceForm.owner_organization_id}
                              onChange={(event) => setChoiceForm({ ...choiceForm, owner_organization_id: event.target.value })}
                            >
                              <option value="">Select owner organization</option>
                              {organizations.map((organization) => (
                                <option key={organization.id} value={organization.id}>{organization.name}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="section-kicker mb-2 block" htmlFor="choice-theme">Strategic Theme</label>
                            <select
                              id="choice-theme"
                              className="input-field"
                              value={choiceForm.strategic_theme_id || ''}
                              onChange={(event) => setChoiceForm({ ...choiceForm, strategic_theme_id: event.target.value })}
                            >
                              <option value="">Unassigned</option>
                              {strategicThemes.map((theme) => (
                                <option key={theme.id} value={theme.id}>{theme.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 pt-1">
                          <button className="button-primary" type="submit">{selectedChoiceId ? 'Save Choice' : 'Create Choice'}</button>
                          {selectedChoiceId && (
                            <button
                              type="button"
                              className="button-secondary"
                              onClick={() => {
                                setSelectedChoiceId('')
                                setCapabilityToLinkId('')
                                setSelectedAgreementId('')
                                setChoiceDetailTab('details')
                                setChoiceForm({
                                  ...EMPTY_CHOICE_FORM,
                                  planning_cycle_id: cycleId || '',
                                  strategic_objective_id: selectedObjectiveId,
                                  owner_organization_id: objectiveForm.owner_organization_id || cycle?.owner_organization_id || '',
                                })
                                setAgreementForm({
                                  ...EMPTY_AGREEMENT_FORM,
                                  planning_cycle_id: cycleId || '',
                                  strategic_choice_id: '',
                                  owner_organization_id: objectiveForm.owner_organization_id || cycle?.owner_organization_id || '',
                                })
                                setNewCapabilityForm({
                                  ...EMPTY_CAPABILITY_FORM,
                                  owner_organization_id: objectiveForm.owner_organization_id || cycle?.owner_organization_id || '',
                                })
                              }}
                            >
                              Clear Choice Selection
                            </button>
                          )}
                        </div>
                      </form>

                      <div className="mt-4 space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Objective Choices</p>
                        {selectedObjectiveChoices.length === 0 ? (
                          <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm text-slate-600">
                            No choices linked to this objective.
                          </p>
                        ) : (
                          selectedObjectiveChoices.map((choice) => (
                            <div key={choice.id} className="rounded-xl border border-slate-200 bg-white p-3">
                              <div className="flex flex-wrap items-start justify-between gap-2">
                                <div>
                                  <p className="text-sm font-semibold text-slate-900">{choice.title}</p>
                                  <p className="text-xs text-slate-600">
                                    {choice.choice_type} • {choice.status} • {choice.recommendation}
                                  </p>
                                </div>
                                <div className="flex gap-2">
                                  <button type="button" className="button-secondary" onClick={() => handleEditChoice(choice)}>
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    className="button-secondary"
                                    onClick={() => {
                                      handleEditChoice(choice)
                                      setChoiceDetailTab('initiatives')
                                      void refreshInitiativesForChoice(selectedObjectiveId, choice.id)
                                    }}
                                  >
                                    Initiatives
                                  </button>
                                  <button
                                    type="button"
                                    className="button-secondary"
                                    onClick={() => {
                                      handleEditChoice(choice)
                                      setChoiceDetailTab('agreements')
                                      void refreshAgreementsForChoice(selectedObjectiveId, choice.id)
                                    }}
                                  >
                                    Agreements
                                  </button>
                                  <button
                                    type="button"
                                    className="button-secondary text-rose-700 hover:border-rose-200 hover:bg-rose-50"
                                    onClick={() => void handleArchiveChoice(choice.id)}
                                    disabled={choice.status === 'Archived'}
                                  >
                                    Archive
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Choice Detail</p>
                        {!selectedChoiceId ? (
                          <p className="mt-2 text-sm text-slate-600">Select a choice to open detail tabs.</p>
                        ) : (
                          <>
                            <div className="mt-2 flex flex-wrap gap-2 border-b border-slate-200 pb-2">
                              <button
                                type="button"
                                className={`button-secondary ${choiceDetailTab === 'details' ? 'bg-cyan-50 border-cyan-300' : ''}`}
                                onClick={() => setChoiceDetailTab('details')}
                              >
                                Details
                              </button>
                              <button
                                type="button"
                                className={`button-secondary ${choiceDetailTab === 'initiatives' ? 'bg-cyan-50 border-cyan-300' : ''}`}
                                onClick={() => {
                                  setChoiceDetailTab('initiatives')
                                  void refreshInitiativesForChoice(selectedObjectiveId, selectedChoiceId)
                                }}
                              >
                                Initiatives
                              </button>
                              <button
                                type="button"
                                className={`button-secondary ${choiceDetailTab === 'agreements' ? 'bg-cyan-50 border-cyan-300' : ''}`}
                                onClick={() => {
                                  setChoiceDetailTab('agreements')
                                  void refreshAgreementsForChoice(selectedObjectiveId, selectedChoiceId)
                                }}
                              >
                                Agreements
                              </button>
                            </div>

                            {choiceDetailTab === 'details' ? (
                              <div className="mt-3 space-y-3 text-sm text-slate-700">
                                <div>
                                  <p className="font-semibold text-slate-900">{selectedChoice?.title}</p>
                                  <p className="text-xs text-slate-600">
                                    {selectedChoice?.choice_type} • {selectedChoice?.status} • {selectedChoice?.recommendation}
                                  </p>
                                  <p className="mt-2 text-xs text-slate-500">
                                    Agreements linked: {selectedChoiceId ? (agreementsByChoice[selectedChoiceId] || []).length : 0}
                                  </p>
                                </div>

                                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Required Capabilities</p>
                                  <form className="mt-2 flex flex-wrap items-end gap-2" onSubmit={handleAttachCapability}>
                                    <div className="min-w-[220px] flex-1">
                                      <label className="section-kicker mb-2 block" htmlFor="choice-capability-link">Link Existing Capability</label>
                                      <select
                                        id="choice-capability-link"
                                        className="input-field"
                                        value={capabilityToLinkId}
                                        onChange={(event) => setCapabilityToLinkId(event.target.value)}
                                      >
                                        <option value="">Select capability</option>
                                        {availableCapabilitiesToLink.map((capability) => (
                                          <option key={capability.id} value={capability.id}>{capability.name}</option>
                                        ))}
                                      </select>
                                    </div>
                                    <button className="button-primary" type="submit" disabled={!capabilityToLinkId}>Attach</button>
                                  </form>

                                  <form className="mt-4 space-y-3 rounded-xl border border-slate-200 bg-white p-3" onSubmit={handleCreateAndLinkCapability}>
                                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Create New Capability</p>
                                    <div>
                                      <label className="section-kicker mb-2 block" htmlFor="new-capability-name">Name</label>
                                      <input
                                        id="new-capability-name"
                                        className="input-field"
                                        value={newCapabilityForm.name}
                                        onChange={(event) => setNewCapabilityForm({ ...newCapabilityForm, name: event.target.value })}
                                      />
                                    </div>
                                    <div>
                                      <label className="section-kicker mb-2 block" htmlFor="new-capability-description">Description</label>
                                      <textarea
                                        id="new-capability-description"
                                        className="input-field min-h-[72px]"
                                        value={newCapabilityForm.description || ''}
                                        onChange={(event) => setNewCapabilityForm({ ...newCapabilityForm, description: event.target.value })}
                                      />
                                    </div>
                                    <div className="grid gap-3 sm:grid-cols-2">
                                      <div>
                                        <label className="section-kicker mb-2 block" htmlFor="new-capability-category">Category</label>
                                        <select
                                          id="new-capability-category"
                                          className="input-field"
                                          value={newCapabilityForm.category}
                                          onChange={(event) => setNewCapabilityForm({ ...newCapabilityForm, category: event.target.value })}
                                        >
                                          {CAPABILITY_CATEGORY_OPTIONS.map((option) => (
                                            <option key={option} value={option}>{option}</option>
                                          ))}
                                        </select>
                                      </div>
                                      <div>
                                        <label className="section-kicker mb-2 block" htmlFor="new-capability-status">Status</label>
                                        <select
                                          id="new-capability-status"
                                          className="input-field"
                                          value={newCapabilityForm.status}
                                          onChange={(event) => setNewCapabilityForm({ ...newCapabilityForm, status: event.target.value })}
                                        >
                                          {CAPABILITY_STATUS_OPTIONS.map((option) => (
                                            <option key={option} value={option}>{option}</option>
                                          ))}
                                        </select>
                                      </div>
                                    </div>
                                    <div>
                                      <label className="section-kicker mb-2 block" htmlFor="new-capability-owner">Owner Organization</label>
                                      <select
                                        id="new-capability-owner"
                                        className="input-field"
                                        value={newCapabilityForm.owner_organization_id}
                                        onChange={(event) => setNewCapabilityForm({ ...newCapabilityForm, owner_organization_id: event.target.value })}
                                      >
                                        <option value="">Select owner organization</option>
                                        {organizations.map((organization) => (
                                          <option key={organization.id} value={organization.id}>{organization.name}</option>
                                        ))}
                                      </select>
                                    </div>
                                    <button className="button-primary" type="submit">Create And Link</button>
                                  </form>

                                  <div className="mt-3 rounded-xl border border-cyan-100 bg-cyan-50/60 px-3 py-2 text-xs text-cyan-900">
                                    {'Dependency View: Objective -> Choice -> Capability'}
                                    {selectedObjective?.title ? ` | ${selectedObjective.title}` : ''}
                                    {selectedChoice?.title ? ` -> ${selectedChoice.title}` : ''}
                                  </div>

                                  <div className="mt-3 space-y-2">
                                    {selectedChoiceCapabilities.length === 0 ? (
                                      <p className="text-sm text-slate-600">No required capabilities linked to this choice.</p>
                                    ) : (
                                      selectedChoiceCapabilities.map((capability) => (
                                        <div key={capability.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2">
                                          <div>
                                            <p className="text-sm font-semibold text-slate-900">{capability.name}</p>
                                            <p className="text-xs text-slate-600">{capability.category} • {capability.status}</p>
                                            <p className="text-xs text-cyan-800">
                                              {selectedObjective?.title || 'Objective'}
                                              {' -> '}
                                              {selectedChoice?.title || 'Choice'}
                                              {' -> '}
                                              {capability.name}
                                            </p>
                                          </div>
                                          <button
                                            type="button"
                                            className="button-secondary text-rose-700 hover:border-rose-200 hover:bg-rose-50"
                                            onClick={() => void handleDetachCapability(capability.id)}
                                          >
                                            Detach
                                          </button>
                                        </div>
                                      ))
                                    )}
                                  </div>
                                </div>
                              </div>
                            ) : choiceDetailTab === 'initiatives' ? (
                              <div className="mt-3 space-y-3">
                                <div className="rounded-xl border border-cyan-100 bg-cyan-50/60 px-3 py-2 text-xs text-cyan-900">
                                  {'Traceability: Driver -> Question -> Objective -> Choice -> Initiative'}
                                </div>

                                <form className="space-y-3" onSubmit={handleSaveInitiative}>
                                  <div>
                                    <label className="section-kicker mb-2 block" htmlFor="initiative-name">Name</label>
                                    <input
                                      id="initiative-name"
                                      className="input-field"
                                      value={initiativeForm.name}
                                      onChange={(event) => setInitiativeForm({ ...initiativeForm, name: event.target.value })}
                                    />
                                  </div>

                                  <div>
                                    <label className="section-kicker mb-2 block" htmlFor="initiative-description">Description</label>
                                    <textarea
                                      id="initiative-description"
                                      className="input-field min-h-[84px]"
                                      value={initiativeForm.description || ''}
                                      onChange={(event) => setInitiativeForm({ ...initiativeForm, description: event.target.value })}
                                    />
                                  </div>

                                  <div className="grid gap-3 sm:grid-cols-2">
                                    <div>
                                      <label className="section-kicker mb-2 block" htmlFor="initiative-status">Status</label>
                                      <select
                                        id="initiative-status"
                                        className="input-field"
                                        value={initiativeForm.status}
                                        onChange={(event) => setInitiativeForm({ ...initiativeForm, status: event.target.value })}
                                      >
                                        {INITIATIVE_STATUS_OPTIONS.map((option) => (
                                          <option key={option} value={option}>{option}</option>
                                        ))}
                                      </select>
                                    </div>

                                    <div>
                                      <label className="section-kicker mb-2 block" htmlFor="initiative-budget">Budget</label>
                                      <input
                                        id="initiative-budget"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        className="input-field"
                                        value={initiativeForm.budget ?? ''}
                                        onChange={(event) => {
                                          const value = event.target.value
                                          setInitiativeForm({
                                            ...initiativeForm,
                                            budget: value === '' ? undefined : Number(value),
                                          })
                                        }}
                                      />
                                    </div>

                                    <div>
                                      <label className="section-kicker mb-2 block" htmlFor="initiative-start-date">Start Date</label>
                                      <input
                                        id="initiative-start-date"
                                        type="date"
                                        className="input-field"
                                        value={initiativeForm.start_date || ''}
                                        onChange={(event) => setInitiativeForm({ ...initiativeForm, start_date: event.target.value })}
                                      />
                                    </div>

                                    <div>
                                      <label className="section-kicker mb-2 block" htmlFor="initiative-end-date">End Date</label>
                                      <input
                                        id="initiative-end-date"
                                        type="date"
                                        className="input-field"
                                        value={initiativeForm.end_date || ''}
                                        onChange={(event) => setInitiativeForm({ ...initiativeForm, end_date: event.target.value })}
                                      />
                                    </div>

                                    <div className="sm:col-span-2">
                                      <label className="section-kicker mb-2 block" htmlFor="initiative-owner">Owner Organization</label>
                                      <select
                                        id="initiative-owner"
                                        className="input-field"
                                        value={initiativeForm.owner_organization_id}
                                        onChange={(event) => setInitiativeForm({ ...initiativeForm, owner_organization_id: event.target.value })}
                                      >
                                        <option value="">Select owner organization</option>
                                        {organizations.map((organization) => (
                                          <option key={organization.id} value={organization.id}>{organization.name}</option>
                                        ))}
                                      </select>
                                    </div>
                                  </div>

                                  <div className="flex flex-wrap gap-2 pt-1">
                                    <button className="button-primary" type="submit">
                                      {selectedInitiativeId ? 'Save Initiative' : 'Create Initiative'}
                                    </button>
                                    {selectedInitiativeId && (
                                      <button
                                        type="button"
                                        className="button-secondary"
                                        onClick={resetInitiativeForm}
                                      >
                                        Clear Initiative Selection
                                      </button>
                                    )}
                                  </div>
                                </form>

                                <div className="space-y-2">
                                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Choice Initiatives</p>
                                  {selectedChoiceInitiatives.length === 0 ? (
                                    <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm text-slate-600">
                                      No initiatives linked to this choice.
                                    </p>
                                  ) : (
                                    selectedChoiceInitiatives.map((initiative) => (
                                      <div key={initiative.id} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                                        <div className="flex flex-wrap items-start justify-between gap-2">
                                          <div>
                                            <p className="text-sm font-semibold text-slate-900">{initiative.name}</p>
                                            <p className="text-xs text-slate-600">{initiative.status}</p>
                                          </div>
                                          <button
                                            type="button"
                                            className="button-secondary"
                                            onClick={() => handleEditInitiative(initiative)}
                                          >
                                            Edit
                                          </button>
                                        </div>
                                      </div>
                                    ))
                                  )}
                                </div>

                                {selectedInitiative && (
                                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Initiative Linkage</p>
                                    <p className="mt-2 text-sm font-semibold text-slate-900">{selectedInitiative.name}</p>

                                    <form className="mt-3 flex flex-wrap items-end gap-2" onSubmit={handleAttachCapabilityToInitiative}>
                                      <div className="min-w-[220px] flex-1">
                                        <label className="section-kicker mb-2 block" htmlFor="initiative-capability-link">Link Choice Capability</label>
                                        <select
                                          id="initiative-capability-link"
                                          className="input-field"
                                          value={initiativeCapabilityToLinkId}
                                          onChange={(event) => setInitiativeCapabilityToLinkId(event.target.value)}
                                        >
                                          <option value="">Select capability</option>
                                          {availableInitiativeCapabilitiesToLink.map((capability) => (
                                            <option key={capability.id} value={capability.id}>{capability.name}</option>
                                          ))}
                                        </select>
                                      </div>
                                      <button className="button-primary" type="submit" disabled={!initiativeCapabilityToLinkId}>Attach</button>
                                    </form>

                                    <form className="mt-3 flex flex-wrap items-end gap-2" onSubmit={handleAttachAgreementToInitiative}>
                                      <div className="min-w-[220px] flex-1">
                                        <label className="section-kicker mb-2 block" htmlFor="initiative-agreement-link">Link Choice Agreement</label>
                                        <select
                                          id="initiative-agreement-link"
                                          className="input-field"
                                          value={initiativeAgreementToLinkId}
                                          onChange={(event) => setInitiativeAgreementToLinkId(event.target.value)}
                                        >
                                          <option value="">Select agreement</option>
                                          {availableInitiativeAgreementsToLink.map((agreement) => (
                                            <option key={agreement.id} value={agreement.id}>{agreement.title}</option>
                                          ))}
                                        </select>
                                      </div>
                                      <button className="button-primary" type="submit" disabled={!initiativeAgreementToLinkId}>Attach</button>
                                    </form>

                                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                      <div>
                                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Linked Capabilities</p>
                                        {(selectedInitiativeDetail?.linked_capabilities || []).length === 0 ? (
                                          <p className="mt-2 text-sm text-slate-600">No capabilities linked yet.</p>
                                        ) : (
                                          <div className="mt-2 space-y-1">
                                            {(selectedInitiativeDetail?.linked_capabilities || []).map((item) => (
                                              <p key={item.id} className="text-sm text-slate-700">{item.capability_name}</p>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                      <div>
                                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Linked Agreements</p>
                                        {(selectedInitiativeDetail?.linked_agreements || []).length === 0 ? (
                                          <p className="mt-2 text-sm text-slate-600">No agreements linked yet.</p>
                                        ) : (
                                          <div className="mt-2 space-y-1">
                                            {(selectedInitiativeDetail?.linked_agreements || []).map((item) => (
                                              <p key={item.id} className="text-sm text-slate-700">{item.strategic_agreement_title}</p>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Outcomes</p>

                                      <form className="mt-3 space-y-3 rounded-xl border border-slate-200 bg-white p-3" onSubmit={handleSaveOutcome}>
                                        <div>
                                          <label className="section-kicker mb-2 block" htmlFor="outcome-name">Name</label>
                                          <input
                                            id="outcome-name"
                                            className="input-field"
                                            value={outcomeForm.name}
                                            onChange={(event) => setOutcomeForm({ ...outcomeForm, name: event.target.value })}
                                          />
                                        </div>

                                        <div>
                                          <label className="section-kicker mb-2 block" htmlFor="outcome-description">Description</label>
                                          <textarea
                                            id="outcome-description"
                                            className="input-field min-h-[72px]"
                                            value={outcomeForm.description || ''}
                                            onChange={(event) => setOutcomeForm({ ...outcomeForm, description: event.target.value })}
                                          />
                                        </div>

                                        <div className="flex flex-wrap gap-2 pt-1">
                                          <button className="button-primary" type="submit">
                                            {selectedOutcomeId ? 'Save Outcome' : 'Create Outcome'}
                                          </button>
                                          {selectedOutcomeId && (
                                            <button type="button" className="button-secondary" onClick={resetOutcomeForm}>
                                              Clear Outcome Selection
                                            </button>
                                          )}
                                        </div>
                                      </form>

                                      <div className="mt-3 space-y-2">
                                        {selectedInitiativeOutcomes.length === 0 ? (
                                          <p className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-4 text-sm text-slate-600">
                                            No outcomes linked to this initiative.
                                          </p>
                                        ) : (
                                          selectedInitiativeOutcomes.map((outcome) => (
                                            <div key={outcome.id} className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                                              <div className="flex flex-wrap items-start justify-between gap-2">
                                                <div>
                                                  <p className="text-sm font-semibold text-slate-900">{outcome.name}</p>
                                                  <p className="text-xs text-slate-600">{outcome.description || 'No description provided'}</p>
                                                </div>
                                                <button type="button" className="button-secondary" onClick={() => handleEditOutcome(outcome)}>
                                                  Edit
                                                </button>
                                              </div>
                                            </div>
                                          ))
                                        )}
                                      </div>

                                      {selectedOutcome && (
                                        <div className="mt-4 rounded-xl border border-cyan-200 bg-cyan-50/60 p-3">
                                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-900">Metric Tracking</p>
                                          <p className="mt-1 text-sm font-semibold text-slate-900">{selectedOutcome.name}</p>

                                          <form className="mt-3 space-y-3 rounded-xl border border-slate-200 bg-white p-3" onSubmit={handleSaveMetric}>
                                            <div>
                                              <label className="section-kicker mb-2 block" htmlFor="metric-name">Metric Name</label>
                                              <input
                                                id="metric-name"
                                                className="input-field"
                                                value={metricForm.name}
                                                onChange={(event) => setMetricForm({ ...metricForm, name: event.target.value })}
                                              />
                                            </div>

                                            <div>
                                              <label className="section-kicker mb-2 block" htmlFor="metric-description">Description</label>
                                              <textarea
                                                id="metric-description"
                                                className="input-field min-h-[64px]"
                                                value={metricForm.description}
                                                onChange={(event) => setMetricForm({ ...metricForm, description: event.target.value })}
                                              />
                                            </div>

                                            <div className="grid gap-3 sm:grid-cols-2">
                                              <div>
                                                <label className="section-kicker mb-2 block" htmlFor="metric-unit">Unit</label>
                                                <input
                                                  id="metric-unit"
                                                  className="input-field"
                                                  value={metricForm.unit}
                                                  onChange={(event) => setMetricForm({ ...metricForm, unit: event.target.value })}
                                                />
                                              </div>
                                              <div>
                                                <label className="section-kicker mb-2 block" htmlFor="metric-target-value">Target Value</label>
                                                <input
                                                  id="metric-target-value"
                                                  type="number"
                                                  className="input-field"
                                                  value={metricForm.target_value}
                                                  onChange={(event) => setMetricForm({ ...metricForm, target_value: event.target.value })}
                                                />
                                              </div>
                                              <div>
                                                <label className="section-kicker mb-2 block" htmlFor="metric-target-unit">Target Unit</label>
                                                <input
                                                  id="metric-target-unit"
                                                  className="input-field"
                                                  value={metricForm.target_unit}
                                                  onChange={(event) => setMetricForm({ ...metricForm, target_unit: event.target.value })}
                                                />
                                              </div>
                                              <div>
                                                <label className="section-kicker mb-2 block" htmlFor="metric-target-date">Target Date</label>
                                                <input
                                                  id="metric-target-date"
                                                  type="date"
                                                  className="input-field"
                                                  value={metricForm.target_date}
                                                  onChange={(event) => setMetricForm({ ...metricForm, target_date: event.target.value })}
                                                />
                                              </div>
                                              <div className="sm:col-span-2">
                                                <label className="section-kicker mb-2 block" htmlFor="metric-target-notes">Target Notes</label>
                                                <textarea
                                                  id="metric-target-notes"
                                                  className="input-field min-h-[60px]"
                                                  value={metricForm.target_notes}
                                                  onChange={(event) => setMetricForm({ ...metricForm, target_notes: event.target.value })}
                                                />
                                              </div>
                                            </div>

                                            <div className="grid gap-3 sm:grid-cols-2">
                                              <div>
                                                <label className="section-kicker mb-2 block" htmlFor="metric-actual-value">Actual Value</label>
                                                <input
                                                  id="metric-actual-value"
                                                  type="number"
                                                  className="input-field"
                                                  value={metricForm.actual_value}
                                                  onChange={(event) => setMetricForm({ ...metricForm, actual_value: event.target.value })}
                                                />
                                              </div>
                                              <div>
                                                <label className="section-kicker mb-2 block" htmlFor="metric-actual-unit">Actual Unit</label>
                                                <input
                                                  id="metric-actual-unit"
                                                  className="input-field"
                                                  value={metricForm.actual_unit}
                                                  onChange={(event) => setMetricForm({ ...metricForm, actual_unit: event.target.value })}
                                                />
                                              </div>
                                              <div>
                                                <label className="section-kicker mb-2 block" htmlFor="metric-measured-at">Measured At</label>
                                                <input
                                                  id="metric-measured-at"
                                                  type="date"
                                                  className="input-field"
                                                  value={metricForm.measured_at}
                                                  onChange={(event) => setMetricForm({ ...metricForm, measured_at: event.target.value })}
                                                />
                                              </div>
                                              <div className="sm:col-span-2">
                                                <label className="section-kicker mb-2 block" htmlFor="metric-actual-notes">Actual Notes</label>
                                                <textarea
                                                  id="metric-actual-notes"
                                                  className="input-field min-h-[60px]"
                                                  value={metricForm.actual_notes}
                                                  onChange={(event) => setMetricForm({ ...metricForm, actual_notes: event.target.value })}
                                                />
                                              </div>
                                            </div>

                                            <div className="flex flex-wrap gap-2 pt-1">
                                              <button className="button-primary" type="submit">
                                                {selectedMetricId ? 'Save Metric' : 'Create Metric'}
                                              </button>
                                              {selectedMetricId && (
                                                <button
                                                  type="button"
                                                  className="button-secondary"
                                                  onClick={() => {
                                                    setSelectedMetricId('')
                                                    setMetricForm({ ...EMPTY_METRIC_FORM })
                                                  }}
                                                >
                                                  Clear Metric Selection
                                                </button>
                                              )}
                                            </div>
                                          </form>

                                          <div className="mt-3 space-y-2">
                                            {selectedOutcomeMetrics.length === 0 ? (
                                              <p className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-4 text-sm text-slate-600">
                                                No metrics recorded for this outcome.
                                              </p>
                                            ) : (
                                              selectedOutcomeMetrics.map((metric) => {
                                                const latestActual = metric.actuals[metric.actuals.length - 1] || null
                                                return (
                                                  <div key={metric.id} className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                                                    <div className="flex flex-wrap items-start justify-between gap-2">
                                                      <div>
                                                        <p className="text-sm font-semibold text-slate-900">{metric.name}</p>
                                                        <p className="text-xs text-slate-600">
                                                          Target: {metric.target ? `${metric.target.target_value}${metric.target.target_unit ? ` ${metric.target.target_unit}` : ''}` : 'Not set'}
                                                        </p>
                                                        <p className="text-xs text-slate-600">
                                                          Latest actual: {latestActual ? `${latestActual.actual_value}${latestActual.actual_unit ? ` ${latestActual.actual_unit}` : ''}` : 'Not recorded'}
                                                        </p>
                                                      </div>
                                                      <button type="button" className="button-secondary" onClick={() => handleEditMetric(metric)}>
                                                        Edit
                                                      </button>
                                                    </div>
                                                  </div>
                                                )
                                              })
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="mt-3 space-y-3">
                                <div className="rounded-xl border border-cyan-100 bg-cyan-50/60 px-3 py-2 text-xs text-cyan-900">
                                  {`Traceability: Driver -> Question -> Objective -> Choice -> Agreement`}
                                </div>

                                <form className="space-y-3" onSubmit={handleSaveAgreement}>
                                  <div>
                                    <label className="section-kicker mb-2 block" htmlFor="agreement-title">Title</label>
                                    <input
                                      id="agreement-title"
                                      className="input-field"
                                      value={agreementForm.title}
                                      onChange={(event) => setAgreementForm({ ...agreementForm, title: event.target.value })}
                                    />
                                  </div>

                                  <div>
                                    <label className="section-kicker mb-2 block" htmlFor="agreement-description">Description</label>
                                    <textarea
                                      id="agreement-description"
                                      className="input-field min-h-[84px]"
                                      value={agreementForm.description || ''}
                                      onChange={(event) => setAgreementForm({ ...agreementForm, description: event.target.value })}
                                    />
                                  </div>

                                  <div className="grid gap-3 sm:grid-cols-2">
                                    <div>
                                      <label className="section-kicker mb-2 block" htmlFor="agreement-status">Status</label>
                                      <select
                                        id="agreement-status"
                                        className="input-field"
                                        value={agreementForm.status}
                                        onChange={(event) => setAgreementForm({ ...agreementForm, status: event.target.value })}
                                      >
                                        {AGREEMENT_STATUS_OPTIONS.map((option) => (
                                          <option key={option} value={option}>{option}</option>
                                        ))}
                                      </select>
                                    </div>

                                    <div>
                                      <label className="section-kicker mb-2 block" htmlFor="agreement-effective-date">Effective Date</label>
                                      <input
                                        id="agreement-effective-date"
                                        type="date"
                                        className="input-field"
                                        value={agreementForm.effective_date || ''}
                                        onChange={(event) => setAgreementForm({ ...agreementForm, effective_date: event.target.value })}
                                      />
                                    </div>

                                    <div className="sm:col-span-2">
                                      <label className="section-kicker mb-2 block" htmlFor="agreement-owner">Owner Organization</label>
                                      <select
                                        id="agreement-owner"
                                        className="input-field"
                                        value={agreementForm.owner_organization_id}
                                        onChange={(event) => setAgreementForm({ ...agreementForm, owner_organization_id: event.target.value })}
                                      >
                                        <option value="">Select owner organization</option>
                                        {organizations.map((organization) => (
                                          <option key={organization.id} value={organization.id}>{organization.name}</option>
                                        ))}
                                      </select>
                                    </div>
                                  </div>

                                  <div className="flex flex-wrap gap-2 pt-1">
                                    <button className="button-primary" type="submit">
                                      {selectedAgreementId ? 'Save Agreement' : 'Create Agreement'}
                                    </button>
                                    {selectedAgreementId && (
                                      <button
                                        type="button"
                                        className="button-secondary"
                                        onClick={() => {
                                          setSelectedAgreementId('')
                                          setAgreementForm({
                                            ...EMPTY_AGREEMENT_FORM,
                                            planning_cycle_id: cycleId || '',
                                            strategic_choice_id: selectedChoiceId,
                                            owner_organization_id: choiceForm.owner_organization_id || objectiveForm.owner_organization_id || '',
                                          })
                                        }}
                                      >
                                        Clear Agreement Selection
                                      </button>
                                    )}
                                  </div>
                                </form>

                                <div className="space-y-2">
                                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Choice Agreements</p>
                                  {selectedChoiceAgreements.length === 0 ? (
                                    <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm text-slate-600">
                                      No agreements linked to this choice.
                                    </p>
                                  ) : (
                                    selectedChoiceAgreements.map((agreement) => (
                                      <div key={agreement.id} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                                        <div className="flex flex-wrap items-start justify-between gap-2">
                                          <div>
                                            <p className="text-sm font-semibold text-slate-900">{agreement.title}</p>
                                            <p className="text-xs text-slate-600">
                                              {agreement.status}
                                              {agreement.effective_date ? ` • Effective ${toInputDate(agreement.effective_date)}` : ''}
                                            </p>
                                          </div>
                                          <button
                                            type="button"
                                            className="button-secondary"
                                            onClick={() => handleEditAgreement(agreement)}
                                          >
                                            Edit
                                          </button>
                                        </div>
                                      </div>
                                    ))
                                  )}
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Comparison View</p>
                        {selectedObjectiveChoices.length === 0 ? (
                          <p className="mt-2 text-sm text-slate-600">Add choices to compare strategy options.</p>
                        ) : (
                          <div className="mt-2 overflow-auto">
                            <table className="min-w-full text-xs">
                              <thead>
                                <tr className="text-left text-slate-600">
                                  <th className="py-1 pr-3">Choice</th>
                                  <th className="py-1 pr-3">Type</th>
                                  <th className="py-1 pr-3">Status</th>
                                  <th className="py-1 pr-3">Recommendation</th>
                                  <th className="py-1">Owner</th>
                                </tr>
                              </thead>
                              <tbody>
                                {selectedObjectiveChoices.map((choice, index) => (
                                  <tr key={choice.id} className="border-t border-slate-200 text-slate-700">
                                    <td className="py-1 pr-3">{`Choice ${String.fromCharCode(65 + index)}: ${choice.title}`}</td>
                                    <td className="py-1 pr-3">{choice.choice_type}</td>
                                    <td className="py-1 pr-3">{choice.status}</td>
                                    <td className="py-1 pr-3">{choice.recommendation}</td>
                                    <td className="py-1">{choice.owner_organization_name || choice.owner_organization_id}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </section>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="mt-6 space-y-6">
              <form className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 lg:grid-cols-2" onSubmit={handleSaveReview}>
                <div>
                  <label className="section-kicker mb-2 block" htmlFor="review-date">Review Date</label>
                  <input
                    id="review-date"
                    className="input-field"
                    type="date"
                    value={reviewForm.date}
                    onChange={(event) => setReviewForm((current) => ({ ...current, date: event.target.value }))}
                  />
                </div>
                <div>
                  <label className="section-kicker mb-2 block" htmlFor="review-status">Status</label>
                  <select
                    id="review-status"
                    className="input-field"
                    value={reviewForm.status}
                    onChange={(event) => setReviewForm((current) => ({ ...current, status: event.target.value }))}
                  >
                    {REVIEW_STATUS_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
                <div className="lg:col-span-2">
                  <label className="section-kicker mb-2 block" htmlFor="review-summary">Summary</label>
                  <textarea
                    id="review-summary"
                    className="input-field min-h-28"
                    value={reviewForm.summary || ''}
                    onChange={(event) => setReviewForm((current) => ({ ...current, summary: event.target.value }))}
                  />
                </div>
                <div className="lg:col-span-2">
                  <label className="section-kicker mb-2 block" htmlFor="review-recommendations">Recommendations</label>
                  <textarea
                    id="review-recommendations"
                    className="input-field min-h-28"
                    value={reviewForm.recommendations || ''}
                    onChange={(event) => setReviewForm((current) => ({ ...current, recommendations: event.target.value }))}
                  />
                </div>
                <div className="flex flex-wrap gap-2 lg:col-span-2">
                  <button type="submit" className="button-primary">
                    {selectedReviewId ? 'Update Review' : 'Create Review'}
                  </button>
                  <button type="button" className="button-secondary" onClick={resetReviewForm}>
                    Reset
                  </button>
                </div>
              </form>

              <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="section-kicker">Strategy Reviews</p>
                      <h3 className="text-lg font-semibold text-slate-900">Cycle governance checkpoints</h3>
                    </div>
                  </div>
                  {strategyReviews.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm text-slate-600">
                      No strategy reviews yet.
                    </p>
                  ) : (
                    strategyReviews.map((review) => (
                      <div key={review.id} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{toInputDate(review.date)}</p>
                            <p className="text-xs text-slate-600">{review.status}</p>
                            <p className="mt-1 text-sm text-slate-700">{review.summary || 'No summary provided.'}</p>
                          </div>
                          <button type="button" className="button-secondary" onClick={() => handleEditReview(review)}>
                            Edit
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
                  <div>
                    <p className="section-kicker">Selected Review</p>
                    <h3 className="text-lg font-semibold text-slate-900">Linked artifacts</h3>
                  </div>
                  {selectedReviewDetail ? (
                    <div className="space-y-4 text-sm text-slate-700">
                      <div className="grid grid-cols-3 gap-3">
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Objectives</p>
                          <p className="mt-1 text-lg font-semibold text-slate-900">{selectedReviewDetail.linked_objectives.length}</p>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Initiatives</p>
                          <p className="mt-1 text-lg font-semibold text-slate-900">{selectedReviewDetail.linked_initiatives.length}</p>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Outcomes</p>
                          <p className="mt-1 text-lg font-semibold text-slate-900">{selectedReviewDetail.linked_outcomes.length}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Objectives</p>
                        <ul className="mt-2 space-y-1">
                          {selectedReviewDetail.linked_objectives.map((item) => (
                            <li key={item.id} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                              {item.strategic_objective_title || item.strategic_objective_id}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Initiatives</p>
                        <ul className="mt-2 space-y-1">
                          {selectedReviewDetail.linked_initiatives.map((item) => (
                            <li key={item.id} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                              {item.initiative_name || item.initiative_id}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Outcomes</p>
                        <ul className="mt-2 space-y-1">
                          {selectedReviewDetail.linked_outcomes.map((item) => (
                            <li key={item.id} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                              {item.outcome_name || item.outcome_id}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm text-slate-600">
                      Select a review to inspect linked objectives, initiatives, and outcomes.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'timeline' && (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-sm text-slate-600">
              Planning Cycle timeline not yet implemented.
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
