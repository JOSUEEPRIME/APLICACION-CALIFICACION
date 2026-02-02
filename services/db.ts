
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
    where,
    writeBatch
} from "firebase/firestore";
import { StudentSubmission, GradingStatus, Course, Student } from "../types";

// Nombres de colecciones
// Nombres de colecciones
const SUBMISSIONS_COLLECTION = "submissions";
const COURSES_COLLECTION = "courses";
const STUDENTS_COLLECTION = "students";

// Interfaz para guardar en BD
export interface DBSubmission extends Omit<StudentSubmission, 'id'> {
    id?: string;
    createdAt: any;
    updatedAt: any;
}

export interface DBCourse extends Omit<Course, 'id'> {
    createdAt: any;
}

export interface DBStudent extends Omit<Student, 'id'> {
    createdAt: any;
}

// Crear nueva entrega (Ahora guarda el base64 directamente en Firestore)
// courseId is now required
export const createSubmission = async (submission: { fileName: string; mimeType: string, courseId: string }, fileData: string) => {
    try {
        // IMPORTANTE: Guardamos el base64 directamente en el documento. 
        // Esto es lo que el usuario pidió ("solo usamos firestore").
        // Advertencia: Docs limitados a 1MB.

        const docData = {
            fileName: submission.fileName,
            mimeType: submission.mimeType,
            fileData: fileData, // <--- Base64 guardado aquí
            status: GradingStatus.PENDING,
            courseId: submission.courseId,
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
export const updateSubmissionResult = async (id: string, result: any, status: GradingStatus, matchedStudentId?: string) => {
    const docRef = doc(db, SUBMISSIONS_COLLECTION, id);
    const updateData: any = {
        result: result,
        status: status,
        updatedAt: serverTimestamp()
    };
    if (matchedStudentId !== undefined) {
        updateData.matchedStudentId = matchedStudentId;
    }
    await updateDoc(docRef, updateData);
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
export const subscribeToSubmissions = (callback: (data: StudentSubmission[]) => void, courseId: string | null) => {
    if (!courseId) {
        callback([]);
        return () => { };
    }
    const q = query(
        collection(db, SUBMISSIONS_COLLECTION),
        where("courseId", "==", courseId),
        orderBy("createdAt", "desc")
    );

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
                error: data.error,
                courseId: data.courseId,
                matchedStudentId: data.matchedStudentId
            } as StudentSubmission;
        });
        callback(submissions);
    });
};

// --- Course Management ---

export const createCourse = async (name: string, description?: string) => {
    try {
        const docData = {
            name,
            description: description || '',
            createdAt: serverTimestamp()
        };
        const docRef = await addDoc(collection(db, COURSES_COLLECTION), docData);
        return { id: docRef.id, ...docData };
    } catch (error) {
        console.error("Error creating course:", error);
        throw error;
    }
};

export const subscribeToCourses = (callback: (data: Course[]) => void) => {
    const q = query(collection(db, COURSES_COLLECTION), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snapshot) => {
        const courses = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as Course[];
        callback(courses);
    });
};

// --- Student Management ---

export const addStudentsToCourse = async (courseId: string, studentNames: string[]) => {
    const batch = writeBatch(db);
    const studentsRef = collection(db, STUDENTS_COLLECTION);

    studentNames.forEach(name => {
        if (!name.trim()) return;
        const newStudentRef = doc(studentsRef); // Auto-generated ID
        batch.set(newStudentRef, {
            name: name.trim(),
            courseId: courseId,
            createdAt: serverTimestamp()
        });
    });

    try {
        await batch.commit();
    } catch (error) {
        console.error("Error batch adding students:", error);
        throw error;
    }
};

export const subscribeToStudents = (courseId: string, callback: (data: Student[]) => void) => {
    const q = query(collection(db, STUDENTS_COLLECTION), where("courseId", "==", courseId), orderBy("name", "asc"));
    return onSnapshot(q, (snapshot) => {
        const students = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as Student[];
        callback(students);
    });
};
