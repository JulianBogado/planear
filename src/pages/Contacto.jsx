import { useState } from 'react'
import { Mail, Clock, CheckCircle2 } from 'lucide-react'
import PublicNavbar from '../components/layout/PublicNavbar'
import PublicFooter from '../components/layout/PublicFooter'
import SEOHead from '../components/seo/SEOHead'

export default function Contacto() {
  const [sent, setSent] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', message: '' })

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    setSent(true)
  }

  return (
    <div className="min-h-screen bg-white">
      <SEOHead
        title="Contacto — PLANE.AR"
        description="¿Tenés alguna consulta sobre PLANE.AR? Escribinos y te respondemos en menos de 24 horas."
        canonical="https://plane.ar/contacto"
      />
      <PublicNavbar />

      {/* ── Header ── */}
      <section className="pt-28 pb-16 px-4 text-center" style={{ background: 'linear-gradient(160deg, #f0f7fb 0%, #faf5fb 100%)' }}>
        <div className="max-w-xl mx-auto">
          <span className="inline-block text-xs font-bold px-4 py-1.5 rounded-full mb-6" style={{ backgroundColor: 'rgba(39,133,170,0.1)', color: '#2785aa' }}>
            Contacto
          </span>
          <h1 className="font-extrabold text-4xl sm:text-5xl text-stone-900 leading-tight mb-4">
            ¿Tenés alguna consulta?
          </h1>
          <p className="text-lg text-stone-500 font-medium">
            Respondemos en menos de 24 horas.
          </p>
        </div>
      </section>

      {/* ── Cuerpo ── */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-14 items-start">

          {/* Datos de contacto */}
          <div>
            <h2 className="font-extrabold text-2xl text-stone-900 mb-6">Hablemos</h2>
            <p className="text-stone-500 text-sm leading-relaxed mb-8">
              Si tenés dudas sobre los planes, necesitás ayuda con la configuración de tu cuenta, o simplemente querés saber si PLANE.AR es lo que buscás — escribinos.
            </p>
            <div className="space-y-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0" style={{ backgroundColor: 'rgba(39,133,170,0.1)' }}>
                  <Mail size={18} style={{ color: '#2785aa' }} />
                </div>
                <div>
                  <p className="font-bold text-stone-800 text-sm">Email</p>
                  <p className="text-stone-500 text-sm mt-0.5">hola@plane.ar</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0" style={{ backgroundColor: 'rgba(39,133,170,0.1)' }}>
                  <Clock size={18} style={{ color: '#2785aa' }} />
                </div>
                <div>
                  <p className="font-bold text-stone-800 text-sm">Horario de atención</p>
                  <p className="text-stone-500 text-sm mt-0.5">Lunes a viernes de 9 a 18 hs</p>
                </div>
              </div>
            </div>
          </div>

          {/* Formulario */}
          <div className="bg-white rounded-3xl border border-stone-100 shadow-sm p-8">
            {sent ? (
              <div className="flex flex-col items-center justify-center text-center py-8 gap-4">
                <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(39,133,170,0.1)' }}>
                  <CheckCircle2 size={28} style={{ color: '#2785aa' }} />
                </div>
                <h3 className="font-extrabold text-xl text-stone-900">¡Mensaje enviado!</h3>
                <p className="text-stone-500 text-sm leading-relaxed max-w-xs">
                  Gracias por escribirnos. Te respondemos en menos de 24 horas hábiles.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone-500 mb-1.5 uppercase tracking-wide">Nombre</label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Tu nombre"
                    className="w-full border border-stone-200 rounded-2xl px-4 py-3 text-sm text-stone-800 placeholder-stone-300 focus:outline-none focus:border-[#2785aa] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-500 mb-1.5 uppercase tracking-wide">Email</label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={form.email}
                    onChange={handleChange}
                    placeholder="tu@email.com"
                    className="w-full border border-stone-200 rounded-2xl px-4 py-3 text-sm text-stone-800 placeholder-stone-300 focus:outline-none focus:border-[#2785aa] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-500 mb-1.5 uppercase tracking-wide">Mensaje</label>
                  <textarea
                    name="message"
                    required
                    rows={4}
                    value={form.message}
                    onChange={handleChange}
                    placeholder="¿En qué te podemos ayudar?"
                    className="w-full border border-stone-200 rounded-2xl px-4 py-3 text-sm text-stone-800 placeholder-stone-300 focus:outline-none focus:border-[#2785aa] transition-colors resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 rounded-full text-sm font-bold text-white transition-all hover:opacity-90"
                  style={{ backgroundColor: '#2785aa' }}
                >
                  Enviar mensaje
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}
