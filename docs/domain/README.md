# Domain Model

This domain model is extracted from the repository’s product purpose, design language, and runtime code. It reflects the business semantics of a strategy-navigation platform, while recognizing that the current codebase mainly implements identity, API, and infrastructure scaffolding; the strategic concepts are expressed in domain vocabulary, UI labels, and product intent rather than a fully implemented persistent domain model.

## Domain categories

### Entities
- [User](./user.md)
- [OrganizationSetup](./organization-setup.md)
- [StrategicRelationshipSetup](./strategic-relationship-setup.md)
- [StrategicParticipationGroupSetup](./strategic-participation-group-setup.md)
- [PlanningCycle](./planning-cycle.md)
- [Driver](./driver.md)
- [StrategicQuestion](./strategic-question.md)
- [Strategy](./strategy.md)
- [BusinessUnitStrategy](./business-unit-strategy.md)
- [Objective](./objective.md)
- [StrategicChoice](./strategic-choice.md)
- [Capability](./capability.md)
- [Initiative](./initiative.md)
- [Outcome](./outcome.md)
- [Metric](./metric.md)
- [StrategyReview](./strategy-review.md)
- [Alignment](./alignment.md)

### Aggregates
- [StrategyAggregate](./strategy-aggregate.md)
- [FleetAlignmentAggregate](./fleet-alignment-aggregate.md)

### Value Objects
- [NorthStar](./north-star.md)
- [Bearing](./bearing.md)
- [Course](./course.md)
- [Signal](./signal.md)
- [PositionFix](./position-fix.md)
- [Drift](./drift.md)

### Commands
- [DefineStrategy](./define-strategy.md)
- [AssessAlignment](./assess-alignment.md)
- [DetectDrift](./detect-drift.md)
- [RecommendCourseCorrection](./recommend-course-correction.md)

### Events
- [StrategyDefined](./strategy-defined.md)
- [PositionFixRecorded](./position-fix-recorded.md)
- [DriftDetected](./drift-detected.md)
- [AlignmentUpdated](./alignment-updated.md)

### Services
- [StrategyNavigationService](./strategy-navigation-service.md)
- [AlignmentAssessmentService](./alignment-assessment-service.md)
- [DriftDetectionService](./drift-detection-service.md)
- [RecommendationService](./recommendation-service.md)

## Repository evidence base

- Product purpose and domain vocabulary are defined in [.github/copilot-instructions.md](../../.github/copilot-instructions.md).
- The strategic metaphor and key domain language are defined in [docs/design-language.md](../design-language.md).
- The user identity and access model is implemented in [api/app/core/security.py](../../api/app/core/security.py) and [api/app/routes/users.py](../../api/app/routes/users.py).
- The dashboard uses strategic navigation language in [app/src/pages/StrategyDashboard.tsx](../../app/src/pages/StrategyDashboard.tsx).
- The application is framed around enterprise strategy navigation in [README.md](../../README.md).
