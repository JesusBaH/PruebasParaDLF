import { auth } from './config.js';
import { signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

onAuthStateChanged(auth, (user) => {
  if (user) window.location.href = 'dashboard.html';
});

const toggleBtn = document.getElementById('togglePassword');
const passInput = document.getElementById('loginPassword');

if (toggleBtn && passInput) {
  toggleBtn.addEventListener('click', () => {
    const type = passInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passInput.setAttribute('type', type);
    toggleBtn.classList.toggle('fa-eye');
    toggleBtn.classList.toggle('fa-eye-slash');
  });
}

const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const pass = document.getElementById('loginPassword').value;
    const status = document.getElementById('loginStatus');

    try {
      status.innerText = "Ingresando...";
      await signInWithEmailAndPassword(auth, email, pass);
      window.location.href = 'dashboard.html';
    } catch (error) {
      status.innerText = "ACCESSO DENEGADO";
      console.error(error);
    }
  });
}