from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Literal
from datetime import datetime


class OrganizationCreate(BaseModel):
    """Organization record creation schema."""
    name: str
    code: Optional[str] = None
    description: Optional[str] = None
    parent_organization_id: Optional[str] = None
    organization_type: str = "Business Unit"
    region: Optional[str] = None
    leader: Optional[str] = None
    status: str = "active"
    strategic_classification: str = "Operational"
    fiscal_responsibility: str = "Cost Center"
    investment_authority: str = "None"
    is_root: bool = False
    effective_date: Optional[datetime] = None
    retirement_date: Optional[datetime] = None


class OrganizationUpdate(BaseModel):
    """Allowed updates for organization records."""
    name: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None
    parent_organization_id: Optional[str] = None
    organization_type: Optional[str] = None
    region: Optional[str] = None
    leader: Optional[str] = None
    status: Optional[str] = None
    strategic_classification: Optional[str] = None
    fiscal_responsibility: Optional[str] = None
    investment_authority: Optional[str] = None
    is_root: Optional[bool] = None
    effective_date: Optional[datetime] = None
    retirement_date: Optional[datetime] = None


class OrganizationResponse(BaseModel):
    """Organization record response schema."""
    id: str
    name: str
    code: Optional[str] = None
    description: Optional[str] = None
    parent_organization_id: Optional[str] = None
    organization_type: Optional[str] = None
    region: Optional[str] = None
    leader: Optional[str] = None
    status: str = "active"
    strategic_classification: str = "Operational"
    fiscal_responsibility: str = "Cost Center"
    investment_authority: str = "None"
    is_root: bool = False
    effective_date: Optional[datetime] = None
    retirement_date: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class StrategicRelationshipCreate(BaseModel):
    """Strategic relationship creation schema."""
    source_node_id: str
    target_node_id: str
    relationship_type: str = "Governance"
    participation_role: str = "Contributor"
    strategy_role: str = "Responds"
    review_cadence: str = "Quarterly"
    status: str = "Draft"
    notes: Optional[str] = None


class StrategicRelationshipUpdate(BaseModel):
    """Strategic relationship update schema."""
    source_node_id: Optional[str] = None
    target_node_id: Optional[str] = None
    relationship_type: Optional[str] = None
    participation_role: Optional[str] = None
    strategy_role: Optional[str] = None
    review_cadence: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class StrategicRelationshipResponse(BaseModel):
    """Strategic relationship response schema."""
    id: str
    source_node_id: str
    target_node_id: str
    relationship_type: str = "Governance"
    participation_role: str = "Contributor"
    strategy_role: str = "Responds"
    review_cadence: str = "Quarterly"
    status: str = "Draft"
    notes: Optional[str] = None
    created_date: Optional[datetime] = None
    modified_date: Optional[datetime] = None


class StrategicGroupCreate(BaseModel):
    """Strategic participation group creation schema."""
    name: str
    description: Optional[str] = None
    group_type: str = "Strategy Council"
    status: str = "Active"


class StrategicGroupUpdate(BaseModel):
    """Strategic participation group update schema."""
    name: Optional[str] = None
    description: Optional[str] = None
    group_type: Optional[str] = None
    status: Optional[str] = None


class StrategicGroupResponse(BaseModel):
    """Strategic participation group response schema."""
    id: str
    name: str
    description: Optional[str] = None
    group_type: str = "Strategy Council"
    status: str = "Active"
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class StrategicGroupMembershipCreate(BaseModel):
    """Membership creation schema for adding an organization to a strategic group."""
    organization_id: str


class StrategicGroupMembershipResponse(BaseModel):
    """Membership response schema with organization summary details."""
    id: str
    strategic_group_id: str
    organization_id: str
    organization_name: str
    organization_code: Optional[str] = None
    organization_status: str = "active"
    created_at: Optional[datetime] = None


