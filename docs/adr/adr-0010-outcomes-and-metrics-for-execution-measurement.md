# ADR-0010: Outcomes and Metrics for Execution Measurement

## Status

Proposed

## Context

Strategic Initiatives execute strategic choices, but the product also needs a measurable way to confirm whether execution delivered the expected result.

The planning lifecycle therefore requires a terminal result artifact and a measurement model beneath it.

## Decision

Introduce:

- Outcome as the measurable result of execution
- Metric as the tracked indicator for an Outcome
- MetricTarget as the expected value for a Metric
- MetricActual as observed performance for a Metric

Relationship rules:

- Strategic Objective -> Outcome
- Initiative -> Outcome
- Outcome -> Metric

Measurement rules:

- Each Outcome may have many Metrics
- Each Metric may have one target and many actual observations over time

Traceability extends to:

Driver -> Strategic Question -> Strategic Objective -> Strategic Choice -> Initiative -> Outcome -> Metric

## Consequences

This gives strategy users a clear expected-vs-actual model for checking whether execution delivered the intended result.

The data model remains aligned to planning-cycle scope while keeping execution measurement separate from strategy definition.
