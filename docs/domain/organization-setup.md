# Organization Setup

## Intent

Organization setup defines structure and operating posture for nodes in the fleet.

It does not define strategy content.

## Core attributes

- Name
- Code
- Description
- Parent Organization
- Organization Type
- Region
- Leader
- Status

## Strategic Classification

- Strategic: Participates in strategy creation.
- Operational: Executes strategy.
- Hybrid: Participates in both creation and execution.

## Fiscal Responsibility

- Enterprise Funded
- Cost Center
- Profit Center
- Investment Center
- Autonomous Business Unit

## Investment Authority

- None
- Recommend
- Approve
- Own

## Boundary

Setup captures organization structure, accountability, and ownership. Planning concepts are introduced in later lifecycle phases.

## Organizational alignment pilot

Corporate is the top-level scope. A Site belongs to a Corporate scope through
its parent chain. Division, Business Unit, Department, and Team can sit between
them. Organization IDs stay stable when names or display codes change. Parent
links must resolve, cannot form a cycle, and cannot move an existing organization
outside its Corporate scope.

A Corporate organization owns the shared planning-cycle objective. Each aligned
Site keeps its own organization ID as the ownership boundary for its participation.
Use `PUT /api/v1/planning-cycles/{cycle_id}/strategic-objectives/{objective_id}/alignment`
with `{"site_organization_ids":["site-a","site-b"]}` to replace the mapping.
An empty list clears it. A mapped objective must be unlinked before changing its owner.

The GET endpoint at the same path returns the mapping for a Corporate member
and only the requester's own mapping for a Site member. An unmapped Site or a
different Corporate scope receives no objective data. Inactive organizations
and Sites below an inactive ancestor cannot access the mapping.

Assign `corporate_alignment` or `site_alignment` as a Keycloak realm role and
configure the API's `ALIGNMENT_ORGANIZATION_ASSIGNMENTS` environment variable as a
JSON object mapping verified Keycloak subject IDs to Sextant organization IDs.
For example, `{"corporate-user-subject":"corp","site-user-subject":"site-a"}`.
Set assignments through deployment configuration. On an existing Keycloak realm,
create the roles before assigning them. These roles leave the existing administration
permissions unchanged.

Organization setup does not include:

- Drivers
- Objectives
- Strategic Choices
- Capabilities
- Initiatives
- Outcomes
- Planning Cycles
