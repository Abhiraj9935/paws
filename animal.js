import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, doc, getDoc, collection, addDoc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
// Optional: paste the complete HTTPS Make.com webhook URL here.
// Public webpages expose this URL; use a server-side proxy for production.
const MAKE_WEBHOOK_URL = "PASTE_YOUR_FULL_MAKE_WEBHOOK_URL_HERE";
const $ = id => document.getElementById(id);
const animalId = (new URLSearchParams(location.search).get("id") || "").trim();
let animal = null, emergencyId = null;

function status(id, message) { const el = $(id); if (el) el.textContent = message; }
function addText(parent, tag, value, className = "") {
  const el = document.createElement(tag); el.textContent = String(value ?? "");
  if (className) el.className = className; parent.appendChild(el); return el;
}
function displayAnimal(data) {
  animal = data; $("pageTitle").textContent = data.animalName || data.name || "Animal profile";
  const root = $("animalDetails"); root.replaceChildren();
  if (data.photoUrl) { const img = document.createElement("img"); img.className = "animal-photo"; img.src = data.photoUrl; img.alt = "Animal photo"; root.appendChild(img); }
  addText(root, "h2", data.animalName || data.name || "Animal");
  const pills = document.createElement("p"); addText(pills, "span", data.species || "Animal", "pill"); addText(pills, "span", data.breed || "Breed not listed", "pill"); root.appendChild(pills);
  for (const [label, value] of [["Animal ID", data.animalId || animalId], ["Age", data.age || "Not listed"], ["Gender", data.gender || "Not listed"], ["Medical notes", data.medical || "Not listed"], ["Vaccination", data.vaccination || "Not listed"], ["Area", data.address || "Not listed"]]) {
    const p = document.createElement("p"), strong = document.createElement("strong"); strong.textContent = label + ": "; p.appendChild(strong); p.appendChild(document.createTextNode(String(value))); root.appendChild(p);
  }
  addText(root, "p", "Private owner contact details are not shown publicly.", "small muted");
}
async function loadAnimal() {
  if (!animalId) { $("pageTitle").textContent = "Find an animal"; const root = $("animalDetails"); root.replaceChildren(); addText(root, "h2", "Enter an animal ID"); addText(root, "p", "Return to the homepage to find an animal profile.", "muted"); const a = document.createElement("a"); a.className = "btn btn-green"; a.href = "index.html#find-animal"; a.textContent = "Find an animal"; root.appendChild(a); return; }
  try {
    const snap = await getDoc(doc(db, "animals", animalId));
    if (!snap.exists()) { $("pageTitle").textContent = "Animal not found"; $("animalDetails").replaceChildren(); addText($("animalDetails"), "h2", "We couldn't find this animal"); addText($("animalDetails"), "p", "Check that the ID exactly matches the Firestore document ID.", "muted"); return; }
    displayAnimal(snap.data());
  } catch (error) { console.error("Animal loading error:", error); $("pageTitle").textContent = "Unable to load animal"; $("animalDetails").replaceChildren(); addText($("animalDetails"), "p", "Could not load profile. Check Firebase configuration, connection, and Firestore rules."); addText($("animalDetails"), "p", error.message, "small muted"); }
}
$("sosButton").addEventListener("click", async () => {
  if (!animal) { status("sosStatus", "Load a valid animal profile before sending SOS."); return; }
  const button = $("sosButton"); button.disabled = true; status("sosStatus", "Saving SOS report…");
  const report = { animalId, animalName: animal.animalName || animal.name || "Animal", species: animal.species || "", incidentType: $("incidentType").value, notes: $("incidentNotes").value.trim(), status: "new", createdAt: serverTimestamp(), source: "public-qr", latitude: null, longitude: null, photoUrl: "" };
  try {
    const saved = await addDoc(collection(db, "emergencies"), report); emergencyId = saved.id; $("extraFields").classList.remove("hidden");
    status("sosStatus", "SOS saved. Reference: " + emergencyId);
    if (!MAKE_WEBHOOK_URL.startsWith("https://") || MAKE_WEBHOOK_URL.includes("PASTE_YOUR_")) { status("sosStatus", "SOS saved to Firebase. Configure Make.com URL to enable notifications. Reference: " + emergencyId); return; }
    try {
      const response = await fetch(MAKE_WEBHOOK_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ animalId, reference: emergencyId, type: report.incidentType, reportUrl: location.origin + location.pathname + "?id=" + encodeURIComponent(animalId) }) });
      if (!response.ok) throw new Error("HTTP " + response.status);
      status("sosStatus", "SOS saved and notification request sent. Reference: " + emergencyId);
    } catch (error) { console.error("Make.com notification error:", error); status("sosStatus", "SOS saved, but notification could not be confirmed. Reference: " + emergencyId); }
  } catch (error) { console.error("SOS save error:", error); status("sosStatus", "Could not save SOS: " + error.message); button.disabled = false; }
});
$("locationButton").addEventListener("click", () => {
  if (!emergencyId) { status("extraStatus", "Send the SOS report first."); return; }
  if (!navigator.geolocation) { status("extraStatus", "Location is not supported by this browser."); return; }
  status("extraStatus", "Waiting for location permission…");
  navigator.geolocation.getCurrentPosition(async pos => {
    try { const latitude = pos.coords.latitude, longitude = pos.coords.longitude; await updateDoc(doc(db, "emergencies", emergencyId), { latitude, longitude, locationAccuracyMeters: pos.coords.accuracy }); status("extraStatus", "Location saved. Map: https://www.openstreetmap.org/?mlat=" + latitude + "&mlon=" + longitude); }
    catch (error) { status("extraStatus", "Could not save location: " + error.message); }
  }, error => status("extraStatus", "Location not shared: " + error.message), { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 });
});
$("uploadButton").addEventListener("click", async () => {
  if (!emergencyId) { status("extraStatus", "Send the SOS report first."); return; }
  const file = $("photoInput").files?.[0]; if (!file) { status("extraStatus", "Choose a photo first."); return; }
  if (!file.type.startsWith("image/") || file.size > 8 * 1024 * 1024) { status("extraStatus", "Choose an image smaller than 8 MB."); return; }
  const button = $("uploadButton"); button.disabled = true; status("extraStatus", "Uploading photo…");
  try { const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_"), path = "emergency-photos/" + emergencyId + "/" + Date.now() + "-" + safeName, storageRef = ref(storage, path); await uploadBytes(storageRef, file); const photoUrl = await getDownloadURL(storageRef); await updateDoc(doc(db, "emergencies", emergencyId), { photoUrl, photoStoragePath: path }); status("extraStatus", "Photo saved to emergency report."); }
  catch (error) { console.error(error); status("extraStatus", "Photo upload failed: " + error.message); }
  finally { button.disabled = false; }
});
loadAnimal();