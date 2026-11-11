import { Navigate, Route, Routes } from 'react-router-dom'
import { RequireAuth, RequireRole, RoleHome } from './auth/RequireAuth'
import { AppLayout } from './components/layout/AppLayout'
import { CartaPage } from './pages/CartaPage'
import { ClientesPage } from './pages/ClientesPage'
import { ConfiguracionPage } from './pages/ConfiguracionPage'
import { ConversacionesPage } from './pages/ConversacionesPage'
import { DashboardPage } from './pages/DashboardPage'
import { InventarioPage } from './pages/InventarioPage'
import { LoginPage } from './pages/LoginPage'
import { PedidosPage } from './pages/PedidosPage'
import { PedidosWhatsappPage } from './pages/PedidosWhatsappPage'
import { ReportesPage } from './pages/ReportesPage'
import { SimuladorPage } from './pages/SimuladorPage'
import { TableroPage } from './pages/TableroPage'
import { UsuariosPage } from './pages/UsuariosPage'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<RoleHome />} />
          <Route path="/tablero" element={<TableroPage />} />
          <Route path="/carta" element={<CartaPage />} />
          <Route path="/configuracion" element={<ConfiguracionPage />} />
          <Route element={<RequireRole roles={['admin']} />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/usuarios" element={<UsuariosPage />} />
          </Route>
          <Route element={<RequireRole roles={['admin', 'cajero']} />}>
            <Route path="/pedidos-whatsapp" element={<PedidosWhatsappPage />} />
            <Route path="/pedidos" element={<PedidosPage />} />
            <Route path="/conversaciones" element={<ConversacionesPage />} />
            <Route path="/simulador" element={<SimuladorPage />} />
            <Route path="/clientes" element={<ClientesPage />} />
            <Route path="/reportes" element={<ReportesPage />} />
          </Route>
          <Route element={<RequireRole roles={['admin', 'cocina']} />}>
            <Route path="/inventario" element={<InventarioPage />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
