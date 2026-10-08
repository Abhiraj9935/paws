import { db } from "./firebase-config.js";

import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";


/* ==================================================
   GLOBAL
================================================== */

let currentOwnerAnimalId = "";



/* ==================================================
   OWNER ACCESS
================================================== */

const ownerAccessForm =
  document.getElementById("ownerAccessForm");


if (ownerAccessForm) {

  ownerAccessForm.addEventListener(
    "submit",
    async function (event) {

      event.preventDefault();


      const status =
        document.getElementById(
          "accessStatus"
        );


      const details =
        document.getElementById(
          "ownerDetails"
        );


      const animalId =
        document
          .getElementById("accessAnimalId")
          .value
          .trim()
          .toUpperCase();


      const phone =
        document
          .getElementById("accessPhone")
          .value
          .trim();


      details.style.display = "none";


      status.className = "";

      status.textContent =
        "Checking Animal ID and mobile number...";


      try {

        /*
          Find:

          animals / ANIMAL-ID
        */

        const animalRef =
          doc(
            db,
            "animals",
            animalId
          );


        const animalSnapshot =
          await getDoc(
            animalRef
          );


        /* Animal does not exist */

        if (
          !animalSnapshot.exists()
        ) {

          status.className =
            "error-message";

          status.textContent =
            "❌ Animal ID not found.";

          return;

        }


        const animal =
          animalSnapshot.data();


        const savedPhone =
          String(
            animal.phone || ""
          ).trim();


        /*
          BOTH MUST MATCH

          Animal ID must exist
          AND
          phone must match
        */

        if (
          savedPhone !== phone
        ) {

          status.className =
            "error-message";

          status.textContent =
            "❌ Animal ID and mobile number do not match.";

          return;

        }


        /*
          ACCESS SUCCESS
        */

        currentOwnerAnimalId =
          animalId;


        status.className =
          "success-message";

        status.textContent =
          "✅ Owner verified successfully.";


        showAnimalDetails(
          animal,
          animalId
        );


        generateOwnerQR(
          animalId,
          phone
        );

      }


      catch (error) {

        console.error(
          "OWNER ACCESS ERROR:",
          error
        );


        status.className =
          "error-message";

        status.innerHTML =
          "❌ Error checking animal.<br>" +
          error.message;

      }

    }
  );

}



/* ==================================================
   SHOW ANIMAL DETAILS
================================================== */

function showAnimalDetails(
  animal,
  animalId
) {

  const details =
    document.getElementById(
      "ownerDetails"
    );


  details.style.display =
    "block";


  document.getElementById(
    "editAnimalId"
  ).value =
    animalId;


  document.getElementById(
    "editAnimalName"
  ).value =
    animal.name ||
    animal.animalName ||
    "";


  document.getElementById(
    "editSpecies"
  ).value =
    animal.species ||
    "";


  document.getElementById(
    "editBreed"
  ).value =
    animal.breed ||
    "";


  document.getElementById(
    "editBirthDate"
  ).value =
    animal.birthDate ||
    "";


  document.getElementById(
    "editAge"
  ).value =
    animal.age ||
    "";


  document.getElementById(
    "editGender"
  ).value =
    animal.gender ||
    "";


  document.getElementById(
    "editOwnerName"
  ).value =
    animal.caretaker ||
    animal.ownerName ||
    "";


  document.getElementById(
    "editPhone"
  ).value =
    animal.phone ||
    "";


  document.getElementById(
    "editAddress"
  ).value =
    animal.address ||
    "";


  document.getElementById(
    "editMedical"
  ).value =
    animal.medical ||
    "";


  document.getElementById(
    "editVaccination"
  ).value =
    animal.vaccination ||
    "";


  document.getElementById(
    "editNotes"
  ).value =
    animal.notes ||
    "";


  document.getElementById(
    "editPhotoUrl"
  ).value =
    animal.photourl ||
    animal.photoUrl ||
    "";

}



/* ==================================================
   SAVE OWNER EDITS
================================================== */

const saveOwnerChanges =
  document.getElementById(
    "saveOwnerChanges"
  );


