# AlignmentUpdated

## Definition

An event that indicates alignment between strategies, objective sets, or business units has been reassessed and changed.

## Business Purpose

This event keeps the platform synchronized with changes in strategy and organizational alignment. It is the canonical representation of strategy state transitions.

## Relationships

- Triggered by [AssessAlignment](./assess-alignment.md).
- Refers to [Alignment](./alignment.md), [BusinessUnitStrategy](./business-unit-strategy.md), and [Strategy](./strategy.md).
- May lead to altered strategic recommendations or additional signals.

## Source Code Evidence

- [.github/copilot-instructions.md](../../.github/copilot-instructions.md) names “Assess alignment” as a first-class capability.
- [docs/design-language.md](../design-language.md) focuses on alignment visualization and enterprise coherence.
- [app/src/pages/StrategyDashboard.tsx](../../app/src/pages/StrategyDashboard.tsx) visualizes alignment data in the dashboard.

## Related Concepts

- [Alignment](./alignment.md)
- [AssessAlignment](./assess-alignment.md)
- [Strategy](./strategy.md)
- [BusinessUnitStrategy](./business-unit-strategy.md)
