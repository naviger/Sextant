import React, { useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

export interface SubMenuItem {
  label: string
  to: string
}

interface SubMenuBarProps {
  items: SubMenuItem[]
  label?: string
}

export const SubMenuBar: React.FC<SubMenuBarProps> = ({ items, label = 'Administration' }) => {
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(false)

  const activeItem = useMemo(() => {
    const fullPath = `${location.pathname}${location.hash}`
    const exactMatch = items.find((item) => item.to === fullPath)
    if (exactMatch) {
      return exactMatch
    }

    return items.find((item) => {
      const targetPath = item.to.split('#')[0]
      return targetPath === location.pathname
    })
  }, [items, location.hash, location.pathname])

  return (
    <nav className="relative z-[70] overflow-visible border-b border-slate-200 bg-white/50 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <span className="section-kicker">{label} Menu</span>

        <div className="relative">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-700 transition-colors hover:border-slate-400"
            onClick={() => setIsOpen((previous) => !previous)}
            aria-haspopup="menu"
            aria-expanded={isOpen}
          >
            {activeItem?.label || 'Select Section'}
            <span className="text-[10px]">v</span>
          </button>

          {isOpen && (
            <div
              className="absolute left-0 top-[calc(100%+0.5rem)] z-[80] w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_18px_40px_rgba(37,55,70,0.16)]"
              role="menu"
            >
              {items.map((item) => {
                const itemPath = item.to.split('#')[0]
                const isActive = item.to === `${location.pathname}${location.hash}` || itemPath === location.pathname

                return (
                  <Link
                    key={item.label}
                    to={item.to}
                    role="menuitem"
                    className={[
                      'block rounded-xl px-3 py-2 text-sm font-semibold transition-colors',
                      isActive
                        ? 'bg-[var(--north-atlantic-blue)] text-white'
                        : 'text-slate-700 hover:bg-slate-100',
                    ].join(' ')}
                    onClick={() => setIsOpen(false)}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
