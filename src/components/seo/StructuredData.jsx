import { Helmet } from 'react-helmet-async'

export default function StructuredData({ schema }) {
  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  )
}
