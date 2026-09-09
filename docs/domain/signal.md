# Signal

## Definition

A signal is a piece of evidence or directional indicator that suggests a strategic trend, risk, opportunity, or performance condition.

## Business Purpose

Signals are the basis for strategic diagnosis. They provide the product with the raw sense data needed to assess current alignment, detect drift, and generate AI-supported recommendations.

## Relationships

- Signals are aggregated into position fixes and current assessments.
- Signals may influence bearing, drift, and recommendation logic.
- Different strategies or business units may produce different signals.
- Signals allow the platform to surface risks and opportunities.

## Source Code Evidence

- [.github/copilot-instructions.md](../../.github/copilot-instructions.md) lists “Signal” as a preferred domain vocabulary item.
- [app/src/pages/StrategyDashboard.tsx](../../app/src/pages/StrategyDashboard.tsx) includes “Priority Signals” and “Strategic currents.”
- [docs/design-language.md](../design-language.md) frames the platform as a navigation view that interprets conditions, currents, and alignment.

## Related Concepts

- [PositionFix](./position-fix.md)
- [Drift](./drift.md)
- [Bearing](./bearing.md)
- [RecommendationService](./recommendation-service.md)
