import axios, { AxiosInstance, AxiosError } from 'axios'
import { getToken, refreshToken } from './keycloak'
import {
  Driver,
  DriverCreate,
  GovernanceConfig,
  OrganizationImportResult,
  OrganizationResponse,
  PlanningCycle,
  PlanningCycleCreate,
  PlanningCycleParticipant,
  PlanningCycleParticipantSuggestion,
  StrategyReview,
  StrategyReviewCreate,
  StrategyReviewDetail,
  StrategyReviewUpdate,
  StrategicTheme,
  StrategicThemeCreate,
  StrategicQuestion,
  StrategicQuestionCreate,
  StrategicQuestionDriverLink,
  StrategicObjective,
  StrategicObjectiveCreate,
  StrategicChoice,
  StrategicChoiceCreate,
  StrategicAgreement,
  StrategicAgreementCreate,
  Initiative,
  InitiativeCreate,
  InitiativeDetail,
  Outcome,
  OutcomeCreate,
  OutcomeUpdate,
  MetricDetail,
  MetricCreate,
  MetricUpdate,
  Capability,
  CapabilityAssessment,
  CapabilityAssessmentCreate,
  CapabilityCreate,
  CapabilityDetail,
  StrategicContract,
  StrategicContractCreate,
  StrategicGroup,
  StrategicGroupCreate,
  StrategicGroupMembership,
  StrategicRelationship,
  StrategicRelationshipCreate,
  UserAccountProfile,
  UserAccountProfileUpdate,
  UserActivityEvent,
  UserActivitySearchResponse,
} from '../types'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

let apiInstance: AxiosInstance | null = null

const extractApiErrorMessage = (error: unknown): string => {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error ? error.message : 'Request failed'
  }

  const detail = error.response?.data as { detail?: unknown } | undefined
  if (typeof detail?.detail === 'string' && detail.detail.trim()) {
    return detail.detail
  }

  return error.message || 'Request failed'
}

export const getApiInstance = (): AxiosInstance => {
  if (!apiInstance) {
    apiInstance = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Request interceptor to add token
    apiInstance.interceptors.request.use(
      async (config) => {
        const token = getToken()
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    // Response interceptor for token refresh and error handling
    apiInstance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config

        if (error.response?.status === 401 && originalRequest) {
          try {
            const refreshed = await refreshToken()
            if (refreshed) {
              const token = getToken()
              originalRequest.headers.Authorization = `Bearer ${token}`
              const instance = apiInstance
              if (!instance) {
                return Promise.reject(error)
              }
              return instance(originalRequest)
            }
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError)
          }
        }

        return Promise.reject(error)
      }
    )
  }

  return apiInstance
}

export const apiCall = async <T>(
  method: 'get' | 'post' | 'put' | 'delete' | 'patch',
  url: string,
  data?: unknown
): Promise<T> => {
  const api = getApiInstance()
  try {
    const response = await api[method]<T>(url, data)
    return response.data
  } catch (error) {
    throw new Error(extractApiErrorMessage(error))
  }
}

export const get = <T>(url: string): Promise<T> => apiCall('get', url)
export const post = <T>(url: string, data?: unknown): Promise<T> => apiCall('post', url, data)
export const put = <T>(url: string, data?: unknown): Promise<T> => apiCall('put', url, data)
export const patch = <T>(url: string, data?: unknown): Promise<T> => apiCall('patch', url, data)
export const del = <T>(url: string): Promise<T> => apiCall('delete', url)

// Health check
export const checkHealth = (): Promise<{ status: string }> => {
  return get('/health')
}

// User endpoints
export const getCurrentUser = (): Promise<{ id: string; username: string; email: string }> => {
  return get('/api/v1/users/me')
}

export const getUserProfile = (userId: string) => {
  return get(`/api/v1/users/${userId}`)
}

export const updateUserProfile = (userId: string, data: unknown) => {
  return put(`/api/v1/users/${userId}`, data)
}

export const getMyAccountProfile = (): Promise<UserAccountProfile> => {
  return get<UserAccountProfile>('/api/v1/users/me/account')
}

export const updateMyAccountProfile = (payload: UserAccountProfileUpdate): Promise<UserAccountProfile> => {
  return put<UserAccountProfile>('/api/v1/users/me/account', payload)
}

