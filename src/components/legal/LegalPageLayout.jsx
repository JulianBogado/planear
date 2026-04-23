import { Link } from 'react-router-dom'
import PublicNavbar from '../layout/PublicNavbar'
import PublicFooter from '../layout/PublicFooter'
import SEOHead from '../seo/SEOHead'

function HighlightCard({ title, children }) {
  return (
    <div className="rounded-3xl border border-stone-100 bg-white p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-widest text-[#2785aa]">{title}</p>
      <div className="mt-3 text-sm leading-7 text-stone-600">{children}</div>
    </div>
  )
}

function SectionBlock({ id, title, children }) {
  return (
    <section id={id} className="scroll-mt-28 border-t border-stone-100 py-9 first:border-t-0 first:pt-0">
      <h2 className="text-xl font-extrabold tracking-tight text-stone-900">{title}</h2>
      <div className="mt-4 space-y-4 text-[15px] leading-8 text-stone-600">{children}</div>
    </section>
  )
}

export default function LegalPageLayout({
  title,
  description,
  canonical,
  updatedAt,
  eyebrow,
  intro,
  sections,
  highlights,
  relatedLinks,
}) {
  return (
    <div className="min-h-screen bg-white text-stone-900">
      <SEOHead title={title} description={description} canonical={canonical} />
      <a
        href="#contenido-principal"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-[#2785aa] focus:shadow-lg"
      >
        Saltar al contenido principal
      </a>
      <PublicNavbar />

      <main id="contenido-principal">
        {/* ── Hero ── */}
        <section
          className="px-4 pb-14 pt-28 sm:pb-16"
          style={{ background: 'linear-gradient(160deg, #f0f7fb 0%, #faf5fb 100%)' }}
        >
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-end">
              <div className="max-w-3xl">
                <span
                  className="inline-block text-xs font-bold px-4 py-1.5 rounded-full mb-6"
                  style={{ backgroundColor: 'rgba(39,133,170,0.1)', color: '#2785aa' }}
                >
                  {eyebrow}
                </span>
                <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-stone-900 sm:text-5xl">
                  {title}
                </h1>
                <p className="mt-5 max-w-2xl text-lg font-medium leading-8 text-stone-500">
                  {intro}
                </p>
              </div>

              <aside className="rounded-3xl border border-stone-100 bg-white p-6 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-widest text-stone-400">Referencia</p>
                <p className="mt-3 text-sm font-semibold text-stone-800">Última actualización</p>
                <time className="mt-1 block text-sm text-stone-500">{updatedAt}</time>
              </aside>
            </div>
          </div>
        </section>

        {/* ── Cuerpo ── */}
        <section className="px-4 py-16" style={{ backgroundColor: '#f8fafb' }}>
          <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
            {/* Índice sticky */}
            <nav
              aria-label="Índice de secciones"
              className="h-fit rounded-3xl border border-stone-100 bg-white p-5 shadow-sm lg:sticky lg:top-24"
            >
              <p className="text-xs font-bold uppercase tracking-widest text-stone-400">Índice</p>
              <ol className="mt-4 space-y-1">
                {sections.map((section, index) => (
                  <li key={section.id}>
                    <a
                      href={`#${section.id}`}
                      className="group flex items-start gap-3 rounded-2xl px-3 py-2 text-sm text-stone-600 transition-colors hover:bg-[#2785aa]/6 hover:text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2785aa] focus-visible:ring-offset-2"
                    >
                      <span className="mt-0.5 inline-flex min-w-5 justify-center rounded-full bg-stone-100 px-1.5 py-0.5 text-[11px] font-bold text-stone-400 transition-colors group-hover:bg-[#2785aa]/10 group-hover:text-[#2785aa]">
                        {index + 1}
                      </span>
                      <span className="min-w-0 leading-5">{section.title}</span>
                    </a>
                  </li>
                ))}
              </ol>
            </nav>

            <div className="min-w-0 space-y-6">
              {/* Highlights */}
              <div className="grid gap-4 md:grid-cols-2">
                {highlights.map(highlight => (
                  <HighlightCard key={highlight.title} title={highlight.title}>
                    {highlight.body}
                  </HighlightCard>
                ))}
              </div>

              {/* Secciones principales */}
              <article className="rounded-3xl border border-stone-100 bg-white px-6 py-8 shadow-sm sm:px-10 sm:py-10">
                {sections.map(section => (
                  <SectionBlock key={section.id} id={section.id} title={section.title}>
                    {section.content}
                  </SectionBlock>
                ))}
              </article>

              {/* Links relacionados */}
              <section
                className="rounded-3xl border border-stone-100 bg-white px-6 py-6 shadow-sm sm:px-8"
                style={{ background: 'linear-gradient(135deg, rgba(39,133,170,0.04), rgba(192,161,195,0.08))' }}
              >
                <p className="text-xs font-bold uppercase tracking-widest text-[#2785aa]">Documentos relacionados</p>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  {relatedLinks.map(link => (
                    <Link
                      key={link.to}
                      to={link.to}
                      className="inline-flex items-center justify-center rounded-full border border-[#2785aa]/20 bg-white px-5 py-3 text-sm font-bold text-[#2785aa] transition-colors hover:border-[#2785aa]/40 hover:bg-[#2785aa]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2785aa] focus-visible:ring-offset-2"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  )
}
