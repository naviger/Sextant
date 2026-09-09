# FleetAlignmentAggregate

## Definition

The fleet alignment aggregate represents the enterprise-wide perspective of how multiple strategies and business units are collectively aligned across the organization.

## Business Purpose

This aggregate answers the question: “How is the entire fleet moving relative to the North Star?” It allows the product to understand systemic alignment, fleet-level drift, and priority signals across organizational units.

## Relationships

- Consists of multiple business-unit strategies and enterprise strategy views.
- Aggregates alignment across a set of strategies.
- Combines position fixes and signals into fleet-level insight.
- Supports executive dashboards and enterprise drift assessment.

## Source Code Evidence

- [.github/copilot-instructions.md](../../.github/copilot-instructions.md) defines “Fleet” as a preferred domain term.
- [docs/design-language.md](../design-language.md) uses the notion of a navigation bridge and a fleet of strategic actors.
- [app/src/pages/StrategyDashboard.tsx](../../app/src/pages/StrategyDashboard.tsx) presents aggregate views such as “Alignment Map,” “Business Units,” and “Strategic Currents.”

## Related Concepts

- [BusinessUnitStrategy](./business-unit-strategy.md)
- [StrategyAggregate](./strategy-aggregate.md)
- [Alignment](./alignment.md)
- [PositionFix](./position-fix.md)
- [Drift](./drift.md)