export const getMyUserHistory = (params?: {
  q?: string
  limit?: number
  offset?: number
}): Promise<UserActivitySearchResponse> => {
  const api = getApiInstance()
  return api
    .get<UserActivitySearchResponse>('/api/v1/users/me/history', { params })
    .then((response) => response.data)
}

export const logUserEvent = (payload: {
  action: string
  target?: string
  metadata?: Record<string, unknown>
}): Promise<UserActivityEvent> => {
  return post<UserActivityEvent>('/api/v1/users/me/events', payload)
}

export const getOrganizations = async (search?: string): Promise<OrganizationResponse[]> => {
  const api = getApiInstance()
  try {
    const response = await api.get<OrganizationResponse[]>('/api/v1/organizations', {
      params: search ? { search } : undefined,
    })
    return response.data
  } catch (error) {
    throw new Error(extractApiErrorMessage(error))
  }
}

export const createOrganization = async (payload: Record<string, unknown>): Promise<OrganizationResponse> => {
  return post<OrganizationResponse>('/api/v1/organizations', payload)
}

export const updateOrganization = async (organizationId: string, payload: Record<string, unknown>): Promise<OrganizationResponse> => {
  return put<OrganizationResponse>(`/api/v1/organizations/${organizationId}`, payload)
}

export const deleteOrganization = async (organizationId: string): Promise<OrganizationResponse> => {
  return apiCall('delete', `/api/v1/organizations/${organizationId}`)
}

export const setOrganizationRoot = async (organizationId: string): Promise<OrganizationResponse> => {
  return post<OrganizationResponse>(`/api/v1/organizations/${organizationId}/set-root`)
}

export const importOrganizations = async (csvContent: string, fullReload = false): Promise<OrganizationImportResult> => {
  return post<OrganizationImportResult>('/api/v1/organizations/import', {
    csv_content: csvContent,
    full_reload: fullReload,
  })
}

export const getGovernanceConfig = (): Promise<GovernanceConfig> => {
  return get('/api/v1/governance/config')
}

export const saveGovernanceConfig = (config: GovernanceConfig): Promise<GovernanceConfig> => {
  return put('/api/v1/governance/config', config)
}

export const getStrategicRelationships = async (nodeId?: string): Promise<StrategicRelationship[]> => {
  const api = getApiInstance()
  const response = await api.get<StrategicRelationship[]>('/api/v1/strategic-relationships', {
    params: nodeId ? { node_id: nodeId } : undefined,
  })
  return response.data
}

export const createStrategicRelationship = async (
  payload: StrategicRelationshipCreate,
): Promise<StrategicRelationship> => {
  return post<StrategicRelationship>('/api/v1/strategic-relationships', payload)
}

export const updateStrategicRelationship = async (
  relationshipId: string,
  payload: Partial<StrategicRelationshipCreate>,
): Promise<StrategicRelationship> => {
  return put<StrategicRelationship>(`/api/v1/strategic-relationships/${relationshipId}`, payload)
}

export const deleteStrategicRelationship = async (relationshipId: string): Promise<StrategicRelationship> => {
  return del<StrategicRelationship>(`/api/v1/strategic-relationships/${relationshipId}`)
}

export const getStrategicContracts = async (relationshipId?: string): Promise<StrategicContract[]> => {
  const api = getApiInstance()
  const response = await api.get<StrategicContract[]>('/api/v1/strategic-contracts', {
    params: relationshipId ? { relationship_id: relationshipId } : undefined,
  })
  return response.data
}

export const createStrategicContract = async (payload: StrategicContractCreate): Promise<StrategicContract> => {
  return post<StrategicContract>('/api/v1/strategic-contracts', payload)
}

export const updateStrategicContract = async (
  contractId: string,
  payload: Partial<StrategicContractCreate>,
): Promise<StrategicContract> => {
  return put<StrategicContract>(`/api/v1/strategic-contracts/${contractId}`, payload)
}

export const getStrategicGroups = async (search?: string): Promise<StrategicGroup[]> => {
  const api = getApiInstance()
  const response = await api.get<StrategicGroup[]>('/api/v1/strategic-groups', {
    params: search ? { search } : undefined,
  })
  return response.data
}

export const createStrategicGroup = async (payload: StrategicGroupCreate): Promise<StrategicGroup> => {
  return post<StrategicGroup>('/api/v1/strategic-groups', payload)
}

export const updateStrategicGroup = async (
  groupId: string,
  payload: Partial<StrategicGroupCreate>,
): Promise<StrategicGroup> => {
  return put<StrategicGroup>(`/api/v1/strategic-groups/${groupId}`, payload)
}

