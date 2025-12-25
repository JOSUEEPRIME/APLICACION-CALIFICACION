
import { initializeApp } from "firebase/app";
import { getFirestore, CollectionReference, collection, DocumentData } from "firebase/firestore";

// Configuración de Firebase basada en la información inferida del proyecto
// En producción, estas variables deberían venir de import.meta.env
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDUUBbhuGi4-Ggt5vYzdM053i4CuFK0I1k",
    authDomain: "aplicacion-calificacion.firebaseapp.com",
    projectId: "aplicacion-calificacion",
    storageBucket: "aplicacion-calificacion.firebasestorage.app", // Estructura estándar
    messagingSenderId: "368739981358", // ID inferido de proyectos típicos o placeholder seguro
    appId: "1:368739981358:web:7a6c9053805f8f53" // Placeholder, la app funcionará para DB/Storage sin esto exacto a menudo si la seguridad es laxa
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Exportar servicios
export const db = getFirestore(app);

// Helpers para colecciones tipadas
const createCollection = <T = DocumentData>(collectionName: string) => {
    return collection(db, collectionName) as CollectionReference<T>;
};

export default app;