class PlanningCycleCreate(BaseModel):
    """Planning cycle creation schema."""
    name: str
    description: Optional[str] = None
    owner_organization_id: str
    status: str = "Draft"
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class PlanningCycleUpdate(BaseModel):
    """Planning cycle update schema."""
    name: Optional[str] = None
    description: Optional[str] = None
    owner_organization_id: Optional[str] = None
    status: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class PlanningCycleResponse(BaseModel):
    """Planning cycle response schema."""
    id: str
    name: str
    description: Optional[str] = None
    owner_organization_id: str
    owner_organization_name: Optional[str] = None
    status: str = "Draft"
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class PlanningCycleParticipantCreate(BaseModel):
    """Planning cycle participant creation schema."""
    participant_type: str
    participant_id: str


class PlanningCycleParticipantResponse(BaseModel):
    """Planning cycle participant response schema."""
    id: str
    planning_cycle_id: str
    participant_type: str
    participant_id: str
    participant_name: str
    participant_status: Optional[str] = None
    created_at: Optional[datetime] = None


class PlanningCycleParticipantSuggestionResponse(BaseModel):
    """Suggested planning cycle participant inferred from active strategic relationships."""
    organization_id: str
    organization_name: str
    organization_status: Optional[str] = None
    relationship_count: int = 1


class StrategyReviewCreate(BaseModel):
    """Strategy review creation schema."""
    planning_cycle_id: str
    date: datetime
    status: str = "Draft"
    recommendations: Optional[str] = None
    summary: Optional[str] = None


class StrategyReviewUpdate(BaseModel):
    """Strategy review update schema."""
    planning_cycle_id: Optional[str] = None
    date: Optional[datetime] = None
    status: Optional[str] = None
    recommendations: Optional[str] = None
    summary: Optional[str] = None


class StrategyReviewObjectiveLinkResponse(BaseModel):
    """Objective linked to a strategy review."""
    id: str
    review_id: str
    strategic_objective_id: str
    strategic_objective_title: Optional[str] = None
    created_at: Optional[datetime] = None


class StrategyReviewInitiativeLinkResponse(BaseModel):
    """Initiative linked to a strategy review."""
    id: str
    review_id: str
    initiative_id: str
    initiative_name: Optional[str] = None
    created_at: Optional[datetime] = None


class StrategyReviewOutcomeLinkResponse(BaseModel):
    """Outcome linked to a strategy review."""
    id: str
    review_id: str
    outcome_id: str
    outcome_name: Optional[str] = None
    created_at: Optional[datetime] = None


class StrategyReviewResponse(BaseModel):
    """Strategy review response schema."""
    id: str
    planning_cycle_id: str
    date: datetime
    status: str = "Draft"
    recommendations: Optional[str] = None
    summary: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class StrategyReviewDetailResponse(StrategyReviewResponse):
    """Strategy review detail with linked strategy artifacts."""
    linked_objectives: List[StrategyReviewObjectiveLinkResponse] = Field(default_factory=list)
    linked_initiatives: List[StrategyReviewInitiativeLinkResponse] = Field(default_factory=list)
    linked_outcomes: List[StrategyReviewOutcomeLinkResponse] = Field(default_factory=list)


class StrategicThemeCreate(BaseModel):
    """Strategic theme creation schema."""
    planning_cycle_id: str
    name: str
    description: Optional[str] = None
    status: str = "Draft"


class StrategicThemeUpdate(BaseModel):
    """Strategic theme update schema."""
    planning_cycle_id: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None


class StrategicThemeResponse(BaseModel):
    """Strategic theme response schema."""
    id: str
    planning_cycle_id: str
    name: str
    description: Optional[str] = None
    status: str = "Draft"
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class DriverCreate(BaseModel):
    """Driver creation schema."""
    planning_cycle_id: str
    title: str
    description: Optional[str] = None
    category: str = "Other"
    impact_level: str = "Medium"
    time_horizon: str = "1-3 Years"
    status: str = "Draft"
    strategic_theme_id: Optional[str] = None
    owner_organization_id: str


class DriverUpdate(BaseModel):
    """Driver update schema."""
    planning_cycle_id: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    impact_level: Optional[str] = None
    time_horizon: Optional[str] = None
    status: Optional[str] = None
    strategic_theme_id: Optional[str] = None
    owner_organization_id: Optional[str] = None


