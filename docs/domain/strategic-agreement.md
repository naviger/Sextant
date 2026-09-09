# Strategic Agreement

## Definition

A Strategic Agreement is the negotiated commitment created from a Strategic Choice.

Strategic Relationships determine who participates in negotiation.

Strategic Agreements determine what participating organizations agreed to do.

## Data model

StrategicAgreement fields:

- Id
- PlanningCycleId
- StrategicChoiceId
- Title
- Description
- Status
- EffectiveDate
- OwnerOrganizationId
- CreatedAt
- UpdatedAt

## Status

- Draft
- Proposed
- Negotiating
- Approved
- Active
- Completed
- Cancelled

## Relationship rules

- One Strategic Choice may have many Strategic Agreements.
- Every Strategic Agreement must link to one Strategic Choice.
- Strategic Agreements must not exist independently.
- Strategic Agreement and Strategic Choice must belong to the same Planning Cycle.

## Role in strategy flow

Strategic Agreements convert selected direction into explicit commitment and become the handoff mechanism from strategy definition to execution.

## Traceability

Driver -> Strategic Question -> Strategic Objective -> Strategic Choice -> Strategic Agreement

## Related concepts

- [PlanningCycle](./planning-cycle.md)
- [StrategicChoice](./strategic-choice.md)
- [Objective](./objective.md)
- [StrategicQuestion](./strategic-question.md)
- [Driver](./driver.md)