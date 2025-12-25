
import { db } from "./firebaseConfig";
import {
    collection,
    addDoc,
    updateDoc,
    doc,
    onSnapshot,
    query,
    orderBy,
    serverTimestamp,
    deleteDoc,
} from "firebase/firestore";
import { StudentSubmission, GradingStatus } from "../types";

// Nombres de colecciones
const SUBMISSIONS_COLLECTION = "submissions";

// Interfaz para guardar en BD
export interface DBSubmission extends Omit<StudentSubmission, 'id'> {
    id?: string;
    createdAt: any;
    updatedAt: any;
}

// Crear nueva entrega (Ahora guarda el base64 directamente en Firestore)
export const createSubmission = async (submission: { fileName: string; mimeType: string }, fileData: string) => {
    try {
        // IMPORTANTE: Guardamos el base64 directamente en el documento. 
        // Esto es lo que el usuario pidió ("solo usamos firestore").
        // Advertencia: Docs limitados a 1MB.

        const docData = {
            fileName: submission.fileName,
            mimeType: submission.mimeType,
            fileData: fileData, // <--- Base64 guardado aquí
            status: GradingStatus.PENDING,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        const docRef = await addDoc(collection(db, SUBMISSIONS_COLLECTION), docData);
        return { id: docRef.id, ...docData };
    } catch (error) {
        console.error("Error creating submission:", error);
        throw error;
    }
};

// Actualizar resultado de calificación
export const updateSubmissionResult = async (id: string, result: any, status: GradingStatus) => {
    const docRef = doc(db, SUBMISSIONS_COLLECTION, id);
    await updateDoc(docRef, {
        result: result,
        status: status,
        updatedAt: serverTimestamp()
    });
};

// Eliminar entrega
export const deleteSubmission = async (id: string) => {
    try {
        await deleteDoc(doc(db, SUBMISSIONS_COLLECTION, id));
    } catch (error) {
        console.error("Error deleting submission:", error);
        throw error;
    }
};

// Hook/Función para suscribirse a cambios en tiempo real
export const subscribeToSubmissions = (callback: (data: StudentSubmission[]) => void) => {
    const q = query(collection(db, SUBMISSIONS_COLLECTION), orderBy("createdAt", "desc"));

    return onSnapshot(q, (snapshot) => {
        const submissions: StudentSubmission[] = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                fileName: data.fileName,
                fileData: data.fileData, // Mapeamos directo del campo del documento
                mimeType: data.mimeType,
                status: data.status,
                result: data.result,
                error: data.error
            } as StudentSubmission;
        });
        callback(submissions);
    });
};