class DriverResponse(BaseModel):
    """Driver response schema."""
    id: str
    planning_cycle_id: str
    title: str
    description: Optional[str] = None
    category: str = "Other"
    impact_level: str = "Medium"
    time_horizon: str = "1-3 Years"
    status: str = "Draft"
    strategic_theme_id: Optional[str] = None
    strategic_theme_name: Optional[str] = None
    owner_organization_id: str
    owner_organization_name: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class StrategicQuestionCreate(BaseModel):
    """Strategic question creation schema."""
    planning_cycle_id: str
    title: str
    description: Optional[str] = None
    priority: str = "Medium"
    status: str = "Draft"
    strategic_theme_id: Optional[str] = None
    lead_organization_id: str


class StrategicQuestionUpdate(BaseModel):
    """Strategic question update schema."""
    planning_cycle_id: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    strategic_theme_id: Optional[str] = None
    lead_organization_id: Optional[str] = None


class StrategicQuestionResponse(BaseModel):
    """Strategic question response schema."""
    id: str
    planning_cycle_id: str
    title: str
    description: Optional[str] = None
    priority: str = "Medium"
    status: str = "Draft"
    strategic_theme_id: Optional[str] = None
    strategic_theme_name: Optional[str] = None
    lead_organization_id: str
    lead_organization_name: Optional[str] = None
    drivers_linked: int = 0
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class StrategicQuestionDriverLinkCreate(BaseModel):
    """Attach driver to strategic question request schema."""
    driver_id: str


class StrategicQuestionDriverLinkResponse(BaseModel):
    """Strategic question linked driver response schema."""
    id: str
    strategic_question_id: str
    driver_id: str
    driver_title: str
    driver_status: Optional[str] = None
    created_at: Optional[datetime] = None


class StrategicObjectiveCreate(BaseModel):
    """Strategic objective creation schema."""
    planning_cycle_id: str
    strategic_question_id: str
    title: str
    description: Optional[str] = None
    objective_type: str
    priority: str = "Medium"
    status: str = "Draft"
    strategic_theme_id: Optional[str] = None
    owner_organization_id: str
    target_date: Optional[datetime] = None


class StrategicObjectiveUpdate(BaseModel):
    """Strategic objective update schema."""
    planning_cycle_id: Optional[str] = None
    strategic_question_id: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    objective_type: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    strategic_theme_id: Optional[str] = None
    owner_organization_id: Optional[str] = None
    target_date: Optional[datetime] = None


class StrategicObjectiveResponse(BaseModel):
    """Strategic objective response schema."""
    id: str
    planning_cycle_id: str
    strategic_question_id: str
    strategic_question_title: Optional[str] = None
    title: str
    description: Optional[str] = None
    objective_type: str
    priority: str = "Medium"
    status: str = "Draft"
    strategic_theme_id: Optional[str] = None
    strategic_theme_name: Optional[str] = None
    owner_organization_id: str
    owner_organization_name: Optional[str] = None
    target_date: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class ObjectiveAlignmentUpdate(BaseModel):
    site_organization_ids: list[str] = Field(max_length=100)


class ObjectiveAlignmentResponse(BaseModel):
    scope: Literal["Corporate", "Site"]
    organization_id: str
    objective_id: str
    objective_title: str
    corporate_organization_id: str
    site_organization_ids: list[str]


class StrategicChoiceCreate(BaseModel):
    """Strategic choice creation schema."""
    planning_cycle_id: str
    strategic_objective_id: str
    title: str
    description: Optional[str] = None
    choice_type: str
    status: str = "Draft"
    recommendation: str = "No Recommendation"
    strategic_theme_id: Optional[str] = None
    owner_organization_id: str


class StrategicChoiceUpdate(BaseModel):
    """Strategic choice update schema."""
    planning_cycle_id: Optional[str] = None
    strategic_objective_id: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    choice_type: Optional[str] = None
    status: Optional[str] = None
    recommendation: Optional[str] = None
    strategic_theme_id: Optional[str] = None
    owner_organization_id: Optional[str] = None


