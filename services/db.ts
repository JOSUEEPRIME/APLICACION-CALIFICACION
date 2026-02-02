
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
import { StudentSubmission, GradingStatus, Course, Student, Subject } from "../types";

// Nombres de colecciones
// Nombres de colecciones
// Nombres de colecciones
const SUBMISSIONS_COLLECTION = "submissions";
const COURSES_COLLECTION = "courses";
const STUDENTS_COLLECTION = "students";
const SUBJECTS_COLLECTION = "subjects";

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
// courseId and subjectId are now required
export const createSubmission = async (submission: { fileName: string; mimeType: string, courseId: string, subjectId: string }, fileData: string) => {
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
            subjectId: submission.subjectId,
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

// Recalcular estadísticas del estudiante (Promedio y Conteo de Entregas)
const recalculateStudentStats = async (studentId: string) => {
    try {
        // 1. Obtener todas las submissions COMPLETED de este estudiante
        const q = query(
            collection(db, SUBMISSIONS_COLLECTION),
            where("matchedStudentId", "==", studentId),
            where("status", "==", GradingStatus.COMPLETED)
        );

        // Usamos getDocs una sola vez para calcular (no necesitamos listener aquí)
        // Import getDocs dynamically or ensure it is imported at the top
        const { getDocs } = await import("firebase/firestore");
        const querySnapshot = await getDocs(q);

        const submissions = querySnapshot.docs.map(doc => doc.data() as StudentSubmission);

        if (submissions.length === 0) {
            // Si no hay submissions, reseteamos a 0
            await updateDoc(doc(db, STUDENTS_COLLECTION, studentId), {
                averageScore: 0,
                submissionCount: 0
            });
            return;
        }

        // 2. Calcular promedio
        const totalScore = submissions.reduce((sum, sub) => sum + (sub.result?.score || 0), 0);
        const averageScore = totalScore / submissions.length;

        // 3. Actualizar documento del estudiante
        await updateDoc(doc(db, STUDENTS_COLLECTION, studentId), {
            averageScore: averageScore,
            submissionCount: submissions.length
        });

    } catch (error) {
        console.error("Error recalculating student stats:", error);
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

    // Si hay un estudiante vinculado, recalculamos sus estadísticas inmediatamente
    if (matchedStudentId) {
        await recalculateStudentStats(matchedStudentId);
    }
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
// Ahora filtramos por SUBJECT ID, ya que es el nivel más específico
export const subscribeToSubmissions = (callback: (data: StudentSubmission[]) => void, subjectId: string | null) => {
    if (!subjectId) {
        callback([]);
        return () => { };
    }
    const q = query(
        collection(db, SUBMISSIONS_COLLECTION),
        where("subjectId", "==", subjectId),
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
                subjectId: data.subjectId,
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

// Update Student
export const updateStudent = async (studentId: string, name: string) => {
    try {
        const docRef = doc(db, STUDENTS_COLLECTION, studentId);
        await updateDoc(docRef, { name: name });
    } catch (error) {
        console.error("Error updating student:", error);
        throw error;
    }
};

// Delete Student
export const deleteStudent = async (studentId: string) => {
    try {
        await deleteDoc(doc(db, STUDENTS_COLLECTION, studentId));
    } catch (error) {
        console.error("Error deleting student:", error);
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

// --- Subject Management ---

export const createSubject = async (name: string, courseId: string) => {
    try {
        const docData = {
            name,
            courseId,
            createdAt: serverTimestamp()
        };
        const docRef = await addDoc(collection(db, SUBJECTS_COLLECTION), docData);
        return { id: docRef.id, ...docData };
    } catch (error) {
        console.error("Error creating subject:", error);
        throw error;
    }
};

export const subscribeToSubjects = (courseId: string, callback: (data: Subject[]) => void) => {
    const q = query(
        collection(db, SUBJECTS_COLLECTION),
        where("courseId", "==", courseId),
        orderBy("createdAt", "asc")
    );
    return onSnapshot(q, (snapshot) => {
        const subjects = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as Subject[];
        callback(subjects);
    });
};
