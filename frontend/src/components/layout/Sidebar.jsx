import { NavLink } from 'react-router-dom'
import {
  ShieldHalf,
  LayoutGrid,
  FilePlus2,
  FileStack,
  Radar,
  Database,
  ClipboardCheck,
  LineChart,
  Circle,
} from 'lucide-react'

const NAV_GROUPS = [
  {
    label: 'Intelligence',
    items: [{ to: '/dashboard', label: 'Dashboard', icon: LayoutGrid }],
  },
  {
    label: 'Analysis',
    items: [
      { to: '/reports/new', label: 'New Safety Report', icon: FilePlus2 },
      { to: '/reports', label: 'Safety Reports', icon: FileStack },
    ],
  },
  {
    label: 'Patterns',
    items: [
      { to: '/precursors', label: 'Precursor Radar', icon: Radar },
      { to: '/memory', label: 'Historical Safety Memory', icon: Database },
    ],
  },
  {
    label: 'HSE',
    items: [{ to: '/validation', label: 'Validation', icon: ClipboardCheck }],
  },
  {
    label: 'Analytics',
    items: [{ to: '/analytics', label: 'Trends', icon: LineChart }],
  },
]

function NavItem({ to, label, icon: Icon }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          'group flex items-center gap-3 rounded-md px-3 py-2 text-[13px] font-medium transition-colors',
          isActive
            ? 'bg-sidebar-active text-sidebar-textActive'
            : 'text-sidebar-text hover:bg-sidebar-hover hover:text-sidebar-textActive',
        ].join(' ')
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            size={17}
            strokeWidth={2}
            className={isActive ? 'text-safety' : 'text-sidebar-text group-hover:text-sidebar-textActive'}
          />
          <span className="truncate">{label}</span>
        </>
      )}
    </NavLink>
  )
}

export default function Sidebar({ variant = 'desktop', onNavigate }) {
  const isDrawer = variant === 'drawer'
  return (
    <aside
      className={
        isDrawer
          ? 'flex w-72 flex-col h-full bg-sidebar'
          : 'hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-sidebar border-r border-sidebar-border'
      }
      onClick={isDrawer ? onNavigate : undefined}
    >
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-sidebar-border shrink-0">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-safety/15 border border-safety/30">
          <ShieldHalf size={18} className="text-safety" strokeWidth={2.25} />
        </div>
        <div className="leading-tight">
          <div className="text-[14px] font-semibold text-sidebar-textActive tracking-tight">SIFLens</div>
          <div className="text-[11px] text-sidebar-text">Safety Intelligence</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <div className="px-3 mb-1.5 text-[11px] font-semibold text-sidebar-text/70 tracking-wide">
              {group.label}
            </div>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavItem key={item.to} {...item} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* System status + user */}
      <div className="border-t border-sidebar-border px-4 py-3.5 space-y-3 shrink-0">
        <div>
          <div className="text-[11px] font-semibold text-sidebar-text/70 tracking-wide mb-1.5">
            System Status
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[12px] text-sidebar-text">
              <Circle size={7} className="text-risk-low fill-risk-low" />
              AI Engine Online
            </div>
            <div className="flex items-center gap-2 text-[12px] text-sidebar-text">
              <Circle size={7} className="text-risk-low fill-risk-low" />
              API Connected
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2.5 pt-3 border-t border-sidebar-border">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-hover text-sidebar-textActive text-[12px] font-semibold">
            HA
          </div>
          <div className="leading-tight">
            <div className="text-[12.5px] font-medium text-sidebar-textActive">HSE Analyst</div>
            <div className="text-[11px] text-sidebar-text">Oil India Limited</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
