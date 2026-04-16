import { useState, useEffect } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

function PlanearLogo({ size = 32 }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size}>
      <path
        d="M 28 88 V 30 A 12 12 0 0 1 40 18 H 72 A 12 12 0 0 1 84 30 V 46 A 12 12 0 0 1 72 58 H 28"
        fill="none" stroke="#2785aa" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round"
      />
      <rect x="42" y="26" width="14" height="10" rx="4" fill="#C0A1C3" />
      <g fill="#2785aa" opacity="0.5">
        <circle cx="46" cy="48" r="3" />
        <circle cx="54" cy="48" r="3" />
        <circle cx="62" cy="48" r="3" />
        <circle cx="70" cy="48" r="3" />
      </g>
    </svg>
  )
}

const NAV_LINKS = [
  { label: 'Inicio', to: '/' },
  { label: 'Cómo funciona', to: '/como-funciona' },
  { label: 'Planes', to: '/planes' },
  { label: 'Contacto', to: '/contacto' },
]

export default function PublicNavbar() {
  const { user } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 16) }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled || menuOpen
          ? 'bg-white/95 shadow-sm backdrop-blur-md'
          : 'bg-white/80 backdrop-blur-sm'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <PlanearLogo size={32} />
            <span className="font-extrabold text-xl tracking-tight" style={{ color: '#2785aa' }}>
              PLANE.AR
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ label, to }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                    isActive
                      ? 'text-[#2785aa] bg-[#2785aa]/10'
                      : 'text-stone-500 hover:text-stone-800 hover:bg-stone-100'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <Link
                to="/dashboard"
                className="px-5 py-2 rounded-full text-sm font-bold text-white transition-all hover:opacity-90"
                style={{ backgroundColor: '#2785aa' }}
              >
                Ir al panel →
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-full text-sm font-semibold text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-all"
                >
                  Iniciar sesión
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2 rounded-full text-sm font-bold text-white transition-all hover:opacity-90"
                  style={{ backgroundColor: '#2785aa' }}
                >
                  Registrarse
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="md:hidden p-2 rounded-xl text-stone-500 hover:bg-stone-100 transition-colors"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-stone-100 bg-white/98 px-4 py-4 space-y-1">
          {NAV_LINKS.map(({ label, to }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                `block px-4 py-3 rounded-2xl text-sm font-semibold transition-colors ${
                  isActive
                    ? 'text-[#2785aa] bg-[#2785aa]/10'
                    : 'text-stone-600 hover:bg-stone-50'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
          <div className="pt-2 border-t border-stone-100 space-y-2 mt-2">
            {user ? (
              <Link
                to="/dashboard"
                onClick={() => setMenuOpen(false)}
                className="block text-center px-4 py-3 rounded-2xl text-sm font-bold text-white"
                style={{ backgroundColor: '#2785aa' }}
              >
                Ir al panel →
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="block text-center px-4 py-3 rounded-2xl text-sm font-semibold text-stone-700 hover:bg-stone-50 transition-colors"
                >
                  Iniciar sesión
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMenuOpen(false)}
                  className="block text-center px-4 py-3 rounded-2xl text-sm font-bold text-white"
                  style={{ backgroundColor: '#2785aa' }}
                >
                  Registrarse gratis
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
