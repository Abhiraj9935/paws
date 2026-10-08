import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";

import {
  getFirestore
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";


const firebaseConfig = {
  apiKey: "AIzaSyCyQuF-BqbioVwjCitxKArISjA0qE_IoMU",
  authDomain: "animal-life-saver-e5155.firebaseapp.com",
  projectId: "animal-life-saver-e5155",
  storageBucket: "animal-life-saver-e5155.firebasestorage.app",
  messagingSenderId: "500228885733",
  appId: "1:500228885733:web:9e27ecf18258c8b6e7180c"
};


const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);