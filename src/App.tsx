import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { SurveyPage } from './pages/SurveyPage';
import { DashboardPage } from './pages/DashboardPage';
import { AdminPage } from './pages/AdminPage';
import { SuperAdminPage } from './pages/SuperAdminPage';
import { OverviewPage } from './pages/OverviewPage';
import { SettingsPage } from './pages/SettingsPage';
import { SetoresPage } from './pages/SetoresPage';
import { ReportsPage } from './pages/ReportsPage';
import { FinanceiroPage } from './pages/FinanceiroPage';
import { NewClientPage } from './pages/NewClientPage';
import { ValidacaoPage } from './pages/ValidacaoPage';
import { ValidacaoFormPage } from './pages/ValidacaoFormPage';
import { CadastroEmpresaPage } from './pages/CadastroEmpresaPage';

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="mapa-ui-theme">
      <AuthProvider>
        <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/survey" element={<SurveyPage />} />
          <Route path="/cadastro" element={<CadastroEmpresaPage />} />

          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute adminOnly>
                <AdminPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/super-admin"
            element={
              <ProtectedRoute adminOnly>
                <SuperAdminPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/overview"
            element={
              <ProtectedRoute>
                <OverviewPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/setores"
            element={
              <ProtectedRoute>
                <SetoresPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <ReportsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/validacao"
            element={
              <ProtectedRoute>
                <ValidacaoPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/validacao/novo"
            element={
              <ProtectedRoute>
                <ValidacaoFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/validacao/:id"
            element={
              <ProtectedRoute>
                <ValidacaoFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/financeiro"
            element={
              <ProtectedRoute adminOnly>
                <FinanceiroPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/new-client"
            element={
              <ProtectedRoute adminOnly>
                <NewClientPage />
              </ProtectedRoute>
            }
          />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/overview" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
