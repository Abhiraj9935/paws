# PAWS AI — Animal Registration + QR SOS

## Files
- `index.html`: existing homepage (preserved)
- `register-animal.html` / `register-animal.js`: registration form and automatic QR generation
- `animal.html` / `animal.js`: separate public SOS page opened by scanning the QR
- `owner.html` / `owner.js`: owner lookup
- `vet.html` / `vet.js`: retained in the source bundle for compatibility, but not linked from the main animal SOS page
- `firebase-config.js`: Firebase web app configuration
- `style.css`: site styles

## Setup
1. Upload the files to the same folder in your GitHub Pages repository.
2. In Firebase Console, enable Firestore and (if animal photos are used) Storage.
3. Configure Firestore and Storage security rules before using real personal data. Do not make owner phone numbers, addresses, medical notes, or vaccination records publicly readable. The public SOS page should show only information intended for strangers who scan the QR.
4. Enable the `animals` collection writes and reads required by the app only through appropriately secured rules. The SOS page also writes `emergencies` reports; rules must validate and restrict these writes.
5. Open `register-animal.html`, register an animal, and scan/download the generated QR. The QR opens `animal.html?id=<Firestore document ID>`.

## Important
This is a student prototype, not a staffed emergency dispatch service. Saving an SOS report does not automatically notify a rescue service or send SMS. Firebase web configuration is public by design; database security must be enforced with rules and, for a real deployment, authentication/App Check and abuse protection.
