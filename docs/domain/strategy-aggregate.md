# StrategyAggregate

## Definition

A strategy aggregate is the unified view of a strategy, including its North Star, objectives, initiatives, and alignment relationships. It serves as the business unit of strategic coherence.

## Business Purpose

This aggregate creates a single strategic object that can be reasoned about and manipulated as a whole. It supports assessment, comparison, updates, and recommendations across the strategy lifecycle.

## Relationships

- Contains one or more objectives.
- Is related to one or more initiatives supporting the strategic outcomes.
- Represents the enterprise or business-level strategic intent.
- May align with other strategy aggregates and be evaluated for drift.

## Source Code Evidence

- [.github/copilot-instructions.md](../../.github/copilot-instructions.md) defines the strategic domain model and emphasizes graph relationships over foreign keys.
- [docs/design-language.md](../design-language.md) defines a navigation-first strategy model: North Star, objectives, courses, and drift.
- The frontend dashboard in [app/src/pages/StrategyDashboard.tsx](../../app/src/pages/StrategyDashboard.tsx) presents strategy-level summaries like confidence and drift metrics.

## Related Concepts

- [Strategy](./strategy.md)
- [Objective](./objective.md)
- [Initiative](./initiative.md)
- [Alignment](./alignment.md)
- [NorthStar](./north-star.md)
