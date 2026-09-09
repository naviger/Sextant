# PositionFixRecorded

## Definition

An event emitted when a position fix is captured for a strategy, business unit, or enterprise-wide view.

## Business Purpose

A position fix provides the current-state baseline for analysis. Recording it as an event allows the platform to track changes over time and to compare current reality against prior strategic states.

## Relationships

- Triggered by measurement or assessment of the current strategic position.
- Supplies context for [DriftDetected](./drift-detected.md) and [AlignmentUpdated](./alignment-updated.md).
- Is associated with [PositionFix](./position-fix.md).

## Source Code Evidence

- [app/src/pages/StrategyDashboard.tsx](../../app/src/pages/StrategyDashboard.tsx) includes a “Current Fix” panel, demonstrating the existence of a current-state strategic snapshot concept.
- The design language defines “Current Position Fix” as organizational reality.

## Related Concepts

- [PositionFix](./position-fix.md)
- [DriftDetected](./drift-detected.md)
- [AlignmentUpdated](./alignment-updated.md)
- [Signal](./signal.md)
