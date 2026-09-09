# Strategic Objective

## Definition

A Strategic Objective is a measurable desired future state leadership wants to achieve in response to a Strategic Question.

Strategic Objectives are not initiatives.

Strategic Objectives are not projects.

Strategic Objectives are outcomes to be achieved, not work packages to be executed.

## Example

Question:

How can we reduce production costs?

Objective:

Reduce production costs by 10%.

---

Question:

How can we improve supply chain resilience?

Objective:

Reduce imported scrap dependency to 30%.

## Data model

StrategicObjective fields:

- Id
- PlanningCycleId
- StrategicQuestionId
- Title
- Description
- ObjectiveType
- Priority
- Status
- OwnerOrganizationId
- TargetDate
- CreatedAt
- UpdatedAt

## Objective Type

- Growth
- Operational Excellence
- Customer
- Financial
- Workforce
- Technology
- Sustainability
- Risk
- Regulatory

## Priority

- Low
- Medium
- High
- Critical

## Status

- Draft
- Proposed
- Approved
- Active
- Completed
- Archived

## Relationship rules

- One Strategic Question may have many Strategic Objectives.
- Every Strategic Objective must be linked to one Strategic Question.
- Strategic Objectives must not exist independently.
- One Strategic Objective may have many Strategic Choices.
- Every Strategic Choice must be linked to one Strategic Objective.

## Planning cycle scope

- Strategic Objectives are scoped to one Planning Cycle.
- Strategic Objective and Strategic Question must belong to the same Planning Cycle.

## Traceability

Strategic Objective traceability follows:

Driver -> Strategic Question -> Strategic Objective

## Related Concepts

- [Strategic Question](./strategic-question.md)
- [Driver](./driver.md)
- [Initiative](./initiative.md)
