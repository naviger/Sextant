# Tree View Component

## Component Name

- Polaris Tree View
- Polaris Disclosure Tree

## Purpose

Provide a reusable hierarchy control for strategic navigation structures where users need to scan parent-child context and act on nodes without losing orientation.

## Structure

Each node uses a consistent layout:

- Left: disclosure triangle indicator for expand/collapse
- Optional icon next to the indicator
- Primary title
- Secondary subtitle
- Right-side action/control area

## Disclosure Behavior

Use triangles as the disclosure signal:

- Right-pointing triangle indicates collapsed branch
- Down-pointing triangle indicates expanded branch

The triangle appears only when a node has children.

## Interaction Rules

- Expand/collapse is immediate and preserves surrounding context.
- Branch actions remain in the right-side control area.
- Tree content must support alphabetical ordering for predictable scanning.
- Bulk controls (Expand All, Collapse All) are supported at container level.

## Accessibility

- Disclosure controls must use button semantics.
- Disclosure controls require clear aria-label text for expand/collapse action.
- Title and subtitle content must remain readable at small viewport widths.

## Usage in Sextant

The Organization Hierarchy view uses this component to manage enterprise structure:

- Reusable disclosure behavior
- Node metadata display (title + subtitle)
- Branch-level actions (add, edit, remove, root)
- Export and bulk expand/collapse controls in the parent container

## Related Concepts

- [Component Naming System](./component-naming-system.md)
- [Experience Principles](./experience-principles.md)
- [Visual Metaphors](./visual-metaphors.md)