if (saveOwnerChanges) {

  saveOwnerChanges.addEventListener(
    "click",
    async function () {

      const status =
        document.getElementById(
          "editStatus"
        );


      status.className = "";

      status.textContent =
        "Saving changes...";


      try {

        const animalName =
          document
            .getElementById("editAnimalName")
            .value
            .trim();


        const species =
          document
            .getElementById("editSpecies")
            .value
            .trim();


        const breed =
          document
            .getElementById("editBreed")
            .value
            .trim();


        const birthDate =
          document
            .getElementById("editBirthDate")
            .value
            .trim();


        const age =
          document
            .getElementById("editAge")
            .value
            .trim();


        const gender =
          document
            .getElementById("editGender")
            .value
            .trim();


        const ownerName =
          document
            .getElementById("editOwnerName")
            .value
            .trim();


        const phone =
          document
            .getElementById("editPhone")
            .value
            .trim();


        const address =
          document
            .getElementById("editAddress")
            .value
            .trim();


        const medical =
          document
            .getElementById("editMedical")
            .value
            .trim();


        const vaccination =
          document
            .getElementById("editVaccination")
            .value
            .trim();


        const notes =
          document
            .getElementById("editNotes")
            .value
            .trim();


        const photoUrl =
          document
            .getElementById("editPhotoUrl")
            .value
            .trim();


        await updateDoc(

          doc(
            db,
            "animals",
            currentOwnerAnimalId
          ),

          {

            animalId:
              currentOwnerAnimalId,

            name:
              animalName,

            animalName:
              animalName,

            species:
              species,

            breed:
              breed,

            birthDate:
              birthDate,

            age:
              age,

            gender:
              gender,

            caretaker:
              ownerName,

            ownerName:
              ownerName,

            phone:
              phone,

            address:
              address,

            medical:
              medical,

            vaccination:
              vaccination,

            notes:
              notes,

            photourl:
              photoUrl,

            photoUrl:
              photoUrl,

            updatedAt:
              serverTimestamp()

          }

        );


        status.className =
          "success-message";

        status.textContent =
          "✅ Animal details updated successfully.";


        /*
          Generate new QR
          using the updated mobile number
        */

        generateOwnerQR(
          currentOwnerAnimalId,
          phone
        );

      }


      catch (error) {

        console.error(
          "UPDATE ERROR:",
          error
        );


        status.className =
          "error-message";

        status.textContent =
          "❌ Error updating animal: " +
          error.message;

      }

    }
  );

}



/* ==================================================
   OWNER QR
================================================== */

function generateOwnerQR(
  animalId,
  phone
) {

  const qrSection =
    document.getElementById(
      "ownerQR"
    );


  const qrContainer =
    document.getElementById(
      "ownerQRCode"
    );


  const qrText =
    document.getElementById(
      "ownerQRText"
    );


  if (
    !qrSection ||
    !qrContainer
  ) {

    return;

  }


  qrContainer.innerHTML = "";


  /*
    QR opens animal.html
    and contains the ID + mobile.
  */

  const animalURL =
    new URL(
      "animal.html",
      window.location.href
    );


  animalURL.searchParams.set(
    "id",
    animalId
  );


  const qrData =
    JSON.stringify({

      animalId:
        animalId,

      mobile:
        phone,

      profile:
        animalURL.href

    });


  if (
    typeof QRCode ===
    "undefined"
  ) {

    qrSection.style.display =
      "block";

    qrContainer.textContent =
      "❌ QR library failed to load.";

    return;

  }


  new QRCode(

    qrContainer,

    {

      text:
        qrData,

      width:
        220,

      height:
        220,

      colorDark:
        "#087f70",

      colorLight:
        "#ffffff",

      correctLevel:
        QRCode.CorrectLevel.H

    }

  );


  if (qrText) {

    qrText.textContent =
      animalId +
      " • " +
      phone;

  }


  qrSection.style.display =
    "block";

}



/* ==================================================
   DOWNLOAD OWNER QR
================================================== */

const downloadOwnerQR =
  document.getElementById(
    "downloadOwnerQR"
  );


if (downloadOwnerQR) {

  downloadOwnerQR.addEventListener(
    "click",
    function () {

      const canvas =
        document.querySelector(
          "#ownerQRCode canvas"
        );


      if (!canvas) {

        alert(
          "QR code is not available."
        );

        return;

      }


      const link =
        document.createElement(
          "a"
        );


      link.download =
        currentOwnerAnimalId +
        "-QR.png";


      link.href =
        canvas.toDataURL(
          "image/png"
        );


      link.click();

    }
  );

}



