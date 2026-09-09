# Initiative

## Definition

An initiative is a concrete program, work package, or action that executes a strategic choice.

Strategic Initiatives are the first execution artifact in the planning lifecycle.

## Business Purpose

Initiatives connect strategic intent to execution. They make a chosen course operational and provide visible progress signals toward outcomes.

They are used to verify that execution remains anchored to approved strategy decisions.

## Data model

Initiative fields:

- Id
- Name
- Description
- Status
- OwnerOrganizationId
- StartDate
- EndDate
- Budget

Implementation metadata:

- PlanningCycleId
- CreatedAt
- UpdatedAt

## Status values

- Proposed
- Planned
- In Progress
- On Hold
- Completed
- Cancelled

## Relationships

- StrategicChoice -> Initiative
- Capability -> Initiative
- Agreement -> Initiative
- Initiative -> Outcome

Execution rule:

- Every Initiative must link to at least one Strategic Choice.

Scope rule:

- Initiative, Strategic Choice, linked Capabilities, and linked Agreements must remain within the same Planning Cycle context.

## Traceability

Initiatives extend strategy traceability into execution:

Driver -> Strategic Question -> Strategic Objective -> Strategic Choice -> Initiative
Driver -> Strategic Question -> Strategic Objective -> Strategic Choice -> Initiative -> Outcome

## Source Code Evidence

- [api/app/schemas.py](../../api/app/schemas.py) defines Initiative create/update/response contracts including Status, dates, budget, and owner organization.
- [api/app/routes/administration.py](../../api/app/routes/administration.py) implements choice-scoped Initiative CRUD and Initiative link endpoints for Capabilities and Agreements.
- [api/tests/test_administration.py](../../api/tests/test_administration.py) verifies initiative lifecycle, status validation, and same-choice link constraints.

## Related Concepts

- [Objective](./objective.md)
- [StrategicChoice](./strategic-choice.md)
- [StrategicAgreement](./strategic-agreement.md)
- [Capability](./capability.md)
- [Strategy](./strategy.md)
- [Course](./course.md)
- [Signal](./signal.md)
- [PositionFix](./position-fix.md)
