# RecommendationService

## Definition

A service that provides analytic or AI-assisted recommendations for what to do next based on current strategy state, drift, signals, and alignment data.

## Business Purpose

This is the decision-support layer of the product. It translates situational awareness into proposed actions, such as course correction or strategic adjustments.

## Relationships

- Consumes [Signal](./signal.md), [Bearing](./bearing.md), [Drift](./drift.md), and [Alignment](./alignment.md).
- May be triggered by [RecommendCourseCorrection](./recommend-course-correction.md).
- Produces strategic guidance used in the UI and executive decision-making.

## Source Code Evidence

- [.github/copilot-instructions.md](../../.github/copilot-instructions.md) explicitly calls for “AI-assisted strategic recommendations.”
- [docs/design-language.md](../design-language.md) frames “Bearings” as AI guidance and “Courses” as execution paths.
- [api/app/services/ollama_client.py](../../api/app/services/ollama_client.py) implements a client for external LLM access, which is the technical mechanism that would support recommendation generation.

## Related Concepts

- [Bearing](./bearing.md)
- [Course](./course.md)
- [Signal](./signal.md)
- [Drift](./drift.md)
- [StrategyNavigationService](./strategy-navigation-service.md)
