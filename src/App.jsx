// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeContextProvider } from './theme/ThemeContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Consultas from './pages/Consultas';
import Alertas from './pages/Alertas';
import Casos from './pages/Casos';
import Reportes from './pages/Reportes';
import Mapa from './pages/Mapa';
import Administracion from './pages/Administracion';
import Ayuda from './pages/Ayuda';
import MainLayout from './components/layout/MainLayout';

import { useEffect } from 'react';
import { requestFirebaseNotificationPermission } from './firebase';
import { getToken, getPerfil } from './auth/sesion';
import { puedeVer } from './auth/perfiles';

// Un componente simple para proteger rutas (si no hay token, manda al login)
const PrivateRoute = ({ children }) => {
  const token = getToken();
  
  useEffect(() => {
    if (token) {
      requestFirebaseNotificationPermission();
    }
  }, [token]);

  return token ? children : <Navigate to="/login" replace />;
};

// Guarda de perfil: si el perfil no tiene acceso a la ruta, redirige al dashboard
const RutaConPerfil = ({ ruta, children }) => {
  const perfil = getPerfil();
  return puedeVer(perfil, ruta) ? children : <Navigate to="/dashboard" replace />;
};

function App() {
  return (
    <ThemeContextProvider>
      <Router>
        <Routes>
          {/* Ruta pública */}
          <Route path="/login" element={<Login />} />

          {/* Rutas protegidas con Layout Principal */}
          <Route 
            path="/"
            element={
              <PrivateRoute>
                <MainLayout />
              </PrivateRoute>
            } 
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<RutaConPerfil ruta="/dashboard"><Dashboard /></RutaConPerfil>} />
            <Route path="consultas" element={<RutaConPerfil ruta="/consultas"><Consultas /></RutaConPerfil>} />
            <Route path="alertas" element={<RutaConPerfil ruta="/alertas"><Alertas /></RutaConPerfil>} />
            <Route path="casos" element={<RutaConPerfil ruta="/casos"><Casos /></RutaConPerfil>} />
            <Route path="reportes" element={<RutaConPerfil ruta="/reportes"><Reportes /></RutaConPerfil>} />
            <Route path="mapa" element={<RutaConPerfil ruta="/mapa"><Mapa /></RutaConPerfil>} />
            <Route path="administracion" element={<RutaConPerfil ruta="/administracion"><Administracion /></RutaConPerfil>} />
            <Route path="ayuda" element={<RutaConPerfil ruta="/ayuda"><Ayuda /></RutaConPerfil>} />
          </Route>

          {/* Redirección por defecto */}
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </Router>
    </ThemeContextProvider>
  );
}

export default App;