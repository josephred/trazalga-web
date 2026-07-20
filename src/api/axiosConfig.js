// src/api/axiosConfig.js
import axios from 'axios';

// Origen del backend.
// - Producción (hosting estático como cPanel/zya.me): se define VITE_API_URL con el
//   origen del backend (ej. https://apps.procesac.com). Las llamadas van DIRECTAS al
//   backend (que ya envía cabeceras CORS), sin depender de un proxy en el host.
// - Local (dev) o si VITE_API_URL no está: se usa '/v-api' y el proxy de Vite rutea.
export const API_ORIGIN = import.meta.env.VITE_API_URL || null;

// URL para las rutas de "core" (cuelgan de la raíz del backend, sin prefijo /api).
// Reemplaza el prefijo de proxy '/v-core'.
export const coreUrl = (path) => {
    const p = path.startsWith('/') ? path : `/${path}`;
    return API_ORIGIN ? `${API_ORIGIN}${p}` : `/v-core${p}`;
};

const api = axios.create({
    baseURL: API_ORIGIN || '/v-api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Cuando se llama directo al backend (VITE_API_URL definido), replicamos el ruteo que
// hacía el proxy: las rutas /sync/* viven en la raíz del backend; el resto cuelga de /api.
if (API_ORIGIN) {
    api.interceptors.request.use((config) => {
        const url = config.url || '';
        // No tocar URLs absolutas
        if (!/^https?:\/\//i.test(url)) {
            if (url.startsWith('/sync')) {
                // se deja tal cual → {origin}/sync/...
            } else if (!url.startsWith('/api')) {
                config.url = `/api${url.startsWith('/') ? '' : '/'}${url}`;
            }
        }
        return config;
    });
}

// Interceptor: Antes de cada petición, inyecta el Token si existe
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token'); // Asumimos que guardarás el token aquí al hacer login
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Interceptor de respuesta: Maneja errores de autenticación (token expirado o inválido)
api.interceptors.response.use(
    (response) => response, // Si la respuesta es exitosa, simplemente la retorna
    (error) => {
        // Si el error es 401 (No autorizado), significa que el token expiró o es inválido
        if (error.response && error.response.status === 401) {
            // Limpia el token del localStorage
            localStorage.removeItem('token');

            // Redirige al login
            window.location.href = '/login';
        }

        return Promise.reject(error);
    }
);

export default api;
