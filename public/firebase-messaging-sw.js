// Scripts for firebase and firebase messaging
importScripts('https://www.gstatic.com/firebasejs/9.2.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.2.0/firebase-messaging-compat.js');

// Configuración de Firebase (Se debe reemplazar con la real de Google Console)
const firebaseConfig = {
  apiKey: "AIzaSyAp_gvYmZW37yeyNdgPjhKHZX0G46XjYhg",
  authDomain: "trazalga-web.firebaseapp.com",
  projectId: "trazalga-web",
  storageBucket: "trazalga-web.firebasestorage.app",
  messagingSenderId: "846544815480",
  appId: "1:846544815480:web:55f402a9ec6914b2a9748d",
  measurementId: "G-D8PH8G23C3"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// Background Message Handler
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  const notificationTitle = payload.notification.title || 'Alerta Trazalga';
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/pwa-192x192.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
