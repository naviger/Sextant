import React from 'react'

export interface TreeViewItem<T> {
  id: string
  title: string
  subtitle?: string
  icon?: React.ReactNode
  data: T
  children: TreeViewItem<T>[]
}

interface TreeViewProps<T> {
  items: TreeViewItem<T>[]
  collapsedIds: Set<string>
  onToggle: (itemId: string) => void
  renderActions?: (item: TreeViewItem<T>) => React.ReactNode
  className?: string
}

const TreeViewNode = <T,>({
  item,
  depth,
  collapsedIds,
  onToggle,
  renderActions,
}: {
  item: TreeViewItem<T>
  depth: number
  collapsedIds: Set<string>
  onToggle: (itemId: string) => void
  renderActions?: (item: TreeViewItem<T>) => React.ReactNode
}) => {
  const hasChildren = item.children.length > 0
  const isCollapsed = collapsedIds.has(item.id)

  return (
    <li className={depth > 0 ? 'ml-6 border-l border-slate-200 pl-4' : ''}>
      <div className="mb-3 rounded-2xl border border-slate-200 bg-white/85 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex items-start gap-2">
            {hasChildren ? (
              <button
                type="button"
                aria-label={isCollapsed ? `Expand ${item.title}` : `Collapse ${item.title}`}
                className="mt-0.5 rounded p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
                onClick={() => onToggle(item.id)}
              >
                <span className="inline-block w-3 text-xs leading-none">{isCollapsed ? '▸' : '▾'}</span>
              </button>
            ) : (
              <span className="mt-0.5 inline-block w-5" aria-hidden="true" />
            )}

            {item.icon && <span className="mt-0.5 text-slate-600">{item.icon}</span>}

            <div className="min-w-0">
              <p className="truncate font-semibold text-slate-900">{item.title}</p>
              {item.subtitle && <p className="truncate text-sm text-slate-600">{item.subtitle}</p>}
            </div>
          </div>

          {renderActions && <div className="flex flex-wrap gap-2">{renderActions(item)}</div>}
        </div>
      </div>

      {hasChildren && !isCollapsed && (
        <ul className="space-y-1">
          {item.children.map((child) => (
            <TreeViewNode
              key={child.id}
              item={child}
              depth={depth + 1}
              collapsedIds={collapsedIds}
              onToggle={onToggle}
              renderActions={renderActions}
            />
          ))}
        </ul>
      )}
    </li>
  )
}

export const TreeView = <T,>({ items, collapsedIds, onToggle, renderActions, className }: TreeViewProps<T>) => {
  return (
    <ul className={className || 'space-y-2'}>
      {items.map((item) => (
        <TreeViewNode
          key={item.id}
          item={item}
          depth={0}
          collapsedIds={collapsedIds}
          onToggle={onToggle}
          renderActions={renderActions}
        />
      ))}
    </ul>
  )
}
