// src/api/axiosConfig.js
import axios from 'axios';

// Cambia esto por tu URL real cuando subas a producción
// Para desarrollo local, usa tu localhost o la URL de producción si ya está arriba.
const BASE_URL = 'https://apps.procesac.com/api';

const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

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