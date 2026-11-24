from datetime import datetime, timezone
from typing import Any, Optional
import csv
import io
import re

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import TypeAdapter

from app.core.database import get_db
from app.core.security import User, get_current_active_user
from app.schemas import (
    DriverCreate,
    DriverResponse,
    DriverUpdate,
    PlanningCycleCreate,
    PlanningCycleParticipantCreate,
    PlanningCycleParticipantResponse,
    PlanningCycleParticipantSuggestionResponse,
    PlanningCycleResponse,
    StrategyReviewCreate,
    StrategyReviewDetailResponse,
    StrategyReviewInitiativeLinkResponse,
    StrategyReviewObjectiveLinkResponse,
    StrategyReviewOutcomeLinkResponse,
    StrategyReviewResponse,
    StrategyReviewUpdate,
    StrategicThemeCreate,
    StrategicThemeResponse,
    StrategicThemeUpdate,
    PlanningCycleUpdate,
    OrganizationCreate,
    OrganizationImportRequest,
    OrganizationImportResponse,
    OrganizationResponse,
    OrganizationUpdate,
    GovernanceConfig,
    StrategicGroupCreate,
    StrategicGroupMembershipCreate,
    StrategicGroupMembershipResponse,
    StrategicGroupResponse,
    StrategicGroupUpdate,
    StrategicQuestionCreate,
    StrategicQuestionDriverLinkCreate,
    StrategicQuestionDriverLinkResponse,
    StrategicObjectiveCreate,
    StrategicObjectiveResponse,
    StrategicObjectiveUpdate,
    StrategicChoiceCreate,
    StrategicChoiceCapabilityLinkCreate,
    StrategicAgreementCreate,
    StrategicAgreementResponse,
    StrategicAgreementUpdate,
    InitiativeCreate,
    InitiativeUpdate,
    InitiativeResponse,
    InitiativeDetailResponse,
    InitiativeChoiceLinkResponse,
    InitiativeCapabilityLinkResponse,
    InitiativeAgreementLinkResponse,
    OutcomeCreate,
    OutcomeUpdate,
    OutcomeResponse,
    OutcomeDetailResponse,
    MetricCreate,
    MetricUpdate,
    MetricResponse,
    MetricDetailResponse,
    MetricTargetCreate,
    MetricTargetResponse,
    MetricActualCreate,
    MetricActualResponse,
    CapabilityCreate,
    CapabilityAssessmentCreate,
    CapabilityAssessmentResponse,
    CapabilityAssessmentUpdate,
    CapabilityDetailResponse,
    CapabilityResponse,
    CapabilityRoadmapItemResponse,
    CapabilityUpdate,
    CapabilityChoiceLinkResponse,
    CapabilityAgreementLinkResponse,
    StrategicChoiceResponse,
    StrategicChoiceUpdate,
    StrategicQuestionResponse,
    StrategicQuestionUpdate,
    StrategicRelationshipCreate,
    StrategicRelationshipResponse,
    StrategicRelationshipUpdate,
    StrategicContractCreate,
    StrategicContractResponse,
    StrategicContractUpdate,
)

router = APIRouter(prefix="/api/v1", tags=["administration"])


def _user_can_manage_organization(current_user: User) -> None:
    allowed_roles = {"admin", "strategy_admin", "global_administrator", "strategy administrator"}
    normalized = {role.lower() for role in current_user.roles}
    if not normalized.intersection(allowed_roles):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User does not have permission to manage administration data",
        )


def _organization_from_doc(doc: dict[str, Any]) -> OrganizationResponse:
    return OrganizationResponse(
        id=doc.get("_key") or doc.get("id"),
        name=doc.get("name"),
        code=doc.get("code"),
        description=doc.get("description"),
        parent_organization_id=doc.get("parent_organization_id"),
        organization_type=doc.get("organization_type"),
        region=doc.get("region"),
        leader=doc.get("leader"),
        status=doc.get("status", "active"),
        strategic_classification=doc.get("strategic_classification", "Operational"),
        fiscal_responsibility=doc.get("fiscal_responsibility", "Cost Center"),
        investment_authority=doc.get("investment_authority", "None"),
        is_root=bool(doc.get("is_root", False)),
        effective_date=doc.get("effective_date"),
        retirement_date=doc.get("retirement_date"),
        created_at=doc.get("created_at"),
        updated_at=doc.get("updated_at"),
    )


def _contract_from_doc(doc: dict[str, Any]) -> StrategicContractResponse:
    return StrategicContractResponse(
        id=doc.get("_key") or doc.get("id"),
        relationship_id=doc.get("relationship_id"),
        concern_alignment=doc.get("concern_alignment", "Recommended"),
        objective_alignment=doc.get("objective_alignment", "Recommended"),
        capability_alignment=doc.get("capability_alignment", "Shared"),
        investment_alignment=doc.get("investment_alignment", "Joint Approval"),
        outcome_alignment=doc.get("outcome_alignment", "Recommended"),
        concern_decision_rights=doc.get("concern_decision_rights", "Review"),
        objective_decision_rights=doc.get("objective_decision_rights", "Review"),
        capability_decision_rights=doc.get("capability_decision_rights", "Consult"),
        investment_decision_rights=doc.get("investment_decision_rights", "Approve"),
        outcome_decision_rights=doc.get("outcome_decision_rights", "Review"),
        review_cadence=doc.get("review_cadence", "Quarterly"),
        notes=doc.get("notes"),
        status=doc.get("status", "Draft"),
        version=doc.get("version", 1),
        created_date=doc.get("created_date"),
        modified_date=doc.get("modified_date"),
    )


def _relationship_from_doc(doc: dict[str, Any]) -> StrategicRelationshipResponse:
    return StrategicRelationshipResponse(
        id=doc.get("_key") or doc.get("id"),
        source_node_id=doc.get("source_node_id"),
        target_node_id=doc.get("target_node_id"),
        relationship_type=doc.get("relationship_type", "Governance"),
        participation_role=doc.get("participation_role", "Contributor"),
        strategy_role=doc.get("strategy_role", "Responds"),
        review_cadence=doc.get("review_cadence", "Quarterly"),
        status=doc.get("status", "Draft"),
        notes=doc.get("notes"),
        created_date=doc.get("created_date"),
        modified_date=doc.get("modified_date"),
    )


def _group_from_doc(doc: dict[str, Any]) -> StrategicGroupResponse:
    return StrategicGroupResponse(
        id=doc.get("_key") or doc.get("id"),
        name=doc.get("name"),
        description=doc.get("description"),
        group_type=doc.get("group_type", "Strategy Council"),
        status=doc.get("status", "Active"),
        created_at=doc.get("created_at"),
        updated_at=doc.get("updated_at"),
    )


def _membership_from_docs(
    membership: dict[str, Any],
    organization: dict[str, Any],
) -> StrategicGroupMembershipResponse:
    return StrategicGroupMembershipResponse(
        id=membership.get("_key") or membership.get("id"),
        strategic_group_id=membership.get("strategic_group_id"),
        organization_id=membership.get("organization_id"),
        organization_name=organization.get("name", membership.get("organization_id")),
        organization_code=organization.get("code"),
        organization_status=organization.get("status", "active"),
        created_at=membership.get("created_at"),
    )


def _planning_cycle_from_doc(
    doc: dict[str, Any],
    owner_organization_name: Optional[str] = None,
) -> PlanningCycleResponse:
    return PlanningCycleResponse(
        id=doc.get("_key") or doc.get("id"),
        name=doc.get("name"),
        description=doc.get("description"),
        owner_organization_id=doc.get("owner_organization_id"),
        owner_organization_name=owner_organization_name,
        status=doc.get("status", "Draft"),
        start_date=doc.get("start_date"),
        end_date=doc.get("end_date"),
        created_at=doc.get("created_at"),
        updated_at=doc.get("updated_at"),
    )


def _planning_cycle_participant_from_docs(
    participant_doc: dict[str, Any],
    participant_name: str,
    participant_status: Optional[str],
) -> PlanningCycleParticipantResponse:
    return PlanningCycleParticipantResponse(
        id=participant_doc.get("_key") or participant_doc.get("id"),
        planning_cycle_id=participant_doc.get("planning_cycle_id"),
        participant_type=participant_doc.get("participant_type"),
        participant_id=participant_doc.get("participant_id"),
        participant_name=participant_name,
        participant_status=participant_status,
        created_at=participant_doc.get("created_at"),
    )


def _strategic_theme_from_doc(doc: dict[str, Any]) -> StrategicThemeResponse:
    return StrategicThemeResponse(
        id=doc.get("_key") or doc.get("id"),
        planning_cycle_id=doc.get("planning_cycle_id"),
        name=doc.get("name"),
        description=doc.get("description"),
        status=doc.get("status", "Draft"),
        created_at=doc.get("created_at"),
        updated_at=doc.get("updated_at"),
    )


def _normalize(value: Any) -> str:
    return str(value or "").strip().lower()


def _matches_search(doc: dict[str, Any], fields: tuple[str, ...], search: Optional[str]) -> bool:
    if not search:
        return True
    needle = search.strip().lower()
    if not needle:
        return True
    return any(needle in _normalize(doc.get(field)) for field in fields)


def _matches_status(doc: dict[str, Any], status_filter: Optional[str]) -> bool:
    if not status_filter:
        return True
    return _normalize(doc.get("status")) == _normalize(status_filter)


def _slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug or f"org-{int(datetime.now(timezone.utc).timestamp() * 1000)}"


def _membership_key(strategic_group_id: str, organization_id: str) -> str:
    return f"{strategic_group_id}__{organization_id}"


def _planning_cycle_participant_key(planning_cycle_id: str, participant_type: str, participant_id: str) -> str:
    return f"{planning_cycle_id}__{participant_type}__{participant_id}"


def _strategic_question_driver_key(strategic_question_id: str, driver_id: str) -> str:
    return f"{strategic_question_id}__{driver_id}"


def _driver_from_doc(
    doc: dict[str, Any],
    owner_organization_name: Optional[str] = None,
    strategic_theme_name: Optional[str] = None,
) -> DriverResponse:
    return DriverResponse(
        id=doc.get("_key") or doc.get("id"),
        planning_cycle_id=doc.get("planning_cycle_id"),
        title=doc.get("title"),
        description=doc.get("description"),
        category=doc.get("category", "Other"),
        impact_level=doc.get("impact_level", "Medium"),
        time_horizon=doc.get("time_horizon", "1-3 Years"),
        status=doc.get("status", "Draft"),
        strategic_theme_id=doc.get("strategic_theme_id"),
        strategic_theme_name=strategic_theme_name,
        owner_organization_id=doc.get("owner_organization_id"),
        owner_organization_name=owner_organization_name,
        created_at=doc.get("created_at"),
        updated_at=doc.get("updated_at"),
    )


def _strategic_question_from_doc(
    doc: dict[str, Any],
    lead_organization_name: Optional[str] = None,
    drivers_linked: int = 0,
    strategic_theme_name: Optional[str] = None,
) -> StrategicQuestionResponse:
    return StrategicQuestionResponse(
        id=doc.get("_key") or doc.get("id"),
        planning_cycle_id=doc.get("planning_cycle_id"),
        title=doc.get("title"),
        description=doc.get("description"),
        priority=doc.get("priority", "Medium"),
        status=doc.get("status", "Draft"),
        strategic_theme_id=doc.get("strategic_theme_id"),
        strategic_theme_name=strategic_theme_name,
        lead_organization_id=doc.get("lead_organization_id"),
        lead_organization_name=lead_organization_name,
        drivers_linked=drivers_linked,
        created_at=doc.get("created_at"),
        updated_at=doc.get("updated_at"),
    )


def _strategic_question_driver_link_from_docs(
    doc: dict[str, Any],
    driver_doc: dict[str, Any],
) -> StrategicQuestionDriverLinkResponse:
    return StrategicQuestionDriverLinkResponse(
        id=doc.get("_key") or doc.get("id"),
        strategic_question_id=doc.get("strategic_question_id"),
        driver_id=doc.get("driver_id"),
        driver_title=driver_doc.get("title", doc.get("driver_id")),
        driver_status=driver_doc.get("status"),
        created_at=doc.get("created_at"),
    )


def _strategic_objective_from_doc(
    doc: dict[str, Any],
    question_title: Optional[str] = None,
    owner_organization_name: Optional[str] = None,
    strategic_theme_name: Optional[str] = None,
) -> StrategicObjectiveResponse:
    return StrategicObjectiveResponse(
        id=doc.get("_key") or doc.get("id"),
        planning_cycle_id=doc.get("planning_cycle_id"),
        strategic_question_id=doc.get("strategic_question_id"),
        strategic_question_title=question_title,
        title=doc.get("title"),
        description=doc.get("description"),
        objective_type=doc.get("objective_type"),
        priority=doc.get("priority", "Medium"),
        status=doc.get("status", "Draft"),
        strategic_theme_id=doc.get("strategic_theme_id"),
        strategic_theme_name=strategic_theme_name,
        owner_organization_id=doc.get("owner_organization_id"),
        owner_organization_name=owner_organization_name,
        target_date=doc.get("target_date"),
        created_at=doc.get("created_at"),
        updated_at=doc.get("updated_at"),
    )


def _strategic_choice_from_doc(
    doc: dict[str, Any],
    objective_title: Optional[str] = None,
    owner_organization_name: Optional[str] = None,
    strategic_theme_name: Optional[str] = None,
) -> StrategicChoiceResponse:
    return StrategicChoiceResponse(
        id=doc.get("_key") or doc.get("id"),
        planning_cycle_id=doc.get("planning_cycle_id"),
        strategic_objective_id=doc.get("strategic_objective_id"),
        strategic_objective_title=objective_title,
        title=doc.get("title"),
        description=doc.get("description"),
        choice_type=doc.get("choice_type"),
        status=doc.get("status", "Draft"),
        recommendation=doc.get("recommendation", "No Recommendation"),
        strategic_theme_id=doc.get("strategic_theme_id"),
        strategic_theme_name=strategic_theme_name,
        owner_organization_id=doc.get("owner_organization_id"),
        owner_organization_name=owner_organization_name,
        created_at=doc.get("created_at"),
        updated_at=doc.get("updated_at"),
    )


def _strategic_agreement_from_doc(
    doc: dict[str, Any],
    choice_title: Optional[str] = None,
    owner_organization_name: Optional[str] = None,
) -> StrategicAgreementResponse:
    return StrategicAgreementResponse(
        id=doc.get("_key") or doc.get("id"),
        planning_cycle_id=doc.get("planning_cycle_id"),
        strategic_choice_id=doc.get("strategic_choice_id"),
        strategic_choice_title=choice_title,
        title=doc.get("title"),
        description=doc.get("description"),
        status=doc.get("status", "Draft"),
        effective_date=doc.get("effective_date"),
        owner_organization_id=doc.get("owner_organization_id"),
        owner_organization_name=owner_organization_name,
        created_at=doc.get("created_at"),
        updated_at=doc.get("updated_at"),
    )


def _initiative_from_doc(
    doc: dict[str, Any],
    owner_organization_name: Optional[str] = None,
) -> InitiativeResponse:
    return InitiativeResponse(
        id=doc.get("_key") or doc.get("id"),
        planning_cycle_id=doc.get("planning_cycle_id"),
        name=doc.get("name"),
        description=doc.get("description"),
        status=doc.get("status", "Proposed"),
        owner_organization_id=doc.get("owner_organization_id"),
        owner_organization_name=owner_organization_name,
        start_date=doc.get("start_date"),
        end_date=doc.get("end_date"),
        budget=doc.get("budget"),
        created_at=doc.get("created_at"),
        updated_at=doc.get("updated_at"),
    )


def _initiative_choice_link_from_docs(
    doc: dict[str, Any],
    choice_doc: Optional[dict[str, Any]] = None,
) -> InitiativeChoiceLinkResponse:
    return InitiativeChoiceLinkResponse(
        id=doc.get("_key") or doc.get("id"),
        initiative_id=doc.get("initiative_id"),
        strategic_choice_id=doc.get("strategic_choice_id"),
        strategic_choice_title=(choice_doc or {}).get("title"),
        planning_cycle_id=(choice_doc or {}).get("planning_cycle_id"),
        strategic_objective_id=(choice_doc or {}).get("strategic_objective_id"),
        created_at=doc.get("created_at"),
    )


def _initiative_capability_link_from_docs(
    doc: dict[str, Any],
    capability_doc: Optional[dict[str, Any]] = None,
) -> InitiativeCapabilityLinkResponse:
    return InitiativeCapabilityLinkResponse(
        id=doc.get("_key") or doc.get("id"),
        initiative_id=doc.get("initiative_id"),
        capability_id=doc.get("capability_id"),
        capability_name=(capability_doc or {}).get("name"),
        capability_category=(capability_doc or {}).get("category"),
        capability_status=(capability_doc or {}).get("status"),
        created_at=doc.get("created_at"),
    )


def _initiative_agreement_link_from_docs(
    doc: dict[str, Any],
    agreement_doc: Optional[dict[str, Any]] = None,
) -> InitiativeAgreementLinkResponse:
    return InitiativeAgreementLinkResponse(
        id=doc.get("_key") or doc.get("id"),
        initiative_id=doc.get("initiative_id"),
        strategic_agreement_id=doc.get("strategic_agreement_id"),
        strategic_agreement_title=(agreement_doc or {}).get("title"),
        strategic_agreement_status=(agreement_doc or {}).get("status"),
        created_at=doc.get("created_at"),
    )


def _outcome_from_doc(doc: dict[str, Any]) -> OutcomeResponse:
    return OutcomeResponse(
        id=doc.get("_key") or doc.get("id"),
        planning_cycle_id=doc.get("planning_cycle_id"),
        strategic_objective_id=doc.get("strategic_objective_id"),
        initiative_id=doc.get("initiative_id"),
        name=doc.get("name"),
        description=doc.get("description"),
        created_at=doc.get("created_at"),
        updated_at=doc.get("updated_at"),
    )


def _metric_target_from_doc(doc: Optional[dict[str, Any]]) -> Optional[MetricTargetResponse]:
    if not doc:
        return None
    return MetricTargetResponse(
        id=doc.get("_key") or doc.get("id"),
        metric_id=doc.get("metric_id"),
        target_value=float(doc.get("target_value")),
        target_unit=doc.get("target_unit"),
        target_date=doc.get("target_date"),
        notes=doc.get("notes"),
        created_at=doc.get("created_at"),
    )


def _metric_actual_from_doc(doc: dict[str, Any]) -> MetricActualResponse:
    return MetricActualResponse(
        id=doc.get("_key") or doc.get("id"),
        metric_id=doc.get("metric_id"),
        actual_value=float(doc.get("actual_value")),
        actual_unit=doc.get("actual_unit"),
        measured_at=doc.get("measured_at"),
        notes=doc.get("notes"),
        created_at=doc.get("created_at"),
    )


def _metric_from_doc(
    doc: dict[str, Any],
    target_doc: Optional[dict[str, Any]] = None,
    actual_docs: Optional[list[dict[str, Any]]] = None,
) -> MetricDetailResponse:
    return MetricDetailResponse(
        id=doc.get("_key") or doc.get("id"),
        outcome_id=doc.get("outcome_id"),
        name=doc.get("name"),
        description=doc.get("description"),
        unit=doc.get("unit"),
        created_at=doc.get("created_at"),
        updated_at=doc.get("updated_at"),
        target=_metric_target_from_doc(target_doc),
        actuals=[_metric_actual_from_doc(item) for item in (actual_docs or [])],
    )


def _outcome_detail_from_docs(
    doc: dict[str, Any],
    metric_docs: list[dict[str, Any]],
    metric_targets: dict[str, dict[str, Any]],
    metric_actuals: dict[str, list[dict[str, Any]]],
) -> OutcomeDetailResponse:
    return OutcomeDetailResponse(
        **_outcome_from_doc(doc).model_dump(),
        linked_metrics=[
            _metric_from_doc(
                metric_doc,
                target_doc=metric_targets.get(metric_doc.get("_key") or metric_doc.get("id")),
                actual_docs=metric_actuals.get(metric_doc.get("_key") or metric_doc.get("id"), []),
            )
            for metric_doc in metric_docs
        ],
    )


def _strategy_review_from_doc(doc: dict[str, Any]) -> StrategyReviewResponse:
    return StrategyReviewResponse(
        id=doc.get("_key") or doc.get("id"),
        planning_cycle_id=doc.get("planning_cycle_id"),
        date=doc.get("date"),
        status=doc.get("status", "Draft"),
        recommendations=doc.get("recommendations"),
        summary=doc.get("summary"),
        created_at=doc.get("created_at"),
        updated_at=doc.get("updated_at"),
    )


def _strategy_review_objective_link_from_docs(
    doc: dict[str, Any],
    objective_doc: Optional[dict[str, Any]] = None,
) -> StrategyReviewObjectiveLinkResponse:
    return StrategyReviewObjectiveLinkResponse(
        id=doc.get("_key") or doc.get("id"),
        review_id=doc.get("review_id"),
        strategic_objective_id=doc.get("strategic_objective_id"),
        strategic_objective_title=(objective_doc or {}).get("title"),
        created_at=doc.get("created_at"),
    )


