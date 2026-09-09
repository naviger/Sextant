# Strategic Participation Group Setup

## Purpose

Strategic Participation Groups represent cross-organizational governance and planning forums where strategic participation occurs without requiring direct peer-to-peer relationships between every participating organization.

This concept supports setup-only modeling and does not include strategy content.

## Entity: StrategicGroup

### Fields

- Name
- Description
- Group Type
- Status

### Group Type values

- Strategy Council
- Working Group
- Planning Committee
- Investment Committee
- Steering Committee
- Custom

## Membership model

Strategic group participation is modeled as a many-to-many relationship:

Organization ↔ StrategicGroup

Rules:

- An organization may belong to multiple strategic groups.
- A strategic group may include multiple organizations.
- Membership is setup metadata only.
- Membership does not imply strategic authority transfer.

## Administration capabilities

Administration must support:

- Create Group
- Add Members
- Remove Members
- View Members
- Archive Group

## Boundary

Strategic groups are part of Organization Setup and Strategic Relationship Setup boundaries.

Strategic groups are not yet connected to strategy planning artifacts, strategic contracts, objectives, initiatives, or outcomes.

Strategic groups do not include capability modeling. Capabilities remain in strategy execution scope.

Future integration rule:

- Strategic Groups define who collaborates.
- Planning Cycles may include Strategic Groups as participants without embedding strategy content in the group model.