export const archiveStrategicGroup = async (groupId: string): Promise<StrategicGroup> => {
  return patch<StrategicGroup>(`/api/v1/strategic-groups/${groupId}/archive`)
}

export const getStrategicGroupMembers = async (groupId: string): Promise<StrategicGroupMembership[]> => {
  return get<StrategicGroupMembership[]>(`/api/v1/strategic-groups/${groupId}/members`)
}

export const addStrategicGroupMember = async (
  groupId: string,
  organizationId: string,
): Promise<StrategicGroupMembership> => {
  return post<StrategicGroupMembership>(`/api/v1/strategic-groups/${groupId}/members`, {
    organization_id: organizationId,
  })
}

export const removeStrategicGroupMember = async (
  groupId: string,
  organizationId: string,
): Promise<StrategicGroupMembership> => {
  return del<StrategicGroupMembership>(`/api/v1/strategic-groups/${groupId}/members/${organizationId}`)
}

export const getPlanningCycles = async (search?: string): Promise<PlanningCycle[]> => {
  const api = getApiInstance()
  const response = await api.get<PlanningCycle[]>('/api/v1/planning-cycles', {
    params: search ? { search } : undefined,
  })
  return response.data
}

export const createPlanningCycle = async (payload: PlanningCycleCreate): Promise<PlanningCycle> => {
  return post<PlanningCycle>('/api/v1/planning-cycles', payload)
}

export const getPlanningCycle = async (cycleId: string): Promise<PlanningCycle> => {
  return get<PlanningCycle>(`/api/v1/planning-cycles/${cycleId}`)
}

export const updatePlanningCycle = async (
  cycleId: string,
  payload: Partial<PlanningCycleCreate>,
): Promise<PlanningCycle> => {
  return put<PlanningCycle>(`/api/v1/planning-cycles/${cycleId}`, payload)
}

export const archivePlanningCycle = async (cycleId: string): Promise<PlanningCycle> => {
  return patch<PlanningCycle>(`/api/v1/planning-cycles/${cycleId}/archive`)
}

export const getPlanningCycleParticipants = async (cycleId: string): Promise<PlanningCycleParticipant[]> => {
  return get<PlanningCycleParticipant[]>(`/api/v1/planning-cycles/${cycleId}/participants`)
}

export const getPlanningCycleParticipantSuggestions = async (
  ownerOrganizationId: string,
): Promise<PlanningCycleParticipantSuggestion[]> => {
  const api = getApiInstance()
  const response = await api.get<PlanningCycleParticipantSuggestion[]>('/api/v1/planning-cycles/participant-suggestions', {
    params: { owner_organization_id: ownerOrganizationId },
  })
  return response.data
}

export const addPlanningCycleParticipant = async (
  cycleId: string,
  participantType: 'organization' | 'strategic_group',
  participantId: string,
): Promise<PlanningCycleParticipant> => {
  return post<PlanningCycleParticipant>(`/api/v1/planning-cycles/${cycleId}/participants`, {
    participant_type: participantType,
    participant_id: participantId,
  })
}

export const removePlanningCycleParticipant = async (
  cycleId: string,
  participantType: 'organization' | 'strategic_group',
  participantId: string,
): Promise<PlanningCycleParticipant> => {
  return del<PlanningCycleParticipant>(
    `/api/v1/planning-cycles/${cycleId}/participants/${participantType}/${participantId}`,
  )
}

export const getStrategyReviews = async (cycleId: string): Promise<StrategyReview[]> => {
  return get<StrategyReview[]>(`/api/v1/planning-cycles/${cycleId}/reviews`)
}

export const createStrategyReview = async (
  cycleId: string,
  payload: StrategyReviewCreate,
): Promise<StrategyReview> => {
  return post<StrategyReview>(`/api/v1/planning-cycles/${cycleId}/reviews`, payload)
}

export const updateStrategyReview = async (
  cycleId: string,
  reviewId: string,
  payload: StrategyReviewUpdate,
): Promise<StrategyReview> => {
  return put<StrategyReview>(`/api/v1/planning-cycles/${cycleId}/reviews/${reviewId}`, payload)
}

export const getStrategyReview = async (cycleId: string, reviewId: string): Promise<StrategyReviewDetail> => {
  return get<StrategyReviewDetail>(`/api/v1/planning-cycles/${cycleId}/reviews/${reviewId}`)
}