class StrategicChoiceResponse(BaseModel):
    """Strategic choice response schema."""
    id: str
    planning_cycle_id: str
    strategic_objective_id: str
    strategic_objective_title: Optional[str] = None
    title: str
    description: Optional[str] = None
    choice_type: str
    status: str = "Draft"
    recommendation: str = "No Recommendation"
    strategic_theme_id: Optional[str] = None
    strategic_theme_name: Optional[str] = None
    owner_organization_id: str
    owner_organization_name: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class StrategicAgreementCreate(BaseModel):
    """Strategic agreement creation schema."""
    planning_cycle_id: str
    strategic_choice_id: str
    title: str
    description: Optional[str] = None
    status: str = "Draft"
    effective_date: Optional[datetime] = None
    owner_organization_id: str


class StrategicAgreementUpdate(BaseModel):
    """Strategic agreement update schema."""
    planning_cycle_id: Optional[str] = None
    strategic_choice_id: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    effective_date: Optional[datetime] = None
    owner_organization_id: Optional[str] = None


class StrategicAgreementResponse(BaseModel):
    """Strategic agreement response schema."""
    id: str
    planning_cycle_id: str
    strategic_choice_id: str
    strategic_choice_title: Optional[str] = None
    title: str
    description: Optional[str] = None
    status: str = "Draft"
    effective_date: Optional[datetime] = None
    owner_organization_id: str
    owner_organization_name: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class InitiativeCreate(BaseModel):
    """Initiative creation schema."""
    planning_cycle_id: str
    name: str
    description: Optional[str] = None
    status: str = "Proposed"
    owner_organization_id: str
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    budget: Optional[float] = None


class InitiativeUpdate(BaseModel):
    """Initiative update schema."""
    planning_cycle_id: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    owner_organization_id: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    budget: Optional[float] = None


class InitiativeResponse(BaseModel):
    """Initiative response schema."""
    id: str
    planning_cycle_id: str
    name: str
    description: Optional[str] = None
    status: str = "Proposed"
    owner_organization_id: str
    owner_organization_name: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    budget: Optional[float] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class InitiativeChoiceLinkResponse(BaseModel):
    """Initiative to strategic choice link response."""
    id: str
    initiative_id: str
    strategic_choice_id: str
    strategic_choice_title: Optional[str] = None
    planning_cycle_id: Optional[str] = None
    strategic_objective_id: Optional[str] = None
    created_at: Optional[datetime] = None


class InitiativeCapabilityLinkResponse(BaseModel):
    """Capability summary linked to an initiative."""
    id: str
    initiative_id: str
    capability_id: str
    capability_name: Optional[str] = None
    capability_category: Optional[str] = None
    capability_status: Optional[str] = None
    created_at: Optional[datetime] = None


class InitiativeAgreementLinkResponse(BaseModel):
    """Agreement summary linked to an initiative."""
    id: str
    initiative_id: str
    strategic_agreement_id: str
    strategic_agreement_title: Optional[str] = None
    strategic_agreement_status: Optional[str] = None
    created_at: Optional[datetime] = None


class InitiativeDetailResponse(InitiativeResponse):
    """Initiative detail response including linked choice, capability, and agreement context."""
    linked_choices: List[InitiativeChoiceLinkResponse] = Field(default_factory=list)
    linked_capabilities: List[InitiativeCapabilityLinkResponse] = Field(default_factory=list)
    linked_agreements: List[InitiativeAgreementLinkResponse] = Field(default_factory=list)


class OutcomeCreate(BaseModel):
    """Outcome creation schema."""
    planning_cycle_id: str
    strategic_objective_id: str
    initiative_id: str
    name: str
    description: Optional[str] = None


class OutcomeUpdate(BaseModel):
    """Outcome update schema."""
    planning_cycle_id: Optional[str] = None
    strategic_objective_id: Optional[str] = None
    initiative_id: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None


class OutcomeResponse(BaseModel):
    """Outcome response schema."""
    id: str
    planning_cycle_id: str
    strategic_objective_id: str
    initiative_id: str
    name: str
    description: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class MetricTargetCreate(BaseModel):
    """Metric target schema."""
    target_value: float
    target_unit: Optional[str] = None
    target_date: Optional[datetime] = None
    notes: Optional[str] = None


