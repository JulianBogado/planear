import { Helmet } from 'react-helmet-async'

const DEFAULT_OG_IMAGE = 'https://plane.ar/og-image.png'

export default function SEOHead({
  title,
  description,
  canonical,
  ogImage = DEFAULT_OG_IMAGE,
  ogType = 'website',
  noIndex = false,
}) {
  const hasDescription = Boolean(description?.trim())
  const hasCanonical = Boolean(canonical?.trim())

  return (
    <Helmet>
      <title>{title}</title>
      {hasDescription && <meta name="description" content={description} />}
      {hasCanonical && <link rel="canonical" href={canonical} />}
      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      <meta property="og:title" content={title} />
      {hasDescription && <meta property="og:description" content={description} />}
      {hasCanonical && <meta property="og:url" content={canonical} />}
      <meta property="og:type" content={ogType} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:locale" content="es_AR" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      {hasDescription && <meta name="twitter:description" content={description} />}
      <meta name="twitter:image" content={ogImage} />
    </Helmet>
  )
}