export const getStrategicThemes = async (cycleId: string): Promise<StrategicTheme[]> => {
  return get<StrategicTheme[]>(`/api/v1/planning-cycles/${cycleId}/strategic-themes`)
}

export const createStrategicTheme = async (
  cycleId: string,
  payload: StrategicThemeCreate,
): Promise<StrategicTheme> => {
  return post<StrategicTheme>(`/api/v1/planning-cycles/${cycleId}/strategic-themes`, payload)
}

export const updateStrategicTheme = async (
  cycleId: string,
  themeId: string,
  payload: Partial<StrategicThemeCreate>,
): Promise<StrategicTheme> => {
  return put<StrategicTheme>(`/api/v1/planning-cycles/${cycleId}/strategic-themes/${themeId}`, payload)
}

export const archiveStrategicTheme = async (cycleId: string, themeId: string): Promise<StrategicTheme> => {
  return patch<StrategicTheme>(`/api/v1/planning-cycles/${cycleId}/strategic-themes/${themeId}/archive`)
}

export const getDrivers = async (cycleId: string): Promise<Driver[]> => {
  return get<Driver[]>(`/api/v1/planning-cycles/${cycleId}/drivers`)
}

export const createDriver = async (cycleId: string, payload: DriverCreate): Promise<Driver> => {
  return post<Driver>(`/api/v1/planning-cycles/${cycleId}/drivers`, payload)
}

export const getDriver = async (cycleId: string, driverId: string): Promise<Driver> => {
  return get<Driver>(`/api/v1/planning-cycles/${cycleId}/drivers/${driverId}`)
}

export const updateDriver = async (
  cycleId: string,
  driverId: string,
  payload: Partial<DriverCreate>,
): Promise<Driver> => {
  return put<Driver>(`/api/v1/planning-cycles/${cycleId}/drivers/${driverId}`, payload)
}

export const archiveDriver = async (cycleId: string, driverId: string): Promise<Driver> => {
  return patch<Driver>(`/api/v1/planning-cycles/${cycleId}/drivers/${driverId}/archive`)
}

export const getStrategicQuestions = async (cycleId: string): Promise<StrategicQuestion[]> => {
  return get<StrategicQuestion[]>(`/api/v1/planning-cycles/${cycleId}/strategic-questions`)
}

export const createStrategicQuestion = async (
  cycleId: string,
  payload: StrategicQuestionCreate,
): Promise<StrategicQuestion> => {
  return post<StrategicQuestion>(`/api/v1/planning-cycles/${cycleId}/strategic-questions`, payload)
}

export const updateStrategicQuestion = async (
  cycleId: string,
  questionId: string,
  payload: Partial<StrategicQuestionCreate>,
): Promise<StrategicQuestion> => {
  return put<StrategicQuestion>(`/api/v1/planning-cycles/${cycleId}/strategic-questions/${questionId}`, payload)
}

export const archiveStrategicQuestion = async (cycleId: string, questionId: string): Promise<StrategicQuestion> => {
  return patch<StrategicQuestion>(`/api/v1/planning-cycles/${cycleId}/strategic-questions/${questionId}/archive`)
}

export const getStrategicQuestionDrivers = async (
  cycleId: string,
  questionId: string,
): Promise<StrategicQuestionDriverLink[]> => {
  return get<StrategicQuestionDriverLink[]>(`/api/v1/planning-cycles/${cycleId}/strategic-questions/${questionId}/drivers`)
}

export const attachDriverToStrategicQuestion = async (
  cycleId: string,
  questionId: string,
  driverId: string,
): Promise<StrategicQuestionDriverLink> => {
  return post<StrategicQuestionDriverLink>(`/api/v1/planning-cycles/${cycleId}/strategic-questions/${questionId}/drivers`, {
    driver_id: driverId,
  })
}

export const detachDriverFromStrategicQuestion = async (
  cycleId: string,
  questionId: string,
  driverId: string,
): Promise<StrategicQuestionDriverLink> => {
  return del<StrategicQuestionDriverLink>(
    `/api/v1/planning-cycles/${cycleId}/strategic-questions/${questionId}/drivers/${driverId}`,
  )
}

export const getStrategicObjectives = async (cycleId: string): Promise<StrategicObjective[]> => {
  return get<StrategicObjective[]>(`/api/v1/planning-cycles/${cycleId}/strategic-objectives`)
}

