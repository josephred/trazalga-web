import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import api from './api/axiosConfig';

const firebaseConfig = {
  apiKey: "AIzaSyAp_gvYmZW37yeyNdgPjhKHZX0G46XjYhg",
  authDomain: "trazalga-web.firebaseapp.com",
  projectId: "trazalga-web",
  storageBucket: "trazalga-web.firebasestorage.app",
  messagingSenderId: "846544815480",
  appId: "1:846544815480:web:55f402a9ec6914b2a9748d",
  measurementId: "G-D8PH8G23C3"
};

const app = initializeApp(firebaseConfig);
const messaging = typeof window !== 'undefined' && 'serviceWorker' in navigator ? getMessaging(app) : null;

export const requestFirebaseNotificationPermission = async () => {
  try {
    if (!messaging) return null;
    
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log('Notification permission granted.');
      const currentToken = await getToken(messaging, { 
        vapidKey: 'BDtz9qLdpHVpcDHGfd9zdHrKHRxosF3loHPkZQlLpsnmdslp-_diOPbc-UnV-YN5ej-1fQrAO52xs6ipYDMe3Lw' 
      });
      
      if (currentToken) {
        console.log('FCM Token:', currentToken);
        // Enviar el token al backend
        await api.post('/notifications/subscribe', { token: currentToken });
        return currentToken;
      } else {
        console.log('No registration token available. Request permission to generate one.');
      }
    }
  } catch (error) {
    console.error('An error occurred while retrieving token. ', error);
  }
  return null;
};

export const onMessageListener = (callback) => {
  if (messaging) {
    return onMessage(messaging, (payload) => {
      callback(payload);
    });
  }
};

export { messaging };
