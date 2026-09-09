import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const BASE_MENU_ITEMS = [
  { label: 'Home', to: '/dashboard' },
  { label: 'Current Cycle', to: '/dashboard' },
  { label: 'Analytics', to: '/dashboard' },
]

const DEFAULT_STRATEGY_SUBMENU_ITEMS = [
  { label: 'Planning Cycles', to: '/strategy/planning-cycles' },
  { label: 'Capabilities', to: '/strategy/capabilities' },
]

const DEFAULT_ADMIN_SUBMENU_ITEMS = [
  { label: 'General', to: '/administration' },
  { label: 'Content Control', to: '/administration/content-control' },
  { label: 'Rules', to: '/administration/rules' },
  { label: 'Workflows', to: '/administration/workflows' },
  { label: 'Users', to: '/administration/users' },
  { label: 'Hierarchies', to: '/administration/hierarchies' },
  { label: 'Strategic Groups', to: '/administration/strategic-groups' },
]

interface MainMenuProps {
  breadcrumb?: string
  adminSubmenuItems?: Array<{ label: string; to: string }>
  strategySubmenuItems?: Array<{ label: string; to: string }>
}

export const MainMenu: React.FC<MainMenuProps> = ({
  breadcrumb,
  adminSubmenuItems,
  strategySubmenuItems,
}) => {
  const { user } = useAuth()
  const location = useLocation()
  const [isStrategyMenuOpen, setIsStrategyMenuOpen] = useState(false)
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false)
  const strategyMenuRef = useRef<HTMLDivElement | null>(null)
  const adminMenuRef = useRef<HTMLDivElement | null>(null)
  const isAdmin = user?.roles?.includes('admin') ?? false
  const submenuItems = adminSubmenuItems ?? DEFAULT_ADMIN_SUBMENU_ITEMS
  const strategyItems = strategySubmenuItems ?? DEFAULT_STRATEGY_SUBMENU_ITEMS

  const activeStrategyItem = useMemo(() => {
    const fullPath = `${location.pathname}${location.hash}`
    const exactMatch = strategyItems.find((item) => item.to === fullPath)
    if (exactMatch) {
      return exactMatch
    }

    return strategyItems.find((item) => item.to.split('#')[0] === location.pathname)
  }, [location.hash, location.pathname, strategyItems])

  const activeAdminItem = useMemo(() => {
    const fullPath = `${location.pathname}${location.hash}`
    const exactMatch = submenuItems.find((item) => item.to === fullPath)
    if (exactMatch) {
      return exactMatch
    }

    return submenuItems.find((item) => item.to.split('#')[0] === location.pathname)
  }, [location.hash, location.pathname, submenuItems])

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      if (strategyMenuRef.current && !strategyMenuRef.current.contains(event.target as Node)) {
        setIsStrategyMenuOpen(false)
      }

      if (!adminMenuRef.current) {
        return
      }

      if (!adminMenuRef.current.contains(event.target as Node)) {
        setIsAdminMenuOpen(false)
      }
    }

    document.addEventListener('click', handleDocumentClick)
    return () => {
      document.removeEventListener('click', handleDocumentClick)
    }
  }, [])

  const isAdministrationSection = location.pathname.startsWith('/administration')
  const isStrategySection = location.pathname.startsWith('/strategy')

  return (
    <nav className="relative z-[70] border-b border-white/70 bg-white/60 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 overflow-visible">
          {BASE_MENU_ITEMS.map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              className={({ isActive }) =>
                [
                  'rounded-full px-3 py-2 text-sm font-semibold transition-colors',
                  isActive
                    ? 'bg-[var(--north-atlantic-blue)] text-white shadow-lg shadow-blue-200/70'
                    : 'text-[var(--deep-slate)] hover:bg-[rgba(0,166,166,0.12)]',
                ].join(' ')
              }
            >
              {item.label}
            </NavLink>
          ))}

          <div className="relative" ref={strategyMenuRef}>
            <button
              type="button"
              className={[
                'inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold transition-colors',
                isStrategySection
                  ? 'bg-[var(--north-atlantic-blue)] text-white shadow-lg shadow-blue-200/70'
                  : 'text-[var(--deep-slate)] hover:bg-[rgba(0,166,166,0.12)]',
              ].join(' ')}
              onClick={() => setIsStrategyMenuOpen((previous) => !previous)}
              aria-haspopup="menu"
              aria-expanded={isStrategyMenuOpen}
            >
              Strategy
              <span className="text-[10px]" aria-hidden="true">▼</span>
            </button>

            {isStrategyMenuOpen && (
              <div className="absolute left-0 top-[calc(100%+0.5rem)] z-[90] w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_20px_44px_rgba(37,55,70,0.18)]" role="menu">
                {strategyItems.map((item) => {
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
                          ? 'bg-[var(--horizon-teal)] text-white'
                          : 'text-[var(--deep-slate)] hover:bg-[rgba(0,166,166,0.12)]',
                      ].join(' ')}
                      onClick={() => setIsStrategyMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          {isAdmin && (
            <div className="relative" ref={adminMenuRef}>
              <button
                type="button"
                className={[
                  'inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold transition-colors',
                  isAdministrationSection
                    ? 'bg-[var(--north-atlantic-blue)] text-white shadow-lg shadow-blue-200/70'
                    : 'text-[var(--deep-slate)] hover:bg-[rgba(0,166,166,0.12)]',
                ].join(' ')}
                onClick={() => setIsAdminMenuOpen((previous) => !previous)}
                aria-haspopup="menu"
                aria-expanded={isAdminMenuOpen}
              >
                Administration
                <span className="text-[10px]" aria-hidden="true">▼</span>
              </button>

              {isAdminMenuOpen && (
                <div className="absolute left-0 top-[calc(100%+0.5rem)] z-[90] w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_20px_44px_rgba(37,55,70,0.18)]" role="menu">
                  {submenuItems.map((item) => {
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
                            ? 'bg-[var(--horizon-teal)] text-white'
                            : 'text-[var(--deep-slate)] hover:bg-[rgba(0,166,166,0.12)]',
                        ].join(' ')}
                        onClick={() => setIsAdminMenuOpen(false)}
                      >
                        {item.label}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="hidden items-center text-xs font-semibold uppercase tracking-[0.14em] text-[var(--slate)] sm:flex">
          {breadcrumb || activeStrategyItem?.label || activeAdminItem?.label || 'Navigation'}
        </div>
      </div>
    </nav>
  )
}
