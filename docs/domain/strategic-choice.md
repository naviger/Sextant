# Strategic Choice

## Definition

A Strategic Choice is the strategic option leadership selects, evaluates, and compares to achieve a Strategic Objective.

Strategic Choices are the heart of strategy.

Objectives describe what should be achieved.

Choices describe how it can be achieved.

Without choices there is no strategy.

## Example

Objective:

Reduce production costs.

Choices:

- Modernize existing mills.
- Build new mill.
- Increase automation.
- Acquire competitor.

## Data model

StrategicChoice fields:

- Id
- PlanningCycleId
- StrategicObjectiveId
- Title
- Description
- ChoiceType
- Status
- Recommendation
- OwnerOrganizationId
- CreatedAt
- UpdatedAt

## Choice Types

- Investment
- Operating Model
- Capability
- Market
- Product
- Technology
- People
- Partnership
- Acquisition
- Other

## Status

- Draft
- Under Evaluation
- Recommended
- Approved
- Rejected
- Archived

## Recommendation

- No Recommendation
- Recommended
- Not Recommended

## Relationship rules

- One Strategic Objective may have many Strategic Choices.
- Every Strategic Choice must link to one Strategic Objective.
- Strategic Choices must not exist independently.
- Strategic Choices may compete against each other.
- Strategic Choices may be mutually exclusive.

## Role in strategy flow

Strategic Choice translates intent into directional commitments and drives capability development priorities.

Strategic Agreement is the next artifact that captures negotiated commitment from selected choices.

## Planning cycle scope

- Strategic Choices are scoped to one Planning Cycle.
- Strategic Choice and Strategic Objective must belong to the same Planning Cycle.

## Traceability

Driver -> Strategic Question -> Strategic Objective -> Strategic Choice
Driver -> Strategic Question -> Strategic Objective -> Strategic Choice -> Strategic Agreement

## Related concepts

- [PlanningCycle](./planning-cycle.md)
- [Objective](./objective.md)
- [StrategicQuestion](./strategic-question.md)
- [Driver](./driver.md)
- [Capability](./capability.md)
- [StrategicAgreement](./strategic-agreement.md)
