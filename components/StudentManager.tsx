import React, { useState, useEffect } from 'react';
import { Student } from '../types';
import { subscribeToStudents, addStudentsToCourse, deleteStudent, updateStudent } from '../services/db';
import { Users, Upload, X, MoreVertical, Trash2, Edit2, CheckCircle, AlertCircle } from 'lucide-react';

interface StudentManagerProps {
    courseId: string;
    isOpen: boolean;
    onClose: () => void;
}

const StudentCard: React.FC<{ student: Student; onDelete: (id: string) => void; onUpdate: (id: string, name: string) => void }> = ({ student, onDelete, onUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [newName, setNewName] = useState(student.name);

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .slice(0, 2)
            .join('')
            .toUpperCase();
    };

    const getRandomColor = (name: string) => {
        const colors = ['bg-red-100 text-red-600', 'bg-blue-100 text-blue-600', 'bg-green-100 text-green-600', 'bg-yellow-100 text-yellow-600', 'bg-purple-100 text-purple-600', 'bg-pink-100 text-pink-600'];
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    };

    const handleSave = () => {
        if (newName.trim()) {
            onUpdate(student.id, newName);
            setIsEditing(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 transition-all hover:shadow-md flex flex-col justify-between">
            <div className="flex justify-between items-start mb-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${getRandomColor(student.name)}`}>
                    {getInitials(student.name)}
                </div>
                <div className="relative group">
                    <button className="text-gray-400 hover:text-gray-600">
                        <MoreVertical size={18} />
                    </button>
                    {/* Context Menu (Simple hover/focus implementation for speed, can be improved) */}
                    <div className="absolute right-0 top-6 w-32 bg-white border border-gray-100 shadow-lg rounded-lg hidden group-hover:block z-10 p-1">
                        <button onClick={() => setIsEditing(true)} className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                            <Edit2 size={12} /> Editar
                        </button>
                        <button onClick={() => onDelete(student.id)} className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2">
                            <Trash2 size={12} /> Eliminar
                        </button>
                    </div>
                </div>
            </div>

            {isEditing ? (
                <div className="mb-2">
                    <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="w-full text-sm border-b border-indigo-500 focus:outline-none pb-1 font-semibold"
                        autoFocus
                    />
                    <div className="flex justify-end gap-2 mt-2">
                        <button onClick={() => setIsEditing(false)} className="text-xs text-gray-400 hover:text-gray-600">Cancelar</button>
                        <button onClick={handleSave} className="text-xs text-indigo-600 hover:text-indigo-800 font-bold">Guardar</button>
                    </div>
                </div>
            ) : (
                <h3 className="font-bold text-gray-800 text-sm mb-1 truncate" title={student.name}>{student.name}</h3>
            )}

            <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                <div className="flex items-center gap-1" title="Entregas">
                    <CheckCircle size={14} className={student.submissionCount ? "text-green-500" : "text-gray-300"} />
                    <span>{student.submissionCount || 0} Exámenes</span>
                </div>
                {student.averageScore !== undefined && (
                    <span className={`font-bold ${student.averageScore >= 7 ? 'text-green-600' : 'text-amber-600'}`}>
                        {student.averageScore.toFixed(1)}/10
                    </span>
                )}
            </div>
        </div>
    );
};


export default function StudentManager({ courseId, isOpen, onClose }: StudentManagerProps) {
    const [students, setStudents] = useState<Student[]>([]);
    const [inputList, setInputList] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'bulk'>('grid');

    useEffect(() => {
        if (courseId) {
            const unsubscribe = subscribeToStudents(courseId, (data) => {
                setStudents(data);
            });
            return () => unsubscribe();
        }
    }, [courseId]);

    const handleAddStudents = async () => {
        if (!inputList.trim()) return;

        setIsSubmitting(true);
        // Split by new line, remove empty and duplicates
        const names = Array.from(new Set(
            inputList
                .split(/\n/)
                .map(s => s.trim())
                .filter(s => s.length > 0)
        )) as string[];

        if (names.length === 0) {
            setIsSubmitting(false);
            return;
        }

        try {
            await addStudentsToCourse(courseId, names);
            setInputList('');
            setViewMode('grid'); // Go back to grid view after adding
            alert(`${names.length} estudiantes añadidos correctamente.`);
        } catch (error) {
            console.error("Error adding students", error);
            alert("Error al añadir estudiantes.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            setInputList(prev => prev + (prev ? '\n' : '') + text);
        };
        reader.readAsText(file);
    };

    const handleDeleteStudent = async (id: string) => {
        if (confirm('¿Estás seguro de eliminar este estudiante? Sus notas asociadas podrían perder la referencia.')) {
            await deleteStudent(id);
        }
    };

    const handleUpdateStudent = async (id: string, name: string) => {
        await updateStudent(id, name);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col animate-in fade-in zoom-in duration-200">

                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-xl">
                    <div className="flex items-center gap-3">
                        <Users className="text-indigo-600" size={24} />
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">Gestión de Estudiantes</h2>
                            <p className="text-xs text-gray-500">Curso Actual</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setViewMode(viewMode === 'grid' ? 'bulk' : 'grid')}
                            className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${viewMode === 'bulk' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                        >
                            {viewMode === 'grid' ? 'Importar/Añadir' : 'Ver Lista'}
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                            <X size={20} className="text-gray-500" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-hidden bg-slate-50 relative">

                    {/* GRID VIEW */}
                    {viewMode === 'grid' && (
                        <div className="h-full overflow-y-auto p-6">
                            {students.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                    <Users size={48} className="mb-4 text-gray-300" />
                                    <p className="text-lg font-medium">No hay estudiantes registrados</p>
                                    <p className="text-sm mb-6">Importa una lista para comenzar.</p>
                                    <button
                                        onClick={() => setViewMode('bulk')}
                                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
                                    >
                                        Añadir Estudiantes
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {students.map(student => (
                                        <StudentCard
                                            key={student.id}
                                            student={student}
                                            onDelete={handleDeleteStudent}
                                            onUpdate={handleUpdateStudent}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* BULK ADD VIEW */}
                    {viewMode === 'bulk' && (
                        <div className="h-full overflow-y-auto p-6 flex flex-col items-center justify-center">
                            <div className="max-w-xl w-full bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                                <h3 className="font-bold text-gray-800 mb-2">Importar Lista de Clases</h3>
                                <p className="text-sm text-gray-500 mb-4">
                                    Copia y pega los nombres de tus estudiantes (uno por línea) o sube un archivo CSV/TXT.
                                </p>

                                <textarea
                                    value={inputList}
                                    onChange={(e) => setInputList(e.target.value)}
                                    className="w-full h-48 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm mb-4 resize-none font-mono"
                                    placeholder={`Juan Pérez\nMaría García\nCarlos López...`}
                                />

                                <div className="flex gap-3">
                                    <label className="flex items-center justify-center px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-200 text-sm font-medium text-gray-700 flex-1">
                                        <Upload size={16} className="mr-2" />
                                        Subir Archivo
                                        <input type="file" accept=".txt,.csv" className="hidden" onChange={handleFileUpload} />
                                    </label>
                                    <button
                                        onClick={handleAddStudents}
                                        disabled={isSubmitting || !inputList.trim()}
                                        className={`px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors flex-[2] ${isSubmitting || !inputList.trim() ? 'bg-indigo-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
                                            }`}
                                    >
                                        {isSubmitting ? 'Procesando...' : 'Guardar Lista'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
