```javascript
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  addDoc,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";
import { firebaseConfig } from "./firebase-config.js";

// Firebase setup
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// Make.com webhook — prototype testing only
const MAKE_WEBHOOK_URL = "https://hook.us2.make.com/okkcdtwir6dix2vwoxwkuccdsurswla2";

const $ = id => document.getElementById(id);
const params = new URLSearchParams(location.search);
const animalId = (params.get("id") || "").trim();

let animal = null;
let emergencyId = null;

const esc = s =>
  String(s ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[c]));

function setStatus(id, msg) {
  $(id).textContent = msg;
}

function displayAnimal(data) {
  animal = data;
  $("pageTitle").textContent =
    data.animalName || data.name || "Animal profile";

  const image = data.photoUrl
    ? `<img class="animal-photo" src="${esc(data.photoUrl)}" alt="Photo of animal">`
    : "";

  $("animalDetails").innerHTML = `
    ${image}
    <h2>${esc(data.animalName || data.name || "Animal")}</h2>
    <p>
      <span class="pill">${esc(data.species || "Animal")}</span>
      <span class="pill">${esc(data.breed || "Breed not listed")}</span>
    </p>
    <p><b>Animal ID:</b> ${esc(data.animalId || animalId)}</p>
    <p><b>Age:</b> ${esc(data.age || "Not listed")}</p>
    <p><b>Sex:</b> ${esc(data.gender || "Not listed")}</p>
    <p><b>Medical notes:</b> ${esc(data.medical || "Not listed")}</p>
    <p><b>Vaccination:</b> ${esc(data.vaccination || "Not listed")}</p>
    <p><b>Area:</b> ${esc(data.address || "Not listed")}</p>
    <p class="small muted">
      Owner contact details are intentionally not displayed publicly.
    </p>
  `;
}

async function loadAnimal() {
  if (!animalId) {
    $("pageTitle").textContent = "Find an animal";
    $("animalDetails").innerHTML = `
      <p>Enter an animal ID to open its profile.</p>
      <label for="manualId">Animal ID</label>
      <input id="manualId" placeholder="DOG-KNP-001">
      <button id="findButton" class="full">Find animal</button>
    `;

    $("findButton").onclick = () => {
      location.href =
        `animal.html?id=${encodeURIComponent($("manualId").value.trim())}`;
    };
    return;
  }

  try {
    const snap = await getDoc(doc(db, "animals", animalId));

    if (!snap.exists()) {
      $("pageTitle").textContent = "Animal not found";
      $("animalDetails").innerHTML = `
        <p>No animal document found with ID <b>${esc(animalId)}</b>.</p>
        <p class="muted">
          Check that the QR URL uses the exact Firestore document ID.
        </p>
      `;
      return;
    }

    displayAnimal(snap.data());
  } catch (e) {
    $("pageTitle").textContent = "Unable to load animal";
    $("animalDetails").innerHTML = `
      <p>Could not load the profile. Check Firebase setup and Firestore rules.</p>
      <p class="small muted">${esc(e.message)}</p>
    `;
  }
}

// SOS report and Make.com notification
$("sosButton").addEventListener("click", async () => {
  if (!animal) {
    setStatus(
      "sosStatus",
      "Animal profile is not loaded. Please check the QR code or animal ID."
    );
    return;
  }

  $("sosButton").disabled = true;
  setStatus("sosStatus", "Saving SOS report…");

  const report = {
    animalId,
    animalName: animal.animalName || animal.name || "Animal",
    species: animal.species || "",
    ownerUid: animal.ownerUid || "",
    incidentType: $("incidentType").value,
    notes: $("incidentNotes").value.trim(),
    status: "new",
    createdAt: serverTimestamp(),
    source: "public-qr",
    latitude: null,
    longitude: null,
    photoUrl: ""
  };

  try {
    // First, save the SOS report to Firebase.
    const saved = await addDoc(collection(db, "emergencies"), report);
    emergencyId = saved.id;

    // Then notify Make.com.
    try {
      if (
        !MAKE_WEBHOOK_URL.startsWith("https://") ||
        MAKE_WEBHOOK_URL.includes("PASTE_YOUR_")
      ) {
        throw new Error("Configure the Make.com webhook URL first.");
      }

      const response = await fetch(MAKE_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          animalId,
          reference: emergencyId,
          type: report.incidentType,
          reportUrl:
            window.location.origin +
            window.location.pathname +
            "?id=" + encodeURIComponent(animalId)
        })
      });

      if (!response.ok) {
        throw new Error(`Webhook returned HTTP ${response.status}`);
      }

      setStatus(
        "sosStatus",
        `SOS saved and webhook request sent. Reference: ${emergencyId}.`
      );
    } catch (webhookError) {
      console.error("Make.com webhook error:", webhookError);

      setStatus(
        "sosStatus",
        `SOS saved in Firebase, but Make.com notification failed. Reference: ${emergencyId}.`
      );
    }

    $("extraFields").classList.remove("hidden");
  } catch (e) {
    setStatus(
      "sosStatus",
      "Could not save the report. Check Firebase Firestore rules/connection. " +
        e.message
    );
    $("sosButton").disabled = false;
  }
});

// Optional location sharing
$("locationButton").addEventListener("click", () => {
  if (!emergencyId) {
    setStatus("extraStatus", "Send the SOS report first.");
    return;
  }

  if (!navigator.geolocation) {
    setStatus("extraStatus", "This browser does not support location.");
    return;
  }

  setStatus("extraStatus", "Requesting location permission…");

  navigator.geolocation.getCurrentPosition(
    async pos => {
      try {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;

        await updateDoc(doc(db, "emergencies", emergencyId), {
          latitude: lat,
          longitude: lon,
          locationAccuracyMeters: pos.coords.accuracy
        });

        setStatus(
          "extraStatus",
          `Location saved. Map: https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=16/${lat}/${lon}`
        );
      } catch (e) {
        setStatus(
          "extraStatus",
          "Location was found but could not be saved: " + e.message
        );
      }
    },
    err => {
      setStatus("extraStatus", "Location not shared: " + err.message);
    },
    {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 0
    }
  );
});

// Optional photo upload
$("uploadButton").addEventListener("click", async () => {
  if (!emergencyId) {
    setStatus("extraStatus", "Send the SOS report first.");
    return;
  }

  const file = $("photoInput").files?.[0];

  if (!file) {
    setStatus("extraStatus", "Choose a photo first.");
    return;
  }

  if (!file.type.startsWith("image/") || file.size > 8 * 1024 * 1024) {
    setStatus("extraStatus", "Choose an image smaller than 8 MB.");
    return;
  }

  $("uploadButton").disabled = true;
  setStatus("extraStatus", "Uploading photo…");

  try {
    const path =
      `emergency-photos/${emergencyId}/${Date.now()}-` +
      file.name.replace(/[^a-zA-Z0-9._-]/g, "_");

    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);

    const url = await getDownloadURL(storageRef);

    await updateDoc(doc(db, "emergencies", emergencyId), {
      photoUrl: url,
      photoStoragePath: path
    });

    setStatus("extraStatus", "Photo saved to the emergency report.");
  } catch (e) {
    setStatus(
      "extraStatus",
      "Photo upload failed. Check Firebase Storage rules and setup. " +
        e.message
    );
  } finally {
    $("uploadButton").disabled = false;
  }
});

loadAnimal();
```
