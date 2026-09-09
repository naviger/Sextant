# Alignment

## Definition

Alignment is the degree to which strategies, objectives, and business-unit actions converge on the same direction and intent. It is a relationship between strategic elements rather than a single entity.

## Business Purpose

Alignment is the product’s core value proposition. The platform exists to help organizations assess alignment, surface mismatches, and maintain coherence across the enterprise.

## Relationships

- A business-unit strategy aligns to the enterprise strategy.
- Objectives and initiatives can be aligned with each other.
- Alignment is evaluated through comparison to the current position fix and strategic drift.
- It is the basis for recommending changes to course.

## Source Code Evidence

- [.github/copilot-instructions.md](../../.github/copilot-instructions.md) explicitly names “Assess alignment” as a product capability.
- [docs/design-language.md](../design-language.md) notes that the product is oriented around “Alignment Visualization.”
- [app/src/pages/StrategyDashboard.tsx](../../app/src/pages/StrategyDashboard.tsx) includes an “Alignment Map” and “North Star alignment overview.”
- [.github/copilot-instructions.md](../../.github/copilot-instructions.md) also states that ArangoDB should model relationships like `EnterpriseStrategy → aligns_to → BusinessUnitStrategy`.

## Related Concepts

- [Strategy](./strategy.md)
- [BusinessUnitStrategy](./business-unit-strategy.md)
- [Objective](./objective.md)
- [Initiative](./initiative.md)
- [Drift](./drift.md)
