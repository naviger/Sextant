# Strategic Theme

## Definition

A Strategic Theme is a high-level strategy grouping used to organize related Drivers, Strategic Questions, Objectives, and Strategic Choices.

## Purpose

Strategic Themes provide an executive navigation layer over detailed strategy artifacts.

Themes allow strategy review by coherent focus areas such as:

- Digital Transformation
- Operational Excellence
- Growth
- Supply Chain Resilience
- People and Culture
- Sustainability

## Data model

StrategicTheme fields:

- Id
- Name
- Description
- Status

Implementation metadata:

- PlanningCycleId (scope)
- CreatedAt
- UpdatedAt

## Status values

- Draft
- Active
- Archived

## Relationships

Within a Planning Cycle:

- StrategicTheme -> Drivers
- StrategicTheme -> Strategic Questions
- StrategicTheme -> Strategic Objectives
- StrategicTheme -> Strategic Choices

## Scope rules

- Strategic Theme assignments are planning-cycle scoped.
- A strategy artifact may have zero or one Strategic Theme assignment.
- Theme assignment cannot cross planning-cycle boundaries.

## Role in strategy flow

Themes do not replace traceability.

Traceability remains:

Driver -> Strategic Question -> Strategic Objective -> Strategic Choice

Themes provide a grouping projection across that flow for executive interpretation.
