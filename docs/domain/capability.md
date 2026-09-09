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
- CreatedAt
- UpdatedAt

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
