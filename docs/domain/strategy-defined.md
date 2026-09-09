# StrategyDefined

## Definition

An event emitted when a strategy is created or updated with sufficient definition to establish its direction and intended outcomes.

## Business Purpose

This event marks the transition from raw strategic intent to a formalized strategic entity that can be modeled, compared, and evaluated.

## Relationships

- Triggered by [DefineStrategy](./define-strategy.md).
- Leads to downstream assessment of [Alignment](./alignment.md) and [Drift](./drift.md).
- May influence [Objective](./objective.md) creation and [Initiative](./initiative.md) planning.

## Source Code Evidence

- The repository does not yet implement a formal event store, but the domain vocabulary and expected graph model strongly imply strategic lifecycle events.
- Product purpose and design language reinforce strategic definition as a first-class business activity.

## Related Concepts

- [DefineStrategy](./define-strategy.md)
- [Strategy](./strategy.md)
- [Objective](./objective.md)
- [Alignment](./alignment.md)