export const getStrategicObjectivesForQuestion = async (
  cycleId: string,
  questionId: string,
): Promise<StrategicObjective[]> => {
  return get<StrategicObjective[]>(`/api/v1/planning-cycles/${cycleId}/strategic-questions/${questionId}/objectives`)
}

export const createStrategicObjective = async (
  cycleId: string,
  payload: StrategicObjectiveCreate,
): Promise<StrategicObjective> => {
  return post<StrategicObjective>(`/api/v1/planning-cycles/${cycleId}/strategic-objectives`, payload)
}

export const updateStrategicObjective = async (
  cycleId: string,
  objectiveId: string,
  payload: Partial<StrategicObjectiveCreate>,
): Promise<StrategicObjective> => {
  return put<StrategicObjective>(`/api/v1/planning-cycles/${cycleId}/strategic-objectives/${objectiveId}`, payload)
}

export const archiveStrategicObjective = async (
  cycleId: string,
  objectiveId: string,
): Promise<StrategicObjective> => {
  return patch<StrategicObjective>(`/api/v1/planning-cycles/${cycleId}/strategic-objectives/${objectiveId}/archive`)
}

export const getStrategicChoicesForObjective = async (
  cycleId: string,
  objectiveId: string,
): Promise<StrategicChoice[]> => {
  return get<StrategicChoice[]>(`/api/v1/planning-cycles/${cycleId}/strategic-objectives/${objectiveId}/choices`)
}

export const createStrategicChoice = async (
  cycleId: string,
  objectiveId: string,
  payload: StrategicChoiceCreate,
): Promise<StrategicChoice> => {
  return post<StrategicChoice>(`/api/v1/planning-cycles/${cycleId}/strategic-objectives/${objectiveId}/choices`, payload)
}

export const updateStrategicChoice = async (
  cycleId: string,
  objectiveId: string,
  choiceId: string,
  payload: Partial<StrategicChoiceCreate>,
): Promise<StrategicChoice> => {
  return put<StrategicChoice>(`/api/v1/planning-cycles/${cycleId}/strategic-objectives/${objectiveId}/choices/${choiceId}`, payload)
}

export const archiveStrategicChoice = async (
  cycleId: string,
  objectiveId: string,
  choiceId: string,
): Promise<StrategicChoice> => {
  return patch<StrategicChoice>(`/api/v1/planning-cycles/${cycleId}/strategic-objectives/${objectiveId}/choices/${choiceId}/archive`)
}

export const getStrategicAgreementsForChoice = async (
  cycleId: string,
  objectiveId: string,
  choiceId: string,
): Promise<StrategicAgreement[]> => {
  return get<StrategicAgreement[]>(
    `/api/v1/planning-cycles/${cycleId}/strategic-objectives/${objectiveId}/choices/${choiceId}/agreements`,
  )
}

export const createStrategicAgreement = async (
  cycleId: string,
  objectiveId: string,
  choiceId: string,
  payload: StrategicAgreementCreate,
): Promise<StrategicAgreement> => {
  return post<StrategicAgreement>(
    `/api/v1/planning-cycles/${cycleId}/strategic-objectives/${objectiveId}/choices/${choiceId}/agreements`,
    payload,
  )
}

export const updateStrategicAgreement = async (
  cycleId: string,
  objectiveId: string,
  choiceId: string,
  agreementId: string,
  payload: Partial<StrategicAgreementCreate>,
): Promise<StrategicAgreement> => {
  return put<StrategicAgreement>(
    `/api/v1/planning-cycles/${cycleId}/strategic-objectives/${objectiveId}/choices/${choiceId}/agreements/${agreementId}`,
    payload,
  )
}

export const getInitiativesForChoice = async (
  cycleId: string,
  objectiveId: string,
  choiceId: string,
): Promise<Initiative[]> => {
  return get<Initiative[]>(
    `/api/v1/planning-cycles/${cycleId}/strategic-objectives/${objectiveId}/choices/${choiceId}/initiatives`,
  )
}

export const createInitiativeForChoice = async (
  cycleId: string,
  objectiveId: string,
  choiceId: string,
  payload: InitiativeCreate,
): Promise<Initiative> => {
  return post<Initiative>(
    `/api/v1/planning-cycles/${cycleId}/strategic-objectives/${objectiveId}/choices/${choiceId}/initiatives`,
    payload,
  )
}

