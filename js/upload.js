import { auth, db, storage } from './config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { processToJpg } from './converter.js';

// Componentes del Dropdown Personalizado
const dropdown = document.getElementById('categoryDropdown');
const dropdownTrigger = dropdown?.querySelector('.dropdown-trigger');
const dropdownItems = dropdown?.querySelectorAll('.dropdown-menu li');
const dropdownSelectedText = document.getElementById('dropdownSelectedText');
const hiddenCategoryInput = document.getElementById('itemCategory');

const occasionCheckboxes = document.querySelectorAll('input[name="occasion"]');
const fileInput = document.getElementById('itemImg');
const filePreviewText = document.getElementById('file-name-preview');
const previewContainer = document.getElementById('imagePreviewContainer');
const previewImage = document.getElementById('imagePreview');
const removeImageBtn = document.getElementById('btnRemoveImage');

// Control de apertura/cierre del Dropdown
if (dropdownTrigger) {
  dropdownTrigger.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.classList.toggle('active');
  });
}

// Cerrar el dropdown si se hace clic afuera
document.addEventListener('click', () => {
  dropdown?.classList.remove('active');
});

function updateFormLocks() {
  const selectedCategory = hiddenCategoryInput.value;
  const checkedOccasion = Array.from(occasionCheckboxes).find(cb => cb.checked);

  if (selectedCategory !== "") {
    // Bloquear Checkboxes
    occasionCheckboxes.forEach(cb => {
      cb.checked = false;
      cb.disabled = true;
      cb.closest('.checkbox-label').classList.add('disabled-label');
    });
    dropdown.classList.remove('disabled');
  } 
  else if (checkedOccasion) {
    // Bloquear los demás Checkboxes
    occasionCheckboxes.forEach(cb => {
      if (cb !== checkedOccasion) {
        cb.checked = false;
        cb.disabled = true;
        cb.closest('.checkbox-label').classList.add('disabled-label');
      }
    });
    // Bloquear Dropdown Personalizado
    hiddenCategoryInput.value = "";
    dropdownSelectedText.innerText = "Ninguna categoría";
    dropdown.classList.add('disabled');
  } 
  else {
    // Liberar todo
    dropdown.classList.remove('disabled');
    occasionCheckboxes.forEach(cb => {
      cb.disabled = false;
      cb.closest('.checkbox-label').classList.remove('disabled-label');
    });
  }
}

// Evento de selección para los ítems del menú redondeado
if (dropdownItems) {
  dropdownItems.forEach(item => {
    item.addEventListener('click', (e) => {
      const value = e.target.getAttribute('data-value');
      const text = e.target.innerText;

      hiddenCategoryInput.value = value;
      dropdownSelectedText.innerText = text;
      dropdown.classList.remove('active');
      
      updateFormLocks();
    });
  });
}

if (occasionCheckboxes) {
  occasionCheckboxes.forEach(cb => {
    cb.addEventListener('change', updateFormLocks);
  });
}

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
    const category = hiddenCategoryInput.value;
    const file = document.getElementById('itemImg').files[0];
    const checkedOccasions = Array.from(document.querySelectorAll('input[name="occasion"]:checked'))
                                  .map(cb => cb.value);

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
        categoria: category || null,
        ocasiones: checkedOccasions,
        imageUrl: url,
        fecha: serverTimestamp()
      });

      status.innerText = "¡Publicado con éxito! 🌹";
      form.reset();
      hiddenCategoryInput.value = "";
      dropdownSelectedText.innerText = "Ninguna categoría";
      updateFormLocks();
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