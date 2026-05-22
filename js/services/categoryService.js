import { db } from '../config.js';
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

export async function addCategory(nombre) {
    // Validamos que el nombre no esté vacío antes de enviar
    if (!nombre || nombre.trim() === "") throw new Error("El nombre de la categoría es obligatorio");

    return await addDoc(collection(db, "categorias"), {
        nombre: nombre.trim(),
        activo: true,
        fecha: serverTimestamp()
    });
}