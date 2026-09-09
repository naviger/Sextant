# BusinessUnitStrategy

## Definition

A business-unit strategy is a localized strategic plan owned by a business unit or operating division. It is intended to align with the enterprise strategy while operating under its own objectives and course constraints.

## Business Purpose

This concept is essential for enterprise alignment: the platform is meant to compare and reconcile business-unit strategies against an enterprise-level direction and reveal drift, gaps, or risks.

## Relationships

- A business-unit strategy aligns with the enterprise strategy.
- It may include objectives, initiatives, and execution paths.
- It can be evaluated against the organization’s current position and drift signals.
- It is part of a fleet of strategies working toward the same strategic destination.

## Source Code Evidence

- [.github/copilot-instructions.md](../../.github/copilot-instructions.md) states: “Define enterprise strategy”, “Define business-unit strategy”, and “Assess alignment.”
- [docs/design-language.md](../design-language.md) describes the platform as helping leaders maintain alignment across the enterprise and fleet.
- [app/src/pages/StrategyDashboard.tsx](../../app/src/pages/StrategyDashboard.tsx) includes “Business Units” and “Alignment Map”, implying multiple strategic actors working within a shared navigation framework.

## Related Concepts

- [Strategy](./strategy.md)
- [Alignment](./alignment.md)
- [Objective](./objective.md)
- [Initiative](./initiative.md)
- [FleetAlignmentAggregate](./fleet-alignment-aggregate.md)
