import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/queryClient.js'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import { AppLayout } from './components/AppLayout.jsx'
import { Login } from './pages/Login.jsx'
import { Dashboard } from './pages/Dashboard.jsx'
import { BusinessUnitsProjects } from './pages/catalogo/BusinessUnitsProjects.jsx'
import { UsersRoles } from './pages/catalogo/UsersRoles.jsx'
import { NuevaSolicitud } from './pages/solicitudes/NuevaSolicitud.jsx'
import { ListadoSolicitudes } from './pages/solicitudes/ListadoSolicitudes.jsx'
import { DetalleSolicitud } from './pages/solicitudes/DetalleSolicitud.jsx'
import { NuevaLegalizacion } from './pages/legalizaciones/NuevaLegalizacion.jsx'
import { ListadoLegalizaciones } from './pages/legalizaciones/ListadoLegalizaciones.jsx'
import { DetalleLegalizacion } from './pages/legalizaciones/DetalleLegalizacion.jsx'
import { NuevoInforme } from './pages/informesViaje/NuevoInforme.jsx'
import { ListadoInformes } from './pages/informesViaje/ListadoInformes.jsx'
import { DetalleInforme } from './pages/informesViaje/DetalleInforme.jsx'

function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex min-h-svh items-center justify-center">Cargando…</div>
  if (!user) return <Navigate to="/login" replace />
  return children
}

function RequireRole({ role, children }) {
  const { user } = useAuth()
  if (user?.role !== role) return <Navigate to="/" replace />
  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Dashboard />} />

        <Route path="solicitudes/:tipo" element={<NuevaSolicitud />} />
        <Route path="solicitudes/:tipo/listado" element={<ListadoSolicitudes />} />
        <Route path="solicitudes/detalle/:id" element={<DetalleSolicitud />} />

        <Route path="legalizaciones" element={<ListadoLegalizaciones />} />
        <Route path="legalizaciones/nueva" element={<NuevaLegalizacion />} />
        <Route path="legalizaciones/:id" element={<DetalleLegalizacion />} />

        <Route path="informes-viaje" element={<ListadoInformes />} />
        <Route path="informes-viaje/nuevo" element={<NuevoInforme />} />
        <Route path="informes-viaje/:id" element={<DetalleInforme />} />

        <Route
          path="catalogo/proyectos"
          element={
            <RequireRole role="ADMINISTRATIVO">
              <BusinessUnitsProjects />
            </RequireRole>
          }
        />
        <Route
          path="catalogo/usuarios"
          element={
            <RequireRole role="ADMINISTRATIVO">
              <UsersRoles />
            </RequireRole>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
