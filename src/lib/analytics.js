import ReactGA from 'react-ga4'

export function initGA() {
  const id = import.meta.env.VITE_GA_MEASUREMENT_ID
  if (id) ReactGA.initialize(id)
}

export function trackPageView(path) {
  ReactGA.send({ hitType: 'pageview', page: path })
}

export function trackEvent(action, params = {}) {
  ReactGA.event(action, params)
}
