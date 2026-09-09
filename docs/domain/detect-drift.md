# DetectDrift

## Definition

A command to identify the difference between the intended course and the current observed strategic position.

## Business Purpose

The platform exists to surface drift and suggest corrective actions. This command directly supports the product’s strategic monitoring function.

## Relationships

- Compares [PositionFix](./position-fix.md) to [NorthStar](./north-star.md) or expected course.
- Uses [Signal](./signal.md) inputs, goal/outcome health, or alignment variance.
- Produces a [DriftDetected](./drift-detected.md) event.
- May inform [RecommendCourseCorrection](./recommend-course-correction.md).

## Source Code Evidence

- [.github/copilot-instructions.md](../../.github/copilot-instructions.md) explicitly identifies “Detect strategic drift.”
- [docs/design-language.md](../design-language.md) maps “Drift” to “Misalignment.”
- [app/src/pages/StrategyDashboard.tsx](../../app/src/pages/StrategyDashboard.tsx) includes “Alignment Drift Alerts.”

## Related Concepts

- [Drift](./drift.md)
- [PositionFix](./position-fix.md)
- [NorthStar](./north-star.md)
- [DriftDetected](./drift-detected.md)
- [RecommendCourseCorrection](./recommend-course-correction.md)
