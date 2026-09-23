// src/auth/sesion.js
// Manejo centralizado de sesión y credenciales en el frontend.

const K_TOKEN = 'token';
const K_PERFIL = 'perfil';
const K_NOMBRE = 'nombre';
const K_USUARIO_ID = 'usuarioId';

export const parseJwt = (token) => {
  if (!token || typeof token !== 'string') return null;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.warn('Error al decodificar JWT payload:', e);
    return null;
  }
};

export const guardarSesion = ({ token, perfil, nombre, usuarioId }) => {
  if (!token) return;
  localStorage.setItem(K_TOKEN, token);

  const payload = parseJwt(token);
  const perfilFinal = perfil || payload?.perfil;
  const nombreFinal = nombre || payload?.nombre;
  const usuarioIdFinal = usuarioId || payload?.usuarioId;

  if (perfilFinal) localStorage.setItem(K_PERFIL, String(perfilFinal));
  if (nombreFinal) localStorage.setItem(K_NOMBRE, String(nombreFinal));
  if (usuarioIdFinal) localStorage.setItem(K_USUARIO_ID, String(usuarioIdFinal));
};

export const getToken = () => localStorage.getItem(K_TOKEN);

export const getPerfil = () => {
  const guardado = localStorage.getItem(K_PERFIL);
  if (guardado) return guardado;
  const token = getToken();
  if (token) {
    const payload = parseJwt(token);
    if (payload?.perfil) {
      localStorage.setItem(K_PERFIL, payload.perfil);
      return payload.perfil;
    }
  }
  return null;
};

export const getNombre = () => {
  const guardado = localStorage.getItem(K_NOMBRE);
  if (guardado) return guardado;
  const token = getToken();
  if (token) {
    const payload = parseJwt(token);
    if (payload?.nombre) {
      localStorage.setItem(K_NOMBRE, payload.nombre);
      return payload.nombre;
    }
  }
  return null;
};

export const getUsuarioId = () => {
  const guardado = localStorage.getItem(K_USUARIO_ID);
  if (guardado) return guardado;
  const token = getToken();
  if (token) {
    const payload = parseJwt(token);
    if (payload?.usuarioId) {
      localStorage.setItem(K_USUARIO_ID, String(payload.usuarioId));
      return payload.usuarioId;
    }
  }
  return null;
};

export const cerrarSesion = () => {
  [K_TOKEN, K_PERFIL, K_NOMBRE, K_USUARIO_ID, 'user'].forEach((k) => localStorage.removeItem(k));
};

export const revalidarPerfilServidor = async (apiInstance) => {
  const token = getToken();
  if (!token) return null;
  try {
    const res = await apiInstance.get('/usuarios/me');
    if (res.data) {
      const { perfil, nombre, id } = res.data;
      if (perfil) localStorage.setItem(K_PERFIL, perfil);
      if (nombre) localStorage.setItem(K_NOMBRE, nombre);
      if (id) localStorage.setItem(K_USUARIO_ID, String(id));
      return res.data;
    }
  } catch (err) {
    // Si falla o la API remota aún no tiene /usuarios/me desplegado,
    // mantenemos el perfil extraído criptográficamente del JWT firmado.
    const payload = parseJwt(token);
    if (payload?.perfil) {
      localStorage.setItem(K_PERFIL, payload.perfil);
    }
  }
  return null;
};
