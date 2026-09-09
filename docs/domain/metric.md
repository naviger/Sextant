# Metric

## Definition

A Metric is a measurable indicator used to track progress toward an Outcome.

## Business Purpose

Metrics let strategy teams compare what was expected to happen with what actually happened.

## Data model

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

## Relationships

- Outcome -> Metric
- One Outcome may have many Metrics
- One Metric may have one target and many actual observations over time

## Traceability

Driver -> Strategic Question -> Strategic Objective -> Strategic Choice -> Initiative -> Outcome -> Metric

## Related Concepts

- [Outcome](./outcome.md)
- [Initiative](./initiative.md)
- [Objective](./objective.md)
