import { auth, db, storage } from './config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { processToJpg } from './converter.js';

// --- LÓGICA DE INTERMITENCIA DE VISTAS (PANELES) ---
const menuButtons = document.querySelectorAll('.menu-btn');
const crudSections = document.querySelectorAll('.crud-section');
const panelsOrder = ['panel-catalog', 'panel-categories', 'panel-occasions'];

function switchPanel(panelId) {
  menuButtons.forEach(btn => {
    btn.classList.remove('active');
    if (btn.getAttribute('data-target') === panelId) {
      btn.classList.add('active');
    }
  });

  crudSections.forEach(section => {
    section.classList.remove('active');
    if (section.id === panelId) {
      section.classList.add('active');
    }
  });
}

if (menuButtons) {
  menuButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      switchPanel(btn.getAttribute('data-target'));
    });
  });
}

// --- CONTROLADOR SWIPE CANVAS (DESLIZAMIENTO TÁCTIL) ---
const contentPanel = document.querySelector('.content-panel');
let touchStartX = 0;
let touchEndX = 0;

if (contentPanel) {
  contentPanel.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  contentPanel.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipeGesture();
  }, { passive: true });
}

function handleSwipeGesture() {
  if (window.innerWidth > 860) return; // Desactivado en computadoras de escritorio

  const activeSection = Array.from(crudSections).find(s => s.classList.contains('active'));
  if (!activeSection) return;

  const currentIndex = panelsOrder.indexOf(activeSection.id);
  const swipeDistance = touchStartX - touchEndX;
  const swipeThreshold = 75; // Distancia mínima en píxeles para gatillar el cambio

  if (swipeDistance > swipeThreshold && currentIndex < panelsOrder.length - 1) {
    // Deslizar a la izquierda -> Siguiente pestaña
    switchPanel(panelsOrder[currentIndex + 1]);
    contentPanel.scrollTop = 0;
  } else if (swipeDistance < -swipeThreshold && currentIndex > 0) {
    // Deslizar a la derecha -> Pestaña anterior
    switchPanel(panelsOrder[currentIndex - 1]);
    contentPanel.scrollTop = 0;
  }
}

// Elementos compartidos del Catálogo existentes
const categorySelect = document.getElementById('itemCategory');
const occasionCheckboxes = document.querySelectorAll('input[name="occasion"]');
const fileInput = document.getElementById('itemImg');
const filePreviewText = document.getElementById('file-name-preview');
const previewContainer = document.getElementById('imagePreviewContainer');
const previewImage = document.getElementById('imagePreview');
const removeImageBtn = document.getElementById('btnRemoveImage');

function clearImagePreview() {
  if (fileInput) fileInput.value = ""; 
  if (filePreviewText) filePreviewText.innerText = "Ningún archivo seleccionado";
  if (previewContainer) previewContainer.classList.remove('active');
  if (previewImage) previewImage.setAttribute('src', '');
}

if (fileInput && filePreviewText && previewContainer && previewImage) {
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      filePreviewText.innerText = file.name;
      const reader = new FileReader();
      reader.onload = function(event) {
        previewImage.setAttribute('src', event.target.result);
        previewContainer.classList.add('active');
      }
      reader.readAsDataURL(file);
    } else {
      clearImagePreview();
    }
  });
}

if (removeImageBtn) {
  removeImageBtn.addEventListener('click', () => {
    clearImagePreview();
  });
}

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
      
      await addDoc(collection(db, "productos"), {
        nombre: name,
        descripcion: desc,
        imageUrl: url,
        fecha: serverTimestamp()
      });

      status.innerText = "¡Publicado con éxito! 🌹";
      form.reset();
      clearImagePreview();
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