import {initializeApp} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {getFirestore,collection,doc,setDoc,serverTimestamp} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {getStorage,ref,uploadBytes,getDownloadURL} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";
import {firebaseConfig} from "./firebase-config.js";
const app=initializeApp(firebaseConfig),db=getFirestore(app),storage=getStorage(app),$=id=>document.getElementById(id);
const say=(id,msg)=>$(id).textContent=msg;
let qrInstance=null;
$("animalForm").addEventListener("submit",async ev=>{
 ev.preventDefault();const btn=$("saveAnimal"),phone=$("phone").value.trim();
 if(!/^\+[1-9]\d{7,14}$/.test(phone)){say("result","Enter the mobile number with country code, e.g. +919876543210.");return;}
 btn.disabled=true;say("result","Registering animal…");$("qrPanel").style.display="none";
 try{
  const animalRef=doc(collection(db,"animals")),animalId="PAWS-"+animalRef.id.slice(0,8).toUpperCase();
  const data={animalId,name:$("animalName").value.trim(),animalName:$("animalName").value.trim(),species:$("species").value,breed:$("breed").value.trim(),age:$("age").value.trim(),gender:$("gender").value,ownerName:$("ownerName").value.trim(),phone,address:$("address").value.trim(),medical:$("medical").value.trim(),vaccination:$("vaccination").value.trim(),notes:$("notes").value.trim(),photoUrl:"",createdAt:serverTimestamp(),updatedAt:serverTimestamp()};
  const f=$("animalPhoto").files?.[0];if(f){if(!f.type.startsWith("image/")||f.size>8*1024*1024)throw Error("Photo must be an image smaller than 8 MB.");const path=`animal-photos/${animalRef.id}/${f.name.replace(/[^a-zA-Z0-9._-]/g,"_")}`;await uploadBytes(ref(storage,path),f);data.photoUrl=await getDownloadURL(ref(storage,path));}
  await setDoc(animalRef,data);
  const profileUrl=new URL(`animal.html?id=${encodeURIComponent(animalRef.id)}`,location.href).href;
  $("animalIdLabel").textContent=`Animal ID: ${animalId}`;const link=$("profileLink");link.href=profileUrl;link.textContent="Open animal SOS page";
  const qrBox=$("qrcode");qrBox.innerHTML="";if(!window.QRCode)throw Error("QR library did not load. Check your internet connection, then reload and try again.");
  qrInstance=new QRCode(qrBox,{text:profileUrl,width:220,height:220,colorDark:"#102d25",colorLight:"#ffffff",correctLevel:QRCode.CorrectLevel.H});
  $("qrPanel").style.display="block";say("result",`Animal registered successfully. Your QR code is ready. Animal ID: ${animalId}`);$("qrPanel").scrollIntoView({behavior:"smooth",block:"start"});
 }catch(e){say("result","Registration failed: "+e.message);}finally{btn.disabled=false;}
});
$("downloadQr").addEventListener("click",()=>{const img=$("qrcode").querySelector("img"),canvas=$("qrcode").querySelector("canvas");const url=img?.src||(canvas?canvas.toDataURL("image/png"):"");if(!url){say("result","QR code is not ready yet.");return;}const a=document.createElement("a");a.href=url;a.download="animal-sos-qr.png";a.click();});
