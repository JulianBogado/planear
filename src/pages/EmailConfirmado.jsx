import { Link } from 'react-router-dom'
import SEOHead from '../components/seo/SEOHead'

export default function EmailConfirmado() {
  return (
    <div data-theme="celeste" className="min-h-screen flex" style={{ backgroundColor: 'var(--bg)' }}>
      <SEOHead
        title="Cuenta confirmada — PLANE.AR"
        description="Tu cuenta fue activada correctamente."
        noIndex={true}
      />

      {/* Left brand panel — desktop only */}
      <div className="hidden lg:flex flex-col justify-between w-[42%] p-14"
        style={{ background: 'linear-gradient(145deg, #006d67 0%, #007a8e 40%, #2785aa 100%)' }}>
        <div>
          <div className="flex items-center gap-3 mb-6">
            <svg viewBox="0 0 100 100" width="44" height="44">
              <path d="M 28 88 V 30 A 12 12 0 0 1 40 18 H 72 A 12 12 0 0 1 84 30 V 46 A 12 12 0 0 1 72 58 H 28"
                fill="none" stroke="white" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round"/>
              <rect x="42" y="26" width="14" height="10" rx="4" fill="rgba(255,255,255,0.5)"/>
              <g fill="white" opacity="0.4">
                <circle cx="46" cy="48" r="3"/><circle cx="54" cy="48" r="3"/>
                <circle cx="62" cy="48" r="3"/><circle cx="70" cy="48" r="3"/>
              </g>
            </svg>
            <h1 className="font-extrabold text-4xl text-white tracking-tight">PLANE.AR</h1>
          </div>
          <p className="text-white/70 text-lg font-medium leading-relaxed">
            Todo listo para empezar a gestionar tu negocio.
          </p>
        </div>
        <div className="relative h-48 opacity-20">
          <div className="absolute bottom-4 left-4 w-24 h-24 rounded-full border-4 border-white" />
          <div className="absolute bottom-0 left-24 w-16 h-16 rounded-full bg-white/40" />
          <div className="absolute bottom-12 left-40 w-8 h-8 rounded-full border-2 border-white" />
        </div>
        <p className="text-white/50 text-sm font-medium">Bienvenido a PLANE.AR.</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm text-center">
          {/* Mobile header */}
          <div className="lg:hidden mb-10">
            <h1 className="font-extrabold text-4xl tracking-tight" style={{ color: '#006d67' }}>PLANE.AR</h1>
          </div>

          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h2 className="font-extrabold text-3xl text-stone-900 mb-3">¡Cuenta confirmada!</h2>
          <p className="text-stone-500 text-sm leading-relaxed mb-8">
            Tu cuenta fue activada correctamente. Ya podés iniciar sesión y configurar tu negocio.
          </p>

          <Link
            to="/login"
            className="inline-block bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-full py-3 px-8 text-sm transition-all shadow-sm"
          >
            Iniciar sesión
          </Link>
        </div>
      </div>
    </div>
  )
}