/* ==================================================
   REGISTER NEW ANIMAL
================================================== */

const animalForm =
  document.getElementById(
    "animalForm"
  );


if (animalForm) {

  animalForm.addEventListener(
    "submit",
    async function (event) {

      event.preventDefault();


      const status =
        document.getElementById(
          "formStatus"
        );


      status.className = "";

      status.textContent =
        "Saving animal...";


      const animalId =
        document
          .getElementById("animalId")
          .value
          .trim()
          .toUpperCase();


      const animalName =
        document
          .getElementById("animalName")
          .value
          .trim();


      const species =
        document
          .getElementById("species")
          .value
          .trim();


      const breed =
        document
          .getElementById("breed")
          .value
          .trim();


      const birthDate =
        document
          .getElementById("birthDate")
          .value
          .trim();


      const age =
        document
          .getElementById("age")
          .value
          .trim();


      const gender =
        document
          .getElementById("gender")
          .value
          .trim();


      const ownerName =
        document
          .getElementById("ownerName")
          .value
          .trim();


      const phone =
        document
          .getElementById("phone")
          .value
          .trim();


      const address =
        document
          .getElementById("address")
          .value
          .trim();


      const medical =
        document
          .getElementById("medical")
          .value
          .trim();


      const vaccination =
        document
          .getElementById("vaccination")
          .value
          .trim();


      const notes =
        document
          .getElementById("notes")
          .value
          .trim();


      const photoUrl =
        document
          .getElementById("photoUrl")
          .value
          .trim();


      try {

        /*
          SAVE TO:

          animals / ANIMAL-ID
        */

        await setDoc(

          doc(
            db,
            "animals",
            animalId
          ),

          {

            animalId:
              animalId,

            name:
              animalName,

            animalName:
              animalName,

            species:
              species,

            breed:
              breed,

            birthDate:
              birthDate,

            age:
              age,

            gender:
              gender,

            caretaker:
              ownerName,

            ownerName:
              ownerName,

            phone:
              phone,

            address:
              address,

            medical:
              medical,

            vaccination:
              vaccination,

            notes:
              notes,

            photourl:
              photoUrl,

            photoUrl:
              photoUrl,

            createdAt:
              serverTimestamp(),

            updatedAt:
              serverTimestamp()

          },

          {
            merge: true
          }

        );


        status.className =
          "success-message";


        status.innerHTML =
          "✅ Animal registered successfully!<br>" +
          "Animal ID: <strong>" +
          animalId +
          "</strong>";


        /*
          GENERATE QR IMMEDIATELY
        */

        generateRegistrationQR(
          animalId
        );

      }


      catch (error) {

        console.error(
          "FIREBASE SAVE ERROR:",
          error
        );


        status.className =
          "error-message";


        status.innerHTML =
          "❌ Error saving animal.<br><br>" +
          error.message;

      }

    }
  );

}



/* ==================================================
   REGISTRATION QR
================================================== */

function generateRegistrationQR(
  animalId
) {

  const section =
    document.getElementById(
      "qrSection"
    );


  const container =
    document.getElementById(
      "qrcode"
    );


  const idText =
    document.getElementById(
      "qrAnimalId"
    );


  const profileLink =
    document.getElementById(
      "animalPageLink"
    );


  if (
    !section ||
    !container
  ) {

    return;

  }


  container.innerHTML = "";


  const animalURL =
    new URL(
      "animal.html",
      window.location.href
    );


  animalURL.searchParams.set(
    "id",
    animalId
  );


  if (
    typeof QRCode !==
    "undefined"
  ) {

    new QRCode(

      container,

      {

        text:
          animalURL.href,

        width:
          220,

        height:
          220,

        colorDark:
          "#087f70",

        colorLight:
          "#ffffff",

        correctLevel:
          QRCode.CorrectLevel.H

      }

    );

  }


  if (idText) {

    idText.textContent =
      "Animal ID: " +
      animalId;

  }


  if (profileLink) {

    profileLink.href =
      animalURL.href;

  }


  section.style.display =
    "block";

}