// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-analytics.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBV7WeQW9M6r1CEBuGw5tfTckDVhUoZGhY",
    authDomain: "retailsolutions-dcc0c.firebaseapp.com",
    projectId: "retailsolutions-dcc0c",
    storageBucket: "retailsolutions-dcc0c.firebasestorage.app",
    messagingSenderId: "689510015708",
    appId: "1:689510015708:web:7acce1ae926c6b1a2dca19",
    measurementId: "G-54EMLJMW1K"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

// Export for use in other scripts
export { app, analytics, auth, db }; 