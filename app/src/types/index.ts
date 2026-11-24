export interface User {
  id: string
  username: string
  email: string
  firstName: string
  lastName: string
  roles: string[]
  avatarDataUrl?: string | null
}

export interface UserAccountProfile {
  id: string
  username: string
  email: string
  first_name?: string | null
  last_name?: string | null
  display_name?: string | null
  job_title?: string | null
  department?: string | null
  timezone?: string | null
  phone?: string | null
  bio?: string | null
  avatar_data_url?: string | null
  roles: string[]
  keycloak_subject?: string | null
  keycloak_issuer?: string | null
  keycloak_account_url?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export interface UserAccountProfileUpdate {
  first_name?: string
  last_name?: string
  display_name?: string
  job_title?: string
  department?: string
  timezone?: string
  phone?: string
  bio?: string
  avatar_data_url?: string | null
}

export interface UserActivityEvent {
  id: string
  user_id: string
  username?: string | null
  action: string
  target?: string | null
  method?: string | null
  path?: string | null
  status_code?: number | null
  duration_ms?: number | null
  ip_address?: string | null
  user_agent?: string | null
  source: 'server' | 'client' | string
  metadata: Record<string, unknown>
  created_at: string
}

export interface UserActivitySearchResponse {
  total: number
  items: UserActivityEvent[]
}

export interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: () => void
  logout: () => void
  getToken: () => string | null
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  timestamp: string
}

export interface OrganizationResponse {
  id: string
  name: string
  code?: string | null
  description?: string | null
  parent_organization_id?: string | null
  parentOrganizationId?: string | null
  organization_type?: string | null
  organizationType?: string | null
  region?: string | null
  leader?: string | null
  status: string
  is_root?: boolean
  strategic_classification?: string | null
  strategicClassification?: string | null
  fiscal_responsibility?: string | null
  fiscalResponsibility?: string | null
  investment_authority?: string | null
  investmentAuthority?: string | null
  effective_date?: string | null
  effectiveDate?: string | null
  retirement_date?: string | null
  retirementDate?: string | null
  created_at?: string | null
  createdAt?: string | null
  updated_at?: string | null
  updatedAt?: string | null
}

export interface OrganizationImportResult {
  total_rows: number
  imported: number
  updated: number
  skipped: number
  errors: string[]
}

export interface GovernanceConfig {
  enterprise_name: string
  enterprise_code?: string | null
  enterprise_description?: string | null
  planning_cycles: string[]
  strategy_authority_rules: string[]
  alignment_scoring_rules: string[]
  required_strategy_artifacts: string[]
  strategy_review_cadence: string
  contract_templates: string[]
  planning_windows: string[]
  governance_policies: string[]
  escalation_workflows: string[]
  updated_at?: string | null
}

export interface StrategicRelationship {
  id: string
  source_node_id: string
  target_node_id: string
  relationship_type: 'Governance' | 'Collaboration' | 'Dependency' | 'Oversight' | string
  participation_role: 'Lead' | 'Required Participant' | 'Contributor' | 'Observer' | string
  strategy_role: 'Defines' | 'Co-Defines' | 'Responds' | 'Executes' | string
  review_cadence: 'Monthly' | 'Quarterly' | 'Semi-Annual' | 'Annual' | string
  status: 'Draft' | 'Active' | 'Suspended' | 'Retired' | string
  notes?: string | null
  created_date?: string | null
  modified_date?: string | null
}

export interface StrategicRelationshipCreate {
  source_node_id: string
  target_node_id: string
  relationship_type: 'Governance' | 'Collaboration' | 'Dependency' | 'Oversight' | string
  participation_role: 'Lead' | 'Required Participant' | 'Contributor' | 'Observer' | string
  strategy_role: 'Defines' | 'Co-Defines' | 'Responds' | 'Executes' | string
  review_cadence: 'Monthly' | 'Quarterly' | 'Semi-Annual' | 'Annual' | string
  status: 'Draft' | 'Active' | 'Suspended' | 'Retired' | string
  notes?: string | null
}

export interface StrategicGroup {
  id: string
  name: string
  description?: string | null
  group_type: 'Strategy Council' | 'Working Group' | 'Planning Committee' | 'Investment Committee' | 'Steering Committee' | 'Custom' | string
  status: 'Active' | 'Archived' | string
  created_at?: string | null
  updated_at?: string | null
}

