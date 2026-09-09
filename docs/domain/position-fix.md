# PositionFix

## Definition

A position fix is a snapshot of the organization’s current strategic state relative to the North Star and intended course. It is a measurement of current reality.

## Business Purpose

The system exists to answer: “Where are we now?” A position fix aggregates current conditions, relationship health, and directional confidence into a single situational view.

## Relationships

- A position fix is measured against the North Star and current strategy.
- It informs drift detection and alignment assessment.
- It may be recorded for a business unit, strategy, or cross-enterprise view.
- It combines multiple signals into a meaningful current-state picture.

## Source Code Evidence

- [.github/copilot-instructions.md](../../.github/copilot-instructions.md) lists “Position Fix” as a preferred domain term.
- [docs/design-language.md](../design-language.md) maps “Current Position Fix” to “Organizational Reality.”
- [app/src/pages/StrategyDashboard.tsx](../../app/src/pages/StrategyDashboard.tsx) includes a “Current Fix” summary panel with “Confidence” and “Drift Alerts.”

## Related Concepts

- [NorthStar](./north-star.md)
- [Course](./course.md)
- [Signal](./signal.md)
- [Drift](./drift.md)
- [PositionFixRecorded](./position-fix-recorded.md)
