import { db, storage } from './config.js';
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";
import { collection, addDoc, serverTimestamp, doc, updateDoc, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { processToJpg } from './converter.js';
import { logout } from './services/authService.js';
import { protectRoute } from './services/authGuard.js';

protectRoute();

const INACTIVITY_TIME = 15 * 60 * 1000;
let inactivityTimeout;

function resetInactivityTimer() {
  clearTimeout(inactivityTimeout);
  inactivityTimeout = setTimeout(async () => {
    await logout();
    window.location.href = 'index.html';
  }, INACTIVITY_TIME);
}

['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(evt => {
  document.addEventListener(evt, resetInactivityTimer, { passive: true });
});
resetInactivityTimer();

function updateExclusiveLogic() {
  const categoryVal = document.getElementById('itemCategory').value;
  const selectedOccasion = document.querySelector('input[name="occasion"]:checked');
  const occasionsContainer = document.querySelector('.occasions-sect');
  const categoryDropdown = document.getElementById('categoryDropdown');
  
  if (categoryVal && categoryVal !== "") {
    occasionsContainer.classList.add('disabled-group');
  } else {
    occasionsContainer.classList.remove('disabled-group');
  }
  
  if (selectedOccasion) {
    categoryDropdown.classList.add('disabled-group');
  } else {
    categoryDropdown.classList.remove('disabled-group');
  }
}

function renderTable(containerId, data, collectionName) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = data.map(doc => `
    <tr>
      <td>${doc.nombre}</td>
      <td>
        <span class="status-badge ${doc.activo ? 'active' : 'inactive'}" 
              onclick="toggleStatus('${collectionName}', '${doc.id}', ${doc.activo})">
          ${doc.activo ? 'Activa' : 'Inactiva'}
        </span>
      </td>
      <td class="actions-cell">
        <button class="btn-action btn-delete" onclick="deleteItem('${collectionName}', '${doc.id}')">
          <i class="fa-solid fa-trash"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

onSnapshot(query(collection(db, "categorias"), orderBy("fecha", "desc")), (snapshot) => {
  const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  renderTable('categoriesTableBody', data, 'categorias');
  
  const dropdownMenu = document.getElementById('dropdownMenuCategories');
  if (dropdownMenu) {
    dropdownMenu.innerHTML = `<li class="dropdown-item" data-value="">Ninguna categoría</li>` + 
      snapshot.docs.filter(doc => doc.data().activo)
      .map(doc => `<li class="dropdown-item" data-value="${doc.id}">${doc.data().nombre}</li>`).join('');

    document.querySelectorAll('.dropdown-item').forEach(item => {
      item.onclick = () => {
        document.getElementById('itemCategory').value = item.getAttribute('data-value');
        document.getElementById('dropdownSelectedText').innerText = item.innerText;
        document.getElementById('dropdownMenuCategories').classList.remove('show');
        updateExclusiveLogic();
      };
    });
  }
});

onSnapshot(query(collection(db, "ocasiones"), orderBy("fecha", "desc")), (snapshot) => {
  const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  renderTable('occasionsTableBody', data, 'ocasiones');
  
  const grid = document.getElementById('checkboxGridOccasions');
  if (grid) {
    grid.innerHTML = snapshot.docs.filter(doc => doc.data().activo).map(doc => `
      <label class="checkbox-item">
        <input type="radio" name="occasion" value="${doc.id}">
        <span>${doc.data().nombre}</span>
      </label>
    `).join('');
    
    document.querySelectorAll('input[name="occasion"]').forEach(cb => {
      cb.addEventListener('click', function() {
        if (this.dataset.waschecked === 'true') {
          this.checked = false;
          this.dataset.waschecked = 'false';
        } else {
          document.querySelectorAll('input[name="occasion"]').forEach(i => i.dataset.waschecked = 'false');
          this.dataset.waschecked = 'true';
        }
        updateExclusiveLogic();
      });
    });
  }
});

const trigger = document.querySelector('.dropdown-trigger');
if (trigger) {
  trigger.onclick = () => document.getElementById('dropdownMenuCategories').classList.toggle('show');
}

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
  removeImageBtn.addEventListener('click', clearImagePreview);
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
        categoria: document.getElementById('itemCategory').value,
        ocasiones: document.querySelector('input[name="occasion"]:checked')?.value || null,
        fecha: serverTimestamp()
      });
      status.innerText = "¡Publicado con éxito! 🌹";
      form.reset();
      clearImagePreview();
      updateExclusiveLogic();
    } catch (error) {
      status.innerText = "Error: " + error.message;
    } finally {
      btn.disabled = false;
    }
  });
}

const categoryForm = document.getElementById('categoryForm');
if (categoryForm) {
  categoryForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = document.getElementById('newCategoryName');
    await addDoc(collection(db, "categorias"), { nombre: input.value, activo: true, fecha: serverTimestamp() });
    categoryForm.reset();
  });
}

const occasionForm = document.getElementById('occasionForm');
if (occasionForm) {
  occasionForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = document.getElementById('newOccasionName');
    await addDoc(collection(db, "ocasiones"), { nombre: input.value, activo: true, fecha: serverTimestamp() });
    occasionForm.reset();
  });
}

window.toggleStatus = async (colName, id, status) => {
  await updateDoc(doc(db, colName, id), { activo: !status });
};

const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    await logout();
    window.location.href = 'index.html';
  });
}