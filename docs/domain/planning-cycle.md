# Planning Cycle

## Definition

A Planning Cycle is a bounded period of strategic planning and execution.

## Purpose

Planning Cycle introduces the primary workspace for strategic planning without embedding strategy content directly into organization structure, strategic relationships, or strategic groups.

## Data model

PlanningCycle fields:

- Id
- Name
- Description
- OwnerOrganizationId
- Status
- StartDate
- EndDate
- CreatedAt
- UpdatedAt

## Status values

- Draft
- Planning
- Negotiation
- Approved
- Executing
- Completed
- Archived

## Ownership

Planning Cycle belongs to Organization through OwnerOrganizationId.

## Future artifact scope

Planning Cycle is a container. It does not contain strategy itself.

It owns strategy-development artifacts:

- Strategic Themes
- Drivers
- Strategic Questions
- Objectives
- Choices
- Agreements
- Initiatives
- Outcomes
- Strategy Reviews

Planning Cycles do not own Capability definitions.

Capabilities are reusable and independent of planning-cycle scope.

Implementation progression:

- Strategic Themes are implemented as the executive grouping layer across Drivers, Strategic Questions, Objectives, and Choices.
- Drivers are the first strategy artifact implemented within Planning Cycle.
- Strategic Questions are the next strategy artifact and connect Drivers to future Objectives.
- Strategic Objectives are implemented under Strategic Questions and cannot exist independently.
- Strategic Outcomes are implemented under Strategic Objectives and Initiatives and become the measured results of execution.

Outcome linkage rule:

- Strategic Outcome requires StrategicObjectiveId and InitiativeId.
- One Strategic Initiative may have many Outcomes.
- One Strategic Objective may have many Outcomes.

Metric linkage rule:

- One Outcome may have many Metrics.
- One Metric may record a target value and any number of actual observations over time.

Strategy execution traceability extends to Initiative:

- Driver -> Strategic Question -> Strategic Objective -> Strategic Choice -> Initiative -> Outcome -> Metric

## Future strategy flow

Within a Planning Cycle, strategy development follows:

Theme -> Driver -> Strategic Question -> Objective -> Strategic Choice -> Capability -> Initiative -> Outcome -> Metric

Agreement placement rule:

- Strategic Agreement is created from a Strategic Choice as the negotiated commitment artifact before execution planning.

Objective linkage rule:

- Strategic Objective requires StrategicQuestionId.
- One Strategic Question may have many Strategic Objectives.

Theme linkage rule:

- Strategic Theme may group many Drivers, Strategic Questions, Strategic Objectives, and Strategic Choices.
- Driver, Strategic Question, Strategic Objective, and Strategic Choice may each reference zero or one Strategic Theme.
- Strategic Theme and linked artifacts must belong to the same Planning Cycle.

Choice linkage rule:

- Strategic Choice requires StrategicObjectiveId.
- One Strategic Objective may have many Strategic Choices.

Agreement linkage rule:

- Strategic Agreement requires StrategicChoiceId.
- One Strategic Choice may have many Strategic Agreements.

Initiative linkage rule:

- Strategic Initiative is created in the context of a Strategic Choice.
- One Strategic Choice may have many Strategic Initiatives.
- Every Strategic Initiative must link to at least one Strategic Choice.
- Strategic Initiative status values are: Proposed, Planned, In Progress, On Hold, Completed, Cancelled.

Initiative execution relationship rules:

- Capability and Initiative are many-to-many within a Strategic Choice context.
- Agreement and Initiative are many-to-many within a Strategic Choice context.
- A Capability can only be linked to an Initiative if that Capability is already linked to the same Strategic Choice.
- An Agreement can only be linked to an Initiative if that Agreement belongs to the same Strategic Choice.

Capability linkage rule:

- Strategic Choice and Capability are many-to-many.
- One Strategic Choice may require many Capabilities.
- One Capability may support many Strategic Choices.
- Capability records are independent of Planning Cycle.

Strategy review rule:

- Strategy Review is a cycle-scoped governance checkpoint.
- One Planning Cycle may have many Strategy Reviews.
- A Strategy Review captures summary, recommendations, and a snapshot of linked Objectives, Initiatives, and Outcomes for that cycle.
- Strategy Review status values are: Draft, In Progress, Completed, Archived.

Initiative traceability rule:

- Strategy execution traceability extends to Initiative:
	Driver -> Strategic Question -> Strategic Objective -> Strategic Choice -> Initiative

## Integration boundaries

- Relationships define who participates.
- Strategic Groups define who collaborates.
- Planning Cycles define what strategy is being developed.

## Participation suggestion rule

Active Strategic Relationships influence planning participation suggestions when a Planning Cycle owner organization is selected.

Suggestions are optional:

- Relationships indicate potential participation.
- Planning Cycles decide actual participation.
- Participation is not automatically required or created.

## Boundary rule

Capabilities belong to strategy execution and are not modeled as properties of:

- Organizations
- Strategic Relationships
- Strategic Groups
