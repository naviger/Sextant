# Driver

## Definition

A Driver is a force, trend, risk, opportunity, or external condition that creates the need for strategic response.

Drivers are the first true strategy artifact.

A Driver is not:

- Objective
- Initiative
- Capability
- Investment

A Driver describes:

- What is changing?
- Why should leadership care?

## Examples

- Energy Costs
- AI Adoption
- Labor Shortages
- New Regulations
- Steel imports increasing
- AI-enabled manufacturing
- Energy price volatility
- Environmental regulation
- Customer consolidation

## Data model

Driver fields:

- Id
- PlanningCycleId
- Title
- Description
- Category
- ImpactLevel
- TimeHorizon
- Status
- OwnerOrganizationId
- CreatedAt
- UpdatedAt

## Categories

- Market
- Customer
- Technology
- Financial
- Workforce
- Regulatory
- Environmental
- Supply Chain
- Competitive
- Other

## Impact Level

- Low
- Medium
- High
- Critical

## Time Horizon

- Immediate
- 1-3 Years
- 3-5 Years
- 5+ Years

## Status

- Draft
- Active
- Archived

## Scope and ownership

- Drivers belong to a Planning Cycle.
- Drivers can affect multiple organizations.
- Drivers may eventually influence Questions, Objectives, and Choices.

## Role in strategy flow

Driver is the initiating element within a Planning Cycle and informs one or more Objectives.

## Related concepts

- [PlanningCycle](./planning-cycle.md)
- [Objective](./objective.md)
- [StrategicChoice](./strategic-choice.md)