export const updateInitiativeForChoice = async (
  cycleId: string,
  objectiveId: string,
  choiceId: string,
  initiativeId: string,
  payload: Partial<InitiativeCreate>,
): Promise<Initiative> => {
  return put<Initiative>(
    `/api/v1/planning-cycles/${cycleId}/strategic-objectives/${objectiveId}/choices/${choiceId}/initiatives/${initiativeId}`,
    payload,
  )
}

export const getInitiativeDetail = async (
  cycleId: string,
  objectiveId: string,
  choiceId: string,
  initiativeId: string,
): Promise<InitiativeDetail> => {
  return get<InitiativeDetail>(
    `/api/v1/planning-cycles/${cycleId}/strategic-objectives/${objectiveId}/choices/${choiceId}/initiatives/${initiativeId}/detail`,
  )
}

export const getInitiativeCapabilities = async (
  cycleId: string,
  objectiveId: string,
  choiceId: string,
  initiativeId: string,
): Promise<Capability[]> => {
  return get<Capability[]>(
    `/api/v1/planning-cycles/${cycleId}/strategic-objectives/${objectiveId}/choices/${choiceId}/initiatives/${initiativeId}/capabilities`,
  )
}

export const attachCapabilityToInitiative = async (
  cycleId: string,
  objectiveId: string,
  choiceId: string,
  initiativeId: string,
  capabilityId: string,
): Promise<Capability> => {
  return post<Capability>(
    `/api/v1/planning-cycles/${cycleId}/strategic-objectives/${objectiveId}/choices/${choiceId}/initiatives/${initiativeId}/capabilities/${capabilityId}`,
  )
}

export const getInitiativeAgreements = async (
  cycleId: string,
  objectiveId: string,
  choiceId: string,
  initiativeId: string,
): Promise<StrategicAgreement[]> => {
  return get<StrategicAgreement[]>(
    `/api/v1/planning-cycles/${cycleId}/strategic-objectives/${objectiveId}/choices/${choiceId}/initiatives/${initiativeId}/agreements`,
  )
}

export const attachAgreementToInitiative = async (
  cycleId: string,
  objectiveId: string,
  choiceId: string,
  initiativeId: string,
  agreementId: string,
): Promise<StrategicAgreement> => {
  return post<StrategicAgreement>(
    `/api/v1/planning-cycles/${cycleId}/strategic-objectives/${objectiveId}/choices/${choiceId}/initiatives/${initiativeId}/agreements/${agreementId}`,
  )
}

export const getOutcomesForInitiative = async (
  cycleId: string,
  objectiveId: string,
  initiativeId: string,
): Promise<Outcome[]> => {
  return get<Outcome[]>(
    `/api/v1/planning-cycles/${cycleId}/strategic-objectives/${objectiveId}/initiatives/${initiativeId}/outcomes`,
  )
}

export const createOutcomeForInitiative = async (
  cycleId: string,
  objectiveId: string,
  initiativeId: string,
  payload: OutcomeCreate,
): Promise<Outcome> => {
  return post<Outcome>(
    `/api/v1/planning-cycles/${cycleId}/strategic-objectives/${objectiveId}/initiatives/${initiativeId}/outcomes`,
    payload,
  )
}

export const updateOutcomeForInitiative = async (
  cycleId: string,
  objectiveId: string,
  initiativeId: string,
  outcomeId: string,
  payload: OutcomeUpdate,
): Promise<Outcome> => {
  return put<Outcome>(
    `/api/v1/planning-cycles/${cycleId}/strategic-objectives/${objectiveId}/initiatives/${initiativeId}/outcomes/${outcomeId}`,
    payload,
  )
}

export const getOutcomeDetail = async (
  cycleId: string,
  objectiveId: string,
  initiativeId: string,
  outcomeId: string,
): Promise<{ linked_metrics: MetricDetail[] } & Outcome> => {
  return get<{ linked_metrics: MetricDetail[] } & Outcome>(
    `/api/v1/planning-cycles/${cycleId}/strategic-objectives/${objectiveId}/initiatives/${initiativeId}/outcomes/${outcomeId}/detail`,
  )
}

export const getMetricsForOutcome = async (
  cycleId: string,
  objectiveId: string,
  initiativeId: string,
  outcomeId: string,
): Promise<MetricDetail[]> => {
  return get<MetricDetail[]>(
    `/api/v1/planning-cycles/${cycleId}/strategic-objectives/${objectiveId}/initiatives/${initiativeId}/outcomes/${outcomeId}/metrics`,
  )
}

