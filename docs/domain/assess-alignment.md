# AssessAlignment

## Definition

A command to evaluate the degree to which different strategies or strategic elements are aligned with each other and with the enterprise direction.

## Business Purpose

This command underpins the platform’s core value: comparing current strategic states to determine coherence, governance, and risk.

## Relationships

- Reads or computes information from multiple [Strategy](./strategy.md) and [BusinessUnitStrategy](./business-unit-strategy.md) records.
- Uses [PositionFix](./position-fix.md) and [Signal](./signal.md) inputs.
- Produces an [AlignmentUpdated](./alignment-updated.md) event or updated alignment result.

## Source Code Evidence

- [.github/copilot-instructions.md](../../.github/copilot-instructions.md) explicitly calls out “Assess alignment.”
- [docs/design-language.md](../design-language.md) emphasizes alignment visibility and visualization.
- [app/src/pages/StrategyDashboard.tsx](../../app/src/pages/StrategyDashboard.tsx) contains a dashboard intended to show alignment and confidence at the enterprise level.

## Related Concepts

- [Alignment](./alignment.md)
- [PositionFix](./position-fix.md)
- [Signal](./signal.md)
- [BusinessUnitStrategy](./business-unit-strategy.md)
- [AlignmentUpdated](./alignment-updated.md)
