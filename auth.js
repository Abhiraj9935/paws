import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const $ = id => document.getElementById(id);
let mode = new URLSearchParams(location.search).get("mode") === "register" ? "register" : "login";

function renderMode() {
  const register = mode === "register";
  $("formTitle").textContent = register ? "Create your account" : "Welcome back";
  $("formSubtitle").textContent = register ? "Register as an animal owner." : "Sign in to continue to your account.";
  ["nameField", "phoneField", "confirmField"].forEach(id => $(id).classList.toggle("hidden", !register));
  $("fullName").required = register;
  $("confirmPassword").required = register;
  $("submitButton").textContent = register ? "Create owner account →" : "Login →";
  $("switchText").textContent = register ? "Already have an account?" : "New to PAWS AI?";
  $("switchLink").textContent = register ? "Login" : "Register as owner";
  $("password").autocomplete = register ? "new-password" : "current-password";
}
$("switchLink").addEventListener("click", event => {
  event.preventDefault(); mode = mode === "register" ? "login" : "register";
  history.replaceState(null, "", "auth.html?mode=" + mode); renderMode(); $("authStatus").textContent = "";
});
$("showPassword").addEventListener("change", () => {
  const type = $("showPassword").checked ? "text" : "password";
  $("password").type = type; $("confirmPassword").type = type;
});
$("authForm").addEventListener("submit", async event => {
  event.preventDefault();
  const button = $("submitButton"); button.disabled = true; $("authStatus").textContent = "Please wait…";
  const email = $("email").value.trim(), password = $("password").value;
  try {
    if (mode === "register") {
      const name = $("fullName").value.trim(), phone = $("phone").value.trim();
      if (password !== $("confirmPassword").value) throw new Error("Passwords do not match.");
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(credential.user, { displayName: name });
      await setDoc(doc(db, "owners", credential.user.uid), { uid: credential.user.uid, name, email, phone, role: "owner", createdAt: serverTimestamp() });
      $("authStatus").textContent = "Account created. Opening your owner space…";
      setTimeout(() => location.href = "owner.html", 800);
    } else {
      await signInWithEmailAndPassword(auth, email, password);
      $("authStatus").textContent = "Login successful. Opening your account…";
      setTimeout(() => location.href = "owner.html", 650);
    }
  } catch (error) {
    console.error("Authentication error:", error);
    const messages = {
      "auth/email-already-in-use": "An account already exists for this email. Try logging in.",
      "auth/invalid-email": "Enter a valid email address.",
      "auth/weak-password": "Choose a stronger password with at least 6 characters.",
      "auth/invalid-credential": "Email or password is incorrect.",
      "auth/operation-not-allowed": "Enable Email/Password sign-in in Firebase Authentication settings.",
      "permission-denied": "Firestore rules do not allow saving this owner profile."
    };
    $("authStatus").textContent = messages[error.code] || error.message || "Could not complete this request.";
  } finally { button.disabled = false; }
});
renderMode();