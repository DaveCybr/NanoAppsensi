import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import {
  BarChart3, Users, MapPin, Shield, Building2,
  ChevronDown, ChevronRight, Bell, Search, LogOut,
  Layers, FileText, Calendar, CheckSquare, Newspaper,
  ClipboardList, Settings, User
} from 'lucide-react'
import clsx from 'clsx'

type NavChild = { label: string; path: string }
type NavSection = {
  label?: string
  items: {
    id: string
    label: string
    icon: React.ReactNode
    path?: string
    children?: NavChild[]
  }[]
}

const navigation: NavSection[] = [
  {
    label: 'Menu',
    items: [
      {
        id: 'summary',
        label: 'Summary Report',
        icon: <BarChart3 size={16} />,
        path: '/summary-report',
      },
      {
        id: 'attendance',
        label: 'Attendance',
        icon: <CheckSquare size={16} />,
        children: [
          { label: 'Location Map', path: '/location-map' },
          { label: 'Issue Attendance', path: '/issue-attendance' },
        ],
      },
      {
        id: 'report',
        label: 'Report',
        icon: <FileText size={16} />,
        children: [
          { label: 'User Report', path: '/report/user' },
          { label: 'Monthly Report', path: '/report/monthly' },
          { label: 'Activity Report', path: '/report/activity' },
          { label: 'User Summary', path: '/report/summary' },
        ],
      },
    ],
  },
  {
    label: 'Manage',
    items: [
      { id: 'shifting',  label: 'Shifting',    icon: <Layers size={16} />,      path: '/shifting' },
      { id: 'approval',  label: 'Approval',    icon: <ClipboardList size={16} />, path: '/approval' },
      { id: 'leave',     label: 'Leave',       icon: <Calendar size={16} />,    path: '/leave' },
      { id: 'calendar',  label: 'Calendar',    icon: <Calendar size={16} />,    path: '/calendar' },
      { id: 'newsfeed',  label: 'News Feed',   icon: <Newspaper size={16} />,   path: '/newsfeed' },
      { id: 'audit',     label: 'Audit Trail', icon: <Shield size={16} />,      path: '/audit-trail' },
    ],
  },
  {
    label: 'Settings',
    items: [
      { id: 'employee',  label: 'Employee',   icon: <Users size={16} />,     path: '/employee' },
      { id: 'groups',    label: 'Groups',     icon: <Users size={16} />,     path: '/groups' },
      { id: 'hierarchy', label: 'Hierarchy',  icon: <Settings size={16} />,  path: '/hierarchy' },
      { id: 'category',  label: 'Category',   icon: <Layers size={16} />,    path: '/category' },
      { id: 'zones',     label: 'Zones',      icon: <MapPin size={16} />,    path: '/zones' },
      { id: 'company',   label: 'Company',    icon: <Building2 size={16} />, path: '/company' },
    ],
  },
]

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const location  = useLocation()
  const navigate  = useNavigate()
  const profile   = useAuthStore(s => s.profile)
  const user      = useAuthStore(s => s.user)
  const tenant    = useAuthStore(s => s.tenant)
  const signOut   = useAuthStore(s => s.signOut)

  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    attendance: true,
    report: false,
  })
  const [notifCount] = useState(0)

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  const displayName  = (profile as any)?.full_name ?? user?.email?.split('@')[0] ?? 'Admin'
  const displayEmail = user?.email ?? ''
  const tenantName   = (tenant as any)?.name   ?? ''
  const expiresAt    = (tenant as any)?.expires_at
  const daysLeft     = expiresAt
    ? Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86_400_000))
    : null

  const toggleMenu = (id: string) => {
    setOpenMenus(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const isActive = (path: string) => location.pathname === path
  const isChildActive = (children?: NavChild[]) =>
    children?.some(c => location.pathname === c.path)

  return (
    <div className="flex h-full bg-[#f8fafc]">
      {/* ── Sidebar ─────────────────────────────── */}
      <aside className="w-[240px] shrink-0 h-full flex flex-col bg-white border-r border-gray-200">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 h-14 border-b border-gray-100 shrink-0">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">T</span>
          </div>
          <div>
            <div className="font-semibold text-gray-900 text-sm leading-tight">TEFA Presensi</div>
            <div className="text-[10px] text-gray-400 leading-tight">v1.0.0</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto sidebar-scroll py-3">
          {navigation.map((section, si) => (
            <div key={si} className="mb-1">
              {section.label && (
                <div className="section-label">{section.label}</div>
              )}
              {section.items.map(item => (
                <div key={item.id}>
                  {item.children ? (
                    <>
                      <button
                        onClick={() => toggleMenu(item.id)}
                        className={clsx(
                          'w-full flex items-center gap-2.5 px-3 py-2 mx-2 rounded-lg text-sm font-medium transition-colors duration-150',
                          isChildActive(item.children)
                            ? 'text-blue-700 bg-blue-50'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                        )}
                        style={{ width: 'calc(100% - 16px)' }}
                      >
                        <span className={isChildActive(item.children) ? 'text-blue-600' : 'text-gray-400'}>
                          {item.icon}
                        </span>
                        <span className="flex-1 text-left">{item.label}</span>
                        {openMenus[item.id]
                          ? <ChevronDown size={14} className="text-gray-400" />
                          : <ChevronRight size={14} className="text-gray-400" />
                        }
                      </button>
                      {openMenus[item.id] && (
                        <div className="mt-0.5">
                          {item.children.map(child => (
                            <button
                              key={child.path}
                              onClick={() => navigate(child.path)}
                              className={clsx(
                                'w-full text-left',
                                isActive(child.path) ? 'nav-sub-item-active' : 'nav-sub-item'
                              )}
                              style={{ width: 'calc(100% - 16px)' }}
                            >
                              {child.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <button
                      onClick={() => item.path && navigate(item.path)}
                      className={clsx(
                        'w-full text-left',
                        item.path && isActive(item.path) ? 'nav-item-active' : 'nav-item'
                      )}
                      style={{ width: 'calc(100% - 16px)' }}
                    >
                      <span className={item.path && isActive(item.path) ? 'text-white' : 'text-gray-400'}>
                        {item.icon}
                      </span>
                      {item.label}
                    </button>
                  )}
                </div>
              ))}
            </div>
          ))}
        </nav>

        {/* User */}
        <div className="border-t border-gray-100 p-3 shrink-0">
          <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-gray-50 cursor-pointer" onClick={handleLogout}>
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
              <User size={14} className="text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-gray-800 truncate">{displayName}</div>
              <div className="text-[11px] text-gray-400 truncate">{displayEmail}</div>
            </div>
            <LogOut size={14} className="text-gray-400 shrink-0" />
          </div>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Topbar */}
        <header className="h-14 bg-white border-b border-gray-200 flex items-center px-5 gap-4 shrink-0">
          <div className="flex-1 flex items-center gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Cari..."
                className="pl-8 pr-4 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg w-56 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            {tenantName && <span className="text-xs text-gray-400 font-medium">{tenantName}</span>}
            {daysLeft !== null && (
              <span className="badge badge-info text-[10px]">{daysLeft} days left</span>
            )}
            <span className="text-xs text-gray-300 mx-1">|</span>
            <span className="text-xs text-gray-500">English</span>
            <button className="btn-icon relative ml-1">
              <Bell size={16} />
              {notifCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {notifCount}
                </span>
              )}
            </button>
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center ml-1 cursor-pointer">
              <span className="text-white text-xs font-bold">
                {displayName.slice(0, 2).toUpperCase()}
              </span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
