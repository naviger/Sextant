# Feature Implementation Context

Goal:
Implement the requested feature using existing architecture and patterns.

Before implementing:

1. Search architecture knowledge.
2. Search ADRs.
3. Search domain concepts.
4. Search design language if UI is involved.

Retrieval budget:

- Maximum one query per category.
- Prefer targeted retrieval.
- Avoid broad memory searches.

Implementation priorities:

1. Existing code patterns
2. Existing architecture
3. Existing domain concepts
4. Simplicity

Do not introduce:
- new libraries
- new frameworks
- new architectural patterns

unless strongly justified.

# Sextant Administration Module

## Overview

You are a senior enterprise software architect and product designer.

I am building Naviger Sextant, a strategy alignment platform that helps organizations define strategic concerns, objectives, choices, capabilities, investments, outcomes, and strategic contracts between organizational units.

The platform must support highly centralized, federated, and distributed organizations.

---

# Core Design Principles

## 1. Organizational Hierarchy

The organizational hierarchy is reference data.

The hierarchy does not define strategic alignment.

An organization may have many reporting levels, but strategy relationships may bypass intermediate levels.

### Example

```text
Corporate
  |
APAC Division
  |
India BU
```

Yet Corporate may have a direct strategic relationship with India BU because it is strategically important.

The system must support this.

---

## 2. Strategic Contracts

Strategic Contracts are first-class entities.

A Strategic Contract defines expected alignment between two organizational units.

A contract can connect any two organizational units regardless of hierarchy.

### Example

```text
Corporate → Consumer Division

Consumer Division → North America

Corporate → India BU
```

### Contract Types

```text
Directive
Alignment
Collaborative
Observational
```

### Contract Contents

A contract may define:

- Required concerns
- Required objectives
- Required outcomes
- Constraints
- Required reporting
- Strategic freedoms
- Review frequency
- Escalation path
- Success criteria

---

## 3. Strategic Authority

Each organizational unit should have a strategy authority classification.

### Values

```text
None
Constrained
Shared
Autonomous
```

This determines how much independent strategy creation is allowed.

---

# Administrative Functions

## Organization Management

Create, edit, archive, and manage organizational units.

### Attributes

```text
Name
Code
Description
Parent Organization
Organization Type
Region
Leader
Status
Effective Date
Retirement Date
```

### Organization Types

Configurable:

```text
Corporate
Holding Company
Portfolio Company
Division
Business Unit
Region
Country
Facility
Product Group
Function
Department
Other
```

### Capabilities

- Create organization units
- Edit organization units
- Move organization units
- Merge organization units
- Archive organization units
- View organizational history
- Bulk updates
- Drag-and-drop hierarchy management
- Organizational search
- Organizational impact analysis

---

## Organization Import

Support importing organizational structures from:

```text
CSV
Excel
SAP
Workday
Microsoft Entra ID
Custom API
```

### Import Features

- Import wizard
- Hierarchy validation
- Duplicate detection
- Parent-child validation
- Import preview
- Incremental updates
- Full reload option
- Error reporting
- Validation reports
- Rollback support

---

## Strategic Contract Management

Create and manage Strategic Contracts.

### Features

- Create contracts
- Contract templates
- Contract libraries
- Clone contracts
- Effective dating
- Expiration dating
- Contract versioning
- Approval workflows
- Renewal workflows
- Contract status management

### Contract Status

```text
Draft
Pending Approval
Active
Expired
Archived
```

### Views

#### Organization View

```text
Corporate
 └─ Division
     └─ Business Unit
```

#### Strategy Contract View

```text
Corporate
 ├─ India BU
 ├─ Digital Unit
 └─ Consumer Division
```

#### Overlay View

Combined hierarchy and contract relationships.

---

## Governance Administration

Manage governance structures.

### Planning Cycles

```text
Annual Planning
Strategic Review
Quarterly Business Review
Monthly Operations Review
```

### Governance Features

- Review cycles
- Approval workflows
- Planning windows
- Escalation workflows
- Governance policies
- Strategy calendar

