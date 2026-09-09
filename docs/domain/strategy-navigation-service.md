# StrategyNavigationService

## Definition

A service responsible for understanding and navigating the organization’s strategy landscape across direction, current state, and tactical execution.

## Business Purpose

This service is the domain-level orchestrator for decision-support features such as direction-setting, signal interpretation, and strategic monitoring.

## Relationships

- Coordinates strategy, business-unit strategy, and objective views.
- Interprets [Signal](./signal.md), [Bearing](./bearing.md), and [PositionFix](./position-fix.md) data.
- Supports [DefineStrategy](./define-strategy.md) and [AssessAlignment](./assess-alignment.md).

## Source Code Evidence

- The repository describes a navigation-driven strategy platform in [.github/copilot-instructions.md](../../.github/copilot-instructions.md).
- [docs/design-language.md](../design-language.md) frames the product as a navigation and strategy charting tool rather than a generic PM tool.
- [app/src/pages/StrategyDashboard.tsx](../../app/src/pages/StrategyDashboard.tsx) presents current strategic state, drift, and confidence as a single navigation service layer.

## Related Concepts

- [Strategy](./strategy.md)
- [PositionFix](./position-fix.md)
- [Bearing](./bearing.md)
- [Alignment](./alignment.md)
- [RecommendationService](./recommendation-service.md)
