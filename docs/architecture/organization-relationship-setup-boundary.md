# Organization and Relationship Setup Boundary

## Purpose

Define the setup metamodel boundary for Sextant administration.

Setup configures participation structure only. It does not define strategy content.

## Separation of concerns

### 1. Organization Structure

Organization hierarchy captures:
- Reporting structure
- Accountability
- Ownership

Organization hierarchy does not define strategic alignment.

### 2. Strategic Relationships

Strategic relationships are first-class entities between organization nodes.

Relationships can:
- Follow hierarchy
- Skip hierarchy levels
- Connect peers
- Connect functions
- Connect regions
- Connect centers of excellence

Relationships define participation and influence. They do not define strategy content.

### 3. Strategy Planning (future lifecycle)

Planning lifecycle concepts are intentionally out of scope for setup and will be introduced later:
- Drivers
- Objectives
- Strategic Choices
- Capabilities
- Initiatives
- Outcomes
- Planning Cycles

### 4. Planning Cycle Architecture (future)

Planning Cycle defines the primary strategy-development workspace for a bounded period.

Planning Cycle fields:
- Id
- Name
- Description
- OwnerOrganizationId
- Status: Draft, Planning, Negotiation, Approved, Executing, Completed, Archived
- Start Date
- End Date
- CreatedAt
- UpdatedAt

Planning Cycle is a container and does not contain strategy itself.

Planning Cycle owns future artifacts:
- Strategic Themes
- Drivers
- Strategic Questions
- Objectives
- Choices
- Agreements
- Initiatives
- Outcomes
- Strategy Reviews

Implementation note:
- Drivers are the first strategy artifact introduced inside Planning Cycle.
- Strategic Questions are the second strategy artifact and provide the bridge from Drivers to future Objectives.
- Strategic Objectives are implemented under Strategic Questions and cannot exist without question linkage.

Future relationship directions (not implemented yet):
- PlanningCycle -> Drivers
- PlanningCycle -> Questions
- PlanningCycle -> Objectives

Within a Planning Cycle, future strategy flow is:

Driver -> Strategic Question -> Objective -> Strategic Choice -> Capability -> Initiative -> Outcome -> Metric

Strategic Question relationship rule:
- Many Drivers can link to one Strategic Question.
- Driver links are constrained to the same Planning Cycle as the Strategic Question.

Strategic Objective relationship rule:
- One Strategic Question may have many Strategic Objectives.
- Every Strategic Objective must link to one Strategic Question.
- Strategic Objective and Strategic Question must belong to the same Planning Cycle.

Strategic Theme relationship rule:
- Strategic Theme groups Drivers, Strategic Questions, Strategic Objectives, and Strategic Choices for executive strategy navigation.
- Theme assignment is optional per artifact and constrained to the same Planning Cycle.

Strategic Choice relationship rule:
- One Strategic Objective may have many Strategic Choices.
- Every Strategic Choice must link to one Strategic Objective.
- Strategic Choice and Strategic Objective must belong to the same Planning Cycle.
- Strategic Choices may compete and may be mutually exclusive.

Strategic Agreement relationship rule:
- One Strategic Choice may have many Strategic Agreements.
- Every Strategic Agreement must link to one Strategic Choice.
- Strategic Agreement and Strategic Choice must belong to the same Planning Cycle.
- Strategic Relationships determine who participates in negotiation.
- Strategic Agreements determine what participating organizations agreed to do.

Capability relationship rule:
- Strategic Choice and Capability are many-to-many.
- One Strategic Choice may require multiple Capabilities.
- One Capability may support multiple Strategic Choices.
- Capability records are independent of Planning Cycle.
- Capability Assessment records are planning-cycle scoped and evaluate Current vs Target maturity for a Capability.

Traceability:
- Strategic Theme -> Driver
- Strategic Theme -> Strategic Question
- Strategic Theme -> Strategic Objective
- Strategic Theme -> Strategic Choice
- Driver -> Strategic Question -> Strategic Objective
- Driver -> Strategic Question -> Strategic Objective -> Strategic Choice
- Driver -> Strategic Question -> Strategic Objective -> Strategic Choice -> Strategic Agreement
- Driver -> Strategic Question -> Strategic Objective -> Strategic Choice -> Capability
- Driver -> Strategic Question -> Strategic Objective -> Strategic Choice -> Capability -> CapabilityAssessment
- Driver -> Strategic Question -> Strategic Objective -> Strategic Choice -> Initiative
- Driver -> Strategic Question -> Strategic Objective -> Strategic Choice -> Initiative -> Outcome
- Driver -> Strategic Question -> Strategic Objective -> Strategic Choice -> Initiative -> Outcome -> Metric

Definitions:
- Driver: External force creating need for change.
- Strategic Theme: Executive grouping lens across related strategy artifacts.
- Objective: Desired result.
- Strategic Choice: Decision made to achieve the objective.
- Strategic Agreement: Negotiated commitment created from a strategic choice.
- Capability: Ability the organization must possess to execute strategy.
- Capability Assessment: Periodic evaluation of capability maturity and maturity gap.
- Initiative: Work being executed.
- Outcome: Measured result.

Initiative relationship rules:
- Strategic Initiative is created from a Strategic Choice context.
- One Strategic Choice may have many Strategic Initiatives.
- Every Strategic Initiative must link to at least one Strategic Choice.
- Strategic Initiative status values: Proposed, Planned, In Progress, On Hold, Completed, Cancelled.
- Capability links to Initiative only when Capability is already linked to the same Strategic Choice.
- Strategic Agreement links to Initiative only when Agreement belongs to the same Strategic Choice.

Outcome and metric relationship rules:
- One Strategic Objective may have many Outcomes.
- One Strategic Initiative may have many Outcomes.
- One Outcome may have many Metrics.
- One Metric records expected target values and observed actual values over time.

Strategy review relationship rules:
- One Planning Cycle may have many Strategy Reviews.
- A Strategy Review records evaluation summary and recommendations for the cycle.
- Strategy Review can snapshot linked Objectives, Initiatives, and Outcomes from the same Planning Cycle.
- Strategy Review status values: Draft, In Progress, Completed, Archived.

Architectural rule:
- Capabilities belong in strategy execution.
- Capabilities do not belong in organization setup, strategic relationship setup, or strategic group setup.

## Setup questions answered by this metamodel

Organization setup answers:
- Who exists?
- Are they strategic or operational?
- How are they funded?
- What investment authority do they have?

Relationship setup answers:
- Who participates with whom?
- What role do they play?
- How often do they engage?

Strategic group setup answers:
- Who collaborates in cross-organizational forums?

Planning cycle model (future) answers:
- What strategy is being developed in this period?

Planning cycle creation behavior:
- Selecting the owner organization can use active strategic relationships to suggest potential participants.
- Suggestions are optional and may be accepted, rejected, or modified.
- Strategic relationships do not automatically create planning cycle participation.

## UX boundary

The administration editor is named Node Editor with two tabs:
- Org Details
- Strategic Relationships

Organization hierarchy uses a reusable Polaris Tree View component with:
- Left disclosure triangle (right when collapsed, down when expanded)
- Optional node icon
- Node title and subtitle
- Right-side node control area
- Container controls for Expand All, Collapse All, and Export structure

No strategy-definition content should appear in setup workflows.
