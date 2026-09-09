# Strategy Review

## Definition

A Strategy Review is a cycle-scoped governance checkpoint used to assess strategic progress, summarize outcomes, and record recommendations for the current planning period.

## Role in strategy flow

Strategy Review sits after execution artifacts have been developed and measured. It creates a decision point for leadership to review progress, assess alignment, and decide the next course of action.

## Data model

Strategy Review fields:

- Id
- PlanningCycleId
- Date
- Status
- Summary
- Recommendations
- CreatedAt
- UpdatedAt

## Relationship model

- Planning Cycle -> Strategy Review
- Strategy Review -> Strategic Objective link
- Strategy Review -> Initiative link
- Strategy Review -> Outcome link

## Status values

- Draft
- In Progress
- Completed
- Archived

## Constraints

- Strategy Review is scoped to a single Planning Cycle.
- Review can capture the cycle's active objectives, initiatives, and outcomes.
- Linked artifacts must belong to the same Planning Cycle as the review.

## Related concepts

- [PlanningCycle](./planning-cycle.md)
- [Objective](./objective.md)
- [Initiative](./initiative.md)
- [Outcome](./outcome.md)
- [Metric](./metric.md)