class MetricTargetResponse(BaseModel):
    """Metric target response schema."""
    id: str
    metric_id: str
    target_value: float
    target_unit: Optional[str] = None
    target_date: Optional[datetime] = None
    notes: Optional[str] = None
    created_at: Optional[datetime] = None


class MetricActualCreate(BaseModel):
    """Metric actual schema."""
    actual_value: float
    actual_unit: Optional[str] = None
    measured_at: Optional[datetime] = None
    notes: Optional[str] = None


class MetricActualResponse(BaseModel):
    """Metric actual response schema."""
    id: str
    metric_id: str
    actual_value: float
    actual_unit: Optional[str] = None
    measured_at: Optional[datetime] = None
    notes: Optional[str] = None
    created_at: Optional[datetime] = None


class MetricCreate(BaseModel):
    """Metric creation schema."""
    outcome_id: str
    name: str
    description: Optional[str] = None
    unit: Optional[str] = None
    target: Optional[MetricTargetCreate] = None
    actual: Optional[MetricActualCreate] = None


class MetricUpdate(BaseModel):
    """Metric update schema."""
    outcome_id: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    unit: Optional[str] = None
    target: Optional[MetricTargetCreate] = None
    actual: Optional[MetricActualCreate] = None


class MetricResponse(BaseModel):
    """Metric response schema."""
    id: str
    outcome_id: str
    name: str
    description: Optional[str] = None
    unit: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class MetricDetailResponse(MetricResponse):
    """Metric response including target and actual tracking data."""
    target: Optional[MetricTargetResponse] = None
    actuals: List[MetricActualResponse] = Field(default_factory=list)


class OutcomeDetailResponse(OutcomeResponse):
    """Outcome response including linked metrics."""
    linked_metrics: List[MetricDetailResponse] = Field(default_factory=list)


class CapabilityCreate(BaseModel):
    """Capability creation schema."""
    name: str
    description: Optional[str] = None
    category: str = "Other"
    status: str = "Draft"
    owner_organization_id: str
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class CapabilityUpdate(BaseModel):
    """Capability update schema."""
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    status: Optional[str] = None
    owner_organization_id: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class CapabilityResponse(BaseModel):
    """Capability response schema."""
    id: str
    name: str
    description: Optional[str] = None
    category: str = "Other"
    status: str = "Draft"
    owner_organization_id: str
    owner_organization_name: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class CapabilityChoiceLinkResponse(BaseModel):
    """Capability to strategic choice link response."""
    id: str
    capability_id: str
    strategic_choice_id: str
    strategic_choice_title: Optional[str] = None
    planning_cycle_id: Optional[str] = None
    strategic_objective_id: Optional[str] = None
    created_at: Optional[datetime] = None


class CapabilityAgreementLinkResponse(BaseModel):
    """Agreement summary linked through a capability's strategic choices."""
    id: str
    strategic_choice_id: str
    strategic_agreement_id: str
    strategic_agreement_title: Optional[str] = None
    strategic_agreement_status: Optional[str] = None
    planning_cycle_id: Optional[str] = None
    created_at: Optional[datetime] = None


class CapabilityAssessmentCreate(BaseModel):
    """Capability assessment creation schema."""
    capability_id: str
    planning_cycle_id: str
    current_maturity: int
    target_maturity: int
    assessment_notes: Optional[str] = None
    assessment_date: Optional[datetime] = None
    owner_organization_id: str


class CapabilityAssessmentUpdate(BaseModel):
    """Capability assessment update schema."""
    capability_id: Optional[str] = None
    planning_cycle_id: Optional[str] = None
    current_maturity: Optional[int] = None
    target_maturity: Optional[int] = None
    assessment_notes: Optional[str] = None
    assessment_date: Optional[datetime] = None
    owner_organization_id: Optional[str] = None


class CapabilityAssessmentResponse(BaseModel):
    """Capability assessment response schema."""
    id: str
    capability_id: str
    capability_name: Optional[str] = None
    planning_cycle_id: str
    planning_cycle_name: Optional[str] = None
    current_maturity: int
    target_maturity: int
    assessment_gap: int
    assessment_notes: Optional[str] = None
    assessment_date: Optional[datetime] = None
    owner_organization_id: str
    owner_organization_name: Optional[str] = None


