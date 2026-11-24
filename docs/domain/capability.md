# Capability

## Definition

A Capability is an ability the organization must possess to execute strategy.

Capabilities answer:

What must the organization become good at?

Capabilities are reusable strategic assets that bridge strategy and execution.

## Not a capability

A Capability is not:

- Organization Unit
- Department
- Team
- System
- Project

## Examples

- Supplier Management
- Production Planning
- Customer Analytics
- Talent Acquisition
- Digital Commerce
- Asset Maintenance

## Data model

Capability fields:

- Id
- Name
- Description
- Category
- Status
- OwnerOrganizationId
- StartDate
- EndDate
- CreatedAt
- UpdatedAt

StartDate and EndDate define the capability's planned roadmap window and are
independent of any Planning Cycle or Capability Assessment.
Both dates are optional. When both are present, EndDate must be on or after
StartDate. Omit a date from an update to preserve it, or send `null` to clear it.
The API treats timestamps without an offset as UTC when checking the date order.

CapabilityAssessment fields:

- Id
- CapabilityId
- PlanningCycleId
- CurrentMaturity
- TargetMaturity
- AssessmentNotes
- AssessmentDate
- OwnerOrganizationId

Capability definitions remain planning-cycle independent.

Capability assessments are planning-cycle scoped snapshots.

## Categories

- Commercial
- Operations
- Supply Chain
- Technology
- People
- Finance
- Innovation
- Risk
- Sustainability
- Other

## Status

- Draft
- Active
- Retired

## Maturity scale

- 1 Initial
- 2 Developing
- 3 Established
- 4 Managed
- 5 Optimized

## Relationship rules

- Strategic Choice and Capability are many-to-many.
- One Strategic Choice may require many Capabilities.
- One Capability may support many Strategic Choices.
- Capabilities are independent of Planning Cycles.
- One Capability may have multiple Capability Assessments across planning cycles.

## Role in strategy flow

Capabilities connect selected direction to execution readiness and reusable operating strength.

Capability Assessment compares current maturity to target maturity and exposes improvement gaps required to support strategy.

## Capability Roadmap

The Capability Roadmap is a graphical, timeline view of all capabilities plotted across their StartDate and EndDate.

Each roadmap item pairs the capability's planned schedule with its maturity gap (TargetMaturity minus CurrentMaturity) drawn from the latest Capability Assessment for that capability, if one exists.

A capability without any Capability Assessment defaults to a maturity gap of one (CurrentMaturity 1, TargetMaturity 2) so it still surfaces on the roadmap as needing attention.

The Capability Roadmap is exposed through `GET /api/v1/capabilities/roadmap` and rendered as a Gantt-style timeline in the Capabilities page, color-coded by gap severity (Low, Medium, High).

## Traceability

Driver -> Strategic Question -> Strategic Objective -> Strategic Choice -> Capability
Driver -> Strategic Question -> Strategic Objective -> Strategic Choice -> Capability -> CapabilityAssessment

## Related concepts

- [StrategicChoice](./strategic-choice.md)
- [StrategicAgreement](./strategic-agreement.md)
- [PlanningCycle](./planning-cycle.md)# Capability

## Definition

A Capability is what the organization must become good at in order to execute strategic choices.

## Architectural placement

Capability belongs in strategy execution scope.

Capability is not modeled in setup entities:

- Organization Setup
- Strategic Relationship Setup
- Strategic Participation Group Setup

## Role in strategy flow

Capability connects strategic choices to initiatives that deliver measurable outcomes.

## Related concepts

- [PlanningCycle](./planning-cycle.md)
- [StrategicChoice](./strategic-choice.md)
- [Initiative](./initiative.md)
- [Outcome](./outcome.md)
