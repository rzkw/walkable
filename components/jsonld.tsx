export function PersonJsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Rizky Ramadhani',
    url: 'https://www.walk-llc.com',
    sameAs: [
      'https://github.com/rzkw',
      'https://www.linkedin.com/in/rizky-ramadhani3056/',
      'https://medium.com/@walkable-llc',
    ],
    knowsAbout: ['Linux Administration', 'DevOps', 'Cloud Infrastructure'],
  }
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
}