---

## User Administration

Manage users and permissions.

### Roles

```text
Global Administrator
Strategy Administrator
Executive
Strategy Owner
Business Unit Leader
Contract Owner
Contributor
Viewer
```

### Features

- User management
- Group management
- Team management
- Role assignment
- Delegation
- Temporary access
- SSO integration

---

## Taxonomy Administration

Administrators should configure standard classifications.

### Concern Types

```text
Growth
Market
Customer
Technology
Operations
Financial
Regulatory
Supply Chain
Workforce
Sustainability
Risk
```

### Objective Types

```text
Strategic
Tactical
Operational
```

### Contract Types

```text
Directive
Alignment
Collaborative
Observational
```

### Outcome Types

```text
Financial
Customer
Operational
Capability
Risk
Sustainability
```

### Capability Categories

```text
Commercial
Operations
Supply Chain
Technology
Finance
People
Innovation
```

---

## Strategy Operating Model Administration

Define how strategy operates inside the organization.

### Configuration

- What constitutes a strategic unit
- Strategy authority rules
- Alignment scoring rules
- Planning cycles
- Required strategy artifacts
- Strategy review cadence
- Contract templates

This allows each customer to implement their own governance model.

---

## AI Administration

Configure AI-assisted consulting and guidance.

### AI Functions

- Alignment analysis
- Contract analysis
- Strategy quality assessment
- Strategy completeness assessment
- Recommendation generation
- Governance compliance evaluation

### Example Rules

```text
Identify objectives without initiatives.

Identify initiatives without objectives.

Identify duplicated investments.

Identify conflicting contracts.

Identify low-alignment business units.
```

### Configuration

- Prompt management
- AI policies
- Recommendation settings
- Confidence thresholds
- Escalation thresholds

---

## Audit & Compliance

Track all significant changes.

### Audit Areas

- Organization changes
- Contract changes
- Strategy changes
- User changes
- Permission changes
- Governance changes

### Features

- Change history
- Version history
- Audit reports
- Approval records
- Compliance exports

---

## Reporting Administration

Configure reporting and dashboards.

### Standard Reports

- Alignment Summary
- Strategic Contract Compliance
- Strategic Coverage
- Objective Traceability
- Initiative Traceability
- Governance Compliance
- Strategic Maturity

### Dashboards

- Executive Dashboard
- Business Unit Dashboard
- Portfolio Dashboard
- Governance Dashboard

### Visualizations

- Alignment Heatmaps
- Strategy Maps
- Contract Maps
- Organizational Maps
- Strategy Dependency Graphs

---

## Metadata Administration

Allow administrators to create custom fields without modifying the platform.

### Supported Types

```text
Text
Number
Boolean
Lookup
Date
Enum
Tags
```

### Uses

- Industry-specific attributes
- Company-specific classifications
- Regulatory requirements
- Custom governance metadata

---

## Reference Data Administration

Manage centrally governed reference data.

### Examples

```text
Regions
Countries
Currencies
Business Categories
Risk Categories
Capability Categories
Strategy Themes
```

---

## Notification Administration

Configure notification behavior.

### Events

- Contract expiration
- Missing reviews
- Governance violations
- Alignment issues
- Approval requests

### Delivery Channels

```text
Email
In-App
Microsoft Teams
Slack
```

---

# Deliverables

Design and implement:

1. Domain Model
2. ArangoDB Schema
3. Graph Model
4. REST APIs
5. Event Model
6. UI Wireframes
7. Permissions Model
8. Contract Engine
9. AI Integration Architecture
10. Reporting Architecture
11. Future Extensibility Model

---

# Scale Requirements

The platform should support:

- 100,000+ employees
- 10,000+ organizational units
- Up to 10 hierarchy levels
- Multiple strategic authority models
- Multi-company organizations
- Distributed governance structures
- Global deployments

---

# Key Architectural Principle

The organizational hierarchy defines accountability.

Strategic Contracts define alignment.

The Strategy Graph defines intent, investment, and outcomes.

These three concepts must remain independent but connected.