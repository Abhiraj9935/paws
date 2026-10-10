PAWS AI website files

FILES TO COPY TO YOUR EXISTING GITHUB REPOSITORY
- index.html
- style.css
- animal.html
- animal.js
- auth.html
- auth.js
- owner.html

IMPORTANT FIREBASE SETUP
1. Keep your current firebase-config.js if it already exports `firebaseConfig` correctly. Do not replace it with the example file.
2. If needed, copy firebase-config.js.example to firebase-config.js and fill in your own Firebase Web App settings.
3. In Firebase Console > Authentication > Sign-in method, enable Email/Password.
4. Check Firestore rules so signed-in owners can write only their own `owners/{uid}` document. Do not make all Firestore writes public.
5. Keep your existing animal documents in the `animals` collection. Animal profile URLs use the Firestore document ID, for example animal.html?id=DOG-KNP-001.
6. SOS reports are saved to the `emergencies` collection; photo uploads use Firebase Storage under emergency-photos/.
7. In animal.js, paste the FULL HTTPS Make.com webhook URL into MAKE_WEBHOOK_URL if you want webhook notifications. The webhook URL is visible in browser code, so a server-side proxy is safer for a production system.
8. Firebase Storage rules must allow the intended uploads. Geolocation works only in secure contexts (GitHub Pages HTTPS) and only after the visitor grants permission.

DEPLOY
Upload/commit the files to the root of your existing GitHub Pages repository. Keep your existing Firebase project and data. Then hard-refresh the website (Ctrl+Shift+R or browser refresh menu).

NOTE
The owner dashboard has login/logout and basic owner profile. It does not yet provide animal creation/editing or link animals to owners; that needs a separate secure owner workflow.
