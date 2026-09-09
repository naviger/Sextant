# DriftDetected

## Definition

An event emitted when the system recognizes that the current strategic state has deviated from the intended course or target state.

## Business Purpose

This event formalizes the detection of strategic drift, which is one of the platform’s primary value propositions.

## Relationships

- Triggered by [DetectDrift](./detect-drift.md).
- May update [Drift](./drift.md) state and contribute to course correction recommendations.
- May impact [Alignment](./alignment.md) outcomes.

## Source Code Evidence

- [.github/copilot-instructions.md](../../.github/copilot-instructions.md) identifies drift detection as a core capability.
- [app/src/pages/StrategyDashboard.tsx](../../app/src/pages/StrategyDashboard.tsx) displays “Alignment Drift Alerts,” indicating that drift is surfaced as an explicit event-like condition.

## Related Concepts

- [Drift](./drift.md)
- [DetectDrift](./detect-drift.md)
- [PositionFix](./position-fix.md)
- [RecommendCourseCorrection](./recommend-course-correction.md)