def _strategy_review_initiative_link_from_docs(
    doc: dict[str, Any],
    initiative_doc: Optional[dict[str, Any]] = None,
) -> StrategyReviewInitiativeLinkResponse:
    return StrategyReviewInitiativeLinkResponse(
        id=doc.get("_key") or doc.get("id"),
        review_id=doc.get("review_id"),
        initiative_id=doc.get("initiative_id"),
        initiative_name=(initiative_doc or {}).get("name"),
        created_at=doc.get("created_at"),
    )


def _strategy_review_outcome_link_from_docs(
    doc: dict[str, Any],
    outcome_doc: Optional[dict[str, Any]] = None,
) -> StrategyReviewOutcomeLinkResponse:
    return StrategyReviewOutcomeLinkResponse(
        id=doc.get("_key") or doc.get("id"),
        review_id=doc.get("review_id"),
        outcome_id=doc.get("outcome_id"),
        outcome_name=(outcome_doc or {}).get("name"),
        created_at=doc.get("created_at"),
    )


def _initiative_choice_rows_for_objective(
    choice_links,
    choices,
    cycle_id: str,
    objective_id: str,
    initiative_id: str,
) -> list[dict[str, Any]]:
    rows = []
    for item in (choice_links.all() if hasattr(choice_links, "all") else []):
        if item.get("initiative_id") != initiative_id:
            continue
        choice_id = item.get("strategic_choice_id")
        if not choice_id or not choices.has(choice_id):
            continue
        choice_doc = choices.get(choice_id)
        if choice_doc.get("planning_cycle_id") == cycle_id and choice_doc.get("strategic_objective_id") == objective_id:
            rows.append(item)
    return rows


def _capability_from_doc(
    doc: dict[str, Any],
    owner_organization_name: Optional[str] = None,
) -> CapabilityResponse:
    return CapabilityResponse(
        id=doc.get("_key") or doc.get("id"),
        name=doc.get("name"),
        description=doc.get("description"),
        category=doc.get("category", "Other"),
        status=doc.get("status", "Draft"),
        owner_organization_id=doc.get("owner_organization_id"),
        owner_organization_name=owner_organization_name,
        start_date=doc.get("start_date"),
        end_date=doc.get("end_date"),
        created_at=doc.get("created_at"),
        updated_at=doc.get("updated_at"),
    )


def _capability_choice_link_from_docs(
    doc: dict[str, Any],
    choice_doc: Optional[dict[str, Any]] = None,
) -> CapabilityChoiceLinkResponse:
    return CapabilityChoiceLinkResponse(
        id=doc.get("_key") or doc.get("id"),
        capability_id=doc.get("capability_id"),
        strategic_choice_id=doc.get("strategic_choice_id"),
        strategic_choice_title=(choice_doc or {}).get("title"),
        planning_cycle_id=(choice_doc or {}).get("planning_cycle_id"),
        strategic_objective_id=(choice_doc or {}).get("strategic_objective_id"),
        created_at=doc.get("created_at"),
    )


def _capability_agreement_link_from_doc(doc: dict[str, Any]) -> CapabilityAgreementLinkResponse:
    return CapabilityAgreementLinkResponse(
        id=f"{doc.get('strategic_choice_id')}::{doc.get('_key') or doc.get('id')}",
        strategic_choice_id=doc.get("strategic_choice_id"),
        strategic_agreement_id=doc.get("_key") or doc.get("id"),
        strategic_agreement_title=doc.get("title"),
        strategic_agreement_status=doc.get("status"),
        planning_cycle_id=doc.get("planning_cycle_id"),
        created_at=doc.get("created_at"),
    )


def _capability_assessment_from_doc(
    doc: dict[str, Any],
    capability_name: Optional[str] = None,
    planning_cycle_name: Optional[str] = None,
    owner_organization_name: Optional[str] = None,
) -> CapabilityAssessmentResponse:
    current = int(doc.get("current_maturity", 1))
    target = int(doc.get("target_maturity", 1))
    return CapabilityAssessmentResponse(
        id=doc.get("_key") or doc.get("id"),
        capability_id=doc.get("capability_id"),
        capability_name=capability_name,
        planning_cycle_id=doc.get("planning_cycle_id"),
        planning_cycle_name=planning_cycle_name,
        current_maturity=current,
        target_maturity=target,
        assessment_gap=max(target - current, 0),
        assessment_notes=doc.get("assessment_notes"),
        assessment_date=doc.get("assessment_date"),
        owner_organization_id=doc.get("owner_organization_id"),
        owner_organization_name=owner_organization_name,
    )


def _validate_planning_cycle_status(status_value: str) -> str:
    allowed = {
        "Draft",
        "Planning",
        "Negotiation",
        "Approved",
        "Executing",
        "Completed",
        "Archived",
    }
    if status_value not in allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid planning cycle status '{status_value}'.",
        )
    return status_value


def _validate_strategic_theme_status(status_value: str) -> str:
    allowed = {
        "Draft",
        "Active",
        "Archived",
    }
    if status_value not in allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid strategic theme status '{status_value}'.",
        )
    return status_value


def _validate_driver_category(category_value: str) -> str:
    allowed = {
        "Market",
        "Customer",
        "Technology",
        "Financial",
        "Workforce",
        "Regulatory",
        "Environmental",
        "Supply Chain",
        "Competitive",
        "Other",
    }
    if category_value not in allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid driver category '{category_value}'.",
        )
    return category_value


def _validate_driver_impact_level(impact_level_value: str) -> str:
    allowed = {
        "Low",
        "Medium",
        "High",
        "Critical",
    }
    if impact_level_value not in allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid driver impact level '{impact_level_value}'.",
        )
    return impact_level_value


def _validate_driver_time_horizon(time_horizon_value: str) -> str:
    allowed = {
        "Immediate",
        "1-3 Years",
        "3-5 Years",
        "5+ Years",
    }
    if time_horizon_value not in allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid driver time horizon '{time_horizon_value}'.",
        )
    return time_horizon_value


def _validate_driver_status(status_value: str) -> str:
    allowed = {
        "Draft",
        "Active",
        "Archived",
    }
    if status_value not in allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid driver status '{status_value}'.",
        )
    return status_value


def _validate_strategic_question_priority(priority_value: str) -> str:
    allowed = {
        "Low",
        "Medium",
        "High",
        "Critical",
    }
    if priority_value not in allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid strategic question priority '{priority_value}'.",
        )
    return priority_value


def _validate_strategic_question_status(status_value: str) -> str:
    allowed = {
        "Draft",
        "Active",
        "Answered",
        "Archived",
    }
    if status_value not in allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid strategic question status '{status_value}'.",
        )
    return status_value


def _validate_strategic_objective_type(objective_type_value: str) -> str:
    allowed = {
        "Growth",
        "Operational Excellence",
        "Customer",
        "Financial",
        "Workforce",
        "Technology",
        "Sustainability",
        "Risk",
        "Regulatory",
    }
    if objective_type_value not in allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid objective type '{objective_type_value}'.",
        )
    return objective_type_value


def _validate_strategic_objective_status(status_value: str) -> str:
    allowed = {
        "Draft",
        "Proposed",
        "Approved",
        "Active",
        "Completed",
        "Archived",
    }
    if status_value not in allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid strategic objective status '{status_value}'.",
        )
    return status_value


def _validate_strategic_choice_type(choice_type_value: str) -> str:
    allowed = {
        "Investment",
        "Operating Model",
        "Capability",
        "Market",
        "Product",
        "Technology",
        "People",
        "Partnership",
        "Acquisition",
        "Other",
    }
    if choice_type_value not in allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid choice type '{choice_type_value}'.",
        )
    return choice_type_value


def _validate_strategic_choice_status(status_value: str) -> str:
    allowed = {
        "Draft",
        "Under Evaluation",
        "Recommended",
        "Approved",
        "Rejected",
        "Archived",
    }
    if status_value not in allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid strategic choice status '{status_value}'.",
        )
    return status_value


def _validate_strategic_choice_recommendation(recommendation_value: str) -> str:
    allowed = {
        "No Recommendation",
        "Recommended",
        "Not Recommended",
    }
    if recommendation_value not in allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid strategic choice recommendation '{recommendation_value}'.",
        )
    return recommendation_value


def _validate_strategic_agreement_status(status_value: str) -> str:
    allowed = {
        "Draft",
        "Proposed",
        "Negotiating",
        "Approved",
        "Active",
        "Completed",
        "Cancelled",
    }
    if status_value not in allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid strategic agreement status '{status_value}'.",
        )
    return status_value


def _validate_initiative_status(status_value: str) -> str:
    allowed = {
        "Proposed",
        "Planned",
        "In Progress",
        "On Hold",
        "Completed",
        "Cancelled",
    }
    if status_value not in allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid initiative status '{status_value}'.",
        )
    return status_value


def _validate_strategy_review_status(status_value: str) -> str:
    allowed = {
        "Draft",
        "In Progress",
        "Completed",
        "Archived",
    }
    if status_value not in allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid strategy review status '{status_value}'.",
        )
    return status_value


def _validate_capability_category(category_value: str) -> str:
    allowed = {
        "Commercial",
        "Operations",
        "Supply Chain",
        "Technology",
        "People",
        "Finance",
        "Innovation",
        "Risk",
        "Sustainability",
        "Other",
    }
    if category_value not in allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid capability category '{category_value}'.",
        )
    return category_value


def _validate_capability_status(status_value: str) -> str:
    allowed = {
        "Draft",
        "Active",
        "Retired",
    }
    if status_value not in allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid capability status '{status_value}'.",
        )
    return status_value


def _validate_capability_maturity(value: int, field_name: str) -> int:
    if value < 1 or value > 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid {field_name} '{value}'. Must be between 1 and 5.",
        )
    return value


def _resolve_theme_name(themes, strategic_theme_id: Optional[str]) -> Optional[str]:
    if strategic_theme_id and themes.has(strategic_theme_id):
        return themes.get(strategic_theme_id).get("name")
    return None


def _resolve_owner_name(organizations, owner_organization_id: str) -> Optional[str]:
    if organizations.has(owner_organization_id):
        return organizations.get(owner_organization_id).get("name")
    return None


def _iso_or_none(value: Any) -> Optional[str]:
    if value is None:
        return None
    if isinstance(value, datetime):
        return value.isoformat()
    return str(value)


def _validate_capability_dates(start_date: Optional[datetime], end_date: Optional[datetime]) -> None:
    if start_date is None or end_date is None:
        return
    if start_date.tzinfo is None:
        start_date = start_date.replace(tzinfo=timezone.utc)
    if end_date.tzinfo is None:
        end_date = end_date.replace(tzinfo=timezone.utc)
    if end_date < start_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Capability end date must be on or after its start date.",
        )


def _default_governance_config() -> GovernanceConfig:
    return GovernanceConfig()


def _governance_collection(db):
    return _collection(db, "governance_config")


def _collection(db, name: str):
    if hasattr(db, "has_collection") and not db.has_collection(name):
        db.create_collection(name)
    return db.collection(name)


@router.get("/organizations", response_model=list[OrganizationResponse])
async def list_organizations(
    status: Optional[str] = None,
    search: Optional[str] = None,
    db=Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """List organizational units available to the current user."""
    _user_can_manage_organization(current_user)
    organizations = _collection(db, "organizations")
    items = organizations.all() if hasattr(organizations, "all") else []
    filtered = [
        item for item in items
        if _matches_status(item, status) and _matches_search(item, ("name", "code", "leader", "region"), search)
    ]
    response_items: list[OrganizationResponse] = []
    for item in filtered:
        try:
            response_items.append(_organization_from_doc(item))
        except Exception:
            continue
    return response_items


@router.post("/organizations", response_model=OrganizationResponse)
async def create_organization(
    payload: OrganizationCreate,
    db=Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Create a new organization unit."""
    _user_can_manage_organization(current_user)
    organizations = _collection(db, "organizations")
    now = datetime.now(timezone.utc).isoformat()
    org_key = payload.code or f"org-{int(datetime.now(timezone.utc).timestamp() * 1000)}"
    if organizations.has(org_key):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Organization '{org_key}' already exists",
        )
    doc = {
        "_key": org_key,
        "name": payload.name,
        "code": payload.code,
        "description": payload.description,
        "parent_organization_id": payload.parent_organization_id,
        "organization_type": payload.organization_type,
        "region": payload.region,
        "leader": payload.leader,
        "status": payload.status,
        "strategic_classification": payload.strategic_classification,
        "fiscal_responsibility": payload.fiscal_responsibility,
        "investment_authority": payload.investment_authority,
        "is_root": payload.is_root,
        "effective_date": payload.effective_date,
        "retirement_date": payload.retirement_date,
        "created_at": now,
        "updated_at": now,
    }
    organizations.insert(doc)
    return _organization_from_doc(doc)


@router.post("/organizations/import", response_model=OrganizationImportResponse)
async def import_organizations(
    payload: OrganizationImportRequest,
    db=Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Import organization records from CSV content."""
    _user_can_manage_organization(current_user)
    organizations = _collection(db, "organizations")

    csv_content = payload.csv_content.strip()
    if not csv_content:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="CSV content is required")

    reader = csv.DictReader(io.StringIO(csv_content))
    if not reader.fieldnames:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="CSV header row is required")

    errors: list[str] = []
    imported = 0
    updated = 0
    skipped = 0
    total_rows = 0
    imported_keys: set[str] = set()

    for row_number, row in enumerate(reader, start=2):
        total_rows += 1
        normalized = {str(key).strip().lower(): (value.strip() if isinstance(value, str) else value) for key, value in row.items() if key}
        name = normalized.get("name")
        if not name:
            skipped += 1
            errors.append(f"Row {row_number}: name is required")
            continue

        code = normalized.get("code") or _slugify(name)
        document = {
            "_key": code,
            "name": name,
            "code": normalized.get("code") or code,
            "description": normalized.get("description") or None,
            "parent_organization_id": normalized.get("parent_organization_id") or None,
            "organization_type": normalized.get("organization_type") or "Business Unit",
            "region": normalized.get("region") or None,
            "leader": normalized.get("leader") or None,
            "status": normalized.get("status") or "active",
            "strategic_classification": normalized.get("strategic_classification") or "Operational",
            "fiscal_responsibility": normalized.get("fiscal_responsibility") or "Cost Center",
            "investment_authority": normalized.get("investment_authority") or "None",
            "is_root": str(normalized.get("is_root") or "").strip().lower() in {"1", "true", "yes", "on"},
            "effective_date": normalized.get("effective_date") or None,
            "retirement_date": normalized.get("retirement_date") or None,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }

        if organizations.has(code):
            existing = organizations.get(code)
            document["created_at"] = existing.get("created_at", document["created_at"])
            organizations.update({"_key": code, **existing, **document})
            updated += 1
        else:
            organizations.insert(document)
            imported += 1

        imported_keys.add(code)

    if payload.full_reload:
        for item in organizations.all() if hasattr(organizations, "all") else []:
            key = item.get("_key") or item.get("code")
            if key and key not in imported_keys:
                item["status"] = "archived"
                item["updated_at"] = datetime.now(timezone.utc).isoformat()
                organizations.update({"_key": key, **item})

    return OrganizationImportResponse(
        total_rows=total_rows,
        imported=imported,
        updated=updated,
        skipped=skipped,
        errors=errors,
    )


