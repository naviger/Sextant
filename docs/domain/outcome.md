# Outcome

## Definition

An Outcome is the measured result produced by strategic execution.

## Role in strategy flow

Outcome is the result signal that shows whether an initiative delivered the expected business effect.

## Data model

Outcome fields:

- Id
- PlanningCycleId
- StrategicObjectiveId
- InitiativeId
- Name
- Description
- CreatedAt
- UpdatedAt

## Relationships

- Strategic Objective -> Outcome
- Initiative -> Outcome
- Outcome -> Metric

## Metric model

Metric fields:

- Id
- OutcomeId
- Name
- Description
- Unit
- CreatedAt
- UpdatedAt

Metric target fields:

- TargetValue
- TargetUnit
- TargetDate
- Notes

Metric actual fields:

- ActualValue
- ActualUnit
- MeasuredAt
- Notes

## Role in strategy flow

Outcomes are the terminal measurement point in the Planning Cycle flow.

They provide evidence of whether strategic objectives and initiatives produced the intended result.

Metric target and actual values allow users to compare expected versus delivered performance.

## Traceability

Driver -> Strategic Question -> Strategic Objective -> Strategic Choice -> Initiative -> Outcome -> Metric

## Related concepts

- [PlanningCycle](./planning-cycle.md)
- [Initiative](./initiative.md)
- [Objective](./objective.md)
- [Metric](./metric.md)
