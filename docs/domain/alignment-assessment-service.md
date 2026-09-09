# AlignmentAssessmentService

## Definition

A service that evaluates how aligned strategies, objectives, and business units are with the enterprise direction.

## Business Purpose

This service operationalizes the product’s alignment capability by comparing current state across organizational units and highlighting where strategic coherence is weak or strong.

## Relationships

- Consumes [PositionFix](./position-fix.md), [Signal](./signal.md), and [Alignment](./alignment.md) states.
- May produce an [AlignmentUpdated](./alignment-updated.md) event.
- Uses [BusinessUnitStrategy](./business-unit-strategy.md) and [Strategy](./strategy.md) relationships.

## Source Code Evidence

- [.github/copilot-instructions.md](../../.github/copilot-instructions.md) explicitly names “Assess alignment.”
- [docs/design-language.md](../design-language.md) emphasizes alignment visibility, which implies a service-level assessment concept.
- [app/src/pages/StrategyDashboard.tsx](../../app/src/pages/StrategyDashboard.tsx) shows aggregate alignment metrics and business-unit comparisons.

## Related Concepts

- [Alignment](./alignment.md)
- [StrategyNavigationService](./strategy-navigation-service.md)
- [PositionFix](./position-fix.md)
- [FleetAlignmentAggregate](./fleet-alignment-aggregate.md)
