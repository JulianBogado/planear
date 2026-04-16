import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { ToastProvider } from './context/ToastContext'
import { useBusiness } from './hooks/useBusiness'

import Login from './pages/Login'
import Register from './pages/Register'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import Subscribers from './pages/Subscribers'
import SubscriberDetail from './pages/SubscriberDetail'
import Plans from './pages/Plans'
import Settings from './pages/Settings'
import Stats from './pages/Stats'
import Help from './pages/Help'
import Pricing from './pages/Pricing'
import Inicio from './pages/Inicio'
import ComoFunciona from './pages/ComoFunciona'
import Planes from './pages/Planes'
import Agenda from './pages/Agenda'
import PublicBooking from './pages/PublicBooking'
import AppLayout from './components/layout/AppLayout'
import ScrollToTop from './components/ScrollToTop'
import Contacto from './pages/Contacto'

function Spinner() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#faf8f5]">
      <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

function OnboardingGuard() {
  const { user, loading } = useAuth()
  const { business, loading: bizLoading } = useBusiness(user?.id)
  if (loading || bizLoading) return <Spinner />
  if (!user) return <Navigate to="/login" replace />
  if (business) return <Navigate to="/dashboard" replace />
  return <Outlet />
}

function AppGuard() {
  const { user, loading } = useAuth()
  const { business, loading: bizLoading, updateBusiness } = useBusiness(user?.id)
  if (loading || bizLoading) return <Spinner />
  if (!user) return <Navigate to="/login" replace />
  if (!business) return <Navigate to="/onboarding" replace />
  return <AppLayout business={business} updateBusiness={updateBusiness} />
}

function RootRoute() {
  const { user, loading } = useAuth()
  if (loading) return <Spinner />
  return <Inicio />
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<RootRoute />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/como-funciona" element={<ComoFunciona />} />
            <Route path="/planes" element={<Planes />} />
            <Route path="/precios" element={<Pricing />} />
            <Route path="/reservar/:slug" element={<PublicBooking />} />
            <Route path="/contacto" element={<Contacto />} />

            <Route element={<OnboardingGuard />}>
              <Route path="/onboarding" element={<Onboarding />} />
            </Route>

            <Route element={<AppGuard />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/suscriptores" element={<Subscribers />} />
              <Route path="/suscriptores/:id" element={<SubscriberDetail />} />
              <Route path="/servicios" element={<Plans />} />
              <Route path="/estadisticas" element={<Stats />} />
              <Route path="/agenda" element={<Agenda />} />
              <Route path="/ayuda" element={<Help />} />
              <Route path="/configuracion" element={<Settings />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}
