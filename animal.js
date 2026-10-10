import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, doc, getDoc, collection, addDoc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
// Paste your full Make.com HTTPS webhook here if you use webhook notifications.
const MAKE_WEBHOOK_URL = "PASTE_YOUR_FULL_MAKE_WEBHOOK_URL_HERE";
const $ = id => document.getElementById(id);
const animalId = (new URLSearchParams(location.search).get("id") || "").trim();
let animalData = null;
let emergencyId = null;

function setStatus(id, message) { const node = $(id); if (node) node.textContent = message; }
function addText(parent, tag, text, className = "") {
  const node = document.createElement(tag);
  node.textContent = String(text ?? "");
  if (className) node.className = className;
  parent.appendChild(node);
  return node;
}
function renderAnimal(data) {
  animalData = data;
  $("pageTitle").textContent = data.animalName || data.name || "Animal profile";
  const root = $("animalDetails"); root.replaceChildren();
  if (data.photoUrl) { const img = document.createElement("img"); img.className = "animal-photo"; img.src = data.photoUrl; img.alt = "Animal"; root.appendChild(img); }
  addText(root, "h2", data.animalName || data.name || "Animal");
  const tags = document.createElement("p");
  addText(tags, "span", data.species || "Animal", "pill");
  addText(tags, "span", data.breed || "Breed not listed", "pill");
  root.appendChild(tags);
  const fields = [["Animal ID", data.animalId || animalId], ["Age", data.age || "Not listed"], ["Gender", data.gender || "Not listed"], ["Medical notes", data.medical || "Not listed"], ["Vaccination", data.vaccination || "Not listed"], ["Area", data.address || "Not listed"]];
  fields.forEach(([label, value]) => { const p = document.createElement("p"), strong = document.createElement("strong"); strong.textContent = label + ": "; p.appendChild(strong); p.appendChild(document.createTextNode(String(value))); root.appendChild(p); });
  addText(root, "p", "Private owner contact details are not shown on this public profile.", "small muted");
}
async function loadAnimal() {
  if (!animalId) {
    $("pageTitle").textContent = "Find an animal";
    const root = $("animalDetails"); root.replaceChildren();
    addText(root, "h2", "Start with an animal ID");
    addText(root, "p", "Go to the homepage and enter the ID printed on the animal's QR tag.", "muted");
    const link = document.createElement("a"); link.className = "btn btn-dark"; link.href = "index.html#find"; link.textContent = "Find an animal →"; root.appendChild(link);
    return;
  }
  try {
    const snap = await getDoc(doc(db, "animals", animalId));
    if (!snap.exists()) {
      $("pageTitle").textContent = "Animal not found";
      $("animalDetails").replaceChildren();
      addText($("animalDetails"), "h2", "We couldn't find this animal");
      addText($("animalDetails"), "p", "Check that the ID matches the Firestore document ID in your animals collection.", "muted");
      return;
    }
    renderAnimal(snap.data());
  } catch (error) {
    console.error(error); $("pageTitle").textContent = "Unable to load profile";
    $("animalDetails").replaceChildren();
    addText($("animalDetails"), "p", "Check your Firebase config, connection, and Firestore read rules.");
    addText($("animalDetails"), "p", error.message, "small muted");
  }
}
$("sosButton").addEventListener("click", async () => {
  if (!animalData) { setStatus("sosStatus", "Open a valid animal profile before sending an SOS."); return; }
  const button = $("sosButton"); button.disabled = true; setStatus("sosStatus", "Saving your SOS report…");
  const report = { animalId, animalName: animalData.animalName || animalData.name || "Animal", species: animalData.species || "", incidentType: $("incidentType").value, notes: $("incidentNotes").value.trim(), status: "new", createdAt: serverTimestamp(), source: "public-qr", latitude: null, longitude: null, photoUrl: "" };
  try {
    const result = await addDoc(collection(db, "emergencies"), report);
    emergencyId = result.id; $("extraFields").classList.remove("hidden");
    if (!MAKE_WEBHOOK_URL.startsWith("https://") || MAKE_WEBHOOK_URL.includes("PASTE_YOUR_")) {
      setStatus("sosStatus", "SOS saved to Firebase. Add your Make.com URL in animal.js if you want notifications. Reference: " + emergencyId); return;
    }
    try {
      const response = await fetch(MAKE_WEBHOOK_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ animalId, reference: emergencyId, type: report.incidentType, reportUrl: location.origin + location.pathname + "?id=" + encodeURIComponent(animalId) }) });
      if (!response.ok) throw new Error("HTTP " + response.status);
      setStatus("sosStatus", "SOS saved and notification request sent. Reference: " + emergencyId);
    } catch (error) { console.error(error); setStatus("sosStatus", "SOS saved, but notification could not be confirmed. Reference: " + emergencyId); }
  } catch (error) { console.error(error); setStatus("sosStatus", "Could not save SOS: " + error.message); button.disabled = false; }
});
$("locationButton").addEventListener("click", () => {
  if (!emergencyId) { setStatus("extraStatus", "Send the SOS report first."); return; }
  if (!navigator.geolocation) { setStatus("extraStatus", "Location is not supported by this browser."); return; }
  setStatus("extraStatus", "Waiting for location permission…");
  navigator.geolocation.getCurrentPosition(async position => {
    const latitude = position.coords.latitude, longitude = position.coords.longitude;
    try {
      await updateDoc(doc(db, "emergencies", emergencyId), { latitude, longitude, locationAccuracyMeters: position.coords.accuracy });
      const mapUrl = "https://www.openstreetmap.org/?mlat=" + latitude + "&mlon=" + longitude;
      setStatus("extraStatus", "Location saved. Map: " + mapUrl);
    } catch (error) { setStatus("extraStatus", "Could not save location: " + error.message); }
  }, error => setStatus("extraStatus", "Location not shared: " + error.message), { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 });
});
$("uploadButton").addEventListener("click", async () => {
  if (!emergencyId) { setStatus("extraStatus", "Send the SOS report first."); return; }
  const file = $("photoInput").files?.[0];
  if (!file) { setStatus("extraStatus", "Choose a photo first."); return; }
  if (!file.type.startsWith("image/") || file.size > 8 * 1024 * 1024) { setStatus("extraStatus", "Choose an image smaller than 8 MB."); return; }
  const button = $("uploadButton"); button.disabled = true; setStatus("extraStatus", "Uploading photo…");
  try {
    const filename = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = "emergency-photos/" + emergencyId + "/" + Date.now() + "-" + filename;
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    const photoUrl = await getDownloadURL(storageRef);
    await updateDoc(doc(db, "emergencies", emergencyId), { photoUrl, photoStoragePath: path });
    setStatus("extraStatus", "Photo uploaded and attached to the emergency report.");
  } catch (error) { console.error(error); setStatus("extraStatus", "Photo upload failed: " + error.message); }
  finally { button.disabled = false; }
});
loadAnimal();