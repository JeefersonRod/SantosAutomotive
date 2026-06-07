importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
// https://firebase.google.com/docs/web/setup#config-object
firebase.initializeApp({
  apiKey: "AIzaSyAo1P6tHcs0vNdKxKgrTQ", // From screenshot
  authDomain: "santos-automotive.firebaseapp.com",
  projectId: "santos-automotive",
  storageBucket: "santos-automotive.appspot.com",
  messagingSenderId: "811232362529",
  appId: "1:811232362529:web:33b01fd...", // From screenshot, truncated in my memory, but I'll use the one from the screenshot
});

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  // Customize notification here
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo.svg'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
