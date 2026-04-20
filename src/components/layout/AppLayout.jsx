import { useState, useRef, useEffect } from 'react'
import { Outlet, NavLink, Link, useLocation, useNavigate } from 'react-router-dom'
import { Home, Users, Package, Settings2, BarChart2, HelpCircle, CalendarDays, LogOut } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useSubscription } from '../../hooks/useSubscription'
import { useIsAdmin } from '../../hooks/useIsAdmin'

const BASE_NAV = [
  { to: '/dashboard',     label: 'Inicio',   Icon: Home },
  { to: '/suscriptores',  label: 'Clientes', Icon: Users },
  { to: '/servicios',     label: 'Servicios', Icon: Package },
  { to: '/estadisticas',  label: 'Stats',    Icon: BarChart2 },
]

export default function AppLayout({ business, updateBusiness }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const { canReserve } = useSubscription(business)
  const isSuperuser = useIsAdmin()
  const showAgenda = (canReserve || isSuperuser) && business?.agenda_enabled !== false

  const [configOpen, setConfigOpen] = useState(false)
  const configDesktopRef = useRef(null)
  const configMobileRef = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      const inDesktop = configDesktopRef.current?.contains(e.target)
      const inMobile  = configMobileRef.current?.contains(e.target)
      if (!inDesktop && !inMobile) setConfigOpen(false)
    }
    if (configOpen) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [configOpen])

  const navItems = showAgenda
    ? [
        BASE_NAV[0],
        BASE_NAV[1],
        BASE_NAV[2],
        { to: '/agenda', label: 'Agenda', Icon: CalendarDays },
        BASE_NAV[3],
      ]
    : BASE_NAV

  const isConfigActive = location.pathname === '/configuracion'

  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: 'var(--bg)' }}>
      {/* Top header — desktop */}
      <header className="hidden md:flex items-center justify-between px-8 py-4 sticky top-0 z-10"
        style={{ backgroundColor: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <div className="flex items-center gap-3">
          <span className="font-extrabold text-2xl text-brand-700">PLANE.AR</span>
          {business && (
            <span className="text-sm text-stone-400 border-l border-stone-200 pl-3 font-medium">{business.name}</span>
          )}
        </div>
        <nav className="flex items-center gap-1">
          {navItems.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-stone-500 hover:bg-surface-tint hover:text-stone-800'
                }`
              }
            >
              <Icon size={15} />
              <span>{label}</span>
            </NavLink>
          ))}

          {/* Config dropdown — desktop */}
          <div className="relative" ref={configDesktopRef}>
            <button
              onClick={() => setConfigOpen(o => !o)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                isConfigActive
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-stone-500 hover:bg-surface-tint hover:text-stone-800'
              }`}
            >
              <Settings2 size={15} />
              <span>Config</span>
            </button>
            {configOpen && (
              <div className="absolute right-0 top-full mt-1 bg-white rounded-2xl shadow-modal border border-stone-100 py-1.5 w-48 z-20">
                <button
                  onClick={() => { navigate('/configuracion'); setConfigOpen(false) }}
                  className="w-full text-left px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 flex items-center gap-2.5 transition-colors"
                >
                  <Settings2 size={14} className="text-stone-400" />
                  Configuración
                </button>
                <div className="my-1 border-t border-stone-100" />
                <button
                  onClick={async () => { await signOut(); navigate('/') }}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 flex items-center gap-2.5 transition-colors"
                >
                  <LogOut size={14} />
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </nav>
      </header>

      {/* Mobile header */}
      <header className="md:hidden flex items-center justify-between px-4 py-3.5 sticky top-0 z-10"
        style={{ backgroundColor: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <span className="font-extrabold text-xl text-brand-700">PLANE.AR</span>
        {business && (
          <span className="text-sm text-stone-500 font-medium truncate max-w-[180px]">{business.name}</span>
        )}
      </header>

      {/* Page content */}
      <main className="flex-1 overflow-y-auto pb-28 md:pb-0">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <Outlet context={{ business, updateBusiness }} />
        </div>
      </main>

      {/* Floating help button */}
      {location.pathname !== '/ayuda' && (
        <Link
          to="/ayuda"
          className="fixed bottom-20 right-4 md:bottom-6 z-40 w-10 h-10 bg-surface shadow-modal rounded-full flex items-center justify-center text-stone-400 hover:text-brand-600 transition-colors"
        >
          <HelpCircle size={20} />
        </Link>
      )}

      {/* Bottom nav — mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 flex z-10 px-2 pb-2 pt-1"
        style={{ backgroundColor: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(24px)', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
        {navItems.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center gap-1 py-2 rounded-2xl transition-all ${
                isActive ? 'text-brand-700' : 'text-stone-400 hover:text-stone-600'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-brand-100' : ''}`}>
                  <Icon size={20} />
                </span>
                <span className={`text-[10px] font-semibold ${isActive ? 'text-brand-700' : 'text-stone-400'}`}>{label}</span>
              </>
            )}
          </NavLink>
        ))}

        {/* Config dropdown — mobile (opens upward) */}
        <div className="flex-1 flex justify-center relative" ref={configMobileRef}>
          <button
            onClick={() => setConfigOpen(o => !o)}
            className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-2xl transition-all ${
              isConfigActive ? 'text-brand-700' : 'text-stone-400 hover:text-stone-600'
            }`}
          >
            <span className={`p-1.5 rounded-xl transition-all ${isConfigActive ? 'bg-brand-100' : ''}`}>
              <Settings2 size={20} />
            </span>
            <span className={`text-[10px] font-semibold ${isConfigActive ? 'text-brand-700' : 'text-stone-400'}`}>Config</span>
          </button>
          {configOpen && (
            <div className="absolute bottom-full mb-2 right-0 bg-white rounded-2xl shadow-modal border border-stone-100 py-1.5 w-48 z-20">
              <button
                onClick={() => { navigate('/configuracion'); setConfigOpen(false) }}
                className="w-full text-left px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 flex items-center gap-2.5 transition-colors"
              >
                <Settings2 size={14} className="text-stone-400" />
                Configuración
              </button>
              <div className="my-1 border-t border-stone-100" />
              <button
                onClick={signOut}
                className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 flex items-center gap-2.5 transition-colors"
              >
                <LogOut size={14} />
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </nav>
    </div>
  )
}
