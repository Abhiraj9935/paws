import { db } from "./firebase-config.js";

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";


/* =========================================
   ELEMENTS
========================================= */

const lookupId =
  document.getElementById("lookupId");

const lookupButton =
  document.getElementById("lookupButton");

const lookupResult =
  document.getElementById("lookupResult");


/* =========================================
   SEARCH BUTTON
========================================= */

lookupButton.addEventListener(
  "click",
  findAnimal
);


/* =========================================
   LOAD ANIMAL FROM QR LINK
========================================= */

const urlParams =
  new URLSearchParams(
    window.location.search
  );

const qrAnimalId =
  urlParams.get("id");


if (qrAnimalId) {

  lookupId.value =
    qrAnimalId;

  findAnimal();

}


/* =========================================
   FIND ANIMAL
========================================= */

async function findAnimal() {

  const animalId =
    lookupId.value
      .trim()
      .toUpperCase();


  if (!animalId) {

    lookupResult.innerHTML = `
      <div class="error-message">
        ❌ Please enter an Animal ID.
      </div>
    `;

    return;

  }


  lookupResult.innerHTML = `
    <p style="text-align:center;">
      🔍 Searching for <strong>${escapeHTML(animalId)}</strong>...
    </p>
  `;


  try {

    /*
      IMPORTANT:

      Collection:
      animals

      Document:
      Animal ID

      Example:
      animals / DOG-KNP-001
    */

    const animalRef =
      doc(
        db,
        "animals",
        animalId
      );


    const snapshot =
      await getDoc(animalRef);


    if (!snapshot.exists()) {

      lookupResult.innerHTML = `
        <div class="error-message">

          ❌ Animal not found.

          <br><br>

          We searched for:
          <strong>
            ${escapeHTML(animalId)}
          </strong>

        </div>
      `;

      return;

    }


    const animal =
      snapshot.data();


    displayAnimal(
      animal,
      animalId
    );


  } catch (error) {

    console.error(
      "ANIMAL LOOKUP ERROR:",
      error
    );


    lookupResult.innerHTML = `
      <div class="error-message">

        ❌ Firebase Error

        <br>

        ${escapeHTML(
          error.message
        )}

      </div>
    `;

  }

}


/* =========================================
   DISPLAY ANIMAL
========================================= */

function displayAnimal(
  animal,
  animalId
) {

  lookupResult.innerHTML = "";


  const photo =
    animal.photourl ||
    animal.photoUrl ||
    "";


  const name =
    animal.name ||
    animal.animalName ||
    "Unknown Animal";


  const caretaker =
    animal.caretaker ||
    animal.ownerName ||
    "Not provided";


  const phone =
    animal.phone ||
    "Not provided";


  const species =
    animal.species ||
    "Not provided";


  const breed =
    animal.breed ||
    "Not provided";


  const gender =
    animal.gender ||
    "Not provided";


  const birthDate =
    animal.birthDate ||
    "Not provided";


  const medical =
    animal.medical ||
    "No medical information";


  const vaccination =
    animal.vaccination ||
    "Not provided";


  const notes =
    animal.notes ||
    "No additional notes";


  const imageHTML = photo
    ? `
      <img
        id="animalPhoto"
        src="${escapeHTML(photo)}"
        alt="${escapeHTML(name)}"
        onerror="this.style.display='none'"
      >
    `
    : `
      <div
        style="
          width:100%;
          height:300px;
          border-radius:18px;
          background:#e8f5f2;
          display:flex;
          align-items:center;
          justify-content:center;
          font-size:90px;
        "
      >
        🐾
      </div>
    `;


  document.getElementById(
    "animalDetails"
  ).innerHTML = `

    <div class="animal-card">

      <div>
        ${imageHTML}
      </div>


      <div class="animal-info">

        <span class="verified">
          ✓ ANIMAL VERIFIED
        </span>


        <h1>
          ${escapeHTML(name)}
        </h1>


        <p>
          <strong>Animal ID:</strong>
          ${escapeHTML(animalId)}
        </p>


        <p>
          <strong>Species:</strong>
          ${escapeHTML(species)}
        </p>


        <p>
          <strong>Breed:</strong>
          ${escapeHTML(breed)}
        </p>


        <p>
          <strong>Gender:</strong>
          ${escapeHTML(gender)}
        </p>


        <p>
          <strong>Birth Date:</strong>
          ${escapeHTML(birthDate)}
        </p>


        <hr>


        <h2>
          👤 Owner / Caretaker
        </h2>


        <p>
          <strong>Name:</strong>
          ${escapeHTML(caretaker)}
        </p>


        <p>
          <strong>Phone:</strong>
          ${escapeHTML(phone)}
        </p>


        <hr>


        <h2>
          🏥 Medical Information
        </h2>


        <p>
          ${escapeHTML(medical)}
        </p>


        <p>
          <strong>Vaccination:</strong>
          ${escapeHTML(vaccination)}
        </p>


        <hr>


        <h2>
          📝 Notes
        </h2>


        <p>
          ${escapeHTML(notes)}
        </p>


        <a
          class="btn primary call-btn"
          href="tel:${escapeHTML(phone)}"
        >
          📞 Contact Owner
        </a>

      </div>

    </div>

  `;

}


/* =========================================
   SECURITY
========================================= */

function escapeHTML(value) {

  return String(value ?? "")
    .replace(
      /[&<>"']/g,
      function (character) {

        return {

          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#039;"

        }[character];

      }
    );

}