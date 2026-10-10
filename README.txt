PAWS AI — COMPLETE REDESIGN
============================

FILES INCLUDED
- index.html            New premium homepage
- style.css             Shared responsive design system
- animal.html           Animal profile + SOS UI
- animal.js             Firestore lookup, SOS save, optional location/photo upload
- auth.html             Owner registration and login UI
- auth.js               Firebase Authentication + owners profile document
- owner.html            Owner dashboard and logout
- firebase-config.js.example  Template only
- README.txt            Setup notes

KEEP YOUR EXISTING FIREBASE PROJECT
1. Do not overwrite your existing firebase-config.js. The HTML and JS import:
   import { firebaseConfig } from "./firebase-config.js";
   Your config file should export `firebaseConfig`.
2. Keep your existing Firebase project, animals collection, and data.
3. Firebase Authentication > Sign-in method: enable Email/Password.
4. Firestore: ensure signed-in owners can write/read only their own owners/{uid} document.
5. Existing animal profile URLs use Firestore document IDs:
   animal.html?id=YOUR_ANIMAL_DOCUMENT_ID
6. SOS writes to `emergencies`. Storage uploads use `emergency-photos/{emergencyId}/...`.
7. In animal.js, paste the full HTTPS Make.com webhook URL into MAKE_WEBHOOK_URL if using Make notifications. Browser-side webhook URLs are public; use a secure server-side relay for production.
8. Check Firestore and Storage security rules. Do not set all database/storage access to public just to make the site work.
9. GitHub Pages must serve these files from the same repository root. Upload/commit the HTML, JS, and CSS files, keeping firebase-config.js.

IMPORTANT
- The dashboard currently supports login, registration, profile display and logout.
- It does not yet provide create/edit animal management or owner-animal linking. That requires a secure owner UID workflow.
- If an SOS report cannot save, inspect browser console and Firebase Firestore rules.
