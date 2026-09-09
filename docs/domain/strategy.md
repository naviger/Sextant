# Strategy

## Definition

A strategy is the central enterprise intent that defines where an organization is trying to go. This is the core business concept in the product purpose and design language.

## Business Purpose

The platform exists to help organizations define enterprise and business-unit strategies, assess alignment, and detect drift. A strategy gives the organization a common direction and a coherent basis for evaluating execution and alignment.

## Relationships

- A strategy may be decomposed into objectives and initiatives.
- A strategy may align with or be compared against business-unit strategies.
- A strategy is evaluated according to its current position, drift, and confidence.
- A strategy may produce signals and recommendations.

## Source Code Evidence

- [.github/copilot-instructions.md](../../.github/copilot-instructions.md) defines the product as a strategy navigation platform and lists strategic concepts including North Star, Bearing, Course, Drift, Current, Signal, Position Fix, and Fleet.
- [docs/design-language.md](../design-language.md) maps navigation concepts to strategy: North Star = enterprise vision, Bearings = AI guidance, Courses = execution paths, Drift = misalignment.
- [app/src/pages/StrategyDashboard.tsx](../../app/src/pages/StrategyDashboard.tsx) presents a dashboard titled “Strategic currents at a glance” with sections for “North Star Confidence,” “Alignment Drift Alerts,” and “Priority Signals.”

## Related Concepts

- [NorthStar](./north-star.md)
- [Objective](./objective.md)
- [Initiative](./initiative.md)
- [BusinessUnitStrategy](./business-unit-strategy.md)
- [Alignment](./alignment.md)
- [Drift](./drift.md)
