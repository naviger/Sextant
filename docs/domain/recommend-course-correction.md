# RecommendCourseCorrection

## Definition

A command to generate a recommended action or direction for reducing drift or improving strategic alignment.

## Business Purpose

This is the operational decision-support action that converts strategic observation into guidance. The system can recommend a course correction based on current signals and emerging drift.

## Relationships

- May be triggered by [DetectDrift](./detect-drift.md).
- Uses strategic context from [Strategy](./strategy.md), [Course](./course.md), and [Bearing](./bearing.md).
- May lead to revised course or initiative prioritization.

## Source Code Evidence

- [.github/copilot-instructions.md](../../.github/copilot-instructions.md) lists “Generate AI-assisted strategic recommendations” as a product capability.
- [docs/design-language.md](../design-language.md) names “Bearings” as AI guidance and “Courses” as execution paths.
- [app/src/pages/StrategyDashboard.tsx](../../app/src/pages/StrategyDashboard.tsx) contains strategic summary elements that imply recommendation and analysis support.

## Related Concepts

- [Bearing](./bearing.md)
- [Course](./course.md)
- [Signal](./signal.md)
- [Drift](./drift.md)
- [RecommendationService](./recommendation-service.md)
