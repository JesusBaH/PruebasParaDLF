import { auth, db, storage } from './config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { processToJpg } from './converter.js';

const form = document.getElementById('uploadForm');
if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('submitBtn');
    const status = document.getElementById('status');
    
    const name = document.getElementById('itemName').value;
    const desc = document.getElementById('itemDesc').value;
    const file = document.getElementById('itemImg').files[0];

    try {
      btn.disabled = true;
      status.innerText = "Procesando imagen...";

      const jpgBlob = await processToJpg(file);
      const fileName = `${Date.now()}.jpg`;
      const storageRef = ref(storage, `catalog/${fileName}`);

      status.innerText = "Subiendo imagen...";
      const snapshot = await uploadBytes(storageRef, jpgBlob);
      const url = await getDownloadURL(snapshot.ref);

      status.innerText = "Guardando datos...";
      // CONEXIÓN DIRECTA CON TU COLECCIÓN DE FIRESTORE:
      await addDoc(collection(db, "productos"), {
        nombre: name,
        descripcion: desc,
        imageUrl: url,
        fecha: serverTimestamp()
      });

      status.innerText = "¡Publicado con éxito! 🌹";
      form.reset();
    } catch (error) {
      status.innerText = "Error: " + error.message;
    } finally {
      btn.disabled = false;
    }
  });
}

const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', () => signOut(auth));
}