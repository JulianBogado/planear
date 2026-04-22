import { Link } from 'react-router-dom'
import PublicNavbar from '../layout/PublicNavbar'
import PublicFooter from '../layout/PublicFooter'
import SEOHead from '../seo/SEOHead'

function HighlightCard({ title, children }) {
  return (
    <div className="rounded-3xl border border-[#2785aa]/10 bg-white/90 p-5 shadow-[0_18px_60px_-40px_rgba(39,133,170,0.35)]">
      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#2785aa]">{title}</p>
      <div className="mt-3 text-sm leading-7 text-stone-600">{children}</div>
    </div>
  )
}

function SectionBlock({ id, title, children }) {
  return (
    <section id={id} className="scroll-mt-28 border-t border-stone-200/80 py-10 first:border-t-0 first:pt-0">
      <h2 className="text-2xl font-black tracking-tight text-stone-900 text-balance">{title}</h2>
      <div className="mt-4 space-y-4 text-[15px] leading-8 text-stone-700">{children}</div>
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
    <div className="min-h-screen overflow-x-hidden bg-[#fcfbf8] text-stone-900">
      <SEOHead title={title} description={description} canonical={canonical} />
      <a
        href="#contenido-principal"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-[#2785aa] focus:shadow-lg"
      >
        Saltar al contenido principal
      </a>
      <PublicNavbar />

      <main id="contenido-principal">
        <section
          className="relative overflow-hidden px-4 pb-12 pt-28 sm:pb-16"
          style={{
            background:
              'radial-gradient(circle at top left, rgba(39,133,170,0.14), transparent 38%), radial-gradient(circle at top right, rgba(192,161,195,0.18), transparent 34%), linear-gradient(180deg, #f2f8fb 0%, #fcfbf8 62%)',
          }}
        >
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-end">
              <div className="max-w-3xl">
                <span className="inline-flex rounded-full border border-[#2785aa]/15 bg-white/80 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.24em] text-[#2785aa] shadow-sm backdrop-blur">
                  {eyebrow}
                </span>
                <h1 className="mt-6 max-w-2xl text-4xl font-black leading-tight tracking-tight text-stone-900 sm:text-5xl text-balance">
                  {title}
                </h1>
                <p className="mt-5 max-w-2xl text-lg font-medium leading-8 text-stone-600">
                  {intro}
                </p>
              </div>

              <aside className="rounded-[28px] border border-white/70 bg-white/90 p-6 shadow-[0_24px_80px_-48px_rgba(39,133,170,0.45)] backdrop-blur">
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-stone-400">Referencia</p>
                <p className="mt-3 text-sm font-semibold text-stone-900">Última actualización</p>
                <time className="mt-1 block text-sm leading-6 text-stone-600">{updatedAt}</time>
              </aside>
            </div>
          </div>
        </section>

        <section className="px-4 pb-20">
          <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
            <nav
              aria-label="Índice de secciones"
              className="h-fit rounded-[30px] border border-stone-200/80 bg-white/90 p-5 shadow-[0_20px_70px_-50px_rgba(0,0,0,0.28)] lg:sticky lg:top-24"
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-stone-400">Índice</p>
              <ol className="mt-4 space-y-1.5">
                {sections.map((section, index) => (
                  <li key={section.id}>
                    <a
                      href={`#${section.id}`}
                      className="group flex items-start gap-3 rounded-2xl px-3 py-2 text-sm text-stone-600 transition-colors hover:bg-[#2785aa]/6 hover:text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2785aa] focus-visible:ring-offset-2"
                    >
                      <span className="mt-0.5 inline-flex min-w-6 justify-center rounded-full bg-stone-100 px-1.5 py-0.5 text-[11px] font-bold text-stone-500 transition-colors group-hover:bg-[#2785aa]/10 group-hover:text-[#2785aa]">
                        {index + 1}
                      </span>
                      <span className="min-w-0 leading-5">{section.title}</span>
                    </a>
                  </li>
                ))}
              </ol>
            </nav>

            <div className="min-w-0 space-y-8">
              <div className="grid gap-4 md:grid-cols-2">
                {highlights.map(highlight => (
                  <HighlightCard key={highlight.title} title={highlight.title}>
                    {highlight.body}
                  </HighlightCard>
                ))}
              </div>

              <article className="rounded-[34px] border border-stone-200/80 bg-white px-6 py-8 shadow-[0_22px_80px_-55px_rgba(0,0,0,0.3)] sm:px-10 sm:py-10">
                {sections.map(section => (
                  <SectionBlock key={section.id} id={section.id} title={section.title}>
                    {section.content}
                  </SectionBlock>
                ))}
              </article>

              <section className="rounded-[30px] border border-[#c0a1c3]/20 bg-[linear-gradient(135deg,rgba(39,133,170,0.06),rgba(192,161,195,0.14))] px-6 py-6 shadow-[0_18px_50px_-40px_rgba(39,133,170,0.25)] sm:px-8">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#2785aa]">Documentos relacionados</p>
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