@router.get("/organizations/{organization_id}", response_model=OrganizationResponse)
async def get_organization(
    organization_id: str,
    db=Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get a single organization record by id."""
    _user_can_manage_organization(current_user)
    organizations = _collection(db, "organizations")
    if not organizations.has(organization_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")
    return _organization_from_doc(organizations.get(organization_id))


@router.put("/organizations/{organization_id}", response_model=OrganizationResponse)
async def update_organization(
    organization_id: str,
    payload: OrganizationUpdate,
    db=Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Update an organization record."""
    _user_can_manage_organization(current_user)
    organizations = _collection(db, "organizations")
    if not organizations.has(organization_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")

    existing = organizations.get(organization_id)
    update_data = payload.model_dump(exclude_unset=True)
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    organizations.update({"_key": organization_id, **existing, **update_data})
    return _organization_from_doc(organizations.get(organization_id))


@router.post("/organizations/{organization_id}/set-root", response_model=OrganizationResponse)
async def set_organization_as_root(
    organization_id: str,
    db=Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Set a single top-level organization as the hierarchy root when no root is currently defined."""
    _user_can_manage_organization(current_user)
    organizations = _collection(db, "organizations")
    if not organizations.has(organization_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")

    all_orgs = list(organizations.all()) if hasattr(organizations, "all") else []
    existing_roots = [org for org in all_orgs if bool(org.get("is_root", False))]
    if existing_roots:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A hierarchy root is already defined.",
        )

    top_level_orgs = [org for org in all_orgs if not (org.get("parent_organization_id") or "").strip()]
    if len(top_level_orgs) != 1:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Root can only be set when exactly one top-level organization exists.",
        )

    top_org = top_level_orgs[0]
    top_org_key = top_org.get("_key") or top_org.get("id")
    if top_org_key != organization_id:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Only the single top-level organization can be set as root.",
        )

    top_org["is_root"] = True
    top_org["updated_at"] = datetime.now(timezone.utc).isoformat()
    organizations.update({"_key": organization_id, **top_org})
    return _organization_from_doc(organizations.get(organization_id))


@router.patch("/organizations/{organization_id}/archive", response_model=OrganizationResponse)
async def archive_organization(
    organization_id: str,
    db=Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Archive an organization record."""
    _user_can_manage_organization(current_user)
    organizations = _collection(db, "organizations")
    if not organizations.has(organization_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")

    existing = organizations.get(organization_id)
    existing["status"] = "archived"
    existing["updated_at"] = datetime.now(timezone.utc).isoformat()
    organizations.update({"_key": organization_id, **existing})
    return _organization_from_doc(organizations.get(organization_id))


@router.delete("/organizations/{organization_id}", response_model=OrganizationResponse)
async def delete_organization(
    organization_id: str,
    db=Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Delete an organization record."""
    _user_can_manage_organization(current_user)
    organizations = _collection(db, "organizations")
    memberships = _collection(db, "strategic_group_memberships")
    if not organizations.has(organization_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")

    existing = organizations.get(organization_id)
    if hasattr(organizations, "delete"):
        organizations.delete(organization_id)
    else:
        del organizations.documents[organization_id]

    related_memberships = [
        item for item in (memberships.all() if hasattr(memberships, "all") else [])
        if item.get("organization_id") == organization_id
    ]
    for membership in related_memberships:
        membership_key = membership.get("_key") or membership.get("id")
        if membership_key and memberships.has(membership_key):
            memberships.delete(membership_key)

    return _organization_from_doc(existing)


@router.get("/strategic-groups", response_model=list[StrategicGroupResponse])
async def list_strategic_groups(
    status: Optional[str] = None,
    search: Optional[str] = None,
    db=Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """List strategic participation groups."""
    _user_can_manage_organization(current_user)
    groups = _collection(db, "strategic_groups")
    items = groups.all() if hasattr(groups, "all") else []
    filtered = [
        item for item in items
        if _matches_status(item, status) and _matches_search(item, ("name", "description", "group_type"), search)
    ]
    return [_group_from_doc(item) for item in filtered]


@router.post("/strategic-groups", response_model=StrategicGroupResponse)
async def create_strategic_group(
    payload: StrategicGroupCreate,
    db=Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Create a strategic participation group."""
    _user_can_manage_organization(current_user)
    groups = _collection(db, "strategic_groups")
    now = datetime.now(timezone.utc).isoformat()
    base_key = _slugify(payload.name)
    key = base_key
    if groups.has(key):
        key = f"{base_key}-{int(datetime.now(timezone.utc).timestamp() * 1000)}"

    doc = {
        "_key": key,
        "name": payload.name,
        "description": payload.description,
        "group_type": payload.group_type,
        "status": payload.status,
        "created_at": now,
        "updated_at": now,
    }
    groups.insert(doc)
    return _group_from_doc(doc)


@router.get("/strategic-groups/{group_id}", response_model=StrategicGroupResponse)
async def get_strategic_group(
    group_id: str,
    db=Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get a strategic participation group by id."""
    _user_can_manage_organization(current_user)
    groups = _collection(db, "strategic_groups")
    if not groups.has(group_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic group not found")
    return _group_from_doc(groups.get(group_id))


@router.put("/strategic-groups/{group_id}", response_model=StrategicGroupResponse)
async def update_strategic_group(
    group_id: str,
    payload: StrategicGroupUpdate,
    db=Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Update a strategic participation group."""
    _user_can_manage_organization(current_user)
    groups = _collection(db, "strategic_groups")
    if not groups.has(group_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic group not found")

    existing = groups.get(group_id)
    update_data = payload.model_dump(exclude_unset=True)
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    groups.update({"_key": group_id, **existing, **update_data})
    return _group_from_doc(groups.get(group_id))


@router.patch("/strategic-groups/{group_id}/archive", response_model=StrategicGroupResponse)
async def archive_strategic_group(
    group_id: str,
    db=Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Archive a strategic participation group."""
    _user_can_manage_organization(current_user)
    groups = _collection(db, "strategic_groups")
    if not groups.has(group_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic group not found")

    existing = groups.get(group_id)
    existing["status"] = "Archived"
    existing["updated_at"] = datetime.now(timezone.utc).isoformat()
    groups.update({"_key": group_id, **existing})
    return _group_from_doc(groups.get(group_id))


@router.get("/strategic-groups/{group_id}/members", response_model=list[StrategicGroupMembershipResponse])
async def list_strategic_group_members(
    group_id: str,
    db=Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """List all organization members of a strategic participation group."""
    _user_can_manage_organization(current_user)
    groups = _collection(db, "strategic_groups")
    memberships = _collection(db, "strategic_group_memberships")
    organizations = _collection(db, "organizations")

    if not groups.has(group_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic group not found")

    group_memberships = [
        item for item in (memberships.all() if hasattr(memberships, "all") else [])
        if item.get("strategic_group_id") == group_id
    ]

    results: list[StrategicGroupMembershipResponse] = []
    for item in group_memberships:
        org_id = item.get("organization_id")
        if not org_id or not organizations.has(org_id):
            continue
        organization = organizations.get(org_id)
        results.append(_membership_from_docs(item, organization))

    return results


@router.post("/strategic-groups/{group_id}/members", response_model=StrategicGroupMembershipResponse)
async def add_strategic_group_member(
    group_id: str,
    payload: StrategicGroupMembershipCreate,
    db=Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Add an organization member to a strategic participation group."""
    _user_can_manage_organization(current_user)
    groups = _collection(db, "strategic_groups")
    memberships = _collection(db, "strategic_group_memberships")
    organizations = _collection(db, "organizations")

    if not groups.has(group_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic group not found")
    if not organizations.has(payload.organization_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")

    key = _membership_key(group_id, payload.organization_id)
    if memberships.has(key):
        organization = organizations.get(payload.organization_id)
        return _membership_from_docs(memberships.get(key), organization)

    now = datetime.now(timezone.utc).isoformat()
    doc = {
        "_key": key,
        "strategic_group_id": group_id,
        "organization_id": payload.organization_id,
        "created_at": now,
    }
    memberships.insert(doc)
    return _membership_from_docs(doc, organizations.get(payload.organization_id))


@router.delete("/strategic-groups/{group_id}/members/{organization_id}", response_model=StrategicGroupMembershipResponse)
async def remove_strategic_group_member(
    group_id: str,
    organization_id: str,
    db=Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Remove an organization member from a strategic participation group."""
    _user_can_manage_organization(current_user)
    groups = _collection(db, "strategic_groups")
    memberships = _collection(db, "strategic_group_memberships")
    organizations = _collection(db, "organizations")

    if not groups.has(group_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic group not found")

    key = _membership_key(group_id, organization_id)
    if not memberships.has(key):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic group membership not found")

    existing = memberships.get(key)
    if hasattr(memberships, "delete"):
        memberships.delete(key)
    else:
        del memberships.documents[key]

    organization = organizations.get(organization_id) if organizations.has(organization_id) else {
        "name": organization_id,
        "code": None,
        "status": "unknown",
    }
    return _membership_from_docs(existing, organization)


@router.get("/planning-cycles", response_model=list[PlanningCycleResponse])
async def list_planning_cycles(
    status: Optional[str] = None,
    search: Optional[str] = None,
    db=Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """List planning cycles."""
    _user_can_manage_organization(current_user)
    planning_cycles = _collection(db, "planning_cycles")
    organizations = _collection(db, "organizations")
    items = planning_cycles.all() if hasattr(planning_cycles, "all") else []
    filtered = [
        item for item in items
        if _matches_status(item, status) and _matches_search(item, ("name", "description"), search)
    ]
    return [
        _planning_cycle_from_doc(
            item,
            _resolve_owner_name(organizations, item.get("owner_organization_id")),
        )
        for item in filtered
    ]


@router.get(
    "/planning-cycles/participant-suggestions",
    response_model=list[PlanningCycleParticipantSuggestionResponse],
)
async def suggest_planning_cycle_participants(
    owner_organization_id: str,
    db=Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Suggest potential planning cycle participants from active strategic relationships."""
    _user_can_manage_organization(current_user)
    organizations = _collection(db, "organizations")
    relationships = _collection(db, "strategic_relationships")

    if not organizations.has(owner_organization_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Owner organization not found")

    suggestion_counts: dict[str, int] = {}
    relationship_items = relationships.all() if hasattr(relationships, "all") else []
    for rel in relationship_items:
        if _normalize(rel.get("status")) != "active":
            continue

        source_id = rel.get("source_node_id")
        target_id = rel.get("target_node_id")
        if source_id == owner_organization_id and target_id and target_id != owner_organization_id:
            suggestion_counts[target_id] = suggestion_counts.get(target_id, 0) + 1
        elif target_id == owner_organization_id and source_id and source_id != owner_organization_id:
            suggestion_counts[source_id] = suggestion_counts.get(source_id, 0) + 1

    suggestions: list[PlanningCycleParticipantSuggestionResponse] = []
    for organization_id, count in suggestion_counts.items():
        if not organizations.has(organization_id):
            continue
        organization = organizations.get(organization_id)
        suggestions.append(
            PlanningCycleParticipantSuggestionResponse(
                organization_id=organization_id,
                organization_name=organization.get("name", organization_id),
                organization_status=organization.get("status"),
                relationship_count=count,
            )
        )

    return sorted(
        suggestions,
        key=lambda item: (-item.relationship_count, item.organization_name.lower()),
    )


@router.post("/planning-cycles", response_model=PlanningCycleResponse)
async def create_planning_cycle(
    payload: PlanningCycleCreate,
    db=Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Create a planning cycle."""
    _user_can_manage_organization(current_user)
    organizations = _collection(db, "organizations")
    planning_cycles = _collection(db, "planning_cycles")

    if not organizations.has(payload.owner_organization_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Owner organization not found")

    cycle_status = _validate_planning_cycle_status(payload.status)
    now = datetime.now(timezone.utc).isoformat()
    key = f"planning-cycle-{int(datetime.now(timezone.utc).timestamp() * 1000)}"
    doc = {
        "_key": key,
        "name": payload.name,
        "description": payload.description,
        "owner_organization_id": payload.owner_organization_id,
        "status": cycle_status,
        "start_date": _iso_or_none(payload.start_date),
        "end_date": _iso_or_none(payload.end_date),
        "created_at": now,
        "updated_at": now,
    }
    planning_cycles.insert(doc)
    owner_name = organizations.get(payload.owner_organization_id).get("name")
    return _planning_cycle_from_doc(doc, owner_name)


@router.get("/planning-cycles/{cycle_id}", response_model=PlanningCycleResponse)
async def get_planning_cycle(
    cycle_id: str,
    db=Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get a planning cycle by id."""
    _user_can_manage_organization(current_user)
    planning_cycles = _collection(db, "planning_cycles")
    organizations = _collection(db, "organizations")
    if not planning_cycles.has(cycle_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Planning cycle not found")

    cycle = planning_cycles.get(cycle_id)
    owner_name = _resolve_owner_name(organizations, cycle.get("owner_organization_id"))
    return _planning_cycle_from_doc(cycle, owner_name)


@router.put("/planning-cycles/{cycle_id}", response_model=PlanningCycleResponse)
async def update_planning_cycle(
    cycle_id: str,
    payload: PlanningCycleUpdate,
    db=Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Update a planning cycle."""
    _user_can_manage_organization(current_user)
    planning_cycles = _collection(db, "planning_cycles")
    organizations = _collection(db, "organizations")
    if not planning_cycles.has(cycle_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Planning cycle not found")

    update_data = payload.model_dump(exclude_unset=True)
    if "owner_organization_id" in update_data and not organizations.has(update_data["owner_organization_id"]):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Owner organization not found")
    if "status" in update_data:
        update_data["status"] = _validate_planning_cycle_status(update_data["status"])
    if "start_date" in update_data:
        update_data["start_date"] = _iso_or_none(update_data["start_date"])
    if "end_date" in update_data:
        update_data["end_date"] = _iso_or_none(update_data["end_date"])

    existing = planning_cycles.get(cycle_id)
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    planning_cycles.update({"_key": cycle_id, **existing, **update_data})

    stored = planning_cycles.get(cycle_id)
    owner_name = _resolve_owner_name(organizations, stored.get("owner_organization_id"))
    return _planning_cycle_from_doc(stored, owner_name)


@router.patch("/planning-cycles/{cycle_id}/archive", response_model=PlanningCycleResponse)
async def archive_planning_cycle(
    cycle_id: str,
    db=Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Archive a planning cycle."""
    _user_can_manage_organization(current_user)
    planning_cycles = _collection(db, "planning_cycles")
    organizations = _collection(db, "organizations")
    if not planning_cycles.has(cycle_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Planning cycle not found")

    cycle = planning_cycles.get(cycle_id)
    cycle["status"] = "Archived"
    cycle["updated_at"] = datetime.now(timezone.utc).isoformat()
    planning_cycles.update({"_key": cycle_id, **cycle})

    owner_name = _resolve_owner_name(organizations, cycle.get("owner_organization_id"))
    return _planning_cycle_from_doc(planning_cycles.get(cycle_id), owner_name)


@router.get("/planning-cycles/{cycle_id}/reviews", response_model=list[StrategyReviewResponse])
async def list_strategy_reviews(
    cycle_id: str,
    db=Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """List strategy reviews for a planning cycle."""
    _user_can_manage_organization(current_user)
    planning_cycles = _collection(db, "planning_cycles")
    reviews = _collection(db, "strategy_reviews")

    if not planning_cycles.has(cycle_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Planning cycle not found")

    review_items = [
        item for item in (reviews.all() if hasattr(reviews, "all") else [])
        if item.get("planning_cycle_id") == cycle_id
    ]
    sorted_reviews = sorted(review_items, key=lambda item: item.get("date") or "", reverse=True)
    return [_strategy_review_from_doc(item) for item in sorted_reviews]


@router.post("/planning-cycles/{cycle_id}/reviews", response_model=StrategyReviewResponse)
async def create_strategy_review(
    cycle_id: str,
    payload: StrategyReviewCreate,
    db=Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Create a strategy review for a planning cycle and snapshot its linked artifacts."""
    _user_can_manage_organization(current_user)
    planning_cycles = _collection(db, "planning_cycles")
    objectives = _collection(db, "strategic_objectives")
    initiatives = _collection(db, "initiatives")
    outcomes = _collection(db, "outcomes")
    reviews = _collection(db, "strategy_reviews")
    review_objectives = _collection(db, "strategy_review_objectives")
    review_initiatives = _collection(db, "strategy_review_initiatives")
    review_outcomes = _collection(db, "strategy_review_outcomes")

    if not planning_cycles.has(cycle_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Planning cycle not found")
    if payload.planning_cycle_id != cycle_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="planning_cycle_id must match route cycle_id")

    _validate_strategy_review_status(payload.status)
    now = datetime.now(timezone.utc).isoformat()
    review_key = f"{cycle_id}__review-{int(datetime.now(timezone.utc).timestamp() * 1000)}"
    review_doc = {
        "_key": review_key,
        "planning_cycle_id": cycle_id,
        "date": payload.date,
        "status": payload.status,
        "recommendations": payload.recommendations,
        "summary": payload.summary,
        "created_at": now,
        "updated_at": now,
    }
    reviews.insert(review_doc)

    objective_items = [
        item for item in (objectives.all() if hasattr(objectives, "all") else [])
        if item.get("planning_cycle_id") == cycle_id
    ]
    initiative_items = [
        item for item in (initiatives.all() if hasattr(initiatives, "all") else [])
        if item.get("planning_cycle_id") == cycle_id
    ]
    outcome_items = [
        item for item in (outcomes.all() if hasattr(outcomes, "all") else [])
        if item.get("planning_cycle_id") == cycle_id
    ]

    for objective in objective_items:
        review_objectives.insert(
            {
                "_key": f"{review_key}::{objective.get('_key') or objective.get('id')}",
                "review_id": review_key,
                "strategic_objective_id": objective.get("_key") or objective.get("id"),
                "created_at": now,
            }
        )
    for initiative in initiative_items:
        review_initiatives.insert(
            {
                "_key": f"{review_key}::{initiative.get('_key') or initiative.get('id')}",
                "review_id": review_key,
                "initiative_id": initiative.get("_key") or initiative.get("id"),
                "created_at": now,
            }
        )
    for outcome in outcome_items:
        review_outcomes.insert(
            {
                "_key": f"{review_key}::{outcome.get('_key') or outcome.get('id')}",
                "review_id": review_key,
                "outcome_id": outcome.get("_key") or outcome.get("id"),
                "created_at": now,
            }
        )

    return _strategy_review_from_doc(review_doc)


@router.get("/planning-cycles/{cycle_id}/reviews/{review_id}", response_model=StrategyReviewDetailResponse)
async def get_strategy_review(
    cycle_id: str,
    review_id: str,
    db=Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get a strategy review with linked objectives, initiatives, and outcomes."""
    _user_can_manage_organization(current_user)
    planning_cycles = _collection(db, "planning_cycles")
    reviews = _collection(db, "strategy_reviews")
    review_objectives = _collection(db, "strategy_review_objectives")
    review_initiatives = _collection(db, "strategy_review_initiatives")
    review_outcomes = _collection(db, "strategy_review_outcomes")
    objectives = _collection(db, "strategic_objectives")
    initiatives = _collection(db, "initiatives")
    outcomes = _collection(db, "outcomes")

    if not planning_cycles.has(cycle_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Planning cycle not found")
    if not reviews.has(review_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategy review not found")

    review = reviews.get(review_id)
    if review.get("planning_cycle_id") != cycle_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategy review not found")

    linked_objective_rows = [
        item for item in (review_objectives.all() if hasattr(review_objectives, "all") else [])
        if item.get("review_id") == review_id and objectives.has(item.get("strategic_objective_id"))
    ]
    linked_initiative_rows = [
        item for item in (review_initiatives.all() if hasattr(review_initiatives, "all") else [])
        if item.get("review_id") == review_id and initiatives.has(item.get("initiative_id"))
    ]
    linked_outcome_rows = [
        item for item in (review_outcomes.all() if hasattr(review_outcomes, "all") else [])
        if item.get("review_id") == review_id and outcomes.has(item.get("outcome_id"))
    ]

    return StrategyReviewDetailResponse(
        **_strategy_review_from_doc(review).model_dump(),
        linked_objectives=[
            _strategy_review_objective_link_from_docs(item, objectives.get(item.get("strategic_objective_id")))
            for item in linked_objective_rows
        ],
        linked_initiatives=[
            _strategy_review_initiative_link_from_docs(item, initiatives.get(item.get("initiative_id")))
            for item in linked_initiative_rows
        ],
        linked_outcomes=[
            _strategy_review_outcome_link_from_docs(item, outcomes.get(item.get("outcome_id")))
            for item in linked_outcome_rows
        ],
    )


@router.put("/planning-cycles/{cycle_id}/reviews/{review_id}", response_model=StrategyReviewResponse)
async def update_strategy_review(
    cycle_id: str,
    review_id: str,
    payload: StrategyReviewUpdate,
    db=Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Update a strategy review."""
    _user_can_manage_organization(current_user)
    planning_cycles = _collection(db, "planning_cycles")
    reviews = _collection(db, "strategy_reviews")

    if not planning_cycles.has(cycle_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Planning cycle not found")
    if not reviews.has(review_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategy review not found")

    existing = reviews.get(review_id)
    if existing.get("planning_cycle_id") != cycle_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategy review not found")

    update_data = payload.model_dump(exclude_unset=True)
    if "planning_cycle_id" in update_data and update_data["planning_cycle_id"] != cycle_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="planning_cycle_id must match route cycle_id")
    if "status" in update_data:
        update_data["status"] = _validate_strategy_review_status(update_data["status"])

    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    reviews.update({"_key": review_id, **existing, **update_data})
    return _strategy_review_from_doc(reviews.get(review_id))


@router.get("/planning-cycles/{cycle_id}/participants", response_model=list[PlanningCycleParticipantResponse])
async def list_planning_cycle_participants(
    cycle_id: str,
    db=Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """List planning cycle participants (organizations and strategic groups)."""
    _user_can_manage_organization(current_user)
    planning_cycles = _collection(db, "planning_cycles")
    participants = _collection(db, "planning_cycle_participants")
    organizations = _collection(db, "organizations")
    strategic_groups = _collection(db, "strategic_groups")

    if not planning_cycles.has(cycle_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Planning cycle not found")

    participant_items = [
        item for item in (participants.all() if hasattr(participants, "all") else [])
        if item.get("planning_cycle_id") == cycle_id
    ]

    results: list[PlanningCycleParticipantResponse] = []
    for item in participant_items:
        participant_type = item.get("participant_type")
        participant_id = item.get("participant_id")
        if participant_type == "organization" and organizations.has(participant_id):
            source = organizations.get(participant_id)
            results.append(
                _planning_cycle_participant_from_docs(
                    item,
                    source.get("name", participant_id),
                    source.get("status"),
                )
            )
        elif participant_type == "strategic_group" and strategic_groups.has(participant_id):
            source = strategic_groups.get(participant_id)
            results.append(
                _planning_cycle_participant_from_docs(
                    item,
                    source.get("name", participant_id),
                    source.get("status"),
                )
            )

    return results


@router.post("/planning-cycles/{cycle_id}/participants", response_model=PlanningCycleParticipantResponse)
async def add_planning_cycle_participant(
    cycle_id: str,
    payload: PlanningCycleParticipantCreate,
    db=Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Add an organization or strategic group as a planning cycle participant."""
    _user_can_manage_organization(current_user)
    planning_cycles = _collection(db, "planning_cycles")
    participants = _collection(db, "planning_cycle_participants")
    organizations = _collection(db, "organizations")
    strategic_groups = _collection(db, "strategic_groups")

    if not planning_cycles.has(cycle_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Planning cycle not found")

    participant_type = _normalize(payload.participant_type)
    if participant_type not in {"organization", "strategic_group"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="participant_type must be 'organization' or 'strategic_group'",
        )

    if participant_type == "organization":
        if not organizations.has(payload.participant_id):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")
        source = organizations.get(payload.participant_id)
    else:
        if not strategic_groups.has(payload.participant_id):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic group not found")
        source = strategic_groups.get(payload.participant_id)

    key = _planning_cycle_participant_key(cycle_id, participant_type, payload.participant_id)
    if participants.has(key):
        existing = participants.get(key)
        return _planning_cycle_participant_from_docs(
            existing,
            source.get("name", payload.participant_id),
            source.get("status"),
        )

    now = datetime.now(timezone.utc).isoformat()
    doc = {
        "_key": key,
        "planning_cycle_id": cycle_id,
        "participant_type": participant_type,
        "participant_id": payload.participant_id,
        "created_at": now,
    }
    participants.insert(doc)

    return _planning_cycle_participant_from_docs(
        doc,
        source.get("name", payload.participant_id),
        source.get("status"),
    )


@router.delete(
    "/planning-cycles/{cycle_id}/participants/{participant_type}/{participant_id}",
    response_model=PlanningCycleParticipantResponse,
)
async def remove_planning_cycle_participant(
    cycle_id: str,
    participant_type: str,
    participant_id: str,
    db=Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Remove a participant assignment from a planning cycle."""
    _user_can_manage_organization(current_user)
    planning_cycles = _collection(db, "planning_cycles")
    participants = _collection(db, "planning_cycle_participants")
    organizations = _collection(db, "organizations")
    strategic_groups = _collection(db, "strategic_groups")

    if not planning_cycles.has(cycle_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Planning cycle not found")

    normalized_type = _normalize(participant_type)
    if normalized_type not in {"organization", "strategic_group"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="participant_type must be 'organization' or 'strategic_group'",
        )

    key = _planning_cycle_participant_key(cycle_id, normalized_type, participant_id)
    if not participants.has(key):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Planning cycle participant not found")

    existing = participants.get(key)
    if hasattr(participants, "delete"):
        participants.delete(key)
    else:
        del participants.documents[key]

    if normalized_type == "organization" and organizations.has(participant_id):
        source = organizations.get(participant_id)
    elif normalized_type == "strategic_group" and strategic_groups.has(participant_id):
        source = strategic_groups.get(participant_id)
    else:
        source = {"name": participant_id, "status": None}

    return _planning_cycle_participant_from_docs(
        existing,
        source.get("name", participant_id),
        source.get("status"),
    )


@router.get("/planning-cycles/{cycle_id}/strategic-themes", response_model=list[StrategicThemeResponse])
async def list_strategic_themes(
    cycle_id: str,
    status_filter: Optional[str] = None,
    search: Optional[str] = None,
    db=Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """List strategic themes for a planning cycle."""
    _user_can_manage_organization(current_user)
    planning_cycles = _collection(db, "planning_cycles")
    themes = _collection(db, "strategic_themes")

    if not planning_cycles.has(cycle_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Planning cycle not found")

    items = [
        item for item in (themes.all() if hasattr(themes, "all") else [])
        if item.get("planning_cycle_id") == cycle_id
    ]
    filtered = [
        item for item in items
        if _matches_status(item, status_filter) and _matches_search(item, ("name", "description"), search)
    ]
    return [_strategic_theme_from_doc(item) for item in filtered]


@router.post("/planning-cycles/{cycle_id}/strategic-themes", response_model=StrategicThemeResponse)
async def create_strategic_theme(
    cycle_id: str,
    payload: StrategicThemeCreate,
    db=Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Create a strategic theme for a planning cycle."""
    _user_can_manage_organization(current_user)
    planning_cycles = _collection(db, "planning_cycles")
    themes = _collection(db, "strategic_themes")

    if not planning_cycles.has(cycle_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Planning cycle not found")
    if payload.planning_cycle_id != cycle_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="planning_cycle_id must match route cycle_id")

    now = datetime.now(timezone.utc).isoformat()
    key = f"{cycle_id}__theme-{int(datetime.now(timezone.utc).timestamp() * 1000)}"
    doc = {
        "_key": key,
        "planning_cycle_id": cycle_id,
        "name": payload.name,
        "description": payload.description,
        "status": _validate_strategic_theme_status(payload.status),
        "created_at": now,
        "updated_at": now,
    }
    themes.insert(doc)
    return _strategic_theme_from_doc(doc)


@router.get("/planning-cycles/{cycle_id}/strategic-themes/{theme_id}", response_model=StrategicThemeResponse)
async def get_strategic_theme(
    cycle_id: str,
    theme_id: str,
    db=Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get strategic theme by id within a planning cycle."""
    _user_can_manage_organization(current_user)
    planning_cycles = _collection(db, "planning_cycles")
    themes = _collection(db, "strategic_themes")

    if not planning_cycles.has(cycle_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Planning cycle not found")
    if not themes.has(theme_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic theme not found")

    theme = themes.get(theme_id)
    if theme.get("planning_cycle_id") != cycle_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic theme not found")

    return _strategic_theme_from_doc(theme)


@router.put("/planning-cycles/{cycle_id}/strategic-themes/{theme_id}", response_model=StrategicThemeResponse)
async def update_strategic_theme(
    cycle_id: str,
    theme_id: str,
    payload: StrategicThemeUpdate,
    db=Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Update strategic theme."""
    _user_can_manage_organization(current_user)
    planning_cycles = _collection(db, "planning_cycles")
    themes = _collection(db, "strategic_themes")

    if not planning_cycles.has(cycle_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Planning cycle not found")
    if not themes.has(theme_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic theme not found")

    existing = themes.get(theme_id)
    if existing.get("planning_cycle_id") != cycle_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic theme not found")

    update_data = payload.model_dump(exclude_unset=True)
    if "planning_cycle_id" in update_data and update_data["planning_cycle_id"] != cycle_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="planning_cycle_id must match route cycle_id")
    if "status" in update_data:
        update_data["status"] = _validate_strategic_theme_status(update_data["status"])

    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    themes.update({"_key": theme_id, **existing, **update_data})
    return _strategic_theme_from_doc(themes.get(theme_id))


@router.patch("/planning-cycles/{cycle_id}/strategic-themes/{theme_id}/archive", response_model=StrategicThemeResponse)
async def archive_strategic_theme(
    cycle_id: str,
    theme_id: str,
    db=Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Archive strategic theme."""
    _user_can_manage_organization(current_user)
    planning_cycles = _collection(db, "planning_cycles")
    themes = _collection(db, "strategic_themes")

    if not planning_cycles.has(cycle_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Planning cycle not found")
    if not themes.has(theme_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic theme not found")

    theme = themes.get(theme_id)
    if theme.get("planning_cycle_id") != cycle_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic theme not found")

    theme["status"] = "Archived"
    theme["updated_at"] = datetime.now(timezone.utc).isoformat()
    themes.update({"_key": theme_id, **theme})
    return _strategic_theme_from_doc(themes.get(theme_id))


@router.get("/planning-cycles/{cycle_id}/drivers", response_model=list[DriverResponse])
async def list_drivers(
    cycle_id: str,
    status_filter: Optional[str] = None,
    search: Optional[str] = None,
    db=Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """List drivers for a planning cycle."""
    _user_can_manage_organization(current_user)
    planning_cycles = _collection(db, "planning_cycles")
    drivers = _collection(db, "drivers")
    organizations = _collection(db, "organizations")
    themes = _collection(db, "strategic_themes")

    if not planning_cycles.has(cycle_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Planning cycle not found")

    items = [
        item for item in (drivers.all() if hasattr(drivers, "all") else [])
        if item.get("planning_cycle_id") == cycle_id
    ]
    filtered = [
        item for item in items
        if _matches_status(item, status_filter) and _matches_search(item, ("title", "description", "category"), search)
    ]
    return [
        _driver_from_doc(
            item,
            _resolve_owner_name(organizations, item.get("owner_organization_id")),
            _resolve_theme_name(themes, item.get("strategic_theme_id")),
        )
        for item in filtered
    ]


@router.post("/planning-cycles/{cycle_id}/drivers", response_model=DriverResponse)
async def create_driver(
    cycle_id: str,
    payload: DriverCreate,
    db=Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Create a driver for a planning cycle."""
    _user_can_manage_organization(current_user)
    planning_cycles = _collection(db, "planning_cycles")
    organizations = _collection(db, "organizations")
    drivers = _collection(db, "drivers")
    themes = _collection(db, "strategic_themes")

    if not planning_cycles.has(cycle_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Planning cycle not found")
    if payload.planning_cycle_id != cycle_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="planning_cycle_id must match route cycle_id")
    if not organizations.has(payload.owner_organization_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Owner organization not found")
    if payload.strategic_theme_id:
        if not themes.has(payload.strategic_theme_id):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic theme not found")
        theme = themes.get(payload.strategic_theme_id)
        if theme.get("planning_cycle_id") != cycle_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Strategic theme must belong to the same planning cycle",
            )

    now = datetime.now(timezone.utc).isoformat()
    key = f"{cycle_id}__driver-{int(datetime.now(timezone.utc).timestamp() * 1000)}"
    doc = {
        "_key": key,
        "planning_cycle_id": cycle_id,
        "title": payload.title,
        "description": payload.description,
        "category": _validate_driver_category(payload.category),
        "impact_level": _validate_driver_impact_level(payload.impact_level),
        "time_horizon": _validate_driver_time_horizon(payload.time_horizon),
        "status": _validate_driver_status(payload.status),
        "strategic_theme_id": payload.strategic_theme_id,
        "owner_organization_id": payload.owner_organization_id,
        "created_at": now,
        "updated_at": now,
    }
    drivers.insert(doc)
    owner_name = organizations.get(payload.owner_organization_id).get("name")
    return _driver_from_doc(doc, owner_name, _resolve_theme_name(themes, payload.strategic_theme_id))


@router.get("/planning-cycles/{cycle_id}/drivers/{driver_id}", response_model=DriverResponse)
async def get_driver(
    cycle_id: str,
    driver_id: str,
    db=Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get a driver by id within a planning cycle."""
    _user_can_manage_organization(current_user)
    planning_cycles = _collection(db, "planning_cycles")
    drivers = _collection(db, "drivers")
    organizations = _collection(db, "organizations")
    themes = _collection(db, "strategic_themes")

    if not planning_cycles.has(cycle_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Planning cycle not found")
    if not drivers.has(driver_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Driver not found")

    driver = drivers.get(driver_id)
    if driver.get("planning_cycle_id") != cycle_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Driver not found")

    return _driver_from_doc(
        driver,
        _resolve_owner_name(organizations, driver.get("owner_organization_id")),
        _resolve_theme_name(themes, driver.get("strategic_theme_id")),
    )


@router.put("/planning-cycles/{cycle_id}/drivers/{driver_id}", response_model=DriverResponse)
async def update_driver(
    cycle_id: str,
    driver_id: str,
    payload: DriverUpdate,
    db=Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Update a driver."""
    _user_can_manage_organization(current_user)
    planning_cycles = _collection(db, "planning_cycles")
    drivers = _collection(db, "drivers")
    organizations = _collection(db, "organizations")
    themes = _collection(db, "strategic_themes")

    if not planning_cycles.has(cycle_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Planning cycle not found")
    if not drivers.has(driver_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Driver not found")

    existing = drivers.get(driver_id)
    if existing.get("planning_cycle_id") != cycle_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Driver not found")

    update_data = payload.model_dump(exclude_unset=True)
    if "planning_cycle_id" in update_data and update_data["planning_cycle_id"] != cycle_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="planning_cycle_id must match route cycle_id")
    if "owner_organization_id" in update_data and not organizations.has(update_data["owner_organization_id"]):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Owner organization not found")
    if "strategic_theme_id" in update_data:
        theme_id = update_data["strategic_theme_id"]
        if theme_id:
            if not themes.has(theme_id):
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic theme not found")
            theme = themes.get(theme_id)
            if theme.get("planning_cycle_id") != cycle_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Strategic theme must belong to the same planning cycle",
                )
    if "category" in update_data:
        update_data["category"] = _validate_driver_category(update_data["category"])
    if "impact_level" in update_data:
        update_data["impact_level"] = _validate_driver_impact_level(update_data["impact_level"])
    if "time_horizon" in update_data:
        update_data["time_horizon"] = _validate_driver_time_horizon(update_data["time_horizon"])
    if "status" in update_data:
        update_data["status"] = _validate_driver_status(update_data["status"])

    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    drivers.update({"_key": driver_id, **existing, **update_data})
    stored = drivers.get(driver_id)
    return _driver_from_doc(
        stored,
        _resolve_owner_name(organizations, stored.get("owner_organization_id")),
        _resolve_theme_name(themes, stored.get("strategic_theme_id")),
    )


@router.patch("/planning-cycles/{cycle_id}/drivers/{driver_id}/archive", response_model=DriverResponse)
async def archive_driver(
    cycle_id: str,
    driver_id: str,
    db=Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Archive a driver."""
    _user_can_manage_organization(current_user)
    planning_cycles = _collection(db, "planning_cycles")
    drivers = _collection(db, "drivers")
    organizations = _collection(db, "organizations")
    themes = _collection(db, "strategic_themes")

    if not planning_cycles.has(cycle_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Planning cycle not found")
    if not drivers.has(driver_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Driver not found")

    driver = drivers.get(driver_id)
    if driver.get("planning_cycle_id") != cycle_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Driver not found")

    driver["status"] = "Archived"
    driver["updated_at"] = datetime.now(timezone.utc).isoformat()
    drivers.update({"_key": driver_id, **driver})

    stored = drivers.get(driver_id)
    return _driver_from_doc(
        stored,
        _resolve_owner_name(organizations, stored.get("owner_organization_id")),
        _resolve_theme_name(themes, stored.get("strategic_theme_id")),
    )


@router.get("/planning-cycles/{cycle_id}/strategic-questions", response_model=list[StrategicQuestionResponse])
async def list_strategic_questions(
    cycle_id: str,
    status_filter: Optional[str] = None,
    search: Optional[str] = None,
    db=Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """List strategic questions for a planning cycle."""
    _user_can_manage_organization(current_user)
    planning_cycles = _collection(db, "planning_cycles")
    questions = _collection(db, "strategic_questions")
    question_drivers = _collection(db, "strategic_question_drivers")
    organizations = _collection(db, "organizations")
    themes = _collection(db, "strategic_themes")

    if not planning_cycles.has(cycle_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Planning cycle not found")

    items = [
        item for item in (questions.all() if hasattr(questions, "all") else [])
        if item.get("planning_cycle_id") == cycle_id
    ]
    filtered = [
        item for item in items
        if _matches_status(item, status_filter) and _matches_search(item, ("title", "description"), search)
    ]

    links = question_drivers.all() if hasattr(question_drivers, "all") else []
    link_counts: dict[str, int] = {}
    for link in links:
        question_id = link.get("strategic_question_id")
        if question_id:
            link_counts[question_id] = link_counts.get(question_id, 0) + 1

    return [
        _strategic_question_from_doc(
            item,
            _resolve_owner_name(organizations, item.get("lead_organization_id")),
            link_counts.get(item.get("_key") or item.get("id"), 0),
            _resolve_theme_name(themes, item.get("strategic_theme_id")),
        )
        for item in filtered
    ]


@router.post("/planning-cycles/{cycle_id}/strategic-questions", response_model=StrategicQuestionResponse)
async def create_strategic_question(
    cycle_id: str,
    payload: StrategicQuestionCreate,
    db=Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Create a strategic question for a planning cycle."""
    _user_can_manage_organization(current_user)
    planning_cycles = _collection(db, "planning_cycles")
    organizations = _collection(db, "organizations")
    questions = _collection(db, "strategic_questions")
    themes = _collection(db, "strategic_themes")

    if not planning_cycles.has(cycle_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Planning cycle not found")
    if payload.planning_cycle_id != cycle_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="planning_cycle_id must match route cycle_id")
    if not organizations.has(payload.lead_organization_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead organization not found")
    if payload.strategic_theme_id:
        if not themes.has(payload.strategic_theme_id):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic theme not found")
        theme = themes.get(payload.strategic_theme_id)
        if theme.get("planning_cycle_id") != cycle_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Strategic theme must belong to the same planning cycle",
            )

    now = datetime.now(timezone.utc).isoformat()
    key = f"{cycle_id}__question-{int(datetime.now(timezone.utc).timestamp() * 1000)}"
    doc = {
        "_key": key,
        "planning_cycle_id": cycle_id,
        "title": payload.title,
        "description": payload.description,
        "priority": _validate_strategic_question_priority(payload.priority),
        "status": _validate_strategic_question_status(payload.status),
        "strategic_theme_id": payload.strategic_theme_id,
        "lead_organization_id": payload.lead_organization_id,
        "created_at": now,
        "updated_at": now,
    }
    questions.insert(doc)
    lead_name = organizations.get(payload.lead_organization_id).get("name")
    return _strategic_question_from_doc(doc, lead_name, 0, _resolve_theme_name(themes, payload.strategic_theme_id))


@router.get("/planning-cycles/{cycle_id}/strategic-questions/{question_id}", response_model=StrategicQuestionResponse)
async def get_strategic_question(
    cycle_id: str,
    question_id: str,
    db=Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get strategic question by id within a planning cycle."""
    _user_can_manage_organization(current_user)
    planning_cycles = _collection(db, "planning_cycles")
    questions = _collection(db, "strategic_questions")
    question_drivers = _collection(db, "strategic_question_drivers")
    organizations = _collection(db, "organizations")
    themes = _collection(db, "strategic_themes")

    if not planning_cycles.has(cycle_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Planning cycle not found")
    if not questions.has(question_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic question not found")

    question = questions.get(question_id)
    if question.get("planning_cycle_id") != cycle_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic question not found")

    linked_count = len([
        item for item in (question_drivers.all() if hasattr(question_drivers, "all") else [])
        if item.get("strategic_question_id") == question_id
    ])
    return _strategic_question_from_doc(
        question,
        _resolve_owner_name(organizations, question.get("lead_organization_id")),
        linked_count,
        _resolve_theme_name(themes, question.get("strategic_theme_id")),
    )


@router.put("/planning-cycles/{cycle_id}/strategic-questions/{question_id}", response_model=StrategicQuestionResponse)
async def update_strategic_question(
    cycle_id: str,
    question_id: str,
    payload: StrategicQuestionUpdate,
    db=Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Update strategic question."""
    _user_can_manage_organization(current_user)
    planning_cycles = _collection(db, "planning_cycles")
    questions = _collection(db, "strategic_questions")
    question_drivers = _collection(db, "strategic_question_drivers")
    organizations = _collection(db, "organizations")
    themes = _collection(db, "strategic_themes")

    if not planning_cycles.has(cycle_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Planning cycle not found")
    if not questions.has(question_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic question not found")

    existing = questions.get(question_id)
    if existing.get("planning_cycle_id") != cycle_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic question not found")

    update_data = payload.model_dump(exclude_unset=True)
    if "planning_cycle_id" in update_data and update_data["planning_cycle_id"] != cycle_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="planning_cycle_id must match route cycle_id")
    if "lead_organization_id" in update_data and not organizations.has(update_data["lead_organization_id"]):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead organization not found")
    if "strategic_theme_id" in update_data:
        theme_id = update_data["strategic_theme_id"]
        if theme_id:
            if not themes.has(theme_id):
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic theme not found")
            theme = themes.get(theme_id)
            if theme.get("planning_cycle_id") != cycle_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Strategic theme must belong to the same planning cycle",
                )
    if "priority" in update_data:
        update_data["priority"] = _validate_strategic_question_priority(update_data["priority"])
    if "status" in update_data:
        update_data["status"] = _validate_strategic_question_status(update_data["status"])

    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    questions.update({"_key": question_id, **existing, **update_data})
    stored = questions.get(question_id)
    linked_count = len([
        item for item in (question_drivers.all() if hasattr(question_drivers, "all") else [])
        if item.get("strategic_question_id") == question_id
    ])
    return _strategic_question_from_doc(
        stored,
        _resolve_owner_name(organizations, stored.get("lead_organization_id")),
        linked_count,
        _resolve_theme_name(themes, stored.get("strategic_theme_id")),
    )


@router.patch("/planning-cycles/{cycle_id}/strategic-questions/{question_id}/archive", response_model=StrategicQuestionResponse)
async def archive_strategic_question(
    cycle_id: str,
    question_id: str,
    db=Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Archive strategic question."""
    _user_can_manage_organization(current_user)
    planning_cycles = _collection(db, "planning_cycles")
    questions = _collection(db, "strategic_questions")
    question_drivers = _collection(db, "strategic_question_drivers")
    organizations = _collection(db, "organizations")
    themes = _collection(db, "strategic_themes")

    if not planning_cycles.has(cycle_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Planning cycle not found")
    if not questions.has(question_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic question not found")

    question = questions.get(question_id)
    if question.get("planning_cycle_id") != cycle_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic question not found")

    question["status"] = "Archived"
    question["updated_at"] = datetime.now(timezone.utc).isoformat()
    questions.update({"_key": question_id, **question})
    stored = questions.get(question_id)
    linked_count = len([
        item for item in (question_drivers.all() if hasattr(question_drivers, "all") else [])
        if item.get("strategic_question_id") == question_id
    ])
    return _strategic_question_from_doc(
        stored,
        _resolve_owner_name(organizations, stored.get("lead_organization_id")),
        linked_count,
        _resolve_theme_name(themes, stored.get("strategic_theme_id")),
    )


@router.get(
    "/planning-cycles/{cycle_id}/strategic-questions/{question_id}/drivers",
    response_model=list[StrategicQuestionDriverLinkResponse],
)
async def list_strategic_question_drivers(
    cycle_id: str,
    question_id: str,
    db=Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """List drivers linked to a strategic question."""
    _user_can_manage_organization(current_user)
    planning_cycles = _collection(db, "planning_cycles")
    questions = _collection(db, "strategic_questions")
    links = _collection(db, "strategic_question_drivers")
    drivers = _collection(db, "drivers")

    if not planning_cycles.has(cycle_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Planning cycle not found")
    if not questions.has(question_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic question not found")

    question = questions.get(question_id)
    if question.get("planning_cycle_id") != cycle_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic question not found")

    question_links = [
        item for item in (links.all() if hasattr(links, "all") else [])
        if item.get("strategic_question_id") == question_id
    ]
    results: list[StrategicQuestionDriverLinkResponse] = []
    for link in question_links:
        driver_id = link.get("driver_id")
        if driver_id and drivers.has(driver_id):
            driver_doc = drivers.get(driver_id)
            if driver_doc.get("planning_cycle_id") == cycle_id:
                results.append(_strategic_question_driver_link_from_docs(link, driver_doc))
    return results


@router.post(
    "/planning-cycles/{cycle_id}/strategic-questions/{question_id}/drivers",
    response_model=StrategicQuestionDriverLinkResponse,
)
async def attach_driver_to_strategic_question(
    cycle_id: str,
    question_id: str,
    payload: StrategicQuestionDriverLinkCreate,
    db=Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Attach a driver to a strategic question."""
    _user_can_manage_organization(current_user)
    planning_cycles = _collection(db, "planning_cycles")
    questions = _collection(db, "strategic_questions")
    links = _collection(db, "strategic_question_drivers")
    drivers = _collection(db, "drivers")

    if not planning_cycles.has(cycle_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Planning cycle not found")
    if not questions.has(question_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic question not found")
    if not drivers.has(payload.driver_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Driver not found")

    question_doc = questions.get(question_id)
    if question_doc.get("planning_cycle_id") != cycle_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic question not found")

    driver_doc = drivers.get(payload.driver_id)
    if driver_doc.get("planning_cycle_id") != cycle_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Driver must belong to the same planning cycle as the strategic question",
        )

    key = _strategic_question_driver_key(question_id, payload.driver_id)
    if links.has(key):
        return _strategic_question_driver_link_from_docs(links.get(key), driver_doc)

    doc = {
        "_key": key,
        "strategic_question_id": question_id,
        "driver_id": payload.driver_id,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    links.insert(doc)
    return _strategic_question_driver_link_from_docs(doc, driver_doc)


@router.delete(
    "/planning-cycles/{cycle_id}/strategic-questions/{question_id}/drivers/{driver_id}",
    response_model=StrategicQuestionDriverLinkResponse,
)
async def detach_driver_from_strategic_question(
    cycle_id: str,
    question_id: str,
    driver_id: str,
    db=Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Detach a driver from a strategic question."""
    _user_can_manage_organization(current_user)
    planning_cycles = _collection(db, "planning_cycles")
    questions = _collection(db, "strategic_questions")
    links = _collection(db, "strategic_question_drivers")
    drivers = _collection(db, "drivers")

    if not planning_cycles.has(cycle_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Planning cycle not found")
    if not questions.has(question_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic question not found")

    question_doc = questions.get(question_id)
    if question_doc.get("planning_cycle_id") != cycle_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic question not found")

    key = _strategic_question_driver_key(question_id, driver_id)
    if not links.has(key):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic question driver link not found")

    existing = links.get(key)
    if hasattr(links, "delete"):
        links.delete(key)
    else:
        del links.documents[key]

    if drivers.has(driver_id):
        driver_doc = drivers.get(driver_id)
    else:
        driver_doc = {"title": driver_id, "status": None}

    return _strategic_question_driver_link_from_docs(existing, driver_doc)


@router.get("/planning-cycles/{cycle_id}/strategic-objectives", response_model=list[StrategicObjectiveResponse])
async def list_strategic_objectives(
    cycle_id: str,
    status_filter: Optional[str] = None,
    search: Optional[str] = None,
    db=Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """List strategic objectives for a planning cycle."""
    _user_can_manage_organization(current_user)
    planning_cycles = _collection(db, "planning_cycles")
    objectives = _collection(db, "strategic_objectives")
    organizations = _collection(db, "organizations")
    questions = _collection(db, "strategic_questions")
    themes = _collection(db, "strategic_themes")

    if not planning_cycles.has(cycle_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Planning cycle not found")

    items = [
        item for item in (objectives.all() if hasattr(objectives, "all") else [])
        if item.get("planning_cycle_id") == cycle_id
    ]
    filtered = [
        item for item in items
        if _matches_status(item, status_filter) and _matches_search(item, ("title", "description"), search)
    ]

    response: list[StrategicObjectiveResponse] = []
    for item in filtered:
        question_id = item.get("strategic_question_id")
        question_title = None
        if question_id and questions.has(question_id):
            question_title = questions.get(question_id).get("title")
        response.append(
            _strategic_objective_from_doc(
                item,
                question_title=question_title,
                owner_organization_name=_resolve_owner_name(organizations, item.get("owner_organization_id")),
                strategic_theme_name=_resolve_theme_name(themes, item.get("strategic_theme_id")),
            )
        )
    return response


@router.get(
    "/planning-cycles/{cycle_id}/strategic-questions/{question_id}/objectives",
    response_model=list[StrategicObjectiveResponse],
)
async def list_objectives_for_strategic_question(
    cycle_id: str,
    question_id: str,
    db=Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """List strategic objectives for a strategic question."""
    _user_can_manage_organization(current_user)
    planning_cycles = _collection(db, "planning_cycles")
    objectives = _collection(db, "strategic_objectives")
    organizations = _collection(db, "organizations")
    questions = _collection(db, "strategic_questions")
    themes = _collection(db, "strategic_themes")

    if not planning_cycles.has(cycle_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Planning cycle not found")
    if not questions.has(question_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic question not found")

    question = questions.get(question_id)
    if question.get("planning_cycle_id") != cycle_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic question not found")

    items = [
        item for item in (objectives.all() if hasattr(objectives, "all") else [])
        if item.get("planning_cycle_id") == cycle_id and item.get("strategic_question_id") == question_id
    ]
    return [
        _strategic_objective_from_doc(
            item,
            question_title=question.get("title"),
            owner_organization_name=_resolve_owner_name(organizations, item.get("owner_organization_id")),
            strategic_theme_name=_resolve_theme_name(themes, item.get("strategic_theme_id")),
        )
        for item in items
    ]


@router.post("/planning-cycles/{cycle_id}/strategic-objectives", response_model=StrategicObjectiveResponse)
async def create_strategic_objective(
    cycle_id: str,
    payload: StrategicObjectiveCreate,
    db=Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Create strategic objective for a planning cycle."""
    _user_can_manage_organization(current_user)
    planning_cycles = _collection(db, "planning_cycles")
    objectives = _collection(db, "strategic_objectives")
    organizations = _collection(db, "organizations")
    questions = _collection(db, "strategic_questions")
    themes = _collection(db, "strategic_themes")

    if not planning_cycles.has(cycle_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Planning cycle not found")
    if payload.planning_cycle_id != cycle_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="planning_cycle_id must match route cycle_id")
    if not questions.has(payload.strategic_question_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic question not found")
    question = questions.get(payload.strategic_question_id)
    if question.get("planning_cycle_id") != cycle_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Strategic question must belong to the same planning cycle",
        )
    if not organizations.has(payload.owner_organization_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Owner organization not found")
    if payload.strategic_theme_id:
        if not themes.has(payload.strategic_theme_id):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic theme not found")
        theme = themes.get(payload.strategic_theme_id)
        if theme.get("planning_cycle_id") != cycle_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Strategic theme must belong to the same planning cycle",
            )

    now = datetime.now(timezone.utc).isoformat()
    key = f"{cycle_id}__objective-{int(datetime.now(timezone.utc).timestamp() * 1000)}"
    doc = {
        "_key": key,
        "planning_cycle_id": cycle_id,
        "strategic_question_id": payload.strategic_question_id,
        "title": payload.title,
        "description": payload.description,
        "objective_type": _validate_strategic_objective_type(payload.objective_type),
        "priority": _validate_strategic_question_priority(payload.priority),
        "status": _validate_strategic_objective_status(payload.status),
        "strategic_theme_id": payload.strategic_theme_id,
        "owner_organization_id": payload.owner_organization_id,
        "target_date": _iso_or_none(payload.target_date),
        "created_at": now,
        "updated_at": now,
    }
    objectives.insert(doc)
    return _strategic_objective_from_doc(
        doc,
        question_title=question.get("title"),
        owner_organization_name=organizations.get(payload.owner_organization_id).get("name"),
        strategic_theme_name=_resolve_theme_name(themes, payload.strategic_theme_id),
    )


@router.get("/planning-cycles/{cycle_id}/strategic-objectives/{objective_id}", response_model=StrategicObjectiveResponse)
async def get_strategic_objective(
    cycle_id: str,
    objective_id: str,
    db=Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get strategic objective by id within planning cycle."""
    _user_can_manage_organization(current_user)
    planning_cycles = _collection(db, "planning_cycles")
    objectives = _collection(db, "strategic_objectives")
    organizations = _collection(db, "organizations")
    questions = _collection(db, "strategic_questions")
    themes = _collection(db, "strategic_themes")

    if not planning_cycles.has(cycle_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Planning cycle not found")
    if not objectives.has(objective_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic objective not found")

    objective = objectives.get(objective_id)
    if objective.get("planning_cycle_id") != cycle_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic objective not found")

    question_title = None
    question_id = objective.get("strategic_question_id")
    if question_id and questions.has(question_id):
        question_title = questions.get(question_id).get("title")
    return _strategic_objective_from_doc(
        objective,
        question_title=question_title,
        owner_organization_name=_resolve_owner_name(organizations, objective.get("owner_organization_id")),
        strategic_theme_name=_resolve_theme_name(themes, objective.get("strategic_theme_id")),
    )


@router.put("/planning-cycles/{cycle_id}/strategic-objectives/{objective_id}", response_model=StrategicObjectiveResponse)
async def update_strategic_objective(
    cycle_id: str,
    objective_id: str,
    payload: StrategicObjectiveUpdate,
    db=Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Update strategic objective."""
    _user_can_manage_organization(current_user)
    planning_cycles = _collection(db, "planning_cycles")
    objectives = _collection(db, "strategic_objectives")
    organizations = _collection(db, "organizations")
    questions = _collection(db, "strategic_questions")
    themes = _collection(db, "strategic_themes")

    if not planning_cycles.has(cycle_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Planning cycle not found")
    if not objectives.has(objective_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic objective not found")

    existing = objectives.get(objective_id)
    if existing.get("planning_cycle_id") != cycle_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic objective not found")

    update_data = payload.model_dump(exclude_unset=True)
    if "planning_cycle_id" in update_data and update_data["planning_cycle_id"] != cycle_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="planning_cycle_id must match route cycle_id")
    if "strategic_question_id" in update_data:
        question_id = update_data["strategic_question_id"]
        if not questions.has(question_id):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic question not found")
        question = questions.get(question_id)
        if question.get("planning_cycle_id") != cycle_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Strategic question must belong to the same planning cycle",
            )
    if "owner_organization_id" in update_data and not organizations.has(update_data["owner_organization_id"]):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Owner organization not found")
    if "strategic_theme_id" in update_data:
        theme_id = update_data["strategic_theme_id"]
        if theme_id:
            if not themes.has(theme_id):
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic theme not found")
            theme = themes.get(theme_id)
            if theme.get("planning_cycle_id") != cycle_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Strategic theme must belong to the same planning cycle",
                )
    if "objective_type" in update_data:
        update_data["objective_type"] = _validate_strategic_objective_type(update_data["objective_type"])
    if "priority" in update_data:
        update_data["priority"] = _validate_strategic_question_priority(update_data["priority"])
    if "status" in update_data:
        update_data["status"] = _validate_strategic_objective_status(update_data["status"])
    if "target_date" in update_data:
        update_data["target_date"] = _iso_or_none(update_data["target_date"])

    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    objectives.update({"_key": objective_id, **existing, **update_data})
    stored = objectives.get(objective_id)

    question_title = None
    question_id = stored.get("strategic_question_id")
    if question_id and questions.has(question_id):
        question_title = questions.get(question_id).get("title")
    return _strategic_objective_from_doc(
        stored,
        question_title=question_title,
        owner_organization_name=_resolve_owner_name(organizations, stored.get("owner_organization_id")),
        strategic_theme_name=_resolve_theme_name(themes, stored.get("strategic_theme_id")),
    )


@router.patch("/planning-cycles/{cycle_id}/strategic-objectives/{objective_id}/archive", response_model=StrategicObjectiveResponse)
async def archive_strategic_objective(
    cycle_id: str,
    objective_id: str,
    db=Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Archive strategic objective."""
    _user_can_manage_organization(current_user)
    planning_cycles = _collection(db, "planning_cycles")
    objectives = _collection(db, "strategic_objectives")
    organizations = _collection(db, "organizations")
    questions = _collection(db, "strategic_questions")
    themes = _collection(db, "strategic_themes")

    if not planning_cycles.has(cycle_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Planning cycle not found")
    if not objectives.has(objective_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic objective not found")

    objective = objectives.get(objective_id)
    if objective.get("planning_cycle_id") != cycle_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic objective not found")

    objective["status"] = "Archived"
    objective["updated_at"] = datetime.now(timezone.utc).isoformat()
    objectives.update({"_key": objective_id, **objective})
    stored = objectives.get(objective_id)

    question_title = None
    question_id = stored.get("strategic_question_id")
    if question_id and questions.has(question_id):
        question_title = questions.get(question_id).get("title")
    return _strategic_objective_from_doc(
        stored,
        question_title=question_title,
        owner_organization_name=_resolve_owner_name(organizations, stored.get("owner_organization_id")),
        strategic_theme_name=_resolve_theme_name(themes, stored.get("strategic_theme_id")),
    )


@router.get(
    "/planning-cycles/{cycle_id}/strategic-objectives/{objective_id}/choices",
    response_model=list[StrategicChoiceResponse],
)
async def list_strategic_choices_for_objective(
    cycle_id: str,
    objective_id: str,
    db=Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """List strategic choices for an objective."""
    _user_can_manage_organization(current_user)
    planning_cycles = _collection(db, "planning_cycles")
    objectives = _collection(db, "strategic_objectives")
    choices = _collection(db, "strategic_choices")
    organizations = _collection(db, "organizations")
    themes = _collection(db, "strategic_themes")

    if not planning_cycles.has(cycle_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Planning cycle not found")
    if not objectives.has(objective_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic objective not found")

    objective = objectives.get(objective_id)
    if objective.get("planning_cycle_id") != cycle_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic objective not found")

    items = [
        item for item in (choices.all() if hasattr(choices, "all") else [])
        if item.get("planning_cycle_id") == cycle_id and item.get("strategic_objective_id") == objective_id
    ]
    return [
        _strategic_choice_from_doc(
            item,
            objective_title=objective.get("title"),
            owner_organization_name=_resolve_owner_name(organizations, item.get("owner_organization_id")),
            strategic_theme_name=_resolve_theme_name(themes, item.get("strategic_theme_id")),
        )
        for item in items
    ]


@router.post(
    "/planning-cycles/{cycle_id}/strategic-objectives/{objective_id}/choices",
    response_model=StrategicChoiceResponse,
)
async def create_strategic_choice(
    cycle_id: str,
    objective_id: str,
    payload: StrategicChoiceCreate,
    db=Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Create strategic choice for an objective."""
    _user_can_manage_organization(current_user)
    planning_cycles = _collection(db, "planning_cycles")
    objectives = _collection(db, "strategic_objectives")
    choices = _collection(db, "strategic_choices")
    organizations = _collection(db, "organizations")
    themes = _collection(db, "strategic_themes")

    if not planning_cycles.has(cycle_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Planning cycle not found")
    if not objectives.has(objective_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic objective not found")
    if payload.planning_cycle_id != cycle_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="planning_cycle_id must match route cycle_id")
    if payload.strategic_objective_id != objective_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="strategic_objective_id must match route objective_id",
        )

    objective = objectives.get(objective_id)
    if objective.get("planning_cycle_id") != cycle_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Strategic objective not found",
        )
    if not organizations.has(payload.owner_organization_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Owner organization not found")
    if payload.strategic_theme_id:
        if not themes.has(payload.strategic_theme_id):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic theme not found")
        theme = themes.get(payload.strategic_theme_id)
        if theme.get("planning_cycle_id") != cycle_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Strategic theme must belong to the same planning cycle",
            )

    now = datetime.now(timezone.utc).isoformat()
    key = f"{cycle_id}__choice-{int(datetime.now(timezone.utc).timestamp() * 1000)}"
    doc = {
        "_key": key,
        "planning_cycle_id": cycle_id,
        "strategic_objective_id": objective_id,
        "title": payload.title,
        "description": payload.description,
        "choice_type": _validate_strategic_choice_type(payload.choice_type),
        "status": _validate_strategic_choice_status(payload.status),
        "recommendation": _validate_strategic_choice_recommendation(payload.recommendation),
        "strategic_theme_id": payload.strategic_theme_id,
        "owner_organization_id": payload.owner_organization_id,
        "created_at": now,
        "updated_at": now,
    }
    choices.insert(doc)
    return _strategic_choice_from_doc(
        doc,
        objective_title=objective.get("title"),
        owner_organization_name=organizations.get(payload.owner_organization_id).get("name"),
        strategic_theme_name=_resolve_theme_name(themes, payload.strategic_theme_id),
    )


@router.put(
    "/planning-cycles/{cycle_id}/strategic-objectives/{objective_id}/choices/{choice_id}",
    response_model=StrategicChoiceResponse,
)
async def update_strategic_choice(
    cycle_id: str,
    objective_id: str,
    choice_id: str,
    payload: StrategicChoiceUpdate,
    db=Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Update strategic choice."""
    _user_can_manage_organization(current_user)
    planning_cycles = _collection(db, "planning_cycles")
    objectives = _collection(db, "strategic_objectives")
    choices = _collection(db, "strategic_choices")
    organizations = _collection(db, "organizations")
    themes = _collection(db, "strategic_themes")

    if not planning_cycles.has(cycle_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Planning cycle not found")
    if not objectives.has(objective_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic objective not found")
    if not choices.has(choice_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic choice not found")

    objective = objectives.get(objective_id)
    if objective.get("planning_cycle_id") != cycle_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic objective not found")

    existing = choices.get(choice_id)
    if existing.get("planning_cycle_id") != cycle_id or existing.get("strategic_objective_id") != objective_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic choice not found")

    update_data = payload.model_dump(exclude_unset=True)
    if "planning_cycle_id" in update_data and update_data["planning_cycle_id"] != cycle_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="planning_cycle_id must match route cycle_id")
    if "strategic_objective_id" in update_data and update_data["strategic_objective_id"] != objective_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="strategic_objective_id must match route objective_id",
        )
    if "owner_organization_id" in update_data and not organizations.has(update_data["owner_organization_id"]):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Owner organization not found")
    if "strategic_theme_id" in update_data:
        theme_id = update_data["strategic_theme_id"]
        if theme_id:
            if not themes.has(theme_id):
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic theme not found")
            theme = themes.get(theme_id)
            if theme.get("planning_cycle_id") != cycle_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Strategic theme must belong to the same planning cycle",
                )
    if "choice_type" in update_data:
        update_data["choice_type"] = _validate_strategic_choice_type(update_data["choice_type"])
    if "status" in update_data:
        update_data["status"] = _validate_strategic_choice_status(update_data["status"])
    if "recommendation" in update_data:
        update_data["recommendation"] = _validate_strategic_choice_recommendation(update_data["recommendation"])

    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    choices.update({"_key": choice_id, **existing, **update_data})
    stored = choices.get(choice_id)
    return _strategic_choice_from_doc(
        stored,
        objective_title=objective.get("title"),
        owner_organization_name=_resolve_owner_name(organizations, stored.get("owner_organization_id")),
        strategic_theme_name=_resolve_theme_name(themes, stored.get("strategic_theme_id")),
    )


@router.patch(
    "/planning-cycles/{cycle_id}/strategic-objectives/{objective_id}/choices/{choice_id}/archive",
    response_model=StrategicChoiceResponse,
)
async def archive_strategic_choice(
    cycle_id: str,
    objective_id: str,
    choice_id: str,
    db=Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Archive strategic choice."""
    _user_can_manage_organization(current_user)
    planning_cycles = _collection(db, "planning_cycles")
    objectives = _collection(db, "strategic_objectives")
    choices = _collection(db, "strategic_choices")
    organizations = _collection(db, "organizations")
    themes = _collection(db, "strategic_themes")

    if not planning_cycles.has(cycle_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Planning cycle not found")
    if not objectives.has(objective_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic objective not found")
    if not choices.has(choice_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic choice not found")

    objective = objectives.get(objective_id)
    if objective.get("planning_cycle_id") != cycle_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic objective not found")

    choice = choices.get(choice_id)
    if choice.get("planning_cycle_id") != cycle_id or choice.get("strategic_objective_id") != objective_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic choice not found")

    choice["status"] = "Archived"
    choice["updated_at"] = datetime.now(timezone.utc).isoformat()
    choices.update({"_key": choice_id, **choice})
    stored = choices.get(choice_id)
    return _strategic_choice_from_doc(
        stored,
        objective_title=objective.get("title"),
        owner_organization_name=_resolve_owner_name(organizations, stored.get("owner_organization_id")),
        strategic_theme_name=_resolve_theme_name(themes, stored.get("strategic_theme_id")),
    )


@router.get(
    "/planning-cycles/{cycle_id}/strategic-objectives/{objective_id}/choices/{choice_id}/agreements",
    response_model=list[StrategicAgreementResponse],
)
async def list_strategic_agreements_for_choice(
    cycle_id: str,
    objective_id: str,
    choice_id: str,
    db=Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """List strategic agreements for a strategic choice."""
    _user_can_manage_organization(current_user)
    planning_cycles = _collection(db, "planning_cycles")
    objectives = _collection(db, "strategic_objectives")
    choices = _collection(db, "strategic_choices")
    agreements = _collection(db, "strategic_agreements")
    organizations = _collection(db, "organizations")

    if not planning_cycles.has(cycle_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Planning cycle not found")
    if not objectives.has(objective_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic objective not found")
    if not choices.has(choice_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic choice not found")

    objective = objectives.get(objective_id)
    if objective.get("planning_cycle_id") != cycle_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic objective not found")

    choice = choices.get(choice_id)
    if choice.get("planning_cycle_id") != cycle_id or choice.get("strategic_objective_id") != objective_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic choice not found")

    items = [
        item for item in (agreements.all() if hasattr(agreements, "all") else [])
        if item.get("planning_cycle_id") == cycle_id and item.get("strategic_choice_id") == choice_id
    ]
    return [
        _strategic_agreement_from_doc(
            item,
            choice_title=choice.get("title"),
            owner_organization_name=_resolve_owner_name(organizations, item.get("owner_organization_id")),
        )
        for item in items
    ]


@router.post(
    "/planning-cycles/{cycle_id}/strategic-objectives/{objective_id}/choices/{choice_id}/agreements",
    response_model=StrategicAgreementResponse,
)
async def create_strategic_agreement(
    cycle_id: str,
    objective_id: str,
    choice_id: str,
    payload: StrategicAgreementCreate,
    db=Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Create strategic agreement under a strategic choice."""
    _user_can_manage_organization(current_user)
    planning_cycles = _collection(db, "planning_cycles")
    objectives = _collection(db, "strategic_objectives")
    choices = _collection(db, "strategic_choices")
    agreements = _collection(db, "strategic_agreements")
    organizations = _collection(db, "organizations")

    if not planning_cycles.has(cycle_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Planning cycle not found")
    if not objectives.has(objective_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic objective not found")
    if not choices.has(choice_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic choice not found")
    if payload.planning_cycle_id != cycle_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="planning_cycle_id must match route cycle_id")
    if payload.strategic_choice_id != choice_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="strategic_choice_id must match route choice_id")

    objective = objectives.get(objective_id)
    if objective.get("planning_cycle_id") != cycle_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic objective not found")

    choice = choices.get(choice_id)
    if choice.get("planning_cycle_id") != cycle_id or choice.get("strategic_objective_id") != objective_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic choice not found")

    if not organizations.has(payload.owner_organization_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Owner organization not found")

    now = datetime.now(timezone.utc).isoformat()
    key = f"{cycle_id}__agreement-{int(datetime.now(timezone.utc).timestamp() * 1000)}"
    doc = {
        "_key": key,
        "planning_cycle_id": cycle_id,
        "strategic_choice_id": choice_id,
        "title": payload.title,
        "description": payload.description,
        "status": _validate_strategic_agreement_status(payload.status),
        "effective_date": _iso_or_none(payload.effective_date),
        "owner_organization_id": payload.owner_organization_id,
        "created_at": now,
        "updated_at": now,
    }
    agreements.insert(doc)
    return _strategic_agreement_from_doc(
        doc,
        choice_title=choice.get("title"),
        owner_organization_name=organizations.get(payload.owner_organization_id).get("name"),
    )


@router.put(
    "/planning-cycles/{cycle_id}/strategic-objectives/{objective_id}/choices/{choice_id}/agreements/{agreement_id}",
    response_model=StrategicAgreementResponse,
)
async def update_strategic_agreement(
    cycle_id: str,
    objective_id: str,
    choice_id: str,
    agreement_id: str,
    payload: StrategicAgreementUpdate,
    db=Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Update strategic agreement."""
    _user_can_manage_organization(current_user)
    planning_cycles = _collection(db, "planning_cycles")
    objectives = _collection(db, "strategic_objectives")
    choices = _collection(db, "strategic_choices")
    agreements = _collection(db, "strategic_agreements")
    organizations = _collection(db, "organizations")

    if not planning_cycles.has(cycle_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Planning cycle not found")
    if not objectives.has(objective_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic objective not found")
    if not choices.has(choice_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic choice not found")
    if not agreements.has(agreement_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic agreement not found")

    objective = objectives.get(objective_id)
    if objective.get("planning_cycle_id") != cycle_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic objective not found")

    choice = choices.get(choice_id)
    if choice.get("planning_cycle_id") != cycle_id or choice.get("strategic_objective_id") != objective_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic choice not found")

    existing = agreements.get(agreement_id)
    if existing.get("planning_cycle_id") != cycle_id or existing.get("strategic_choice_id") != choice_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic agreement not found")

    update_data = payload.model_dump(exclude_unset=True)
    if "planning_cycle_id" in update_data and update_data["planning_cycle_id"] != cycle_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="planning_cycle_id must match route cycle_id")
    if "strategic_choice_id" in update_data and update_data["strategic_choice_id"] != choice_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="strategic_choice_id must match route choice_id")
    if "owner_organization_id" in update_data and not organizations.has(update_data["owner_organization_id"]):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Owner organization not found")
    if "status" in update_data:
        update_data["status"] = _validate_strategic_agreement_status(update_data["status"])
    if "effective_date" in update_data:
        update_data["effective_date"] = _iso_or_none(update_data["effective_date"])

    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    agreements.update({"_key": agreement_id, **existing, **update_data})
    stored = agreements.get(agreement_id)
    return _strategic_agreement_from_doc(
        stored,
        choice_title=choice.get("title"),
        owner_organization_name=_resolve_owner_name(organizations, stored.get("owner_organization_id")),
    )


@router.get("/capabilities", response_model=list[CapabilityResponse])
async def list_capabilities(
    status: Optional[str] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
    db=Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """List capabilities independent of planning cycles."""
    _user_can_manage_organization(current_user)
    capabilities = _collection(db, "capabilities")
    organizations = _collection(db, "organizations")
    query = _normalize(search) if search else None

    items = capabilities.all() if hasattr(capabilities, "all") else []
    filtered: list[dict[str, Any]] = []
    for item in items:
        if status and item.get("status") != status:
            continue
        if category and item.get("category") != category:
            continue
        if query:
            haystack = _normalize(f"{item.get('name', '')} {item.get('description', '')}")
            if query not in haystack:
                continue
        filtered.append(item)

    return [
        _capability_from_doc(
            item,
            owner_organization_name=_resolve_owner_name(organizations, item.get("owner_organization_id")),
        )
        for item in filtered
    ]


@router.get("/capabilities/roadmap", response_model=list[CapabilityRoadmapItemResponse])
async def get_capability_roadmap(
    status: Optional[str] = None,
    category: Optional[str] = None,
    db=Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Return the capability roadmap: one timeline entry per capability.

    Each entry pairs the capability's planned start/end window with its
    latest maturity assessment gap (target maturity minus current maturity).
    When no assessment exists yet, the capability defaults to a maturity
    gap of one (current 1, target 2) so it still surfaces on the roadmap.
    """
    _user_can_manage_organization(current_user)
    capabilities = _collection(db, "capabilities")
    organizations = _collection(db, "organizations")
    assessments = _collection(db, "capability_assessments")

    capability_items = capabilities.all() if hasattr(capabilities, "all") else []
    filtered_capabilities = [
        item
        for item in capability_items
        if (not status or item.get("status") == status)
        and (not category or item.get("category") == category)
    ]

    assessments_by_capability: dict[str, list[dict[str, Any]]] = {}
    for assessment in (assessments.all() if hasattr(assessments, "all") else []):
        capability_id = assessment.get("capability_id")
        if not capability_id:
            continue
        assessments_by_capability.setdefault(capability_id, []).append(assessment)

    roadmap: list[CapabilityRoadmapItemResponse] = []
    for item in filtered_capabilities:
        capability_id = item.get("_key") or item.get("id")
        capability_assessments = sorted(
            assessments_by_capability.get(capability_id, []),
            key=lambda entry: entry.get("assessment_date") or "",
            reverse=True,
        )
        latest = capability_assessments[0] if capability_assessments else None

        if latest is not None:
            current = int(latest.get("current_maturity", 1))
            target = int(latest.get("target_maturity", 2))
            gap = max(target - current, 0)
        else:
            # Default to a maturity gap of one for capabilities not yet assessed.
            current = 1
            target = 2
            gap = 1

        roadmap.append(
            CapabilityRoadmapItemResponse(
                capability_id=capability_id,
                capability_name=item.get("name"),
                category=item.get("category", "Other"),
                status=item.get("status", "Draft"),
                owner_organization_id=item.get("owner_organization_id"),
                owner_organization_name=_resolve_owner_name(organizations, item.get("owner_organization_id")),
                start_date=item.get("start_date"),
                end_date=item.get("end_date"),
                current_maturity=current,
                target_maturity=target,
                assessment_gap=gap,
                latest_assessment_id=(latest.get("_key") or latest.get("id")) if latest else None,
                latest_planning_cycle_id=latest.get("planning_cycle_id") if latest else None,
            )
        )

    return sorted(roadmap, key=lambda entry: _iso_or_none(entry.start_date) or "")


@router.post("/capabilities", response_model=CapabilityResponse)
async def create_capability(
    payload: CapabilityCreate,
    db=Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Create a capability."""
    _user_can_manage_organization(current_user)
    capabilities = _collection(db, "capabilities")
    organizations = _collection(db, "organizations")

    if not organizations.has(payload.owner_organization_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Owner organization not found")

    _validate_capability_dates(payload.start_date, payload.end_date)
    now = datetime.now(timezone.utc).isoformat()
    key = f"capability-{int(datetime.now(timezone.utc).timestamp() * 1000)}"
    doc = {
        "_key": key,
        "name": payload.name,
        "description": payload.description,
        "category": _validate_capability_category(payload.category),
        "status": _validate_capability_status(payload.status),
        "owner_organization_id": payload.owner_organization_id,
        "start_date": _iso_or_none(payload.start_date),
        "end_date": _iso_or_none(payload.end_date),
        "created_at": now,
        "updated_at": now,
    }
    capabilities.insert(doc)
    return _capability_from_doc(
        doc,
        owner_organization_name=organizations.get(payload.owner_organization_id).get("name"),
    )


@router.get("/capabilities/{capability_id}", response_model=CapabilityResponse)
async def get_capability(
    capability_id: str,
    db=Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get a capability by id."""
    _user_can_manage_organization(current_user)
    capabilities = _collection(db, "capabilities")
    organizations = _collection(db, "organizations")

    if not capabilities.has(capability_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Capability not found")
    doc = capabilities.get(capability_id)
    return _capability_from_doc(
        doc,
        owner_organization_name=_resolve_owner_name(organizations, doc.get("owner_organization_id")),
    )


@router.put("/capabilities/{capability_id}", response_model=CapabilityResponse)
async def update_capability(
    capability_id: str,
    payload: CapabilityUpdate,
    db=Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Update a capability."""
    _user_can_manage_organization(current_user)
    capabilities = _collection(db, "capabilities")
    organizations = _collection(db, "organizations")

    if not capabilities.has(capability_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Capability not found")

    existing = capabilities.get(capability_id)
    update_data = payload.model_dump(exclude_unset=True)

    if "owner_organization_id" in update_data and not organizations.has(update_data["owner_organization_id"]):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Owner organization not found")
    if "category" in update_data:
        update_data["category"] = _validate_capability_category(update_data["category"])
    if "status" in update_data:
        update_data["status"] = _validate_capability_status(update_data["status"])
    if {"start_date", "end_date"} & update_data.keys():
        date_adapter = TypeAdapter(Optional[datetime])
        _validate_capability_dates(
            date_adapter.validate_python(update_data.get("start_date", existing.get("start_date"))),
            date_adapter.validate_python(update_data.get("end_date", existing.get("end_date"))),
        )
    if "start_date" in update_data:
        update_data["start_date"] = _iso_or_none(update_data["start_date"])
    if "end_date" in update_data:
        update_data["end_date"] = _iso_or_none(update_data["end_date"])

    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    capabilities.update({"_key": capability_id, **existing, **update_data})
    stored = capabilities.get(capability_id)
    return _capability_from_doc(
        stored,
        owner_organization_name=_resolve_owner_name(organizations, stored.get("owner_organization_id")),
    )


@router.patch("/capabilities/{capability_id}/retire", response_model=CapabilityResponse)
async def retire_capability(
    capability_id: str,
    db=Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Retire a capability."""
    _user_can_manage_organization(current_user)
    capabilities = _collection(db, "capabilities")
    organizations = _collection(db, "organizations")

    if not capabilities.has(capability_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Capability not found")

    doc = capabilities.get(capability_id)
    doc["status"] = "Retired"
    doc["updated_at"] = datetime.now(timezone.utc).isoformat()
    capabilities.update({"_key": capability_id, **doc})
    stored = capabilities.get(capability_id)
    return _capability_from_doc(
        stored,
        owner_organization_name=_resolve_owner_name(organizations, stored.get("owner_organization_id")),
    )


@router.get(
    "/planning-cycles/{cycle_id}/strategic-objectives/{objective_id}/choices/{choice_id}/capabilities",
    response_model=list[CapabilityResponse],
)
async def list_capabilities_for_choice(
    cycle_id: str,
    objective_id: str,
    choice_id: str,
    db=Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """List capabilities linked to a strategic choice."""
    _user_can_manage_organization(current_user)
    planning_cycles = _collection(db, "planning_cycles")
    objectives = _collection(db, "strategic_objectives")
    choices = _collection(db, "strategic_choices")
    capabilities = _collection(db, "capabilities")
    links = _collection(db, "strategic_choice_capabilities")
    organizations = _collection(db, "organizations")

    if not planning_cycles.has(cycle_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Planning cycle not found")
    if not objectives.has(objective_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic objective not found")
    if not choices.has(choice_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic choice not found")

    objective = objectives.get(objective_id)
    if objective.get("planning_cycle_id") != cycle_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic objective not found")

    choice = choices.get(choice_id)
    if choice.get("planning_cycle_id") != cycle_id or choice.get("strategic_objective_id") != objective_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic choice not found")

    linked_capability_ids = {
        item.get("capability_id")
        for item in (links.all() if hasattr(links, "all") else [])
        if item.get("strategic_choice_id") == choice_id
    }
    linked_items = [
        capabilities.get(capability_id)
        for capability_id in linked_capability_ids
        if capability_id and capabilities.has(capability_id)
    ]
    return [
        _capability_from_doc(
            item,
            owner_organization_name=_resolve_owner_name(organizations, item.get("owner_organization_id")),
        )
        for item in linked_items
    ]


@router.post(
    "/planning-cycles/{cycle_id}/strategic-objectives/{objective_id}/choices/{choice_id}/capabilities",
    response_model=CapabilityResponse,
)
async def attach_capability_to_choice(
    cycle_id: str,
    objective_id: str,
    choice_id: str,
    payload: StrategicChoiceCapabilityLinkCreate,
    db=Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Attach capability to strategic choice."""
    _user_can_manage_organization(current_user)
    planning_cycles = _collection(db, "planning_cycles")
    objectives = _collection(db, "strategic_objectives")
    choices = _collection(db, "strategic_choices")
    capabilities = _collection(db, "capabilities")
    links = _collection(db, "strategic_choice_capabilities")
    organizations = _collection(db, "organizations")

    if not planning_cycles.has(cycle_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Planning cycle not found")
    if not objectives.has(objective_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic objective not found")
    if not choices.has(choice_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic choice not found")
    if not capabilities.has(payload.capability_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Capability not found")

    objective = objectives.get(objective_id)
    if objective.get("planning_cycle_id") != cycle_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic objective not found")

    choice = choices.get(choice_id)
    if choice.get("planning_cycle_id") != cycle_id or choice.get("strategic_objective_id") != objective_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic choice not found")

    link_key = f"{choice_id}::{payload.capability_id}"
    if not links.has(link_key):
        links.insert(
            {
                "_key": link_key,
                "strategic_choice_id": choice_id,
                "capability_id": payload.capability_id,
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
        )

    capability = capabilities.get(payload.capability_id)
    return _capability_from_doc(
        capability,
        owner_organization_name=_resolve_owner_name(organizations, capability.get("owner_organization_id")),
    )


@router.get(
    "/planning-cycles/{cycle_id}/strategic-objectives/{objective_id}/choices/{choice_id}/initiatives",
    response_model=list[InitiativeResponse],
)
async def list_initiatives_for_choice(
    cycle_id: str,
    objective_id: str,
    choice_id: str,
    db=Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """List initiatives linked to a strategic choice."""
    _user_can_manage_organization(current_user)
    planning_cycles = _collection(db, "planning_cycles")
    objectives = _collection(db, "strategic_objectives")
    choices = _collection(db, "strategic_choices")
    initiatives = _collection(db, "initiatives")
    choice_links = _collection(db, "strategic_choice_initiatives")
    organizations = _collection(db, "organizations")

    if not planning_cycles.has(cycle_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Planning cycle not found")
    if not objectives.has(objective_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic objective not found")
    if not choices.has(choice_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic choice not found")

    objective = objectives.get(objective_id)
    if objective.get("planning_cycle_id") != cycle_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic objective not found")

    choice = choices.get(choice_id)
    if choice.get("planning_cycle_id") != cycle_id or choice.get("strategic_objective_id") != objective_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic choice not found")

    linked_initiative_ids = {
        item.get("initiative_id")
        for item in (choice_links.all() if hasattr(choice_links, "all") else [])
        if item.get("strategic_choice_id") == choice_id
    }
    linked_items = [
        initiatives.get(initiative_id)
        for initiative_id in linked_initiative_ids
        if initiative_id and initiatives.has(initiative_id)
    ]
    return [
        _initiative_from_doc(
            item,
            owner_organization_name=_resolve_owner_name(organizations, item.get("owner_organization_id")),
        )
        for item in linked_items
    ]


@router.post(
    "/planning-cycles/{cycle_id}/strategic-objectives/{objective_id}/choices/{choice_id}/initiatives",
    response_model=InitiativeResponse,
)
async def create_initiative_for_choice(
    cycle_id: str,
    objective_id: str,
    choice_id: str,
    payload: InitiativeCreate,
    db=Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Create initiative and link it to at least one strategic choice."""
    _user_can_manage_organization(current_user)
    planning_cycles = _collection(db, "planning_cycles")
    objectives = _collection(db, "strategic_objectives")
    choices = _collection(db, "strategic_choices")
    initiatives = _collection(db, "initiatives")
    choice_links = _collection(db, "strategic_choice_initiatives")
    organizations = _collection(db, "organizations")

    if not planning_cycles.has(cycle_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Planning cycle not found")
    if not objectives.has(objective_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic objective not found")
    if not choices.has(choice_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic choice not found")
    if payload.planning_cycle_id != cycle_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="planning_cycle_id must match route cycle_id")
    if not organizations.has(payload.owner_organization_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Owner organization not found")

    objective = objectives.get(objective_id)
    if objective.get("planning_cycle_id") != cycle_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic objective not found")

    choice = choices.get(choice_id)
    if choice.get("planning_cycle_id") != cycle_id or choice.get("strategic_objective_id") != objective_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic choice not found")

    now = datetime.now(timezone.utc).isoformat()
    initiative_key = f"{cycle_id}__initiative-{int(datetime.now(timezone.utc).timestamp() * 1000)}"
    doc = {
        "_key": initiative_key,
        "planning_cycle_id": cycle_id,
        "name": payload.name,
        "description": payload.description,
        "status": _validate_initiative_status(payload.status),
        "owner_organization_id": payload.owner_organization_id,
        "start_date": _iso_or_none(payload.start_date),
        "end_date": _iso_or_none(payload.end_date),
        "budget": payload.budget,
        "created_at": now,
        "updated_at": now,
    }
    initiatives.insert(doc)

    link_key = f"{choice_id}::{initiative_key}"
    if not choice_links.has(link_key):
        choice_links.insert(
            {
                "_key": link_key,
                "strategic_choice_id": choice_id,
                "initiative_id": initiative_key,
                "created_at": now,
            }
        )

    return _initiative_from_doc(
        doc,
        owner_organization_name=organizations.get(payload.owner_organization_id).get("name"),
    )


@router.put(
    "/planning-cycles/{cycle_id}/strategic-objectives/{objective_id}/choices/{choice_id}/initiatives/{initiative_id}",
    response_model=InitiativeResponse,
)
async def update_initiative_for_choice(
    cycle_id: str,
    objective_id: str,
    choice_id: str,
    initiative_id: str,
    payload: InitiativeUpdate,
    db=Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Update initiative linked to a strategic choice."""
    _user_can_manage_organization(current_user)
    planning_cycles = _collection(db, "planning_cycles")
    objectives = _collection(db, "strategic_objectives")
    choices = _collection(db, "strategic_choices")
    initiatives = _collection(db, "initiatives")
    choice_links = _collection(db, "strategic_choice_initiatives")
    organizations = _collection(db, "organizations")

    if not planning_cycles.has(cycle_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Planning cycle not found")
    if not objectives.has(objective_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic objective not found")
    if not choices.has(choice_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic choice not found")
    if not initiatives.has(initiative_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Initiative not found")

    objective = objectives.get(objective_id)
    if objective.get("planning_cycle_id") != cycle_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic objective not found")

    choice = choices.get(choice_id)
    if choice.get("planning_cycle_id") != cycle_id or choice.get("strategic_objective_id") != objective_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic choice not found")

    link_key = f"{choice_id}::{initiative_id}"
    if not choice_links.has(link_key):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Initiative is not linked to this strategic choice")

    existing = initiatives.get(initiative_id)
    if existing.get("planning_cycle_id") != cycle_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Initiative not found")

    update_data = payload.model_dump(exclude_unset=True)
    if "planning_cycle_id" in update_data and update_data["planning_cycle_id"] != cycle_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="planning_cycle_id must match route cycle_id")
    if "owner_organization_id" in update_data and not organizations.has(update_data["owner_organization_id"]):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Owner organization not found")
    if "status" in update_data:
        update_data["status"] = _validate_initiative_status(update_data["status"])
    if "start_date" in update_data:
        update_data["start_date"] = _iso_or_none(update_data["start_date"])
    if "end_date" in update_data:
        update_data["end_date"] = _iso_or_none(update_data["end_date"])

    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    initiatives.update({"_key": initiative_id, **existing, **update_data})
    stored = initiatives.get(initiative_id)
    return _initiative_from_doc(
        stored,
        owner_organization_name=_resolve_owner_name(organizations, stored.get("owner_organization_id")),
    )


@router.get(
    "/planning-cycles/{cycle_id}/strategic-objectives/{objective_id}/choices/{choice_id}/initiatives/{initiative_id}/detail",
    response_model=InitiativeDetailResponse,
)
async def get_initiative_detail(
    cycle_id: str,
    objective_id: str,
    choice_id: str,
    initiative_id: str,
    db=Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get initiative detail with linked choices, capabilities, and agreements."""
    _user_can_manage_organization(current_user)
    planning_cycles = _collection(db, "planning_cycles")
    objectives = _collection(db, "strategic_objectives")
    choices = _collection(db, "strategic_choices")
    initiatives = _collection(db, "initiatives")
    choice_links = _collection(db, "strategic_choice_initiatives")
    capability_links = _collection(db, "initiative_capabilities")
    agreement_links = _collection(db, "initiative_agreements")
    capabilities = _collection(db, "capabilities")
    agreements = _collection(db, "strategic_agreements")
    organizations = _collection(db, "organizations")

    if not planning_cycles.has(cycle_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Planning cycle not found")
    if not objectives.has(objective_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic objective not found")
    if not choices.has(choice_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic choice not found")
    if not initiatives.has(initiative_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Initiative not found")

    choice_link_key = f"{choice_id}::{initiative_id}"
    if not choice_links.has(choice_link_key):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Initiative is not linked to this strategic choice")

    initiative = initiatives.get(initiative_id)
    if initiative.get("planning_cycle_id") != cycle_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Initiative not found")

    linked_choice_rows = [
        item for item in (choice_links.all() if hasattr(choice_links, "all") else [])
        if item.get("initiative_id") == initiative_id and choices.has(item.get("strategic_choice_id"))
    ]
    linked_choices = [
        _initiative_choice_link_from_docs(item, choices.get(item.get("strategic_choice_id")))
        for item in linked_choice_rows
    ]

    linked_capability_rows = [
        item for item in (capability_links.all() if hasattr(capability_links, "all") else [])
        if item.get("initiative_id") == initiative_id and capabilities.has(item.get("capability_id"))
    ]
    linked_capabilities = [
        _initiative_capability_link_from_docs(item, capabilities.get(item.get("capability_id")))
        for item in linked_capability_rows
    ]

    linked_agreement_rows = [
        item for item in (agreement_links.all() if hasattr(agreement_links, "all") else [])
        if item.get("initiative_id") == initiative_id and agreements.has(item.get("strategic_agreement_id"))
    ]
    linked_agreements = [
        _initiative_agreement_link_from_docs(item, agreements.get(item.get("strategic_agreement_id")))
        for item in linked_agreement_rows
    ]

    base = _initiative_from_doc(
        initiative,
        owner_organization_name=_resolve_owner_name(organizations, initiative.get("owner_organization_id")),
    )
    return InitiativeDetailResponse(
        **base.model_dump(),
        linked_choices=linked_choices,
        linked_capabilities=linked_capabilities,
        linked_agreements=linked_agreements,
    )


@router.get(
    "/planning-cycles/{cycle_id}/strategic-objectives/{objective_id}/choices/{choice_id}/initiatives/{initiative_id}/capabilities",
    response_model=list[CapabilityResponse],
)
async def list_capabilities_for_initiative(
    cycle_id: str,
    objective_id: str,
    choice_id: str,
    initiative_id: str,
    db=Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """List capabilities linked to an initiative."""
    _user_can_manage_organization(current_user)
    planning_cycles = _collection(db, "planning_cycles")
    objectives = _collection(db, "strategic_objectives")
    choices = _collection(db, "strategic_choices")
    initiatives = _collection(db, "initiatives")
    choice_capability_links = _collection(db, "strategic_choice_capabilities")
    initiative_capability_links = _collection(db, "initiative_capabilities")
    capabilities = _collection(db, "capabilities")
    organizations = _collection(db, "organizations")
    choice_links = _collection(db, "strategic_choice_initiatives")

    if not planning_cycles.has(cycle_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Planning cycle not found")
    if not objectives.has(objective_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic objective not found")
    if not choices.has(choice_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic choice not found")
    if not initiatives.has(initiative_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Initiative not found")

    choice_link_key = f"{choice_id}::{initiative_id}"
    if not choice_links.has(choice_link_key):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Initiative is not linked to this strategic choice")

    allowed_capability_ids = {
        item.get("capability_id")
        for item in (choice_capability_links.all() if hasattr(choice_capability_links, "all") else [])
        if item.get("strategic_choice_id") == choice_id
    }

    linked_capability_ids = {
        item.get("capability_id")
        for item in (initiative_capability_links.all() if hasattr(initiative_capability_links, "all") else [])
        if item.get("initiative_id") == initiative_id and item.get("capability_id") in allowed_capability_ids
    }
    linked_items = [
        capabilities.get(capability_id)
        for capability_id in linked_capability_ids
        if capability_id and capabilities.has(capability_id)
    ]
    return [
        _capability_from_doc(
            item,
            owner_organization_name=_resolve_owner_name(organizations, item.get("owner_organization_id")),
        )
        for item in linked_items
    ]


@router.post(
    "/planning-cycles/{cycle_id}/strategic-objectives/{objective_id}/choices/{choice_id}/initiatives/{initiative_id}/capabilities/{capability_id}",
    response_model=CapabilityResponse,
)
async def attach_capability_to_initiative(
    cycle_id: str,
    objective_id: str,
    choice_id: str,
    initiative_id: str,
    capability_id: str,
    db=Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Attach an already-linked choice capability to an initiative."""
    _user_can_manage_organization(current_user)
    planning_cycles = _collection(db, "planning_cycles")
    objectives = _collection(db, "strategic_objectives")
    choices = _collection(db, "strategic_choices")
    initiatives = _collection(db, "initiatives")
    choice_links = _collection(db, "strategic_choice_initiatives")
    choice_capability_links = _collection(db, "strategic_choice_capabilities")
    initiative_capability_links = _collection(db, "initiative_capabilities")
    capabilities = _collection(db, "capabilities")
    organizations = _collection(db, "organizations")

    if not planning_cycles.has(cycle_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Planning cycle not found")
    if not objectives.has(objective_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic objective not found")
    if not choices.has(choice_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic choice not found")
    if not initiatives.has(initiative_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Initiative not found")
    if not capabilities.has(capability_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Capability not found")

    choice_link_key = f"{choice_id}::{initiative_id}"
    if not choice_links.has(choice_link_key):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Initiative is not linked to this strategic choice")

    choice_capability_key = f"{choice_id}::{capability_id}"
    if not choice_capability_links.has(choice_capability_key):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Capability must be linked to the same strategic choice before attaching to initiative",
        )

    initiative_capability_key = f"{initiative_id}::{capability_id}"
    if not initiative_capability_links.has(initiative_capability_key):
        initiative_capability_links.insert(
            {
                "_key": initiative_capability_key,
                "initiative_id": initiative_id,
                "capability_id": capability_id,
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
        )

    capability = capabilities.get(capability_id)
    return _capability_from_doc(
        capability,
        owner_organization_name=_resolve_owner_name(organizations, capability.get("owner_organization_id")),
    )


@router.get(
    "/planning-cycles/{cycle_id}/strategic-objectives/{objective_id}/choices/{choice_id}/initiatives/{initiative_id}/agreements",
    response_model=list[StrategicAgreementResponse],
)
async def list_agreements_for_initiative(
    cycle_id: str,
    objective_id: str,
    choice_id: str,
    initiative_id: str,
    db=Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """List agreements linked to an initiative."""
    _user_can_manage_organization(current_user)
    planning_cycles = _collection(db, "planning_cycles")
    objectives = _collection(db, "strategic_objectives")
    choices = _collection(db, "strategic_choices")
    initiatives = _collection(db, "initiatives")
    choice_links = _collection(db, "strategic_choice_initiatives")
    initiative_agreement_links = _collection(db, "initiative_agreements")
    agreements = _collection(db, "strategic_agreements")
    organizations = _collection(db, "organizations")

    if not planning_cycles.has(cycle_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Planning cycle not found")
    if not objectives.has(objective_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic objective not found")
    if not choices.has(choice_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic choice not found")
    if not initiatives.has(initiative_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Initiative not found")

    choice_link_key = f"{choice_id}::{initiative_id}"
    if not choice_links.has(choice_link_key):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Initiative is not linked to this strategic choice")

    linked_agreement_ids = {
        item.get("strategic_agreement_id")
        for item in (initiative_agreement_links.all() if hasattr(initiative_agreement_links, "all") else [])
        if item.get("initiative_id") == initiative_id
    }
    linked_items = [
        agreements.get(agreement_id)
        for agreement_id in linked_agreement_ids
        if agreement_id and agreements.has(agreement_id)
    ]
    return [
        _strategic_agreement_from_doc(
            item,
            choice_title=choices.get(choice_id).get("title"),
            owner_organization_name=_resolve_owner_name(organizations, item.get("owner_organization_id")),
        )
        for item in linked_items
        if item.get("strategic_choice_id") == choice_id
    ]


@router.post(
    "/planning-cycles/{cycle_id}/strategic-objectives/{objective_id}/choices/{choice_id}/initiatives/{initiative_id}/agreements/{agreement_id}",
    response_model=StrategicAgreementResponse,
)
async def attach_agreement_to_initiative(
    cycle_id: str,
    objective_id: str,
    choice_id: str,
    initiative_id: str,
    agreement_id: str,
    db=Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Attach an agreement from the same choice to an initiative."""
    _user_can_manage_organization(current_user)
    planning_cycles = _collection(db, "planning_cycles")
    objectives = _collection(db, "strategic_objectives")
    choices = _collection(db, "strategic_choices")
    initiatives = _collection(db, "initiatives")
    choice_links = _collection(db, "strategic_choice_initiatives")
    agreements = _collection(db, "strategic_agreements")
    initiative_agreement_links = _collection(db, "initiative_agreements")
    organizations = _collection(db, "organizations")

    if not planning_cycles.has(cycle_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Planning cycle not found")
    if not objectives.has(objective_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic objective not found")
    if not choices.has(choice_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic choice not found")
    if not initiatives.has(initiative_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Initiative not found")
    if not agreements.has(agreement_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic agreement not found")

    choice_link_key = f"{choice_id}::{initiative_id}"
    if not choice_links.has(choice_link_key):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Initiative is not linked to this strategic choice")

    agreement = agreements.get(agreement_id)
    if agreement.get("planning_cycle_id") != cycle_id or agreement.get("strategic_choice_id") != choice_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Agreement must belong to the same strategic choice before attaching to initiative",
        )

    link_key = f"{initiative_id}::{agreement_id}"
    if not initiative_agreement_links.has(link_key):
        initiative_agreement_links.insert(
            {
                "_key": link_key,
                "initiative_id": initiative_id,
                "strategic_agreement_id": agreement_id,
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
        )

    return _strategic_agreement_from_doc(
        agreement,
        choice_title=choices.get(choice_id).get("title"),
        owner_organization_name=_resolve_owner_name(organizations, agreement.get("owner_organization_id")),
    )


@router.get(
    "/planning-cycles/{cycle_id}/strategic-objectives/{objective_id}/initiatives/{initiative_id}/outcomes",
    response_model=list[OutcomeResponse],
)
async def list_outcomes_for_initiative(
    cycle_id: str,
    objective_id: str,
    initiative_id: str,
    db=Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """List outcomes for an objective and initiative context."""
    _user_can_manage_organization(current_user)
    planning_cycles = _collection(db, "planning_cycles")
    objectives = _collection(db, "strategic_objectives")
    initiatives = _collection(db, "initiatives")
    choice_links = _collection(db, "strategic_choice_initiatives")
    choices = _collection(db, "strategic_choices")
    outcomes = _collection(db, "outcomes")

    if not planning_cycles.has(cycle_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Planning cycle not found")
    if not objectives.has(objective_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic objective not found")
    if not initiatives.has(initiative_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Initiative not found")

    objective = objectives.get(objective_id)
    if objective.get("planning_cycle_id") != cycle_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic objective not found")

    if not _initiative_choice_rows_for_objective(choice_links, choices, cycle_id, objective_id, initiative_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Initiative is not linked to this strategic objective")

    linked_outcomes = [
        item
        for item in (outcomes.all() if hasattr(outcomes, "all") else [])
        if item.get("planning_cycle_id") == cycle_id
        and item.get("strategic_objective_id") == objective_id
        and item.get("initiative_id") == initiative_id
    ]
    return [_outcome_from_doc(item) for item in linked_outcomes]


@router.post(
    "/planning-cycles/{cycle_id}/strategic-objectives/{objective_id}/initiatives/{initiative_id}/outcomes",
    response_model=OutcomeResponse,
)
async def create_outcome_for_initiative(
    cycle_id: str,
    objective_id: str,
    initiative_id: str,
    payload: OutcomeCreate,
    db=Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Create an outcome for an initiative under a strategic objective."""
    _user_can_manage_organization(current_user)
    planning_cycles = _collection(db, "planning_cycles")
    objectives = _collection(db, "strategic_objectives")
    initiatives = _collection(db, "initiatives")
    choice_links = _collection(db, "strategic_choice_initiatives")
    choices = _collection(db, "strategic_choices")
    outcomes = _collection(db, "outcomes")

    if not planning_cycles.has(cycle_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Planning cycle not found")
    if not objectives.has(objective_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic objective not found")
    if not initiatives.has(initiative_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Initiative not found")
    if payload.planning_cycle_id != cycle_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="planning_cycle_id must match route cycle_id")
    if payload.strategic_objective_id != objective_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="strategic_objective_id must match route objective_id")
    if payload.initiative_id != initiative_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="initiative_id must match route initiative_id")

    objective = objectives.get(objective_id)
    if objective.get("planning_cycle_id") != cycle_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic objective not found")

    initiative = initiatives.get(initiative_id)
    if initiative.get("planning_cycle_id") != cycle_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Initiative not found")

    if not _initiative_choice_rows_for_objective(choice_links, choices, cycle_id, objective_id, initiative_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Initiative is not linked to this strategic objective")

    now = datetime.now(timezone.utc).isoformat()
    outcome_key = f"{initiative_id}__outcome-{int(datetime.now(timezone.utc).timestamp() * 1000)}"
    doc = {
        "_key": outcome_key,
        "planning_cycle_id": cycle_id,
        "strategic_objective_id": objective_id,
        "initiative_id": initiative_id,
        "name": payload.name,
        "description": payload.description,
        "created_at": now,
        "updated_at": now,
    }
    outcomes.insert(doc)
    return _outcome_from_doc(doc)


@router.put(
    "/planning-cycles/{cycle_id}/strategic-objectives/{objective_id}/initiatives/{initiative_id}/outcomes/{outcome_id}",
    response_model=OutcomeResponse,
)
async def update_outcome_for_initiative(
    cycle_id: str,
    objective_id: str,
    initiative_id: str,
    outcome_id: str,
    payload: OutcomeUpdate,
    db=Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Update an outcome linked to an initiative."""
    _user_can_manage_organization(current_user)
    planning_cycles = _collection(db, "planning_cycles")
    objectives = _collection(db, "strategic_objectives")
    initiatives = _collection(db, "initiatives")
    choice_links = _collection(db, "strategic_choice_initiatives")
    choices = _collection(db, "strategic_choices")
    outcomes = _collection(db, "outcomes")

    if not planning_cycles.has(cycle_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Planning cycle not found")
    if not objectives.has(objective_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic objective not found")
    if not initiatives.has(initiative_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Initiative not found")
    if not outcomes.has(outcome_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Outcome not found")

    objective = objectives.get(objective_id)
    if objective.get("planning_cycle_id") != cycle_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic objective not found")

    initiative = initiatives.get(initiative_id)
    if initiative.get("planning_cycle_id") != cycle_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Initiative not found")

    if not _initiative_choice_rows_for_objective(choice_links, choices, cycle_id, objective_id, initiative_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Initiative is not linked to this strategic objective")

    existing = outcomes.get(outcome_id)
    if existing.get("planning_cycle_id") != cycle_id or existing.get("strategic_objective_id") != objective_id or existing.get("initiative_id") != initiative_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Outcome not found")

    update_data = payload.model_dump(exclude_unset=True)
    if "planning_cycle_id" in update_data and update_data["planning_cycle_id"] != cycle_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="planning_cycle_id must match route cycle_id")
    if "strategic_objective_id" in update_data and update_data["strategic_objective_id"] != objective_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="strategic_objective_id must match route objective_id")
    if "initiative_id" in update_data and update_data["initiative_id"] != initiative_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="initiative_id must match route initiative_id")

    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    outcomes.update({"_key": outcome_id, **existing, **update_data})
    return _outcome_from_doc(outcomes.get(outcome_id))


@router.get(
    "/planning-cycles/{cycle_id}/strategic-objectives/{objective_id}/initiatives/{initiative_id}/outcomes/{outcome_id}/detail",
    response_model=OutcomeDetailResponse,
)
async def get_outcome_detail(
    cycle_id: str,
    objective_id: str,
    initiative_id: str,
    outcome_id: str,
    db=Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get outcome detail with linked metrics."""
    _user_can_manage_organization(current_user)
    planning_cycles = _collection(db, "planning_cycles")
    objectives = _collection(db, "strategic_objectives")
    initiatives = _collection(db, "initiatives")
    choice_links = _collection(db, "strategic_choice_initiatives")
    choices = _collection(db, "strategic_choices")
    outcomes = _collection(db, "outcomes")
    metrics = _collection(db, "metrics")
    metric_targets = _collection(db, "metric_targets")
    metric_actuals = _collection(db, "metric_actuals")

    if not planning_cycles.has(cycle_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Planning cycle not found")
    if not objectives.has(objective_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic objective not found")
    if not initiatives.has(initiative_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Initiative not found")
    if not outcomes.has(outcome_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Outcome not found")

    objective = objectives.get(objective_id)
    if objective.get("planning_cycle_id") != cycle_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic objective not found")

    initiative = initiatives.get(initiative_id)
    if initiative.get("planning_cycle_id") != cycle_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Initiative not found")

    if not _initiative_choice_rows_for_objective(choice_links, choices, cycle_id, objective_id, initiative_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Initiative is not linked to this strategic objective")

    outcome = outcomes.get(outcome_id)
    if outcome.get("planning_cycle_id") != cycle_id or outcome.get("strategic_objective_id") != objective_id or outcome.get("initiative_id") != initiative_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Outcome not found")

    metric_docs = [
        item
        for item in (metrics.all() if hasattr(metrics, "all") else [])
        if item.get("outcome_id") == outcome_id
    ]
    metric_targets_by_metric = {
        item.get("metric_id"): item
        for item in (metric_targets.all() if hasattr(metric_targets, "all") else [])
        if item.get("metric_id")
    }
    metric_actuals_by_metric: dict[str, list[dict[str, Any]]] = {}
    for item in (metric_actuals.all() if hasattr(metric_actuals, "all") else []):
        metric_actuals_by_metric.setdefault(item.get("metric_id"), []).append(item)

    return _outcome_detail_from_docs(outcome, metric_docs, metric_targets_by_metric, metric_actuals_by_metric)


@router.get(
    "/planning-cycles/{cycle_id}/strategic-objectives/{objective_id}/initiatives/{initiative_id}/outcomes/{outcome_id}/metrics",
    response_model=list[MetricDetailResponse],
)
async def list_metrics_for_outcome(
    cycle_id: str,
    objective_id: str,
    initiative_id: str,
    outcome_id: str,
    db=Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """List metrics linked to an outcome."""
    detail = await get_outcome_detail(cycle_id, objective_id, initiative_id, outcome_id, db=db, current_user=current_user)
    return detail.linked_metrics


@router.post(
    "/planning-cycles/{cycle_id}/strategic-objectives/{objective_id}/initiatives/{initiative_id}/outcomes/{outcome_id}/metrics",
    response_model=MetricDetailResponse,
)
async def create_metric_for_outcome(
    cycle_id: str,
    objective_id: str,
    initiative_id: str,
    outcome_id: str,
    payload: MetricCreate,
    db=Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Create a metric for an outcome."""
    _user_can_manage_organization(current_user)
    planning_cycles = _collection(db, "planning_cycles")
    objectives = _collection(db, "strategic_objectives")
    initiatives = _collection(db, "initiatives")
    choice_links = _collection(db, "strategic_choice_initiatives")
    choices = _collection(db, "strategic_choices")
    outcomes = _collection(db, "outcomes")
    metrics = _collection(db, "metrics")
    metric_targets = _collection(db, "metric_targets")
    metric_actuals = _collection(db, "metric_actuals")

    if not planning_cycles.has(cycle_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Planning cycle not found")
    if not objectives.has(objective_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic objective not found")
    if not initiatives.has(initiative_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Initiative not found")
    if not outcomes.has(outcome_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Outcome not found")
    if payload.outcome_id != outcome_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="outcome_id must match route outcome_id")

    objective = objectives.get(objective_id)
    if objective.get("planning_cycle_id") != cycle_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic objective not found")
    initiative = initiatives.get(initiative_id)
    if initiative.get("planning_cycle_id") != cycle_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Initiative not found")
    outcome = outcomes.get(outcome_id)
    if outcome.get("planning_cycle_id") != cycle_id or outcome.get("strategic_objective_id") != objective_id or outcome.get("initiative_id") != initiative_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Outcome not found")
    if not _initiative_choice_rows_for_objective(choice_links, choices, cycle_id, objective_id, initiative_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Initiative is not linked to this strategic objective")

    now = datetime.now(timezone.utc).isoformat()
    metric_key = f"{outcome_id}__metric-{int(datetime.now(timezone.utc).timestamp() * 1000)}"
    metric_doc = {
        "_key": metric_key,
        "outcome_id": outcome_id,
        "name": payload.name,
        "description": payload.description,
        "unit": payload.unit,
        "created_at": now,
        "updated_at": now,
    }
    metrics.insert(metric_doc)

    target_doc = None
    if payload.target:
        target_doc = {
            "_key": metric_key,
            "metric_id": metric_key,
            "target_value": payload.target.target_value,
            "target_unit": payload.target.target_unit,
            "target_date": payload.target.target_date,
            "notes": payload.target.notes,
            "created_at": now,
        }
        metric_targets.insert(target_doc)

    actual_docs: list[dict[str, Any]] = []
    if payload.actual:
        actual_doc = {
            "_key": f"{metric_key}::{int(datetime.now(timezone.utc).timestamp() * 1000)}",
            "metric_id": metric_key,
            "actual_value": payload.actual.actual_value,
            "actual_unit": payload.actual.actual_unit,
            "measured_at": payload.actual.measured_at,
            "notes": payload.actual.notes,
            "created_at": now,
        }
        metric_actuals.insert(actual_doc)
        actual_docs.append(actual_doc)

    return _metric_from_doc(metric_doc, target_doc=target_doc, actual_docs=actual_docs)


@router.put(
    "/planning-cycles/{cycle_id}/strategic-objectives/{objective_id}/initiatives/{initiative_id}/outcomes/{outcome_id}/metrics/{metric_id}",
    response_model=MetricDetailResponse,
)
async def update_metric_for_outcome(
    cycle_id: str,
    objective_id: str,
    initiative_id: str,
    outcome_id: str,
    metric_id: str,
    payload: MetricUpdate,
    db=Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Update a metric and optionally refresh its target or record a new actual."""
    _user_can_manage_organization(current_user)
    planning_cycles = _collection(db, "planning_cycles")
    objectives = _collection(db, "strategic_objectives")
    initiatives = _collection(db, "initiatives")
    choice_links = _collection(db, "strategic_choice_initiatives")
    choices = _collection(db, "strategic_choices")
    outcomes = _collection(db, "outcomes")
    metrics = _collection(db, "metrics")
    metric_targets = _collection(db, "metric_targets")
    metric_actuals = _collection(db, "metric_actuals")

    if not planning_cycles.has(cycle_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Planning cycle not found")
    if not objectives.has(objective_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic objective not found")
    if not initiatives.has(initiative_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Initiative not found")
    if not outcomes.has(outcome_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Outcome not found")
    if not metrics.has(metric_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Metric not found")

    objective = objectives.get(objective_id)
    if objective.get("planning_cycle_id") != cycle_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic objective not found")
    initiative = initiatives.get(initiative_id)
    if initiative.get("planning_cycle_id") != cycle_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Initiative not found")
    outcome = outcomes.get(outcome_id)
    if outcome.get("planning_cycle_id") != cycle_id or outcome.get("strategic_objective_id") != objective_id or outcome.get("initiative_id") != initiative_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Outcome not found")
    metric_doc = metrics.get(metric_id)
    if metric_doc.get("outcome_id") != outcome_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Metric not found")
    if not _initiative_choice_rows_for_objective(choice_links, choices, cycle_id, objective_id, initiative_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Initiative is not linked to this strategic objective")

    update_data = payload.model_dump(exclude_unset=True)
    if "outcome_id" in update_data and update_data["outcome_id"] != outcome_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="outcome_id must match route outcome_id")
    if "name" in update_data and update_data["name"] is not None:
        metric_doc["name"] = update_data["name"]
    if "description" in update_data:
        metric_doc["description"] = update_data["description"]
    if "unit" in update_data:
        metric_doc["unit"] = update_data["unit"]

    now = datetime.now(timezone.utc).isoformat()
    metric_doc["updated_at"] = now
    metrics.update(metric_doc)

    target_doc = metric_targets.get(metric_id) if metric_targets.has(metric_id) else None
    if payload.target:
        target_doc = {
            "_key": metric_id,
            "metric_id": metric_id,
            "target_value": payload.target.target_value,
            "target_unit": payload.target.target_unit,
            "target_date": payload.target.target_date,
            "notes": payload.target.notes,
            "created_at": target_doc.get("created_at") if target_doc else now,
        }
        metric_targets.insert(target_doc)

    actual_docs = [item for item in (metric_actuals.all() if hasattr(metric_actuals, "all") else []) if item.get("metric_id") == metric_id]
    if payload.actual:
        actual_doc = {
            "_key": f"{metric_id}::{int(datetime.now(timezone.utc).timestamp() * 1000)}",
            "metric_id": metric_id,
            "actual_value": payload.actual.actual_value,
            "actual_unit": payload.actual.actual_unit,
            "measured_at": payload.actual.measured_at,
            "notes": payload.actual.notes,
            "created_at": now,
        }
        metric_actuals.insert(actual_doc)
        actual_docs.append(actual_doc)

    return _metric_from_doc(metric_doc, target_doc=target_doc, actual_docs=actual_docs)


@router.delete(
    "/planning-cycles/{cycle_id}/strategic-objectives/{objective_id}/choices/{choice_id}/capabilities/{capability_id}",
    response_model=CapabilityResponse,
)
async def detach_capability_from_choice(
    cycle_id: str,
    objective_id: str,
    choice_id: str,
    capability_id: str,
    db=Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Detach capability from strategic choice."""
    _user_can_manage_organization(current_user)
    planning_cycles = _collection(db, "planning_cycles")
    objectives = _collection(db, "strategic_objectives")
    choices = _collection(db, "strategic_choices")
    capabilities = _collection(db, "capabilities")
    links = _collection(db, "strategic_choice_capabilities")
    organizations = _collection(db, "organizations")

    if not planning_cycles.has(cycle_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Planning cycle not found")
    if not objectives.has(objective_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic objective not found")
    if not choices.has(choice_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic choice not found")
    if not capabilities.has(capability_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Capability not found")

    objective = objectives.get(objective_id)
    if objective.get("planning_cycle_id") != cycle_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic objective not found")

    choice = choices.get(choice_id)
    if choice.get("planning_cycle_id") != cycle_id or choice.get("strategic_objective_id") != objective_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic choice not found")

    link_key = f"{choice_id}::{capability_id}"
    if links.has(link_key):
        links.delete(link_key)

    capability = capabilities.get(capability_id)
    return _capability_from_doc(
        capability,
        owner_organization_name=_resolve_owner_name(organizations, capability.get("owner_organization_id")),
    )


@router.get("/capabilities/{capability_id}/detail", response_model=CapabilityDetailResponse)
async def get_capability_detail(
    capability_id: str,
    db=Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get capability detail with linked choices and linked agreements."""
    _user_can_manage_organization(current_user)
    capabilities = _collection(db, "capabilities")
    choices = _collection(db, "strategic_choices")
    links = _collection(db, "strategic_choice_capabilities")
    agreements = _collection(db, "strategic_agreements")
    assessments = _collection(db, "capability_assessments")
    planning_cycles = _collection(db, "planning_cycles")
    organizations = _collection(db, "organizations")

    if not capabilities.has(capability_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Capability not found")

    capability = capabilities.get(capability_id)
    linked_choice_links = [
        item for item in (links.all() if hasattr(links, "all") else [])
        if item.get("capability_id") == capability_id and choices.has(item.get("strategic_choice_id"))
    ]
    linked_choices = [
        _capability_choice_link_from_docs(item, choices.get(item.get("strategic_choice_id")))
        for item in linked_choice_links
    ]

    choice_ids = {item.strategic_choice_id for item in linked_choices}
    linked_agreements = [
        _capability_agreement_link_from_doc(item)
        for item in (agreements.all() if hasattr(agreements, "all") else [])
        if item.get("strategic_choice_id") in choice_ids
    ]

    capability_assessments = [
        _capability_assessment_from_doc(
            item,
            capability_name=capability.get("name"),
            planning_cycle_name=(planning_cycles.get(item.get("planning_cycle_id")) or {}).get("name") if planning_cycles.has(item.get("planning_cycle_id")) else None,
            owner_organization_name=_resolve_owner_name(organizations, item.get("owner_organization_id")),
        )
        for item in (assessments.all() if hasattr(assessments, "all") else [])
        if item.get("capability_id") == capability_id
    ]

    base = _capability_from_doc(
        capability,
        owner_organization_name=_resolve_owner_name(organizations, capability.get("owner_organization_id")),
    )
    return CapabilityDetailResponse(
        **base.model_dump(),
        linked_choices=linked_choices,
        linked_agreements=linked_agreements,
        assessments=sorted(capability_assessments, key=lambda item: item.assessment_date or "", reverse=True),
    )


@router.get("/capabilities/{capability_id}/assessments", response_model=list[CapabilityAssessmentResponse])
async def list_capability_assessments(
    capability_id: str,
    planning_cycle_id: Optional[str] = None,
    db=Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """List capability assessments, optionally filtered by planning cycle."""
    _user_can_manage_organization(current_user)
    capabilities = _collection(db, "capabilities")
    planning_cycles = _collection(db, "planning_cycles")
    assessments = _collection(db, "capability_assessments")
    organizations = _collection(db, "organizations")

    if not capabilities.has(capability_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Capability not found")
    if planning_cycle_id and not planning_cycles.has(planning_cycle_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Planning cycle not found")

    capability = capabilities.get(capability_id)
    items = [
        item for item in (assessments.all() if hasattr(assessments, "all") else [])
        if item.get("capability_id") == capability_id and (not planning_cycle_id or item.get("planning_cycle_id") == planning_cycle_id)
    ]
    mapped = [
        _capability_assessment_from_doc(
            item,
            capability_name=capability.get("name"),
            planning_cycle_name=(planning_cycles.get(item.get("planning_cycle_id")) or {}).get("name") if planning_cycles.has(item.get("planning_cycle_id")) else None,
            owner_organization_name=_resolve_owner_name(organizations, item.get("owner_organization_id")),
        )
        for item in items
    ]
    return sorted(mapped, key=lambda item: item.assessment_date or "", reverse=True)


@router.post("/capabilities/{capability_id}/assessments", response_model=CapabilityAssessmentResponse)
async def create_capability_assessment(
    capability_id: str,
    payload: CapabilityAssessmentCreate,
    db=Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Create capability assessment for a planning cycle."""
    _user_can_manage_organization(current_user)
    capabilities = _collection(db, "capabilities")
    planning_cycles = _collection(db, "planning_cycles")
    assessments = _collection(db, "capability_assessments")
    organizations = _collection(db, "organizations")

    if not capabilities.has(capability_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Capability not found")
    if payload.capability_id != capability_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="capability_id must match route capability_id")
    if not planning_cycles.has(payload.planning_cycle_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Planning cycle not found")
    if not organizations.has(payload.owner_organization_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Owner organization not found")

    current = _validate_capability_maturity(payload.current_maturity, "current_maturity")
    target = _validate_capability_maturity(payload.target_maturity, "target_maturity")

    key = f"{capability_id}__assessment-{int(datetime.now(timezone.utc).timestamp() * 1000)}"
    doc = {
        "_key": key,
        "capability_id": capability_id,
        "planning_cycle_id": payload.planning_cycle_id,
        "current_maturity": current,
        "target_maturity": target,
        "assessment_notes": payload.assessment_notes,
        "assessment_date": _iso_or_none(payload.assessment_date) or datetime.now(timezone.utc).isoformat(),
        "owner_organization_id": payload.owner_organization_id,
    }
    assessments.insert(doc)

    capability = capabilities.get(capability_id)
    planning_cycle = planning_cycles.get(payload.planning_cycle_id)
    return _capability_assessment_from_doc(
        doc,
        capability_name=capability.get("name"),
        planning_cycle_name=planning_cycle.get("name"),
        owner_organization_name=organizations.get(payload.owner_organization_id).get("name"),
    )


@router.put("/capabilities/{capability_id}/assessments/{assessment_id}", response_model=CapabilityAssessmentResponse)
async def update_capability_assessment(
    capability_id: str,
    assessment_id: str,
    payload: CapabilityAssessmentUpdate,
    db=Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Update capability assessment."""
    _user_can_manage_organization(current_user)
    capabilities = _collection(db, "capabilities")
    planning_cycles = _collection(db, "planning_cycles")
    assessments = _collection(db, "capability_assessments")
    organizations = _collection(db, "organizations")

    if not capabilities.has(capability_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Capability not found")
    if not assessments.has(assessment_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Capability assessment not found")

    existing = assessments.get(assessment_id)
    if existing.get("capability_id") != capability_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Capability assessment not found")

    update_data = payload.model_dump(exclude_unset=True)
    if "capability_id" in update_data and update_data["capability_id"] != capability_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="capability_id must match route capability_id")
    if "planning_cycle_id" in update_data and not planning_cycles.has(update_data["planning_cycle_id"]):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Planning cycle not found")
    if "owner_organization_id" in update_data and not organizations.has(update_data["owner_organization_id"]):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Owner organization not found")
    if "current_maturity" in update_data:
        update_data["current_maturity"] = _validate_capability_maturity(update_data["current_maturity"], "current_maturity")
    if "target_maturity" in update_data:
        update_data["target_maturity"] = _validate_capability_maturity(update_data["target_maturity"], "target_maturity")
    if "assessment_date" in update_data:
        update_data["assessment_date"] = _iso_or_none(update_data["assessment_date"])

    assessments.update({"_key": assessment_id, **existing, **update_data})
    stored = assessments.get(assessment_id)

    capability = capabilities.get(capability_id)
    cycle_id = stored.get("planning_cycle_id")
    cycle_name = planning_cycles.get(cycle_id).get("name") if cycle_id and planning_cycles.has(cycle_id) else None
    return _capability_assessment_from_doc(
        stored,
        capability_name=capability.get("name"),
        planning_cycle_name=cycle_name,
        owner_organization_name=_resolve_owner_name(organizations, stored.get("owner_organization_id")),
    )


@router.get("/governance/config", response_model=GovernanceConfig)
async def get_governance_config(
    db=Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get governance configuration."""
    _user_can_manage_organization(current_user)
    collection = _governance_collection(db)
    if collection.has("default"):
        return GovernanceConfig(**collection.get("default"))
    return _default_governance_config()


@router.put("/governance/config", response_model=GovernanceConfig)
async def update_governance_config(
    payload: GovernanceConfig,
    db=Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Update governance configuration."""
    _user_can_manage_organization(current_user)
    collection = _governance_collection(db)
    now = datetime.now(timezone.utc)
    document = payload.model_dump()
    document["_key"] = "default"
    document["updated_at"] = now.isoformat()
    if collection.has("default"):
        existing = collection.get("default")
        collection.update({"_key": "default", **existing, **document})
    else:
        collection.insert(document)
    return GovernanceConfig(**collection.get("default"))


@router.get("/strategic-relationships", response_model=list[StrategicRelationshipResponse])
async def list_strategic_relationships(
    node_id: Optional[str] = None,
    status: Optional[str] = None,
    db=Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """List strategic relationships, optionally scoped to a node."""
    _user_can_manage_organization(current_user)
    relationships = _collection(db, "strategic_relationships")
    items = relationships.all() if hasattr(relationships, "all") else []

    filtered: list[dict[str, Any]] = []
    for item in items:
        if status and _normalize(item.get("status")) != _normalize(status):
            continue
        if node_id and item.get("source_node_id") != node_id and item.get("target_node_id") != node_id:
            continue
        filtered.append(item)

    return [_relationship_from_doc(item) for item in filtered]


@router.post("/strategic-relationships", response_model=StrategicRelationshipResponse)
async def create_strategic_relationship(
    payload: StrategicRelationshipCreate,
    db=Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Create a strategic relationship between two organization nodes."""
    _user_can_manage_organization(current_user)
    if payload.source_node_id == payload.target_node_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Source and target nodes must differ")

    relationships = _collection(db, "strategic_relationships")
    now = datetime.now(timezone.utc).isoformat()
    key = f"rel-{int(datetime.now(timezone.utc).timestamp() * 1000)}"
    doc = {
        "_key": key,
        "source_node_id": payload.source_node_id,
        "target_node_id": payload.target_node_id,
        "relationship_type": payload.relationship_type,
        "participation_role": payload.participation_role,
        "strategy_role": payload.strategy_role,
        "review_cadence": payload.review_cadence,
        "status": payload.status,
        "notes": payload.notes,
        "created_date": now,
        "modified_date": now,
    }
    relationships.insert(doc)
    return _relationship_from_doc(doc)


@router.put("/strategic-relationships/{relationship_id}", response_model=StrategicRelationshipResponse)
async def update_strategic_relationship(
    relationship_id: str,
    payload: StrategicRelationshipUpdate,
    db=Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Update a strategic relationship."""
    _user_can_manage_organization(current_user)
    relationships = _collection(db, "strategic_relationships")
    if not relationships.has(relationship_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic relationship not found")

    existing = relationships.get(relationship_id)
    update_data = payload.model_dump(exclude_unset=True)
    if update_data.get("source_node_id") and update_data.get("target_node_id") and update_data["source_node_id"] == update_data["target_node_id"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Source and target nodes must differ")

    update_data["modified_date"] = datetime.now(timezone.utc).isoformat()
    relationships.update({"_key": relationship_id, **existing, **update_data})
    return _relationship_from_doc(relationships.get(relationship_id))


@router.delete("/strategic-relationships/{relationship_id}", response_model=StrategicRelationshipResponse)
async def delete_strategic_relationship(
    relationship_id: str,
    db=Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Delete a strategic relationship and related contracts."""
    _user_can_manage_organization(current_user)
    relationships = _collection(db, "strategic_relationships")
    contracts = _collection(db, "strategic_contracts")
    if not relationships.has(relationship_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic relationship not found")

    existing = relationships.get(relationship_id)
    if hasattr(relationships, "delete"):
        relationships.delete(relationship_id)
    else:
        del relationships.documents[relationship_id]

    related_contracts = [item for item in (contracts.all() if hasattr(contracts, "all") else []) if item.get("relationship_id") == relationship_id]
    for contract in related_contracts:
        contract_key = contract.get("_key") or contract.get("id")
        if contract_key and contracts.has(contract_key):
            contracts.delete(contract_key)

    return _relationship_from_doc(existing)


@router.get("/strategic-contracts", response_model=list[StrategicContractResponse])
async def list_strategic_contracts(
    relationship_id: Optional[str] = None,
    status: Optional[str] = None,
    db=Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """List strategic contracts."""
    _user_can_manage_organization(current_user)
    contracts = _collection(db, "strategic_contracts")
    items = contracts.all() if hasattr(contracts, "all") else []
    filtered = [
        item for item in items
        if (not status or _matches_status(item, status))
        and (not relationship_id or item.get("relationship_id") == relationship_id)
    ]
    return [_contract_from_doc(item) for item in filtered]


@router.post("/strategic-contracts", response_model=StrategicContractResponse)
async def create_strategic_contract(
    payload: StrategicContractCreate,
    db=Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Create a new strategic contract."""
    _user_can_manage_organization(current_user)
    relationships = _collection(db, "strategic_relationships")
    if not relationships.has(payload.relationship_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic relationship not found")

    contracts = _collection(db, "strategic_contracts")
    now = datetime.now(timezone.utc).isoformat()
    doc = {
        "_key": f"contract-{int(datetime.now(timezone.utc).timestamp() * 1000)}",
        "relationship_id": payload.relationship_id,
        "concern_alignment": payload.concern_alignment,
        "objective_alignment": payload.objective_alignment,
        "capability_alignment": payload.capability_alignment,
        "investment_alignment": payload.investment_alignment,
        "outcome_alignment": payload.outcome_alignment,
        "concern_decision_rights": payload.concern_decision_rights,
        "objective_decision_rights": payload.objective_decision_rights,
        "capability_decision_rights": payload.capability_decision_rights,
        "investment_decision_rights": payload.investment_decision_rights,
        "outcome_decision_rights": payload.outcome_decision_rights,
        "review_cadence": payload.review_cadence,
        "notes": payload.notes,
        "status": payload.status,
        "version": payload.version,
        "created_date": now,
        "modified_date": now,
    }
    contracts.insert(doc)
    return _contract_from_doc(doc)


@router.get("/strategic-contracts/{contract_id}", response_model=StrategicContractResponse)
async def get_strategic_contract(
    contract_id: str,
    db=Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get a single strategic contract by id."""
    _user_can_manage_organization(current_user)
    contracts = _collection(db, "strategic_contracts")
    if not contracts.has(contract_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic contract not found")
    return _contract_from_doc(contracts.get(contract_id))


@router.put("/strategic-contracts/{contract_id}", response_model=StrategicContractResponse)
async def update_strategic_contract(
    contract_id: str,
    payload: StrategicContractUpdate,
    db=Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Update a strategic contract."""
    _user_can_manage_organization(current_user)
    contracts = _collection(db, "strategic_contracts")
    relationships = _collection(db, "strategic_relationships")
    if not contracts.has(contract_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic contract not found")

    update_data = payload.model_dump(exclude_unset=True)
    if "relationship_id" in update_data and not relationships.has(update_data["relationship_id"]):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategic relationship not found")

    existing = contracts.get(contract_id)
    update_data["modified_date"] = datetime.now(timezone.utc).isoformat()
    contracts.update({"_key": contract_id, **existing, **update_data})
    return _contract_from_doc(contracts.get(contract_id))
