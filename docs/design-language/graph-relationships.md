# Graph Relationships

## Concept graph

```mermaid
graph TD
    BV[Brand Vision] --> DP[Design Principles]
    BV --> VM[Visual Metaphors]
    BV --> EP[Experience Principles]
    BV --> AI[AI Experience Language]

    DP --> CS[Color System]
    DP --> TY[Typography]
    DP --> DV[Data Visualization Language]
    DP --> MD[Motion Design]
    DP --> EP

    VM --> DV
    VM --> AI
    VM --> CN[Component Naming System]
    VM --> IO[Iconography]

    CS --> DV
    CS --> TY
    CS --> LU[Logo Usage]
    CS --> MD

    TY --> DV
    TY --> CN

    DV --> AI
    DV --> MD
    DV --> EP

    AI --> CN
    AI --> DV

    MD --> EP

    CN --> EP
    CN --> VM

    LU --> BV
    LU --> EP

    IO --> VM
    IO --> DV
    IO --> CN

    TV[Tree View Component] --> EP
    TV --> CN
    TV --> VM
    TV --> MD

    NS[North Star] --> BV
    NS --> VM
    NS --> AI
    CS --> NS

    ST[Strategy] --> BV
    ST --> DP
    ST --> VM

    C[Course] --> AI
    C --> DV
    C --> CN

    B[Bearing] --> AI
    B --> DV

    PF[Position Fix] --> DV
    PF --> AI

    D[Drift] --> DV
    D --> AI
    D --> EP
```

## Relationship types

- influences
- defines
- reinforces
- maps-to
- constrains
- uses
- derives-from
- supports

## Relationship summary

- Brand Vision influences all other design concepts.
- Design Principles constrain visual and interaction behavior.
- Visual Metaphors provide the core expression system.
- Color, typography, iconography, and motion make the metaphor legible and usable.
- Data Visualization Language translates strategic concept mapping into a charting layer.
- AI Experience Language translates generic AI behavior into navigation language.
- Component Naming System keeps the interface aligned with the metaphor at the architecture level.
- Experience Principles establish the user-facing intent that every design decision supports.
- Tree View Component standardizes hierarchical navigation and disclosure behavior across setup workflows.
