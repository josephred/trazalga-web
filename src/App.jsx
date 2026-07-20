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

// Un componente simple para proteger rutas (si no hay token, manda al login)
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  
  useEffect(() => {
    if (token) {
      requestFirebaseNotificationPermission();
    }
  }, [token]);

  return token ? children : <Navigate to="/login" />;
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
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="consultas" element={<Consultas />} />
            <Route path="alertas" element={<Alertas />} />
            <Route path="casos" element={<Casos />} />
            <Route path="reportes" element={<Reportes />} />
            <Route path="mapa" element={<Mapa />} />
            <Route path="administracion" element={<Administracion />} />
            <Route path="ayuda" element={<Ayuda />} />
          </Route>

          {/* Redirección por defecto */}
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </Router>
    </ThemeContextProvider>
  );
}

export default App;