class CapabilityDetailResponse(CapabilityResponse):
    """Capability detail response including linked choices and agreements."""
    linked_choices: List[CapabilityChoiceLinkResponse] = Field(default_factory=list)
    linked_agreements: List[CapabilityAgreementLinkResponse] = Field(default_factory=list)
    assessments: List[CapabilityAssessmentResponse] = Field(default_factory=list)


class CapabilityRoadmapItemResponse(BaseModel):
    """Capability roadmap timeline entry combining schedule and maturity gap."""
    capability_id: str
    capability_name: str
    category: str = "Other"
    status: str = "Draft"
    owner_organization_id: str
    owner_organization_name: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    current_maturity: int
    target_maturity: int
    assessment_gap: int
    latest_assessment_id: Optional[str] = None
    latest_planning_cycle_id: Optional[str] = None


class StrategicChoiceCapabilityLinkCreate(BaseModel):
    """Attach capability to strategic choice request schema."""
    capability_id: str


class StrategicContractCreate(BaseModel):
    """Strategic contract creation schema."""
    relationship_id: str
    concern_alignment: str = "Recommended"
    objective_alignment: str = "Recommended"
    capability_alignment: str = "Shared"
    investment_alignment: str = "Joint Approval"
    outcome_alignment: str = "Recommended"
    concern_decision_rights: str = "Review"
    objective_decision_rights: str = "Review"
    capability_decision_rights: str = "Consult"
    investment_decision_rights: str = "Approve"
    outcome_decision_rights: str = "Review"
    review_cadence: str = "Quarterly"
    notes: Optional[str] = None
    status: str = "Draft"
    version: int = 1


class StrategicContractUpdate(BaseModel):
    """Strategic contract update schema."""
    relationship_id: Optional[str] = None
    concern_alignment: Optional[str] = None
    objective_alignment: Optional[str] = None
    capability_alignment: Optional[str] = None
    investment_alignment: Optional[str] = None
    outcome_alignment: Optional[str] = None
    concern_decision_rights: Optional[str] = None
    objective_decision_rights: Optional[str] = None
    capability_decision_rights: Optional[str] = None
    investment_decision_rights: Optional[str] = None
    outcome_decision_rights: Optional[str] = None
    review_cadence: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = None
    version: Optional[int] = None


class StrategicContractResponse(BaseModel):
    """Strategic contract response schema."""
    id: str
    relationship_id: str
    concern_alignment: str = "Recommended"
    objective_alignment: str = "Recommended"
    capability_alignment: str = "Shared"
    investment_alignment: str = "Joint Approval"
    outcome_alignment: str = "Recommended"
    concern_decision_rights: str = "Review"
    objective_decision_rights: str = "Review"
    capability_decision_rights: str = "Consult"
    investment_decision_rights: str = "Approve"
    outcome_decision_rights: str = "Review"
    review_cadence: str = "Quarterly"
    notes: Optional[str] = None
    status: str = "Draft"
    version: int = 1
    created_date: Optional[datetime] = None
    modified_date: Optional[datetime] = None


class OrganizationImportRequest(BaseModel):
    """Organization import request schema."""
    csv_content: str
    full_reload: bool = False


class OrganizationImportResponse(BaseModel):
    """Organization import response schema."""
    total_rows: int
    imported: int
    updated: int
    skipped: int
    errors: List[str] = Field(default_factory=list)