export interface StrategicGroupCreate {
  name: string
  description?: string | null
  group_type: 'Strategy Council' | 'Working Group' | 'Planning Committee' | 'Investment Committee' | 'Steering Committee' | 'Custom' | string
  status: 'Active' | 'Archived' | string
}

export interface StrategicGroupMembership {
  id: string
  strategic_group_id: string
  organization_id: string
  organization_name: string
  organization_code?: string | null
  organization_status: string
  created_at?: string | null
}

export interface StrategyReview {
  id: string
  planning_cycle_id: string
  date: string
  status: 'Draft' | 'In Progress' | 'Completed' | 'Archived' | string
  recommendations?: string | null
  summary?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export interface StrategyReviewCreate {
  planning_cycle_id: string
  date: string
  status: 'Draft' | 'In Progress' | 'Completed' | 'Archived' | string
  recommendations?: string | null
  summary?: string | null
}

export interface StrategyReviewUpdate {
  planning_cycle_id?: string
  date?: string
  status?: 'Draft' | 'In Progress' | 'Completed' | 'Archived' | string
  recommendations?: string | null
  summary?: string | null
}

export interface StrategyReviewObjectiveLink {
  id: string
  review_id: string
  strategic_objective_id: string
  strategic_objective_title?: string | null
  created_at?: string | null
}

export interface StrategyReviewInitiativeLink {
  id: string
  review_id: string
  initiative_id: string
  initiative_name?: string | null
  created_at?: string | null
}

export interface StrategyReviewOutcomeLink {
  id: string
  review_id: string
  outcome_id: string
  outcome_name?: string | null
  created_at?: string | null
}

export interface StrategyReviewDetail extends StrategyReview {
  linked_objectives: StrategyReviewObjectiveLink[]
  linked_initiatives: StrategyReviewInitiativeLink[]
  linked_outcomes: StrategyReviewOutcomeLink[]
}

export interface PlanningCycle {
  id: string
  name: string
  description?: string | null
  owner_organization_id: string
  owner_organization_name?: string | null
  status: 'Draft' | 'Planning' | 'Negotiation' | 'Approved' | 'Executing' | 'Completed' | 'Archived' | string
  start_date?: string | null
  end_date?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export interface PlanningCycleCreate {
  name: string
  description?: string | null
  owner_organization_id: string
  status: 'Draft' | 'Planning' | 'Negotiation' | 'Approved' | 'Executing' | 'Completed' | 'Archived' | string
  start_date?: string | null
  end_date?: string | null
}

export interface PlanningCycleParticipant {
  id: string
  planning_cycle_id: string
  participant_type: 'organization' | 'strategic_group' | string
  participant_id: string
  participant_name: string
  participant_status?: string | null
  created_at?: string | null
}

export interface PlanningCycleParticipantSuggestion {
  organization_id: string
  organization_name: string
  organization_status?: string | null
  relationship_count: number
}

export interface StrategicTheme {
  id: string
  planning_cycle_id: string
  name: string
  description?: string | null
  status: 'Draft' | 'Active' | 'Archived' | string
  created_at?: string | null
  updated_at?: string | null
}

export interface StrategicThemeCreate {
  planning_cycle_id: string
  name: string
  description?: string | null
  status: 'Draft' | 'Active' | 'Archived' | string
}

export interface Driver {
  id: string
  planning_cycle_id: string
  title: string
  description?: string | null
  category: 'Market' | 'Customer' | 'Technology' | 'Financial' | 'Workforce' | 'Regulatory' | 'Environmental' | 'Supply Chain' | 'Competitive' | 'Other' | string
  impact_level: 'Low' | 'Medium' | 'High' | 'Critical' | string
  time_horizon: 'Immediate' | '1-3 Years' | '3-5 Years' | '5+ Years' | string
  status: 'Draft' | 'Active' | 'Archived' | string
  strategic_theme_id?: string | null
  strategic_theme_name?: string | null
  owner_organization_id: string
  owner_organization_name?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export interface DriverCreate {
  planning_cycle_id: string
  title: string
  description?: string | null
  category: 'Market' | 'Customer' | 'Technology' | 'Financial' | 'Workforce' | 'Regulatory' | 'Environmental' | 'Supply Chain' | 'Competitive' | 'Other' | string
  impact_level: 'Low' | 'Medium' | 'High' | 'Critical' | string
  time_horizon: 'Immediate' | '1-3 Years' | '3-5 Years' | '5+ Years' | string
  status: 'Draft' | 'Active' | 'Archived' | string
  strategic_theme_id?: string | null
  owner_organization_id: string
}

export interface StrategicQuestion {
  id: string
  planning_cycle_id: string
  title: string
  description?: string | null
  priority: 'Low' | 'Medium' | 'High' | 'Critical' | string
  status: 'Draft' | 'Active' | 'Answered' | 'Archived' | string
  strategic_theme_id?: string | null
  strategic_theme_name?: string | null
  lead_organization_id: string
  lead_organization_name?: string | null
  drivers_linked: number
  created_at?: string | null
  updated_at?: string | null
}

export interface StrategicQuestionCreate {
  planning_cycle_id: string
  title: string
  description?: string | null
  priority: 'Low' | 'Medium' | 'High' | 'Critical' | string
  status: 'Draft' | 'Active' | 'Answered' | 'Archived' | string
  strategic_theme_id?: string | null
  lead_organization_id: string
}

export interface StrategicQuestionDriverLink {
  id: string
  strategic_question_id: string
  driver_id: string
  driver_title: string
  driver_status?: string | null
  created_at?: string | null
}

export interface StrategicObjective {
  id: string
  planning_cycle_id: string
  strategic_question_id: string
  strategic_question_title?: string | null
  title: string
  description?: string | null
  objective_type: 'Growth' | 'Operational Excellence' | 'Customer' | 'Financial' | 'Workforce' | 'Technology' | 'Sustainability' | 'Risk' | 'Regulatory' | string
  priority: 'Low' | 'Medium' | 'High' | 'Critical' | string
  status: 'Draft' | 'Proposed' | 'Approved' | 'Active' | 'Completed' | 'Archived' | string
  strategic_theme_id?: string | null
  strategic_theme_name?: string | null
  owner_organization_id: string
  owner_organization_name?: string | null
  target_date?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export interface StrategicObjectiveCreate {
  planning_cycle_id: string
  strategic_question_id: string
  title: string
  description?: string | null
  objective_type: 'Growth' | 'Operational Excellence' | 'Customer' | 'Financial' | 'Workforce' | 'Technology' | 'Sustainability' | 'Risk' | 'Regulatory' | string
  priority: 'Low' | 'Medium' | 'High' | 'Critical' | string
  status: 'Draft' | 'Proposed' | 'Approved' | 'Active' | 'Completed' | 'Archived' | string
  strategic_theme_id?: string | null
  owner_organization_id: string
  target_date?: string | null
}

export interface StrategicChoice {
  id: string
  planning_cycle_id: string
  strategic_objective_id: string
  strategic_objective_title?: string | null
  title: string
  description?: string | null
  choice_type: 'Investment' | 'Operating Model' | 'Capability' | 'Market' | 'Product' | 'Technology' | 'People' | 'Partnership' | 'Acquisition' | 'Other' | string
  status: 'Draft' | 'Under Evaluation' | 'Recommended' | 'Approved' | 'Rejected' | 'Archived' | string
  recommendation: 'No Recommendation' | 'Recommended' | 'Not Recommended' | string
  strategic_theme_id?: string | null
  strategic_theme_name?: string | null
  owner_organization_id: string
  owner_organization_name?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export interface StrategicChoiceCreate {
  planning_cycle_id: string
  strategic_objective_id: string
  title: string
  description?: string | null
  choice_type: 'Investment' | 'Operating Model' | 'Capability' | 'Market' | 'Product' | 'Technology' | 'People' | 'Partnership' | 'Acquisition' | 'Other' | string
  status: 'Draft' | 'Under Evaluation' | 'Recommended' | 'Approved' | 'Rejected' | 'Archived' | string
  recommendation: 'No Recommendation' | 'Recommended' | 'Not Recommended' | string
  strategic_theme_id?: string | null
  owner_organization_id: string
}

export interface StrategicAgreement {
  id: string
  planning_cycle_id: string
  strategic_choice_id: string
  strategic_choice_title?: string | null
  title: string
  description?: string | null
  status: 'Draft' | 'Proposed' | 'Negotiating' | 'Approved' | 'Active' | 'Completed' | 'Cancelled' | string
  effective_date?: string | null
  owner_organization_id: string
  owner_organization_name?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export interface StrategicAgreementCreate {
  planning_cycle_id: string
  strategic_choice_id: string
  title: string
  description?: string | null
  status: 'Draft' | 'Proposed' | 'Negotiating' | 'Approved' | 'Active' | 'Completed' | 'Cancelled' | string
  effective_date?: string | null
  owner_organization_id: string
}

export interface Initiative {
  id: string
  planning_cycle_id: string
  name: string
  description?: string | null
  status: 'Proposed' | 'Planned' | 'In Progress' | 'On Hold' | 'Completed' | 'Cancelled' | string
  owner_organization_id: string
  owner_organization_name?: string | null
  start_date?: string | null
  end_date?: string | null
  budget?: number | null
  created_at?: string | null
  updated_at?: string | null
}

export interface InitiativeCreate {
  planning_cycle_id: string
  name: string
  description?: string | null
  status: 'Proposed' | 'Planned' | 'In Progress' | 'On Hold' | 'Completed' | 'Cancelled' | string
  owner_organization_id: string
  start_date?: string | null
  end_date?: string | null
  budget?: number | null
}

export interface InitiativeChoiceLink {
  id: string
  initiative_id: string
  strategic_choice_id: string
  strategic_choice_title?: string | null
  planning_cycle_id?: string | null
  strategic_objective_id?: string | null
  created_at?: string | null
}

export interface InitiativeCapabilityLink {
  id: string
  initiative_id: string
  capability_id: string
  capability_name?: string | null
  capability_category?: string | null
  capability_status?: string | null
  created_at?: string | null
}

export interface InitiativeAgreementLink {
  id: string
  initiative_id: string
  strategic_agreement_id: string
  strategic_agreement_title?: string | null
  strategic_agreement_status?: string | null
  created_at?: string | null
}

export interface InitiativeDetail extends Initiative {
  linked_choices: InitiativeChoiceLink[]
  linked_capabilities: InitiativeCapabilityLink[]
  linked_agreements: InitiativeAgreementLink[]
}

export interface Outcome {
  id: string
  planning_cycle_id: string
  strategic_objective_id: string
  initiative_id: string
  name: string
  description?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export interface OutcomeCreate {
  planning_cycle_id: string
  strategic_objective_id: string
  initiative_id: string
  name: string
  description?: string | null
}

export interface OutcomeUpdate {
  planning_cycle_id?: string
  strategic_objective_id?: string
  initiative_id?: string
  name?: string
  description?: string | null
}

export interface MetricTarget {
  id: string
  metric_id: string
  target_value: number
  target_unit?: string | null
  target_date?: string | null
  notes?: string | null
  created_at?: string | null
}

export interface MetricActual {
  id: string
  metric_id: string
  actual_value: number
  actual_unit?: string | null
  measured_at?: string | null
  notes?: string | null
  created_at?: string | null
}

export interface MetricDetail {
  id: string
  outcome_id: string
  name: string
  description?: string | null
  unit?: string | null
  created_at?: string | null
  updated_at?: string | null
  target?: MetricTarget | null
  actuals: MetricActual[]
}

export interface MetricTargetCreate {
  target_value: number
  target_unit?: string | null
  target_date?: string | null
  notes?: string | null
}

export interface MetricActualCreate {
  actual_value: number
  actual_unit?: string | null
  measured_at?: string | null
  notes?: string | null
}

export interface MetricCreate {
  outcome_id: string
  name: string
  description?: string | null
  unit?: string | null
  target?: MetricTargetCreate | null
  actual?: MetricActualCreate | null
}

export interface MetricUpdate {
  outcome_id?: string
  name?: string
  description?: string | null
  unit?: string | null
  target?: MetricTargetCreate | null
  actual?: MetricActualCreate | null
}

export interface Capability {
  id: string
  name: string
  description?: string | null
  category: 'Commercial' | 'Operations' | 'Supply Chain' | 'Technology' | 'People' | 'Finance' | 'Innovation' | 'Risk' | 'Sustainability' | 'Other' | string
  status: 'Draft' | 'Active' | 'Retired' | string
  owner_organization_id: string
  owner_organization_name?: string | null
  start_date?: string | null
  end_date?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export interface CapabilityCreate {
  name: string
  description?: string | null
  category: 'Commercial' | 'Operations' | 'Supply Chain' | 'Technology' | 'People' | 'Finance' | 'Innovation' | 'Risk' | 'Sustainability' | 'Other' | string
  status: 'Draft' | 'Active' | 'Retired' | string
  owner_organization_id: string
  start_date?: string | null
  end_date?: string | null
}

export interface CapabilityRoadmapItem {
  capability_id: string
  capability_name: string
  category: string
  status: string
  owner_organization_id: string
  owner_organization_name?: string | null
  start_date?: string | null
  end_date?: string | null
  current_maturity: number
  target_maturity: number
  assessment_gap: number
  latest_assessment_id?: string | null
  latest_planning_cycle_id?: string | null
}

export interface CapabilityChoiceLink {
  id: string
  capability_id: string
  strategic_choice_id: string
  strategic_choice_title?: string | null
  planning_cycle_id?: string | null
  strategic_objective_id?: string | null
  created_at?: string | null
}

export interface CapabilityAgreementLink {
  id: string
  strategic_choice_id: string
  strategic_agreement_id: string
  strategic_agreement_title?: string | null
  strategic_agreement_status?: string | null
  planning_cycle_id?: string | null
  created_at?: string | null
}

export interface CapabilityDetail extends Capability {
  linked_choices: CapabilityChoiceLink[]
  linked_agreements: CapabilityAgreementLink[]
  assessments: CapabilityAssessment[]
}

export interface CapabilityAssessment {
  id: string
  capability_id: string
  capability_name?: string | null
  planning_cycle_id: string
  planning_cycle_name?: string | null
  current_maturity: number
  target_maturity: number
  assessment_gap: number
  assessment_notes?: string | null
  assessment_date?: string | null
  owner_organization_id: string
  owner_organization_name?: string | null
}

export interface CapabilityAssessmentCreate {
  capability_id: string
  planning_cycle_id: string
  current_maturity: number
  target_maturity: number
  assessment_notes?: string | null
  assessment_date?: string | null
  owner_organization_id: string
}

export interface StrategicContract {
  id: string
  relationship_id: string
  concern_alignment: 'Required' | 'Recommended' | 'Optional' | string
  objective_alignment: 'Required' | 'Recommended' | 'Optional' | string
  capability_alignment: 'Required' | 'Shared' | 'Independent' | string
  investment_alignment: 'Parent Approval Required' | 'Joint Approval' | 'Independent' | string
  outcome_alignment: 'Required' | 'Recommended' | 'Optional' | string
  concern_decision_rights: 'Mandate' | 'Approve' | 'Review' | 'Consult' | 'Inform' | 'Independent' | string
  objective_decision_rights: 'Mandate' | 'Approve' | 'Review' | 'Consult' | 'Inform' | 'Independent' | string
  capability_decision_rights: 'Mandate' | 'Approve' | 'Review' | 'Consult' | 'Inform' | 'Independent' | string
  investment_decision_rights: 'Mandate' | 'Approve' | 'Review' | 'Consult' | 'Inform' | 'Independent' | string
  outcome_decision_rights: 'Mandate' | 'Approve' | 'Review' | 'Consult' | 'Inform' | 'Independent' | string
  review_cadence: 'Monthly' | 'Quarterly' | 'Semi-Annual' | 'Annual' | string
  notes?: string | null
  status: 'Draft' | 'Active' | 'Suspended' | 'Retired' | string
  version: number
  created_date?: string | null
  modified_date?: string | null
}

export interface StrategicContractCreate {
  relationship_id: string
  concern_alignment: string
  objective_alignment: string
  capability_alignment: string
  investment_alignment: string
  outcome_alignment: string
  concern_decision_rights: string
  objective_decision_rights: string
  capability_decision_rights: string
  investment_decision_rights: string
  outcome_decision_rights: string
  review_cadence: string
  notes?: string | null
  status: string
  version: number
}
