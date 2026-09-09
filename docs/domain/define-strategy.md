# DefineStrategy

## Definition

A command to define or update a strategy with intentional business direction, including the strategic purpose, vision, and scope.

## Business Purpose

This command is foundational to the platform’s use case: organizations must be able to articulate enterprise and business-unit strategy with clarity before measuring alignment and drift.

## Relationships

- Creates or updates a [Strategy](./strategy.md).
- May establish or revise a [NorthStar](./north-star.md).
- May influence one or more [Objective](./objective.md) values and [Initiative](./initiative.md) mappings.
- Produces a [StrategyDefined](./strategy-defined.md) event.

## Source Code Evidence

- The repository’s stated product purpose includes “Define enterprise strategy” and “Define business-unit strategy.”
- [docs/design-language.md](../design-language.md) frames strategy as enterprise direction and strategic navigation.
- The dashboard and domain vocabulary indicate the presence of strategy-level planning and review workflows, even though the concrete command object does not yet exist in code.

## Related Concepts

- [Strategy](./strategy.md)
- [NorthStar](./north-star.md)
- [StrategyDefined](./strategy-defined.md)
- [Objective](./objective.md)