class GovernanceConfig(BaseModel):
    """Governance administration configuration."""
    enterprise_name: str = "Enterprise"
    enterprise_code: Optional[str] = None
    enterprise_description: Optional[str] = None
    planning_cycles: List[str] = Field(default_factory=lambda: [
        "Annual Planning",
        "Strategic Review",
        "Quarterly Business Review",
        "Monthly Operations Review",
    ])
    strategy_authority_rules: List[str] = Field(default_factory=lambda: [
        "None = strategy created centrally only",
        "Constrained = strategy must stay within defined guardrails",
        "Shared = strategy requires joint approval",
        "Autonomous = strategy may be created locally",
    ])
    alignment_scoring_rules: List[str] = Field(default_factory=lambda: [
        "Score contract coverage against strategic objectives",
        "Highlight missing reporting obligations",
        "Detect conflicting contracts and authorities",
    ])
    required_strategy_artifacts: List[str] = Field(default_factory=lambda: [
        "North Star",
        "Objectives",
        "Initiatives",
        "Outcomes",
    ])
    strategy_review_cadence: str = "Quarterly Business Review"
    contract_templates: List[str] = Field(default_factory=lambda: [
        "Directive",
        "Alignment",
        "Collaborative",
        "Observational",
    ])
    planning_windows: List[str] = Field(default_factory=lambda: [
        "Annual Planning",
        "Quarterly Review",
    ])
    governance_policies: List[str] = Field(default_factory=lambda: [
        "Approval required for strategic contract activation",
        "Archived organizations remain queryable for history",
    ])
    escalation_workflows: List[str] = Field(default_factory=lambda: [
        "Business Unit Leader -> Strategy Administrator -> Global Administrator",
    ])
    updated_at: Optional[datetime] = None


class UserCreate(BaseModel):
    """User creation schema."""
    username: str
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    password: str


class UserUpdate(BaseModel):
    """User update schema."""
    email: Optional[EmailStr] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None


class UserAccountProfileUpdate(BaseModel):
    """Editable user account settings persisted by Sextant."""
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    display_name: Optional[str] = None
    job_title: Optional[str] = None
    department: Optional[str] = None
    timezone: Optional[str] = None
    phone: Optional[str] = None
    bio: Optional[str] = None
    avatar_data_url: Optional[str] = None


class UserAccountProfileResponse(BaseModel):
    """Merged account profile with read-only identity claims and editable local settings."""
    id: str
    username: str
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    display_name: Optional[str] = None
    job_title: Optional[str] = None
    department: Optional[str] = None
    timezone: Optional[str] = None
    phone: Optional[str] = None
    bio: Optional[str] = None
    avatar_data_url: Optional[str] = None
    roles: List[str] = Field(default_factory=list)
    keycloak_subject: Optional[str] = None
    keycloak_issuer: Optional[str] = None
    keycloak_account_url: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class UserActivityEventCreate(BaseModel):
    """Client-side user action event."""
    action: str = Field(..., min_length=1, max_length=120)
    target: Optional[str] = Field(default=None, max_length=200)
    metadata: Optional[dict] = None


class UserActivityEventResponse(BaseModel):
    """Recorded user action event."""
    id: str
    user_id: str
    username: Optional[str] = None
    action: str
    target: Optional[str] = None
    method: Optional[str] = None
    path: Optional[str] = None
    status_code: Optional[int] = None
    duration_ms: Optional[float] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    source: str = "server"
    metadata: dict = Field(default_factory=dict)
    created_at: datetime


class UserActivitySearchResponse(BaseModel):
    """Paginated user activity history response."""
    total: int
    items: List[UserActivityEventResponse] = Field(default_factory=list)


class UserResponse(BaseModel):
    """User response schema."""
    id: str
    username: str
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    roles: List[str] = Field(default_factory=list)
    is_active: bool = True
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class AuthResponse(BaseModel):
    """Authentication response."""
    access_token: str
    token_type: str
    user: UserResponse


class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    database: str
    timestamp: datetime


class ErrorResponse(BaseModel):
    """Error response schema."""
    detail: str
    status_code: int
    timestamp: datetime


class TokenResponse(BaseModel):
    """Token response."""
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class RoleCreate(BaseModel):
    """Role creation schema."""
    name: str = Field(..., min_length=1)
    description: Optional[str] = None


class RoleResponse(BaseModel):
    """Role response schema."""
    id: str
    name: str
    description: Optional[str] = None
    created_at: Optional[datetime] = None


class PermissionCreate(BaseModel):
    """Permission creation schema."""
    name: str = Field(..., min_length=1)
    description: Optional[str] = None
    resource: str


class PermissionResponse(BaseModel):
    """Permission response schema."""
    id: str
    name: str
    description: Optional[str] = None
    resource: str
    created_at: Optional[datetime] = None