export const createMetricForOutcome = async (
  cycleId: string,
  objectiveId: string,
  initiativeId: string,
  outcomeId: string,
  payload: MetricCreate,
): Promise<MetricDetail> => {
  return post<MetricDetail>(
    `/api/v1/planning-cycles/${cycleId}/strategic-objectives/${objectiveId}/initiatives/${initiativeId}/outcomes/${outcomeId}/metrics`,
    payload,
  )
}

export const updateMetricForOutcome = async (
  cycleId: string,
  objectiveId: string,
  initiativeId: string,
  outcomeId: string,
  metricId: string,
  payload: MetricUpdate,
): Promise<MetricDetail> => {
  return put<MetricDetail>(
    `/api/v1/planning-cycles/${cycleId}/strategic-objectives/${objectiveId}/initiatives/${initiativeId}/outcomes/${outcomeId}/metrics/${metricId}`,
    payload,
  )
}

export const getCapabilities = async (search?: string, category?: string, status?: string): Promise<Capability[]> => {
  const api = getApiInstance()
  const response = await api.get<Capability[]>('/api/v1/capabilities', {
    params: {
      ...(search ? { search } : {}),
      ...(category ? { category } : {}),
      ...(status ? { status } : {}),
    },
  })
  return response.data
}

export const createCapability = async (payload: CapabilityCreate): Promise<Capability> => {
  return post<Capability>('/api/v1/capabilities', payload)
}

export const getCapability = async (capabilityId: string): Promise<Capability> => {
  return get<Capability>(`/api/v1/capabilities/${capabilityId}`)
}

export const updateCapability = async (
  capabilityId: string,
  payload: Partial<CapabilityCreate>,
): Promise<Capability> => {
  return put<Capability>(`/api/v1/capabilities/${capabilityId}`, payload)
}

export const retireCapability = async (capabilityId: string): Promise<Capability> => {
  return patch<Capability>(`/api/v1/capabilities/${capabilityId}/retire`)
}

export const getCapabilityDetail = async (capabilityId: string): Promise<CapabilityDetail> => {
  return get<CapabilityDetail>(`/api/v1/capabilities/${capabilityId}/detail`)
}

export const getCapabilitiesForChoice = async (
  cycleId: string,
  objectiveId: string,
  choiceId: string,
): Promise<Capability[]> => {
  return get<Capability[]>(
    `/api/v1/planning-cycles/${cycleId}/strategic-objectives/${objectiveId}/choices/${choiceId}/capabilities`,
  )
}

export const attachCapabilityToChoice = async (
  cycleId: string,
  objectiveId: string,
  choiceId: string,
  capabilityId: string,
): Promise<Capability> => {
  return post<Capability>(
    `/api/v1/planning-cycles/${cycleId}/strategic-objectives/${objectiveId}/choices/${choiceId}/capabilities`,
    { capability_id: capabilityId },
  )
}

export const detachCapabilityFromChoice = async (
  cycleId: string,
  objectiveId: string,
  choiceId: string,
  capabilityId: string,
): Promise<Capability> => {
  return del<Capability>(
    `/api/v1/planning-cycles/${cycleId}/strategic-objectives/${objectiveId}/choices/${choiceId}/capabilities/${capabilityId}`,
  )
}

export const getCapabilityAssessments = async (
  capabilityId: string,
  planningCycleId?: string,
): Promise<CapabilityAssessment[]> => {
  const api = getApiInstance()
  const response = await api.get<CapabilityAssessment[]>(`/api/v1/capabilities/${capabilityId}/assessments`, {
    params: planningCycleId ? { planning_cycle_id: planningCycleId } : undefined,
  })
  return response.data
}

export const createCapabilityAssessment = async (
  capabilityId: string,
  payload: CapabilityAssessmentCreate,
): Promise<CapabilityAssessment> => {
  return post<CapabilityAssessment>(`/api/v1/capabilities/${capabilityId}/assessments`, payload)
}

export const updateCapabilityAssessment = async (
  capabilityId: string,
  assessmentId: string,
  payload: Partial<CapabilityAssessmentCreate>,
): Promise<CapabilityAssessment> => {
  return put<CapabilityAssessment>(`/api/v1/capabilities/${capabilityId}/assessments/${assessmentId}`, payload)
}
