# Strategic Question

## Definition

A Strategic Question is a key question that leadership must answer in response to one or more Drivers.

Strategic Questions belong to a Planning Cycle.

Strategic Questions are the bridge between Drivers and Objectives.

Without Strategic Questions, Objectives become disconnected from current uncertainty and external signals.

## Examples

Driver:

AI-enabled manufacturing

Question:

How should we use AI to reduce production costs?

---

Driver:

Labor shortages

Question:

How can we operate effectively with fewer skilled workers?

---

Driver:

Energy costs rising

Question:

How can we reduce energy intensity across our operations?

## Data model

StrategicQuestion fields:

- Id
- PlanningCycleId
- Title
- Description
- Priority
- Status
- LeadOrganizationId
- CreatedAt
- UpdatedAt

## Priority

- Low
- Medium
- High
- Critical

## Status

- Draft
- Active
- Answered
- Archived

## Relationships

Many Drivers

->

One Strategic Question

A Strategic Question may have multiple Drivers attached.

## Planning cycle scope

- Strategic Questions are scoped to one Planning Cycle.
- Drivers linked to a Strategic Question must belong to the same Planning Cycle.
- Strategic Objectives linked to a Strategic Question must belong to the same Planning Cycle.

## Objective relationship direction

- StrategicQuestion -> StrategicObjectives

One Strategic Question may have many Strategic Objectives.

Every Strategic Objective must be linked to a Strategic Question.
