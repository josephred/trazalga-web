// src/auth/perfiles.js
// Fuente única de verdad del control de acceso de la consola web.

export const PERFILES = {
  ADMINISTRADOR: 'ADMINISTRADOR',
  FISCALIZADOR:  'FISCALIZADOR',
  AUDITOR:       'AUDITOR',
};

const TODOS = [PERFILES.ADMINISTRADOR, PERFILES.FISCALIZADOR, PERFILES.AUDITOR];
const OPERATIVOS = [PERFILES.ADMINISTRADOR, PERFILES.FISCALIZADOR];

export const ACCESO_RUTA = {
  '/dashboard':      TODOS,
  '/consultas':      TODOS,
  '/alertas':        TODOS,
  '/casos':          OPERATIVOS,
  '/reportes':       TODOS,
  '/mapa':           TODOS,
  '/administracion': [PERFILES.ADMINISTRADOR],
  '/ayuda':          TODOS,
};

export const ACCIONES = {
  RESOLVER_HALLAZGO:  OPERATIVOS,
  EDITAR_PARAMETROS:  [PERFILES.ADMINISTRADOR],
  EJECUTAR_RECALCULO: [PERFILES.ADMINISTRADOR],
};

export const puedeVer = (perfil, ruta) => {
  if (!perfil) return false;
  const norm = String(perfil).trim().toUpperCase();
  const permitido = ACCESO_RUTA[ruta] || TODOS;
  return permitido.some((p) => norm.includes(p));
};

export const puedeHacer = (perfil, accion) => {
  if (!perfil) return false;
  const norm = String(perfil).trim().toUpperCase();
  const permitido = ACCIONES[accion] || [];
  return permitido.some((p) => norm.includes(p));
};
