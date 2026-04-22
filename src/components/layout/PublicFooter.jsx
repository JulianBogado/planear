import { Link } from 'react-router-dom'

function PlanearLogo({ size = 28 }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size}>
      <path
        d="M 28 88 V 30 A 12 12 0 0 1 40 18 H 72 A 12 12 0 0 1 84 30 V 46 A 12 12 0 0 1 72 58 H 28"
        fill="none" stroke="white" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round"
      />
      <rect x="42" y="26" width="14" height="10" rx="4" fill="rgba(255,255,255,0.5)" />
      <g fill="white" opacity="0.4">
        <circle cx="46" cy="48" r="3" /><circle cx="54" cy="48" r="3" />
        <circle cx="62" cy="48" r="3" /><circle cx="70" cy="48" r="3" />
      </g>
    </svg>
  )
}

export default function PublicFooter() {
  return (
    <footer style={{ backgroundColor: '#007a8e' }} className="text-white py-14 px-4">
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-10">
        <div>
          <div className="flex items-center gap-2.5 mb-4">
            <PlanearLogo size={28} />
            <span className="font-extrabold text-xl tracking-tight text-white">PLANE.AR</span>
          </div>
          <p className="text-white/60 text-sm leading-relaxed">
            El gestor de suscripciones pensado para tu negocio. Simplificá tu trabajo, ahorrá tiempo y brindá una experiencia premium a tus clientes.
          </p>
        </div>

        <div>
          <p className="font-bold text-white/70 text-xs uppercase tracking-widest mb-4">Navegación</p>
          <ul className="space-y-2.5">
            {[
              { label: 'Inicio', to: '/' },
              { label: 'Cómo funciona', to: '/como-funciona' },
              { label: 'Planes', to: '/planes' },
              { label: 'Contacto', to: '/contacto' },
            ].map(({ label, to }) => (
              <li key={to}>
                <Link to={to} className="text-sm text-white/60 hover:text-white transition-colors">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="font-bold text-white/70 text-xs uppercase tracking-widest mb-4">Tu cuenta</p>
          <ul className="space-y-2.5">
            <li>
              <Link to="/login" className="text-sm text-white/60 hover:text-white transition-colors">
                Iniciar sesión
              </Link>
            </li>
            <li>
              <Link to="/register" className="text-sm text-white/60 hover:text-white transition-colors">
                Registrarse gratis
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="font-bold text-white/70 text-xs uppercase tracking-widest mb-4">Legal</p>
          <ul className="space-y-2.5">
            <li>
              <Link to="/terminos-y-condiciones" className="text-sm text-white/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#007a8e] transition-colors">
                Términos y condiciones
              </Link>
            </li>
            <li>
              <Link to="/politica-de-privacidad" className="text-sm text-white/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#007a8e] transition-colors">
                Política de privacidad
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-5xl mx-auto mt-12 pt-6 border-t border-white/10">
        <p className="text-xs text-white/40 text-center">© 2025 PLANE.AR — Todos los derechos reservados.</p>
              <p className="text-xs text-white/40 text-center"> <a href="https://vectorsur.com.ar" target="_blank" rel="noopener noreferrer" className="hover:underline">
                Creado por vectorsur.com.ar
              </a></p>
      </div>

       

    </footer>
  )
}
