import { auth, db, storage } from './config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { processToJpg } from './converter.js';

// --- ELEMENTOS DE INTERFAZ LIQUID GLASS ---
const menuButtons = document.querySelectorAll('.menu-btn');
const crudSections = document.querySelectorAll('.crud-section');
const navIndicator = document.querySelector('.nav-indicator');
const panelsOrder = ['panel-catalog', 'panel-categories', 'panel-occasions'];

// Función para mover la burbuja magnética neón
function moveIndicator(activeBtn) {
  if (!navIndicator || window.innerWidth > 860) return;
  
  const btnWidth = activeBtn.offsetWidth;
  const btnLeft = activeBtn.offsetLeft;
  
  navIndicator.style.width = `${btnWidth}px`;
  navIndicator.style.transform = `translateX(${btnLeft - 4}px)`; // Ajuste por el padding del riel
}

function switchPanel(panelId) {
  let targetBtn = null;

  menuButtons.forEach(btn => {
    btn.classList.remove('active');
    if (btn.getAttribute('data-target') === panelId) {
      btn.classList.add('active');
      targetBtn = btn;
    }
  });

  crudSections.forEach(section => {
    section.classList.remove('active');
    if (section.id === panelId) {
      section.classList.add('active');
    }
  });

  if (targetBtn) {
    moveIndicator(targetBtn);
  }
}

// Iniciar posición de la burbuja al cargar la página
if (menuButtons.length > 0) {
  setTimeout(() => {
    const activeBtn = document.querySelector('.menu-btn.active');
    if (activeBtn) moveIndicator(activeBtn);
  }, 300);
}

if (menuButtons) {
  menuButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      switchPanel(btn.getAttribute('data-target'));
    });
  });
}

// Escuchar cambios de tamaño de pantalla para recalcular la burbuja
window.addEventListener('resize', () => {
  const activeBtn = document.querySelector('.menu-btn.active');
  if (activeBtn) moveIndicator(activeBtn);
});

// --- CANVAS SWIPE (DESLIZAMIENTO TÁCTIL) ---
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
  if (window.innerWidth > 860) return;

  const activeSection = Array.from(crudSections).find(s => s.classList.contains('active'));
  if (!activeSection) return;

  const currentIndex = panelsOrder.indexOf(activeSection.id);
  const swipeDistance = touchStartX - touchEndX;
  const swipeThreshold = 70; // Sensibilidad de arrastre táctil

  if (swipeDistance > swipeThreshold && currentIndex < panelsOrder.length - 1) {
    switchPanel(panelsOrder[currentIndex + 1]);
    contentPanel.scrollTop = 0;
  } else if (swipeDistance < -swipeThreshold && currentIndex > 0) {
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