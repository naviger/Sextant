# DriftDetectionService

## Definition

A service that compares the present strategic position with the desired trajectory and surfaces divergence as drift.

## Business Purpose

This service is central to the platform’s value proposition because strategic drift is a primary warning sign for organizational misalignment and decision risk.

## Relationships

- Uses [PositionFix](./position-fix.md), [Signal](./signal.md), and [Strategy](./strategy.md).
- Produces [DriftDetected](./drift-detected.md) events.
- Feeds into [RecommendationService](./recommendation-service.md).

## Source Code Evidence

- [.github/copilot-instructions.md](../../.github/copilot-instructions.md) specifies “Detect strategic drift.”
- [app/src/pages/StrategyDashboard.tsx](../../app/src/pages/StrategyDashboard.tsx) includes explicit “Alignment Drift Alerts.”
- [docs/design-language.md](../design-language.md) defines drift as misalignment.

## Related Concepts

- [Drift](./drift.md)
- [PositionFix](./position-fix.md)
- [Signal](./signal.md)
- [RecommendationService](./recommendation-service.md)
